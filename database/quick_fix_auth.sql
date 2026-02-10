-- =============================================
-- FIX RÁPIDO PARA AUTENTICAÇÃO FUNCIONAR
-- Execute este SQL PRIMEIRO no Supabase
-- =============================================

-- 1. Criar tabela units (necessária para foreign key)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  pix_key VARCHAR(50),
  instagram JSONB,
  image_url TEXT,
  opening_hours JSONB DEFAULT '{}',
  amenities JSONB DEFAULT '[]',
  reference_point TEXT,
  postal_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela users (essencial para login funcionar)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
  avatar_url TEXT,
  is_vip BOOLEAN DEFAULT false,
  anamnese JSONB,
  unit_id UUID REFERENCES units(id),
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir a unidade Dimas Dona Concept
INSERT INTO units (id, name, address, phone, pix_key, instagram, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Dimas Dona Concept',
  'Rua São Paulo, 123 - Centro, Birigui/SP',
  '(18) 99999-9999',
  '18999999999',
  '["@dimasdona_concept"]',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Ativar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança básicas
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read units" ON units
  FOR SELECT USING (true);

-- =============================================
-- AGORA CRIE O USUÁRIO ADMIN
-- =============================================
-- 1. Vá em Authentication > Users no Supabase
-- 2. Clique "Add User"
-- 3. Email: lucasraphael.lr@gmail.com
-- 4. Password: 000000
-- 5. Copie o UUID gerado
-- 6. Execute o SQL abaixo substituindo UUID_DO_USUARIO:

-- INSERT INTO users (
--   id,
--   email,
--   full_name,
--   phone,
--   role,
--   unit_id,
--   is_active
-- ) VALUES (
--   'UUID_DO_USUARIO', -- Cole aqui o UUID do Supabase Auth
--   'lucasraphael.lr@gmail.com',
--   'Admin Lucas',
--   '(18) 99999-9999',
--   'admin',
--   '00000000-0000-0000-0000-000000000001',
--   true
-- );
