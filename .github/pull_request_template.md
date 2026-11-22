## What and why

<!-- One or two sentences. -->

## Checklist

- [ ] No hard-coded shopper wording: new texts are in `src/messages/en.json` (and other languages where available); `npm run i18n:check` passes
- [ ] Works in any language: no `=== "ar"` / English-Arabic-only lists; right-to-left checked (logical CSS)
- [ ] Identifiers (order numbers, SKUs, codes, emails, phones, URLs) shown exactly as stored, left to right
- [ ] No new business setting in env (per-brand/market values come from the backend/admin)
- [ ] Brand storefront folders (e.g. `src/brands/sapil`) only changed where agreed with that team
- [ ] Tested in the browser at desktop, tablet and phone sizes
