# Design Code AI Studio — email OTP integration

## Implemented
- Public configuration endpoint `netlify/functions/ai-studio-config.mjs`, returns `enabled:false` unless `AI_STUDIO_PUBLIC_ENABLED=true` and public Supabase key + consent version exist.
- `assets/ai-studio.js` requests OTP via Supabase Auth `/auth/v1/otp` and verifies `/auth/v1/verify`. Access token stays in memory, never localStorage. No form or image transmission.
- Backend session, consent and upload endpoints can use verified Supabase bearer identity without preview key, provided `AI_STUDIO_REQUIRE_PREVIEW_KEY` is not `true`. All API feature flags remain off by default.
- Public publishable key is intended for browser use. Never expose `SUPABASE_SERVICE_ROLE_KEY`, session signing secret or preview key.

## Before testing
1. Configure Supabase Auth email OTP template to send `{{ .Token }}` (not solely magic-link `{{ .ConfirmationURL }}`), test email delivery and redirect/site URLs.
2. Enable appropriate email delivery via SMTP, monitor auth limits and CAPTCHA/bot controls.
3. Set Netlify Functions-scoped `SUPABASE_PUBLISHABLE_KEY`, `AI_STUDIO_CONSENT_VERSION`, `AI_STUDIO_PUBLIC_ENABLED=true` in an isolated preview environment ONLY after approval. Production stays off.
4. Verify verified-email claims and identity behavior in the actual Supabase project. No live tests performed yet.
5. Implement full browser session lifecycle, expiry/refresh, logout, UI and accessible errors.
6. Publish consent/privacy terms and explicitly enable submission only after release review. Current customer design form is intentionally disabled.
7. Add network-level anti-abuse, per-session upload caps, safe image decode/metadata stripping, tests and cost ceilings.

## Status
Development branch only; no production merge/deploy. OTP API calls have not been tested against live Supabase Auth.
