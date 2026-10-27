"""Courier payroll settlement intent shadow table — LAB DRAFT ONLY.

Revision ID: courier_payroll_shadow_20261027
Revises: intentionally_unbound_lab_draft

This migration is deliberately NOT wired into production Alembic history.
It documents the target append-only persistence shape once production DB
authority and migration lineage have been reconciled.
"""

from alembic import op
import sqlalchemy as sa


revision = "courier_payroll_shadow_20261027"
down_revision = None
branch_labels = ("courier_payroll_lab_draft",)
depends_on = None


def upgrade():
    op.create_table(
        "courier_payroll_settlement_intent",
        sa.Column("statement_id", sa.String(64), primary_key=True),
        sa.Column("intent_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("schema_version", sa.String(64), nullable=False),
        sa.Column("mode", sa.String(16), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("courier_id", sa.String(128), nullable=False),
        sa.Column("week_key", sa.String(16), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("policy_id", sa.String(160), nullable=False),
        sa.Column("policy_hash", sa.String(64), nullable=False),
        sa.Column("facts_hash", sa.String(64), nullable=False),
        sa.Column("total_cash_due_minor", sa.BigInteger(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "mode = 'SHADOW'",
            name="ck_courier_payroll_settlement_shadow_mode",
        ),
        sa.CheckConstraint(
            "status = 'SHADOW_RECEIVED'",
            name="ck_courier_payroll_settlement_shadow_status",
        ),
    )
    op.create_index(
        "ix_courier_payroll_settlement_courier_week",
        "courier_payroll_settlement_intent",
        ["courier_id", "week_key"],
    )


def downgrade():
    op.drop_index(
        "ix_courier_payroll_settlement_courier_week",
        table_name="courier_payroll_settlement_intent",
    )
    op.drop_table("courier_payroll_settlement_intent")
