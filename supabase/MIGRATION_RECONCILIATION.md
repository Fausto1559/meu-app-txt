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

The first two historical versions were not present as migration files in the inspected recovery branch. The later versions were recorded in this branch, including the production-specific 20261124141736 version.

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

The first four historical versions were not present as migration files in the inspected recovery branch. Later versions are represented in this branch, including the homologation-specific 20261124141739 version.

## Operational rule

Do not run a blanket migration push against either existing database until the missing historical SQL is recovered or a reviewed baseline/repair plan is prepared. Database schemas and RLS policies were inspected independently; their current security policies for financial records, card machines, admin tables, billing tables and webhook events were consistent across the two environments at inspection time.

The production and homologation subscription-index migrations have different versions because the databases recorded different migration timestamps. Both SQL files intentionally create the same index idempotently with IF NOT EXISTS.

## Extended repository search — 2026-11-24

The available repository branches were checked:
- `main`
- `main-estavel`
- `recuperacao/build-2026-11-05`

The trees of `main` and `main-estavel` contain no `supabase/migrations/*.sql` files. The recovery branch contains the later migration files listed above, but not the six historical SQL files identified in the database histories. Exact-path commit searches for those six missing files returned no commits.

This means the missing migration history could not be recovered from any currently available branch or path history. Do not reconstruct old migration files from their names or current schema. A separately reviewed baseline or schema-diff repair plan is required before attempting to make the repository fully reproducible.

## Performance advisor findings

The Supabase Performance Advisor reported unused-index INFO notices (16 in production and 10 in homologation at inspection time). The billing tables are not yet carrying representative production workload. These notices do not prove that the indexes are unnecessary; retain them until query plans and workload metrics show that removal is beneficial and safe.

## Current environment boundary

- Production Supabase URL points to `genbxhvhmrgyflptnrpi`.
- Recovery Preview Supabase URL points to `eerqeimqzkgdpvutjfhm`.
- The recovery Preview has a branch-scoped `SUPABASE_SERVICE_ROLE_KEY`; it must only be used with the homologation project.
- Production currently has no server-side Supabase secret key and no Asaas production API/webhook credentials. Do not copy the homologation key into Production.
