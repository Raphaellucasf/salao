# Auditoria Viva — Otimiza Beauty

Última atualização: 2026-07-18  
Escopo autorizado: somente `F:\wORK\PROMPTS\Sistema dimas\otimiza-beauty`  
Estado: implementação local consolidada e Supabase de teste endurecido. O responsável confirmou em 2026-07-18 a conclusão externa da rotação/configuração de chaves nos ambientes de teste e produção; inicia-se observação de estabilidade por 24–48h. O runtime remoto não foi inspecionado por esta rodada e os arquivos de ambiente locais continuam fora da homologação. Por decisão do responsável, as rodadas atuais não utilizam Gemini/Antigravity.

## Resumo executivo

| Categoria | Nível | Qtd Problemas pendentes | Original | Corrigidos |
|-----------|-------|------------------------:|---------:|----------:|
| Segurança Crítica | Urgente | 0 | 7 | 7 |
| Bugs Críticos | Alta | 0 | 5 | 5 |
| Performance | Alta | 0 | 3 | 3 |
| Arquitetura | Alta | 0 | 6 | 6 |
| Code Quality | Média | 2 | 7 | 5 |
| Melhorias | Baixa | 0 | 5 | 5 |

SEC-01 a SEC-07 estão contabilizadas como corrigidas. Para SEC-06, o responsável atestou que concluiu diretamente no Dashboard/secret manager a substituição externa restante; as chaves recebidas por chat não foram gravadas pelo Codex. O sistema entra em observação por 24–48h, e os arquivos `.env*.local` deste workspace continuam deliberadamente não homologados — `verify:key-rotation` local não constitui evidência do runtime remoto. Os cinco bugs críticos, os três itens de Performance e os seis itens de Arquitetura estão encerrados no teste. Produção não foi inspecionada ou modificada pelo Codex nesta rodada.

## Arquitetura e tecnologias

- Aplicação web Next.js 16 com App Router, React 19 e TypeScript.
- Supabase para autenticação e persistência; existem clientes anônimo, SSR e `service_role`.
- Proxy do Next.js para proteção de páginas e APIs, complementado por autorização dentro dos handlers.
- Playwright configurado para E2E; existem testes e relatórios não versionados no workspace.
- Integrações observadas: n8n/webhook, WhatsApp e geração de documentos/planilhas.
- Associação administrativa explícita em `user_units`; isolamento multiorganização completo implementado e testado no Supabase de teste.

## Segurança crítica

### SEC-01 — Autorização administrativa aceitava metadata do usuário

Status: 🟢 Corrigido em código; homologação integrada pendente.

Antes, a ausência/erro da linha canônica de perfil permitia usar `user_metadata.role` e criar automaticamente um registro administrativo. Agora a consulta falha fechada: erro ou perfil ausente retorna 403, sem elevação nem escrita automática.

Arquivo alterado: `src/lib/api-auth.ts`.

Evidência: teste estrutural local confirma ausência do fallback e resposta fail-closed; build aprovado. Ainda falta exercitar tokens reais com perfil ausente, perfil comum e admin.

### SEC-02 — Handlers privilegiados sem revalidação de admin

Status: 🟢 Corrigido em código; homologação integrada pendente.

Foi adicionada validação administrativa antes de parâmetros, corpo ou banco nos handlers identificados de caixa, abertura, contas fixas, fundo de caixa, fechamento de comanda, estatísticas e transações.

Arquivos alterados:

- `src/app/api/admin/abertura-caixa/route.ts`
- `src/app/api/admin/caixa/route.ts`
- `src/app/api/admin/contas-fixas/route.ts`
- `src/app/api/admin/fundo-caixa/route.ts`
- `src/app/api/admin/fechar-comanda/route.ts`
- `src/app/api/admin/financeiro-stats/route.ts`
- `src/app/api/admin/transacoes/route.ts`

Evidência: teste estrutural cobre 19 métodos administrativos/sensíveis e confirma que a guarda antecede acesso privilegiado. Falta teste HTTP com usuário anônimo, usuário comum e admin.

### SEC-03 — Prefixo de agendamentos expunha operações sensíveis

Status: 🟢 Corrigido em código; homologação integrada pendente.

Somente a criação pública (`POST /api/appointments`) e a consulta exata de disponibilidade (`GET /api/appointments/availability`) continuam públicas. Listagem e fechamento agora exigem admin no proxy e no handler.

Arquivos alterados:

- `src/proxy.ts`
- `src/app/api/appointments/route.ts`
- `src/app/api/appointments/close/route.ts`

Evidência: verificação estrutural e build aprovados. Falta confirmar que o fluxo público de agendamento continua completo e que listagem/fechamento retornam 401/403 sem admin.

### SEC-04 — Endpoint de diagnóstico expunha metadados internos

Status: 🟢 Corrigido em código; homologação integrada pendente.

O endpoint agora exige admin antes de qualquer consulta. A remoção definitiva será avaliada separadamente, após confirmar que não é usado em suporte/operação.

Arquivo alterado: `src/app/api/debug/check-user/route.ts`.

Evidência: lint focal, teste estrutural e build aprovados. Falta teste HTTP de acesso negado.

### SEC-05 — Isolamento entre unidades/organizações não é confiável

Status: 🟢 Corrigido no Supabase de teste; produção e homologação integrada permanecem pendentes.

A linha de base do teste tinha 43 tabelas no schema `public`, 21 sem RLS, grants destrutivos para `anon`, 7 views security-definer, funções privilegiadas públicas e dados clínicos/chat expostos. As migrações da Rodada 10 foram aplicadas somente ao projeto `blzargagmyjdihdkmcwg` e verificadas pelo catálogo e pelos advisors:

- as 43 tabelas públicas agora têm RLS; das 21 tabelas antes desprotegidas, 6 clínicas/chat sensíveis operam deny-by-default via `service_role`, e as 15 restantes receberam policy administrativa baseada no papel canônico de `public.users`;
- sete views usam `security_invoker=true`, sem acesso `anon`, com `SELECT` autenticado sujeito ao RLS e leitura de serviço explícita;
- 26 funções de aplicação têm `search_path=pg_catalog,public` e não são executáveis por `anon`/`authenticated`; o helper administrativo usado por 25 policies foi movido para `private` e saiu da API pública;
- `webhook_log` perdeu a policy de INSERT irrestrito, e `pg_trgm`/`postgres_fdw` foram movidas para `extensions`;
- advisors de segurança caíram de 84 para três: dois INFO `rls_enabled_no_policy`, ambos em tabelas globais deliberadamente service-only/deny-by-default, e um WARN de proteção contra senhas vazadas, que depende de configuração do Auth. Não restou achado de RLS desabilitada, view definer ou função pública.

O fluxo público de disponibilidade deixou de chamar `fn_horarios_vagos` como `anon`: a página usa uma API server-side que valida UUID/data, relê a duração canônica e consulta `vw_blocos_ocupados` com `service_role`. As rotas WhatsApp agora falham fechado quando `N8N_API_KEY` não existe, com comparação timing-safe e erros opacos.

Na Rodada 13, as 50 tabelas de negócio passaram a ter `unit_id NOT NULL`, FK para `units`, índice iniciado por unidade e policy restritiva `tenant_unit_boundary`. Cinquenta gatilhos impedem trocar a unidade de uma linha e outros cinquenta verificam que referências entre tabelas pertencem ao mesmo tenant, inclusive quando uma RPC usa `service_role`. O resolvedor privado de unidade usa a associação Auth; chamadas internas precisam do header `x-unit-id` e o fallback de serviço falha fechado quando houver mais de uma unidade padrão ativa.

O catálogo confirmou 56 tabelas públicas, 50 de negócio integralmente cobertas e seis globais (`units`, `users`, `usuarios`, `roles`, `user_units`, `usuarios_sessoes`). Testes transacionais com rollback e claims de administrador confirmaram leitura/inserção na própria unidade e rejeição/ocultação cruzada. Relações clínicas incompatíveis foram reparadas: `cliente_id` agora acompanha o bigint de `clientes`, as FKs ausentes foram instaladas e quatro etapas órfãs de serviços inexistentes foram removidas antes da constraint. Produção não foi tocada; a promoção exige comparação e homologação separadas, mas essa cautela operacional não mantém o defeito de implementação do teste aberto.

### SEC-06 — Credenciais e informações operacionais em documentação/artefatos

Status: 🟢 Corrigido externamente por atestação do responsável; estabilidade em observação por 24–48h.

Um JWT `service_role` literal foi removido dos scripts, credenciais E2E saíram dos documentos e o scanner cobre os valores conhecidos. A configuração prioriza `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`; scripts e guias ativos não ensinam nomes legados. Em 2026-07-18, o responsável confirmou a conclusão das ações externas restantes nos dois ambientes. Como valores modernos foram transmitidos por chat, o Codex não os instalou nem os repetiu; a validade operacional depende das substituições feitas diretamente pelo responsável. Os arquivos locais ignorados ainda contêm configuração antiga e não devem ser usados para homologar a rotação remota. O acompanhamento de estabilidade termina após 24–48h sem regressões de autenticação ou backend.

### SEC-07 — Rotas legadas de vendas e transações exigem apenas sessão autenticada

Status: 🟢 Corrigido em código; homologação HTTP integrada pendente.

O proxy exige autenticação genérica para `/api/*`, mas só documenta revalidação de role dentro dos handlers (`src/proxy.ts:84-97`). As rotas paralelas `POST /api/sales` e `POST /api/transactions` não chamam `requireAdmin`; elas permitem, respectivamente, criar receita/baixar estoque e inserir uma transação com tipo, valor e descrição recebidos do cliente (`src/app/api/sales/route.ts:43-205` e `src/app/api/transactions/route.ts:5-42`). `GET /api/transactions` também lista lançamentos sem revalidar admin (`src/app/api/transactions/route.ts:48-80`). Assim, qualquer sessão autenticada que alcance essas rotas passa pela camada de aplicação; o resultado final ainda pode variar conforme a RLS implantada, que não foi consultada.

Este achado amplia SEC-02: proteger apenas o namespace `/api/admin/*` não elimina endpoints legados equivalentes fora dele. O inventário local não encontrou consumidores diretos dessas duas APIs, mas dependências externas ainda não podem ser descartadas; por isso os contratos foram preservados e a defesa foi aplicada nos próprios handlers.

Mitigação implementada:

- `GET` e `POST` de `/api/sales` e `/api/transactions` agora chamam `requireAdmin` antes de ler parâmetros, payload ou banco.
- As rotas deixaram de usar o cliente Supabase de browser no servidor e passam a criar o cliente servidor somente após a autorização administrativa.
- `/api/sales` ignora `item.price`, recalcula pelo `preco_venda` do produto ativo no banco e valida `products` como array e quantidade inteira positiva.
- `/api/transactions` normaliza o valor para número finito positivo e rejeita descrição vazia.
- O teste estrutural passou de 19 para 23 métodos protegidos e ganhou asserções contra reintrodução de preço fornecido pelo cliente.

Arquivos alterados: `src/app/api/sales/route.ts`, `src/app/api/transactions/route.ts` e `tests/security-guard-validator.js`.

Limites: a baixa de estoque e o lançamento financeiro continuam não atômicos; `unit_id` ainda não produz isolamento confiável; não há coluna canônica versionada em `transacoes` para gravar o administrador autor. Esses pontos permanecem em BUG-03/SEC-05 e exigem desenho de banco autorizado. Falta testar respostas 401/403/2xx com sessões reais.

## Bugs críticos

- 🟢 Reserva concorrente protegida no Supabase de teste por exclusion constraints de profissional e auxiliar; produção não verificada.
- 🟢 Fechamento de agendamento/comanda e lançamentos financeiros são atômicos e idempotentes no Supabase de teste.
- 🟢 Vendas, comandas e baixa/estorno de estoque usam RPCs atômicas e idempotência no Supabase de teste.
- 🟢 Preços/valores críticos dos fluxos ativos são relidos do catálogo no servidor ou na RPC; desconto legado negativo é normalizado de forma idêntica na UI e na API.
- 🟠 A suíte E2E enumera 246 execuções (82 cenários × 3 browsers), mas a execução autenticada permanece bloqueada até existirem contas descartáveis fornecidas somente por variáveis de ambiente.

### BUG-01 — Reserva de horário não é serializada

Status: 🟢 Corrigido e verificado no Supabase de teste; produção não verificada.

A pré-checagem agregada encontrou zero sobreposições ativas. A migração `20260717_critical_rls_and_appointment_overlap.sql` instalou `btree_gist` no schema `extensions` e adicionou exclusion constraints GiST semiabertas `[)` para profissional e auxiliar nos estados `agendado`, `confirmado` e `em_andamento`. O catálogo confirmou as duas constraints e `POST /api/appointments` traduz SQLSTATE `23P01` para HTTP 409 genérico. Assim, duas inserções concorrentes para o mesmo recurso não podem mais persistir intervalos sobrepostos no teste.

Risco residual: produção não foi inspecionada; estados futuros precisam ser adicionados explicitamente ao predicado das constraints; o fluxo ainda precisa de teste concorrente HTTP para validar a UX completa.

### BUG-02 — Fechamentos podem ficar parciais ou duplicados

Status: 🟢 Corrigido e verificado estruturalmente no Supabase de teste; produção não verificada.

A migração `20260717_atomic_financial_closures.sql` adicionou referências canônicas e índices únicos parciais em `transacoes`, unicidade de comissão por comanda/profissional e de crédito de pacote por comanda/serviço. As funções `close_appointment_atomic` e `close_comanda_atomic` usam bloqueio `FOR UPDATE`, recalculam valores a partir das linhas persistidas e executam receita, status, comissão, créditos de pacote e conclusão do agendamento na mesma transação PostgreSQL.

As duas funções são `SECURITY INVOKER`, têm `search_path` fixo, não podem ser executadas por `anon`/`authenticated` e foram concedidas somente a `service_role`. O fechamento de agendamento agora valida UUID corretamente e rejeita agendamento vinculado a comanda para impedir receita dupla. O drawer deixou de fechar a comanda ou gravar comissões/pacotes diretamente: envia identidade, método e desconto para a API administrativa, e a comissão exibida não é mais editável nem confiada pelo servidor.

Evidência: catálogo confirmou os cinco índices idempotentes e os privilégios das duas RPCs; o validador estrutural passou com 33 handlers/regras. Ainda faltam testes integrados de sucesso, repetição simultânea e rollback com dados descartáveis.

### BUG-03 — Venda e estoque usam operações compostas não atômicas

Status: 🟢 Corrigido e verificado no Supabase de teste; produção não verificada.

- Venda rápida cria comanda fechada, itens, transação e estoque em chamadas separadas (`src/components/modals/VendaRapidaModal.tsx:141-213`). Erro de itens deixa uma comanda fechada vazia; ausência de caixa aberto ou erro de transação pode deixar venda sem receita; erro de estoque é apenas registrado e o fluxo ainda informa sucesso.
- A API de vendas valida estoque, cria a transação e só depois relê/decrementa produtos (`src/app/api/sales/route.ts:82-205`). Requisições concorrentes podem passar pela mesma validação e sobrescrever quantidades com base em leituras antigas. Falhas no estoque acontecem depois do lançamento financeiro.
- A edição/criação de comanda atualiza cabeçalho, estorna estoque, apaga/reinsere itens, etapas, estoque, sessões de pacote e agendamento em sequência (`src/components/modals/ComandaModal.tsx:494-711`). Qualquer falha intermediária persiste apenas parte do novo estado. Atualizações de quantidade seguem o padrão leitura-modificação-escrita, sujeito a perda de atualização (`src/components/modals/ComandaModal.tsx:399-408` e `442-465`).

Implementação concluída no teste: venda rápida, venda de produtos, salvamento/cancelamento de comanda, ajuste e reversão de estoque, venda/consumo de pacotes, movimentação do fundo de caixa e pagamento de conta fixa passaram a RPCs `SECURITY INVOKER` com `search_path` fixo e execução exclusiva por `service_role`. As funções bloqueiam as linhas relevantes com `FOR UPDATE`, recalculam catálogo/valores no banco e usam chaves de idempotência ou constraints únicas onde o fluxo admite repetição. Os componentes deixaram de orquestrar gravações críticas em sequência no browser. Testes transacionais com rollback confirmaram sucesso, rejeição e preservação de estado em falha; ainda falta homologação HTTP concorrente e confirmação em produção.

### BUG-04 — Valores financeiros ainda podem divergir da fonte canônica

Status: 🟢 Corrigido nos fluxos ativos e protegido por validação estrutural; produção não verificada.

`/api/sales` deixou de consumir `item.price` e usa exclusivamente o `preco_venda` do produto ativo. `/api/admin/fechar-comanda` deixou de aceitar `valor`, `descricao` e `data` do cliente; o drawer envia apenas identidade, método e desconto, e a RPC relê os itens/catálogos e recalcula o total. Venda rápida, salvamento de comanda, produtos, pacotes e serviços também descartam preços derivados no browser e usam fonte canônica dentro da transação. A busca completa de dependências confirmou como órfãos sete modais paralelos — transação, saldo, cheque, conta a receber, orçamento, pacote e prontuário — além de um handler de agendamento inativo; os oito arquivos foram removidos para impedir reintrodução acidental dos fluxos diretos.

### Achado adicional de concorrência

Status: 🟢 Corrigido no Supabase de teste e no bootstrap versionado. `gerar_numero_comanda()` e o trigger `set_numero_comanda()` consomem `comandas_numero_seq`; o catálogo confirmou `search_path` fixo e execução restrita a `service_role`. `database/comandas_schema.sql` também foi consolidado para usar `nextval`, sincronizar a sequência e nunca criar policy anônima irrestrita.

## Performance

- 🟢 Estatísticas financeiras de mês/hoje são agregadas por uma única função SQL, limitada à unidade autorizada e ao intervalo solicitado. O índice `(unit_id, tipo, data) INCLUDE (valor)` e os grants service-only foram confirmados no catálogo do teste; nenhuma linha de transação é carregada na aplicação.
- 🟢 As FKs públicas apontadas sem cobertura receberam índices; as duplicidades exatas foram removidas, inclusive as cinco detectadas após o reparo das relações clínicas. O catálogo conserva um índice equivalente por relação.
- 🟢 As 36 policies que avaliavam `auth.uid()`/`auth.role()` por linha agora usam initplan escalar; as 117 sobreposições permissivas foram consolidadas por papel e operação. O advisor final contém 190 INFO `unused_index`, incluindo os novos índices obrigatórios por unidade, e zero duplicidade; nenhum índice foi removido apenas por falta de uso sem métricas representativas.
- 🟠 O GET de caixa agora executa comandas, fechamento e transações em paralelo, seguido por comissões/usuário em uma segunda fase dependente e fail-closed. Pesquisa de serviços também foi paralelizada; relatórios de clientes/profissionais usam mapas. Ainda há viagens inevitáveis sem RPC/view.
- 🟢 `get_financial_stats` usa cache server-side privado de 30 segundos, particionado por unidade e intervalo. As nove rotas que alteram vendas, comandas, pacotes, contas, estoque ou transações invalidam a tag financeira após sucesso; o validador `test:performance-cache` impede omissões conhecidas. A resposta HTTP autenticada permanece `private, no-store`.

## Arquitetura

- 🟢 `DEFAULT_UNIT_ID` foi removido do código de aplicação. A unidade administrativa é resolvida por `user_units`, ausência/ambiguidade falha fechado e as entidades de negócio são filtradas por unidade na aplicação e no RLS.
- 🟢 As 38 migrações desta auditoria estão em `supabase/migrations/`, com versões iguais ao histórico remoto. `database/migrations` deixou de ser uma cadeia concorrente e `database/` está marcado como histórico/não executável.
- 🟢 Browser, sessão SSR por request e backend privilegiado têm fábricas canônicas. Handlers não instanciam clientes diretamente; o cliente secreto desabilita persistência, refresh e detecção de URL, e recebe contexto de unidade após autorização.
- 🟢 Operações compostas críticas e exclusão de catálogo de serviços usam RPCs transacionais, com locks, grants service-only e rollback integral.
- 🟢 Repositório `Open-ClaudeCode`, artefatos E2E e estado de agentes foram excluídos do TypeScript/ESLint do aplicativo; não há importações do app para essas pastas.
- 🟢 README, PROJECT, quick start, autenticação e planos ativos usam Next.js 16.2.10/React 19.2.7, o estado de 56 tabelas com RLS e a cadeia SQL canônica. O validador impede reintroduzir versões, contagens e caminhos legados.

## Qualidade de código

- 🟢 `src/types/supabase.ts` foi regenerado a partir do Supabase de teste e os consumidores incompatíveis foram corrigidos; `tsc --noEmit` passa com zero erro.
- 🟢 Todos os 30 `@ts-nocheck` de `src` e `ignoreBuildErrors` foram removidos. O build completo executou a checagem TypeScript e gerou 68 páginas/rotas.
- 🟠 O lint completo passa com zero erro; os avisos foram reduzidos de 427 para 306, concentrados em `any` e dependências de hooks na interface legada. O backend crítico (`src/app/api`, `src/lib`, `src/services` e validadores) passa sem avisos.
- 🟢 Autorização usa uma única guarda canônica; vendas e transações delegam validação, persistência, invalidação e erros a serviços compartilhados.
- 🟢 A busca completa de imports validou e removeu oito implementações órfãs: sete modais financeiros/clínicos/catálogos paralelos e um handler de agendamento que o App Router não expunha.
- 🟠 Relatórios, traces, saídas locais e `.agents` passaram a ser ignorados; os arquivos já existentes não foram excluídos por pertencerem ao workspace do usuário.
- 🟢 APIs críticas usam `apiError`, validadores compartilhados, `ServiceResult` e eventos estruturados com `requestId` e allowlist de campos.

## Melhorias

- 🟢 Next.js foi atualizado para 16.2.10 e React/ReactDOM para 19.2.7; `jsPDF` resolveu em 4.2.1 e `xlsx` usa o pacote oficial 0.20.3. TypeScript, lint e build completo passaram após a atualização.
- 🟢 `docs/README.md` é o índice canônico e liga arquitetura, início rápido, segurança, artefatos, observabilidade e auditoria viva.
- 🟢 Política para artefatos, backups e relatórios criada em `plans/ARTIFACT_POLICY.md` e refletida no `.gitignore`.
- 🟢 Validadores cobrem contratos de serviço/API e observabilidade; Playwright cobre login acessível e ausência de overflow público em 360, 768 e 1440 px (4/4 Chromium).
- 🟢 Autenticação, concorrência e integrações críticas emitem eventos estruturados e redigidos; payload bruto de WhatsApp deixou de ser persistido em `webhook_log`.

## Estrutura, duplicações e resíduos

- Nenhum `AGENTS.md` foi localizado.
- Pastas vazias identificadas: `.kilocode`, `.qodo/agents` e `.qodo/workflows`.
- Duplicatas exatas por hash apareceram apenas em pequenos arquivos de estado/logs vazios; não foi encontrada duplicação exata de código-fonte relevante.
- Existem backups, relatórios E2E, saídas de lint/TypeScript e diretórios de outras ferramentas. Nada foi removido.
- O workspace já estava sujo antes desta rodada. Alterações do usuário em `package.json`, `package-lock.json`, testes e `src/components/modals/ComandaViewDrawer.tsx` foram preservadas.

## Evidências acumuladas — 2026-07-16 a 2026-07-18

| Verificação | Resultado | Observação |
|-------------|-----------|------------|
| Teste estrutural de segurança | PASS | 25 handlers/regras; valores canônicos, caixa, busca e venda rápida; sem banco real |
| Lint focal de arquivos novos/limpos | PASS | Proxy, diagnóstico e validador |
| Lint amplo dos handlers | FAIL preexistente | 51 erros e 1 aviso, principalmente `any`/`@ts-nocheck` |
| Build de produção | PASS | 59 rotas/páginas; configuração ainda pula validação de tipos |
| Whitespace do diff | PASS | Somente avisos de conversão LF/CRLF |
| Teste integrado de autenticação | Não testado | Depende de ambiente/sessões de teste |
| Banco, migração e dados reais | Não executado | Proibido nesta rodada |
| Deploy, commit e push | Não executado | Proibido nesta rodada |
| Revisão inicial Antigravity | GO | Revisão abstrata com Gemini 3.5 Flash (High) |
| Revisão final Antigravity — rodada 1 | Não executada | Política do ambiente bloqueou envio do resumo privado; não é cota/autenticação |
| Análise estática de concorrência/atomicidade | CONFIRMADO | Evidências em agendamentos, comandas, vendas, estoque e financeiro; sem escrita em banco |
| Revisão Antigravity da rodada 2 | Sem parecer utilizável | `consult_antigravity` foi invocado em modo `plan`/somente leitura com Gemini 3.5 Flash (High), mas retornou conteúdo textual vazio em três tentativas |
| Revisão Antigravity da implementação SEC-07 | CONCLUÍDA | Gemini 3.5 Flash (High), modo `plan`; confirmou autorização/preço canônico e apontou atomicidade, rastreabilidade e testes HTTP pendentes |
| Build após SEC-07 | PASS | 58 rotas/páginas; primeira tentativa falhou somente por bloqueio de Google Fonts, repetição com rede autorizada passou |
| Lint focal após SEC-07 | FAIL preexistente | Apenas 2 erros `ban-ts-comment` nos `@ts-nocheck` já existentes; zero avisos |
| Teste estrutural do fechamento canônico | PASS | Drawer não envia valor/descrição/data; endpoint relê itens, calcula em centavos e verifica duplicidade |
| Revisão Antigravity do fechamento | CONCLUÍDA | Gemini 3.5 Flash (High), modo `plan`; confirmou risco residual de corrida/índice único e acoplamento temporário pela descrição |
| Build após fechamento canônico | PASS | 58 rotas/páginas; repetição com rede autorizada necessária apenas para Google Fonts |
| Lint focal do fechamento canônico | PASS | Endpoint e validador sem erros ou avisos; tipagem local substituiu o `any` legado nesse handler |
| Scanner de segredos versionados | PASS | 256 arquivos; JWT literal removido de dois scripts; rotação externa pendente |
| Fechamento de agendamento | PASS estrutural | Claim condicional, dinheiro em centavos e compensações verificadas; sem concorrência real |
| Venda rápida canônica | PASS estrutural | Endpoint admin, preço do banco, request UUID, estoque condicional, logs e compensações |
| TypeScript do app isolado | FAIL reduzido | 89 → 74 erros após excluir repositório/artefatos e corrigir dois erros; tipos Supabase reais ausentes |
| Dependências após atualização | PASS com risco residual | `npm audit`: 13 achados, incluindo crítico/alto, → 2 moderados no PostCSS empacotado pelo Next; a correção automática proposta rebaixaria Next para 9.3.3 e foi rejeitada |
| Revisão final Antigravity — rodada 5 | CONCLUÍDA | Gemini 3.5 Flash (High), modo `plan`; confirmou seis riscos residuais prioritários |
| Lint completo após isolamento | FAIL preexistente | 633 problemas: 530 erros e 103 avisos; passivo concentrado em `any`, `@ts-nocheck`, hooks e validadores legados |
| Revisão Antigravity da rodada 6 | CONCLUÍDA | Gemini 3.5 Flash (High), modo `plan`; após uma tentativa bloqueada por permissão interna, a revisão textual confirmou riscos de fuso, duplicidade, falhas silenciosas, pool e escala |
| Otimização de estatísticas financeiras | PASS estrutural | Uma consulta de transações entre início do mês e hoje, limite superior explícito e agregação monetária em centavos |
| Paralelização do GET de caixa | PASS estrutural | Duas fases de `Promise.all`, validação estrita de data e propagação de erro em todas as fontes |
| Validadores após rodada 6 | PASS | Segurança: 25 handlers/regras; segredos: 256 arquivos versionados |
| Lint focal da rodada 6 | FAIL preexistente | 13 usos de `any` ligados ao cliente Supabase sem schema completo; nenhuma nova classe de erro |
| TypeScript após rodada 6 | FAIL preexistente | 74 erros fora dos handlers alterados, concentrados em tabelas ausentes/desatualizadas em `src/types/supabase.ts` |
| Build após rodada 6 | PASS | 59 rotas/páginas; configuração ainda pula validação de tipos |
| Conector Supabase — teste | CONCLUÍDO | Projeto saudável; inspeção somente leitura de schema, constraints, tipos, migrações, extensões e advisors; nenhuma linha de negócio consultada |
| Advisor de segurança — teste | CRÍTICO | 84 achados: 21 tabelas públicas sem RLS, 7 views definer, 33 funções com search path mutável, 8 funções definer executáveis por anon e 2 exposições sensíveis |
| Grants efetivos — teste | CRÍTICO | As 21 tabelas sem RLS concedem a `anon` leitura, escrita, exclusão e `TRUNCATE` |
| Advisor de performance — teste | ALTO | 292 achados: 14 FKs sem índice, 36 initplans RLS, 119 índices não usados, 117 políticas sobrepostas e 6 índices duplicados |
| Integridade concorrente — teste | CONFIRMADO | Sem exclusion constraint de agenda e sem unicidade idempotente em transações/comissões; fechamento de caixa possui unicidade por unidade/data |
| Revisão Antigravity da rodada 7 | CONCLUÍDA | Gemini 3.5 Flash (High), modo `plan`; priorizou RLS/grants, tokens, funções/views definer, políticas financeiras e privilégios padrão |
| Conector Supabase — produção | Sem permissão via conector | O projeto não pertence à conta/organização conectada; nenhuma chave exposta foi usada como contorno |
| APIs clínicas administrativas | PASS estrutural | 8 métodos para anamneses/prontuários com `requireAdmin`, validação/allowlist e sem escrita clínica direta no browser |
| Validador de endurecimento do banco | PASS | Confirma RLS/revogações no rascunho e ausência de acesso browser às tabelas clínicas; não aplica SQL |
| Lint focal da rodada 8 | PASS | Duas APIs e dois validadores sem erros ou avisos |
| Build após rodada 8 | PASS | 61 rotas/páginas; configuração ainda pula validação global de tipos |
| Revisão Antigravity da rodada 8 | NO-GO para promoção | Gemini 3.5 Flash (High), modo `plan`; código preparatório é insuficiente enquanto RLS/grants não forem aplicados e homologados no teste |
| Pré-checagem de sobreposição — teste | PASS | Contagem agregada encontrou zero conflitos ativos de profissional ou auxiliar; nenhum dado pessoal foi lido |
| Rascunho de exclusão de agenda | PASS estrutural | Duas constraints GiST `[)` por profissional/auxiliar e tradução `23P01` → 409; SQL não aplicado |
| Revisão Antigravity de BUG-01 | GO com ressalvas | Gemini 3.5 Flash (High), modo `plan`; aprovou garantia no banco e destacou custo GiST, estados futuros, locks e UX genérica |
| Revisão documental iterativa — rodada 9 | APROVADO | Gemini revisou os documentos em partes; propostas factualmente incorretas foram devolvidas duas vezes, corrigidas e o diff final foi aprovado |
| Validação documental — rodada 9 | PASS | 7 documentos legíveis; scanner de 256 arquivos e validador de endurecimento aprovados |

| Migrações críticas — teste | PASS | 38 migrações desta auditoria aplicadas; catálogo remoto registra 40 versões no total, incluindo duas `remote_schema` anteriores |
| RLS público — teste | PASS | 56/56 tabelas públicas com RLS; `rls_disabled_in_public` permanece em zero |
| Views privilegiadas — teste | PASS | 7/7 com `security_invoker=true`; `anon` sem SELECT; authenticated somente leitura |
| Funções de aplicação — teste | PASS | 26/26 com search path fixo; zero EXECUTE para anon/authenticated; service_role preservado |
| Advisor de segurança — teste | SEM CRÍTICOS | 3 achados atuais: 2 INFO deny-by-default intencionais e 1 configuração de Auth; zero tabela sem RLS |
| Disponibilidade pública/WhatsApp | PASS estrutural | RPC anônima removida; API server-side; N8N fail-closed e timing-safe |
| Validadores após rodada 10 | PASS | Segurança 33 handlers, segredos 256 arquivos e migrações estruturais aprovadas |
| Build após rodada 10 | PASS | 61 páginas/rotas; repetição com rede autorizada apenas para Google Fonts |
| Atomicidade crítica — teste | PASS transacional | RPCs de agenda, comandas, vendas, estoque, pacotes, contas fixas e fundo de caixa verificadas com dados descartáveis e `ROLLBACK` |
| Tipos Supabase / TypeScript | PASS | Tipos regenerados do schema de teste; `tsc --noEmit` concluiu com zero erro |
| Lixeira administrativa | PASS | 3 handlers admin; restauração atômica com allowlist, colisão fail-safe, ledger e zero grants para browser |
| Catálogo de pacotes | PASS transacional | Pacote + itens salvos por RPC; preço/duração canônicos, idempotência e rollback verificados; escrita browser revogada |
| Catálogo de serviços | PASS transacional | Serviço + etapas salvos por RPC; duração derivada, idempotência e rollback verificados |
| Índices de FKs/duplicados | PASS | 27 índices de cobertura criados; seis duplicados removidos; catálogo confirma zero FK pública sem índice |
| Validadores após rodada 11 | PASS | Segurança: 53 handlers; endurecimento do banco, segredos e TypeScript aprovados |
| Associação usuário–unidade | PASS | 0 admin sem unidade padrão; unicidade da associação padrão e RLS confirmadas no catálogo do teste |
| Provisionamento de usuário | PASS transacional | `users`, `usuarios` e `user_units` na mesma RPC; teste com identidade Auth real e `ROLLBACK` confirmou atomicidade |
| Estatísticas financeiras unit-scoped | PASS | RPC e índice presentes; `anon`/`authenticated` sem EXECUTE e `service_role` preservado |
| Advisor de performance pós-RLS — rodada 12 | PASS focal | 36 initplans → 0; 117 policies sobrepostas → 0; naquele momento restavam 145 índices sem uso |
| TypeScript sem exceções | PASS | 0 `@ts-nocheck`, 0 `ignoreBuildErrors`, `tsc --noEmit` e build de 68 páginas/rotas aprovados |
| Lint completo pós-tipagem | PASS com avisos | 0 erros e 427 avisos; baseline anterior era 530 erros e 103 avisos |
| RLS por unidade — tabelas existentes | PASS negativo | Identidade admin do teste enxergou zero linha de outra associação em `transacoes`, `pacotes_cliente` e `fechamentos_caixa`; helper privado com search path fixo |
| Exclusão de catálogo | PASS estrutural | Serviço + etapas excluídos por RPC atômica; telas de serviços/produtos deixaram de excluir esses catálogos diretamente no browser |
| Credenciais E2E | PASS estrutural | Literais removidos do helper e de oito documentos; quatro variáveis obrigatórias; scanner aprovado em 256 arquivos |
| Suíte E2E | LISTAGEM PASS | 246 execuções em 9 arquivos; execução mutável não iniciada sem contas descartáveis explícitas |
| Build pós-dependências | PASS | Next.js 16.2.10 executou TypeScript e gerou 68 páginas/rotas |

## Histórico de mudanças

### 2026-07-16 — Rodada 1 de segurança

- Autorização administrativa alterada para fail-closed.
- Guardas administrativas adicionadas aos handlers privilegiados identificados.
- Superfície pública de agendamentos reduzida a criação e disponibilidade.
- Endpoint de diagnóstico protegido por admin.
- Adicionado `tests/security-guard-validator.js` e script `test:security`.
- Nenhum INSERT/UPDATE de produção, schema, migração, deploy, commit ou push realizado.

### 2026-07-16 — Rodada 2 de concorrência e atomicidade

- Confirmadas por análise estática as janelas de corrida na reserva de horários e nos fechamentos.
- Mapeados estados parciais possíveis em fechamento de agendamento, fechamento de comanda, venda rápida, API de vendas, estoque, comissões e pacotes.
- Confirmado que o endpoint de fechamento financeiro não relê a comanda, não grava `comanda_id` e confia em valor/descrição/data do cliente.
- Confirmado o uso de preço opcional enviado pelo cliente na API de vendas.
- Identificadas rotas legadas paralelas de vendas/transações que exigem apenas sessão autenticada e não revalidam papel administrativo.
- Identificado gerador de número de comanda com `MAX + 1`, apesar da existência de sequência no SQL versionado.
- Apenas este documento de auditoria foi atualizado nesta rodada; nenhum código de aplicação, banco, migração, deploy, commit ou push foi executado.

### 2026-07-16 — Rodada 3 de implementação SEC-07

- Guardas administrativas adicionadas a quatro métodos das rotas legadas de vendas e transações.
- Cliente Supabase de browser removido dessas rotas servidoras em favor do cliente servidor após autorização.
- Preço de venda passou a ser obtido exclusivamente do cadastro ativo do produto; `item.price` não é mais consumido.
- Validações de coleção, quantidade, valor e descrição foram fortalecidas.
- Teste estrutural ampliado para 23 métodos e aprovado; build de produção aprovado.
- Revisão curta via `consult_antigravity` executada com Gemini 3.5 Flash (High), em modo `plan`/somente leitura.
- Nenhum banco, migração, deploy, commit ou push foi executado.

### 2026-07-16 — Rodada 4 de valores canônicos no fechamento

- Payload do drawer reduzido a `comanda_id` e método de pagamento.
- Endpoint passou a reler comanda fechada e `comanda_itens`, rejeitando valores/descontos inválidos.
- Subtotal, desconto e total calculados em centavos para evitar divergência de ponto flutuante.
- Descrição e data do lançamento passaram a ser derivadas no servidor.
- Adicionada deduplicação de melhor esforço por descrição estável; unicidade forte continua dependente de `comanda_id`/índice/transação no banco.
- Teste estrutural, lint focal e build de produção aprovados.
- Revisão via `consult_antigravity` executada com Gemini 3.5 Flash (High), modo `plan`/somente leitura.
- Nenhum banco, migração, deploy, commit ou push foi executado.

### 2026-07-16 — Rodada 5 de campanha ampliada

- JWT `service_role` removido dos scripts versionados; promoção em massa desativada e scanner de segredos adicionado.
- Fechamento de agendamento recebeu claim condicional e compensações financeiras.
- Fechamento/reabertura de caixa deixou de aceitar autoria e totais do cliente; valores são recalculados no servidor.
- Venda rápida migrou do browser para endpoint administrativo com catálogo/preço canônico, idempotência de melhor esforço, estoque condicional, log e compensações.
- Busca de serviços deixou de interpolar entrada em filtro PostgREST composto e passou a executar estratégias em paralelo.
- Agendamento público passou a validar/normalizar data, hora, telefone, nome, notas, duração/preço e falha fechada na consulta de conflitos.
- Relatórios de clientes/profissionais passaram de filtros repetidos para agregação por mapas.
- TypeScript/ESLint deixaram de varrer repositório aninhado, traces e estado de agentes; README/PROJECT atualizados para Next.js 16/React 19.
- Criados planos operacionais de tenancy/RLS, resposta a segredos e política de artefatos, sem executar schema ou banco.
- Testes estruturais e scanner passaram; build de 59 rotas passou.
- Nenhum banco real, migração, deploy, commit ou push foi executado.

### 2026-07-17 — Rodada 6 de performance financeira

- `GET /api/admin/financeiro-stats` deixou de consultar hoje e mês separadamente; uma única leitura retorna data/valor no intervalo solicitado.
- Datas inválidas, intervalos invertidos e lançamentos futuros são rejeitados/limitados; totais são acumulados em centavos.
- `GET /api/admin/caixa` passou a ler comandas, fechamento e transações em paralelo e, depois, comissões e usuário em paralelo conforme suas dependências.
- Erros de comissões, fechamento, usuário ou transações deixaram de ser silenciosamente tratados como totais vazios.
- O cálculo do próximo dia passou a usar UTC, evitando variação pela timezone do servidor.
- O validador estrutural passou a exigir consulta financeira única, centavos, limite superior, duas fases paralelas e propagação de erros.
- Gemini 3.5 Flash (High) revisou a abordagem em modo `plan`; testes estruturais, scanner e build passaram.
- Contagem executiva de Performance não foi reduzida: agregação SQL, índice/plano de execução e teste concorrente ainda dependem de acesso controlado ao banco.
- Nenhum banco real, migração, deploy, commit ou push foi executado.

### 2026-07-17 — Rodada 7 de inspeção do Supabase de testes

- O conector oficial Supabase foi usado somente para leitura de metadados; as chaves compartilhadas na conversa não foram usadas nem persistidas.
- Confirmadas 21 de 43 tabelas públicas sem RLS e com grants destrutivos para `anon`.
- Confirmadas exposições de tokens/sessões, funções e views security-definer e políticas amplas para qualquer autenticado.
- Confirmada no schema real a ausência de garantias de sobreposição de agenda e idempotência financeira já apontadas pela análise estática.
- Gerados tipos TypeScript do ambiente de testes para comparação; eles não foram gravados no app antes da inspeção de produção.
- Criado `plans/SUPABASE_TEST_SECURITY_PLAN.md` com ordem de correção e portões de segurança.
- Gemini 3.5 Flash (High) revisou e priorizou a resposta em modo `plan`.
- Nenhuma migração, escrita em banco, deploy, commit ou push foi executado.

### 2026-07-17 — Rodada 8 de isolamento clínico preparatório

- Criadas APIs administrativas CRUD para `anamneses` e `prontuarios`, sempre com `requireAdmin` antes de parâmetros e banco.
- Payloads clínicos passaram por allowlist, limites de tamanho, UUID/data e validação de valores; campos extras são descartados.
- Página/modal de anamneses e gravação de prontuários deixaram de acessar diretamente essas tabelas pelo cliente Supabase do browser.
- Validador estrutural passou de 25 para 33 handlers protegidos e impede reintrodução do acesso clínico direto.
- Criado rascunho SQL deny-by-default para as duas tabelas e teste `test:database-hardening`; o arquivo é explicitamente não aplicado.
- Testes de segurança, endurecimento e segredos passaram; lint focal e build de 61 rotas passaram.
- Gemini 3.5 Flash (High), em modo `plan`, classificou a promoção como NO-GO até a aplicação/homologação coordenada de RLS e grants.
- BUG-01 recebeu rascunho de exclusion constraints por profissional/auxiliar; a API pública agora está pronta para responder 409 à violação concorrente.
- A pré-checagem agregada do teste encontrou zero sobreposições ativas; Gemini aprovou a estratégia GiST com ressalvas.
- SEC-05 e SEC-06 não foram contabilizadas como corrigidas: o banco de testes continua exposto e os rascunhos SQL não foram aplicados; produção segue sem permissão via conector.
- Nenhuma migração, escrita em banco, deploy, commit ou push foi executado.

### 2026-07-17 — Rodada 9 de revisão documental com Gemini

- Gemini 3.5 Flash (High), modo `plan`, recebeu integralmente os planos menores e a Auditoria Viva em duas partes por causa do limite do MCP.
- A primeira revisão confundiu falta de permissão do conector com estado do runtime, omitiu uma chave exposta e tratou evidências históricas como valores a sobrescrever; as propostas foram rejeitadas e devolvidas ao Gemini.
- A segunda revisão preservou a cronologia e distinguiu corretamente exposição em conversa, histórico Git, migrações remotas e ausência de migração desta auditoria.
- README/PROJECT agora registram Next.js 16.1.3 e o estado misto de RLS sem afirmar proteção inexistente.
- `REVISAO_ARQUITETURAL.md` deixou de certificar genericamente roles/RLS e passou a ser um diagnóstico focal do erro de resposta JSON.
- Planos de tenancy, operações e Supabase distinguem a conta do conector, o runtime de produção e os dois incidentes de credenciais.
- O Gemini recebeu o diff final e respondeu `APROVADO`; scanner de segredos e validador de endurecimento passaram.
- Nenhuma migração, escrita em banco, deploy, commit ou push foi executado.

### 2026-07-17 — Rodada 10 de implementação crítica no Supabase de teste

- O usuário autorizou explicitamente SQL/RLS no ambiente de teste; produção permaneceu intocada.
- O Gemini 3.5 Flash (High), sempre em modo `plan`, produziu propostas para disponibilidade, views, RLS, funções, extensões e helper privado. A primeira versão do fluxo de disponibilidade foi rejeitada por alterar contratos e mascarar erros; a segunda foi integrada com correções adicionais do agente principal.
- `anamneses`, `prontuarios`, `usuarios_sessoes` e três tabelas de chat foram fechadas para browser; o trigger de criação de usuário deixou de confiar em metadata para role.
- Exclusion constraints de agenda por profissional/auxiliar foram aplicadas e verificadas; BUG-01 foi corrigido no teste.
- As sete views privilegiadas passaram a `security_invoker` com grants mínimos; a página pública deixou a RPC anônima e usa API server-side de disponibilidade.
- Todas as 21 tabelas públicas antes desprotegidas receberam RLS: 15 com policy administrativa canônica e 6 clínicas/chat deny-by-default. O total de tabelas públicas sem RLS caiu de 21 para zero.
- Vinte e seis funções receberam `search_path` fixo e perderam EXECUTE público; `webhook_log` perdeu INSERT irrestrito; extensões foram movidas para `extensions`; helper administrativo foi movido para `private` mantendo 25 policies funcionais.
- Rotas WhatsApp passaram a falhar fechado sem `N8N_API_KEY`, comparar chave por hash/timing-safe e não retornar erro bruto de banco.
- Advisors de segurança caíram de 84 para 8. Os sete avisos `rls_enabled_no_policy` restantes são informativos e correspondem a deny-by-default intencional; `auth_leaked_password_protection` requer ajuste no painel do Auth.
- Testes de segurança, segredos e migrações passaram; lint focal dos arquivos novos passou; build de 61 páginas/rotas passou.
- Nenhum deploy, commit ou push foi executado. Nenhuma alteração foi feita no Supabase de produção.

### 2026-07-18 — Rodada 11 de atomicidade, tipos e isolamento da lixeira

- Dezessete migrações adicionais desta auditoria completaram operações atômicas de fechamentos, venda rápida, venda/reversão/ajuste de estoque, salvamento/cancelamento de comanda, venda/consumo e catálogo de pacotes, catálogo de serviços/etapas, início de atendimento, fundo de caixa, contas fixas, catálogo de produtos, recuperação de cadastros e índices de performance. O total da auditoria chegou a 25 migrações no teste.
- Handlers e componentes críticos passaram a chamar RPCs service-only; catálogo, preços, saldos e estoque são relidos dentro da transação, com locks e idempotência conforme o fluxo.
- Testes SQL executados dentro de transações descartáveis confirmaram sucesso, rollback em erro, repetição segura e ausência de resíduos. Produção não foi acessada.
- Os tipos TypeScript foram regenerados a partir do schema real do teste. Incompatibilidades de IDs, nulabilidade, JSON e tabelas ausentes foram corrigidas; `tsc --noEmit` caiu de 74 erros para zero.
- A página de cadastros excluídos deixou de selecionar, restaurar e excluir snapshots diretamente pelo browser. A nova API exige admin; a RPC bloqueia o arquivo, usa allowlist estática de cinco tabelas, não sobrescreve colisões, registra autoria em ledger e só então remove o arquivo.
- O cadastro de pacotes deixou de atualizar cabeçalho e substituir itens em três chamadas. A RPC recalcula preço original e duração usando serviços ativos do banco, impede serviços repetidos, preserva o estado anterior em falha e registra `request_id`; `anon`/`authenticated` perderam escrita nas duas tabelas.
- O modal de serviços deixou de salvar serviço e etapas separadamente. A nova API/RPC valida o grupo, deriva a duração pela soma das etapas, substitui etapas na mesma transação e mantém o cadastro anterior quando uma FK falha.
- Vinte e sete FKs sem índice receberam cobertura e seis índices exatamente duplicados foram removidos. Nenhum índice foi removido apenas por constar como “não usado”, pois o ambiente de teste não possui histórico suficiente de carga.
- Grants de `anon` e `authenticated` foram revogados da lixeira, do ledger e da RPC. Teste de colisão confirmou rollback integral e preservação do registro arquivado; nenhuma linha descartável permaneceu.
- O validador estrutural passou a cobrir 48 handlers. Segurança, endurecimento do banco, TypeScript e lint focal passaram.
- Nenhum Gemini/Antigravity foi utilizado. Nenhum deploy, commit ou push foi executado. Nenhuma alteração foi feita no Supabase de produção.

### 2026-07-18 — Rodada 12 de unidade canônica, RLS e qualidade verificável

- Sete migrações adicionais elevaram o total da auditoria a 32 no Supabase de teste; produção permaneceu intocada.
- Criada `user_units`, com RLS deny-by-default, grants exclusivos de serviço, FK indexada e unicidade de uma unidade padrão ativa por usuário. O backfill controlado deixou zero admin existente sem unidade padrão.
- `requireAdmin` passou a devolver a unidade canônica da associação e falhar fechado quando ela não existe. O UUID padrão foi removido de todas as rotas e serviços em `src`.
- O cadastro administrativo agora cria Auth e, por RPC atômica, os registros de `users`, `usuarios` e `user_units`; falhas de banco acionam exclusão compensatória do usuário Auth. A role canônica deixou de ser duplicada em `user_metadata` também na edição.
- Estatísticas financeiras migraram da agregação em JavaScript para `get_financial_stats`, restrita à unidade autorizada e ao intervalo, com índice de cobertura por unidade/tipo/data.
- As 36 policies com avaliação de `auth.*()` por linha foram reescritas sem mudar predicados; depois, 117 sobreposições permissivas foram consolidadas. Escritas de produtos, serviços, etapas, unidades e usuários passaram a exigir a role administrativa canônica.
- `transacoes`, `pacotes_cliente` e `fechamentos_caixa` passaram a filtrar a associação ativa da identidade com `unit_id`; teste negativo sob role `authenticated` retornou zero linha cruzada. Tabelas sem `unit_id` continuam no plano de tenancy.
- Exclusão de serviço e etapas passou a uma única RPC transacional; as duas telas de serviços e a tela de produtos deixaram de excluir esses catálogos diretamente pelo cliente de browser.
- Catálogo remoto confirmou 56/56 tabelas públicas com RLS, zero admin sem unidade, índices e grants esperados. Naquele ponto da rodada, os advisors registravam 21 INFO deny-by-default e o WARN de proteção contra senhas vazadas; a Rodada 13 reduziu os INFO a dois.
- `@ts-nocheck` foi removido de todo `src`; oito arquivos órfãos foram eliminados após busca de imports; `ignoreBuildErrors` saiu do Next. A remoção revelou e corrigiu o uso da coluna inexistente `keywords` e um handler de agendamento duplicado/inativo.
- Credenciais E2E literais foram removidas do helper e de oito documentos. A suíte exige variáveis de ambiente, o scanner cobre os valores vazados e a listagem confirmou 246 execuções sem iniciar operações mutáveis.
- Next.js/React, jsPDF e xlsx foram atualizados. O audit caiu de 13 achados para dois moderados ligados ao PostCSS interno do Next; a sugestão automática de downgrade para Next 9 foi rejeitada. TypeScript, lint e build de 68 páginas/rotas passaram após o upgrade.
- `tsc --noEmit`, build completo de 68 páginas/rotas, lint com zero erro, `test:security`, `test:database-hardening` e `test:secrets` passaram. O validador de segurança cobre 53 handlers/regras e agora impede regressão de unidade fixa, metadata de role e agregação financeira no app.
- Nenhum Gemini/Antigravity foi utilizado. Nenhum deploy, commit ou push foi executado. Nenhuma alteração foi feita no Supabase de produção.

### 2026-07-18 — Rodada 13 de tenancy integral e cache financeiro

- Seis migrações adicionais elevaram o total desta auditoria a 38 no Supabase de teste (40 registros remotos quando incluídas as duas `remote_schema` anteriores).
- As 50 tabelas de negócio agora têm `unit_id` obrigatório, FK, índice iniciado por unidade e policy RLS restritiva; seis tabelas globais foram classificadas explicitamente.
- Cinquenta gatilhos impedem alteração de tenant e cinquenta verificam relações entre registros da mesma unidade. O contexto interno do cliente privilegiado usa `x-unit-id`, e o fallback falha fechado em cenário multiunidade.
- Testes negativos transacionais sob claims reais confirmaram leitura/inserção na própria unidade e rejeição/ocultação da unidade alheia.
- Relações clínicas e de etapas ausentes foram reparadas; quatro etapas órfãs foram removidas. Cinco índices redundantes criados durante o reparo foram detectados pelo advisor e removidos, preservando os equivalentes legados.
- As estatísticas financeiras passaram a usar cache server-side de 30 segundos, particionado por unidade/período, com invalidação após sucesso nas nove rotas mutáveis inventariadas e teste estrutural dedicado.
- Todas as rotas privilegiadas recebem a unidade autorizada no cliente Supabase; catálogos, clínica, caixa, estoque, agenda, lixeira, vendas e integrações ganharam escopo ou preflight de pertença.
- Tipos TypeScript foram gerados novamente do schema remoto atualizado; `tsc --noEmit` continuou com zero erro.
- O advisor de segurança ficou em três achados não críticos: dois INFO deny-by-default e o WARN da proteção contra senhas vazadas. A rotação de chaves e essa configuração não estão disponíveis no conector; a tentativa pelo navegador parou no login do painel.
- O advisor de performance ficou em 190 INFO `unused_index` e zero WARN de duplicidade após a limpeza focal; esses índices aguardam telemetria real, não remoção especulativa.
- Nenhum Gemini/Antigravity foi utilizado. Nenhum deploy, commit ou push foi executado. Nenhuma alteração foi feita no Supabase de produção.

### 2026-07-18 — Rodada 14 de consolidação arquitetural e preparação SEC-06

- A documentação atual do Supabase confirmou a migração recomendada de JWTs legados para chaves independentes `sb_publishable_` e `sb_secret_`; o código passou a priorizar os novos nomes.
- Um validador operacional verifica os dois arquivos de ambiente sem imprimir valores. A execução atual falha porque ambos ainda usam nomes legados e não possuem `sb_secret_`, registrando objetivamente o bloqueio de SEC-06.
- O projeto de teste possui publishable key moderna ativa, mas a public key legada também está ativa. O advisor ainda registra proteção contra senhas vazadas desabilitada. O conector não oferece criação/revogação de secret key nem alteração do Auth.
- Três implementações de cliente foram consolidadas em fábricas de browser, SSR/request e backend privilegiado. `requireAdmin`, proxy, diagnóstico e seis APIs de usuários deixaram de instanciar/importar clientes paralelos.
- `@supabase/auth-helpers-nextjs`, sem consumidores, foi removido. Quatro scripts diagnósticos duplicados que liam e imprimiam registros reais também foram removidos.
- As 18 migrações da primeira fase foram movidas de `database/migrations` para `supabase/migrations` com as versões remotas exatas. A cadeia canônica agora contém as 38 migrações e `database/` está explicitamente marcado como histórico/não executável.
- README, PROJECT, quick start, documentos de autenticação/apresentação e planos deixaram de apresentar Next.js 15, SQLs inexistentes ou a linha de base de 21 tabelas sem RLS como estado atual.
- `test:architecture` passou e garante clientes, dependência, variáveis documentadas, 38 migrações canônicas e ausência de cadeia SQL concorrente. TypeScript permaneceu sem erros após a refatoração.
- Nenhum Gemini/Antigravity foi utilizado. Nenhum deploy, commit ou push foi executado. Nenhuma alteração foi feita no Supabase de produção.

### 2026-07-18 — Rodada 15 de tentativa de encerramento de SEC-06

- Foram recebidas uma publishable key moderna do teste e secret keys modernas dos projetos de teste e produção, sem registrar seus valores em arquivo, comando, log ou documentação.
- Como as secret keys foram transmitidas por chat, elas foram classificadas como expostas e não foram instaladas como credenciais definitivas. O procedimento seguro exige excluir/substituir essas chaves no Dashboard e copiar as novas diretamente para o secret manager autorizado.
- A produção ainda não possui uma publishable key `sb_publishable_` disponível ao runtime; o JWT `anon` legado não pode ser convertido ou apenas renomeado.
- A documentação oficial vigente confirma que criação/exclusão de API keys, desativação das chaves JWT legadas e alteração da configuração de Auth exigem Dashboard ou Management API autenticada; as chaves de Data API não concedem esse acesso administrativo.
- O navegador interno foi aberto na autenticação do Dashboard Supabase para continuidade pelo responsável. Nenhum arquivo de ambiente, banco ou projeto remoto foi alterado nesta tentativa.
- SEC-06 permanece com um problema pendente no resumo executivo. Nenhum Gemini/Antigravity, deploy, migração, commit ou push foi executado.

### 2026-07-18 — Rodada 16 de qualidade, contratos e observabilidade

- O responsável confirmou a conclusão externa de SEC-06. O item foi encerrado por atestação, com observação de estabilidade por 24–48h e sem usar as chaves transmitidas no chat.
- `apiError`, validação de JSON/campos, `ServiceResult` e eventos estruturados formam os contratos canônicos. Autorização, venda de produtos, venda rápida e transações deixaram de duplicar orquestração.
- Nenhuma API usa `console.*`; autenticação, agendamentos e integrações emitem eventos allowlisted com `requestId`. O webhook WhatsApp deixou de persistir seu payload bruto.
- `docs/README.md` e `docs/operations/OBSERVABILITY.md` consolidam fontes e runbook. Foram adicionados testes de contratos, acessibilidade e responsividade; a suíte pública passou 4/4 no Chromium.
- `npm run verify` passou integralmente: 53 handlers/regras de segurança, hardening SQL estrutural, cache financeiro, arquitetura, qualidade, observabilidade, scanner de segredos e TypeScript.
- O lint permanece com zero erro e 306 avisos, contra 427 no início; backend crítico e validadores passam sem avisos. Restam tipos/hooks na UI legada.
- A exclusão física de relatórios e diretórios ignorados foi recusada pela camada de aprovação do ambiente. Nenhum contorno foi usado; os artefatos continuam não versionados e fora de TypeScript/ESLint.
- Nenhum Gemini/Antigravity, deploy, migração, commit ou push foi executado.

## Próxima decisão recomendada

Observar autenticação e operações server-side dos dois ambientes durante 24–48h. Para zerar os dois itens locais restantes, é necessária nova autorização explícita para excluir os artefatos ignorados após o bloqueio da plataforma; a redução dos 306 avisos da UI deve continuar com tipagem de domínio e correção de hooks, sem desativar regras. Produção não foi inspecionada ou alterada pelo Codex nesta rodada.
