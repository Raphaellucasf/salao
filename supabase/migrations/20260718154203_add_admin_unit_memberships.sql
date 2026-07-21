create table if not exists public.user_units (
  user_id uuid not null references public.users(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

create unique index if not exists user_units_one_default_per_user_uidx
  on public.user_units(user_id) where is_default and is_active;
create index if not exists user_units_unit_id_idx on public.user_units(unit_id);

alter table public.user_units enable row level security;
revoke all on table public.user_units from public, anon, authenticated;
grant all on table public.user_units to service_role;

-- Preserve current test behavior while making the association explicit.
insert into public.user_units(user_id, unit_id, is_active, is_default)
select u.id, unit.id, true, true
from public.users u
cross join lateral (
  select id from public.units
  where id = '00000000-0000-0000-0000-000000000001'::uuid and is_active is true
  limit 1
) unit
on conflict (user_id, unit_id) do update
set is_active = true, is_default = true;
