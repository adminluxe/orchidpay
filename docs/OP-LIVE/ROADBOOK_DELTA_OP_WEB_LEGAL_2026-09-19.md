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

## Vercel root-cause and remediation

Initial preview deployments were reported as READY by Vercel, but opening the preview returned the repository-root Expo entry file `index.js` as a raw document instead of the intended static landing.

Root cause:

- the repository is primarily an Expo/React Native app;
- Vercel project root was the repository root;
- no root `vercel.json` existed;
- the static public site lives under `site/`.

Remediation commit:

`e3c9efdfb589aa5dd153d6d552b3195963ff78f7`

Added root `vercel.json`:

- `framework: null`
- `buildCommand: null`
- `outputDirectory: "site"`
- security headers moved into Vercel-compatible configuration

This forces Vercel to publish `site/` rather than exposing the Expo application entrypoint.

GitHub/Vercel status for the remediation commit:

`VERCEL=SUCCESS`

Vercel bot:

`PREVIEW=READY`

Preview URL:

`https://orchidpay-git-web-orchidpay-public-l-98cd93-adminluxes-projects.vercel.app`

Therefore:

`GITHUB_SOURCE_PREPARED=YES`

`VERCEL_STATIC_ROOT_FIX=APPLIED`

`VERCEL_DEPLOYMENT_STATUS=SUCCESS`

`PR6_MERGED=NO`

`MAIN_MUTATED=NO`

`ORCHIDPAY_ONLINE_PRODUCTION_UPDATED=NO`

The preview must still be visually reloaded from a reachable client to certify that the correct static landing is now served.

## Next controlled gate

1. Reload the same Vercel preview after the root/output fix.
2. Confirm the OrchidPay landing and legal routes render instead of `index.js`.
3. Resolve the Build 6 in-app privacy-link requirement separately.
4. Only then authorize PR #6 merge / production deployment and populate App Store Connect with the live HTTPS URLs.
