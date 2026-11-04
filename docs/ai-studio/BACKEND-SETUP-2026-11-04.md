# AI Design Studio backend setup — 2026-11-04

Supabase project: jkwsuwxfztftiofciiiu
Organisation: vomphazwyiepqdcuotbw
Region: ap-northeast-2 (Seoul)
Migration applied: initialize_ai_design_studio_private_schema

## Verified
- Seven empty tables: ai_design_sessions, ai_design_photos, ai_design_jobs, ai_design_concepts, ai_design_leads, ai_design_consents, ai_design_reviews.
- RLS enabled on all seven, no user-facing policies; anon/authenticated table privileges revoked. Access currently intended only for privileged server-side code.
- Private bucket ai-design-private, maximum 10 MB, JPEG/PNG/WebP.
- No customer data migrated.
- Security advisor INFO: RLS enabled with no policy (7 tables). This is intentional deny-by-default until the authenticated access design is finalised. Reference https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Important blockers before any customer upload
- Project region is Seoul, not UAE. Obtain explicit data residency decision before real customer photos are stored.
- Implement secure server-side session tokens and ownership enforcement, rate limiting, upload validation, signed URLs and deletion/retention.
- Configure server-only Supabase credentials in Netlify Functions environment; do not commit secrets.
- Define and test admin authentication and role checks.
- Complete privacy notice, AI processing consent and third-party model disclosure.
- AI provider, billing and usage ceilings not selected.
- RFQ form fix remains in draft PR and needs preview/live verification.
- No production deploy or merge authorised.
