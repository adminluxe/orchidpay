from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

HEX64 = re.compile(r"^[0-9a-f]{64}$")
WEEK_KEY = re.compile(r"^\d{4}-W\d{2}$")


class CourierSettlementIntent(BaseModel):
    schema_version: Literal["ORCHIDPAY_COURIER_SETTLEMENT_INTENT_V0.1"] = (
        "ORCHIDPAY_COURIER_SETTLEMENT_INTENT_V0.1"
    )
    mode: Literal["SHADOW"] = "SHADOW"
    source_system: Literal["DELISHAFRICA_COURIER_FAIR_PAY"] = (
        "DELISHAFRICA_COURIER_FAIR_PAY"
    )

    statement_id: str
    courier_id: str
    week_key: str
    country_code: str
    currency: str

    policy_id: str
    policy_hash: str
    facts_hash: str
    policy_validation_status: Literal["DRAFT", "LEGAL_REVIEW", "GREEN"]
    production_eligible: bool = False

    eligible_income_minor: int = Field(ge=0)
    governing_floor_minor: int = Field(ge=0)
    differential_due_minor: int = Field(ge=0)
    gross_pay_due_minor: int = Field(ge=0)
    tips_minor: int = Field(ge=0)
    expense_reimbursements_minor: int = Field(ge=0)
    total_cash_due_minor: int = Field(ge=0)

    generated_at: datetime
    evidence_refs: list[str] = Field(min_length=1)
    warnings: list[str] = Field(default_factory=list)

    @field_validator("statement_id", "policy_hash", "facts_hash")
    @classmethod
    def validate_hash(cls, value: str) -> str:
        clean = str(value).strip().lower()
        if not HEX64.fullmatch(clean):
            raise ValueError("expected 64-char lowercase SHA-256 hex")
        return clean

    @field_validator("courier_id", "policy_id")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        clean = str(value).strip()
        if not clean:
            raise ValueError("required text")
        return clean

    @field_validator("week_key")
    @classmethod
    def validate_week_key(cls, value: str) -> str:
        clean = str(value).strip()
        if not WEEK_KEY.fullmatch(clean):
            raise ValueError("invalid ISO week key")
        return clean

    @field_validator("country_code")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        clean = str(value).strip().upper()
        if not re.fullmatch(r"[A-Z]{2}", clean):
            raise ValueError("invalid country code")
        return clean

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        clean = str(value).strip().upper()
        if not re.fullmatch(r"[A-Z]{3}", clean):
            raise ValueError("invalid currency")
        return clean

    @field_validator("generated_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("generated_at must be timezone-aware")
        return value

    @field_validator("evidence_refs")
    @classmethod
    def normalize_evidence(cls, values: list[str]) -> list[str]:
        clean = sorted({str(value).strip() for value in values if str(value).strip()})
        if not clean:
            raise ValueError("at least one evidence ref is required")
        return clean

    @field_validator("warnings")
    @classmethod
    def normalize_warnings(cls, values: list[str]) -> list[str]:
        return sorted({str(value).strip() for value in values if str(value).strip()})

    @model_validator(mode="after")
    def validate_amounts(self):
        if self.differential_due_minor > self.gross_pay_due_minor:
            raise ValueError("differential cannot exceed gross pay")
        if self.governing_floor_minor > self.gross_pay_due_minor:
            raise ValueError("gross pay cannot be below governing floor")
        expected_total = (
            self.gross_pay_due_minor
            + self.tips_minor
            + self.expense_reimbursements_minor
        )
        if self.total_cash_due_minor != expected_total:
            raise ValueError("total cash due mismatch")
        return self


class CourierSettlementReceipt(BaseModel):
    statement_id: str
    intent_hash: str
    status: Literal["SHADOW_RECEIVED"] = "SHADOW_RECEIVED"
    idempotent_replay: bool
    production_execution: Literal[False] = False
