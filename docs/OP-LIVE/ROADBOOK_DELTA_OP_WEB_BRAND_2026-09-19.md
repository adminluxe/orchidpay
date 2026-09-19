# OrchidPay — Roadbook Delta — OP-WEB-BRAND — 2026-09-19

## Scope

Public-branding update only. No mobile binary, payment, settlement, credentials, DNS, or security-authority mutation.

## Source

- repository: `adminluxe/orchidpay`
- base: `main`
- base commit: `5c6eefb6cd38c2a93166ecda4705fc2169cae7f6`
- branch: `web/orchidpay-final-logo-20260919`

## Change

Approved OrchidPay logo supplied in the current project conversation is now the single source for:

- hero brand visual: `site/assets/orchidpay-brand.webp`
- browser favicon / touch icon: `site/favicon.png`
- header brand mark
- Open Graph share image

The previous abstract orbital hero remains removed from the rendered landing hero.

## Web optimization

The supplied square PNG source was resized locally for web delivery without regenerating or redesigning the logo:

- hero asset: 256×256 WebP, optimized for page weight
- favicon: 64×64 PNG

## Safety

`MOBILE_BINARY_MUTATION=NO`

`PAYMENT_MUTATION=NO`

`SETTLEMENT_MUTATION=NO`

`DNS_MUTATION=NO`

`WEB_BRAND_ONLY=YES`
