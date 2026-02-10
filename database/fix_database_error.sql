-- =====================================================
-- CORRIGIR ERRO "Database error querying schema"
-- =====================================================

-- PASSO 1: Verificar se public.users existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) as tabela_existe;

-- PASSO 2: Se existir, inserir o usuário admin em public.users
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Super Admin') as full_name,
  'admin' as role,
  created_at
FROM auth.users
WHERE email = 'admin@otimiza.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = EXCLUDED.full_name;

-- PASSO 3: DESABILITAR RLS para desenvolvimento (IMPORTANTE!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- PASSO 4: Verificar se funcionou
SELECT 
  u.id,
  u.email,
  u.role,
  u.full_name,
  au.raw_user_meta_data->>'role' as auth_role
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@otimiza.com';

-- PASSO 5: Se a tabela NÃO existir, criar agora
-- Descomente as linhas abaixo SE o PASSO 1 retornar "false"

-- CREATE TABLE public.users (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   full_name VARCHAR(255) NOT NULL,
--   phone VARCHAR(20),
--   role VARCHAR(20) CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
--   avatar_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Desabilitar RLS
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- -- Inserir admin novamente
-- INSERT INTO public.users (id, email, full_name, role, created_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'full_name', 'Super Admin') as full_name,
--   'admin' as role,
--   created_at
-- FROM auth.users
-- WHERE email = 'admin@otimiza.com';

-- =====================================================
-- AGORA TENTE FAZER LOGIN COM:
-- Email: admin@otimiza.com
-- Senha: admin123
-- =====================================================
