# AI Studio upload implementation — development only

## Added
- `netlify/functions/ai-studio-session.mjs` now returns a 30-minute HMAC-signed session token after creating a draft.
- `netlify/functions/ai-studio-upload.mjs` accepts raw image bytes with preview credential and signed session token.
- Checks size (10MB), JPEG/PNG/WebP magic signatures, existence and status of session, persisted consent timestamp/version AND a matching granted consent record.
- Writes to `ai-design-private/<session-uuid>/<random-uuid>.<extension>` in Mumbai Supabase; inserts photo metadata and attempts object cleanup on metadata failure.
- Requires `AI_STUDIO_API_ENABLED=true` AND `AI_STUDIO_UPLOAD_ENABLED=true`. Both absent/off by default.
- No client-facing form wiring, production deployment or Netlify environment variables set.

## Configuration for private integration testing only
`SUPABASE_URL=https://zjiemjcilgbxrtqcovkz.supabase.co`
`SUPABASE_SERVICE_ROLE_KEY` — Functions scope, secret
`AI_STUDIO_PREVIEW_KEY` — random 32+ character secret, Functions scope
`AI_STUDIO_SESSION_SIGNING_SECRET` — independent random 32+ character secret, Functions scope
`AI_STUDIO_API_ENABLED` and `AI_STUDIO_UPLOAD_ENABLED` — keep OFF until approved isolated testing.

## Critical outstanding issues
- **No customer-facing consent recording flow**: uploads will correctly return 403 until a lawful, versioned consent mechanism is built.
- Preview credential is NOT a customer authentication solution; build user-bound sessions and enforce per-user authorization, CSRF strategy and ingress rate limits.
- File magic checks do not fully decode, re-encode, strip metadata, scan or verify pixel dimensions. Add safe image processing and moderation where appropriate.
- API does not yet enforce per-session photo count, quota, or storage cost ceilings.
- Session creation may generate unused drafts; retention/deletion cleanup is needed.
- Upload metadata rollback is best-effort, not transactional with object storage.
- Signed retrieval, design analysis jobs, provider selection, AI generation and human review not implemented.
- No automated or live tests run. Code requires code review and preview validation.
- Never embed preview or service-role secrets in public HTML/JS or repository.
- No deployment or merge authorized.
