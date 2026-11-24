-- Applied to production on 2026-11-24.
create or replace function public.sync_subscription_billing_compat_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.plan_key is null then new.plan_key := new.plan_code; end if;
  if new.plan_code is null then new.plan_code := new.plan_key; end if;
  if new.value is null then new.value := new.amount; end if;
  if new.amount is null then new.amount := new.value; end if;
  return new;
end;
$$;

drop trigger if exists sync_subscription_billing_compat_columns on public.subscriptions;
create trigger sync_subscription_billing_compat_columns
before insert or update of plan_key, plan_code, value, amount
on public.subscriptions
for each row execute function public.sync_subscription_billing_compat_columns();

create or replace function public.sync_payment_billing_compat_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.value is null then new.value := new.amount; end if;
  if new.amount is null then new.amount := new.value; end if;
  if new.payment_date is null then new.payment_date := new.paid_at; end if;
  if new.paid_at is null then new.paid_at := new.payment_date; end if;
  return new;
end;
$$;

drop trigger if exists sync_payment_billing_compat_columns on public.payments;
create trigger sync_payment_billing_compat_columns
before insert or update of value, amount, payment_date, paid_at
on public.payments
for each row execute function public.sync_payment_billing_compat_columns();

create unique index if not exists payments_provider_payment_composite_uidx
on public.payments(provider, provider_payment_id)
where provider_payment_id is not null;
