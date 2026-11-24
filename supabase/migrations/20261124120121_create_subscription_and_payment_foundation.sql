create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'asaas' check (length(btrim(provider)) between 1 and 40),
  provider_subscription_id varchar(200),
  plan_key varchar(80) not null check (length(btrim(plan_key)) between 1 and 80),
  status varchar(24) not null default 'pending'
    check (status in ('pending','active','overdue','canceled','expired','suspended')),
  billing_type varchar(40),
  value numeric(12,2) not null check (value >= 0),
  next_due_date date,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_provider_subscription_unique unique (provider, provider_subscription_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'asaas' check (length(btrim(provider)) between 1 and 40),
  provider_payment_id varchar(200),
  provider_subscription_id varchar(200),
  status varchar(32) not null default 'pending'
    check (status in ('pending','confirmed','received','overdue','canceled','refunded','chargeback','failed')),
  billing_type varchar(40),
  value numeric(12,2) not null check (value >= 0),
  net_value numeric(12,2) check (net_value is null or net_value >= 0),
  due_date date,
  payment_date timestamptz,
  invoice_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_payment_unique unique (provider, provider_payment_id)
);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);
create index if not exists payments_user_created_at_idx
  on public.payments (user_id, created_at desc);
create index if not exists payments_subscription_idx
  on public.payments (subscription_id);
create index if not exists payments_provider_subscription_idx
  on public.payments (provider, provider_subscription_id);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

create policy "deny client access to subscriptions"
on public.subscriptions for all to anon, authenticated
using (false) with check (false);

create policy "deny client access to payments"
on public.payments for all to anon, authenticated
using (false) with check (false);
