# Production security gap — webhook and server routes

Inspection date: 2026-11-24  
Project: `meu-app-txt`  
Production project: `prj_QQCWl5XprCHmyItlL8fSTFSluMN6`  
Production deployment serving the custom domain: `dpl_AHBcx7iZa19VBWw6XLg6ku7en2z4`  
Published commit: `c4eda33ca3026cc2fc6fa994735d1ac547efa866` on `main`  
Recovery branch: `recuperacao/build-2026-11-05`  
Recovery deployment: `dpl_2cRQwN4F4gk3AYvLq5GQrRMjANGV`  
Recovery commit: `bd8ca10ebaefd4b277410c2df263170b5a830319`

## Confirmed production behavior

The verified custom domain `www.copilotofinanc.app.br` currently serves production deployment `dpl_AHBcx7iZa19VBWw6XLg6ku7en2z4`, not the recovery branch.

Direct read-only HTTP checks on 2026-11-24 returned:
- `GET /`: HTTP 200.
- `GET /api/billing/status`: HTTP 404.
- `GET /api/admin/me`: HTTP 404.
- `GET /api/billing/checkout`: HTTP 404.
- `GET /api/webhook`: HTTP 200 with a legacy event-list response.
- `GET /api/webhooks`: the legacy route is a POST-only in-memory deduplication handler in the published source.

The published `api/webhook.ts` at commit `c4eda33`:
- Keeps its event records only in a process-local array.
- Allows unauthenticated GET requests to read the array.
- Accepts POST payloads without validating a provider signature or token.
- Fills missing fields with sample defaults (including a sample email and amount).
- Does not persist events to Supabase and does not verify or activate subscriptions.

The published `api/webhooks.ts` checks `WEBHOOK_SECRET` only when that environment variable exists. The Vercel Production environment was inspected and `WEBHOOK_SECRET` is absent. Therefore this legacy route has no signature check in the current Production configuration. Its handler only stores event IDs in a process-local Set and returns an acknowledgement; it does not activate a plan or persist payment records.

These legacy handlers must not be treated as a live payment integration or as proof of webhook authenticity. No POST event or payment was sent during this inspection.

## Recovery branch behavior

In the current recovery source:
- `api/webhook.ts` accepts POST only.
- It requires `ASAAS_WEBHOOK_TOKEN` with a minimum length of 32 characters and rejects a bad token with HTTP 401.
- It requires server-side Supabase credentials before accepting an event; otherwise it returns HTTP 503.
- It validates event identifiers and event families, persists the payload in `webhook_events`, reserves processing with a database state transition, and handles duplicate events.
- `api/webhooks.ts` is disabled and returns HTTP 410.
- `api/billing/status`, `api/billing/checkout`, and `api/admin/me` exist and require the appropriate authenticated server-side path.

The recovery Preview at `dpl_2cRQwN4F4gk3AYvLq5GQrRMjANGV` is READY and serves the application shell with HTTP 200. Read-only GET checks confirm the new checkout and webhook routes reject unsupported methods with HTTP 405, and the legacy `/api/webhooks` route returns HTTP 410. The protected authentication routes could not be fetched by the current inspection client because Vercel's deployment SSO still required an authenticated redirect; do not mistake this for an application 401.

## Production environment gap

Confirmed absent from Vercel Production:
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- `ASAAS_API_KEY`.
- `ASAAS_WEBHOOK_TOKEN`.
- Legacy `WEBHOOK_SECRET`.

The branch-scoped Preview has a Supabase server key and Asaas Sandbox credentials. Those values are environment-scoped to recovery Preview and must not be copied to Production.

## Required release gate

Do not promote the recovery deployment until all of the following are complete:
1. Add a production Supabase server key generated for project `genbxhvhmrgyflptnrpi`.
2. Add a live Asaas Production API key.
3. Configure the same high-entropy webhook token in Vercel Production and the Asaas webhook settings.
4. Validate the protected Preview with an authenticated test account and verify admin membership authorization.
5. Run an end-to-end Asaas Sandbox event test and verify persistence, duplicate handling, payment state transitions, and access gating.
6. Review the migration reconciliation and the differences between production's compatibility columns/triggers and homologation's schema.
7. Approve a controlled Production release explicitly.

Do not add or restore the old `WEBHOOK_SECRET` as a substitute for `ASAAS_WEBHOOK_TOKEN`. Do not manually test the legacy production POST endpoint because it accepts unauthenticated payloads and can create misleading in-memory events. Do not promote the Preview or modify the Production database without the explicit release decision.

## Current disposition

<badge>CRITICAL — PRODUCTION RELEASE BLOCKED</badge>

The recovery branch is CI-green and deployed to a protected Preview. Production is still running the older `main` deployment and does not expose the new billing/admin routes. No Production deployment, alias change, payment, webhook POST, or database mutation was performed.

## Latest recovery CI and source cleanup

The latest verified recovery commit is `c34f5a8ceab5a6482be7c084eed2d02d35a921d7`. CI passed with 55 tests in 13 files, zero vulnerabilities in both full and production dependency audits, TypeScript typecheck and build. Direct Firebase runtime dependencies were removed from the recovery manifest/lockfile after no executable Firebase imports were found.

A cloud data-load failure in the app was also corrected to provide an explicit retry and sign-out path. The test suite covers this recovery behavior.

## Latest Preview status

Preview `dpl_2cRQwN4F4gk3AYvLq5GQrRMjANGV` remains READY but targets commit `bd8ca10ebaefd4b277410c2df263170b5a830319`, preceding the dependency cleanup and cloud retry fix. A new Preview deployment for `c34f5a8ceab5a6482be7c084eed2d02d35a921d7` was rejected by Vercel with HTTP 402 (`api-deployments-free-per-day`, retry after 86400 seconds). The production alias and deployment remain untouched.
