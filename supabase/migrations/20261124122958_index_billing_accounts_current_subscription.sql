create index if not exists billing_accounts_current_subscription_idx
on public.billing_accounts (current_subscription_id)
where current_subscription_id is not null;
