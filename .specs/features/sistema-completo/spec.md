# SPEC — Otimiza Beauty Manager: Sistema Completo

_Gerado em: 03/04/2026 | Método: SDD via entrevista de descoberta (10 decisões)_
_Autor do processo: GitHub Copilot (Product Analyst + Arquiteto)_

---

## 1. Visão Geral

Sistema SaaS multi-tenant para gestão operacional de salões de beleza de alto volume. Cobre o ciclo completo: **agendamento → atendimento → comanda → caixa → relatório**, com canal WhatsApp automatizado via n8n e painel admin completo.

---

## 2. Decisões de Produto (Registro Canônico)

| # | Decisão | Impacto |
|---|---------|---------|
| D-006 | Comissão definida manualmente no fechamento da comanda | `percentual_comissao` do profissional é sugestão, não automático |
| D-007 | Split payment — múltiplos métodos por comanda | N registros em `transacoes` por comanda |
| D-008 | Disponibilidade controlada apenas pela agenda do profissional | Sem entidade "recurso físico" no modelo |
| D-009 | Cancelamento sem impacto financeiro; permissão: admin ou professional | Status final = `cancelado` |
| D-010 | Desconto no total da comanda; qualquer usuário; auditado (`aplicado_por`) | Campos extras em `comandas` |
| D-011 | Estados do agendamento: agendado → confirmado → em_atendimento → concluído → cancelado | Enum no DB |
| D-012 | Pacotes = pré-pagamento total em comanda, vinculado ao CPF, sessões abatidas por agendamento | Nova tabela `pacotes_cliente` |
| D-013 | Payload n8n: telefone, nome, servico_id, data, horário, escalacao_do_servico | Contrato de API fixo |
| D-014 | Cliente novo via robô criado sem CPF; flag `cadastro_completo = false`; recepção completa no dia | Campo novo em `clientes` |
| D-015 | Fechamento de caixa manual por admin; congela período; comandas imutáveis após fechamento | Nova tabela `fechamentos_caixa` |

---

## 3. Personas

| Persona | Acesso | Necessidade Principal |
|---------|--------|----------------------|
| **Admin / Proprietário** | Total | Dashboard KPI, fechamento de caixa, relatórios, gestão de profissionais |
| **Recepcionista** (role: admin) | Total | Criação rápida de agendamentos, abertura de comandas, completar cadastros pendentes |
| **Profissional** (role: professional) | Própria agenda + próprias comandas | Ver agenda do dia, iniciar/fechar atendimento, conferir comissões |
| **Robô n8n** (service account) | API pública autenticada por `x-api-key` | Criar agendamentos via WhatsApp, buscar horários disponíveis |

---

## 4. Escopo

### 4.1 Dentro do Escopo
- Agendamento interno (admin/recepção) e via WhatsApp (n8n)
- Gestão de profissionais, serviços com etapas e pacotes
- Controle de produtos (revenda + uso interno + insumos)
- Comandas com itens, descontos, split payment, comissão manual
- Pacotes pré-pagos vinculados ao CPF do cliente
- Fechamento de caixa manual com congelamento de período
- Relatórios: faturamento, comissões, estoque, agendamentos
- Dashboard KPI diário/mensal
- Notificações WhatsApp via n8n (confirmação, lembretes)

### 4.2 Fora do Escopo
- Recursos físicos (cadeiras, salas) como entidade de disponibilidade
- Gateway de pagamento online
- App mobile nativo (iOS/Android)
- No-show com cobrança automática
- Multi-idioma

---

## 5. Épicos

---

### ÉPICO 1 — Agendamento

**Objetivo:** Gerenciar o ciclo completo de um atendimento desde o agendamento até a conclusão, com suporte a múltiplos profissionais, etapas de serviço e canal WhatsApp.

#### 5.1.1 Regras de Negócio

| ID | Regra |
|----|-------|
| RN-AGE-001 | A duração de um agendamento é definida pelo serviço (soma das etapas se houver etapas). |
| RN-AGE-002 | Conflito = sobreposição de `[hora_inicio, hora_inicio + duracao)` para o mesmo `profissional_id` na mesma `data`. |
| RN-AGE-003 | Um atendimento pode ter N profissionais simultâneos (cada um tem seu próprio registro em `agendamentos` vinculados ao mesmo grupo). |
| RN-AGE-004 | Agendamentos com etapas seguem a `escalacao_do_servico`: cada etapa tem `profissional_id`, `hora_inicio`, `duracao`. |
| RN-AGE-005 | Somente `admin` ou o `professional` responsável pode cancelar um agendamento. |
| RN-AGE-006 | Agendamento em período com caixa fechado **não pode ser criado** (retorna erro 409). |
| RN-AGE-007 | Ao criar agendamento via n8n, se o cliente não existir (lookup por telefone), criar com `cadastro_completo = false`. |
| RN-AGE-008 | Se o cliente tiver pacote ativo para o serviço, o sistema deve alertar e oferecer consumo do saldo ao confirmar a comanda. |

#### 5.1.2 User Stories

| ID | Como... | Quero... | Para... |
|----|---------|----------|---------|
| US-AGE-001 | Recepcionista | Abrir a agenda do dia por profissional | Ver disponibilidade em um relance |
| US-AGE-002 | Recepcionista | Criar um agendamento arrastando para um horário | Agendar rapidamente sem formulário longo |
| US-AGE-003 | Recepcionista | Ser alertada de conflito antes de salvar | Evitar agendamentos duplicados |
| US-AGE-004 | Profissional | Ver minha agenda do dia no PWA | Me preparar para os atendimentos |
| US-AGE-005 | Admin | Editar ou cancelar qualquer agendamento | Corrigir erros ou atender remarcações |
| US-AGE-006 | Robô (n8n) | Criar agendamento via API com payload padronizado | Automatizar agendamentos do WhatsApp |
| US-AGE-007 | Recepcionista | Ver lista de clientes do dia com cadastro pendente | Completar o cadastro antes do atendimento |
| US-AGE-008 | Admin | Ver no dashboard quantos agendamentos têm cadastro incompleto | Monitorar pendências operacionais |

#### 5.1.3 Estados do Agendamento

```
agendado ──► confirmado ──► em_atendimento ──► concluído
    │              │                │
    └──────────────┴────────────────┴──► cancelado
```

- `agendado`: criado (interno ou via robô), aguarda confirmação
- `confirmado`: confirmado por recepção ou pelo robô após resposta do cliente
- `em_atendimento`: comanda foi aberta (vinculada ao agendamento)
- `concluído`: comanda fechada com pagamento
- `cancelado`: encerrado sem atendimento (admin ou professional)

#### 5.1.4 Fluxo Principal — Agendamento Interno

1. Recepcionista seleciona data + profissional na agenda
2. Sistema exibe horários disponíveis (sem sobreposição)
3. Recepcionista seleciona cliente (busca ou cria novo)
4. Recepcionista seleciona serviço → sistema calcula duração + etapas
5. Sistema verifica conflito → se limpo, persiste `agendamentos`
6. Status = `agendado`; n8n recebe webhook para enviar confirmação WhatsApp

#### 5.1.5 Fluxo Principal — Agendamento via n8n

1. n8n recebe mensagem WhatsApp
2. n8n chama `GET /api/n8n/horarios-vagos?servico_id=&data=` → retorna `escalacao_do_servico`
3. Cliente confirma horário no WhatsApp
4. n8n chama `POST /api/n8n/agendamentos` com payload D-013
5. Sistema: lookup cliente por telefone → cria se não existe (D-014)
6. Sistema persiste agendamento com `origem = 'whatsapp'`
7. Status = `agendado`; n8n retorna confirmação ao cliente

#### 5.1.6 Contrato de API n8n

**POST `/api/n8n/agendamentos`**
```json
{
  "telefone_cliente": "string (só números)",
  "nome_cliente": "string",
  "servico_id": "uuid",
  "data_agendamento": "YYYY-MM-DD",
  "horario_agendamento": "HH:MM:SS",
  "escalacao_do_servico": [
    {
      "profissional_id": "uuid",
      "etapa_index": 0,
      "hora_inicio": "HH:MM:SS",
      "duracao_minutos": 60
    }
  ]
}
```

Autenticação: `x-api-key` header (D-013)
Idempotência: chave = `(telefone, servico_id, data, horario)` — duplicatas retornam 200 com o agendamento existente.

#### 5.1.7 Casos de Exceção

| Caso | Comportamento |
|------|---------------|
| Conflito de horário | Retorna 409 com horários alternativos disponíveis |
| Profissional inativo/sem horário | Retorna 422 com mensagem clara |
| Caixa do dia já fechado | Retorna 409 "período fechado" |
| Cliente com pacote ativo para o serviço | Alert visual na tela de confirmação |
| n8n envia payload duplicado | Idempotência — retorna agendamento existente sem duplicar |

#### 5.1.8 Critérios de Aceitação

- [ ] Conflito detectado antes de persistir (0 agendamentos sobrepostos por profissional)
- [ ] Agendamento via n8n cria cliente com `cadastro_completo = false` quando novo
- [ ] Idempotência: mesmo payload enviado 2x resulta em 1 agendamento
- [ ] Dashboard de recepção exibe clientes do dia com cadastro pendente
- [ ] Estado `em_atendimento` só é setado quando comanda é aberta

---

### ÉPICO 2 — Comanda / POS

**Objetivo:** Registrar e fechar o consumo do atendimento, com múltiplos itens, descontos, split payment e comissões definidas no fechamento.

#### 5.2.1 Regras de Negócio

| ID | Regra |
|----|-------|
| RN-CMD-001 | Uma comanda é criada a partir de um agendamento (botão "Iniciar Atendimento") ou manualmente sem agendamento. |
| RN-CMD-002 | Comanda criada a partir de agendamento herda os serviços do agendamento como itens iniciais. |
| RN-CMD-003 | O desconto é aplicado no total da comanda. Campo `desconto_valor` (R$). Qualquer usuário pode aplicar. `desconto_aplicado_por` (user_id) e `desconto_aplicado_em` (timestamp) são obrigatórios se desconto > 0. |
| RN-CMD-004 | O total final = Σ(itens) − desconto_valor. |
| RN-CMD-005 | Pagamento pode ser dividido em N métodos. Soma dos pagamentos deve cobrir o total final. |
| RN-CMD-006 | Métodos de pagamento aceitos: `dinheiro`, `cartao_credito`, `cartao_debito`, `pix`, `pacote`, `cortesia`. |
| RN-CMD-007 | Ao fechar, admin/recepcionista define a comissão para cada profissional envolvido (valor livre, não percentual forçado). O sistema sugere com base no `percentual_comissao` do profissional × valor do serviço. |
| RN-CMD-008 | Se o método `pacote` for usado, o sistema debita uma sessão do `pacotes_cliente` do CPF do cliente. |
| RN-CMD-009 | Comanda em período com caixa fechado é **imutável** (somente leitura). |
| RN-CMD-010 | Baixa automática de estoque: serviços com insumos vinculados (`servicos_produtos`) debitam `produtos.quantidade` ao fechar comanda. |
| RN-CMD-011 | Produtos de revenda adicionados como itens da comanda também debitam `produtos.quantidade`. |

#### 5.2.2 User Stories

| ID | Como... | Quero... | Para... |
|----|---------|----------|---------|
| US-CMD-001 | Recepcionista | Abrir uma comanda a partir do agendamento com 1 clique | Não redigitar serviços já agendados |
| US-CMD-002 | Recepcionista | Adicionar itens extras à comanda (produtos, serviços adicionais) | Registrar consumo real do atendimento |
| US-CMD-003 | Recepcionista | Aplicar desconto no total e registrar o motivo | Oferecer cortesia ou promoção rastreável |
| US-CMD-004 | Recepcionista | Dividir o pagamento em múltiplos métodos | Atender clientes que pagam parte em dinheiro, parte em cartão |
| US-CMD-005 | Recepcionista | Definir a comissão de cada profissional ao fechar | Ter controle total sobre o rateio |
| US-CMD-006 | Recepcionista | Ver alerta se o cliente tem pacote ativo para o serviço | Usar o saldo do pacote antes de cobrar normalmente |
| US-CMD-007 | Admin | Ver todas as comandas do dia (abertas e fechadas) | Monitorar o fluxo do caixa em tempo real |

#### 5.2.3 Estados da Comanda

```
aberta ──► fechada
  │
  └──► cancelada
```

#### 5.2.4 Fluxo de Fechamento da Comanda

1. Recepcionista clica em "Fechar Comanda"
2. Sistema exibe resumo: itens + total
3. Recepcionista aplica desconto (opcional)
4. Sistema recalcula total final
5. Recepcionista define pagamentos (método + valor, pode adicionar N)
6. Sistema valida: Σ pagamentos ≥ total final (troco calculado se dinheiro)
7. Recepcionista define comissão por profissional (sistema sugere com base em `percentual_comissao`)
8. Recepcionista confirma → sistema:
   - Atualiza `comandas.status = 'fechada'`
   - Insere N registros em `transacoes`
   - Insere registros em `comissoes`
   - Se `pacote` usado: debita sessão em `pacotes_cliente`
   - Debita insumos e produtos de revenda em `produtos`
   - Atualiza `agendamentos.status = 'concluído'`

#### 5.2.5 Modelo de Dados — Campos Necessários

**`comandas`** (adições):
```
desconto_valor          NUMERIC(10,2) DEFAULT 0
desconto_aplicado_por   UUID REFERENCES users(id)
desconto_aplicado_em    TIMESTAMPTZ
```

**`transacoes`** (N por comanda):
```
id, comanda_id, metodo, valor, criado_em
```

**`comissoes`**:
```
id, comanda_id, profissional_id, valor_comissao, criado_por, criado_em
```

#### 5.2.6 Critérios de Aceitação

- [ ] Comanda criada a partir de agendamento herda os itens automaticamente
- [ ] Desconto salva `desconto_aplicado_por` e `desconto_aplicado_em`
- [ ] Split payment: soma de todos os métodos = total final (UI bloqueia fechamento se não bater)
- [ ] Comissão salva com `criado_por` (user_id de quem fechou)
- [ ] Estoque debitado automaticamente ao fechar (serviços com insumos + produtos revenda)
- [ ] Comanda em período fechado = somente leitura (UI desabilita edição)

---

### ÉPICO 3 — Pacotes Pré-Pagos

**Objetivo:** Permitir que clientes comprem pacotes de serviços antecipadamente e consumam as sessões em agendamentos futuros.

#### 5.3.1 Regras de Negócio

| ID | Regra |
|----|-------|
| RN-PKG-001 | Um pacote é comprado via comanda: o item da comanda é do tipo `pacote`, com `servico_id`, `quantidade_sessoes`, `valor_total`. |
| RN-PKG-002 | Ao fechar a comanda com item tipo `pacote`, o sistema cria registros em `pacotes_cliente` vinculados ao CPF do cliente. |
| RN-PKG-003 | O lookup de pacote ativo usa CPF do cliente (não o ID). Cliente sem CPF não pode usar pacote. |
| RN-PKG-004 | Ao abrir comanda a partir de agendamento, se o cliente tiver CPF e pacote ativo para aquele serviço, sistema exibe alerta. |
| RN-PKG-005 | Ao usar pacote no pagamento (método `pacote`), sistema debita 1 sessão: `sessoes_consumidas += 1`. |
| RN-PKG-006 | Pacote com `sessoes_consumidas = sessoes_total` está esgotado — não pode ser usado. |
| RN-PKG-007 | Pacotes não têm validade por padrão (sem `expira_em`). Futura melhoria. |

#### 5.3.2 Modelo de Dados

**`pacotes_cliente`**:
```
id                  UUID PK
cliente_cpf         VARCHAR(14) NOT NULL
servico_id          UUID REFERENCES servicos(id)
sessoes_total       INT NOT NULL
sessoes_consumidas  INT DEFAULT 0
comanda_origem_id   UUID REFERENCES comandas(id)
unit_id             UUID REFERENCES units(id)
criado_em           TIMESTAMPTZ DEFAULT NOW()
```

#### 5.3.3 Critérios de Aceitação

- [ ] Compra de pacote gera `pacotes_cliente` com `sessoes_consumidas = 0`
- [ ] Cliente sem CPF não pode usar método `pacote` no pagamento
- [ ] Alerta de pacote ativo exibido ao abrir comanda (se CPF + serviço baterem)
- [ ] Consumo de sessão é atômico (sem race condition — UPDATE com WHERE `sessoes_consumidas < sessoes_total`)
- [ ] Pacote esgotado retorna erro claro antes de prosseguir com pagamento

---

### ÉPICO 4 — Caixa / Fechamento Diário

**Objetivo:** Registrar o fechamento manual do caixa diário, congelando o período e gerando o resumo financeiro do dia.

#### 5.4.1 Regras de Negócio

| ID | Regra |
|----|-------|
| RN-CXA-001 | Somente `admin` pode executar o fechamento de caixa. |
| RN-CXA-002 | Só é possível ter 1 fechamento por data por `unit_id`. |
| RN-CXA-003 | Ao fechar, o sistema congela todas as comandas `fechadas` da data: nenhuma edição posterior é permitida. |
| RN-CXA-004 | Comandas `abertas` no momento do fechamento permanecem abertas (não são canceladas automaticamente). |
| RN-CXA-005 | Novos agendamentos para datas com caixa fechado são bloqueados (RN-AGE-006). |
| RN-CXA-006 | O fechamento registra: total_bruto, total_desconto, total_liquido, total_por_metodo, total_comissoes. |
| RN-CXA-007 | Fechamento pode ser reaberto apenas por admin (ação destrutiva — requer confirmação). |

#### 5.4.2 Modelo de Dados

**`fechamentos_caixa`**:
```
id                  UUID PK
unit_id             UUID REFERENCES units(id)
data_fechamento     DATE NOT NULL
fechado_por         UUID REFERENCES users(id)
fechado_em          TIMESTAMPTZ
total_bruto         NUMERIC(12,2)
total_desconto      NUMERIC(12,2)
total_liquido       NUMERIC(12,2)
total_dinheiro      NUMERIC(12,2)
total_cartao        NUMERIC(12,2)
total_pix           NUMERIC(12,2)
total_outros        NUMERIC(12,2)
total_comissoes     NUMERIC(12,2)
status              ENUM('fechado', 'reaberto') DEFAULT 'fechado'
```

#### 5.4.3 Fluxo de Fechamento

1. Admin acessa página de Caixa
2. Sistema exibe resumo do dia: comandas fechadas, valor por método, comissões
3. Admin confere e clica "Fechar Caixa"
4. Confirmação modal com totais
5. Admin confirma → sistema:
   - Insere em `fechamentos_caixa` com totais calculados
   - Flag de congelamento: `comandas.data_referencia` comparada a `fechamentos_caixa.data_fechamento`
6. Período fica somente leitura

#### 5.4.4 Critérios de Aceitação

- [ ] Somente admin consegue executar fechamento
- [ ] Tentativa de criar agendamento em data fechada retorna erro descritivo
- [ ] Tentativa de editar comanda em data fechada retorna erro descritivo
- [ ] Fechamento exibe resumo correto antes de confirmar (total, métodos, comissões)
- [ ] Duplo fechamento da mesma data retorna 409

---

### ÉPICO 5 — Clientes

**Objetivo:** Manter o cadastro de clientes com flag de completude e histórico de agendamentos/comandas.

#### 5.5.1 Regras de Negócio

| ID | Regra |
|----|-------|
| RN-CLI-001 | Cliente criado via robô: `nome`, `telefone`, `cadastro_completo = false`. CPF = null. |
| RN-CLI-002 | Cliente criado manualmente pela recepção pode ter CPF desde a criação. |
| RN-CLI-003 | CPF é necessário para usar pacotes pré-pagos (RN-PKG-003). |
| RN-CLI-004 | Lookup de cliente existente via robô: busca por `telefone` (normalizado, só números). |
| RN-CLI-005 | Recepção deve completar o cadastro (CPF, e-mail, data_nascimento) antes ou no dia do atendimento. |

#### 5.5.2 Campos Adicionais em `clientes`

```
cadastro_completo   BOOLEAN DEFAULT true  -- false para criados pelo robô
origem_cadastro     ENUM('manual','whatsapp') DEFAULT 'manual'
```

#### 5.5.3 Critérios de Aceitação

- [ ] Clientes com `cadastro_completo = false` aparecem em painel de pendências
- [ ] Busca de cliente por telefone normaliza o número (remove espaços, +55, etc.)
- [ ] Ao completar cadastro com CPF, sistema verifica duplicata de CPF no mesmo `unit_id`

---

### ÉPICO 6 — Relatórios e Analytics

**Objetivo:** Fornecer visibilidade financeira e operacional para admin e profissionais.

#### 5.6.1 Relatórios Requeridos

| Relatório | Filtros | Quem vê |
|-----------|---------|---------|
| Faturamento por período | data_inicio, data_fim | Admin |
| Faturamento por método de pagamento | data, método | Admin |
| Comissões por profissional | período, profissional | Admin |
| Agendamentos por período | data, status, profissional | Admin |
| Estoque atual (posição) | categoria, estoque_baixo | Admin |
| Movimentação de estoque | período, produto | Admin |
| Histórico de atendimentos do cliente | cliente_id | Admin |
| Pacotes ativos por cliente | unit_id | Admin |
| Comandas em aberto | data | Admin |

#### 5.6.2 Critérios de Aceitação

- [ ] Todos os relatórios respeitam `unit_id` (multi-tenancy)
- [ ] Relatório de comissões exportável em PDF/Excel
- [ ] Relatório de faturamento por período exportável em PDF/Excel
- [ ] Relatório de pacotes mostra `sessoes_consumidas / sessoes_total` por cliente

---

## 6. Modelo de Dados — Visão Completa

### 6.1 Entidades Principais

```
units (tenant)
  id, nome, ...

clientes
  id, unit_id, nome, telefone, cpf, email, data_nascimento
  cadastro_completo BOOLEAN, origem_cadastro ENUM

profissionais
  id, unit_id, nome, percentual_comissao, ativo, horarios_por_dia JSONB

servicos
  id, unit_id, nome, duracao_minutos, preco, grupo_id

servico_etapas
  id, servico_id, ordem, nome, duracao_minutos, profissional_preferido_id

servicos_produtos (insumos)
  servico_id, produto_id, quantidade_media

agendamentos
  id, unit_id, cliente_id, profissional_id, servico_id
  data, hora_inicio, hora_fim, status ENUM, origem ENUM('manual','whatsapp')
  comanda_id (FK → comandas), grupo_agendamento_id (para multi-prof)
  etapa_index, tem_etapas, eh_auxiliar

comandas
  id, unit_id, cliente_id, status ENUM('aberta','fechada','cancelada')
  total_bruto, desconto_valor, total_liquido
  desconto_aplicado_por (FK → users), desconto_aplicado_em
  criado_por (FK → users), criado_em, fechado_em

comanda_itens
  id, comanda_id, tipo ENUM('servico','produto','pacote')
  servico_id, produto_id, pacote_id
  quantidade, preco_unitario, profissional_id

transacoes
  id, comanda_id, metodo ENUM, valor, criado_em

comissoes
  id, comanda_id, profissional_id, valor_comissao
  criado_por (FK → users), criado_em

pacotes_cliente
  id, unit_id, cliente_cpf, servico_id
  sessoes_total, sessoes_consumidas, comanda_origem_id, criado_em

produtos
  id, unit_id, nome, tipo ENUM('revenda','uso_interno','insumo')
  quantidade, quantidade_minima, preco, preco_custo

estoque_movimentacoes
  id, produto_id, tipo, quantidade_delta, motivo, comanda_id, criado_por, criado_em

fechamentos_caixa
  id, unit_id, data_fechamento, fechado_por, fechado_em
  total_bruto, total_desconto, total_liquido
  total_dinheiro, total_cartao, total_pix, total_outros, total_comissoes
  status ENUM('fechado','reaberto')
```

---

## 7. Integrações

### 7.1 n8n / WhatsApp

| Endpoint | Método | Proteção | Descrição |
|----------|--------|----------|-----------|
| `/api/n8n/horarios-vagos` | GET | `x-api-key` | Retorna `escalacao_do_servico` para data+serviço |
| `/api/n8n/agendamentos` | POST | `x-api-key` | Cria agendamento (idempotente) |
| `/api/n8n/clientes/lookup` | GET | `x-api-key` | Busca cliente por telefone |

**Requisitos de robustez:**
- Idempotência por `(telefone, servico_id, data, horario)` — duplicatas retornam 200
- Log de cada chamada em tabela `webhook_log` (timestamp, payload, status_code, erro)
- Falha silenciosa de notificação WhatsApp NÃO cancela o agendamento

---

## 8. Auditoria e Segurança

| Campo | Onde | O que rastreia |
|-------|------|----------------|
| `desconto_aplicado_por` | `comandas` | Quem deu desconto e quando |
| `criado_por` | `comissoes`, `comandas` | Quem fechou a comanda |
| `fechado_por` | `fechamentos_caixa` | Quem fechou o caixa |
| `origem_cadastro` | `clientes` | Se veio do robô ou manual |
| `origem` | `agendamentos` | Se veio do WhatsApp ou manual |
| `estoque_movimentacoes` | tabela própria | Todo débito de estoque auditado |
| RLS `unit_id` | todas as tabelas | Isolamento multi-tenant |

---

## 9. Compatibilidade com o Estado Atual

### 9.1 O que já existe e é compatível

| Feature | Estado | Compatível com spec? |
|---------|--------|---------------------|
| Agendamento com drag & drop | ✅ Produção | ✅ — estados já usados |
| Etapas de serviço (`comanda_item_etapas`) | ✅ Produção | ✅ — alinha com RN-AGE-004 |
| ComandaModal com insumos (`consumirInsumosServico`) | ✅ Produção | ✅ — alinha com RN-CMD-010 |
| Split payment (transacoes) | ✅ Existe tabela | ✅ — alinha com D-007 |
| `percentual_comissao` em profissionais | ✅ Produção | ✅ — vira sugestão (D-006) |
| `pacotes` (tabela existe) | ✅ Parcial | ⚠️ — falta `pacotes_cliente` (D-012) |
| Múltiplos métodos no fechamento | ✅ ComandaViewDrawer | ✅ — alinha com D-007 |

### 9.2 Gaps Identificados (Requer Implementação)

| # | Gap | Épico | Prioridade |
|---|-----|-------|-----------|
| G-001 | `fechamentos_caixa` não existe | ÉPICO 4 | Alta |
| G-002 | `pacotes_cliente` não existe (só `pacotes`) | ÉPICO 3 | Alta |
| G-003 | `comandas` sem campos de desconto auditado | ÉPICO 2 | Média |
| G-004 | `clientes` sem `cadastro_completo` / `origem_cadastro` | ÉPICO 5 | Média |
| G-005 | API n8n sem idempotência formal (webhook_log) | ÉPICO 1 | Média |
| G-006 | UI para fechar caixa não existe | ÉPICO 4 | Alta |
| G-007 | Painel de cadastros pendentes não existe | ÉPICO 5 | Média |
| G-008 | Alerta de pacote ativo na abertura de comanda | ÉPICO 3 | Média |
| G-009 | Comissão editável no fechamento (UI) — hoje é calculada automaticamente | ÉPICO 2 | Alta |

---

## 10. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| 0 agendamentos sobrepostos por profissional | Crítico |
| 100% das comandas fechadas com pagamento registrado | Crítico |
| 0 comandas editadas após fechamento de caixa | Crítico |
| Pacotes com sessões negativas = 0 | Crítico |
| Tempo de criação de agendamento via n8n < 3s | Performance |
| Clientes com `cadastro_completo = false` no dia = alertados | Operacional |

---

_Próximo passo: dividir os gaps G-001 a G-009 em tasks atômicas e verificar compatibilidade com o TASKS.md existente._
