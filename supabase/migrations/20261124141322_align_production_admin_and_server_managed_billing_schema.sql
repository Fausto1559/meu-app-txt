-- Applied to production on 2026-11-24.
create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin'
    check (role in ('owner','admin','support','analyst')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(btrim(action)) between 1 and 120),
  resource text not null check (length(btrim(resource)) between 1 and 120),
  resource_id text check (resource_id is null or length(resource_id) <= 200),
  result text not null check (result in ('success','denied','error')),
  request_id text check (request_id is null or length(request_id) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_admin_user_id_idx
  on public.admin_audit_logs (admin_user_id);

alter table public.subscriptions
  add column if not exists plan_key varchar(80),
  add column if not exists value numeric(12,2),
  add column if not exists billing_type varchar(40),
  add column if not exists next_due_date date,
  add column if not exists canceled_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists provider_customer_id varchar(200);

update public.subscriptions
set plan_key = coalesce(plan_key, plan_code),
    value = coalesce(value, amount)
where plan_key is null or value is null;

alter table public.subscriptions
  alter column plan_key set not null,
  alter column value set not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending','active','overdue','canceled','expired','suspended','refunded'));

alter table public.subscriptions
  drop constraint if exists subscriptions_metadata_object_check;
alter table public.subscriptions
  add constraint subscriptions_metadata_object_check
  check (jsonb_typeof(metadata) = 'object');

alter table public.payments
  add column if not exists value numeric(12,2),
  add column if not exists billing_type varchar(40),
  add column if not exists net_value numeric(12,2),
  add column if not exists due_date date,
  add column if not exists payment_date timestamptz,
  add column if not exists invoice_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists provider_customer_id varchar(200),
  add column if not exists provider_subscription_id varchar(200),
  add column if not exists external_reference varchar(200);

update public.payments
set value = coalesce(value, amount),
    payment_date = coalesce(payment_date, paid_at)
where value is null or payment_date is null;

alter table public.payments
  alter column value set not null;

alter table public.payments
  drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending','confirmed','received','overdue','canceled','refunded','partially_refunded','chargeback','failed'));

alter table public.payments
  drop constraint if exists payments_metadata_object_check;
alter table public.payments
  add constraint payments_metadata_object_check
  check (jsonb_typeof(metadata) = 'object');

create index if not exists subscriptions_provider_customer_idx
  on public.subscriptions (provider, provider_customer_id);
create index if not exists payments_user_created_at_idx
  on public.payments (user_id, created_at desc);
create index if not exists payments_provider_subscription_idx
  on public.payments (provider, provider_subscription_id);

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'asaas'
    check (length(btrim(provider)) between 1 and 40),
  provider_customer_id varchar(200) not null,
  customer_name text not null,
  customer_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_provider_customer_unique
    unique (provider, provider_customer_id)
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

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "deny client access to admin memberships" on public.admin_memberships;
create policy "deny client access to admin memberships"
  on public.admin_memberships for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "deny client access to admin audit logs" on public.admin_audit_logs;
create policy "deny client access to admin audit logs"
  on public.admin_audit_logs for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "deny client access to billing customers" on public.billing_customers;
create policy "deny client access to billing customers"
  on public.billing_customers for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "deny client access to billing accounts" on public.billing_accounts;
create policy "deny client access to billing accounts"
  on public.billing_accounts for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "deny client access to subscriptions" on public.subscriptions;
create policy "deny client access to subscriptions"
  on public.subscriptions for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "deny client access to payments" on public.payments;
create policy "deny client access to payments"
  on public.payments for all to anon, authenticated
  using (false) with check (false);

revoke all privileges on table
  public.admin_memberships,
  public.admin_audit_logs,
  public.billing_customers,
  public.billing_accounts,
  public.subscriptions,
  public.payments
from anon, authenticated;
