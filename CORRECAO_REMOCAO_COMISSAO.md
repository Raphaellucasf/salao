# 🔧 Correção: Remoção de Campos de Comissão

## 📋 Problema Identificado

Ao tentar editar um serviço, o sistema exibia o erro:
```
Could not find the 'comissao' column of 'servicos' in the schema cache
```

## 🔍 Causa

Durante a simplificação do sistema de etapas, removemos os campos de comissão do banco de dados, mas o código frontend ainda fazia referência a esses campos.

## ✅ Correções Aplicadas

### 1. **ServicoModal.tsx** (Modal de Criação/Edição)
- ❌ Removido estado `comissao`
- ❌ Removido cálculo `valoresCalculados` (comissão profissional/valor salão)
- ❌ Removido campo de input "Comissão (%)"
- ❌ Removido preview de valores calculados
- ❌ Removido `useMemo` não utilizado
- ✅ Adicionado seletor de "Grupo do Serviço" (estava faltando)

### 2. **servicos-new/page.tsx** (Listagem Nova)
- ❌ Removida coluna "Comissão" do cabeçalho da tabela
- ❌ Removida célula que exibia comissão percentual/fixa

### 3. **servicos/page.tsx** (Listagem Antiga)
- ❌ Removidas divs de exibição de comissão (% e valor)
- ❌ Removido import `TrendingUp` não utilizado

### 4. **Banco de Dados**
- 📄 Criado script: `database/remover_comissao_servicos.sql`
- Remove colunas:
  - `comissao`
  - `comissao_tipo`
  - `comissao_percentual`
  - `comissao_valor`
  - `comissao_profissional`
  - `comissao_valor_fixo`

## 🎯 Foco Atual do Sistema

O sistema agora foca apenas em:
- ⏱️ **Duração** dos serviços
- 👥 **Profissionais/Auxiliares** por etapa
- 📊 **Organização** em etapas

**Não gerenciamos mais:**
- ❌ Comissões por serviço
- ❌ Divisão de valores entre profissional e salão
- ❌ Cálculos financeiros de split

## 📝 Próximos Passos

1. ✅ Código frontend atualizado
2. ⚠️ **EXECUTAR NO SUPABASE**: `database/remover_comissao_servicos.sql`
3. ⚠️ **EXECUTAR NO SUPABASE**: `database/SETUP_SISTEMA_ETAPAS.sql`
4. ⚠️ Testar criação/edição de serviços
5. ⚠️ Testar serviços com etapas

## 🗂️ Arquivos Modificados

```
src/
  components/
    modals/
      ✏️ ServicoModal.tsx (simplificado)
  app/
    admin/
      servicos/
        ✏️ page.tsx (removida exibição de comissão)
      servicos-new/
        ✏️ page.tsx (removida coluna de comissão)

database/
  ➕ remover_comissao_servicos.sql (novo)
```

## 🎨 Interface Atualizada

### Antes:
- ❌ Código
- ❌ Nome
- ❌ Categoria
- ❌ Duração e Preço
- ❌ **Comissão (%)** ← campo removido
- ❌ Descrição
- ❌ Etapas

### Depois:
- ✅ Código
- ✅ Nome  
- ✅ Categoria
- ✅ **Grupo do Serviço** ← campo adicionado
- ✅ Duração e Preço
- ✅ Descrição
- ✅ Etapas

## 🔐 Validações Mantidas

- ✅ Nome obrigatório
- ✅ Preço obrigatório
- ✅ **Grupo obrigatório** (agora com UI funcional)
- ✅ Duração obrigatória (ou calculada por etapas)

## 💡 Observações

- O sistema de **comissões por profissional** permanece intacto
- Comissões são gerenciadas na tabela `profissionais`, não em `servicos`
- A remoção refere-se apenas à comissão **por serviço**
