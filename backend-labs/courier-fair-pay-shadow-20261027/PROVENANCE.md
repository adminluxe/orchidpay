# ORCHIDPAY Courier Fair Pay Shadow — Provenance

Date: 27 October 2026

Operational runtime authority inspected:
- service: `orchidpay-api.service`
- runtime: `/srv/orchidpay/orchidpay-api`
- bind: `127.0.0.1:8089`

No production runtime modification was performed by this lab.

Baseline source archive (secrets/venv/logs excluded):
- SHA-256: `60e0253bd6b25b137ed21cacfd33a77ff4eac7f044c8a7223761a9a6fbcef721`

Isolated VPS lab:
- path: `/home/afripayadmin/ORCHIDPAY_COURIER_PAYROLL_LAB_20261027/source/orchidpay-api`
- baseline Git commit: `9bb7c14`
- shadow consumer Git commit: `78edc49`

Evidence:
- tar SHA-256: `0966d94ad6b5f4c164eb168121b8075a36bed463013626cca2806cd0be623220`
- patch SHA-256: `333cc26df24650b8d9b0485cfcdf12bcc0737fd39d553847886221b563f27e7a`

QA:
- ORCHIDPAY Python shadow suite: 9/9 PASS.
- Real TypeScript DelishAfrica statement fixture accepted by Python consumer.
- HTTP consumer requires internal key.
- Shadow feature flag is OFF by default.
- Outbox is preview-only.
- No ledger post, settlement execution, payout or payment rail exists in this lab path.

Production DB note:
A read-only schema probe using the currently running service environment was rejected by PostgreSQL authentication. No migration was attempted. The migration bundled here is deliberately unbound and MUST NOT be applied until DB authority/credentials and Alembic lineage are reconciled.
