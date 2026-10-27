# ORCHIDPAY — Courier Fair Pay Settlement Shadow Lab

Date: 27 October 2026

## Boundary

DelishAfrica® Courier Fair Pay computes **what is owed**.

ORCHIDPAY receives an immutable settlement intent and owns **how a financial
settlement will eventually be orchestrated**.

The first integration is SHADOW ONLY:
- internal-authenticated endpoint;
- append-only private NDJSON store;
- statement-id idempotency;
- conflict on same statement ID with changed payload;
- SHA-256 intent hash;
- outbox preview only;
- no ledger posting;
- no settlement call;
- no payout call;
- no payment rail.

## Contract

Schema version:
`ORCHIDPAY_COURIER_SETTLEMENT_INTENT_V0.1`

Required traceability:
- statement ID;
- policy ID/hash;
- facts hash;
- courier/week/country/currency;
- eligible income;
- governing floor;
- differential;
- gross pay;
- tips;
- expense reimbursements;
- total cash due;
- production eligibility;
- evidence references;
- warnings.

## Flags

The HTTP consumer stays disabled unless:

`ORCHIDPAY_COURIER_PAYROLL_SHADOW_ENABLED=true`

Optional store location:

`ORCHIDPAY_COURIER_PAYROLL_SHADOW_DIR=/path/to/private/store`

## Production rule

This lab intentionally contains **no payout execution path**.

Promotion to a production settlement engine requires:
1. reconciled DB migration authority;
2. Green country policy;
3. production-eligible Fair Pay statement;
4. explicit ledger-account mapping;
5. balanced ledger transaction specification;
6. outbox/event contract;
7. payout rail authorization;
8. reconciliation and reversal workflow;
9. legal/payroll approval.


## Non-executable ledger plan

The lab now also contains:
`app/services/courier_payroll_ledger_plan.py`

It maps a validated Fair Pay settlement intent to a pure, deterministic ledger plan:
- gross obligation;
- tip pass-through;
- expense reimbursement.

Each non-zero component becomes one balanced two-entry plan:
- DEBIT dedicated SYSTEM clearing account;
- CREDIT Courier payable account.

The plan carries:
- statement ID;
- policy/facts hashes;
- component;
- idempotency key;
- external reference;
- currency/amount.

Every generated transaction has:
`execution_allowed = False`

The aggregate plan has:
`production_execution = False`

No SQLAlchemy session, ledger post, outbox publish or payout function is called by this planner.

Current Python QA:
**13/13 PASS**
