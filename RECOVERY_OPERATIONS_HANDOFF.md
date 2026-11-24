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
