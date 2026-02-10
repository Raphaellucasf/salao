-- =====================================================
-- CRIAR NOVO USUÁRIO ADMIN
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: Criar usuário na tabela auth.users
-- Substitua 'admin@otimiza.com' e 'senha123' pelos valores desejados

-- Primeiro, vamos criar uma senha hash (use uma senha forte!)
-- A senha abaixo é "admin123" - MUDE DEPOIS!

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@otimiza.com', -- MUDE O EMAIL AQUI
  crypt('admin123', gen_salt('bf')), -- MUDE A SENHA AQUI
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin","full_name":"Super Admin"}', -- DEFINE ROLE COMO ADMIN
  NOW(),
  NOW(),
  '',
  ''
);

-- PASSO 2: Criar registro na tabela auth.identities
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  id::text,  -- provider_id é o mesmo que user_id para email
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@otimiza.com';

-- PASSO 3: Verificar se foi criado corretamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE email = 'admin@otimiza.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- Email: admin@otimiza.com
-- Senha: admin123
-- Role: admin
-- =====================================================

-- ⚠️ IMPORTANTE: 
-- 1. Faça login com: admin@otimiza.com / admin123
-- 2. MUDE A SENHA depois do primeiro login!
-- =====================================================
