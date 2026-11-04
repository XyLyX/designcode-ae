# AI Studio private submission wiring

Branch `fix/rfq-reliability-ai-studio`; no merge/deploy.

## Wired
- Email OTP login; bearer token retained in memory and refreshed as needed.
- Draft session POST, consent POST, then binary private photo POST.
- Session HMAC token passed in `x-ai-studio-session-token`.
- Submission is gated by **both** `AI_STUDIO_PUBLIC_ENABLED=true` and `AI_STUDIO_SUBMISSION_ENABLED=true`; backend API, consent and upload switches must also be enabled. All default to disabled.
- Marketing preference remains disabled and backend records false; no false opt-in.
- On partial failure, UI warns that a draft may already exist. No automatic retry.

## Not verified
- Supabase email OTP template, SMTP delivery, provider configuration, Netlify function-scoped secrets.
- No deployment or runtime tests; only source checks performed.
- No synthetic photo upload or storage access test.
- No image decoding/re-encoding, EXIF removal, per-session quota, network throttling or expiry cleanup.
- No finalized privacy/retention/withdrawal notice or operational designer-review process.
- No AI generation pipeline or cost cap.

## Mandatory before enabling
1. Configure a passwordless email OTP template with `{{ .Token }}` and verify live email delivery.
2. Set all Function-scoped server secrets and public publishable key in an isolated preview; **never** expose service-role or preview secrets in browser.
3. Run Node syntax tests, existing unit tests, and integration tests using synthetic images.
4. Verify consent RPC, owner checks, private storage access, duplicate attempts and rate-limit responses.
5. Confirm legal privacy notice and retention/deletion flow.
6. Only then approve preview enablement. Production remains unchanged.
