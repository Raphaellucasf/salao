-- SUPERADO pela migration database/migrations/20260717_critical_rls_and_appointment_overlap.sql.
-- Mantido apenas como histórico de planejamento; não aplicar este arquivo.
-- Inspeção agregada em 2026-07-17 encontrou zero conflitos ativos no teste.

begin;

create extension if not exists btree_gist with schema extensions;

alter table public.agendamentos
  add constraint agendamentos_profissional_sem_sobreposicao
  exclude using gist (
    profissional_id with =,
    tsrange(data_agendamento + hora_inicio, data_agendamento + hora_fim, '[)') with &&
  )
  where (status in ('agendado', 'confirmado', 'em_andamento'));

alter table public.agendamentos
  add constraint agendamentos_auxiliar_sem_sobreposicao
  exclude using gist (
    auxiliar_id with =,
    tsrange(data_agendamento + hora_inicio, data_agendamento + hora_fim, '[)') with &&
  )
  where (auxiliar_id is not null and status in ('agendado', 'confirmado', 'em_andamento'));

commit;

-- PostgreSQL retorna SQLSTATE 23P01 quando duas reservas concorrentes se sobrepõem.
-- A API pública traduz esse código para HTTP 409 sem revelar detalhes do banco.

-- Rollback:
-- alter table public.agendamentos drop constraint if exists agendamentos_auxiliar_sem_sobreposicao;
-- alter table public.agendamentos drop constraint if exists agendamentos_profissional_sem_sobreposicao;
