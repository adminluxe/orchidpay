from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.schemas.courier_settlement import CourierSettlementIntent


@dataclass(frozen=True)
class LedgerPlanEntry:
    account_id: str
    direction: str
    amount_minor: int
    currency: str


@dataclass(frozen=True)
class LedgerPlanTx:
    component: str
    idempotency_key: str
    external_type: str
    external_id: str
    amount_minor: int
    currency: str
    entries: tuple[LedgerPlanEntry, LedgerPlanEntry]
    metadata: dict[str, Any]
    execution_allowed: bool = False


@dataclass(frozen=True)
class CourierPayrollLedgerPlan:
    statement_id: str
    courier_party_id: str
    courier_payable_account_id: str
    transactions: tuple[LedgerPlanTx, ...]
    total_planned_minor: int
    production_execution: bool = False


@dataclass(frozen=True)
class CourierPayrollSystemAccounts:
    gross_clearing_account_id: str
    tip_clearing_account_id: str
    expense_clearing_account_id: str


def _required(value: str, field: str) -> str:
    clean = str(value or "").strip()
    if not clean:
        raise ValueError(f"ORCHIDPAY_COURIER_LEDGER_{field.upper()}_REQUIRED")
    return clean


def _tx(
    *,
    intent: CourierSettlementIntent,
    component: str,
    amount_minor: int,
    debit_account_id: str,
    courier_payable_account_id: str,
) -> LedgerPlanTx | None:
    if amount_minor < 0:
        raise ValueError("ORCHIDPAY_COURIER_LEDGER_NEGATIVE_AMOUNT")
    if amount_minor == 0:
        return None
    debit = _required(debit_account_id, f"{component}_debit_account")
    credit = _required(courier_payable_account_id, "courier_payable_account")
    metadata = {
        "source_system": intent.source_system,
        "schema_version": intent.schema_version,
        "statement_id": intent.statement_id,
        "policy_id": intent.policy_id,
        "policy_hash": intent.policy_hash,
        "facts_hash": intent.facts_hash,
        "courier_id": intent.courier_id,
        "week_key": intent.week_key,
        "country_code": intent.country_code,
        "component": component,
        "policy_validation_status": intent.policy_validation_status,
        "production_eligible": intent.production_eligible,
    }
    external_type = f"courier_payroll_statement_{component}"
    return LedgerPlanTx(
        component=component,
        idempotency_key=f"courier_payroll:{intent.statement_id}:{component}",
        external_type=external_type,
        external_id=intent.statement_id,
        amount_minor=amount_minor,
        currency=intent.currency,
        entries=(
            LedgerPlanEntry(
                account_id=debit,
                direction="DEBIT",
                amount_minor=amount_minor,
                currency=intent.currency,
            ),
            LedgerPlanEntry(
                account_id=credit,
                direction="CREDIT",
                amount_minor=amount_minor,
                currency=intent.currency,
            ),
        ),
        metadata=metadata,
        execution_allowed=False,
    )


def build_courier_payroll_ledger_plan(
    intent: CourierSettlementIntent,
    *,
    courier_party_id: str,
    courier_payable_account_id: str,
    system_accounts: CourierPayrollSystemAccounts,
) -> CourierPayrollLedgerPlan:
    """Builds an auditable plan only. This function cannot post ledger entries."""
    party_id = _required(courier_party_id, "courier_party_id")
    payable = _required(
        courier_payable_account_id,
        "courier_payable_account_id",
    )

    if intent.mode != "SHADOW":
        raise ValueError("ORCHIDPAY_COURIER_LEDGER_SHADOW_ONLY")

    candidates = [
        _tx(
            intent=intent,
            component="gross",
            amount_minor=intent.gross_pay_due_minor,
            debit_account_id=system_accounts.gross_clearing_account_id,
            courier_payable_account_id=payable,
        ),
        _tx(
            intent=intent,
            component="tips",
            amount_minor=intent.tips_minor,
            debit_account_id=system_accounts.tip_clearing_account_id,
            courier_payable_account_id=payable,
        ),
        _tx(
            intent=intent,
            component="expense",
            amount_minor=intent.expense_reimbursements_minor,
            debit_account_id=system_accounts.expense_clearing_account_id,
            courier_payable_account_id=payable,
        ),
    ]
    transactions = tuple(tx for tx in candidates if tx is not None)

    total = sum(tx.amount_minor for tx in transactions)
    if total != intent.total_cash_due_minor:
        raise ValueError("ORCHIDPAY_COURIER_LEDGER_TOTAL_MISMATCH")

    for tx in transactions:
        debit = sum(
            entry.amount_minor
            for entry in tx.entries
            if entry.direction == "DEBIT"
        )
        credit = sum(
            entry.amount_minor
            for entry in tx.entries
            if entry.direction == "CREDIT"
        )
        if debit != credit or debit != tx.amount_minor:
            raise ValueError("ORCHIDPAY_COURIER_LEDGER_UNBALANCED_PLAN")
        if any(entry.currency != intent.currency for entry in tx.entries):
            raise ValueError("ORCHIDPAY_COURIER_LEDGER_CURRENCY_MISMATCH")

    return CourierPayrollLedgerPlan(
        statement_id=intent.statement_id,
        courier_party_id=party_id,
        courier_payable_account_id=payable,
        transactions=transactions,
        total_planned_minor=total,
        production_execution=False,
    )
