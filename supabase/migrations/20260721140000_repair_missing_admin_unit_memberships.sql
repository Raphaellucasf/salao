-- Repair the legacy single-unit bootstrap without assuming a fixed unit UUID.
-- Multi-unit environments deliberately fail closed and require an explicit
-- administrator-to-unit mapping before administrative APIs can be used.

do $$
declare
  v_active_unit_count integer;
  v_active_unit_id uuid;
  v_missing_admin_count integer;
begin
  select count(*), min(id::text)::uuid
    into v_active_unit_count, v_active_unit_id
    from public.units
   where is_active is true;

  if v_active_unit_count = 1 then
    -- A stale default pointing at an inactive unit must not prevent the only
    -- active unit from becoming the canonical default for an administrator.
    update public.user_units uu
       set is_default = false
      from public.users u
     where u.id = uu.user_id
       and u.role = 'admin'
       and uu.is_default is true
       and uu.unit_id <> v_active_unit_id;

    insert into public.user_units(user_id, unit_id, is_active, is_default)
    select u.id, v_active_unit_id, true, true
      from public.users u
     where u.role = 'admin'
       and not exists (
         select 1
           from public.user_units uu
          where uu.user_id = u.id
            and uu.unit_id = v_active_unit_id
            and uu.is_active is true
            and uu.is_default is true
       )
    on conflict (user_id, unit_id) do update
      set is_active = true,
          is_default = true;
  end if;

  select count(*)
    into v_missing_admin_count
    from public.users u
   where u.role = 'admin'
     and not exists (
       select 1
         from public.user_units uu
         join public.units unit on unit.id = uu.unit_id and unit.is_active is true
        where uu.user_id = u.id
          and uu.is_active is true
          and uu.is_default is true
     );

  if v_missing_admin_count > 0 then
    raise exception using
      errcode = '23514',
      message = 'ADMIN_UNIT_MEMBERSHIP_REPAIR_REQUIRED',
      detail = format(
        '%s administrator(s) lack an active default unit; %s active unit(s) are available',
        v_missing_admin_count,
        v_active_unit_count
      ),
      hint = 'Create one explicit active/default row in public.user_units for each administrator, then rerun migrations.';
  end if;
end;
$$;
