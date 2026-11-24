-- Applied to production on 2026-11-24.
drop policy if exists "Users read own payments" on public.payments;
drop policy if exists "Users read own subscriptions" on public.subscriptions;

create index if not exists admin_memberships_created_by_idx
  on public.admin_memberships(created_by)
  where created_by is not null;

create index if not exists billing_accounts_current_subscription_id_idx
  on public.billing_accounts(current_subscription_id);
