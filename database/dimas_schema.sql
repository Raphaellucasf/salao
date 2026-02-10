-- =====================================================
-- DIMAS DONA CONCEPT - DATABASE SCHEMA
-- Sistema Otimiza Beauty Manager
-- Versão: 2.0 (Clean Luxury Edition)
-- =====================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca fuzzy

-- =====================================================
-- TABLE: units (Unidades/Salões)
-- =====================================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  pix_key VARCHAR(50),
  instagram JSONB, -- Array de handles: ["@dimasdona_concept", "@madiosbeauty"]
  image_url TEXT,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": null, "close": null, "blocked": true},
    "tuesday": {"open": "08:00", "close": "19:00", "blocked": false},
    "wednesday": {"open": "08:00", "close": "19:00", "blocked": false},
    "thursday": {"open": "08:00", "close": "19:00", "blocked": false},
    "friday": {"open": "08:00", "close": "19:00", "blocked": false},
    "saturday": {"open": "08:00", "close": "19:00", "blocked": false},
    "sunday": {"open": null, "close": null, "blocked": true}
  }'::JSONB,
  amenities JSONB DEFAULT '["Wi-Fi", "Café Bar", "Espumante", "Capuccino", "Chás"]'::JSONB,
  reference_point TEXT,
  postal_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: users (Usuários: Admin, Profissionais, Clientes)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
  avatar_url TEXT,
  is_vip BOOLEAN DEFAULT false, -- Cliente VIP
  anamnese JSONB, -- Ficha de anamnese estruturada
  preferences TEXT, -- Preferências do cliente
  allergies TEXT, -- Alergias
  notes TEXT, -- Observações gerais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: professionals (Profissionais do Salão)
-- =====================================================
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  bio TEXT,
  specialties JSONB DEFAULT '[]'::JSONB, -- Array: ["Estética Masculina", "Maquiagem"]
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  commission_percentage DECIMAL(5,2) DEFAULT 50.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  priority_level INTEGER DEFAULT 1, -- 1 = Alta, 2 = Média, 3 = Baixa (para auto-atribuição)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

-- =====================================================
-- TABLE: services (Serviços Oferecidos)
-- =====================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  default_commission_percentage DECIMAL(5,2) DEFAULT 50.00 CHECK (default_commission_percentage >= 0 AND default_commission_percentage <= 100),
  
  -- NOVO: Sistema de Tags/Apelidos para Busca Inteligente
  keywords JSONB DEFAULT '[]'::JSONB, -- ["tingir", "cobrir brancos", "fazer raiz"]
  search_vector tsvector, -- Para full-text search
  
  -- NOVO: Regras de Negócio Específicas
  requires_double_booking BOOLEAN DEFAULT false, -- True para MegaHair
  required_professionals JSONB, -- Array de IDs de profissionais obrigatórios
  is_vip_only BOOLEAN DEFAULT false, -- Exclusivo para clientes VIP
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca de texto completo
CREATE INDEX idx_services_search ON services USING GIN(search_vector);
CREATE INDEX idx_services_keywords ON services USING GIN(keywords);

-- Trigger para atualizar search_vector automaticamente
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.keywords::text, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_search 
  BEFORE INSERT OR UPDATE ON services 
  FOR EACH ROW EXECUTE FUNCTION update_service_search_vector();

-- =====================================================
-- TABLE: products (Produtos - Venda e Uso Interno)
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100), -- Keune, Wella, Change, etc.
  line VARCHAR(100), -- Care Vital, Oil Reflection, etc.
  
  -- NOVO: Diferenciação Retail vs Internal
  is_retail BOOLEAN DEFAULT true, -- true = Venda; false = Uso Interno (Backbar)
  
  quantity DECIMAL(10,2) DEFAULT 0 CHECK (quantity >= 0),
  unit_type VARCHAR(50) NOT NULL, -- unidade, ml, kg, tubo
  min_quantity DECIMAL(10,2) DEFAULT 0, -- Alerta de estoque crítico
  
  cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
  sale_price DECIMAL(10,2), -- NULL se não for retail
  
  category VARCHAR(100), -- Tinta, Shampoo, Tratamento, Consumível
  sku VARCHAR(50),
  barcode VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_retail ON products(is_retail, is_active);
CREATE INDEX idx_products_low_stock ON products(quantity) WHERE quantity <= min_quantity;

-- =====================================================
-- TABLE: inventory_logs (Histórico de Movimentação de Estoque)
-- =====================================================
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  movement_type VARCHAR(20) CHECK (movement_type IN ('sale', 'internal_use', 'purchase', 'adjustment', 'loss')) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, -- Positivo = entrada, Negativo = saída
  
  reason TEXT, -- Ex: "Uso em Coloração 60GR"
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id, created_at DESC);
CREATE INDEX idx_inventory_logs_professional ON inventory_logs(professional_id, created_at DESC);

-- =====================================================
-- TABLE: appointments (Agendamentos)
-- =====================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- NOVO: Suporte para bloqueio duplo (MegaHair)
  secondary_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  is_double_booking BOOLEAN DEFAULT false,
  
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
  
  -- Dados do cliente (redundância intencional para histórico)
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  client_is_vip BOOLEAN DEFAULT false,
  
  -- Financeiro
  final_price DECIMAL(10,2), -- Pode ser diferente do preço padrão (desconto)
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'pix', 'installment', 'mixed')),
  installments INTEGER DEFAULT 1,
  
  notes TEXT,
  internal_notes TEXT, -- Visível apenas para equipe
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT no_overlap CHECK (start_time < end_time)
);

CREATE INDEX idx_appointments_professional_date ON appointments(professional_id, appointment_date);
CREATE INDEX idx_appointments_secondary_prof_date ON appointments(secondary_professional_id, appointment_date) WHERE secondary_professional_id IS NOT NULL;
CREATE INDEX idx_appointments_unit_date ON appointments(unit_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- =====================================================
-- TABLE: transactions (Transações Financeiras)
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  
  type VARCHAR(20) CHECK (type IN ('service_income', 'product_sale', 'expense', 'commission', 'vale')) NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'pix', 'other')) DEFAULT 'cash',
  installments INTEGER DEFAULT 1,
  installment_value DECIMAL(10,2), -- Valor de cada parcela
  
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_unit_date ON transactions(unit_id, transaction_date);
CREATE INDEX idx_transactions_professional ON transactions(professional_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- =====================================================
-- TABLE: commissions (Comissões dos Profissionais)
-- =====================================================
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  base_amount DECIMAL(10,2) NOT NULL, -- Valor do serviço
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL, -- Valor calculado
  
  fees_deducted DECIMAL(10,2) DEFAULT 0, -- Taxas de cartão, etc.
  final_amount DECIMAL(10,2) NOT NULL, -- Comissão líquida
  
  status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'vale_applied')) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commissions_professional ON commissions(professional_id, status);
CREATE INDEX idx_commissions_appointment ON commissions(appointment_id);

-- =====================================================
-- TABLE: vales (Adiantamentos dos Profissionais)
-- =====================================================
CREATE TABLE vales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  
  status VARCHAR(20) CHECK (status IN ('active', 'paid', 'cancelled')) DEFAULT 'active',
  
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin que autorizou
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT
);

CREATE INDEX idx_vales_professional ON vales(professional_id, status);

-- =====================================================
-- TABLE: blocked_times (Horários Bloqueados)
-- =====================================================
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  is_override BOOLEAN DEFAULT false, -- Override manual do admin (dom/seg/feriados)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_datetime < end_datetime)
);

CREATE INDEX idx_blocked_times_professional ON blocked_times(professional_id, start_datetime, end_datetime);

-- =====================================================
-- TABLE: packages (Pacotes Promocionais)
-- =====================================================
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  sessions_count INTEGER NOT NULL CHECK (sessions_count > 0),
  sessions_used INTEGER DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  
  client_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Cliente que comprou
  purchased_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_packages_client ON packages(client_id, is_active);
CREATE INDEX idx_packages_unit ON packages(unit_id);

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vales ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view active units" ON units FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active professionals" ON professionals FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view retail products" ON products FOR SELECT USING (is_retail = true AND is_active = true);

-- Users can view their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (
  auth.uid() = client_id OR 
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id) OR
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = secondary_professional_id)
);

-- Professionals can view their data
CREATE POLICY "Professionals can view own commissions" ON commissions FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

CREATE POLICY "Professionals can view own vales" ON vales FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

CREATE POLICY "Professionals can manage blocked times" ON blocked_times FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

-- Admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies (full access)
CREATE POLICY "Admins have full access to units" ON units FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to users" ON users FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to professionals" ON professionals FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to services" ON services FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to products" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to inventory_logs" ON inventory_logs FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to appointments" ON appointments FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to transactions" ON transactions FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to commissions" ON commissions FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to vales" ON vales FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to blocked_times" ON blocked_times FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to packages" ON packages FOR ALL USING (is_admin());
