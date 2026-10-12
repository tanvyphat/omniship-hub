-- OmniShip Hub: marketplace price book and order settlement tracking.
-- Safe additive migration: does not modify or delete warehouse documents/items.

create table if not exists public.marketplace_product_prices (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('shopee', 'tiktok')),
  sku text not null check (char_length(trim(sku)) between 1 and 150),
  product_name text not null check (char_length(trim(product_name)) between 1 and 300),
  sale_price numeric(14,2) not null check (sale_price >= 0),
  minimum_payout numeric(14,2) not null check (minimum_payout >= 0),
  cost_price numeric(14,2) check (cost_price is null or cost_price >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, sku)
);

create table if not exists public.marketplace_order_settlements (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('shopee', 'tiktok')),
  order_code text not null check (char_length(trim(order_code)) between 1 and 200),
  payout_amount numeric(14,2) not null check (payout_amount >= 0),
  payout_kind text not null default 'actual' check (payout_kind in ('estimated', 'actual')),
  source_file text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, order_code)
);

create index if not exists marketplace_product_prices_sku_idx
  on public.marketplace_product_prices (platform, sku);
create index if not exists marketplace_order_settlements_order_idx
  on public.marketplace_order_settlements (platform, order_code);

create or replace function public.set_marketplace_pricing_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_product_prices_updated_at on public.marketplace_product_prices;
create trigger trg_marketplace_product_prices_updated_at
before update on public.marketplace_product_prices
for each row execute function public.set_marketplace_pricing_updated_at();

drop trigger if exists trg_marketplace_order_settlements_updated_at on public.marketplace_order_settlements;
create trigger trg_marketplace_order_settlements_updated_at
before update on public.marketplace_order_settlements
for each row execute function public.set_marketplace_pricing_updated_at();

alter table public.marketplace_product_prices enable row level security;
alter table public.marketplace_order_settlements enable row level security;

drop policy if exists "Admin can view marketplace product prices" on public.marketplace_product_prices;
create policy "Admin can view marketplace product prices"
  on public.marketplace_product_prices for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin can insert marketplace product prices" on public.marketplace_product_prices;
create policy "Admin can insert marketplace product prices"
  on public.marketplace_product_prices for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin can update marketplace product prices" on public.marketplace_product_prices;
create policy "Admin can update marketplace product prices"
  on public.marketplace_product_prices for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin can delete marketplace product prices" on public.marketplace_product_prices;
create policy "Admin can delete marketplace product prices"
  on public.marketplace_product_prices for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin can view marketplace order settlements" on public.marketplace_order_settlements;
create policy "Admin can view marketplace order settlements"
  on public.marketplace_order_settlements for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin can insert marketplace order settlements" on public.marketplace_order_settlements;
create policy "Admin can insert marketplace order settlements"
  on public.marketplace_order_settlements for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin can update marketplace order settlements" on public.marketplace_order_settlements;
create policy "Admin can update marketplace order settlements"
  on public.marketplace_order_settlements for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin can delete marketplace order settlements" on public.marketplace_order_settlements;
create policy "Admin can delete marketplace order settlements"
  on public.marketplace_order_settlements for delete to authenticated
  using ((select public.is_admin()));

grant select, insert, update, delete on public.marketplace_product_prices to authenticated;
grant select, insert, update, delete on public.marketplace_order_settlements to authenticated;
