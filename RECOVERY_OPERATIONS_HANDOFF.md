# Recovery operations handoff

Inspection date: 2026-11-24  
Repository: `Fausto1559/meu-app-txt`  
Branch: `recuperacao/build-2026-11-05`  
Production changes: none

## Verified automated checks

The recovery CI enforces all of the following:
- `npm ci` from the committed lockfile.
- Full dependency audit and production-only dependency audit, both required to report zero vulnerabilities.
- TypeScript typecheck for frontend and server API source.
- Automated tests for the application, Supabase server-key selection, authentication, billing status, checkout validation, Asaas request construction, and webhook input validation.
- Vite production build.

The checks passed at the last verified recovery commit before this document was added. Re-run CI on the new commit before considering the branch ready for deployment.

## Required Production environment variables

The Vercel Production environment currently has:
- `SUPABASE_URL` and `VITE_SUPABASE_URL` pointing to the production project `genbxhvhmrgyflptnrpi`.
- `VITE_SUPABASE_ANON_KEY`.
- `ASAAS_ENVIRONMENT=production`.

The following server secrets were absent from the Production environment at inspection:
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- `ASAAS_API_KEY`.
- `ASAAS_WEBHOOK_TOKEN`.

Add these values in Vercel Project → Settings → Environment Variables, scoped to Production and marked sensitive. The Supabase server key must be generated for project `genbxhvhmrgyflptnrpi`. The Asaas API key must be the live Production key. The webhook token must be the same token configured in the Asaas webhook settings. Never copy Preview credentials into Production and never commit any of these values.

## Recovery Preview environment

Preview for branch `recuperacao/build-2026-11-05` points to homologation project `eerqeimqzkgdpvutjfhm` and uses `ASAAS_ENVIRONMENT=sandbox`. The branch has a branch-scoped `SUPABASE_SERVICE_ROLE_KEY`, plus Asaas Sandbox and webhook secrets. The code prefers the branch-scoped server key and validates legacy JWT project references against `SUPABASE_URL`; if it falls back to an opaque `sb_secret_` key, Supabase itself verifies the project binding on the first request.

The environment variable names and scopes were audited without reading or printing secret values. Presence in Vercel does not prove that a secret is valid; an authenticated Preview health check is still required.

## External / plan restrictions

- Supabase Leaked Password Protection reports disabled on both projects. The attempted native HaveIBeenPwned configuration returned the plan restriction that the feature requires Pro or higher. Do not change plan without an explicit cost decision.
- Supabase Performance Advisor reports unused indexes, but these are INFO notices and should not be removed without representative workload/query-plan evidence.
- Vercel Hobby runtime log retention is only one hour, so historical errors older than the retained window cannot be reconstructed from Vercel runtime logs.
- Vercel's daily deployment creation limit was reached during recovery. Latest code must be deployed to Preview after that platform limit permits another deployment; do not promote to Production.

## Database migration history

See `supabase/MIGRATION_RECONCILIATION.md`. Six historical migration SQL files are absent from all available branches and their exact-path commit histories. Do not fabricate those historical migrations or run a blanket migration push. Recover original SQL or approve a separately reviewed baseline/schema-repair plan.

## Deployment rule

This branch is for recovery and validation only. No production deployment, promotion, database migration, deletion, or production credential change is authorized by this document.

## Confirmed production-domain divergence — 2026-11-24

See `PRODUCTION_SECURITY_GAP.md` for the full evidence and release gate. The verified custom domain currently serves production deployment `dpl_AHBcx7iZa19VBWw6XLg6ku7en2z4` from `main` at commit `c4eda33ca3026cc2fc6fa994735d1ac547efa866`. The current Production deployment returns 404 for `/api/billing/status`, `/api/admin/me`, and `/api/billing/checkout`. Its `/api/webhook` is a public in-memory simulator that accepts unauthenticated POSTs and exposes its temporary event list on GET. `WEBHOOK_SECRET` is absent from Production, and the other legacy webhook endpoint only enforces it when present.

The current recovery Preview is READY at commit `bd8ca10ebaefd4b277410c2df263170b5a830319`. Its new webhook requires `ASAAS_WEBHOOK_TOKEN`, persists events, and disables the legacy route with HTTP 410. Production promotion remains blocked by missing production server credentials and requires a separate explicit release decision.

## Additional recovery work — 2026-11-24

At the latest verified recovery commit `c34f5a8ceab5a6482be7c084eed2d02d35a921d7`:
- Removed direct runtime dependencies `firebase` and `firebase-admin`. The production commit and recovery app/API source were both scanned; no executable Firebase/Firestore imports or initialization were found. Old Firebase configuration/rules and Vercel Production Firebase environment variables remain untouched as historical artifacts.
- The CI synchronized `package-lock.json`; its resolved package graph contains no remaining Firebase packages.
- Fixed the financial cloud-load failure screen. A failed fetch no longer leaves the signed-in user on an endless spinner; it presents an error, a retry control, and a sign-out control. An automated regression test covers a failed fetch followed by a successful retry.
- The recovery CI currently passes with 55 tests in 13 test files, zero vulnerabilities in both full and production dependency audits, TypeScript typecheck, and the Vite build.

## Latest Preview/deployment quota

A new Preview deployment was successfully created earlier at `dpl_2cRQwN4F4gk3AYvLq5GQrRMjANGV`, SHA `bd8ca10ebaefd4b277410c2df263170b5a830319`, state READY. It does not include the newer Firebase-dependency removal and cloud-load retry fix.

A new Preview build was requested for SHA `c34f5a8ceab5a6482be7c084eed2d02d35a921d7`, but Vercel returned HTTP 402, `api-deployments-free-per-day`, retry after 86400 seconds. No CLI or alternative deployment path was used to bypass the limit, and no Production aliases or targets were changed.

The next deployment action is to create a Preview for the latest recovery SHA after Vercel's quota is available, then test the retry path and authenticated admin/billing routes against that deployment. Do not promote to Production as part of that step.
