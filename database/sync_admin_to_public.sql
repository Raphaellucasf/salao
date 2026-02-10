-- =====================================================
-- SINCRONIZAR USUÁRIO ADMIN PARA PUBLIC.USERS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: Inserir o usuário admin@otimiza.com em public.users
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

-- PASSO 2: Verificar se o usuário foi criado corretamente
SELECT 
  u.id,
  u.email,
  u.role,
  u.full_name,
  au.raw_user_meta_data->>'role' as auth_role
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@otimiza.com';

-- PASSO 3: Verificar se o trigger existe (deve retornar 1 linha)
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- RESULTADO ESPERADO:
-- - public.users deve ter o registro com role='admin'
-- - Trigger deve existir para futuros usuários
-- =====================================================

-- PASSO 4 (OPCIONAL): Recriar o trigger se não existir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  'auth.users' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'admin') as admins
FROM auth.users
UNION ALL
SELECT 
  'public.users' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE role = 'admin') as admins
FROM public.users;

-- ⚠️ IMPORTANTE: 
-- Faça logout e login com: admin@otimiza.com / admin123
-- =====================================================
