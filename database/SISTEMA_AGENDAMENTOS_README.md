# 📅 Sistema de Agendamentos - Otimiza Beauty

## 📋 Visão Geral

Sistema completo de agendamentos integrado com comandas, que:
- ✅ Calcula automaticamente a duração total dos serviços
- ✅ Bloqueia agenda do profissional responsável
- ✅ Bloqueia agenda do auxiliar (se houver)
- ✅ Verifica conflitos de horário
- ✅ Criação automática ao salvar comanda com data/hora

## 🗂️ Arquivos Criados

1. **`agendamentos_schema.sql`** - Estrutura da tabela de agendamentos e funções
2. **`comandas_to_agendamentos.sql`** - Integração comandas → agendamentos
3. **`SETUP_AGENDAMENTOS_COMPLETO.sql`** - **Script principal (EXECUTE ESTE!)**
4. **`FIX_PROFISSIONAIS_DROPDOWN.sql`** - Correção do campo `é_auxiliar`

## 🚀 Como Instalar

### Passo 1: Execute o Script Principal no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo de **`SETUP_AGENDAMENTOS_COMPLETO.sql`**
6. Clique em **Run** (ou Ctrl+Enter)

### Passo 2: Verificar a Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agendamentos', 'comandas', 'profissionais', 'servicos');

-- Verificar profissionais
SELECT nome, é_auxiliar, cor_agenda, ativo 
FROM profissionais;

-- Verificar serviços com duração
SELECT codigo, nome, duracao, ativo 
FROM servicos 
WHERE ativo = true 
LIMIT 5;
```

## 📊 Estrutura de Dados

### Tabela `agendamentos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `comanda_id` | BIGINT | Referência à comanda |
| `cliente_id` | BIGINT | Referência ao cliente |
| `profissional_id` | UUID | Profissional responsável |
| `auxiliar_id` | UUID | Auxiliar (opcional) |
| `data_agendamento` | DATE | Data do atendimento |
| `hora_inicio` | TIME | Hora de início |
| `hora_fim` | TIME | Hora de término (calculado) |
| `duracao_total` | INTEGER | Duração em minutos |
| `status` | VARCHAR(20) | agendado, confirmado, em_andamento, concluido, cancelado, faltou |
| `servicos` | JSONB | Array com detalhes dos serviços |
| `valor_total` | DECIMAL | Valor total do agendamento |

### Campos Adicionados em `comandas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `data_agendamento` | DATE | Quando será o atendimento |
| `hora_inicio` | TIME | Hora que começa |
| `auxiliar_id` | UUID | Profissional auxiliar |

### Campo Adicionado em `profissionais`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `é_auxiliar` | BOOLEAN | Se pode atuar como auxiliar |
| `cor_agenda` | VARCHAR(7) | Cor HEX para visualização |

## 🔧 Como Funciona

### 1. Cálculo Automático de Duração

Quando uma comanda tem serviços, o sistema:
1. Busca a duração de cada serviço
2. Multiplica pela quantidade
3. Soma tudo

```sql
SELECT calcular_duracao_total_comanda(1);
-- Retorna: 120 (minutos)
```

### 2. Criação Automática de Agendamento

Ao salvar uma comanda com:
- ✅ `data_agendamento` preenchida
- ✅ `hora_inicio` preenchida
- ✅ `profissional_id` selecionado

O sistema **automaticamente**:
1. Calcula duração total dos serviços
2. Calcula `hora_fim` = `hora_inicio` + `duracao_total`
3. Verifica conflitos de horário
4. Cria agendamento na agenda
5. Bloqueia profissional e auxiliar

### 3. Verificação de Conflitos

Antes de criar agendamento, o sistema verifica:
- ❌ Profissional já tem outro agendamento no mesmo horário?
- ❌ Auxiliar já tem outro agendamento no mesmo horário?

```sql
SELECT verificar_conflito_horario(
  'uuid-do-profissional',
  '2026-03-10',  -- data
  '14:00',       -- hora início
  '16:00'        -- hora fim
);
-- Retorna: true (tem conflito) ou false (livre)
```

## 📝 Exemplos de Uso

### Criar Agendamento Manualmente

```sql
SELECT criar_agendamento_da_comanda(1);
-- Retorna: UUID do agendamento criado
```

### Buscar Agenda do Dia

```sql
SELECT 
  hora_inicio,
  hora_fim,
  duracao_total,
  cliente_nome,
  profissional_nome,
  auxiliar_nome,
  servicos
FROM vw_agendamentos_completos
WHERE profissional_id = 'uuid-do-profissional'
  AND data_agendamento = '2026-03-10'
ORDER BY hora_inicio;
```

### Buscar Horários Livres

```sql
-- Verificar se um horário específico está livre
SELECT verificar_conflito_horario(
  'uuid-do-profissional',
  CURRENT_DATE,
  '14:00',
  '15:30'
);

-- false = horário livre para agendar
-- true = já tem agendamento
```

### Status de Agendamento

```sql
-- Confirmar agendamento
UPDATE agendamentos 
SET status = 'confirmado', 
    confirmado_em = NOW() 
WHERE id = 'uuid-agendamento';

-- Iniciar atendimento
UPDATE agendamentos 
SET status = 'em_andamento' 
WHERE id = 'uuid-agendamento';

-- Concluir atendimento
UPDATE agendamentos 
SET status = 'concluido', 
    concluido_em = NOW() 
WHERE id = 'uuid-agendamento';

-- Cancelar
UPDATE agendamentos 
SET status = 'cancelado' 
WHERE id = 'uuid-agendamento';
```

## 🎨 Próximos Passos - Interface

### 1. Atualizar ComandaModal

Adicionar campos:
- Data do Agendamento (input date)
- Hora de Início (input time)
- Mostrar hora de término calculada
- Mostrar duração total

### 2. Criar Página de Agenda

Visualização:
- **Timeline** com horários do dia
- **Grid** por profissional
- **Cores** diferentes por profissional (`cor_agenda`)
- **Blocos** proporcionais à duração
- **Conflitos** destacados em vermelho

### 3. Drag and Drop

- Arrastar agendamento para mudar horário
- Verificação automática de conflitos
- Atualizar comanda ao mover

## 🔍 Queries Úteis

```sql
-- Agendamentos de hoje
SELECT * FROM vw_agendamentos_completos
WHERE data_agendamento = CURRENT_DATE
ORDER BY hora_inicio;

-- Agendamentos por status
SELECT status, COUNT(*) 
FROM agendamentos 
GROUP BY status;

-- Profissionais mais ocupados
SELECT 
  profissional_nome,
  COUNT(*) as total_agendamentos,
  SUM(duracao_total) as minutos_totais
FROM vw_agendamentos_completos
WHERE data_agendamento >= CURRENT_DATE - 30
GROUP BY profissional_nome
ORDER BY total_agendamentos DESC;

-- Taxa de ocupação por profissional
SELECT 
  p.nome,
  COUNT(a.id) as agendamentos,
  SUM(a.duracao_total) as minutos_trabalhados,
  ROUND(SUM(a.duracao_total) / 60.0, 1) as horas_trabalhadas
FROM profissionais p
LEFT JOIN agendamentos a ON a.profissional_id = p.id 
  AND a.data_agendamento >= CURRENT_DATE - 7
WHERE p.ativo = true
GROUP BY p.id, p.nome
ORDER BY horas_trabalhadas DESC;
```

## ⚠️ Observações Importantes

1. **Duração Padrão**: Se uma comanda não tem serviços, usa 60 minutos padrão
2. **Conflitos**: Sistema bloqueia criação se houver conflito
3. **Automático**: Agendamento é criado automaticamente ao salvar comanda
4. **Sincronização**: Use `sincronizar_comandas_existentes()` para comandas antigas

## 🐛 Troubleshooting

### Erro: "Comanda sem data/hora de agendamento"

Preencha ambos os campos na comanda antes de salvar.

### Erro: "Conflito de horário"

O profissional ou auxiliar já tem outro agendamento no mesmo horário.
Escolha outro horário ou profissional.

### Profissionais não aparecem

Execute `FIX_PROFISSIONAIS_DROPDOWN.sql` primeiro.

### Duração zerada

Verifique se os serviços têm campo `duracao` preenchido:

```sql
SELECT codigo, nome, duracao 
FROM servicos 
WHERE duracao IS NULL OR duracao = 0;

-- Corrigir
UPDATE servicos 
SET duracao = 60 
WHERE duracao IS NULL OR duracao = 0;
```

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Logs do Supabase (Database → Logs)
2. Validações no código (`created_at`, `updated_at`)
3. Constraints e foreign keys

---

**Versão**: 1.0  
**Data**: 06/03/2026  
**Sistema**: Otimiza Beauty
