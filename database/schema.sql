-- =====================================================
-- OTIMIZA BEAUTY MANAGER - DATABASE SCHEMA
-- Supabase PostgreSQL Migration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: units (Unidades/Salões)
-- =====================================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  image_url TEXT,
  opening_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "14:00"}, "sunday": {"open": null, "close": null}}'::JSONB,
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
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  commission_percentage DECIMAL(5,2) DEFAULT 50.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
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
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: appointments (Agendamentos)
-- =====================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
  notes TEXT,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_overlap CHECK (start_time < end_time)
);

-- =====================================================
-- TABLE: transactions (Transações Financeiras)
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense', 'commission')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'pix', 'other')) DEFAULT 'cash',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: inventory (Estoque de Produtos)
-- =====================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 0 CHECK (quantity >= 0),
  unit_type VARCHAR(50) NOT NULL, -- Ex: 'unidade', 'litro', 'kg'
  min_quantity DECIMAL(10,2) DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
  sale_price DECIMAL(10,2),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: blocked_times (Horários Bloqueados)
-- =====================================================
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_datetime < end_datetime)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_appointments_professional_date ON appointments(professional_id, appointment_date);
CREATE INDEX idx_appointments_unit_date ON appointments(unit_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_transactions_unit_date ON transactions(unit_id, transaction_date);
CREATE INDEX idx_transactions_professional ON transactions(professional_id);
CREATE INDEX idx_professionals_unit ON professionals(unit_id);
CREATE INDEX idx_services_unit ON services(unit_id);
CREATE INDEX idx_blocked_times_professional ON blocked_times(professional_id, start_datetime, end_datetime);

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
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Public read access for active units
CREATE POLICY "Public can view active units" ON units FOR SELECT USING (is_active = true);

-- Public read access for active services
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);

-- Public read access for active professionals
CREATE POLICY "Public can view active professionals" ON professionals FOR SELECT USING (is_active = true);

-- Users can view their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id));

-- Professionals can view their blocked times
CREATE POLICY "Professionals can manage blocked times" ON blocked_times FOR ALL USING (auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id));

-- Admin full access (you'll need to create a function to check if user is admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for all tables
CREATE POLICY "Admins have full access to units" ON units FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to users" ON users FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to professionals" ON professionals FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to services" ON services FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to appointments" ON appointments FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to transactions" ON transactions FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to inventory" ON inventory FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to packages" ON packages FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to blocked_times" ON blocked_times FOR ALL USING (is_admin());

-- =====================================================
-- SEED DATA (Exemplo)
-- =====================================================

-- Inserir uma unidade de exemplo
INSERT INTO units (name, address, phone, image_url) VALUES 
('Otimiza Beauty - Centro', 'Rua das Flores, 123 - Centro', '(11) 98765-4321', 'https://example.com/unit1.jpg');

-- Nota: Para inserir usuários, você precisará usar o Supabase Auth primeiro
