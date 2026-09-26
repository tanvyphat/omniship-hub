-- OmniShip Hub - Feature Control migration
-- Safe to run more than once. This script does not delete warehouse data.

-- Some older OmniHub databases may not have public.is_admin() yet.
-- Recreate the helper here so this migration can run independently.
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

create table if not exists public.feature_flags (
  feature_key text primary key check (feature_key in ('outbound', 'returns', 'history')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.feature_flags (feature_key, enabled)
values
  ('outbound', true),
  ('returns', true),
  ('history', true)
on conflict (feature_key) do nothing;

grant select on public.feature_flags to authenticated;
grant update on public.feature_flags to authenticated;

alter table public.feature_flags enable row level security;

drop policy if exists "Authenticated can read feature flags" on public.feature_flags;
create policy "Authenticated can read feature flags"
  on public.feature_flags for select
  to authenticated using (true);

drop policy if exists "Admin can update feature flags" on public.feature_flags;
create policy "Admin can update feature flags"
  on public.feature_flags for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.set_feature_flag_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_feature_flags_audit on public.feature_flags;
create trigger trg_feature_flags_audit
before update on public.feature_flags
for each row execute function public.set_feature_flag_audit();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feature_flags'
  ) then
    alter publication supabase_realtime add table public.feature_flags;
  end if;
end
$$;
