-- Keep Asaas payment and subscription events on one monotonic timeline
-- per local subscription. A late payment from a different payment ID must not
-- rewind a billing period or restore access after a subscription was canceled.
create or replace function public.apply_asaas_payment_event(
  p_payment jsonb,
  p_subscription_id uuid,
  p_user_id uuid,
  p_plan_key text,
  p_payment_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
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
  v_previous_payment_metadata jsonb;
  v_previous_payment_event_time timestamptz;
  v_previous_subscription_event_time timestamptz;
  v_payment_id text;
  v_subscription public.subscriptions%rowtype;
  v_event_metadata jsonb;
  v_payment_value numeric;
  v_payment_provider_subscription_id text;
  v_payment_provider_customer_id text;
begin
  if p_payment is null or jsonb_typeof(p_payment) <> 'object'
     or p_subscription_id is null or p_user_id is null
     or p_plan_key is null or btrim(p_plan_key) = ''
     or p_payment_status is null
     or p_event_time is null or p_event_id is null or btrim(p_event_id) = ''
     or p_event_name is null or btrim(p_event_name) = '' then
    raise exception 'Invalid Asaas payment event arguments';
  end if;

  if p_payment_status not in (
    'pending','confirmed','received','overdue','canceled',
    'refunded','partially_refunded','chargeback','failed'
  ) then
    raise exception 'Unsupported Asaas payment status';
  end if;

  v_payment_id := nullif(btrim(p_payment->>'provider_payment_id'), '');
  if v_payment_id is null then
    raise exception 'Missing provider payment identifier';
  end if;

  v_payment_value := nullif(p_payment->>'value', '')::numeric;
  if v_payment_value is null or v_payment_value < 0 then
    raise exception 'Invalid Asaas payment value';
  end if;

  v_payment_provider_subscription_id := nullif(p_payment->>'provider_subscription_id', '');
  v_payment_provider_customer_id := nullif(p_payment->>'provider_customer_id', '');

  if p_payment_status in ('confirmed','received')
     and (p_period_start is null or p_period_end is null or p_period_end <= p_period_start) then
    raise exception 'Invalid paid subscription period';
  end if;

  -- Serialize all events for this provider payment, including the first insert.
  perform pg_advisory_xact_lock(
    hashtextextended('asaas-payment:' || v_payment_id, 0)
  );

  select metadata
    into v_previous_payment_metadata
    from public.payments
   where provider = 'asaas'
     and provider_payment_id = v_payment_id
   for update;

  if found then
    begin
      v_previous_payment_event_time :=
        nullif(v_previous_payment_metadata->>'lastEventDate', '')::timestamptz;
    exception when others then
      v_previous_payment_event_time := null;
    end;

    if v_previous_payment_event_time is not null
       and p_event_time < v_previous_payment_event_time then
      return 'ignored';
    end if;
  end if;

  -- Lock the local subscription so events for different payment IDs serialize
  -- against the same subscription lifecycle timeline.
  select *
    into v_subscription
    from public.subscriptions
   where id = p_subscription_id
     and user_id = p_user_id
     and provider = 'asaas'
   for update;

  if not found then
    raise exception 'Local Asaas subscription not found for payment';
  end if;

  if v_subscription.plan_key <> p_plan_key then
    raise exception 'Payment plan does not match local subscription';
  end if;

  if abs(v_payment_value - v_subscription.value) > 0.001 then
    raise exception 'Payment value does not match local subscription';
  end if;

  if v_payment_provider_subscription_id is not null
     and v_subscription.provider_subscription_id is not null
     and v_payment_provider_subscription_id <> v_subscription.provider_subscription_id then
    raise exception 'Asaas payment subscription does not match local subscription';
  end if;

  if v_payment_provider_customer_id is not null
     and v_subscription.provider_customer_id is not null
     and v_payment_provider_customer_id <> v_subscription.provider_customer_id then
    raise exception 'Asaas payment customer does not match local subscription';
  end if;

  begin
    v_previous_subscription_event_time :=
      nullif(v_subscription.metadata->>'lastEventDate', '')::timestamptz;
  exception when others then
    v_previous_subscription_event_time := null;
  end;

  -- Compare against the latest event of any kind on the subscription, not
  -- only the latest event for this individual payment ID.
  if v_previous_subscription_event_time is not null
     and p_event_time < v_previous_subscription_event_time then
    return 'ignored';
  end if;

  v_event_metadata := jsonb_build_object(
    'lastEvent', p_event_name,
    'lastEventDate', p_event_time,
    'asaasEventId', p_event_id
  );

  insert into public.payments (
    user_id, subscription_id, provider, provider_payment_id,
    provider_subscription_id, provider_customer_id, external_reference,
    status, billing_type, value, net_value, due_date, payment_date,
    invoice_url, metadata, updated_at
  ) values (
    p_user_id,
    p_subscription_id,
    'asaas',
    v_payment_id,
    v_payment_provider_subscription_id,
    v_payment_provider_customer_id,
    nullif(p_payment->>'external_reference', ''),
    p_payment_status,
    nullif(p_payment->>'billing_type', ''),
    v_payment_value,
    nullif(p_payment->>'net_value', '')::numeric,
    nullif(p_payment->>'due_date', '')::date,
    nullif(p_payment->>'payment_date', '')::timestamptz,
    nullif(p_payment->>'invoice_url', ''),
    v_event_metadata,
    now()
  )
  on conflict (provider, provider_payment_id) do update
    set user_id = excluded.user_id,
        subscription_id = excluded.subscription_id,
        provider_subscription_id = excluded.provider_subscription_id,
        provider_customer_id = excluded.provider_customer_id,
        external_reference = excluded.external_reference,
        status = excluded.status,
        billing_type = excluded.billing_type,
        value = excluded.value,
        net_value = excluded.net_value,
        due_date = excluded.due_date,
        payment_date = excluded.payment_date,
        invoice_url = excluded.invoice_url,
        metadata = excluded.metadata,
        updated_at = now();

  -- A paid event may update access only while this subscription is not in a
  -- terminal state. A later payment notification must not resurrect a
  -- canceled, suspended, or expired subscription.
  if p_payment_status in ('confirmed','received') then
    if v_subscription.status in ('canceled','suspended','expired') then
      update public.subscriptions
         set metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
             updated_at = now()
       where id = p_subscription_id;
    else
      update public.subscriptions
         set status = 'active',
             current_period_start = p_period_start,
             current_period_end = p_period_end,
             metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
             updated_at = now()
       where id = p_subscription_id;

      update public.billing_accounts
         set access_status = 'active',
             current_plan_key = p_plan_key,
             current_subscription_id = p_subscription_id,
             updated_at = now()
       where user_id = p_user_id;

      if not found then
        raise exception 'Billing account not found for payment';
      end if;
    end if;
  elsif p_payment_status = 'overdue' then
    if v_subscription.status in ('canceled','suspended','expired') then
      update public.subscriptions
         set metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
             updated_at = now()
       where id = p_subscription_id;
    else
      update public.subscriptions
         set status = 'overdue',
             metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
             updated_at = now()
       where id = p_subscription_id;

      update public.billing_accounts
         set access_status = 'past_due',
             updated_at = now()
       where user_id = p_user_id
         and current_subscription_id = p_subscription_id;
    end if;
  elsif p_payment_status in (
    'refunded','partially_refunded','chargeback','failed','canceled'
  ) then
    update public.subscriptions
       set status = case
             when status in ('canceled','suspended','expired') then status
             when p_payment_status = 'canceled' then 'canceled'
             else 'suspended'
           end,
           metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
           updated_at = now()
     where id = p_subscription_id;

    update public.billing_accounts
       set access_status = 'suspended',
           updated_at = now()
     where user_id = p_user_id
       and current_subscription_id = p_subscription_id;
  else
    -- Pending/created events still advance the shared timeline without
    -- changing a paid or terminal entitlement state.
    update public.subscriptions
       set metadata = coalesce(metadata, '{}'::jsonb) || v_event_metadata,
           updated_at = now()
     where id = p_subscription_id;
  end if;

  return 'applied';
end;
$$;

revoke all on function public.apply_asaas_payment_event(
  jsonb, uuid, uuid, text, text, timestamptz, timestamptz, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.apply_asaas_payment_event(
  jsonb, uuid, uuid, text, text, timestamptz, timestamptz, timestamptz, text, text
) to service_role;
