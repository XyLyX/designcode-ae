# AI Studio — Authentication and rate limits (development)

## Implemented in branch
- Mumbai Supabase migration `ai_design_owner_and_atomic_rate_limits` adds `owner_user_id` to design sessions, and a private rate-limit table plus atomic database RPC.
- Shared `netlify/functions/_ai-studio-security.mjs` validates the Supabase access token with `/auth/v1/user` and requires confirmed email. Privileged keys remain server-side.
- Session creation stores `owner_user_id`; consent and upload endpoints verify owner matches the authenticated user.
- Server-side per-user, per-operation hourly counters: 12 draft creations, 12 consent requests, 20 upload requests. Requests fail closed if the limiter is unavailable.
- All endpoints still require private preview credential and default-off feature flags; the browser intake remains non-submitting.
- SQL permissions verified: rate-limit RPC denied to anon and authenticated; allowed to service_role. No customer sessions exist.

## Critical limitations
- These are *user* limits, not IP/network or bot limits. Add ingress IP throttling, signup abuse controls and per-account quota enforcement.
- No frontend Supabase Auth integration, OTP/passwordless login or verified customer journey is implemented.
- Existing preview key is strictly internal and must never be embedded in the frontend.
- Current token-based authorization is a baseline, not a complete session revocation or risk-based auth policy.
- Database limits count requests but have no scheduled retention cleanup; add cleanup.
- The session API's draft record and its signed token issuance are separate operations; test failure cases and cleanup.
- The upload API still needs safe image decoding, metadata stripping, dimension checks and per-session upload limits.
- Automated tests were committed earlier but **have not been run**; integration tests have not been performed.
- Netlify production settings, API enable flags and secrets remain unchanged.
- Do not merge/deploy before tests, privacy review, consent UX, and explicit approval.
