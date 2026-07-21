create unique index if not exists usuarios_auth_id_uidx on public.usuarios(auth_id) where auth_id is not null;

create or replace function public.provision_app_user_atomic(
  p_auth_id uuid, p_email text, p_name text, p_phone text, p_role text,
  p_role_id uuid, p_cpf text, p_birth_date date, p_active boolean,
  p_notes text, p_temporary_password boolean, p_actor_id uuid, p_unit_id uuid
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare v_usuario_id uuid;
begin
  if p_auth_id is null or p_actor_id is null or p_unit_id is null
     or nullif(btrim(p_email),'') is null or nullif(btrim(p_name),'') is null
     or p_role not in ('admin','professional') then
    raise exception using errcode='22023',message='invalid_user_provisioning';
  end if;
  perform 1 from public.users u join public.user_units uu on uu.user_id=u.id
   where u.id=p_actor_id and u.role='admin' and uu.unit_id=p_unit_id
     and uu.is_active and uu.is_default;
  if not found then raise exception using errcode='42501',message='actor_unit_not_authorized'; end if;

  insert into public.users(id,email,full_name,phone,role)
  values(p_auth_id,lower(btrim(p_email)),btrim(p_name),nullif(btrim(p_phone),''),p_role)
  on conflict(id) do update set email=excluded.email,full_name=excluded.full_name,
    phone=excluded.phone,role=excluded.role,updated_at=now();

  insert into public.usuarios(nome,email,telefone,cpf,data_nascimento,role_id,ativo,
    observacoes,senha_temporaria,primeiro_acesso,auth_id,created_by)
  values(btrim(p_name),lower(btrim(p_email)),nullif(btrim(p_phone),''),nullif(btrim(p_cpf),''),
    p_birth_date,p_role_id,coalesce(p_active,true),nullif(btrim(p_notes),''),
    coalesce(p_temporary_password,false),true,p_auth_id,p_actor_id)
  returning id into v_usuario_id;

  insert into public.user_units(user_id,unit_id,is_active,is_default)
  values(p_auth_id,p_unit_id,true,true)
  on conflict(user_id,unit_id) do update set is_active=true,is_default=true;

  return jsonb_build_object('auth_id',p_auth_id,'usuario_id',v_usuario_id,'unit_id',p_unit_id);
end; $$;

revoke all on function public.provision_app_user_atomic(uuid,text,text,text,text,uuid,text,date,boolean,text,boolean,uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.provision_app_user_atomic(uuid,text,text,text,text,uuid,text,date,boolean,text,boolean,uuid,uuid)
  to service_role;
