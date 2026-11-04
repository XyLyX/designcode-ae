# AI Design Studio — Implementation checklist
Status: development branch only; no production deployment authorised.
Branch: fix/rfq-reliability-ai-studio
Date: 2026-11-04

## Completed
- Verified Netlify project designcodeae, site id e0cc65f7-8ec5-4b7e-847c-d2ade5e39ff7.
- Published production deploy 6ae8dd50db5063efa2d6e501, main@321da0f, ready on 2026-11-02.
- Netlify Forms enabled; five registered RFQ forms; no deployed functions; site-level environment variable list empty.
- Fixed assets/main.js form submission handling on development branch: check response.ok, prevent duplicate submits, keep values on failure, show error, track conversion only on HTTP success.

## Verification required before merging
1. Syntax-check assets/main.js.
2. Test successful form POST against non-production Netlify preview with a clearly identified test lead; confirm stored submission and notifications.
3. Simulate network failure and HTTP 400/500: error visible, inputs retained, no conversion event.
4. Test double-click prevention and button re-enablement.
5. Confirm all five forms and their notification destinations.
6. Confirm branch preview does not inadvertently expose private test data.

## Backend design decisions
- Keep static HTML/CSS/JS; add Netlify Functions as backend only after approval.
- Do not use Netlify Forms to store raw room photographs; use private object storage with short-lived access.
- Choose dedicated Supabase project or another backend after reviewing auth/storage needs and operating costs.
- Data entities: sessions, room_photos, analysis_jobs, concepts, budgets, leads, consent_events, admin_reviews.
- Security: server-side AI keys, upload validation, RLS, signed URLs, abuse/rate limits, retention and deletion, capped generation budgets.
- AI scope for first pilot: living rooms/bedrooms, audit plus one conceptual redesign, optional lead handoff.
- Before image processing: privacy policy, consent, vendor data processing review and professional safety disclaimer.

## Open work
- Verify production Netlify Forms notifications and reconcile rfq-general count=0 with last_submission_at present.
- Determine real operating costs and provider selection; no fabricated unit cost assumptions.
- Prepare feature intake, schema and backend code on development branch after requirements confirmation.
- Complete QA before requesting merge/deploy approval.

## Release rule
Never merge to main or deploy to production without explicit user approval.
