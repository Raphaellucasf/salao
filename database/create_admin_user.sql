-- =============================================
-- CRIAR USUÁRIO ADMIN
-- =============================================
-- Execute este SQL no Supabase SQL Editor
-- https://blzargagmyjdihdkmcwg.supabase.co

-- 1. Criar o usuário admin na autenticação
-- IMPORTANTE: Execute este comando no Supabase Dashboard > Authentication > Users
-- Clique em "Add User" e preencha:
-- Email: lucasraphael.lr@gmail.com
-- Password: 000000
-- Confirme a senha e crie o usuário

-- Depois pegue o UUID do usuário criado e use no passo 2

-- 2. Inserir o profissional admin no banco (substitua o UUID pelo gerado)
-- Exemplo de como inserir após criar o usuário no Supabase Auth:

INSERT INTO public.users (
  id, -- Usar o mesmo UUID gerado pelo Supabase Auth
  email,
  full_name,
  phone,
  role,
  unit_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'UUID_AQUI', -- Substituir pelo UUID real do Supabase Auth
  'lucasraphael.lr@gmail.com',
  'Admin Lucas',
  '(18) 99999-9999',
  'admin',
  (SELECT id FROM units WHERE name = 'Dimas Dona Concept' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- 3. Inserir na tabela professionals também
INSERT INTO public.professionals (
  id,
  user_id,
  unit_id,
  name,
  specialty,
  bio,
  avatar_url,
  hourly_rate,
  commission_percentage,
  is_active,
  accepts_appointments,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'UUID_AQUI', -- Mesmo UUID do passo anterior
  (SELECT id FROM units WHERE name = 'Dimas Dona Concept' LIMIT 1),
  'Admin Lucas',
  'Administrador',
  'Administrador do sistema Dimas Dona Concept',
  'https://ui-avatars.com/api/?name=Admin+Lucas&background=d4af37&color=171717&size=200',
  0, -- Sem taxa horária
  0, -- Sem comissão
  true,
  false, -- Admin não aceita agendamentos
  NOW(),
  NOW()
);

-- =============================================
-- INSTRUÇÕES RÁPIDAS
-- =============================================
-- 1. Acesse: https://blzargagmyjdihdkmcwg.supabase.co
-- 2. Vá em Authentication > Users
-- 3. Clique "Add User"
-- 4. Preencha:
--    Email: lucasraphael.lr@gmail.com
--    Password: 000000
-- 5. Copie o UUID gerado
-- 6. Vá em SQL Editor
-- 7. Cole os INSERTs acima substituindo 'UUID_AQUI' pelo UUID copiado
-- 8. Execute
-- 9. Acesse http://localhost:3000/login
-- 10. Entre com: lucasraphael.lr@gmail.com / 000000
