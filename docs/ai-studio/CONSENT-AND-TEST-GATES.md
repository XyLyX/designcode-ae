# Consent and access-control implementation — 2026-11-04

## Code and database changes
- `netlify/functions/ai-studio-consent.mjs` — internal-only, default-disabled endpoint.
- Supabase Mumbai migration `atomic_ai_design_consent_recording` — atomic transaction to update session and record consent events.
- Permission verification: anon=false, authenticated=false, service_role=true for RPC execution.
- Session API now issues 30-minute HMAC-signed session tokens.
- Upload API verifies the signed session token, persisted consent timestamp/version and granted processing consent.
- `tests/ai-studio-api.test.mjs` contains smoke tests for disabled endpoints and GET rejection. **Tests committed but not executed**.
- No production deploy or secrets configured.

## Requirements before live or preview testing
- Prepare an accurate privacy notice and policy version (e.g. `v2026-11-04` only after approval).
- Explain AI provider identity, purpose of photo processing, retention/deletion, optional marketing consent and contact necessity.
- Current consent endpoint requires `ai_processing=true`, `contact=true`, `marketing=false`; it is a restricted pilot contract, not a complete preference UI. Do not make marketing consent a condition of service.
- Use server-only `AI_STUDIO_CONSENT_VERSION`, `AI_STUDIO_CONSENT_ENABLED`, `AI_STUDIO_SESSION_SIGNING_SECRET`, `AI_STUDIO_PREVIEW_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` in Netlify Functions scope.
- Do not place the preview credential in browser code. Build real user identity, ownership and persistent rate limits first.
- Add image decoding/re-encoding, EXIF stripping, quota enforcement, deletion, safe signed download and a complete threat-model review.
- Execute smoke tests and isolated integration tests with synthetic files before any live traffic.
- AI model/provider and spend caps are not configured. No generation available.
