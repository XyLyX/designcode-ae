# AI Studio customer login and consent UI — development checkpoint

## Implemented
- `ai-design-studio.html` now contains an email-login section, verification-code field and separate AI-processing, project-contact and optional-marketing consent choices.
- All auth and consent controls remain disabled. The submit button remains disabled.
- No client-side Supabase key, privileged preview key or service-role credential has been introduced.
- No production deployment or merge.

## Verified
GitHub source re-read confirms login, code request, consent and submit controls are disabled. API source confirms Supabase user verification, session owner assignment and rate-limit helper call. These are static checks only; no automated or live integration tests have run.

## Release blockers
1. Choose and configure Supabase email OTP/auth flow, approved redirect URLs and mail delivery; provide public publishable key safely to browser (never service-role key).
2. Replace internal preview-key dependency with production-grade user authentication and network-level throttling; preview key must not be shipped to browsers.
3. Publish accurate AI processing privacy notice with named provider(s), storage/retention, international transfers, withdrawal/deletion and a versioned consent contract.
4. Resolve backend consent pilot contract: current endpoint requires `marketing=false` while UI offers optional marketing. Implement and test actual optional preference persistence.
5. Build authenticated form submit flow and safe image upload including decoding/re-encoding, EXIF stripping, quotas and deletion.
6. Run automated tests and preview integration with synthetic files.
7. Select AI provider, implement job queue and spend caps, and secure professional review.
8. Do not enable flags or deploy to production until explicit approval.

## Operational notes
Project: `zjiemjcilgbxrtqcovkz` (Mumbai).
Branch: `fix/rfq-reliability-ai-studio`; draft PR #1.
