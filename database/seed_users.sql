-- ============================================
-- SCRIPT DE SEED - USUÁRIOS DE TESTE
-- Execute este script no SQL Editor do Supabase
-- APÓS ter executado schema.sql e migration_auth.sql
-- ============================================

-- ============================================
-- 1. CRIAR USUÁRIO ADMIN (Sr. Dimas)
-- ============================================

-- Limpar usuário existente se houver (apenas para testes)
DELETE FROM auth.users WHERE email = 'dimas@salaodimas.com';

-- Criar usuário no sistema de autenticação
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
  crypt('Dimas@2024', gen_salt('bf')), -- Senha: Dimas@2024
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

-- Aguardar a trigger criar o registro em public.users, então atualizar role
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar ID do usuário recém-criado
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dimas@salaodimas.com';
  
  -- Aguardar 1 segundo para garantir que trigger executou
  PERFORM pg_sleep(1);
  
  -- Atualizar role para admin
  UPDATE public.users 
  SET role = 'admin',
      unit_id = '11111111-1111-1111-1111-111111111111',
      full_name = 'Dimas Silva'
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Usuário ADMIN criado: dimas@salaodimas.com | Senha: Dimas@2024';
END $$;

-- ============================================
-- 2. CRIAR USUÁRIO PROFISSIONAL (João)
-- ============================================

-- Limpar usuário existente se houver
DELETE FROM auth.users WHERE email = 'joao@salaodimas.com';

-- Criar usuário profissional
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
  'joao@salaodimas.com',
  crypt('Joao@2024', gen_salt('bf')), -- Senha: Joao@2024
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"João Silva"}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Atualizar role e criar registro de profissional
DO $$
DECLARE
  v_user_id UUID;
  v_unit_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'joao@salaodimas.com';
  
  -- Aguardar trigger
  PERFORM pg_sleep(1);
  
  -- Atualizar role
  UPDATE public.users 
  SET role = 'professional',
      unit_id = v_unit_id,
      full_name = 'João Silva'
  WHERE id = v_user_id;
  
  -- Criar registro na tabela professionals
  INSERT INTO professionals (
    user_id,
    unit_id,
    name,
    specialties,
    commission_percentage,
    is_active
  ) VALUES (
    v_user_id,
    v_unit_id,
    'João Silva',
    ARRAY['Corte Masculino', 'Barba', 'Corte Social'],
    60.00,
    true
  );
  
  RAISE NOTICE '✅ Usuário PROFISSIONAL criado: joao@salaodimas.com | Senha: Joao@2024';
END $$;

-- ============================================
-- 3. CRIAR SEGUNDO PROFISSIONAL (Ana)
-- ============================================

-- Limpar usuário existente se houver
DELETE FROM auth.users WHERE email = 'ana@salaodimas.com';

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
  'ana@salaodimas.com',
  crypt('Ana@2024', gen_salt('bf')), -- Senha: Ana@2024
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ana Costa"}',
  FALSE,
  '',
  '',
  '',
  ''
);

DO $$
DECLARE
  v_user_id UUID;
  v_unit_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ana@salaodimas.com';
  PERFORM pg_sleep(1);
  
  UPDATE public.users 
  SET role = 'professional',
      unit_id = v_unit_id,
      full_name = 'Ana Costa'
  WHERE id = v_user_id;
  
  INSERT INTO professionals (
    user_id,
    unit_id,
    name,
    specialties,
    commission_percentage,
    is_active
  ) VALUES (
    v_user_id,
    v_unit_id,
    'Ana Costa',
    ARRAY['Corte Feminino', 'Coloração', 'Escova Progressiva', 'Manicure'],
    65.00,
    true
  );
  
  RAISE NOTICE '✅ Usuário PROFISSIONAL criado: ana@salaodimas.com | Senha: Ana@2024';
END $$;

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Verificar usuários criados
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmado,
  pu.role,
  pu.full_name,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Sim'
    ELSE '❌ Não'
  END as tem_perfil_profissional
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
LEFT JOIN professionals p ON u.id = p.user_id
WHERE u.email IN ('dimas@salaodimas.com', 'joao@salaodimas.com', 'ana@salaodimas.com')
ORDER BY pu.role DESC, u.email;

-- ============================================
-- CREDENCIAIS DE ACESSO
-- ============================================
-- 
-- ADMIN:
-- Email: dimas@salaodimas.com
-- Senha: Dimas@2024
--
-- PROFISSIONAL 1:
-- Email: joao@salaodimas.com
-- Senha: Joao@2024
--
-- PROFISSIONAL 2:
-- Email: ana@salaodimas.com
-- Senha: Ana@2024
-- ============================================

-- Mostrar credenciais
SELECT '🎉 Usuários criados com sucesso!' as status;
SELECT '👤 ADMIN: dimas@salaodimas.com | Senha: Dimas@2024' as credenciais
UNION ALL
SELECT '👤 PROFISSIONAL: joao@salaodimas.com | Senha: Joao@2024'
UNION ALL
SELECT '👤 PROFISSIONAL: ana@salaodimas.com | Senha: Ana@2024';
