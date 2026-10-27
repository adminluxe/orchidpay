from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.schemas.courier_settlement import (
    CourierSettlementIntent,
    CourierSettlementReceipt,
)


class CourierSettlementConflict(RuntimeError):
    pass


class CourierSettlementIntegrityError(RuntimeError):
    pass


def canonical_intent_json(intent: CourierSettlementIntent) -> str:
    payload = intent.model_dump(mode="json")
    # Transport/envelope time may legitimately differ across retries of the same
    # immutable weekly statement. It must not create a false economic conflict.
    payload.pop("generated_at", None)
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def intent_hash(intent: CourierSettlementIntent) -> str:
    return hashlib.sha256(canonical_intent_json(intent).encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class StoredSettlementIntent:
    statement_id: str
    intent_hash: str
    intent: dict[str, Any]
    status: str


class ShadowCourierSettlementIntentStore:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir).expanduser().resolve()
        self.root_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(self.root_dir, 0o700)
        self.file_path = self.root_dir / "settlement-intents.ndjson"
        if not self.file_path.exists():
            fd = os.open(self.file_path, os.O_CREAT | os.O_WRONLY, 0o600)
            os.close(fd)
        os.chmod(self.file_path, 0o600)
        self._records: dict[str, StoredSettlementIntent] = {}
        self._load()

    def _load(self) -> None:
        raw = self.file_path.read_text(encoding="utf-8")
        if not raw.strip():
            return
        for index, line in enumerate(raw.splitlines(), start=1):
            try:
                parsed = json.loads(line)
                intent = CourierSettlementIntent.model_validate(parsed["intent"])
                stored_hash = str(parsed["intent_hash"])
                statement_id = str(parsed["statement_id"])
                status = str(parsed["status"])
            except Exception as exc:
                raise CourierSettlementIntegrityError(
                    f"CORRUPT_SETTLEMENT_INTENT_LINE:{index}"
                ) from exc

            computed = intent_hash(intent)
            if (
                statement_id != intent.statement_id
                or stored_hash != computed
                or status != "SHADOW_RECEIVED"
            ):
                raise CourierSettlementIntegrityError(
                    f"SETTLEMENT_INTENT_INTEGRITY:{index}"
                )
            if statement_id in self._records:
                raise CourierSettlementIntegrityError(
                    f"DUPLICATE_SETTLEMENT_INTENT:{statement_id}"
                )
            self._records[statement_id] = StoredSettlementIntent(
                statement_id=statement_id,
                intent_hash=stored_hash,
                intent=intent.model_dump(mode="json"),
                status=status,
            )

    def append(
        self,
        intent: CourierSettlementIntent,
    ) -> tuple[StoredSettlementIntent, bool]:
        digest = intent_hash(intent)
        existing = self._records.get(intent.statement_id)
        if existing:
            if existing.intent_hash != digest:
                raise CourierSettlementConflict(
                    "ORCHIDPAY_COURIER_SETTLEMENT_STATEMENT_CONFLICT"
                )
            return existing, True

        stored = StoredSettlementIntent(
            statement_id=intent.statement_id,
            intent_hash=digest,
            intent=intent.model_dump(mode="json"),
            status="SHADOW_RECEIVED",
        )
        line = json.dumps(
            {
                "statement_id": stored.statement_id,
                "intent_hash": stored.intent_hash,
                "status": stored.status,
                "intent": stored.intent,
            },
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        )
        descriptor = os.open(self.file_path, os.O_APPEND | os.O_WRONLY)
        try:
            os.write(descriptor, (line + "\n").encode("utf-8"))
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        os.chmod(self.file_path, 0o600)
        self._records[stored.statement_id] = stored
        return stored, False

    def get(self, statement_id: str) -> StoredSettlementIntent | None:
        return self._records.get(str(statement_id).strip())


class CourierSettlementShadowService:
    def __init__(self, store: ShadowCourierSettlementIntentStore):
        self.store = store

    def accept(self, intent: CourierSettlementIntent) -> CourierSettlementReceipt:
        stored, replay = self.store.append(intent)
        return CourierSettlementReceipt(
            statement_id=stored.statement_id,
            intent_hash=stored.intent_hash,
            idempotent_replay=replay,
        )

    def get(self, statement_id: str) -> StoredSettlementIntent | None:
        return self.store.get(statement_id)

    def outbox_preview(self, statement_id: str) -> dict[str, Any]:
        stored = self.store.get(statement_id)
        if not stored:
            raise KeyError("ORCHIDPAY_COURIER_SETTLEMENT_NOT_FOUND")
        event_id = hashlib.sha256(
            f"courier-payroll-shadow:{statement_id}".encode("utf-8")
        ).hexdigest()
        return {
            "id": event_id,
            "topic": "courier.payroll.settlement.shadow",
            "event_type": "CourierPayrollSettlementIntentShadowReceived",
            "event_key": statement_id,
            "payload": {
                "statement_id": statement_id,
                "intent_hash": stored.intent_hash,
                "status": stored.status,
                "production_execution": False,
            },
        }
