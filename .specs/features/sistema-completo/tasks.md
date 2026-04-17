# Tasks — Sistema Completo (Spec SDD)

_Gerado em: 03/04/2026 | Baseado em: spec.md, gaps G-001 a G-009_
_Referência de decisões: STATE.md D-006 a D-015_

---

## Dependências entre tasks

```
T-01 (SQL fechamentos_caixa)
  └─► T-06 (UI fechar caixa)
        └─► T-07 (imutabilidade de comanda)

T-02 (SQL pacotes_cliente)
  └─► T-08 (alerta de pacote na comanda)

T-03 (SQL campos clientes)
  └─► T-09 (painel cadastros pendentes)

T-04 (SQL campos comandas)
  └─► T-07 (desconto auditado no fechamento)

T-05 (idempotência n8n) — independente

T-07 (fechamento da comanda — comissão editável) — depende T-04
```

---

## T-01 — Criar tabela `fechamentos_caixa`

### Overview

Criar a tabela de fechamentos de caixa no Supabase e adicionar RLS por `unit_id`. Esta tabela é o pré-requisito para bloquear criação de agendamentos e edição de comandas em datas fechadas.

### O que implementar

- Executar SQL de criação da tabela `fechamentos_caixa` com os campos definidos no spec
- Criar RLS policy: `SELECT/INSERT/UPDATE` somente para `role = admin` do mesmo `unit_id`
- Criar index em `(unit_id, data_fechamento)` para lookup rápido

### Campos da tabela

```sql
CREATE TABLE fechamentos_caixa (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id           UUID NOT NULL REFERENCES units(id),
  data_fechamento   DATE NOT NULL,
  fechado_por       UUID NOT NULL REFERENCES users(id),
  fechado_em        TIMESTAMPTZ DEFAULT NOW(),
  total_bruto       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_desconto    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_liquido     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_dinheiro    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cartao      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_pix         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_outros      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_comissoes   NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'fechado' CHECK (status IN ('fechado', 'reaberto')),
  UNIQUE (unit_id, data_fechamento)
);
```

### Arquivo SQL alvo

`database/create_fechamentos_caixa.sql`

### Feito quando

- [ ] Tabela existe no Supabase
- [ ] Constraint UNIQUE em `(unit_id, data_fechamento)` — duplo fechamento retorna erro
- [ ] RLS policy aplicada — professional não consegue inserir
- [ ] Index criado em `(unit_id, data_fechamento)`

### Tipo

Banco de dados — executar manualmente no Supabase SQL Editor

---

## T-02 — Criar tabela `pacotes_cliente`

### Overview

Criar a tabela que registra os pacotes pré-pagos vinculados ao CPF dos clientes. É o pré-requisito para o alerta de pacote ativo ao abrir a comanda (T-08).

### O que implementar

- Criar tabela `pacotes_cliente` com os campos definidos no spec
- Criar index em `(unit_id, cliente_cpf, servico_id)` para lookup eficiente
- Criar RLS policy: `SELECT/INSERT` para usuários autenticados do mesmo `unit_id`

### Campos da tabela

```sql
CREATE TABLE pacotes_cliente (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id             UUID NOT NULL REFERENCES units(id),
  cliente_cpf         VARCHAR(14) NOT NULL,
  servico_id          UUID NOT NULL REFERENCES servicos(id),
  sessoes_total       INT NOT NULL CHECK (sessoes_total > 0),
  sessoes_consumidas  INT NOT NULL DEFAULT 0 CHECK (sessoes_consumidas >= 0),
  comanda_origem_id   UUID REFERENCES comandas(id),
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sessoes_consumidas <= sessoes_total)
);
```

### Arquivo SQL alvo

`database/create_pacotes_cliente.sql`

### Feito quando

- [ ] Tabela existe no Supabase
- [ ] Constraint `sessoes_consumidas <= sessoes_total` — não permite consumo além do saldo
- [ ] Constraint `sessoes_consumidas >= 0` — não permite saldo negativo
- [ ] Index em `(unit_id, cliente_cpf, servico_id)` criado
- [ ] RLS policy aplicada

### Tipo

Banco de dados — executar manualmente no Supabase SQL Editor

---

## T-03 — Adicionar campos de completude em `clientes`

### Overview

Adicionar os campos `cadastro_completo` e `origem_cadastro` na tabela `clientes` para suporte ao fluxo de criação via robô WhatsApp (D-014).

### SQL

```sql
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS cadastro_completo  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS origem_cadastro    TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem_cadastro IN ('manual', 'whatsapp'));

-- Clientes existentes = completos por padrão
UPDATE clientes SET cadastro_completo = true WHERE cadastro_completo IS NULL;
```

### Arquivo SQL alvo

`database/add_campos_clientes_completude.sql`

### Feito quando

- [ ] Colunas existem na tabela `clientes`
- [ ] Clientes existentes têm `cadastro_completo = true`
- [ ] API n8n usa `cadastro_completo = false` e `origem_cadastro = 'whatsapp'` ao criar cliente novo

### Tipo

Banco de dados — executar manualmente no Supabase SQL Editor

---

## T-04 — Adicionar campos de desconto auditado em `comandas`

### Overview

Adicionar os campos de desconto com rastreabilidade à tabela `comandas`, conforme a decisão D-010 (qualquer usuário pode descontar, mas fica registrado quem foi).

### SQL

```sql
ALTER TABLE comandas
  ADD COLUMN IF NOT EXISTS desconto_valor         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_aplicado_por  UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS desconto_aplicado_em   TIMESTAMPTZ;
```

### Arquivo SQL alvo

`database/add_desconto_auditado_comandas.sql`

### Feito quando

- [ ] Colunas existem na tabela `comandas`
- [ ] `desconto_valor` default = 0 (sem desconto é o estado padrão)
- [ ] `desconto_aplicado_por` NULL quando não há desconto

### Tipo

Banco de dados — executar manualmente no Supabase SQL Editor

---

## T-05 — Idempotência na API n8n

### Overview

Adicionar log de webhooks e chave de idempotência no endpoint `POST /api/n8n/agendamentos`. O mesmo payload enviado duas vezes deve retornar o agendamento existente sem duplicar.

### O que implementar

- Criar tabela `webhook_log` para auditoria de chamadas n8n
- No handler de `/api/n8n/agendamentos`: antes de `INSERT`, fazer lookup por `(telefone, servico_id, data_agendamento, horario_agendamento)` — se existir, retornar 200 com o agendamento existente
- Registrar cada chamada em `webhook_log` com payload, status_code, erro

### Campos de `webhook_log`

```sql
CREATE TABLE webhook_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       UUID REFERENCES units(id),
  endpoint      TEXT NOT NULL,
  payload       JSONB,
  status_code   INT,
  erro          TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);
```

### Arquivos alvo

- `database/create_webhook_log.sql`
- `src/app/api/n8n/agendamentos/route.ts`

### Feito quando

- [ ] Mesmo payload enviado 2x retorna 200 com `agendamento_id` idêntico
- [ ] Cada chamada registrada em `webhook_log` com payload e status
- [ ] Falha de webhook não cancela o agendamento (erro silencioso no log)

### Tipo

Backend — SQL + API Route

---

## T-06 — UI: Página de Fechamento de Caixa

### Overview

Criar a página `/admin/financeiro/fechar-caixa` (ou seção na página de financeiro existente) para que o admin execute o fechamento manual do caixa diário.

### Componentes a implementar

- `ResumoFechamento` — lista comandas do dia com totais por método de pagamento
- `TotalPorMetodo` — breakdown: dinheiro, cartão, pix, outros
- `TotalComissoes` — soma das comissões do dia por profissional
- Botão "Fechar Caixa" com modal de confirmação
- Botão "Reabrir Caixa" (admin only, com confirmação destrutiva)
- Badge de status "Caixa Fechado" quando a data já possui fechamento

### Regras de UI

- Somente admins vêem e interagem com o fechamento
- "Fechar Caixa" desabilitado se não há comandas fechadas no dia
- Após fechar: página muda para modo leitura com os totais congelados
- Caixa já fechado exibe data, hora e nome de quem fechou

### Arquivos alvo

- `src/app/admin/financeiro/page.tsx` ou nova rota `fechar-caixa/page.tsx`
- `src/components/modals/FechamentoCaixaModal.tsx`
- `src/services/caixa.ts` (funções: `buscarResumoDia`, `fecharCaixa`, `reabrirCaixa`)

### Depende de

T-01 (tabela `fechamentos_caixa` deve existir)

### Feito quando

- [ ] Admin consegue ver resumo do dia antes de fechar
- [ ] Fechar Caixa persiste registro em `fechamentos_caixa`
- [ ] Página exibe modo leitura após fechamento
- [ ] Tentativa de fechar dia sem comandas exibe mensagem clara
- [ ] Profissional (non-admin) não consegue acessar a ação

### Tipo

Frontend — é uma implementação de protótipo com comportamentos

---

## T-07 — Comissão editável no fechamento da comanda

### Overview

Refatorar o `ComandaViewDrawer` para que, ao fechar a comanda, o admin/recepcionista possa **editar a comissão de cada profissional** individualmente. O sistema exibe o valor sugerido com base no `percentual_comissao` do profissional × valor do serviço, mas o valor final é livre (D-006).

### Componentes a implementar

- Seção "Comissões" no drawer de fechamento com campo numérico editável por profissional
- Valor pré-preenchido = `preco_servico × percentual_comissao` do profissional
- Ao fechar: persistir em tabela `comissoes` com `criado_por = user_id atual`
- Desconto também editável: campo `desconto_valor` (R$) com registro de `desconto_aplicado_por`

### Regras de UI

- Comissão pode ser R$ 0 (sem comissão)
- Comissão não pode ser negativa
- Se desconto aplicado: mostrar quem aplicou e quando (auditoria visual)
- Bloquear edição se comanda pertence a período com caixa fechado

### Arquivos alvo

- `src/components/modals/ComandaViewDrawer.tsx`
- Tabela `comissoes` (verificar se existe — se não, criar via SQL)
- `src/services/comandas.ts` (função `fecharComandaComComissoes`)

### Depende de

T-04 (campos de desconto auditado em `comandas`)

### Feito quando

- [ ] Campo de comissão editável por profissional aparece no fechamento
- [ ] Valor sugerido pré-preenchido (percentual × serviço)
- [ ] Comissão salva em `comissoes` com `criado_por`
- [ ] Desconto salvo com `desconto_aplicado_por` e `desconto_aplicado_em`
- [ ] Comanda de período fechado → campos desabilitados (readonly)

### Tipo

Frontend + Backend

---

## T-08 — Alerta de pacote ativo ao abrir comanda

### Overview

Ao criar ou abrir uma comanda a partir de um agendamento, verificar se o cliente possui `pacotes_cliente` ativo (com saldo) para o serviço em questão. Se sim, exibir alerta visual e oferecer o uso do saldo.

### O que implementar

- Função `verificarPacoteAtivo(cpf, servico_id, unit_id)` em `src/services/pacotes.ts`
- No `ComandaModal`, ao carregar: se cliente tem CPF, chamar `verificarPacoteAtivo`
- Exibir `Alert` amarelo com: "Cliente tem X sessões disponíveis no pacote [Nome do Serviço]. Usar pacote?"
- Se usuário confirmar: adicionar método de pagamento `pacote` e debitar 1 sessão em `pacotes_cliente` ao fechar
- Debito de sessão deve ser atômico: `UPDATE pacotes_cliente SET sessoes_consumidas = sessoes_consumidas + 1 WHERE id = ? AND sessoes_consumidas < sessoes_total`

### Regras

- Se cliente sem CPF: sem alerta (CPF é obrigatório para pacotes — RN-PKG-003)
- Pacote esgotado (`sessoes_consumidas = sessoes_total`): não exibir alerta
- Múltiplos pacotes ativos para serviços diferentes: alertar separadamente

### Arquivos alvo

- `src/services/pacotes.ts` (novo)
- `src/components/modals/ComandaModal.tsx`

### Depende de

T-02 (tabela `pacotes_cliente` deve existir)

### Feito quando

- [ ] Alerta aparece quando cliente tem CPF + pacote ativo para o serviço
- [ ] Alerta não aparece quando cliente sem CPF
- [ ] Alerta não aparece quando pacote esgotado
- [ ] Débito de sessão é atômico (sem race condition)
- [ ] Erro de débito exibido claramente se pacote já esgotado no momento do fechamento

### Tipo

Frontend + Backend

---

## T-09 — Painel de cadastros pendentes

### Overview

Exibir na tela de agenda (ou dashboard) um painel com os clientes do dia que têm `cadastro_completo = false`. Isso permite que a recepção complete o cadastro antes ou durante o atendimento.

### Componentes a implementar

- Card "Cadastros Pendentes Hoje" no dashboard ou sidebar da agenda
- Lista: nome do cliente, horário do agendamento, botão "Completar Cadastro"
- Ao clicar "Completar Cadastro": abrir `ClienteModal` com os campos obrigatórios (CPF, email, data_nascimento) pré-focados
- Após salvar com CPF: atualizar `cadastro_completo = true`
- Badge no menu lateral com contagem de pendências (ex: 🟡 3)

### Regras

- Exibe apenas agendamentos do dia atual com `cadastro_completo = false`
- Se não há pendências: card oculto (não ocupa espaço)
- Contagem atualiza em tempo real ao completar um cadastro

### Arquivos alvo

- `src/app/admin/agenda/page.tsx` (adicionar seção de alertas)
- `src/app/admin/dashboard/page.tsx` (adicionar card de pendências)
- `src/components/modals/ClienteModal.tsx` (verificar se existe e se suporta edição parcial)

### Depende de

T-03 (campo `cadastro_completo` em `clientes`)

### Feito quando

- [ ] Card de pendências aparece quando há clientes sem cadastro completo no dia
- [ ] Card oculto quando não há pendências
- [ ] Completar cadastro atualiza `cadastro_completo = true`
- [ ] Badge no menu lateral reflete contagem atual

### Tipo

Frontend

---

## Ordem de execução recomendada

### Fase 1 — Banco de dados (executar no Supabase, sem dependência de código)
- T-01, T-02, T-03, T-04 podem ser executadas em paralelo

### Fase 2 — Backend (após Fase 1)
- T-05 (idempotência n8n) — independente

### Fase 3 — Frontend (após Fase 1)
- T-06 (UI fechar caixa) — depende T-01
- T-07 (comissão editável) — depende T-04
- T-08 (alerta pacote) — depende T-02
- T-09 (painel pendências) — depende T-03

---

## Status

| Task | Tipo | Depende | Status |
|------|------|---------|--------|
| T-01 | SQL (manual) | — | ✅ Concluído (03/04/2026) |
| T-02 | SQL (manual) | — | ✅ Concluído (03/04/2026) |
| T-03 | SQL (manual) | — | ✅ Concluído (03/04/2026) |
| T-04 | SQL (manual) | — | ✅ Concluído (03/04/2026) |
| T-05 | Backend | — | ✅ Concluído (03/04/2026) |
| T-06 | Frontend | T-01 ✅ | ✅ Concluído (03/04/2026) |
| T-07 | Frontend+Backend | T-04 ✅ | ✅ Concluído (03/04/2026) |
| T-08 | Frontend+Backend | T-02 ✅ | ✅ Concluído (03/04/2026) |
| T-09 | Frontend | T-03 ✅ | ✅ Concluído (16/04/2026) |
