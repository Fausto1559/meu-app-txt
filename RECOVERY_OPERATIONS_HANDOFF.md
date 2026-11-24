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
See `supabase/MIGRATION_RECONCILIATION.md`. The six historical SQL sources have been recovered from the databases' migration registry and archived under `supabase/recovered-history/`. They remain outside the active migration directory because production and homologation have different version streams. Do not run a blanket migration push; a reviewed environment-specific baseline/reconciliation plan is still required.

## Confirmed production-domain divergence — 2026-11-24
See `PRODUCTION_SECURITY_GAP.md`. Production custom domain still serves the older `main` deployment at commit `c4eda33ca3026cc2fc6fa994735d1ac547efa866`. It does not expose the new billing/admin routes; its legacy `/api/webhook` is an unauthenticated in-memory simulator. The recovery branch replaces this with authenticated, persistent webhook processing and disables the legacy route, but this is not yet serving production.

## Release gate — do not bypass
1. Obtain a current Preview for the latest recovery commit after Vercel's daily deployment quota resets.
2. Confirm the TypeScript type-scan fix and test the cloud-load retry path.
3. Authenticate to Preview with a synthetic test user; verify owner/admin membership and protected routes.
4. Validate Supabase server credentials and Asaas Sandbox key through authenticated health checks without exposing secret values.
5. Execute a complete Asaas Sandbox checkout/webhook flow; verify persistence, duplicate handling, refunds, and paid-access gating.
6. Complete a reviewed environment-specific migration baseline/reconciliation plan before any blanket migration push. The six original SQL sources are now archived outside the active migration directory.
7. Add production-only server credentials and webhook token through a separately approved release procedure.
8. Obtain explicit approval for a controlled Production release.

No Production deployment, alias change, Production migration, real payment, or webhook POST is authorized by this handoff. Keep `main` and production untouched until the separate release approval.

## Serverless-function count correction — 2026-11-24
- Vercel Preview build `dpl_3bZt39oeXj89ZRzqkKr2ATh8jTnx` failed with the Hobby limit: more than 12 Serverless Functions were detected.
- The recovery tree contained eight API route handlers plus five route-level test files under `api/`. The five tests were moved to `tests/api/`, their imports were updated, and Vitest now discovers them from that location.
- The resulting source tree was inspected: exactly eight route handlers remain under `api/`; the five moved tests are under `tests/api/`.
- Commit `f5307363064190e5c4b6fbf506f5bb0679be6910` passed all CI gates: dependency audits, TypeScript, tests, and build.
- The Vercel project install command was changed to `npm install --include=dev` after the prior deployment's TypeScript scanner could not resolve `vite/client` and `node` type definitions.
- No deployment currently exists for commit `f5307363064190e5c4b6fbf506f5bb0679be6910`. The earlier deployment daily-creation limit remains in effect, so the function-count reduction and install-command change have not yet been verified by a new Preview.
- Next gate: create a Preview for `f5307363064190e5c4b6fbf506f5bb0679` once Vercel permits a deployment. Confirm the deployment sees no more than eight application API functions, resolves TypeScript types, and reaches READY. Do not promote it.

## CI guardrail for Vercel function limits — 2026-11-24
- Added `scripts/check-vercel-functions.mjs` and the `npm run check:vercel-functions` command.
- CI now counts deployable source files in `api/`, excluding private underscore-prefixed files/folders and TypeScript declaration files as specified by Vercel's file routing rules.
- The guardrail fails if a test/spec file is placed in a routable `api/` location or if the number of deployable API handlers exceeds the Hobby limit of 12.
- Current source count is eight deployable API handlers. Tests remain in `tests/api/`; shared helpers/tests remain in the private `api/_lib/` directory.
- This guardrail catches future accidental route creation before deployment; it does not replace a successful Vercel Preview build.

## Webhook inbound lease ownership guard — 2026-11-24
- Review found the public Asaas webhook's completion and failure updates matched only `provider_event_id` and `processing_status='processing'`, unlike the admin replay route which already compared `processing_started_at`.
- This could let an older, delayed delivery finalize a webhook event after a retry had acquired a newer processing lease.
- The route now records the exact timestamp returned by the successful lease claim and includes it in both success and failure finalization filters.
- Added automated tests covering lease ownership on successful processing and failed processing.
- The transaction RPCs already use event timestamps/IDs for idempotency; this route-level guard additionally prevents an obsolete execution from clearing a newer lease.

## Public webhook lease duration and ownership response — 2026-11-24
- Aligned public duplicate-webhook lease recovery with the admin recovery route: both now wait 15 minutes before taking over a stale processing lease. The public route previously used only five minutes and could trigger unnecessary concurrent retries on slow processing.
- Public webhook completion now selects the updated row and confirms that the caller still owns the exact `processing_started_at` lease.
- If the lease was taken by a newer execution, the route returns HTTP 202 with `processing: true` instead of falsely reporting the event as fully processed.
- Added a regression test for lease loss during finalization; existing success/failure ownership tests remain.

## Public webhook lease TTL regression coverage — 2026-11-24
- Extracted the public route's 15-minute stale-lease decision into a small pure helper.
- Added deterministic tests for a lease at 14m59s (not stale), exactly 15 minutes (stale), and an invalid timestamp (not automatically reclaimed).

## Asaas subscription-wide event timeline — 2026-11-24
- Introduced `apply_asaas_payment_event` ordering across the local subscription, not merely within one provider payment ID. The database row lock serializes different payment IDs for one subscription.
- Older events from a different payment can no longer rewind the billing period or entitlement after a newer subscription event.
- Terminal subscription states (`canceled`, `suspended`, `expired`) cannot be restored by a later payment confirmation. Such a payment is still recorded for audit/reconciliation, but does not reactivate access.
- Added checks that payment plan, amount, provider subscription ID, and customer ID match the local subscription.
- Applied migration `20261124200921` to homologation only. Verified both transaction functions retain `SECURITY DEFINER`, `search_path=public`, and EXECUTE only for `service_role`/postgres.
- Homologation records remain unchanged: 2 existing auth users and 2 billing accounts; 0 subscriptions, 0 billing customers, 0 payments, and 0 webhook events.

## Administrative webhook replay lease ownership — 2026-11-24
- Administrative replay now checks that the final UPDATE returned the event row before reporting success.
- Failed replays likewise confirm that the same execution still owns the lease before reporting a processing failure.
- If a newer invocation has taken the lease, the old invocation reports the event as skipped rather than stale success or stale failure.
- Added success and failure regression tests for the lease-takeover case.

## Final recovery verification — 2026-11-24 20:15 UTC

### Latest branch and CI
- Current recovery branch head at this verification: `7b3aa5d177aab4d5a579e55e58e08478a79586e5`.
- GitHub Actions run `45478708072` completed successfully.
- All gates passed: locked install, Vercel function count, full dependency audit, production dependency audit, TypeScript, all 55 tests, Vite build, and audit artifact upload.
- Current deployable API route count is 8 of the Hobby limit 12.
- `main` remains at `a5b6fbc1676d6b739e7015c82dbfbc7daebdc2e3`; it was not changed.

### Webhook lease ownership
- Both public Asaas webhook and admin replay routes now confirm that the final UPDATE returned the event row while the invocation still owned the exact `processing_started_at` lease.
- If a newer invocation took ownership, an old invocation reports the event as skipped/processing rather than stale success or stale failure.
- Public and admin recovery both use a 15-minute lease TTL.
- Regression coverage includes: 14m59s not stale, exactly 15m stale, invalid timestamps non-reclaimable, public lease loss on success/failure, and administrative replay lease loss on success/failure.

### Transactional event ordering proof in homologation
A single explicit `BEGIN ... ROLLBACK` SQL test was executed against `eerqeimqzkgdpvutjfhm`. It temporarily used an existing billing-account owner ID to create synthetic subscription/payment rows only inside the transaction, then rolled the entire transaction back. Assertions passed:
1. a confirmed payment activated a pending subscription;
2. a later `SUBSCRIPTION_DELETED` event canceled the subscription and suspended access;
3. a still-later payment for a different payment ID was recorded but did not resurrect the canceled subscription or restore access;
4. an older overdue payment event was ignored by the subscription-wide timeline;
5. an older subscription update was ignored after the newer payment event.

Post-rollback counts confirmed no test data remained:
- Homologation: 2 Auth users, 2 billing accounts, 0 subscriptions, 0 billing customers, 0 payments, 0 webhook events.
- Production: 2 Auth users, 0 billing accounts, 0 subscriptions, 0 billing customers, 0 payments, 0 webhook events.
No Auth users were created or changed, and no production records were modified.

### Applied homologation migration
- Migration version `20261124200921` is recorded in Supabase homologation.
- Its source file is `supabase/migrations/20261124200921_unify_asaas_event_ordering_for_subscription_entitlements.sql`; the filename was aligned with the actual recorded version to avoid a later duplicate migration attempt.
- Production migration history and database were not changed by this migration.
- RPC ACL recheck: both transaction functions remain `SECURITY DEFINER`, `search_path=public`; `anon` and `authenticated` cannot execute; `service_role` and postgres can.

### Current Vercel Preview state
- Latest READY Preview observed: `dpl_E7ck72mLc2WPVy4X1jk3NqE9VGxB`, commit `52859cbf88141fb7bc2541362b2cd6756ed4c7cc`.
- Build log confirms `npm install --include=dev`, zero npm audit vulnerabilities, Vite build completed, TypeScript function scanning emitted no TS2688 errors, and the deployment reached READY.
- The current branch head `7b3aa5d` is newer than that Preview; there is no deployment for the current head yet.
- Vercel Git status for the current branch reports `Deployment rate limited — retry in 24 hours` (Hobby daily deployment cap). Do not bypass the cap or purchase an upgrade without a separate cost decision.
- Project Deployment Protection is SSO-enabled for all non-custom deployment domains. The Preview's `.vercel.app` URL is therefore protected. An external Asaas webhook cannot complete an end-to-end call to this URL by presenting only `ASAAS_WEBHOOK_TOKEN`; Vercel SSO intercepts the request before the function. Do not disable SSO. A separately approved branch-specific custom domain / DNS arrangement or another reviewed public webhook ingress is required before provider delivery tests.

### Remaining blockers that require external access or explicit decisions
1. A Preview for the exact current branch head `7b3aa5d` remains pending Vercel's daily deployment quota.
2. Preview runtime HTTP validation is blocked by SSO because no Vercel CLI session / trusted OIDC header is available in this environment.
3. No synthetic Supabase Auth user was created; the available Supabase tools do not expose Auth Admin createUser. Do not insert directly into `auth.users`.
4. Preview secret variables exist and are scoped to Sandbox/homologation, but their values were not exposed and their validity was not checked. No authenticated `/api/admin/billing-health` call was possible.
5. No Asaas Sandbox customer, subscription, payment or webhook was created or called.
6. Production has only its frontend Supabase key, `SUPABASE_URL`, and `ASAAS_ENVIRONMENT=production`; production server-side Supabase key, live Asaas API key, and webhook token are absent. Do not copy Preview credentials into Production.
7. Six historical SQL sources were recovered from the database migration registry and archived under `supabase/recovered-history/` by environment. The remaining issue is migration-stream reconciliation: keep them out of `supabase/migrations/` until an environment-specific baseline/repair plan is approved.
8. Security Advisor continues to show only `auth_leaked_password_protection` disabled in each Supabase project. Enabling it requires a plan that supports the feature; no plan upgrade was performed.
9. A >500 KB minified frontend chunk warning remains in the Vite build. This is a performance optimization item, not a build failure.

### Production release remains prohibited
No Production deployment, domain alias change, Production migration, live payment, or Asaas webhook POST was performed. Keep `main`, Production databases, domains, and live payment credentials untouched until a separate controlled-release approval.

## Historical migration sources recovered — 2026-11-24 20:20 UTC
- The six historical SQL files previously absent from Git were recovered from the authoritative `supabase_migrations.schema_migrations.statements` arrays in the production and homologation databases.
- Exact statements are archived by source environment under `supabase/recovered-history/production/` and `supabase/recovered-history/homologation/`.
- They are deliberately excluded from `supabase/migrations/`. Production and homologation have different historical migration version streams; placing both histories in the active folder could make a future push execute another environment's non-idempotent DDL.
- This resolves the loss of historical source content, but not the environment-specific migration reconciliation. Do not run a blanket `supabase db push`; a reviewed baseline/repair workflow is still required.

## Administrative webhook replay ownership — 2026-11-24
- Admin replay success and failure finalization now both select the updated event row and confirm that the same invocation still owns the exact lease timestamp.
- When a newer invocation took ownership, the earlier replay is reported as skipped instead of stale success/failure.
- Added regression tests for successful and failed administrative replay losing the lease.

## Current end-to-end readiness — 2026-11-24 20:20 UTC
- Recovery branch head before this documentation update: `7b3aa5d177aab4d5a579e55e58e08478a79586e5`; GitHub Actions run `45478708072` passed all gates, including 55 tests.
- Latest READY Vercel Preview remains commit `52859cbf88141fb7bc2541362b2cd6756ed4c7cc`; its build log no longer contains TS2688 and confirms Vite output deployment. This is not the current branch head.
- Current-head Vercel status remains rate-limited for 24 hours by the Hobby daily deployment cap. The .vercel.app Preview is also SSO-protected, so the Asaas provider cannot call its webhook URL unless a separately approved public ingress/custom-domain protection arrangement is established.
- No Vercel SSO protection was disabled, no custom domain or DNS record was changed, and no paid resource was created.
- Production snapshot at this check: 2 Auth users, 0 billing accounts, 0 subscriptions, 0 billing customers, 0 payments, 0 webhook events. Production server Supabase key, live Asaas API key, and webhook token remain absent.
- Homologation snapshot remains 2 Auth users, 2 billing accounts, and 0 subscriptions/customers/payments/webhook events.

## Recovered migration archive integrity — 2026-11-24
- All six archived SQL files were compared byte-for-byte with the original `statements` text from their source database's `supabase_migrations.schema_migrations` record.
- All six exact-content comparisons passed; recorded file lengths and source statement lengths were identical.
- The archived SQL files remain outside the active migration path.
