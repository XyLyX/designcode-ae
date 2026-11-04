# Design Code AI Studio — Mumbai backend (2026-11-04)

**Active target project:** DesignCode, Supabase ref `zjiemjcilgbxrtqcovkz`, region `ap-south-1` (Mumbai), organisation `vomphazwyiepqdcuotbw`.

Migration `initialize_ai_design_studio_private_schema` applied successfully and verified:
- Seven empty tables: `ai_design_sessions`, `ai_design_photos`, `ai_design_jobs`, `ai_design_concepts`, `ai_design_leads`, `ai_design_consents`, `ai_design_reviews`.
- RLS enabled, anon/authenticated privileges revoked; no direct user policies yet (deny by default).
- Private `ai-design-private` bucket, 10MB limit, JPEG/PNG/WebP.
- No production Netlify configuration changed. No customer data uploaded.

**Supersedes Seoul project** `jkwsuwxfztftiofciiiu` (created same day). Do not configure any application against Seoul. Do not delete until owner confirms no external dependencies; earlier project held only an identical empty schema when inspected.

## Remaining release gates
1. Secure Netlify Functions for session issuance, image upload and ownership checks, model processing and signed retrieval. Never expose privileged keys.
2. Per-request cost controls, input validation, abuse prevention, retention/deletion, privacy and explicit AI provider consent.
3. Provider/model selection and billing ceilings.
4. Real tests, security review and draft PR review.
5. User approval before merging/deploying.
