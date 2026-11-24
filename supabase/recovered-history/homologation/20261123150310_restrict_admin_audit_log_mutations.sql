
revoke all privileges on table public.admin_audit_logs
  from public, anon, authenticated, service_role;

grant select, insert on table public.admin_audit_logs to service_role;
