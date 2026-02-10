-- =====================================================
-- ATUALIZAR USUÁRIO PARA ADMIN
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Opção 1: Se você sabe seu email, substitua abaixo
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'SEU_EMAIL_AQUI@gmail.com';

-- Opção 2: Atualizar TODOS os usuários para admin (útil para desenvolvimento)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
);

-- Verificar os usuários após a atualização
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- IMPORTANTE: Após executar, faça LOGOUT e LOGIN novamente
-- =====================================================
