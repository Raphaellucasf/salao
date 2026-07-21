/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').toLowerCase();

const critical = read('supabase/migrations/20260717164441_critical_rls_and_appointment_overlap.sql');
for (const table of ['anamneses', 'prontuarios', 'usuarios_sessoes']) {
  assert.ok(critical.includes(`alter table public.${table} enable row level security`), `${table} sem RLS`);
}
assert.ok(critical.includes('exclude using gist'), 'migração não cria exclusion constraint');
assert.ok(critical.includes("status in ('agendado', 'confirmado', 'em_andamento')"), 'constraint não limita estados ativos');
assert.ok(critical.includes("'[)'"), 'intervalo de agenda não usa semântica semiaberta');

const views = read('supabase/migrations/20260717170754_harden_security_invoker_views.sql');
for (const view of [
  'vw_comanda_item_etapas_completas', 'vw_agendamentos_completos',
  'vw_servicos_com_etapas', 'vw_profissionais_com_grupos',
  'vw_etapas_agendadas', 'vw_blocos_ocupados', 'vw_servicos_n8n',
]) {
  assert.ok(views.includes(`alter view public.${view} set (security_invoker = true)`), `${view} sem security_invoker`);
}
assert.ok(views.includes('from public, anon, authenticated'), 'views não revogam roles públicas');
assert.ok(!views.includes('to anon'), 'views ainda concedem acesso anon');

const remainingRls = read('supabase/migrations/20260717171340_enable_rls_remaining_public_tables.sql');
const remainingTables = [
  'orcamentos', 'orcamento_itens', 'avisos_clientes', 'cliente_saldos',
  'cadastros_excluidos', 'cadastro_templates', 'profissional_horarios',
  'agendamentos_blocos', 'estoque_alertas', 'pacotes_servicos_itens',
  'roles', 'promocoes', 'configuracoes_sistema', 'formas_pagamento',
  'faq_estabelecimento',
];
for (const table of remainingTables) {
  assert.ok(remainingRls.includes(`alter table public.${table} enable row level security`), `${table} sem RLS`);
  assert.ok(remainingRls.includes(`policy ${table}_admin_all`), `${table} sem policy admin`);
}
assert.ok(!remainingRls.includes('using (true)'), 'migração contém policy administrativa aberta');
assert.ok(remainingRls.includes('public.is_authenticated_admin()'), 'policies não usam role canônica');

const functions = read('supabase/migrations/20260717171839_harden_remaining_functions_and_webhook_log.sql');
assert.equal((functions.match(/set search_path = pg_catalog, public/g) ?? []).length, 26, 'search_path não cobre 26 funções');
assert.ok(functions.includes('revoke all on function public.fn_horarios_vagos'), 'RPC antiga ainda pública');
assert.ok(functions.includes('drop policy if exists webhook_log_insert'), 'policy aberta de webhook não é removida');
assert.ok(functions.includes('revoke all privileges on public.webhook_log'), 'webhook_log não revoga acesso público');

const privateHelper = read('supabase/migrations/20260717172429_move_admin_helper_to_private.sql');
assert.ok(privateHelper.includes('alter function public.is_authenticated_admin() set schema private'), 'helper admin ainda exposto em public');
assert.ok(privateHelper.includes('grant usage on schema private to authenticated, service_role'), 'policies perderiam acesso ao helper privado');
assert.ok(!privateHelper.includes('to anon'), 'schema privado concedido a anon');

const deletedRestore = read('supabase/migrations/20260718151149_atomic_deleted_record_restore.sql');
assert.ok(deletedRestore.includes('for update'), 'restauração não bloqueia o item arquivado');
assert.ok(deletedRestore.includes('case v_archive.tipo_cadastro'), 'restauração não usa allowlist estática');
assert.ok(!deletedRestore.includes('execute format'), 'restauração usa SQL dinâmico');
assert.ok(deletedRestore.includes('security invoker'), 'restauração não é security invoker');
assert.ok(deletedRestore.includes('set search_path = pg_catalog, public'), 'restauração sem search_path fixo');
assert.ok(deletedRestore.includes('from public, anon, authenticated'), 'lixeira ou ledger ainda concedem acesso público');
assert.ok(
  deletedRestore.includes('grant execute on function public.restore_deleted_record_atomic(uuid, uuid) to service_role'),
  'RPC de restauração não está restrita ao service_role'
);

const packageCatalog = read('supabase/migrations/20260718152418_atomic_service_package_catalog.sql');
assert.ok(packageCatalog.includes('create unique index if not exists pacotes_servicos_itens_pacote_servico_uidx'), 'itens de pacote sem unicidade');
assert.ok(packageCatalog.includes('for update'), 'atualização de pacote não bloqueia o catálogo');
assert.ok(packageCatalog.includes('join public.servicos'), 'pacote não recalcula catálogo no banco');
assert.ok(packageCatalog.includes('security invoker'), 'RPC de pacote não é security invoker');
assert.ok(packageCatalog.includes('set search_path = pg_catalog, public'), 'RPC de pacote sem search_path fixo');
assert.ok(
  packageCatalog.includes('grant execute on function public.save_service_package_atomic(uuid, jsonb, jsonb, uuid, uuid)'),
  'RPC de pacote não tem grant service-only explícito'
);

const serviceCatalog = read('supabase/migrations/20260718153134_atomic_service_catalog_save.sql');
assert.ok(serviceCatalog.includes('for update'), 'atualização de serviço não bloqueia catálogo');
assert.ok(serviceCatalog.includes('delete from public.servico_etapas'), 'RPC não substitui etapas na transação');
assert.ok(serviceCatalog.includes('security invoker'), 'RPC de serviço não é security invoker');
assert.ok(serviceCatalog.includes('set search_path = pg_catalog, public'), 'RPC de serviço sem search_path fixo');

const memberships = read('supabase/migrations/20260718154203_add_admin_unit_memberships.sql');
assert.ok(memberships.includes('alter table public.user_units enable row level security'), 'associação de unidades sem RLS');
assert.ok(memberships.includes('revoke all on table public.user_units from public, anon, authenticated'), 'associação de unidades exposta ao cliente');
assert.ok(memberships.includes('user_units_one_default_per_user_uidx'), 'usuário pode ter mais de uma unidade padrão ativa');
assert.ok(memberships.includes('user_units_unit_id_idx'), 'FK de unidade sem índice de apoio');

const provisioning = read('supabase/migrations/20260718154538_atomic_user_provisioning.sql');
assert.ok(provisioning.includes('security invoker'), 'provisionamento de usuário não é security invoker');
assert.ok(provisioning.includes('set search_path = pg_catalog, public'), 'provisionamento de usuário sem search_path fixo');
assert.ok(provisioning.includes("p_role not in ('admin','professional')"), 'provisionamento não restringe roles canônicas');
assert.ok(provisioning.includes('join public.user_units'), 'provisionamento não autoriza ator e unidade');
assert.ok(provisioning.includes('grant execute on function public.provision_app_user_atomic'), 'provisionamento não tem grant service-only explícito');

const financialStats = read('supabase/migrations/20260718154903_unit_scoped_financial_stats.sql');
assert.ok(financialStats.includes('idx_transacoes_unit_tipo_data'), 'estatísticas financeiras sem índice por unidade/tipo/data');
assert.ok(financialStats.includes('where unit_id=p_unit_id'), 'estatísticas financeiras não isolam a unidade');
assert.ok(financialStats.includes('and data between p_month_start and p_today'), 'estatísticas financeiras não limitam o intervalo');
assert.ok(financialStats.includes('security invoker'), 'estatísticas financeiras não são security invoker');
assert.ok(financialStats.includes('set search_path = pg_catalog, public'), 'estatísticas financeiras sem search_path fixo');
assert.ok(financialStats.includes('grant execute on function public.get_financial_stats'), 'estatísticas financeiras não têm grant service-only explícito');

const optimizedPolicies = read('supabase/migrations/20260718163000_optimize_rls_auth_initplans.sql');
assert.equal((optimizedPolicies.match(/alter policy /g) ?? []).length, 36, 'otimização não cobre os 36 initplans RLS');
assert.ok(!/(?<!select )auth\.(uid|role|jwt)\(\)/.test(optimizedPolicies), 'migração ainda avalia helper auth por linha');

const consolidatedPolicies = read('supabase/migrations/20260718164500_consolidate_overlapping_rls_policies.sql');
for (const table of ['fornecedores', 'grupos_produtos', 'produtos', 'profissionais', 'servico_etapas', 'servicos', 'units']) {
  assert.ok(consolidatedPolicies.includes(`create policy ${table}_admin_insert`), `${table} sem INSERT administrativo canônico`);
  assert.ok(consolidatedPolicies.includes(`create policy ${table}_admin_update`), `${table} sem UPDATE administrativo canônico`);
  assert.ok(consolidatedPolicies.includes(`create policy ${table}_admin_delete`), `${table} sem DELETE administrativo canônico`);
}
assert.ok(consolidatedPolicies.includes('create policy usuarios_select_canonical'), 'usuarios sem leitura própria/admin consolidada');
assert.ok(consolidatedPolicies.includes('drop policy if exists auth_all_produtos'), 'policy ampla de produtos não é removida');

const unitPolicies = read('supabase/migrations/20260718173000_scope_existing_unit_rls.sql');
assert.ok(unitPolicies.includes('security definer'), 'helper de unidade não protege a tabela de associações');
assert.ok(unitPolicies.includes('set search_path = pg_catalog, public, private'), 'helper de unidade sem search_path fixo');
assert.ok(unitPolicies.includes('where user_id = (select auth.uid())'), 'helper de unidade não vincula a identidade autenticada');
for (const table of ['fechamentos_caixa', 'pacotes_cliente', 'transacoes']) {
  assert.ok(unitPolicies.includes(`private.user_has_unit(unit_id)`), `${table} sem predicado de unidade`);
}
assert.ok(unitPolicies.includes('drop policy if exists auth_all_transacoes'), 'transações ainda aceitam escrita de qualquer autenticado');

const serviceDelete = read('supabase/migrations/20260718174500_atomic_service_catalog_delete.sql');
assert.ok(serviceDelete.includes('for update'), 'exclusão de serviço não bloqueia o catálogo');
assert.ok(serviceDelete.includes('delete from public.servico_etapas'), 'exclusão de serviço não remove etapas na mesma transação');
assert.ok(serviceDelete.includes('security invoker'), 'exclusão de serviço não é security invoker');
assert.ok(serviceDelete.includes('grant execute on function public.delete_service_catalog_atomic(uuid) to service_role'), 'exclusão de serviço não é service-only');

const completeTenancy = read('supabase/migrations/20260718203000_complete_unit_tenancy.sql');
assert.ok(completeTenancy.includes('create policy tenant_unit_boundary'), 'tabelas de negócio sem boundary RLS por unidade');
assert.ok(completeTenancy.includes('as restrictive for all to authenticated'), 'boundary de unidade não é restritiva');
assert.ok(completeTenancy.includes('private.user_has_unit(unit_id)'), 'boundary não valida associação canônica');
assert.ok(completeTenancy.includes('alter column unit_id set not null'), 'unit_id ainda aceita linhas órfãs');
assert.ok(completeTenancy.includes('foreign key (unit_id) references public.units(id)'), 'unit_id sem integridade referencial');
assert.ok(completeTenancy.includes('unit_id_immutable'), 'unit_id não está protegido contra reassociação');

const crossUnitFks = read('supabase/migrations/20260718204500_enforce_cross_unit_foreign_keys.sql');
assert.ok(crossUnitFks.includes("message = 'cross_unit_reference'"), 'FKs ainda permitem referências entre unidades');
assert.ok(crossUnitFks.includes('before insert or update'), 'verificação relacional não cobre criação e alteração');

const requestUnit = read('supabase/migrations/20260718210000_harden_request_unit_resolution.sql');
assert.ok(requestUnit.includes("->> 'x-unit-id'"), 'service runtime não propaga unidade por header interno');
assert.ok(requestUnit.includes("having count(distinct uu.unit_id) = 1"), 'fallback legado não falha fechado em cenário multiunidade');

const tenantRelationships = read('supabase/migrations/20260718213000_repair_tenant_relationships.sql');
assert.ok(tenantRelationships.includes('alter column cliente_id type bigint'), 'dados clínicos ainda usam tipo incompatível com clientes.id');
assert.ok(tenantRelationships.includes('anamneses_cliente_id_fkey'), 'anamnese ainda não referencia cliente canônico');
assert.ok(tenantRelationships.includes('prontuarios_cliente_id_fkey'), 'prontuário ainda não referencia cliente canônico');
assert.ok(tenantRelationships.includes('servico_etapas_servico_id_fkey'), 'etapas ainda podem ficar órfãs');
assert.ok(tenantRelationships.includes('private.enforce_parent_unit'), 'novos relacionamentos não validam a mesma unidade');

for (const file of [
  'src/app/admin/anamnese/page.tsx',
  'src/components/modals/AnamneseModal.tsx',
]) {
  const source = read(file);
  assert.ok(!source.includes("from('anamneses')"), `${file} ainda acessa anamneses diretamente`);
  assert.ok(!source.includes("from('prontuarios')"), `${file} ainda acessa prontuarios diretamente`);
}

const appointments = read('src/app/api/appointments/route.ts');
assert.ok(appointments.includes("error?.code === '23p01'"), 'API não traduz conflito concorrente');
assert.ok(appointments.includes("{ error: 'horário indisponível' }, { status: 409 }"), 'API não retorna 409 para sobreposição');

const legacyComandas = read('database/comandas_schema.sql');
assert.ok(legacyComandas.includes("nextval('public.comandas_numero_seq')"), 'bootstrap legado ainda não usa sequência de comanda');
assert.ok(!legacyComandas.includes('max(numero_comanda), 0) + 1'), 'bootstrap legado ainda reintroduz MAX()+1 concorrente');
assert.ok(!legacyComandas.includes('usuários autenticados e anônimos'), 'bootstrap legado ainda documenta acesso anônimo irrestrito');

console.log('OK: migrações de RLS, views, funções, agenda e webhook validadas estruturalmente.');
