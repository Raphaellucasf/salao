begin;

create extension if not exists btree_gist with schema extensions;

alter table public.anamneses enable row level security;
revoke all privileges on table public.anamneses from public, anon, authenticated;
grant all privileges on table public.anamneses to service_role;

alter table public.prontuarios enable row level security;
revoke all privileges on table public.prontuarios from public, anon, authenticated;
grant all privileges on table public.prontuarios to service_role;

alter table public.usuarios_sessoes enable row level security;
revoke all privileges on table public.usuarios_sessoes from public, anon, authenticated;
grant all privileges on table public.usuarios_sessoes to service_role;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agendamentos_profissional_sem_sobreposicao'
      and conrelid = 'public.agendamentos'::regclass
  ) then
    alter table public.agendamentos
      add constraint agendamentos_profissional_sem_sobreposicao
      exclude using gist (
        profissional_id with =,
        tsrange(data_agendamento + hora_inicio, data_agendamento + hora_fim, '[)') with &&
      )
      where (status in ('agendado', 'confirmado', 'em_andamento'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agendamentos_auxiliar_sem_sobreposicao'
      and conrelid = 'public.agendamentos'::regclass
  ) then
    alter table public.agendamentos
      add constraint agendamentos_auxiliar_sem_sobreposicao
      exclude using gist (
        auxiliar_id with =,
        tsrange(data_agendamento + hora_inicio, data_agendamento + hora_fim, '[)') with &&
      )
      where (auxiliar_id is not null and status in ('agendado', 'confirmado', 'em_andamento'));
  end if;
end
$$;

commit;

-- Rollback manual, se necessário:
-- alter table public.agendamentos drop constraint if exists agendamentos_auxiliar_sem_sobreposicao;
-- alter table public.agendamentos drop constraint if exists agendamentos_profissional_sem_sobreposicao;
-- grant select, insert, update, delete on table public.anamneses, public.prontuarios to authenticated;
-- alter table public.anamneses disable row level security;
-- alter table public.prontuarios disable row level security;
-- usuarios_sessoes não deve voltar a ser exposta; recuperar somente por plano de incidente.
