<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Platform rules (languages, identifiers, settings)

These apply to every change; the CI "Languages" job enforces the wording files.

1. **No hard-coded shopper wording.** Every text a shopper reads comes from `src/messages/<language>.json`
   (brand storefronts: `src/brands/<brand>/i18n/messages/<language>/`). English is complete; other languages
   may be partial and fall back to English. Run `npm run i18n:check` before committing.
2. **Any language, not English/Arabic only.** Never write `=== "ar"` or English/Arabic-only lists: use the shared
   helpers in `src/lib/i18n/locales.ts` (`isRtl`, `dir`, `intlLocale`, `matchLocale`). A market's languages come
   from the backend (`/storefront/site`), not build settings.
3. **One sentence, one message.** Don't glue sentences together from pieces or change the case of translated
   text in code; use placeholders and plural forms.
4. **Identifiers never change.** Order/return numbers, SKUs, codes, coupon and gift-card codes, emails, phones and
   URLs are shown exactly as stored, left to right (`<bdi>`), never translated or reformatted. Latin digits.
5. **Right to left.** Use logical CSS (`ms-`/`me-`, `ps-`/`pe-`, `inset-s-`/`inset-e-`, `text-start`), never
   physical left/right for layout.
6. **Business settings belong in the admin, not in env.** A new per-brand/per-market value (wording, limits,
   switches, addresses) is read from the backend; env is only for secrets, infrastructure and per-environment
   values. See the backend's `docs/program/audits/SETTINGS_ENV_VS_ADMIN_2026-11-21.md`.
7. **Translators** get everything through the backend translation pack (`docs/translation/README.md` in the
   backend repository); never hand-edit another language's file without that flow.
