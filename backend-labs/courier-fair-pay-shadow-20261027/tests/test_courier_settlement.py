from __future__ import annotations

import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from pydantic import ValidationError

from app.schemas.courier_settlement import CourierSettlementIntent
from app.services.courier_settlement_service import (
    CourierSettlementConflict,
    CourierSettlementIntegrityError,
    CourierSettlementShadowService,
    ShadowCourierSettlementIntentStore,
)


def valid_intent(**overrides):
    payload = {
        "statement_id": "a" * 64,
        "courier_id": "courier-be-001",
        "week_key": "2026-W44",
        "country_code": "be",
        "currency": "eur",
        "policy_id": "BE-EMPLOYEE-POG-FAIR-PAY-LAB-v0.1",
        "policy_hash": "b" * 64,
        "facts_hash": "c" * 64,
        "policy_validation_status": "DRAFT",
        "production_eligible": False,
        "eligible_income_minor": 9000,
        "governing_floor_minor": 9500,
        "differential_due_minor": 500,
        "gross_pay_due_minor": 9500,
        "tips_minor": 1200,
        "expense_reimbursements_minor": 800,
        "total_cash_due_minor": 11500,
        "generated_at": datetime(2026, 10, 27, 12, 0, tzinfo=timezone.utc),
        "evidence_refs": [
            "statement:a",
            "policy:b",
            "facts:c",
            "statement:a",
        ],
        "warnings": ["COUNTRY_POLICY_NOT_LEGALLY_GREEN"],
    }
    payload.update(overrides)
    return CourierSettlementIntent.model_validate(payload)


class CourierSettlementShadowTests(unittest.TestCase):
    def test_contract_normalizes_and_validates_totals(self):
        intent = valid_intent()
        self.assertEqual(intent.country_code, "BE")
        self.assertEqual(intent.currency, "EUR")
        self.assertEqual(
            intent.evidence_refs,
            ["facts:c", "policy:b", "statement:a"],
        )
        self.assertEqual(intent.total_cash_due_minor, 11500)

    def test_total_mismatch_is_rejected(self):
        with self.assertRaises(ValidationError):
            valid_intent(total_cash_due_minor=11499)

    def test_append_is_idempotent_but_same_statement_mutation_conflicts(self):
        with tempfile.TemporaryDirectory() as root:
            service = CourierSettlementShadowService(
                ShadowCourierSettlementIntentStore(root)
            )
            first = service.accept(valid_intent())
            replay = service.accept(valid_intent())
            timestamp_retry = service.accept(
                valid_intent(
                    generated_at=datetime(
                        2026, 10, 27, 12, 5, tzinfo=timezone.utc
                    )
                )
            )
            self.assertFalse(first.idempotent_replay)
            self.assertTrue(replay.idempotent_replay)
            self.assertTrue(timestamp_retry.idempotent_replay)
            self.assertEqual(first.intent_hash, replay.intent_hash)
            self.assertEqual(first.intent_hash, timestamp_retry.intent_hash)

            changed = valid_intent(
                eligible_income_minor=8900,
                differential_due_minor=600,
            )
            with self.assertRaises(CourierSettlementConflict):
                service.accept(changed)

    def test_store_survives_restart_and_outbox_is_preview_only(self):
        with tempfile.TemporaryDirectory() as root:
            first = CourierSettlementShadowService(
                ShadowCourierSettlementIntentStore(root)
            )
            receipt = first.accept(valid_intent())

            second = CourierSettlementShadowService(
                ShadowCourierSettlementIntentStore(root)
            )
            stored = second.get(receipt.statement_id)
            self.assertIsNotNone(stored)
            event = second.outbox_preview(receipt.statement_id)
            self.assertEqual(
                event["topic"],
                "courier.payroll.settlement.shadow",
            )
            self.assertFalse(event["payload"]["production_execution"])
            self.assertEqual(
                event["payload"]["intent_hash"],
                receipt.intent_hash,
            )

    def test_store_permissions_are_private(self):
        with tempfile.TemporaryDirectory() as root:
            nested = Path(root) / "shadow"
            ShadowCourierSettlementIntentStore(str(nested))
            self.assertEqual(os.stat(nested).st_mode & 0o777, 0o700)
            self.assertEqual(
                os.stat(nested / "settlement-intents.ndjson").st_mode & 0o777,
                0o600,
            )

    def test_tampering_is_detected_on_restart(self):
        with tempfile.TemporaryDirectory() as root:
            store = ShadowCourierSettlementIntentStore(root)
            service = CourierSettlementShadowService(store)
            service.accept(valid_intent())
            file_path = Path(root) / "settlement-intents.ndjson"
            line = json.loads(file_path.read_text(encoding="utf-8").strip())
            line["intent"]["gross_pay_due_minor"] = 9999
            file_path.write_text(
                json.dumps(line, separators=(",", ":")) + "\n",
                encoding="utf-8",
            )
            with self.assertRaises(CourierSettlementIntegrityError):
                ShadowCourierSettlementIntentStore(root)


if __name__ == "__main__":
    unittest.main()

class CourierSettlementHttpTests(unittest.TestCase):
    def test_http_consumer_is_internal_shadow_only_and_idempotent(self):
        from unittest.mock import patch
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from app.api.courier_payroll_settlement import router

        with tempfile.TemporaryDirectory() as root:
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            payload = valid_intent().model_dump(mode="json")
            env = {
                "INTERNAL_API_KEY": "test-internal-key",
                "ORCHIDPAY_COURIER_PAYROLL_SHADOW_ENABLED": "true",
                "ORCHIDPAY_COURIER_PAYROLL_SHADOW_DIR": root,
            }
            with patch.dict(os.environ, env, clear=False):
                unauthorized = client.post(
                    "/payroll/courier/settlement-intents",
                    json=payload,
                )
                self.assertEqual(unauthorized.status_code, 401)

                headers = {"X-Internal-Key": "test-internal-key"}
                first = client.post(
                    "/payroll/courier/settlement-intents",
                    headers=headers,
                    json=payload,
                )
                self.assertEqual(first.status_code, 200)
                self.assertFalse(first.json()["idempotent_replay"])
                self.assertFalse(first.json()["production_execution"])

                replay = client.post(
                    "/payroll/courier/settlement-intents",
                    headers=headers,
                    json=payload,
                )
                self.assertEqual(replay.status_code, 200)
                self.assertTrue(replay.json()["idempotent_replay"])

                fetched = client.get(
                    f"/payroll/courier/settlement-intents/{payload['statement_id']}",
                    headers=headers,
                )
                self.assertEqual(fetched.status_code, 200)
                self.assertFalse(fetched.json()["production_execution"])

                preview = client.get(
                    f"/payroll/courier/settlement-intents/{payload['statement_id']}/outbox-preview",
                    headers=headers,
                )
                self.assertEqual(preview.status_code, 200)
                self.assertFalse(preview.json()["published"])
                self.assertFalse(preview.json()["production_execution"])

    def test_http_consumer_is_disabled_by_default(self):
        from unittest.mock import patch
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from app.api.courier_payroll_settlement import router

        app = FastAPI()
        app.include_router(router)
        client = TestClient(app)
        with patch.dict(
            os.environ,
            {
                "INTERNAL_API_KEY": "test-internal-key",
                "ORCHIDPAY_COURIER_PAYROLL_SHADOW_ENABLED": "false",
            },
            clear=False,
        ):
            response = client.post(
                "/payroll/courier/settlement-intents",
                headers={"X-Internal-Key": "test-internal-key"},
                json=valid_intent().model_dump(mode="json"),
            )
            self.assertEqual(response.status_code, 403)
            self.assertEqual(
                response.json()["detail"],
                "ORCHIDPAY_COURIER_PAYROLL_SHADOW_DISABLED",
            )

    def test_real_delish_typescript_fixture_is_accepted(self):
        fixture_path = Path(__file__).parent / "fixtures" / "delish_orchidpay_fixture.json"
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        intent = CourierSettlementIntent.model_validate(payload["intent"])
        statement = payload["statement"]

        self.assertEqual(intent.statement_id, statement["statementId"])
        self.assertEqual(intent.policy_hash, statement["policyHash"])
        self.assertEqual(intent.facts_hash, statement["factsHash"])
        self.assertEqual(intent.total_cash_due_minor, 2700)
        self.assertFalse(intent.production_eligible)

        with tempfile.TemporaryDirectory() as root:
            service = CourierSettlementShadowService(
                ShadowCourierSettlementIntentStore(root)
            )
            receipt = service.accept(intent)
            self.assertEqual(receipt.statement_id, statement["statementId"])
            self.assertFalse(receipt.production_execution)
