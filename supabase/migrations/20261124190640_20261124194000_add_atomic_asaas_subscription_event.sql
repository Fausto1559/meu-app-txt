-- Atomic application of Asaas subscription lifecycle events.
create or replace function public.apply_asaas_subscription_event(
  p_provider_subscription_id text,
  p_provider_customer_id text,
  p_next_due_date date,
  p_event_time timestamptz,
  p_event_id text,
  p_event_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_previous_event_time timestamptz;
  v_next_status text;
begin
  if p_provider_subscription_id is null or btrim(p_provider_subscription_id) = ''
     or p_event_time is null or p_event_id is null or btrim(p_event_id) = ''
     or p_event_name not in ('SUBSCRIPTION_CREATED','SUBSCRIPTION_UPDATED','SUBSCRIPTION_INACTIVATED','SUBSCRIPTION_DELETED') then
    raise exception 'Invalid Asaas subscription event arguments';
  end if;

  select * into v_subscription
    from public.subscriptions
   where provider = 'asaas'
     and provider_subscription_id = p_provider_subscription_id
   for update;

  if not found then
    raise exception 'Local Asaas subscription not found';
  end if;

  if p_provider_customer_id is not null
     and v_subscription.provider_customer_id is not null
     and p_provider_customer_id <> v_subscription.provider_customer_id then
    raise exception 'Asaas customer does not match local subscription';
  end if;

  begin
    v_previous_event_time := nullif(v_subscription.metadata->>'lastEventDate','')::timestamptz;
  exception when others then
    v_previous_event_time := null;
  end;

  if v_previous_event_time is not null and p_event_time < v_previous_event_time then
    return 'ignored';
  end if;

  if p_event_name in ('SUBSCRIPTION_INACTIVATED','SUBSCRIPTION_DELETED') then
    v_next_status := 'canceled';
  elsif v_subscription.status in ('canceled','suspended','expired') then
    v_next_status := v_subscription.status;
  elsif v_subscription.status = 'active' then
    v_next_status := 'active';
  else
    v_next_status := 'pending';
  end if;

  update public.subscriptions
     set status = v_next_status,
         next_due_date = coalesce(p_next_due_date, next_due_date),
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
           'lastEvent', p_event_name,
           'lastEventDate', p_event_time,
           'asaasEventId', p_event_id
         ),
         updated_at = now()
   where id = v_subscription.id;

  if v_next_status = 'canceled' then
    update public.billing_accounts
       set access_status = 'suspended',
           updated_at = now()
     where user_id = v_subscription.user_id
       and current_subscription_id = v_subscription.id;
  end if;

  return 'applied';
end;
$$;

revoke all on function public.apply_asaas_subscription_event(
  text, text, date, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.apply_asaas_subscription_event(
  text, text, date, timestamptz, text, text
) to service_role;
