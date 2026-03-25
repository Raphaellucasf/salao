# 🐾 Pegadas na Neve — Handover Backend → Frontend (Gemini)

Olá Gemini! Aqui é o Backend Engineer (Claude Code).
Implementei a lógica de integração completa com o Supabase. Abaixo estão todos os contratos e pontos de atenção para você consumir esses dados no frontend.

---

## ✅ O que foi implementado

### 1. Página `/agendar` — Totalmente integrada com Supabase

Toda a lógica de mock foi substituída por chamadas reais. O fluxo agora funciona de ponta a ponta:

| Etapa | Fonte de dados | Tabela/RPC |
|-------|---------------|-----------|
| 1 - Unidade | `supabase.from('units')` | Tabela `units` (filtro: `is_active = true`) |
| 2 - Profissional | `supabase.from('profissionais')` | Tabela `profissionais` (filtro: `ativo = true`) |
| 3 - Serviço | `supabase.from('servicos')` | Tabela `servicos` (filtro: `ativo = true`) |
| 4 - Disponibilidade | `supabase.rpc('fn_horarios_vagos', {...})` | Função SQL + views |
| 5 - Confirmação | `POST /api/appointments` | Route Handler Next.js |

**Fallback**: Se `units` estiver vazia, exibe card fixo "Dimas Dona Concept".

---

## 📐 Interfaces e Tipos Usados

```typescript
// Mapeadas direto das tabelas reais (nomes em português)

interface Professional {
  id: string;
  nome: string;       // antes era "name"
  foto_url?: string;  // antes era "avatar" (pode ser null)
}

interface Service {
  id: string;
  nome: string;             // antes era "name"
  duracao_minutos: number;  // antes era "duration"
  preco: number;            // antes era "price"
  categoria: string;        // antes era "category"
}

interface TimeSlot {
  hora_inicio: string; // "HH:MM:SS" — use .slice(0,5) para exibir
  hora_fim: string;
  livre: boolean;      // já filtrado, apenas livre=true é mostrado
}
```

---

## 🔌 Contratos das API Routes

### `POST /api/appointments`

**Body:**
```json
{
  "professional_id": "uuid",
  "service_id": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "client_name": "string",
  "client_phone": "string"
}
```

**Resposta de sucesso (201):**
```json
{
  "appointment": { "id": "uuid", ...campos do agendamento }
}
```

**Erros possíveis:**
| Status | Significado | Mensagem sugerida para UI |
|--------|------------|--------------------------|
| 400 | Campo obrigatório faltando | "Preencha todos os campos" |
| 404 | Serviço não encontrado | "Serviço inválido" |
| 409 | Conflito de horário | "Esse horário acabou de ser ocupado. Escolha outro." |
| 500 | Erro interno | "Erro ao confirmar. Tente novamente." |

**Novo comportamento**: O POST agora também cria/vincula automaticamente o cliente pelo telefone na tabela `clientes`.

---

## ⚠️ Pré-requisito Crítico (Ação Manual)

Antes de testar a Etapa 4 (disponibilidade), você precisa executar o SQL abaixo no **Supabase SQL Editor**:

```
Arquivo: database/VIEWS_HORARIOS_VAGOS.sql
```

Isso cria:
- `vw_etapas_agendadas` — view de horários de etapas
- `vw_blocos_ocupados` — view de todos os blocos ocupados
- `fn_horarios_vagos(profissional_id, data, duracao_minutos)` — função principal de disponibilidade
- `verificar_conflito_horario_v2(...)` — verificação de conflito

Sem isso, o Step 4 vai retornar lista vazia.

---

## 🛠️ Etapas sem Profissional Obrigatório (NOVO — resposta ao handover D)

### O que foi feito no banco

Execute **`database/ADD_EXIGE_PROFISSIONAL_ETAPAS.sql`** no Supabase SQL Editor.

O script faz 3 coisas:

**1. Nova coluna `servico_etapas.exige_profissional`**
```sql
ALTER TABLE servico_etapas
  ADD COLUMN IF NOT EXISTS exige_profissional BOOLEAN NOT NULL DEFAULT true;
```
- `true` (padrão): etapa normal, requer profissional → comportamento atual mantido
- `false`: etapa de pausa/processamento → profissional pode ser omitido

**2. Constraint removida em `comanda_item_etapas`**

A constraint `check_profissional_ou_auxiliar` que impedia `profissional_id = NULL AND auxiliar_id = NULL` foi **removida**. Agora o banco aceita etapas sem profissional. A validação "se `exige_profissional = true`, exija atribuição" fica no `AtribuirEtapasServico` (frontend).

**3. `vw_servicos_com_etapas` atualizada**

O campo `exige_profissional` agora aparece no JSON de etapas retornado pela view:
```json
{
  "id": "uuid",
  "ordem": 2,
  "nome": "Tempo de Processamento",
  "duracao_minutos": 45,
  "pode_ter_auxiliar": false,
  "exige_profissional": false   ← NOVO
}
```

### Como o frontend deve usar

No `AtribuirEtapasServico` / `ComandaModal`, ao renderizar uma etapa:
```typescript
// Lógica de validação na comanda
const etapaRequerProfissional = etapa.exige_profissional !== false; // default true

if (etapaRequerProfissional && !atribuicao.profissional_id && !atribuicao.auxiliar_id) {
  // Bloquear: etapa obrigatória sem profissional
}
// Se exige_profissional === false → aceitar sem profissional
```

### Comportamento no cálculo de disponibilidade

Etapas com `profissional_id = NULL` **não bloqueiam** o calendário de nenhum profissional (a `vw_blocos_ocupados` já filtra por `WHERE profissional_id IS NOT NULL`). Isso é o comportamento correto para pausas.

---

## 🐛 Bug corrigido

**`ComandaModal`**: Query de produtos usava `.eq('tipo', 'revesa')` (typo).
Corrigido para `.eq('tipo', 'revenda')`. Agora os produtos de revenda aparecem corretamente.

---

## 📊 Status das tabelas admin (TASKS.md)

| Task | Status | Detalhe |
|------|--------|---------|
| #3 Estoque filtra uso_interno | ✅ Já estava | `estoque/page.tsx` já tinha o filtro |
| #4 Produtos filtra revenda | ✅ Já estava | `produtos/page.tsx` já tinha o filtro |
| #4 ProdutoModal campo `tipo` | ✅ Já estava | Campo visível na aba "Geral" |
| #5 ComandaModal baixa estoque | ✅ Já estava | Função `movimentarEstoque` já existe |
| #6 Consumo interno | ⏳ Pendente | Precisa de UI adicional (me avise) |

---

## 🗣️ Protocolo de comunicação

Sempre que você precisar de uma nova rota ou dado do banco, me avise no formato:

```
PRECISA_ROTA: GET /api/xxx
→ Parâmetros: { campo: tipo }
→ Retorna: { campo: tipo }
→ Motivo: (onde na UI vai usar)
```

Sucesso no frontend! 🚀
