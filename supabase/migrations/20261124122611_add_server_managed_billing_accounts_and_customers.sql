create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'asaas' check (length(btrim(provider)) between 1 and 40),
  provider_customer_id varchar(200) not null,
  customer_name text not null,
  customer_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_provider_customer_unique unique (provider, provider_customer_id)
);

create table if not exists public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  access_status varchar(24) not null default 'trial'
    check (access_status in ('trial','active','expired','past_due','suspended')),
  current_plan_key varchar(40)
    check (current_plan_key is null or current_plan_key in ('essencial','profissional','pro')),
  current_subscription_id uuid references public.subscriptions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists provider_customer_id varchar(200);

alter table public.payments
  add column if not exists provider_customer_id varchar(200),
  add column if not exists external_reference varchar(200);

alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending','confirmed','received','overdue','canceled','refunded','partially_refunded','chargeback','failed'));

create index if not exists subscriptions_provider_customer_idx
  on public.subscriptions (provider, provider_customer_id);
create index if not exists billing_accounts_status_trial_idx
  on public.billing_accounts (access_status, trial_ends_at);

alter table public.billing_customers enable row level security;
alter table public.billing_accounts enable row level security;

create policy "deny client access to billing customers"
on public.billing_customers for all to anon, authenticated
using (false) with check (false);

create policy "deny client access to billing accounts"
on public.billing_accounts for all to anon, authenticated
using (false) with check (false);
