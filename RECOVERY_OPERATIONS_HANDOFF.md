# Recovery operations handoff

Inspection date: 2026-11-24  
Repository: `Fausto1559/meu-app-txt`  
Branch: `recuperacao/build-2026-11-05`  
Production changes: none

## Verified automated checks
The recovery CI runs `npm ci`, full and production dependency audits (both must report zero vulnerabilities), TypeScript typecheck, automated tests, and Vite production build. The latest verified run before the CI hardening commit passed all checks at commit `5994c89ee2572350dd04ab40bc78bca4135c8964`.

## CI hardening — 2026-11-24
- Updated `.github/workflows/recovery-security-audit.yml` to use `permissions: contents: read`.
- Removed automatic lockfile mutation/commit/push from CI.
- Pinned checkout, setup-node, and upload-artifact actions to reviewed full commit SHAs.
- Added workflow concurrency cancellation for superseded branch runs.
- Commit `4b98ee0857a73d90ada7506308508671dec947c7` passed the workflow successfully.
- Vercel's Git deployment for that commit reached the build stage and produced the Vite bundle, but failed the post-build TypeScript function scan with TS2688 because `vite/client` and `node` type definitions were unavailable in the Vercel build environment.

## Vercel Preview install configuration — 2026-11-24
The project install command was changed to `npm install --include=dev` so type packages remain present during Vercel's server-function type scan. This affects project build configuration only; it does not deploy code or change production traffic. A subsequent Preview build is still required to verify the fix.

A Preview deployment request for commit `4b98ee0857a73d90ada7506308508671dec947c7` was rejected by Vercel with HTTP 402, resource `api-deployments-free-per-day`, retry after 86400 seconds. No CLI or alternate path was used to bypass this quota. Existing Preview remains on older commit `688269783ebde2960154135da1f50ee15dee23b3`.

## Homologation duplicate-index correction — 2026-11-24
- Performance Advisor had identified two identical UNIQUE B-tree indexes on `public.payments(provider, provider_payment_id)`.
- Inspection confirmed `payments_provider_payment_unique` was a UNIQUE constraint with zero inbound foreign keys; `payments_provider_payment_upsert_uidx` was the non-partial unique index required by the webhook's `ON CONFLICT` upsert.
- Removed only the redundant constraint from homologation project `eerqeimqzkgdpvutjfhm`; verified that only `payments_provider_payment_upsert_uidx` remains.
- Migration version `20261124193813` was recorded and its SQL is committed as `supabase/migrations/20261124193813_remove_duplicate_payments_provider_payment_constraint.sql`.
- Production database was not changed. Homologation Health Advisor returned no findings; Performance Advisor no longer reports the duplicate index, only eight INFO unused-index notices. Retain unused indexes until representative workload/query-plan evidence exists.

## Supabase security and health
- Production project `genbxhvhmrgyflptnrpi` and homologation project `eerqeimqzkgdpvutjfhm` both report `ACTIVE_HEALTHY`.
- Health Advisor returns no findings for either project.
- Security Advisor reports only `auth_leaked_password_protection` disabled on both. Supabase documentation states leaked-password protection requires Pro plan or higher. Do not upgrade or incur cost without an explicit cost decision; do not substitute an insecure frontend password check.
- Homologation retains eight unused-index INFO notices; production retains fifteen. These are not proof that the indexes are unnecessary.

## Required Production environment variables
Production currently has the production Supabase URL and publishable frontend key, plus `ASAAS_ENVIRONMENT=production`. The following are absent:
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`

Do not copy Preview credentials into Production. Add the production Supabase server key generated for project `genbxhvhmrgyflptnrpi`, the live Asaas key, and a high-entropy webhook token only as part of a separately approved release procedure.

## Recovery Preview environment
Preview variables for `recuperacao/build-2026-11-05` point to homologation project `eerqeimqzkgdpvutjfhm` and Asaas Sandbox. The existence and scope of secrets were inspected without decrypting values. Presence does not prove validity; an authenticated Preview health check and end-to-end Sandbox test are still required.

## Database migration history
See `supabase/MIGRATION_RECONCILIATION.md`. Six historical migration SQL files are absent from all available branches and exact-path commit histories. Do not fabricate historical migrations or run a blanket migration push. Recover original SQL or approve a separately reviewed baseline/schema-repair plan.

## Confirmed production-domain divergence — 2026-11-24
See `PRODUCTION_SECURITY_GAP.md`. Production custom domain still serves the older `main` deployment at commit `c4eda33ca3026cc2fc6fa994735d1ac547efa866`. It does not expose the new billing/admin routes; its legacy `/api/webhook` is an unauthenticated in-memory simulator. The recovery branch replaces this with authenticated, persistent webhook processing and disables the legacy route, but this is not yet serving production.

## Release gate — do not bypass
1. Obtain a current Preview for the latest recovery commit after Vercel's daily deployment quota resets.
2. Confirm the TypeScript type-scan fix and test the cloud-load retry path.
3. Authenticate to Preview with a synthetic test user; verify owner/admin membership and protected routes.
4. Validate Supabase server credentials and Asaas Sandbox key through authenticated health checks without exposing secret values.
5. Execute a complete Asaas Sandbox checkout/webhook flow; verify persistence, duplicate handling, refunds, and paid-access gating.
6. Recover the six missing historical migrations or approve a reviewed baseline/schema repair.
7. Add production-only server credentials and webhook token through a separately approved release procedure.
8. Obtain explicit approval for a controlled Production release.

No Production deployment, alias change, Production migration, real payment, or webhook POST is authorized by this handoff. Keep `main` and production untouched until the separate release approval.
