-- Prevent service-role workflows from linking rows that belong to different
-- units. RLS protects browser access; these triggers protect relational
-- integrity inside privileged atomic RPCs as well.

create or replace function private.enforce_parent_unit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_child_value text;
  v_parent_unit uuid;
begin
  v_child_value := to_jsonb(new) ->> tg_argv[0];
  if v_child_value is null then
    return new;
  end if;

  execute format(
    'select unit_id from %I.%I where %I::text = $1',
    tg_argv[1], tg_argv[2], tg_argv[3]
  ) into v_parent_unit using v_child_value;

  if v_parent_unit is not null and v_parent_unit is distinct from new.unit_id then
    raise exception using errcode = '23514', message = 'CROSS_UNIT_REFERENCE';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_parent_unit() from public, anon, authenticated;
grant execute on function private.enforce_parent_unit() to service_role;

do $$
declare
  v_fk record;
  v_trigger text;
begin
  for v_fk in
    select
      con.conname,
      child_ns.nspname as child_schema,
      child.relname as child_table,
      child_att.attname as child_column,
      parent_ns.nspname as parent_schema,
      parent.relname as parent_table,
      parent_att.attname as parent_column
    from pg_constraint con
    join pg_class child on child.oid = con.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = con.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    join pg_attribute child_att on child_att.attrelid = child.oid
      and child_att.attnum = con.conkey[1]
    join pg_attribute parent_att on parent_att.attrelid = parent.oid
      and parent_att.attnum = con.confkey[1]
    where con.contype = 'f'
      and cardinality(con.conkey) = 1
      and child_ns.nspname = 'public'
      and parent_ns.nspname = 'public'
      and child_att.attname <> 'unit_id'
      and exists (
        select 1 from pg_attribute a
        where a.attrelid = child.oid and a.attname = 'unit_id' and not a.attisdropped
      )
      and exists (
        select 1 from pg_attribute a
        where a.attrelid = parent.oid and a.attname = 'unit_id' and not a.attisdropped
      )
  loop
    v_trigger := left('tenant_fk_' || md5(v_fk.conname || v_fk.child_table), 63);
    execute format('drop trigger if exists %I on %I.%I',
      v_trigger, v_fk.child_schema, v_fk.child_table);
    execute format(
      'create trigger %I before insert or update on %I.%I for each row execute function private.enforce_parent_unit(%L,%L,%L,%L)',
      v_trigger,
      v_fk.child_schema, v_fk.child_table,
      v_fk.child_column, v_fk.parent_schema, v_fk.parent_table, v_fk.parent_column
    );
  end loop;
end;
$$;
