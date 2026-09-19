# OrchidPay — Roadbook Delta — OP-WEB-UX2 — 2026-09-19

## Scope

Immediate public-web UX correction only.

## Root causes corrected

1. A literal `\\n` sequence had been committed inside the document `<head>`. Browser error-recovery surfaced it as visible text at the top-left of the page.
2. The newly referenced `site/assets/orchidpay-brand.webp` did not render in production, leaving empty framed logo boxes.

## Remediation

- literal escaped newline removed from `site/index.html`;
- visible header/hero brand references switched to the already-live and browser-verified `/favicon.png` OrchidPay mark;
- Open Graph image switched to the same verified asset;
- hero mark capped at 300px to preserve acceptable sharpness for the currently verified square asset;
- cache-busting query added to visible brand requests.

## Verification gates

- literal `\\n` in all public HTML: ZERO expected;
- broken `orchidpay-brand.webp` references in rendered landing: ZERO expected;
- header logo source: `/favicon.png?v=ux2`;
- hero logo source: `/favicon.png?v=ux2`.

## Safety

`MOBILE_BINARY_MUTATION=NO`

`PAYMENT_MUTATION=NO`

`SETTLEMENT_MUTATION=NO`

`DNS_MUTATION=NO`

`WEB_UX_ONLY=YES`
