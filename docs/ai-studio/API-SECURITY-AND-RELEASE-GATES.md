# AI Studio API — implementation and release gates

## Current code
- `netlify/functions/ai-studio-session.mjs`: internal-only POST draft-session endpoint.
- Default-off `AI_STUDIO_API_ENABLED` switch.
- Preview credential `AI_STUDIO_PREVIEW_KEY` must be at least 32 characters, compared in constant time.
- Server-only `SUPABASE_URL` must point to the **Mumbai** project `https://zjiemjcilgbxrtqcovkz.supabase.co`.
- Server-only `SUPABASE_SERVICE_ROLE_KEY` is required; **never** commit or expose it to browser JavaScript.
- Current intake page does not invoke this API; submit remains disabled.

## Important constraints
- This endpoint is an internal integration scaffold, NOT a public launch-ready API.
- No persistent per-user authentication, IP/device rate limits, quotas, bot protection, CSRF design, upload endpoint, malware/image validation, signed download URLs, retention job or AI provider integration.
- No consent is collected or inferred by this endpoint; only drafts without images can be created.
- Never paste `AI_STUDIO_PREVIEW_KEY` into client-side code; it is for private server-to-server tests only.
- Do not enable the API in public production until security and privacy review.
- Do not use the superseded Seoul project `jkwsuwxfztftiofciiiu`.

## Next engineering tasks
1. Establish a user identity model and ownership checks; implement quotas and rate limits at ingress.
2. Document customer consent and privacy notices, data retention and deletion, third-party AI processors.
3. Build authenticated upload authorization, MIME/magic-byte and dimensions checks, safe object paths, signed access.
4. Implement job queue, AI provider adapter, prompt injection and cost safeguards, failure recovery and designer review.
5. Create automated tests (validation, unauthorized access, fail-closed configuration, abuse controls, data deletion).
6. Test in Netlify deploy preview and verify end-to-end with synthetic images before any customer data.
7. Request explicit approval before merging or deploying to production.
