from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException

from app.core.internal_auth import require_internal_key
from app.schemas.courier_settlement import CourierSettlementIntent
from app.services.courier_settlement_service import (
    CourierSettlementConflict,
    CourierSettlementShadowService,
    ShadowCourierSettlementIntentStore,
)

router = APIRouter(
    prefix="/payroll/courier",
    tags=["Courier Payroll"],
    dependencies=[Depends(require_internal_key)],
)


def _enabled() -> bool:
    return os.getenv("ORCHIDPAY_COURIER_PAYROLL_SHADOW_ENABLED", "").lower() == "true"


def _service() -> CourierSettlementShadowService:
    if not _enabled():
        raise HTTPException(
            status_code=403,
            detail="ORCHIDPAY_COURIER_PAYROLL_SHADOW_DISABLED",
        )
    root = os.getenv(
        "ORCHIDPAY_COURIER_PAYROLL_SHADOW_DIR",
        "/var/lib/orchidpay/courier-payroll-shadow",
    )
    return CourierSettlementShadowService(
        ShadowCourierSettlementIntentStore(root)
    )


@router.post("/settlement-intents")
def accept_settlement_intent(intent: CourierSettlementIntent):
    try:
        receipt = _service().accept(intent)
    except CourierSettlementConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {
        "ok": True,
        "shadow": True,
        **receipt.model_dump(mode="json"),
    }


@router.get("/settlement-intents/{statement_id}")
def get_settlement_intent(statement_id: str):
    stored = _service().get(statement_id)
    if not stored:
        raise HTTPException(
            status_code=404,
            detail="ORCHIDPAY_COURIER_SETTLEMENT_NOT_FOUND",
        )
    return {
        "ok": True,
        "shadow": True,
        "statement_id": stored.statement_id,
        "intent_hash": stored.intent_hash,
        "status": stored.status,
        "intent": stored.intent,
        "production_execution": False,
    }


@router.get("/settlement-intents/{statement_id}/outbox-preview")
def settlement_outbox_preview(statement_id: str):
    try:
        event = _service().outbox_preview(statement_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail="ORCHIDPAY_COURIER_SETTLEMENT_NOT_FOUND",
        ) from exc
    return {
        "ok": True,
        "shadow": True,
        "event": event,
        "published": False,
        "production_execution": False,
    }
