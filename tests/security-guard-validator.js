/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function methodBody(source, method) {
  const start = source.indexOf(`export async function ${method}`);
  assert.notEqual(start, -1, `${method} não encontrado`);
  const nextExport = source.indexOf('export async function ', start + 1);
  return source.slice(start, nextExport === -1 ? source.length : nextExport);
}

function assertGuarded(relativePath, method) {
  const body = methodBody(read(relativePath), method);
  const guard = body.indexOf('requireAdmin(');
  assert.notEqual(guard, -1, `${relativePath} ${method} sem requireAdmin`);

  const databaseAccess = body.search(/createServerSupabase\(|\bfrom\('/);
  if (databaseAccess !== -1) {
    assert.ok(guard < databaseAccess, `${relativePath} ${method} acessa o banco antes do guard`);
  }
}

const guardedHandlers = [
  ['src/app/api/admin/abertura-caixa/route.ts', 'GET'],
  ['src/app/api/admin/abertura-caixa/route.ts', 'POST'],
  ['src/app/api/admin/agendamentos/route.ts', 'POST'],
  ['src/app/api/admin/agendamentos/route.ts', 'DELETE'],
  ['src/app/api/admin/anamneses/route.ts', 'GET'],
  ['src/app/api/admin/anamneses/route.ts', 'POST'],
  ['src/app/api/admin/anamneses/route.ts', 'PUT'],
  ['src/app/api/admin/anamneses/route.ts', 'DELETE'],
  ['src/app/api/admin/caixa/route.ts', 'GET'],
  ['src/app/api/admin/caixa/route.ts', 'POST'],
  ['src/app/api/admin/caixa/route.ts', 'PATCH'],
  ['src/app/api/admin/cadastros-excluidos/route.ts', 'GET'],
  ['src/app/api/admin/cadastros-excluidos/route.ts', 'POST'],
  ['src/app/api/admin/cadastros-excluidos/route.ts', 'DELETE'],
  ['src/app/api/admin/comandas/route.ts', 'POST'],
  ['src/app/api/admin/comandas/route.ts', 'DELETE'],
  ['src/app/api/admin/contas-fixas/route.ts', 'GET'],
  ['src/app/api/admin/contas-fixas/route.ts', 'POST'],
  ['src/app/api/admin/contas-fixas/route.ts', 'PUT'],
  ['src/app/api/admin/contas-fixas/route.ts', 'DELETE'],
  ['src/app/api/admin/contas-fixas/pagar/route.ts', 'POST'],
  ['src/app/api/admin/estoque/route.ts', 'GET'],
  ['src/app/api/admin/estoque/route.ts', 'POST'],
  ['src/app/api/admin/estoque/route.ts', 'DELETE'],
  ['src/app/api/admin/fundo-caixa/route.ts', 'GET'],
  ['src/app/api/admin/fundo-caixa/route.ts', 'POST'],
  ['src/app/api/admin/fechar-comanda/route.ts', 'POST'],
  ['src/app/api/admin/financeiro-stats/route.ts', 'GET'],
  ['src/app/api/admin/pacotes/route.ts', 'GET'],
  ['src/app/api/admin/pacotes/route.ts', 'POST'],
  ['src/app/api/admin/pacotes/route.ts', 'PATCH'],
  ['src/app/api/admin/pacotes/route.ts', 'DELETE'],
  ['src/app/api/admin/pacotes/cliente/route.ts', 'GET'],
  ['src/app/api/admin/pacotes/cliente/route.ts', 'POST'],
  ['src/app/api/admin/pacotes/cliente/route.ts', 'PATCH'],
  ['src/app/api/admin/pacotes/venda/route.ts', 'POST'],
  ['src/app/api/admin/produtos/route.ts', 'POST'],
  ['src/app/api/admin/servicos/route.ts', 'POST'],
  ['src/app/api/admin/prontuarios/route.ts', 'GET'],
  ['src/app/api/admin/prontuarios/route.ts', 'POST'],
  ['src/app/api/admin/prontuarios/route.ts', 'PUT'],
  ['src/app/api/admin/prontuarios/route.ts', 'DELETE'],
  ['src/app/api/admin/transacoes/route.ts', 'GET'],
  ['src/app/api/admin/transacoes/route.ts', 'POST'],
  ['src/app/api/admin/venda-rapida/route.ts', 'POST'],
  ['src/app/api/appointments/route.ts', 'GET'],
  ['src/app/api/appointments/close/route.ts', 'POST'],
  ['src/app/api/debug/check-user/route.ts', 'GET'],
  ['src/app/api/sales/route.ts', 'GET'],
  ['src/app/api/sales/route.ts', 'POST'],
  ['src/app/api/transactions/route.ts', 'GET'],
  ['src/app/api/transactions/route.ts', 'POST'],
  ['src/app/api/search/route.ts', 'GET'],
];

for (const [file, method] of guardedHandlers) assertGuarded(file, method);

const anamnesePage = read('src/app/admin/anamnese/page.tsx');
const anamneseModal = read('src/components/modals/AnamneseModal.tsx');
const prontuarioApi = read('src/app/api/admin/prontuarios/route.ts');
const deletedRecordsPage = read('src/app/admin/cadastros-excluidos/page.tsx');
assert.ok(anamnesePage.includes("fetch('/api/admin/anamneses'"), 'listagem clínica não usa API admin');
assert.ok(!anamnesePage.includes("from('anamneses')"), 'página ainda acessa anamneses pelo browser');
assert.ok(!anamneseModal.includes("from('anamneses')"), 'modal ainda grava anamnese pelo browser');
assert.ok(prontuarioApi.includes('requireAdmin('), 'API de prontuário não exige admin');
assert.ok(deletedRecordsPage.includes("fetch('/api/admin/cadastros-excluidos'"), 'lixeira não usa API admin');
assert.ok(!deletedRecordsPage.includes("from('cadastros_excluidos')"), 'lixeira ainda acessa snapshots pelo browser');
assert.ok(!deletedRecordsPage.includes('.upsert('), 'restauração ainda sobrescreve registros pelo browser');
assert.ok(
  read('src/app/api/admin/cadastros-excluidos/route.ts').includes("rpc('restore_deleted_record_atomic'"),
  'API da lixeira não usa restauração atômica'
);
const packageApi = read('src/app/api/admin/pacotes/route.ts');
assert.ok(packageApi.includes("rpc('save_service_package_atomic'"), 'API de pacotes não usa salvamento atômico');
assert.ok(!packageApi.includes(".from('pacotes_servicos_itens').insert"), 'API ainda insere itens fora da transação');
assert.ok(!read('src/app/admin/pacotes/page.tsx').includes(".from('pacotes_servicos').update"), 'página ainda altera pacote pelo browser');
assert.ok(!read('src/app/admin/servicos-new/page.tsx').includes(".from('pacotes_servicos').delete"), 'página ainda exclui pacote pelo browser');
assert.ok(read('src/app/api/admin/servicos/route.ts').includes("rpc('save_service_catalog_atomic'"), 'API de serviços não usa RPC atômica');
assert.ok(!read('src/components/modals/ServicoModal.tsx').includes(".from('servico_etapas').insert"), 'modal ainda salva etapas pelo browser');
assert.ok(
  read('src/app/api/admin/anamneses/route.ts').includes('TEXT_FIELDS'),
  'API de anamneses não limita campos aceitos'
);

const auth = read('src/lib/api-auth.ts');
assert.ok(!auth.includes('metaRole'), 'requireAdmin ainda contém fallback metaRole');
assert.ok(!auth.includes('user.user_metadata?.role'), 'requireAdmin ainda confia em user_metadata.role');
assert.ok(!auth.includes("adminSupabase.from('users').upsert"), 'requireAdmin ainda autoeleva/cria admin');
assert.ok(auth.includes(".from('user_units')"), 'requireAdmin não resolve a unidade por associação canônica');
assert.ok(auth.includes(".eq('is_default', true)"), 'requireAdmin aceita associação não padrão');
assert.ok(auth.includes('unitId: membership.unit_id'), 'requireAdmin não devolve a unidade autorizada');
assert.match(auth, /if \(roleError \|\| !userRow\)[\s\S]*?status: 403/, 'falha de role não está fail-closed');

const proxy = read('src/proxy.ts');
assert.ok(!proxy.includes("'/api/appointments',"), 'proxy ainda libera todo o prefixo appointments');
assert.ok(
  proxy.includes("pathname === '/api/appointments' && method === 'POST'"),
  'criação pública de agendamento não está explicitamente limitada a POST'
);
assert.ok(
  proxy.includes("pathname === '/api/appointments/availability' && method === 'GET'"),
  'disponibilidade pública não está explicitamente limitada a GET'
);

const appointments = read('src/app/api/appointments/route.ts');
assert.ok(methodBody(appointments, 'POST').includes('export async function POST'));
const appointmentsPost = methodBody(appointments, 'POST');
assert.ok(appointmentsPost.includes('isValidDate'), 'agendamento público não valida data');
assert.ok(appointmentsPost.includes('isValidTime'), 'agendamento público não valida horário');
assert.ok(
  appointmentsPost.includes('if (conflictsError)'),
  'agendamento público falha aberto quando a consulta de conflitos falha'
);
assert.ok(
  appointmentsPost.includes('normalizedPhone'),
  'agendamento público não normaliza telefone'
);

const salesSource = read('src/app/api/sales/route.ts');
const salesPost = methodBody(salesSource, 'POST');
const salesService = read('src/services/sales.ts');
assert.ok(!salesPost.includes('item.price'), 'API de vendas ainda aceita preço enviado pelo cliente');
assert.ok(
  salesPost.includes('executeProductSale(')
    && salesService.includes("rpc('process_product_sale_atomic'"),
  'API de vendas não usa a transação canônica de produto/estoque'
);
assert.ok(salesSource.includes('Array.isArray(value)'), 'API de vendas não valida products como array');
assert.ok(salesSource.includes('Number.isInteger(quantity)'), 'API de vendas aceita quantidade não inteira');

const transactionsPost = methodBody(read('src/app/api/transactions/route.ts'), 'POST');
const validationSource = read('src/lib/validation.ts');
assert.ok(
  transactionsPost.includes('asMoney(body.amount)')
    && validationSource.includes('Number.isFinite(number)'),
  'API legada de transações não valida valor financeiro finito'
);

const fecharComandaPost = methodBody(read('src/app/api/admin/fechar-comanda/route.ts'), 'POST');
assert.ok(
  fecharComandaPost.includes("rpc('close_comanda_atomic'")
    || fecharComandaPost.includes("rpc('close_comanda_with_payment_atomic'"),
  'fechamento de comanda não usa a transação atômica do banco'
);
assert.ok(
  fecharComandaPost.includes('p_discount: Math.round(desconto * 100) / 100'),
  'fechamento de comanda não normaliza o desconto antes da RPC'
);
assert.ok(
  !fecharComandaPost.includes(".from('transacoes')"),
  'fechamento de comanda ainda mantém saga financeira na API'
);

const comandaDrawer = read('src/components/modals/ComandaViewDrawer.tsx');
const comandaModal = read('src/components/modals/ComandaModal.tsx');
assert.ok(comandaModal.includes("fetch('/api/admin/comandas'"), 'modal de comanda não usa API atômica');
assert.ok(!comandaModal.includes("from('comanda_itens').insert"), 'modal ainda grava itens diretamente');
assert.ok(!comandaModal.includes('movimentarEstoque'), 'modal ainda altera estoque no browser');
assert.ok(
  comandaDrawer.includes("method: 'DELETE'"),
  'drawer não usa cancelamento atômico de comanda'
);
const fechamentoPayload = comandaDrawer.slice(
  comandaDrawer.indexOf("fetch('/api/admin/fechar-comanda'"),
  comandaDrawer.indexOf('if (!transResp.ok)')
);
assert.ok(!fechamentoPayload.includes('valor:'), 'drawer ainda envia valor financeiro ao endpoint');
assert.ok(!fechamentoPayload.includes('descricao:'), 'drawer ainda envia descrição financeira ao endpoint');
assert.ok(!fechamentoPayload.includes('data:'), 'drawer ainda envia data financeira ao endpoint');

const appointmentClose = methodBody(read('src/app/api/appointments/close/route.ts'), 'POST');
assert.ok(
  appointmentClose.includes("rpc('close_appointment_atomic'"),
  'fechamento de agendamento não usa a transação atômica do banco'
);
assert.ok(
  appointmentClose.includes('UUID_PATTERN.test(appointmentId)'),
  'fechamento de agendamento não valida o UUID'
);
assert.ok(
  !appointmentClose.includes(".from('transacoes')"),
  'fechamento de agendamento ainda mantém compensação manual'
);

const caixaSource = read('src/app/api/admin/caixa/route.ts');
const caixaGet = methodBody(caixaSource, 'GET');
const caixaPost = methodBody(caixaSource, 'POST');
const caixaPatch = methodBody(caixaSource, 'PATCH');
assert.ok(
  caixaPost.includes('const { data } = await req.json()'),
  'fechamento de caixa ainda aceita totais ou autoria do cliente'
);
assert.ok(caixaPost.includes('fechado_por: authResult.id'), 'fechamento de caixa não usa o admin autenticado');
assert.ok(caixaPost.includes('Promise.all'), 'fechamento de caixa não paraleliza fontes independentes');
assert.ok(
  (caixaGet.match(/Promise\.all/g) ?? []).length >= 2,
  'consulta do caixa não paraleliza fontes independentes e dependentes em duas fases'
);
assert.ok(
  caixaGet.includes('firstError') && caixaGet.includes('dependentError'),
  'consulta do caixa ignora erro em alguma fonte financeira'
);
assert.ok(
  caixaPatch.includes('reaberto_por: authResult.id'),
  'reabertura de caixa ainda aceita autoria do cliente'
);

const financeiroStats = methodBody(read('src/app/api/admin/financeiro-stats/route.ts'), 'GET');
assert.ok(
  financeiroStats.includes('getCachedFinancialStats(auth.unitId'),
  'estatísticas financeiras não usam cache segregado por unidade'
);
assert.ok(!financeiroStats.includes(".from('transacoes')"), 'estatísticas financeiras ainda carregam transações na aplicação');

for (const route of [
  'src/app/api/search/route.ts',
  'src/app/api/sales/route.ts',
  'src/app/api/transactions/route.ts',
  'src/app/api/admin/caixa/route.ts',
  'src/app/api/admin/anamneses/route.ts',
  'src/app/api/admin/prontuarios/route.ts',
  'src/app/api/admin/pacotes/route.ts',
]) {
  const delegatedSource = route.endsWith('/sales/route.ts')
    ? read('src/services/sales.ts')
    : route.endsWith('/transactions/route.ts')
      ? read('src/services/transactions.ts')
      : '';
  const source = `${read(route)}\n${delegatedSource}`;
  assert.ok(
    source.includes(".eq('unit_id',") || source.includes('p_unit_id:'),
    `${route} usa service_role sem filtro de unidade`,
  );
}
assert.ok(read('src/lib/supabase-server.ts').includes("'x-unit-id': unitId"), 'cliente privilegiado não propaga contexto de unidade');

const apiRoot = path.join(root, 'src', 'app', 'api');
const unscopedPrivilegedClients = fs.readdirSync(apiRoot, { recursive: true })
  .filter((entry) => String(entry).endsWith('route.ts'))
  .map((entry) => path.join('src', 'app', 'api', String(entry)).replaceAll('\\', '/'))
  .filter((route) => read(route).includes('createServerSupabase()'));
assert.deepEqual(unscopedPrivilegedClients.sort(), [
  'src/app/api/appointments/availability/route.ts',
  'src/app/api/appointments/route.ts',
  'src/app/api/whatsapp/agendar/route.ts',
  'src/app/api/whatsapp/horarios/route.ts',
], 'rota administrativa ainda cria cliente service_role sem contexto de unidade');

const createUser = methodBody(read('src/app/api/admin/create-user/route.ts'), 'POST');
assert.ok(createUser.includes("rpc('provision_app_user_atomic'"), 'criação de usuário não provisiona o perfil atomicamente');
assert.ok(createUser.includes('p_unit_id: auth.unitId'), 'criação de usuário não herda a unidade autorizada');
assert.ok(createUser.includes('deleteUser(authId)'), 'criação de usuário não compensa falha após criar o Auth user');
assert.ok(!createUser.includes('user_metadata: { role'), 'criação de usuário ainda grava autorização em user_metadata');

const updateUserRole = methodBody(read('src/app/api/admin/update-user-role/route.ts'), 'PATCH');
assert.ok(updateUserRole.includes(".from('users')"), 'alteração de role não atualiza a fonte canônica');
assert.ok(!updateUserRole.includes('updateUserById'), 'alteração de role ainda duplica autorização no Auth metadata');

const searchGet = methodBody(read('src/app/api/search/route.ts'), 'GET');
assert.ok(searchGet.includes('Promise.all'), 'busca de serviços ainda executa estratégias em série');
assert.ok(!searchGet.includes('.or('), 'busca de serviços ainda interpola usuário em filtro PostgREST raw');
assert.ok(searchGet.includes(".ilike('descricao'"), 'busca de serviços não usa a coluna canônica descricao');

const quickSale = methodBody(read('src/app/api/admin/venda-rapida/route.ts'), 'POST');
assert.ok(
  quickSale.includes('executeQuickSale(')
    && salesService.includes("rpc('finalize_quick_sale_atomic'"),
  'venda rápida não usa RPC atômica',
);
assert.ok(
  quickSale.includes('requestId: operationRequestId')
    && salesService.includes('p_request_id: input.requestId'),
  'venda rápida não envia chave idempotente',
);
assert.ok(!quickSale.includes(".from('transacoes')"), 'venda rápida ainda mantém saga financeira na API');

const quickSaleDrawer = read('src/components/modals/VendaRapidaModal.tsx');
assert.ok(
  quickSaleDrawer.includes("fetch('/api/admin/venda-rapida'"),
  'modal de venda rápida ainda não usa o endpoint canônico'
);
assert.ok(!quickSaleDrawer.includes("from('transacoes')"), 'modal de venda rápida ainda grava receita no browser');

const fixedAccountPayment = methodBody(read('src/app/api/admin/contas-fixas/pagar/route.ts'), 'POST');
assert.ok(fixedAccountPayment.includes("rpc('pay_fixed_account_atomic'"), 'pagamento de conta fixa não é atômico');
assert.ok(!fixedAccountPayment.includes("from('transacoes')"), 'pagamento de conta fixa ainda mantém saga na API');

const cashFund = read('src/app/api/admin/fundo-caixa/route.ts');
assert.ok(methodBody(cashFund, 'POST').includes("rpc('adjust_cash_fund_atomic'"), 'fundo de caixa não usa RPC atômica');
assert.ok(!methodBody(cashFund, 'POST').includes(".from('fundo_caixa')"), 'fundo de caixa ainda usa leitura-modificação-escrita');

const packageClient = read('src/app/api/admin/pacotes/cliente/route.ts');
assert.ok(methodBody(packageClient, 'PATCH').includes("rpc('consume_package_sessions_atomic'"), 'consumo de pacote não é atômico');
assert.ok(!methodBody(packageClient, 'PATCH').includes(".update("), 'consumo de pacote ainda atualiza saldo diretamente');

const productModal = read('src/components/modals/ProdutoModal.tsx');
const productApi = methodBody(read('src/app/api/admin/produtos/route.ts'), 'POST');
assert.ok(productModal.includes("fetch('/api/admin/produtos'"), 'modal de produto não usa API administrativa');
assert.ok(!productModal.includes("from('produtos')"), 'modal de produto ainda grava catálogo no browser');
assert.ok(productApi.includes("rpc('save_product_atomic'"), 'produto e estoque não são salvos atomicamente');

const publicScheduling = read('src/app/agendar/page.tsx');
assert.ok(!publicScheduling.includes('fn_horarios_vagos'), 'página pública ainda chama RPC de horários');
assert.ok(
  publicScheduling.includes("fetch(`/api/appointments/availability?${params}`"),
  'página pública não usa a API server-side de disponibilidade'
);

const availabilityRoute = read('src/app/api/appointments/availability/route.ts');
assert.ok(availabilityRoute.includes('createServerSupabase'), 'disponibilidade não usa service_role no servidor');
assert.ok(availabilityRoute.includes('isValidSchedulingDate'), 'disponibilidade não valida data civil');

for (const whatsappRoute of [
  'src/app/api/whatsapp/horarios/route.ts',
  'src/app/api/whatsapp/agendar/route.ts',
]) {
  const source = read(whatsappRoute);
  assert.ok(source.includes('status: 503'), `${whatsappRoute} não falha fechado sem N8N_API_KEY`);
  assert.ok(source.includes('timingSafeEqual'), `${whatsappRoute} não compara a chave em tempo constante`);
}
const whatsappAvailability = read('src/app/api/whatsapp/horarios/route.ts');
assert.ok(
  !whatsappAvailability.includes("from '@/lib/supabase'"),
  'horários do WhatsApp ainda usa cliente de browser'
);

console.log(`OK: ${guardedHandlers.length} handlers protegidos e rotas públicas restritas.`);
