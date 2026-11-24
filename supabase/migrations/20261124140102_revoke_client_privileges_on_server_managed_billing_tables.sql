-- Applied to homologation on 2026-11-24.
-- Billing and customer records are server-managed only. Client access must
-- pass through authenticated backend endpoints using the server-only key.
revoke all privileges on table
  public.admin_memberships,
  public.admin_audit_logs,
  public.billing_customers,
  public.billing_accounts,
  public.subscriptions,
  public.payments,
  public.webhook_events
from anon, authenticated;
