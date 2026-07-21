# Últimos sete itens da Auditoria Implementation Plan

> **For agentic workers:** execução inline nesta tarefa; subagentes não foram solicitados. Cada etapa usa checkbox para registrar evidência antes de atualizar a Auditoria Viva.

**Goal:** encerrar os quatro itens restantes de Code Quality e os três itens de Melhorias com contratos compartilhados, lint sem avisos, testes verificáveis, documentação canônica, artefatos locais saneados e observabilidade segura.

**Architecture:** respostas de API, validação e telemetria passam por módulos pequenos em `src/lib`; rotas sensíveis consomem esses contratos em vez de repetir autorização, erros e logs. O passivo TypeScript é removido com tipos concretos ou `unknown` estreitado, nunca pela desativação de regras. Testes Node estruturais e Playwright protegem os contratos sem adicionar dependências.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript 5, Supabase JS/SSR, ESLint 9 e Playwright 1.58.

## Global Constraints

- Não fazer deploy, migração, commit ou push.
- Não alterar o Supabase durante a janela de observação de 24–48 horas.
- Não registrar, imprimir ou copiar valores de chaves.
- Não desativar regras do ESLint para esconder avisos existentes.
- Preservar as alterações não relacionadas já presentes no worktree.

---

### Task 1: Contratos únicos de erro, validação e observabilidade

**Files:**
- Create: `src/lib/api-response.ts`
- Create: `src/lib/observability.ts`
- Create: `src/lib/validation.ts`
- Create: `tests/code-quality-validator.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `apiError(code, message, status, requestId?)`, `apiSuccess(data, status?)`, `getRequestId(request)`, `logSecurityEvent(event)`, `toErrorDetails(value)`, `parseJsonObject(request, limits)` e validadores primitivos.
- Consumes: `NextRequest`, `NextResponse`, `crypto.randomUUID` e tipos JSON seguros.

- [ ] Criar teste estrutural que falha enquanto não existirem os três módulos, enquanto logs aceitarem chaves sensíveis ou enquanto respostas internas vazarem `error.message`.
- [ ] Implementar respostas com envelope `{ error: { code, message }, requestId }`, mantendo mensagens públicas opacas e códigos estáveis.
- [ ] Implementar logger JSON server-only com allowlist de campos (`event`, `route`, `status`, `requestId`, `unitId`, `errorClass`) e redator recursivo para `token`, `authorization`, `cookie`, `password`, `secret`, `apikey` e dados pessoais.
- [ ] Implementar leitura JSON com limite, verificação de objeto e validadores reutilizáveis de UUID, inteiro positivo, dinheiro, data e texto.
- [ ] Adicionar `test:quality` ao `package.json` e comprovar que o teste inicialmente falha, depois passa.

### Task 2: Autorização e finanças sem lógica paralela

**Files:**
- Modify: `src/lib/api-auth.ts`
- Create: `src/services/transactions.ts`
- Create: `src/services/sales.ts`
- Modify: `src/app/api/transactions/route.ts`
- Modify: `src/app/api/admin/transacoes/route.ts`
- Modify: `src/app/api/sales/route.ts`
- Modify: `src/app/api/admin/venda-rapida/route.ts`
- Modify: `src/app/api/admin/financeiro-stats/route.ts`
- Test: `tests/code-quality-validator.js`

**Interfaces:**
- Consumes: contratos da Task 1 e `requireAdmin(request)`.
- Produces: `listTransactions(context, filters)`, `createTransaction(context, input)`, `listSaleProducts(context)` e `executeQuickSale(context, input)`; rotas ficam adaptadores HTTP sem regra financeira duplicada.

- [ ] Fazer o validador detectar consultas/escritas financeiras duplicadas dentro das rotas legadas e administrativas.
- [ ] Fazer `requireAdmin` retornar falhas padronizadas e emitir somente eventos seguros de autenticação/autorização.
- [ ] Extrair listagem/criação de transações para `services/transactions.ts`, preservando escopo por unidade e contratos HTTP existentes.
- [ ] Extrair catálogo/venda para `services/sales.ts`, preservando preço canônico, atomicidade RPC e invalidação de cache.
- [ ] Fazer as quatro rotas chamarem os serviços compartilhados e confirmar ausência de cliente Supabase/duplicação financeira nos adaptadores.

### Task 3: Observabilidade segura nas fronteiras críticas

**Files:**
- Modify: `src/app/api/appointments/route.ts`
- Modify: `src/app/api/appointments/availability/route.ts`
- Modify: `src/app/api/appointments/close/route.ts`
- Modify: `src/app/api/whatsapp/agendar/route.ts`
- Modify: `src/app/api/whatsapp/horarios/route.ts`
- Modify: handlers em `src/app/api/admin/**/route.ts` que ainda usam `console.*`
- Test: `tests/code-quality-validator.js`

**Interfaces:**
- Consumes: `getRequestId`, `logSecurityEvent`, `apiError` e `toErrorDetails`.
- Produces: eventos `auth.denied`, `tenant.denied`, `appointment.conflict`, `integration.unavailable`, `integration.failure` e `operation.failure`, sem payload, segredo ou PII.

- [ ] Fazer o teste falhar para `console.*` em API routes, mensagens internas retornadas ao cliente e eventos sem request ID.
- [ ] Trocar logs de autenticação por eventos com status, rota, classe de erro e unidade autorizada.
- [ ] Instrumentar conflitos 409 de agenda e falhas de integração WhatsApp/n8n com classes opacas.
- [ ] Migrar os demais `console.*` de handlers administrativos para o logger seguro.
- [ ] Confirmar que o scanner de segredos e o validador de qualidade passam.

### Task 4: Lint completo sem avisos reais

**Files:**
- Modify: os 64 arquivos listados pelo relatório ESLint em `src/` e `tests/`.
- Modify: `src/types/jspdf-autotable.d.ts`
- Test: configuração existente `eslint.config.mjs` sem relaxar regras.

**Interfaces:**
- Consumes: `Database`, tipos de domínio locais, `unknown`, type guards e callbacks estáveis.
- Produces: zero erros e zero avisos em `npx eslint src tests --max-warnings=0`.

- [ ] Remover 43 imports/variáveis sem uso ou usar os valores quando representarem erro atualmente ignorado.
- [ ] Substituir 343 `any` por tipos gerados, interfaces focais, `unknown` estreitado ou genéricos; nunca por disable comments globais.
- [ ] Estabilizar 19 callbacks/efeitos com `useCallback`, dependências completas ou remoção de efeitos derivados desnecessários.
- [ ] Trocar a imagem remota de profissional por `next/image` com política segura, ou por elemento com exceção focal documentada somente se o domínio dinâmico impedir otimização.
- [ ] Executar ESLint com `--max-warnings=0` e TypeScript sem incremental; corrigir até ambos retornarem código 0.

### Task 5: Testes unitários, de API, acessibilidade e responsividade

**Files:**
- Create: `tests/api-contract-validator.js`
- Create: `tests/observability-validator.js`
- Create: `tests/e2e/specs/public-accessibility-responsive.spec.ts`
- Modify: `package.json`
- Modify: `playwright.config.ts` somente se necessário para projeto público sem autenticação.

**Interfaces:**
- Consumes: envelopes da Task 1 e páginas `/`, `/login`, `/agendar`.
- Produces: testes de redaction, validação de payload, contrato de erro, headings/labels, navegação por teclado e ausência de overflow em 390×844 e desktop.

- [ ] Escrever testes Node para redaction de segredo, normalização de erro e rejeição de JSON inválido/grande.
- [ ] Escrever teste estrutural garantindo envelopes consistentes e guarda administrativa antes de parâmetros/banco.
- [ ] Escrever Playwright público que valida `h1`, labels, foco visível, CTA navegável e `scrollWidth <= clientWidth` em mobile/desktop.
- [ ] Adicionar scripts `test:api-contract`, `test:observability` e `test:ui-quality`.
- [ ] Executar os testes focais e registrar limites de E2E que dependam de dados remotos durante a janela de estabilidade.

### Task 6: Documentação operacional canônica

**Files:**
- Create: `docs/README.md`
- Create: `docs/operations/OBSERVABILITY.md`
- Modify: `README.md`
- Modify: `PROJECT.md`
- Modify: `QUICK_START.md`
- Modify: `INDICE_DOCUMENTACAO.md`
- Modify: documentos antigos na raiz que ainda se apresentam como vigentes.
- Test: `tests/architecture-validator.js`, `tests/code-quality-validator.js`

**Interfaces:**
- Produces: índice único com documentos `current`, `historical` e `generated`; runbook de eventos, campos proibidos, alertas e resposta a incidentes.

- [ ] Fazer o validador falhar para múltiplos quick starts vigentes, referências a stack/schema antigo ou instruções SQL históricas sem rótulo.
- [ ] Designar README, PROJECT, QUICK_START, SECURITY_OPERATIONS e docs operacionais como fontes canônicas.
- [ ] Rotular handovers, conclusões de fase e correções antigas como históricos sem reescrever sua cronologia.
- [ ] Criar runbook de observabilidade com alertas de 401/403, conflitos 409, falhas de webhook e request ID, sem payload/PII.
- [ ] Atualizar o índice e comprovar que arquitetura/qualidade passam.

### Task 7: Artefatos locais e encerramento da Auditoria Viva

**Files:**
- Delete: relatórios gerados `*_out.txt`, `*_output.txt`, `playwright_out*.txt`, `tsc*.txt`, `scan_output.txt`, `build_out.txt`, `build_output.txt`, `eslint_out*.txt`, `lint_output.txt`.
- Delete: `playwright-report/` e `test-results/` gerados.
- Modify: `plans/ARTIFACT_POLICY.md`
- Modify: `plans/AUDITORIA_VIVA.md`

**Interfaces:**
- Consumes: evidência de todas as Tasks e confirmação do responsável sobre SEC-06 externo.
- Produces: workspace sem relatórios locais residuais e resumo executivo com os sete itens corrigidos; SEC-06 distingue rotação externa da configuração local ainda legada durante a janela de estabilidade.

- [ ] Verificar por caminho absoluto que cada alvo é relatório gerado dentro do workspace antes da exclusão.
- [ ] Remover somente os alvos enumerados; preservar código, migrações, documentos, `.agents` e alterações do usuário.
- [ ] Rodar scanner, segurança, banco, performance, arquitetura, qualidade, TypeScript e ESLint zero-warning.
- [ ] Atualizar cada bullet da Auditoria Viva com arquivos e evidência, reduzindo Code Quality e Melhorias a zero somente após os testes.
- [ ] Registrar que não houve deploy, migração, commit ou push e que a estabilidade externa será observada por 24–48 horas.

## Self-review

- Cobertura: os quatro itens de Code Quality estão nas Tasks 2, 4, 6/7 e 1/3; as três Melhorias estão nas Tasks 6, 5 e 3.
- Sem placeholders: cada tarefa define arquivos, interfaces, falha esperada, implementação e comando de aceitação.
- Consistência: rotas dependem dos contratos da Task 1; testes e documentação dependem dos eventos e envelopes das Tasks 1–3.
- Execução: inline nesta sessão, sem commits, com checkpoint após cada task.
