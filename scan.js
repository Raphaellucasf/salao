// ============================================================
// AUTO-SCAN — Otimiza Beauty  (versão avançada)
// Testa: login → sidebar → formulários → modais → erros JS
// Uso: node scan.js
// ============================================================

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const EMAIL    = 'lucasraphael.lr@gmail.com';
const SENHA    = '000000';

// ─── Menu lateral (ordem do AdminSidebarNew.tsx) ────────────
const SIDEBAR_ITEMS = [
  { label: 'Dashboard',      path: '/admin/dashboard'    },
  { label: 'Agenda',         path: '/admin/agenda'       },
  { label: 'Clientes',       path: '/admin/clientes'     },
  { label: 'Profissionais',  path: '/admin/profissionais'},
  { label: 'Produtos',       path: '/admin/produtos'     },
  { label: 'Serviços',       path: '/admin/servicos-new' },
  { label: 'Financeiro',     path: '/admin/financeiro'   },
  { label: 'Estoque',        path: '/admin/estoque'      },
  { label: 'Relatórios',     path: '/admin/relatorios'   },
  { label: 'Usuários',       path: '/admin/usuarios'     },
  { label: 'Configurações',  path: '/admin/configuracoes'},
];

// ─── Testes específicos de formulário por página ────────────
// Cada entrada: página → array de ações a executar
const FORM_TESTS = {
  '/admin/clientes': [
    {
      desc: 'Abrir modal Novo Cliente, preencher e cancelar',
      steps: async (page, log) => {
        // O botão é o círculo "+" com classe rounded-full no header da página Clientes
        // Usa selector específico para não confundir com botões de linha da tabela
        const roundBtn = page.locator('button[class*="rounded-full"]').first();
        const hasRoundBtn = await roundBtn.isVisible().catch(() => false);
        
        const btn = hasRoundBtn
          ? roundBtn
          : page.locator('button:visible').filter({ hasText: /novo|cliente/i }).first();

        if (!(await btn.isVisible().catch(() => false))) {
          log('warn', 'Clientes — Botão "Novo/+" não encontrado');
          return;
        }

        await btn.click();
        await page.waitForTimeout(800);

        if (!(await isModalOpen(page))) {
          log('warn', 'Clientes — Modal não abriu após clicar no "+"');
          return;
        }
        log('ok', 'Clientes — Modal "Novo Cliente" abriu');

        const nomeInput = page.locator('input[placeholder*="Maria Silva" i], input[placeholder*="nome" i]').first();
        if (await nomeInput.isVisible().catch(() => false)) {
          await nomeInput.fill('TESTE PLAYWRIGHT');
          log('ok', 'Clientes — Campo nome preenchido');
        }
        const telInput = page.locator('input[placeholder*="98765" i], input[placeholder*="telefone" i]').first();
        if (await telInput.isVisible().catch(() => false)) {
          await telInput.fill('(11) 99999-0000');
          log('ok', 'Clientes — Campo telefone preenchido');
        }

        await closeModal(page);
        log('ok', 'Clientes — Modal fechado com Cancelar');
      }
    }
  ],

  '/admin/profissionais': [
    {
      desc: 'Abrir modal Novo Profissional, preencher e cancelar',
      steps: async (page, log) => {
        // Aguarda o React hidratar (buttons podem aparecer depois do SSR)
        await page.waitForSelector('button:visible', { timeout: 5000 }).catch(() => null);
        await page.waitForTimeout(500);

        const btn = page.locator('button:visible').filter({ hasText: /novo profissional/i }).first();
        if (!(await btn.isVisible().catch(() => false))) {
          log('warn', 'Profissionais — Botão "Novo Profissional" não encontrado');
          return;
        }

        await btn.click();
        await page.waitForTimeout(800);

        if (!(await isModalOpen(page))) {
          log('warn', 'Profissionais — Modal não abriu');
          return;
        }
        log('ok', 'Profissionais — Modal "Novo Profissional" abriu');

        const nomeInput = page.locator('input[placeholder*="profissional" i], input[placeholder*="nome" i]').first();
        if (await nomeInput.isVisible().catch(() => false)) {
          await nomeInput.fill('Prof. Teste Playwright');
          log('ok', 'Profissionais — Campo nome preenchido');
        }

        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('teste_playwright@teste.com');
          log('ok', 'Profissionais — Campo email preenchido');
        }

        await closeModal(page);
        log('ok', 'Profissionais — Modal fechado com Cancelar');
      }
    }
  ],

  '/admin/servicos-new': [
    {
      desc: 'Navegar para aba Grupos, abrir modal, preencher e cancelar',
      steps: async (page, log) => {
        // Aguarda o React hidratar
        await page.waitForSelector('button:visible', { timeout: 5000 }).catch(() => null);
        await page.waitForTimeout(500);

        // 1. Clica na aba "Grupos" para tornar o botão "Novo Grupo" visível
        // O texto do botão é "Grupos (N)" — usar hasText para match parcial
        const gruposTab = page.locator('button:visible').filter({ hasText: /grupos/i }).first();
        if (await gruposTab.isVisible().catch(() => false)) {
          await gruposTab.click();
          await page.waitForTimeout(600);
          log('ok', 'Serviços — Aba "Grupos" clicada');
        } else {
          log('warn', 'Serviços — Aba Grupos não encontrada');
        }

        // 2. Agora o botão "Novo Grupo" deve estar visível
        const grupoBtn = page.locator('button:visible').filter({ hasText: /novo grupo/i }).first();
        if (!(await grupoBtn.isVisible().catch(() => false))) {
          log('warn', 'Serviços — Botão "Novo Grupo" não ficou visível após mudar aba');
          return;
        }

        await grupoBtn.click();
        await page.waitForTimeout(800);

        if (!(await isModalOpen(page))) {
          log('warn', 'Serviços — Modal "Novo Grupo" não abriu');
          return;
        }
        log('ok', 'Serviços — Modal "Novo Grupo" abriu');

        const nomeInput = page.locator('input[placeholder*="Cabelo" i], input[placeholder*="grupo" i]').first();
        if (await nomeInput.isVisible().catch(() => false)) {
          await nomeInput.fill('Grupo Teste Playwright');
          log('ok', 'Serviços — Campo nome do grupo preenchido');
        }

        await closeModal(page);
        log('ok', 'Serviços — Modal "Novo Grupo" fechado');

        // 3. Testa aba Pacotes também
        const pacotesTab = page.locator('button:visible').filter({ hasText: /pacotes/i }).first();
        if (await pacotesTab.isVisible().catch(() => false)) {
          await pacotesTab.click();
          await page.waitForTimeout(600);
          const pacoteBtn = page.locator('button:visible').filter({ hasText: /novo pacote/i }).first();
          if (await pacoteBtn.isVisible().catch(() => false)) {
            await pacoteBtn.click();
            await page.waitForTimeout(800);
            if (await isModalOpen(page)) {
              log('ok', 'Serviços — Modal "Novo Pacote" abriu');
              await closeModal(page);
              log('ok', 'Serviços — Modal "Novo Pacote" fechado');
            }
          }
        }
      }
    }
  ],
};

// ─── Palavras que indicam botões destrutivos/saída ──────────
const SKIP_WORDS = ['excluir', 'deletar', 'remover', 'sair', 'logout', 'cancelar conta', 'apagar'];

// ─── Detecta se um modal/overlay está aberto ────────────────
// O Modal.tsx seta document.body.style.overflow = 'hidden' ao abrir
async function isModalOpen(page) {
  return await page.evaluate(() => document.body.style.overflow === 'hidden').catch(() => false);
}

// ─── Fecha modal aberto (botão Cancelar → Escape) ───────────
async function closeModal(page) {
  const cancelBtn = page.getByRole('button', { name: /cancelar/i }).first();
  try {
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  } catch {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(400);
}

const results = { ok: [], warn: [], error: [] };

function log(type, msg) {
  const icons = { ok: '✅', warn: '⚠️ ', error: '❌' };
  console.log(`${icons[type]} ${msg}`);
  results[type].push(msg);
}

// ─── Navega para uma URL e verifica status + erros JS ───────
async function loadPage(page, url, label) {
  const pageErrors = [];
  const onConsole = msg => { if (msg.type() === 'error') pageErrors.push(msg.text()); };
  const onPageErr = err => pageErrors.push(err.message);

  page.on('console', onConsole);
  page.on('pageerror', onPageErr);

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);

  page.off('console', onConsole);
  page.off('pageerror', onPageErr);

  if (!response) { log('error', `${label} — Timeout / falha de rede`); return false; }

  const status = response.status();
  if (status >= 400)  { log('error', `${label} — HTTP ${status}`); return false; }

  // Aguarda React hidratar
  await page.waitForTimeout(1200);

  if (pageErrors.length > 0) {
    pageErrors.forEach(e => log('warn', `${label} — JS error: ${e.substring(0, 140)}`));
  } else {
    log('ok', `${label} — HTTP ${status}, sem erros JS`);
  }

  const btns   = await page.$$('button:visible').catch(() => []);
  const links  = await page.$$('a[href]:visible').catch(() => []);
  const inputs = await page.$$('input:visible, select:visible').catch(() => []);
  console.log(`   └─ ${btns.length} botões | ${links.length} links | ${inputs.length} inputs`);
  return true;
}

// ─── Login ──────────────────────────────────────────────────
async function testLogin(page) {
  console.log('\n🔐 Fazendo login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const emailField = await page.$('input[type="email"]');
  const passField  = await page.$('input[type="password"]');
  if (!emailField || !passField) { log('error', 'Login — Campos email/senha não encontrados'); return false; }

  await emailField.fill(EMAIL);
  await passField.fill(SENHA);

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click(); else await page.keyboard.press('Enter');

  await page.waitForTimeout(3500);

  const url = page.url();
  if (url.includes('/admin') || url.includes('/dashboard')) {
    log('ok', `Login — Autenticado ✓ → ${url}`);
    return true;
  } else if (url.includes('/login')) {
    log('error', 'Login — Permaneceu no /login. Verifique credenciais.');
    return false;
  }
  log('warn', `Login — Redirecionado para ${url}`);
  return true;
}

// ─── Navega via sidebar clicando nos links ──────────────────
async function testSidebar(page) {
  console.log('\n\n🗂️  ══ TESTE DE NAVEGAÇÃO SIDEBAR ══');
  for (const item of SIDEBAR_ITEMS) {
    const fullUrl = `${BASE_URL}${item.path}`;
    console.log(`\n📎 Sidebar → ${item.label}  (${item.path})`);

    // Tenta clicar no link da sidebar
    const sidebarLink = page.locator(`a[href="${item.path}"]`).first();
    let clicked = false;
    try {
      if (await sidebarLink.isVisible()) {
        await sidebarLink.click({ timeout: 3000 });
        clicked = true;
      }
    } catch { /* fallback below */ }

    if (clicked) {
      await page.waitForTimeout(1500);
      const currentPath = new URL(page.url()).pathname;
      if (currentPath === item.path || currentPath.startsWith(item.path)) {
        log('ok', `Sidebar / ${item.label} — Navegou para ${currentPath}`);
      } else {
        // O link clicou mas URL não mudou — tenta fallback goto
        await loadPage(page, fullUrl, `Sidebar / ${item.label} (fallback)`);
      }
    } else {
      // Sidebar pode estar recolhida — goto direto
      await loadPage(page, fullUrl, `Sidebar / ${item.label}`);
    }

    // Conta elementos na página após navegação
    const btns   = await page.$$('button:visible').catch(() => []);
    const inputs = await page.$$('input:visible, select:visible').catch(() => []);
    console.log(`   └─ ${btns.length} botões | ${inputs.length} inputs visíveis`);
  }
}

// ─── Páginas que não têm modais "Novo" (por design) ─────────
const PAGES_WITHOUT_MODALS = new Set([
  '/admin/dashboard',
  '/admin/agenda',
  '/admin/servicos-new', // botões Novo estão atrás de tabs — testado no testForms
  '/admin/relatorios',
  '/admin/configuracoes',
]);

// ─── Clica botões "Novo / +" de cada página e fecha o modal ─
async function testModalButtons(page) {
  console.log('\n\n🪟  ══ TESTE DE MODAIS (botões Novo / +) ══');

  for (const item of SIDEBAR_ITEMS) {
    await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(1400);

    // Encontra botões com texto OU icon-only (svgs: Plus icon) que sejam candidatos a "novo"
    // filtra por texto contendo novo/adicionar/+ OU botões que contêm apenas SVG (icon-only add buttons)
    const allBtns  = await page.locator('button:visible').all().catch(() => []);
    const textBtns = []; // botões com texto correspondente (prioridade)
    const iconBtns = []; // botões icon-only (fallback)

    for (const btn of allBtns) {
      const txt = (await btn.textContent().catch(() => '')).trim().toLowerCase();
      if (SKIP_WORDS.some(w => txt.includes(w))) continue;
      if (/novo|adicionar|\+/i.test(txt)) { textBtns.push(btn); }
      else if (txt === '' || txt.length <= 3) { iconBtns.push(btn); }
    }

    // Tenta primeiro botões com texto, depois icon-only (max 3 de cada)
    const newBtns = [...textBtns.slice(0, 4), ...iconBtns.slice(0, 4)];

    if (newBtns.length === 0) {
      console.log(`   ⟶ ${item.label}: sem botões "Novo/+" visíveis`);
      continue;
    }

    let modalTested = false;
    for (const btn of newBtns.slice(0, 5)) {
      const txt = (await btn.textContent().catch(() => '')).trim().substring(0, 50) || '(ícone)';
      if (SKIP_WORDS.some(w => txt.toLowerCase().includes(w))) continue;

      // Garante que nenhum modal está aberto antes
      if (await isModalOpen(page)) await closeModal(page);

      await btn.click({ timeout: 2000 }).catch(() => null);
      await page.waitForTimeout(700);

      const opened = await isModalOpen(page);

      if (opened) {
        log('ok', `${item.label} — Modal abriu ao clicar "${txt}"`);
        await closeModal(page);
        const closed = !(await isModalOpen(page));
        if (closed) {
          log('ok', `${item.label} — Modal fechou após Cancelar/Escape`);
        } else {
          log('warn', `${item.label} — Modal não fechou após Cancelar/Escape`);
        }
        modalTested = true;
        break; // Um modal por página é suficiente para validação
      }
    }

    if (!modalTested) {
      if (PAGES_WITHOUT_MODALS.has(item.path)) {
        console.log(`   ℹ️  ${item.label} — Sem modal "Novo" (esperado para esta página)`);
      } else {
        log('warn', `${item.label} — Nenhum botão abriu modal (verifique a página)`);
      }
    }

    // Retorna à página se a URL mudou
    if (!page.url().includes(item.path)) {
      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => null);
      await page.waitForTimeout(800);
    }
  }
}

// ─── Testes detalhados de formulário ────────────────────────
async function testForms(page) {
  console.log('\n\n📝  ══ TESTE DE FORMULÁRIOS ══');
  for (const [path, tests] of Object.entries(FORM_TESTS)) {
    const label = path.replace('/admin/', '');
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2000); // Extra wait para React hidratar completamente

    for (const test of tests) {
      console.log(`\n   📋 ${label}: ${test.desc}`);
      await test.steps(page, log).catch(err => log('warn', `${label} — Erro no teste: ${err.message}`));
    }
  }
}

// ─── Página de login: validação de campos ───────────────────
async function testLoginValidation(page) {
  console.log('\n\n🔒  ══ TESTE VALIDAÇÃO DE LOGIN ══');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Tenta enviar formulário vazio
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(600);
    const stillOnLogin = page.url().includes('/login');
    log(stillOnLogin ? 'ok' : 'warn', 'Login — Envio com campos vazios: ' + (stillOnLogin ? 'bloqueado na página' : 'redirecionou!'));
  }
}

(async () => {
  console.log('═════════════════════════════════════════════════');
  console.log('  🔍  OTIMIZA BEAUTY — SCAN COMPLETO AVANÇADO');
  console.log('═════════════════════════════════════════════════');
  console.log(`  URL : ${BASE_URL}`);
  console.log(`  Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('═════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await context.newPage();

  // Auto-dismiss qualquer dialog (confirm/alert) para não travar o scan
  page.on('dialog', async dialog => {
    console.log(`   🔔 Dialog auto-dismissido: "${dialog.message().substring(0, 60)}"`);
    await dialog.dismiss();
  });

  // ═══ 1. Páginas públicas ════════════════════════════════════
  console.log('\n\n🌐  ══ PÁGINAS PÚBLICAS ══');
  await loadPage(page, BASE_URL, 'Home');
  await loadPage(page, `${BASE_URL}/login`, 'Login');

  // ═══ 2. Validação do login vazio ════════════════════════════
  await testLoginValidation(page);

  // ═══ 3. Login como admin ════════════════════════════════════
  const loggedIn = await testLogin(page);
  if (!loggedIn) {
    console.log('\n❌ Abortando: não foi possível autenticar.');
    await browser.close();
    process.exit(1);
  }

  // ═══ 4. Navegação via sidebar ═══════════════════════════════
  await testSidebar(page);

  // ═══ 5. Teste de modais (botões Novo/+) ═════════════════════
  await testModalButtons(page);

  // ═══ 6. Testes detalhados de formulários ════════════════════
  await testForms(page);

  await browser.close();

  // ═══ RELATÓRIO FINAL ════════════════════════════════════════
  console.log('\n\n═════════════════════════════════════════════════');
  console.log('  📊  RELATÓRIO FINAL');
  console.log('═════════════════════════════════════════════════');
  console.log(`  ✅ OK     : ${results.ok.length}`);
  console.log(`  ⚠️  Avisos : ${results.warn.length}`);
  console.log(`  ❌ Erros  : ${results.error.length}`);

  if (results.warn.length > 0) {
    console.log('\n⚠️  AVISOS:');
    results.warn.forEach(w => console.log(`   • ${w}`));
  }
  if (results.error.length > 0) {
    console.log('\n❌ ERROS:');
    results.error.forEach(e => console.log(`   • ${e}`));
  }

  console.log('\n══════════════════════════════════════════');
  
  const exitCode = results.error.length > 0 ? 1 : 0;
  process.exit(exitCode);
})();
