# 🔐 Guia de Teste - Sistema de Autenticação RBAC

## ✅ Checklist de Implementação Completa

O sistema de autenticação com controle de acesso baseado em roles (RBAC) está **100% implementado** com os seguintes componentes:

### 📋 Arquivos Criados/Atualizados

1. ✅ `database/migration_auth.sql` - Migração SQL completa
2. ✅ `src/middleware.ts` - Proteção de rotas no servidor
3. ✅ `src/contexts/AuthContext.tsx` - Gerenciamento de estado de autenticação
4. ✅ `src/app/layout.tsx` - AuthProvider global
5. ✅ `src/app/login/page.tsx` - Página de login
6. ✅ `src/components/auth/ProtectedRoute.tsx` - Wrapper de proteção
7. ✅ `src/app/admin/layout.tsx` - Layout protegido (admin only)
8. ✅ `src/app/profissionais/layout.tsx` - Layout protegido (professional + admin)
9. ✅ `src/components/layout/AdminSidebar.tsx` - Sidebar com RBAC
10. ✅ `src/app/admin/page.tsx` - Dashboard integrado com auth

---

## 🚀 Passo a Passo para Testes

### 1️⃣ Configurar Supabase (15 minutos)

#### a) Criar Projeto
1. Acesse https://supabase.com
2. Clique em "New Project"
3. Preencha:
   - Name: `otimiza-beauty-manager`
   - Database Password: (escolha uma senha forte)
   - Region: `South America (São Paulo)`
4. Aguarde criação (~2 min)

#### b) Executar Schema Principal
1. No painel Supabase, vá em **SQL Editor**
2. Clique em "+ New Query"
3. Abra o arquivo `database/schema.sql` deste projeto
4. Cole todo o conteúdo no editor SQL
5. Clique em "Run" (ou Ctrl+Enter)
6. ✅ Aguarde confirmação de sucesso

#### c) Executar Migração de Autenticação
1. Ainda no SQL Editor, clique em "+ New Query"
2. Abra o arquivo `database/migration_auth.sql`
3. Cole todo o conteúdo
4. Clique em "Run"
5. ✅ Confirme que todos os comandos foram executados

#### d) Atualizar Variáveis de Ambiente
1. No Supabase, vá em **Settings** > **API**
2. Copie:
   - Project URL
   - anon public key
3. Abra `.env.local` no projeto
4. Atualize:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

---

### 2️⃣ Criar Usuário Admin (Sr. Dimas)

#### Opção A: Via SQL (Recomendado)
1. No SQL Editor do Supabase, execute:
```sql
-- 1. Criar usuário no Supabase Auth (substitua a senha)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dimas@salaodimas.com',
  crypt('senha_forte_123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dimas Silva"}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- 2. A trigger handle_new_user() automaticamente criará o registro em public.users
-- Agora apenas atualize a role para 'admin'
UPDATE public.users 
SET role = 'admin', unit_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'dimas@salaodimas.com';
```

#### Opção B: Via Interface (Mais Simples)
1. Vá em **Authentication** > **Users**
2. Clique em "Add User" > "Create new user"
3. Preencha:
   - Email: `dimas@salaodimas.com`
   - Password: `senha_forte_123` (escolha uma forte)
   - Auto Confirm User: ✅ (marque)
4. Clique em "Create User"
5. ✅ Aguarde criação

**Depois, atualize a role:**
1. Vá em **Table Editor** > Tabela `users`
2. Encontre o usuário com email `dimas@salaodimas.com`
3. Edite a linha:
   - `role`: `admin`
   - `unit_id`: `11111111-1111-1111-1111-111111111111`
4. Salve

---

### 3️⃣ Criar Usuário Profissional (Teste)

1. No **Authentication** > **Users**, clique em "Add User"
2. Preencha:
   - Email: `joao@salaodimas.com`
   - Password: `senha123`
   - Auto Confirm User: ✅
3. Criar usuário

**Atualizar role:**
1. No **Table Editor** > `users`
2. Edite o usuário `joao@salaodimas.com`:
   - `role`: `professional`
   - `full_name`: `João Silva`
   - `unit_id`: `11111111-1111-1111-1111-111111111111`

**Criar registro de profissional:**
1. Vá na tabela `professionals`
2. Clique em "Insert" > "Insert Row"
3. Preencha:
   - `user_id`: (copie o ID do usuário João da tabela users)
   - `unit_id`: `11111111-1111-1111-1111-111111111111`
   - `name`: `João Silva`
   - `specialties`: `["Corte Masculino", "Barba"]`
   - `commission_percentage`: `60`
   - `is_active`: ✅ true
4. Salve

---

### 4️⃣ Iniciar Aplicação e Testar

```bash
# Instalar dependências (se ainda não fez)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## 🧪 Cenários de Teste

### ✅ Teste 1: Login como Admin
1. Acesse http://localhost:3000/login
2. Faça login com:
   - Email: `dimas@salaodimas.com`
   - Senha: (a que você definiu)
3. **Resultado esperado:**
   - ✅ Redirecionado para `/admin`
   - ✅ Vê dashboard completo
   - ✅ Sidebar mostra TODOS os menus:
     - Dashboard
     - Agendamentos
     - Clientes
     - **Financeiro** ← deve aparecer
     - **Relatórios** ← deve aparecer
     - **Estoque** ← deve aparecer
     - **Configurações** ← deve aparecer

### ✅ Teste 2: Login como Profissional
1. Faça logout (botão "Sair" no topo)
2. Faça login com:
   - Email: `joao@salaodimas.com`
   - Senha: `senha123`
3. **Resultado esperado:**
   - ✅ Redirecionado para `/profissionais`
   - ✅ Sidebar mostra APENAS:
     - Dashboard
     - Agendamentos
     - Clientes
   - ❌ **NÃO deve mostrar:**
     - Financeiro
     - Relatórios
     - Estoque
     - Configurações

### ✅ Teste 3: Proteção de Rotas (Professional)
**Enquanto logado como profissional (`joao@salaodimas.com`):**

1. Tente acessar manualmente: http://localhost:3000/admin/financeiro
   - **Esperado:** Redirecionado para `/profissionais`

2. Tente acessar: http://localhost:3000/admin/configuracoes
   - **Esperado:** Redirecionado para `/profissionais`

3. Pode acessar: http://localhost:3000/admin/agendamentos
   - **Esperado:** Acesso permitido ✅

### ✅ Teste 4: Proteção de Rotas (Admin)
**Enquanto logado como admin (`dimas@salaodimas.com`):**

1. Pode acessar: http://localhost:3000/admin/financeiro
   - **Esperado:** Acesso permitido ✅

2. Pode acessar: http://localhost:3000/profissionais
   - **Esperado:** Acesso permitido ✅

### ✅ Teste 5: Rotas Públicas (Sem Login)
1. Faça logout
2. Acesse: http://localhost:3000
   - **Esperado:** Landing page pública ✅

3. Acesse: http://localhost:3000/agendar
   - **Esperado:** Sistema de agendamento público ✅

4. Tente acessar: http://localhost:3000/admin
   - **Esperado:** Redirecionado para `/login`

---

## 🔒 Regras de Segurança Implementadas

### Camada 1: Banco de Dados (RLS)
- ✅ Políticas de Row Level Security implementadas
- ✅ Profissionais não conseguem consultar transações financeiras via SQL
- ✅ Apenas admins podem ver receitas/despesas
- ✅ Helper functions: `is_admin()`, `is_professional()`, `get_user_role()`

### Camada 2: Servidor (Middleware)
- ✅ Next.js middleware valida sessão ANTES de renderizar página
- ✅ Redireciona não autenticados para `/login`
- ✅ Redireciona profissionais que tentam acessar `/admin` para `/profissionais`
- ✅ Permite que admins acessem tudo

### Camada 3: Cliente (UI)
- ✅ AuthContext gerencia estado de autenticação globalmente
- ✅ ProtectedRoute valida permissões antes de renderizar
- ✅ AdminSidebar filtra menus baseado na role
- ✅ Componentes verificam `isAdmin` antes de exibir recursos sensíveis

---

## 🐛 Troubleshooting

### Problema: "Invalid login credentials"
**Causa:** Email ou senha incorretos
**Solução:** 
1. Verifique se o usuário foi criado no Supabase Auth
2. Confirme que `email_confirmed_at` não é null
3. Tente resetar a senha via SQL:
```sql
UPDATE auth.users 
SET encrypted_password = crypt('nova_senha', gen_salt('bf'))
WHERE email = 'seu_email@exemplo.com';
```

### Problema: Usuário loga mas não redireciona
**Causa:** Registro não existe em `public.users`
**Solução:**
1. Verifique no Table Editor se há registro em `users` com o email
2. Se não houver, a trigger não funcionou. Execute manualmente:
```sql
INSERT INTO public.users (id, email, full_name, role, unit_id)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  'professional',
  '11111111-1111-1111-1111-111111111111'
FROM auth.users 
WHERE email = 'email_problema@exemplo.com'
ON CONFLICT (id) DO NOTHING;
```

### Problema: Profissional consegue ver menu Financeiro
**Causa:** Role não está definida corretamente
**Solução:**
1. Verifique no Table Editor > `users` se `role` = `'professional'`
2. Faça logout e login novamente
3. Verifique no console do navegador (F12) se `useAuth()` retorna role corretamente

### Problema: Erros de TypeScript
**Causa:** Tipos do Supabase ainda não gerados
**Solução:**
```bash
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/supabase.ts
```
Depois atualize `src/lib/supabase.ts` para usar os tipos gerados.

---

## 📊 Verificação Final

Use este checklist para confirmar que tudo está funcionando:

- [ ] Supabase projeto criado e configurado
- [ ] Schema SQL executado com sucesso
- [ ] Migration Auth executada com sucesso
- [ ] Usuário admin criado (dimas@salaodimas.com)
- [ ] Usuário professional criado (joao@salaodimas.com)
- [ ] Login como admin redireciona para `/admin`
- [ ] Login como professional redireciona para `/profissionais`
- [ ] Admin vê todos os menus do sidebar
- [ ] Professional NÃO vê menus: Financeiro, Relatórios, Estoque, Configurações
- [ ] Professional não consegue acessar `/admin/financeiro` (é redirecionado)
- [ ] Logout funciona corretamente
- [ ] Rotas públicas (`/`, `/agendar`) acessíveis sem login

---

## 🎯 Próximos Passos

Após validar que a autenticação está funcionando:

1. **Implementar páginas CRUD:**
   - `/admin/agendamentos` (listar, criar, editar, cancelar)
   - `/admin/clientes` (listar, criar, editar)
   - `/admin/financeiro` (dashboard financeiro com filtros)
   - `/admin/relatorios` (relatórios com gráficos)

2. **Implementar área do profissional:**
   - `/profissionais` (dashboard com agenda do dia)
   - `/profissionais/agenda` (calendário semanal)
   - `/profissionais/comissoes` (visualizar comissões)

3. **Adicionar funcionalidades:**
   - Upload de imagens (Supabase Storage)
   - Notificações em tempo real (Supabase Realtime)
   - PWA para profissionais (Service Worker)
   - Análise com IA (integração futura)

---

## 📞 Suporte

Se encontrar qualquer problema durante os testes, verifique:

1. **Console do navegador (F12)** - erros de JavaScript
2. **Network tab** - requisições falhando
3. **Supabase Logs** - erros no banco de dados
4. **Terminal do Next.js** - erros de servidor

**Dica:** Use `console.log(useAuth())` em qualquer componente para ver o estado atual de autenticação.

---

✅ **Sistema de Autenticação RBAC Completo e Pronto para Testes!**
