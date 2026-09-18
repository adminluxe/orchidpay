
# OrchidPay public site

Static, dependency-free public site for `orchidpay.online`.

## Publish root

Publish **this directory itself** as the web root:

`site/`

Expected public URLs after deployment:

- `https://orchidpay.online/`
- `https://orchidpay.online/privacy/`
- `https://orchidpay.online/privacy-choices/`
- `https://orchidpay.online/legal/`
- `https://orchidpay.online/terms/`
- `https://orchidpay.online/cookies/`
- `https://orchidpay.online/support/`
- `https://orchidpay.online/.well-known/security.txt`

No build step is required.

## Security properties

- no third-party JavaScript
- no analytics or advertising tags
- no remote fonts
- restrictive security headers supplied in `_headers`
- no payment or settlement endpoint exposed by the site
- no mobile build mutation

## App Store fields

- Privacy Policy URL: `https://orchidpay.online/privacy/`
- User Privacy Choices URL: `https://orchidpay.online/privacy-choices/`
- Support URL: `https://orchidpay.online/support/`

Do not enter these URLs in App Store Connect until the deployed endpoints return HTTP 200 over HTTPS.
