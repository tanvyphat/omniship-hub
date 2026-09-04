-- OmniShip Hub
-- Run once in Supabase SQL Editor. This version supports one batch/phiếu
-- containing many order codes, with each product row carrying its own order code.

create extension if not exists pgcrypto;

grant usage on schema public to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@gmail.com';
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.warehouse_documents (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('tiktok', 'shopee')),
  type text not null check (type in ('outbound', 'return')),
  document_date date not null,
  order_code text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy compatibility: old versions stored one order code on the document header.
alter table public.warehouse_documents alter column order_code drop not null;

create table if not exists public.warehouse_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.warehouse_documents(id) on delete cascade,
  order_code text not null default '',
  product_name text not null check (char_length(trim(product_name)) between 1 and 300),
  sku text not null check (char_length(trim(sku)) between 1 and 150),
  unit text not null check (char_length(trim(unit)) between 1 and 100),
  variant text not null default '',
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- Add the new per-product order code to an existing database without losing old data.
alter table public.warehouse_document_items
  add column if not exists order_code text not null default '';

update public.warehouse_document_items as item
set order_code = document.order_code
from public.warehouse_documents as document
where item.document_id = document.id
  and trim(item.order_code) = ''
  and trim(coalesce(document.order_code, '')) <> '';

create index if not exists warehouse_documents_history_idx
  on public.warehouse_documents (platform, document_date desc, type, created_at desc);
create index if not exists warehouse_document_items_document_idx
  on public.warehouse_document_items (document_id);
create index if not exists warehouse_document_items_order_idx
  on public.warehouse_document_items (order_code);

grant select on public.warehouse_documents to authenticated;
grant select on public.warehouse_document_items to authenticated;

create or replace function public.set_warehouse_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_warehouse_documents_updated_at on public.warehouse_documents;
create trigger trg_warehouse_documents_updated_at
before update on public.warehouse_documents
for each row execute function public.set_warehouse_documents_updated_at();

alter table public.warehouse_documents enable row level security;
alter table public.warehouse_document_items enable row level security;

drop policy if exists "Admin can view warehouse documents" on public.warehouse_documents;
create policy "Admin can view warehouse documents"
  on public.warehouse_documents for select
  to authenticated using ((select public.is_admin()));

drop policy if exists "Admin can view warehouse document items" on public.warehouse_document_items;
create policy "Admin can view warehouse document items"
  on public.warehouse_document_items for select
  to authenticated using ((select public.is_admin()));

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

    insert into public.warehouse_document_items (document_id, order_code, product_name, sku, unit, variant, quantity)
    values (
      v_document_id, v_order_code, trim(v_item ->> 'product_name'), trim(v_item ->> 'sku'),
      trim(v_item ->> 'unit'), coalesce(trim(v_item ->> 'variant'), ''), v_quantity
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

    insert into public.warehouse_document_items (document_id, order_code, product_name, sku, unit, variant, quantity)
    values (
      p_document_id, v_order_code, trim(v_item ->> 'product_name'), trim(v_item ->> 'sku'),
      trim(v_item ->> 'unit'), coalesce(trim(v_item ->> 'variant'), ''), v_quantity
    );
  end loop;

  return p_document_id;
end;
$$;

revoke all on function public.update_warehouse_document(uuid, jsonb, jsonb) from public;
grant execute on function public.update_warehouse_document(uuid, jsonb, jsonb) to authenticated;
