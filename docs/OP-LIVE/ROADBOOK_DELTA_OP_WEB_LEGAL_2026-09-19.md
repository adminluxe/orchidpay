# OrchidPay — Roadbook Delta — OP-WEB-LEGAL — 2026-09-19

## Scope

Public-web hardening only. No mobile binary, payment, settlement, GitHub main, provider credential or production financial mutation is authorized by this delta.

## Source baseline

- repository: `adminluxe/orchidpay`
- protected baseline branch: `main`
- baseline commit: `f761ebafb4ee0efe26f50a50db4a3916b475e9dc`
- working branch: `web/orchidpay-public-legal-20260919`
- PR: `#6 feat(web): harden OrchidPay public site and legal surface`

## Public-site package added

Static source is placed under `site/` and is intended to be published with `site/` as the web root.

Target endpoints:

- `/` — revised public landing, typographic wordmark, no legacy flower logo
- `/privacy/` — website + iOS-pilot privacy policy
- `/privacy-choices/` — App Store privacy choices / GDPR request channel
- `/legal/` — transitional legal notice
- `/terms/` — pilot terms of use
- `/cookies/` — cookie and tracker policy
- `/support/` — support, App Review and security reporting
- `/.well-known/security.txt` — vulnerability-reporting metadata

## Public claims deliberately constrained

The site states that:

- OrchidPay is a private pilot initiative of Purple Orchid Group;
- Purple Orchid Group is in the process of incorporation in Luxembourg;
- live payment execution is OFF;
- customer-fund custody is OFF;
- production settlement is OFF;
- no CSSF/payment-institution authorisation is claimed;
- demo balances, cards, QR flows and transfers may be synthetic.

## Privacy posture

The landing source deliberately includes:

- no advertising pixels;
- no behavioural analytics;
- no social tracking scripts;
- no third-party JavaScript;
- no remote fonts.

Strictly necessary network/security processing by infrastructure providers remains possible.

## App Store target URLs

Use only after live production deployment and HTTP/TLS verification:

- Privacy Policy URL: `https://orchidpay.online/privacy/`
- User Privacy Choices URL: `https://orchidpay.online/privacy-choices/`
- Support URL: `https://orchidpay.online/support/`

## App-review warning

Apple App Review Guideline 5.1.1 requires a privacy-policy link both in App Store Connect metadata and inside the app in an easily accessible location.

Current canonical Build 6 source does not expose a working in-app privacy-policy link. The Profile screen currently renders informational rows without URL handlers.

Therefore:

`WEB_PRIVACY_URL_READY_SOURCE=YES`

`BUILD6_IN_APP_PRIVACY_LINK=NO`

`FINAL_APP_REVIEW_RISK=OPEN`

This delta does not rebuild the app and does not authorize Build 7. A separate controlled mobile decision is required before final App Review submission.

## Validation

Static-source review on the PR branch:

- third-party JavaScript: NONE
- advertising / behavioural analytics tags: NONE
- remote fonts/assets: NONE
- internal route-link integrity: PASS
- legal/public routes present: PASS
- restrictive static headers prepared: PASS

## Deployment state

GitHub/Vercel integration automatically produced a successful preview deployment for head commit:

`692f15cad8df7104dd2a44f75c5aaadc1e561f18`

GitHub combined status:

`VERCEL=SUCCESS / Deployment has completed`

Vercel bot state:

`PREVIEW=READY`

Preview URL reported by Vercel:

`https://orchidpay-git-web-orchidpay-public-l-98cd93-adminluxes-projects.vercel.app`

Therefore:

`GITHUB_SOURCE_PREPARED=YES`

`VERCEL_PREVIEW_DEPLOYED=YES`

`VERCEL_PREVIEW_STATUS=READY`

`PR6_MERGED=NO`

`MAIN_MUTATED=NO`

`ORCHIDPAY_ONLINE_PRODUCTION_UPDATED=NO`

`CUSTOM_DOMAIN_MAPPING_VERIFIED=NO`

The external preview/custom-domain pages could not be independently fetched from the current execution environment. No production merge or blind custom-domain mutation is performed until the preview is visually/HTTP verified from a reachable environment.

## Next controlled gate

1. Verify the Vercel preview visually and confirm that the new landing/legal routes are actually being served.
2. Confirm Vercel project root/output maps `site/` correctly.
3. Resolve the Build 6 in-app privacy-link requirement separately.
4. Only then authorize merge/deployment to production and populate App Store Connect with the live HTTPS URLs.
