-- Add settlement and marketplace price fields to each product row.
alter table public.warehouse_document_items
  add column if not exists order_settlement_amount numeric(14,2) check (order_settlement_amount is null or order_settlement_amount >= 0),
  add column if not exists sale_price numeric(14,2) check (sale_price is null or sale_price >= 0),
  add column if not exists minimum_settlement numeric(14,2) check (minimum_settlement is null or minimum_settlement >= 0);

create or replace function public.create_warehouse_document(p_document jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document_id uuid;
  v_item jsonb;
  v_document_date date;
  v_quantity integer;
  v_order_code text;
begin
  if not (select public.is_admin()) then
    raise exception 'FORBIDDEN';
  end if;

  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception 'Invalid document payload';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A document must contain at least one item';
  end if;

  v_document_date := (p_document ->> 'document_date')::date;

  insert into public.warehouse_documents (platform, type, document_date, order_code, created_by)
  values (p_document ->> 'platform', p_document ->> 'type', v_document_date, null, auth.uid())
  returning id into v_document_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_code := trim(v_item ->> 'order_code');
    v_quantity := (v_item ->> 'quantity')::integer;

    if char_length(v_order_code) = 0 then raise exception 'ORDER_CODE_REQUIRED'; end if;

    insert into public.warehouse_document_items (
      document_id, order_code, product_name, sku, unit, variant, quantity,
      order_settlement_amount, sale_price, minimum_settlement
    )
    values (
      v_document_id, v_order_code, trim(v_item ->> 'product_name'), trim(v_item ->> 'sku'),
      trim(v_item ->> 'unit'), coalesce(trim(v_item ->> 'variant'), ''), v_quantity,
      nullif(v_item ->> 'order_settlement_amount', '')::numeric,
      nullif(v_item ->> 'sale_price', '')::numeric,
      nullif(v_item ->> 'minimum_settlement', '')::numeric
    );
  end loop;

  return v_document_id;
end;
$$;

revoke all on function public.create_warehouse_document(jsonb, jsonb) from public;
grant execute on function public.create_warehouse_document(jsonb, jsonb) to authenticated;

create or replace function public.update_warehouse_document(p_document_id uuid, p_document jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_quantity integer;
  v_order_code text;
begin
  if not (select public.is_admin()) then raise exception 'FORBIDDEN'; end if;
  if p_document_id is null then raise exception 'Document ID is required'; end if;
  if p_document is null or jsonb_typeof(p_document) <> 'object' then raise exception 'Invalid document payload'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'A document must contain at least one item'; end if;
  if not exists (select 1 from public.warehouse_documents where id = p_document_id) then raise exception 'DOCUMENT_NOT_FOUND'; end if;

  update public.warehouse_documents
  set platform = p_document ->> 'platform',
      type = p_document ->> 'type',
      document_date = (p_document ->> 'document_date')::date,
      order_code = null
  where id = p_document_id;

  delete from public.warehouse_document_items where document_id = p_document_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_code := trim(v_item ->> 'order_code');
    v_quantity := (v_item ->> 'quantity')::integer;
    if char_length(v_order_code) = 0 then raise exception 'ORDER_CODE_REQUIRED'; end if;

    insert into public.warehouse_document_items (
      document_id, order_code, product_name, sku, unit, variant, quantity,
      order_settlement_amount, sale_price, minimum_settlement
    )
    values (
      p_document_id, v_order_code, trim(v_item ->> 'product_name'), trim(v_item ->> 'sku'),
      trim(v_item ->> 'unit'), coalesce(trim(v_item ->> 'variant'), ''), v_quantity,
      nullif(v_item ->> 'order_settlement_amount', '')::numeric,
      nullif(v_item ->> 'sale_price', '')::numeric,
      nullif(v_item ->> 'minimum_settlement', '')::numeric
    );
  end loop;

  return p_document_id;
end;
$$;

revoke all on function public.update_warehouse_document(uuid, jsonb, jsonb) from public;
grant execute on function public.update_warehouse_document(uuid, jsonb, jsonb) to authenticated;
