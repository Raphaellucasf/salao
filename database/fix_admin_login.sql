-- =====================================================
-- VERIFICAR E CORRIGIR LOGIN DO USUÁRIO ADMIN
-- =====================================================

-- PASSO 1: Verificar se o usuário existe e está confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  encrypted_password,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@otimiza.com';

-- PASSO 2: Se email_confirmed_at estiver NULL, confirmar o email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@otimiza.com' 
  AND email_confirmed_at IS NULL;

-- PASSO 3: Verificar identities
SELECT * FROM auth.identities
WHERE email = 'admin@otimiza.com';

-- PASSO 4: Se a senha não funcionar, resetar para uma nova
-- Descomente as linhas abaixo para resetar a senha para "admin123"

-- UPDATE auth.users
-- SET encrypted_password = crypt('admin123', gen_salt('bf'))
-- WHERE email = 'admin@otimiza.com';

-- PASSO 5: Verificar novamente
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@otimiza.com';

-- =====================================================
-- Se ainda não funcionar, DELETAR e recriar:
-- =====================================================

-- DELETE FROM auth.identities WHERE email = 'admin@otimiza.com';
-- DELETE FROM auth.users WHERE email = 'admin@otimiza.com';

-- E depois execute create_new_admin.sql novamente
