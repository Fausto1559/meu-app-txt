
create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  constraint admin_memberships_role_check
    check (role in ('owner', 'admin', 'support', 'analyst'))
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id text null,
  result text not null,
  request_id text null,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_action_check
    check (length(btrim(action)) between 1 and 120),
  constraint admin_audit_logs_resource_check
    check (length(btrim(resource)) between 1 and 120),
  constraint admin_audit_logs_resource_id_check
    check (resource_id is null or length(resource_id) <= 200),
  constraint admin_audit_logs_result_check
    check (result in ('success', 'denied', 'error')),
  constraint admin_audit_logs_request_id_check
    check (request_id is null or length(request_id) <= 200)
);

create index admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index admin_audit_logs_admin_user_created_at_idx
  on public.admin_audit_logs (admin_user_id, created_at desc);

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all privileges on table public.admin_memberships from public, anon, authenticated;
revoke all privileges on table public.admin_audit_logs from public, anon, authenticated;

grant select, insert, update, delete
  on table public.admin_memberships to service_role;

grant select, insert
  on table public.admin_audit_logs to service_role;
