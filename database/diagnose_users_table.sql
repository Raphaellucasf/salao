-- =====================================================
-- DIAGNOSTICAR ESTRUTURA DA TABELA PUBLIC.USERS
-- Execute este script para ver o problema
-- =====================================================

-- PASSO 1: Ver quais colunas existem na tabela public.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- PASSO 2: Ver os dados atuais
SELECT * FROM public.users;

-- PASSO 3: Verificar RLS (Row Level Security)
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- PASSO 4: Ver políticas RLS que podem estar bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- =====================================================
-- SOLUÇÃO: Se a tabela não existir ou estiver errada,
-- execute o script abaixo para recriar corretamente
-- =====================================================

-- DROP TABLE IF EXISTS public.users CASCADE;

-- CREATE TABLE public.users (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   full_name VARCHAR(255) NOT NULL,
--   phone VARCHAR(20),
--   role VARCHAR(20) CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
--   avatar_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Inserir usuário admin novamente
-- INSERT INTO public.users (id, email, full_name, role, created_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'full_name', 'Super Admin') as full_name,
--   'admin' as role,
--   created_at
-- FROM auth.users
-- WHERE email = 'admin@otimiza.com';

-- -- Desabilitar RLS temporariamente para desenvolvimento
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
