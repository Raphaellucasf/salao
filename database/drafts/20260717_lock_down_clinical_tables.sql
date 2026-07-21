-- SUPERADO pela migration database/migrations/20260717_critical_rls_and_appointment_overlap.sql.
-- Mantido apenas como histórico de planejamento; não aplicar este arquivo.
-- Pré-condições:
-- 1. APIs /api/admin/anamneses e /api/admin/prontuarios implantadas e homologadas.
-- 2. SUPABASE_SERVICE_ROLE_KEY disponível apenas no servidor.
-- 3. Confirmar que não existem integrações externas consumindo estas tabelas via anon/authenticated.

begin;

-- Dados clínicos deixam de ser acessíveis diretamente pelo PostgREST do browser.
revoke all privileges on table public.anamneses from public, anon, authenticated;
revoke all privileges on table public.prontuarios from public, anon, authenticated;

alter table public.anamneses enable row level security;
alter table public.prontuarios enable row level security;

-- Não são criadas policies permissivas: o acesso passa exclusivamente pelas APIs
-- administrativas server-side, após requireAdmin. service_role possui BYPASSRLS.

commit;

-- Verificação pós-aplicação (somente leitura):
-- select relname, relrowsecurity
-- from pg_class
-- where oid in ('public.anamneses'::regclass, 'public.prontuarios'::regclass);
--
-- select table_name, grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in ('anamneses', 'prontuarios')
--   and grantee in ('anon', 'authenticated');

-- Rollback emergencial (usar somente após análise do incidente):
-- grant select, insert, update, delete on table public.anamneses to authenticated;
-- grant select, insert, update, delete on table public.prontuarios to authenticated;
-- O rollback não deve restaurar privilégios de anon nem TRUNCATE.
