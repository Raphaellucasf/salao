# 🗄️ Database - Arquivos SQL

## ⚠️ ATENÇÃO - Segurança

Os arquivos SQL desta pasta contêm scripts de migração e dados sensíveis do banco de dados. 

**Por segurança, estes arquivos NÃO são versionados no Git.**

## 📋 Arquivos da Pasta

### Schemas
- `schema.sql` - Schema principal do banco de dados
- `dimas_schema.sql` - Schema específico do sistema Dimas
- `*_schema.sql` - Outros schemas de tabelas específicas

### Migrations
- `*_migration.sql` - Scripts de migração de banco de dados
- `APPLY_ALL_TABLES.sql` - Script para aplicar todas as tabelas

### Seeds e Fixes
- `seed*.sql` - Dados iniciais para popular o banco
- `create_*.sql` - Scripts de criação de usuários/dados
- `fix_*.sql` - Scripts de correção de problemas
- `insert_*.sql` - Scripts de inserção de dados
- `update_*.sql` - Scripts de atualização

## 🔐 Como Configurar o Banco de Dados

### 1. Acesse seu Supabase
Vá para [https://app.supabase.com](https://app.supabase.com)

### 2. Execute os Scripts na Ordem
Execute os scripts SQL diretamente no SQL Editor do Supabase:

1. **Schema Principal**
   ```sql
   -- Execute primeiro: schema.sql
   ```

2. **Schemas Específicos**
   ```sql
   -- Execute: dimas_schema.sql e outros schemas
   ```

3. **Migrations**
   ```sql
   -- Execute as migrations necessárias
   ```

4. **Seeds (Opcional)**
   ```sql
   -- Execute os seeds para dados de teste
   ```

## 🚀 Setup Rápido

Para novos desenvolvedores:

1. Clone o repositório
2. Copie `.env.example` para `.env.local`
3. Preencha com suas credenciais do Supabase
4. Acesse o SQL Editor do Supabase
5. Execute os scripts SQL necessários
6. Rode `npm install` e `npm run dev`

## 📞 Suporte

Em caso de dúvidas sobre a estrutura do banco, consulte a documentação principal do projeto.

---

**Nota**: Mantenha sempre seus dados de produção seguros e nunca compartilhe credenciais publicamente.
