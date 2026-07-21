-- Restore archived records without exposing dynamic table writes to the browser.
-- The allowlist is intentionally expressed as static CASE branches.

create table if not exists public.cadastros_recuperacoes (
  id uuid primary key default gen_random_uuid(),
  cadastro_excluido_id uuid not null,
  tipo_cadastro text not null,
  registro_id text not null,
  recuperado_por uuid not null references public.users(id),
  dados_originais jsonb not null,
  recuperado_em timestamptz not null default now()
);

create index if not exists cadastros_recuperacoes_recuperado_por_idx
  on public.cadastros_recuperacoes (recuperado_por);

alter table public.cadastros_recuperacoes enable row level security;

revoke all on table public.cadastros_recuperacoes from public, anon, authenticated;
grant all on table public.cadastros_recuperacoes to service_role;

-- cadastros_excluidos contains full snapshots and must only be reached through
-- authenticated admin API routes backed by service_role.
revoke all on table public.cadastros_excluidos from anon, authenticated;
grant all on table public.cadastros_excluidos to service_role;

create or replace function public.restore_deleted_record_atomic(
  p_archive_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_archive public.cadastros_excluidos%rowtype;
  v_data jsonb;
  v_record_id text;
begin
  if p_archive_id is null or p_actor_id is null then
    raise exception using errcode = '22023', message = 'invalid_restore_request';
  end if;

  perform 1 from public.users where id = p_actor_id;
  if not found then
    raise exception using errcode = '23503', message = 'actor_not_found';
  end if;

  select *
    into v_archive
    from public.cadastros_excluidos
   where id = p_archive_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'archived_record_not_found';
  end if;

  if v_archive.pode_recuperar is not true then
    raise exception using errcode = '55000', message = 'archived_record_not_recoverable';
  end if;

  if v_archive.data_expiracao is not null and v_archive.data_expiracao < current_date then
    raise exception using errcode = '55000', message = 'archived_record_expired';
  end if;

  if pg_catalog.jsonb_typeof(v_archive.dados_originais) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_archived_payload';
  end if;

  v_data := v_archive.dados_originais - 'deleted_at';

  case v_archive.tipo_cadastro
    when 'cliente' then
      insert into public.clientes
      select (pg_catalog.jsonb_populate_record(null::public.clientes, v_data)).*;
    when 'produto' then
      insert into public.produtos
      select (pg_catalog.jsonb_populate_record(null::public.produtos, v_data)).*;
    when 'servico' then
      insert into public.servicos
      select (pg_catalog.jsonb_populate_record(null::public.servicos, v_data)).*;
    when 'agendamento' then
      insert into public.agendamentos
      select (pg_catalog.jsonb_populate_record(null::public.agendamentos, v_data)).*;
    when 'profissional' then
      insert into public.profissionais
      select (pg_catalog.jsonb_populate_record(null::public.profissionais, v_data)).*;
    else
      raise exception using errcode = '22023', message = 'unsupported_archived_record_type';
  end case;

  v_record_id := coalesce(v_data ->> 'id', '');
  if v_record_id = '' then
    raise exception using errcode = '22023', message = 'archived_record_id_missing';
  end if;

  insert into public.cadastros_recuperacoes (
    cadastro_excluido_id,
    tipo_cadastro,
    registro_id,
    recuperado_por,
    dados_originais
  ) values (
    v_archive.id,
    v_archive.tipo_cadastro,
    v_record_id,
    p_actor_id,
    v_archive.dados_originais
  );

  delete from public.cadastros_excluidos where id = v_archive.id;

  return pg_catalog.jsonb_build_object(
    'archive_id', v_archive.id,
    'record_id', v_record_id,
    'type', v_archive.tipo_cadastro
  );
end;
$$;

revoke all on function public.restore_deleted_record_atomic(uuid, uuid) from public, anon, authenticated;
grant execute on function public.restore_deleted_record_atomic(uuid, uuid) to service_role;
