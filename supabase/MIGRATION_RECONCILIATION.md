# Supabase migration reconciliation

Inspection date: 2026-11-24
Repository branch: recuperacao/build-2026-11-05

This file records verified database migration history versus files present in this branch.
It intentionally does not fabricate historical SQL.

## Production project: genbxhvhmrgyflptnrpi

Verified database migration history:
- 20261118101033 secure_user_financial_persistence
- 20261118101616 create_asaas_billing_and_webhook_tables
- 20261124135947 explicitly_deny_client_access_to_legacy_transactions_and_webhook_events
- 20261124141322 align_production_admin_and_server_managed_billing_schema
- 20261124141335 bridge_legacy_billing_columns_for_recovery_api
- 20261124141351 remove_conflicting_billing_read_policies_and_index_foreign_keys
- 20261124141421 provision_confirmed_primary_owner_membership
- 20261124141736 prevent_multiple_open_subscriptions_per_user

The first two historical versions were absent from Git history but their original SQL statements have now been recovered from the database migration registry and archived under supabase/recovered-history/production/. The later versions were recorded in this branch, including the production-specific 20261124141736 version.

## Homologation project: eerqeimqzkgdpvutjfhm

Verified database migration history:
- 20261118172905 create_financial_tables_with_user_rls
- 20261118173002 restrict_financial_tables_to_authenticated
- 20261123150254 create_admin_authorization_tables
- 20261123150310 restrict_admin_audit_log_mutations
- 20261124120015 harden_admin_and_webhook_rls
- 20261124120121 create_subscription_and_payment_foundation
- 20261124122611 add_server_managed_billing_accounts_and_customers
- 20261124122958 index_billing_accounts_current_subscription
- 20261124123100 constrain_subscription_plan_keys
- 20261124140102 revoke_client_privileges_on_server_managed_billing_tables
- 20261124141739 prevent_multiple_open_subscriptions_per_user

The first four historical versions were absent from Git history but their original SQL statements have now been recovered from the database migration registry and archived under supabase/recovered-history/homologation/. Later versions are represented in this branch, including the homologation-specific 20261124141739 version.

## Operational rule

Do not run a blanket migration push against either existing database. The original historical SQL has been recovered, but production and homologation migration streams diverge. The archived files are deliberately outside supabase/migrations/, so Supabase CLI does not try to execute another environment's historical statements. A reviewed environment-specific baseline/repair plan is still required before making both databases reproducible from one active migration directory. Database schemas and RLS policies were inspected independently.

The production and homologation subscription-index migrations have different versions because the databases recorded different migration timestamps. Both SQL files intentionally create the same index idempotently with IF NOT EXISTS.

## Extended repository search — 2026-11-24

The available repository branches were checked:
- `main`
- `main-estavel`
- `recuperacao/build-2026-11-05`

The trees of main and main-estavel contain no supabase/migrations/*.sql files. The recovery branch contains the later migration files. Exact-path commit searches for the six historical files returned no commits. The SQL source was subsequently recovered directly from the databases' supabase_migrations.schema_migrations.statements arrays.

The six original statements are preserved in supabase/recovered-history/, separated by environment. They are historical source archives, not runnable migrations. They were not inserted into the active migration directory because the version streams differ and some archived statements create objects without IF NOT EXISTS; applying one environment's history to the other could fail or conflict with its later schema.

## Performance advisor findings

At the latest inspection on 2026-11-24, the Performance Advisor reported 15 unused-index INFO notices in production and 5 in homologation. The billing tables are not yet carrying representative production workload. These notices do not prove that the indexes are unnecessary; retain them until query plans and workload metrics show that removal is beneficial and safe. The duplicate payments unique-index finding is resolved in homologation.

## Current environment boundary

- Production Supabase URL points to `genbxhvhmrgyflptnrpi`.
- Recovery Preview Supabase URL points to `eerqeimqzkgdpvutjfhm`.
- The recovery Preview has a branch-scoped `SUPABASE_SERVICE_ROLE_KEY`; it must only be used with the homologation project.
- Production currently has no server-side Supabase secret key and no Asaas production API/webhook credentials. Do not copy the homologation key into Production.


## Historical SQL recovery from database metadata — 2026-11-24

The missing six SQL sources have been recovered from the authoritative `supabase_migrations.schema_migrations.statements` arrays. Each database returned the original version, migration name, statement text, and a null rollback field. The recovered files are stored by source environment:

- Production: `supabase/recovered-history/production/` (2 files).
- Homologation: `supabase/recovered-history/homologation/` (4 files).

`supabase/recovered-history/README.md` explains why they are archival and must not be moved into the active migration runner without an environment-specific reconciliation plan. No SQL from these archives was executed during recovery; the only database-side migration applied in this session was the separately reviewed version 20261124200921 on homologation.

## Current database data snapshots — 2026-11-24

- Homologation: 2 Auth users, 2 billing accounts, 0 subscriptions, 0 billing customers, 0 payments, 0 webhook events.
- Production: 2 Auth users, 0 billing accounts, 0 subscriptions, 0 billing customers, 0 payments, 0 webhook events.
- The rollback-only Asaas event-ordering proof left both counts unchanged.
