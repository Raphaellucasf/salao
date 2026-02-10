-- =============================================
-- INSERIR ADMIN LUCAS NA TABELA USERS
-- UUID do Supabase Auth: 9669659a-fe42-4990-ad31-a0f69a1e457c
-- =============================================

-- 1. Dropar políticas existentes
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Anyone can read units" ON units;

-- 2. Dropar tabelas existentes (se necessário recriar)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- 3. Criar tabela units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir a unidade
INSERT INTO units (id, name, address, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Dimas Dona Concept',
  'Rua São Paulo, 123 - Centro, Birigui/SP',
  '(18) 99999-9999'
);

-- 5. Criar tabela users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
  unit_id UUID REFERENCES units(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir o usuário admin
INSERT INTO users (
  id,
  email,
  full_name,
  phone,
  role,
  unit_id,
  is_active
) VALUES (
  '9669659a-fe42-4990-ad31-a0f69a1e457c',
  'lucasraphael.lr@gmail.com',
  'Admin Lucas',
  '(18) 99999-9999',
  'admin',
  '00000000-0000-0000-0000-000000000001',
  true
);

-- 7. Ativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de acesso
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone can read units" ON units
  FOR SELECT USING (true);

-- 9. Verificar se foi inserido
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  is_active 
FROM users 
WHERE email = 'lucasraphael.lr@gmail.com';
