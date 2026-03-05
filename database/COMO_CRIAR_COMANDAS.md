# 🔧 RESOLVER ERRO: "Could not find the table 'public.comandas'"

## ⚠️ ÚLTIMO ERRO: "invalid input syntax for type bigint: UUID..."

Se você vê este erro, significa que a coluna `item_id` ainda está como BIGINT em vez de TEXT.

### 🚀 FIX FINAL (Execute isto AGORA no Supabase):

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** → **New Query**  
3. Copie e cole o conteúdo de **[fix_item_id_text.sql](fix_item_id_text.sql)**
4. Clique em **Run**

**O que este fix faz:**
- ✅ Converte `comanda_itens.item_id` de BIGINT para TEXT
- ✅ Remove constraint de foreign key (não precisamos)
- ✅ Permite armazenar UUIDs e BIGINTs como texto

---

## ⚠️ ERRO ANTERIOR: "new row violates row-level security policy"

Se você já executou o `comandas_schema.sql` mas viu este erro, execute o **fix_comandas_rls.sql**.

### 🚀 FIX RLS:

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** → **New Query**  
3. Copie e cole o conteúdo de **[fix_comandas_rls.sql](fix_comandas_rls.sql)**
4. Clique em **Run**

**O que este fix faz:**
- ✅ Corrige políticas RLS (permite inserções para todos usuários autenticados)
- ✅ Cria trigger para gerar `numero_comanda` automaticamente
- ✅ Remove restrições `TO authenticated` que estavam bloqueando

---

## Problema Original
A tabela `comandas` não existia no banco de dados Supabase.

## ✅ Solução Completa - TIPOS CORRIGIDOS

**Tipos de dados corretos:**
- `cliente_id` → **BIGINT** (compatível com `clientes.id`)
- `profissional_id` → **UUID** (compatível com `usuarios.id`)
- `item_id` → **TEXT** (armazena IDs de serviços/produtos)

---

## 📋 ORDEM DE EXECUÇÃO DOS SCRIPTS:

**Se está começando do zero:**
1. Execute **[comandas_schema.sql](comandas_schema.sql)** - Cria as tabelas
2. Execute **[fix_comandas_rls.sql](fix_comandas_rls.sql)** - Corrige RLS
3. Execute **[fix_item_id_text.sql](fix_item_id_text.sql)** - Converte item_id para TEXT

**Se já criou as tabelas mas tem erro:**
- Erro de "table not found" → Execute `comandas_schema.sql`
- Erro de "row-level security" → Execute `fix_comandas_rls.sql`
- Erro de "invalid input syntax for type bigint" → Execute `fix_item_id_text.sql`

### Passo 1: Acessar o Supabase SQL Editor
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **otimiza-beauty**
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script
1. Clique em **New Query** (ou **+ New query**)
2. Copie todo o conteúdo do arquivo `comandas_schema.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Criação
Após executar, você deve ver a mensagem:
```
Schema de Comandas criado com sucesso!
```

### Passo 4: Confirmar no Table Editor
1. No menu lateral, clique em **Table Editor**
2. Você deve ver as novas tabelas:
   - ✅ `comandas`
   - ✅ `comanda_itens`

## O que foi criado?

### Tabela `comandas`
Armazena as comandas abertas no salão:
- `id` - Identificador único
- `numero_comanda` - Número sequencial da comanda
- `cliente_id` - Cliente vinculado (opcional)
- `cliente_nome` - Nome do cliente
- `status` - aberta, fechada, cancelada
- `data_abertura` - Data/hora de abertura
- `total` - Valor total da comanda
- `observacoes` - Observações gerais

### Tabela `comanda_itens`
Itens adicionados na comanda:
- `comanda_id` - Referência à comanda
- `tipo` - servico, produto, pacote
- `descricao` - Nome do item
- `quantidade` - Quantidade
- `valor_unitario` - Preço unitário
- `valor_total` - Total do item

### Recursos Adicionais
- ✅ Índices para performance
- ✅ RLS (Row Level Security) habilitado
- ✅ Políticas de acesso para usuários autenticados
- ✅ Função para gerar número sequencial de comanda
- ✅ Trigger para atualizar `updated_at` automaticamente

## Após Executar
Volte ao sistema e tente abrir uma nova comanda - deve funcionar perfeitamente! 🎉
