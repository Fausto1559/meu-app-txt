
create table public.financial_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  records jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint financial_records_records_is_array
    check (jsonb_typeof(records) = 'array')
);

create table public.card_machines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  machines jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint card_machines_machines_is_array
    check (jsonb_typeof(machines) = 'array')
);

alter table public.financial_records enable row level security;
alter table public.card_machines enable row level security;

create policy "Users manage own financial records"
  on public.financial_records
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own card machines"
  on public.card_machines
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on table public.financial_records to authenticated;
grant select, insert, update, delete
  on table public.card_machines to authenticated;
