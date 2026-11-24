-- Atomic Asaas payment application.
-- Apply in homologation first. Production requires the separately approved
-- payments(provider, provider_payment_id) non-partial unique index migration.
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
  v_previous_metadata jsonb;
  v_previous_event_time timestamptz;
  v_payment_id text;
begin
  if p_payment is null or jsonb_typeof(p_payment) <> 'object'
     or p_subscription_id is null or p_user_id is null
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

  v_payment_id := p_payment->>'provider_payment_id';
  if v_payment_id is null or btrim(v_payment_id) = '' then
    raise exception 'Missing provider payment identifier';
  end if;

  -- Serialize all events for this provider payment, including the first insert.
  perform pg_advisory_xact_lock(
    hashtextextended('asaas-payment:' || v_payment_id, 0)
  );

  select metadata
    into v_previous_metadata
    from public.payments
   where provider = 'asaas'
     and provider_payment_id = v_payment_id
   for update;

  if found then
    begin
      v_previous_event_time := nullif(v_previous_metadata->>'lastEventDate', '')::timestamptz;
    exception when others then
      v_previous_event_time := null;
    end;

    if v_previous_event_time is not null and p_event_time < v_previous_event_time then
      return 'ignored';
    end if;
  end if;

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
    nullif(p_payment->>'provider_subscription_id', ''),
    nullif(p_payment->>'provider_customer_id', ''),
    nullif(p_payment->>'external_reference', ''),
    p_payment_status,
    nullif(p_payment->>'billing_type', ''),
    (p_payment->>'value')::numeric,
    nullif(p_payment->>'net_value', '')::numeric,
    nullif(p_payment->>'due_date', '')::date,
    nullif(p_payment->>'payment_date', '')::timestamptz,
    nullif(p_payment->>'invoice_url', ''),
    jsonb_build_object(
      'lastEvent', p_event_name,
      'lastEventDate', p_event_time,
      'asaasEventId', p_event_id
    ),
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

  -- Keep the subscription and entitlement change in the same DB transaction
  -- as the payment upsert. Any error rolls back all three changes.
  if p_payment_status in ('confirmed','received') then
    update public.subscriptions
       set status = 'active',
           current_period_start = p_period_start,
           current_period_end = p_period_end,
           updated_at = now()
     where id = p_subscription_id
       and user_id = p_user_id;

    if not found then
      raise exception 'Local subscription not found for payment';
    end if;

    update public.billing_accounts
       set access_status = 'active',
           current_plan_key = p_plan_key,
           current_subscription_id = p_subscription_id,
           updated_at = now()
     where user_id = p_user_id;

    if not found then
      raise exception 'Billing account not found for payment';
    end if;
  elsif p_payment_status = 'overdue' then
    update public.subscriptions
       set status = 'overdue', updated_at = now()
     where id = p_subscription_id and user_id = p_user_id;
    if not found then raise exception 'Local subscription not found for payment'; end if;

    update public.billing_accounts
       set access_status = 'past_due', updated_at = now()
     where user_id = p_user_id and current_subscription_id = p_subscription_id;
  elsif p_payment_status in (
    'refunded','partially_refunded','chargeback','failed','canceled'
  ) then
    update public.subscriptions
       set status = case when p_payment_status = 'canceled' then 'canceled' else 'suspended' end,
           updated_at = now()
     where id = p_subscription_id and user_id = p_user_id;
    if not found then raise exception 'Local subscription not found for payment'; end if;

    update public.billing_accounts
       set access_status = 'suspended', updated_at = now()
     where user_id = p_user_id and current_subscription_id = p_subscription_id;
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
