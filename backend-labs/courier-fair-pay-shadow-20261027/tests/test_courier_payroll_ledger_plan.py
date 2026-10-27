from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.schemas.courier_settlement import CourierSettlementIntent
from app.services.courier_payroll_ledger_plan import (
    CourierPayrollSystemAccounts,
    build_courier_payroll_ledger_plan,
)


FIXTURE = Path(__file__).parent / "fixtures" / "delish_orchidpay_fixture.json"


def fixture_intent(**changes):
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))["intent"]
    payload.update(changes)
    return CourierSettlementIntent.model_validate(payload)


ACCOUNTS = CourierPayrollSystemAccounts(
    gross_clearing_account_id="system-gross",
    tip_clearing_account_id="system-tips",
    expense_clearing_account_id="system-expense",
)


class CourierPayrollLedgerPlanTests(unittest.TestCase):
    def test_real_delish_fixture_builds_three_balanced_transactions(self):
        intent = fixture_intent()
        plan = build_courier_payroll_ledger_plan(
            intent,
            courier_party_id="party-courier-1",
            courier_payable_account_id="account-courier-payable-1",
            system_accounts=ACCOUNTS,
        )

        self.assertFalse(plan.production_execution)
        self.assertEqual(plan.total_planned_minor, intent.total_cash_due_minor)
        self.assertEqual(
            [tx.component for tx in plan.transactions],
            ["gross", "tips", "expense"],
        )
        self.assertEqual(
            [tx.amount_minor for tx in plan.transactions],
            [
                intent.gross_pay_due_minor,
                intent.tips_minor,
                intent.expense_reimbursements_minor,
            ],
        )

        for tx in plan.transactions:
            self.assertFalse(tx.execution_allowed)
            self.assertEqual(tx.entries[0].direction, "DEBIT")
            self.assertEqual(tx.entries[1].direction, "CREDIT")
            self.assertEqual(tx.entries[0].amount_minor, tx.entries[1].amount_minor)
            self.assertEqual(
                tx.idempotency_key,
                f"courier_payroll:{intent.statement_id}:{tx.component}",
            )
            self.assertEqual(tx.external_id, intent.statement_id)
            self.assertEqual(tx.metadata["policy_hash"], intent.policy_hash)
            self.assertEqual(tx.metadata["facts_hash"], intent.facts_hash)

    def test_zero_tip_and_expense_skip_zero_ledger_transactions(self):
        intent = fixture_intent(
            tips_minor=0,
            expense_reimbursements_minor=0,
            total_cash_due_minor=1900,
        )
        plan = build_courier_payroll_ledger_plan(
            intent,
            courier_party_id="party-courier-1",
            courier_payable_account_id="account-courier-payable-1",
            system_accounts=ACCOUNTS,
        )
        self.assertEqual(len(plan.transactions), 1)
        self.assertEqual(plan.transactions[0].component, "gross")
        self.assertEqual(plan.total_planned_minor, 1900)

    def test_plan_is_deterministic_for_same_economic_intent(self):
        intent = fixture_intent()
        first = build_courier_payroll_ledger_plan(
            intent,
            courier_party_id="party-courier-1",
            courier_payable_account_id="account-courier-payable-1",
            system_accounts=ACCOUNTS,
        )
        second = build_courier_payroll_ledger_plan(
            intent,
            courier_party_id="party-courier-1",
            courier_payable_account_id="account-courier-payable-1",
            system_accounts=ACCOUNTS,
        )
        self.assertEqual(first, second)

    def test_plan_refuses_missing_financial_mapping(self):
        with self.assertRaises(ValueError):
            build_courier_payroll_ledger_plan(
                fixture_intent(),
                courier_party_id="",
                courier_payable_account_id="account-courier-payable-1",
                system_accounts=ACCOUNTS,
            )


if __name__ == "__main__":
    unittest.main()
