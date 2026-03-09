# 🔧 Correção: Erro de Constraint Unique em Etapas

## 🐛 Problema Identificado

Ao tentar criar ou editar um serviço com etapas, o sistema apresentava o erro:
```
duplicate key value violates unique constraint "unique_servico_etapa_ordem"
```

## 🔍 Causa Raiz

A constraint `UNIQUE(servico_id, ordem)` estava impedindo a inserção de novas etapas porque:
1. O código tentava desativar etapas antigas (`ativo = false`)
2. Depois tentava inserir novas etapas com as mesmas ordens
3. A constraint verificava apenas `(servico_id, ordem)`, **SEM considerar o campo `ativo`**
4. Resultado: violação de constraint mesmo que as antigas estivessem inativas

## ✅ Solução Implementada

### 1. **ServicoModal.tsx** - Deletar ao invés de Desativar

**Antes:**
```typescript
await supabase
  .from('servico_etapas')
  .update({ ativo: false })  // ❌ Apenas desativava
  .eq('servico_id', servicoId);
```

**Depois:**
```typescript
await supabase
  .from('servico_etapas')
  .delete()  // ✅ Deleta completamente
  .eq('servico_id', servicoId);
```

### 2. **SETUP_SISTEMA_ETAPAS.sql** - Constraint Parcial

**Antes:**
```sql
CONSTRAINT unique_servico_etapa_ordem UNIQUE(servico_id, ordem)
```

**Depois:**
```sql
-- Removeu constraint da tabela
-- Adicionou índice único parcial
CREATE UNIQUE INDEX unique_servico_etapa_ordem_ativa 
ON servico_etapas(servico_id, ordem) 
WHERE ativo = true;  -- ✅ Apenas para etapas ativas
```

### 3. **fix_constraint_servico_etapas.sql** - Script de Correção

Criado script para corrigir bancos que já foram criados:
```sql
-- Remove constraint antiga
ALTER TABLE servico_etapas 
DROP CONSTRAINT IF EXISTS unique_servico_etapa_ordem;

-- Adiciona índice parcial novo
CREATE UNIQUE INDEX unique_servico_etapa_ordem_ativa 
ON servico_etapas(servico_id, ordem) 
WHERE ativo = true;
```

## 📋 Checklist de Execução

**IMPORTANTE**: Execute os scripts nesta ordem:

1. ✅ **Código atualizado** - [ServicoModal.tsx](../src/components/modals/ServicoModal.tsx)
2. ⚠️ **Execute no Supabase**: [fix_constraint_servico_etapas.sql](fix_constraint_servico_etapas.sql)
3. ⚠️ **Execute no Supabase**: [remover_comissao_servicos.sql](remover_comissao_servicos.sql)
4. ⚠️ **Execute no Supabase**: [SETUP_SISTEMA_ETAPAS.sql](SETUP_SISTEMA_ETAPAS.sql)

## 🎯 Benefícios da Solução

✅ **Delete ao invés de Update**: Mais simples e direto
✅ **Constraint Parcial**: Permite histórico de etapas inativas sem conflitos
✅ **Performance**: Índice otimizado apenas para etapas ativas
✅ **Flexibilidade**: Pode implementar soft-delete no futuro se necessário

## 🧪 Como Testar

1. Abra `localhost:3000/admin/servicos-new`
2. Crie um serviço com 2 etapas
3. Salve o serviço
4. Edite o mesmo serviço
5. Adicione mais uma etapa (total 3)
6. Salve novamente
7. ✅ Não deve dar mais erro de constraint

## 📝 Observações Técnicas

- **PostgreSQL Partial Index**: Índices parciais são uma feature do PostgreSQL que permite criar índices apenas para linhas que atendem uma condição
- **Soft Delete**: Se no futuro quiser implementar soft-delete (manter histórico), a constraint parcial já está preparada
- **Performance**: Índice menor = queries mais rápidas

## 🚀 Status

- ✅ Código corrigido
- ✅ SQL atualizado
- ✅ Script de correção criado
- ⚠️ **Aguardando execução dos SQLs no Supabase**
