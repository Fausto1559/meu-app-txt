
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_code text not null,
  status text not null default 'pending'
    check (status in ('pending','active','overdue','canceled','expired','refunded')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_payment_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending','confirmed','overdue','canceled','refunded','chargeback')),
  billing_type text,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_subscription_id_idx on public.payments(subscription_id);
create index if not exists payments_status_idx on public.payments(status);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_event_id text not null unique,
  event_type text not null,
  provider_payment_id text,
  processing_status text not null default 'received'
    check (processing_status in ('received','processing','processed','failed','ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists webhook_events_payment_idx on public.webhook_events(provider_payment_id);
create index if not exists webhook_events_status_idx on public.webhook_events(processing_status);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;

revoke all on public.subscriptions from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.payments to authenticated;

drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
on public.subscriptions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments"
on public.payments for select to authenticated
using (auth.uid() = user_id);
