create or replace function private.current_request_unit()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_unit_id uuid;
  v_header text;
  v_role text;
begin
  if auth.uid() is not null then
    select uu.unit_id into v_unit_id
      from public.user_units uu
     where uu.user_id = auth.uid()
       and uu.is_active
       and uu.is_default
     limit 1;
    return v_unit_id;
  end if;

  begin
    v_header := current_setting('request.headers', true)::jsonb ->> 'x-unit-id';
    if v_header is not null then
      v_unit_id := v_header::uuid;
      if exists (select 1 from public.units u where u.id = v_unit_id) then
        return v_unit_id;
      end if;
    end if;
  exception when others then
    return null;
  end;

  begin
    v_role := coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      current_setting('request.jwt.claims', true)::jsonb ->> 'role'
    );
  exception when others then
    v_role := null;
  end;

  if v_role = 'service_role' then
    select min(uu.unit_id::text)::uuid into v_unit_id
      from public.user_units uu
     where uu.is_active and uu.is_default
    having count(distinct uu.unit_id) = 1;
  end if;
  return v_unit_id;
end;
$$;

revoke all on function private.current_request_unit() from public, anon;
grant execute on function private.current_request_unit() to authenticated, service_role;
