-- =====================================================
-- ETAPA 2: AUTENTICAÇÃO E RBAC
-- Otimiza Beauty Manager - Migration
-- =====================================================

-- =====================================================
-- 1. ATUALIZAÇÃO DA TABELA USERS
-- =====================================================

-- A tabela users já existe, mas vamos garantir que a coluna role esteja corretamente configurada
-- Se você já executou o schema.sql anterior, esta alteração é apenas uma garantia

-- Alterar a coluna role para garantir o tipo correto (se necessário)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('admin', 'professional', 'client');
  END IF;
END $$;

-- Modificar a coluna role para usar o enum (se ainda não estiver)
ALTER TABLE public.users 
  ALTER COLUMN role TYPE VARCHAR(20);

-- Adicionar constraint de validação
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'professional', 'client'));

-- =====================================================
-- 2. FUNÇÃO PARA SINCRONIZAR USUÁRIOS (TRIGGER)
-- =====================================================

-- Esta função será executada automaticamente quando um usuário se registrar via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário Sem Nome'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRIGGER DE SINCRONIZAÇÃO
-- =====================================================

-- Remove o trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria o trigger que executa após inserir um usuário em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. FUNÇÃO AUXILIAR PARA OBTER ROLE DO USUÁRIO
-- =====================================================

-- Função que retorna a role do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ATUALIZAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Remover políticas antigas relacionadas a professionals
DROP POLICY IF EXISTS "Professionals can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Professionals can manage blocked times" ON blocked_times;

-- Nova política: Profissionais podem ver APENAS seus próprios agendamentos
CREATE POLICY "Professionals can view own appointments" 
ON appointments FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM professionals 
    WHERE id = appointments.professional_id
  )
);

-- Nova política: Profissionais podem gerenciar APENAS seus próprios bloqueios
CREATE POLICY "Professionals can manage own blocked times" 
ON blocked_times FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM professionals 
    WHERE id = blocked_times.professional_id
  )
);

-- Política: Profissionais podem ver APENAS suas próprias comissões
CREATE POLICY "Professionals can view own commissions" 
ON transactions FOR SELECT 
USING (
  type = 'commission' AND 
  auth.uid() IN (
    SELECT user_id 
    FROM professionals 
    WHERE id = transactions.professional_id
  )
);

-- Política: Profissionais NÃO podem acessar transações que não sejam comissões
-- (isso impede acesso a income e expense)
CREATE POLICY "Block professionals from viewing salon finances" 
ON transactions FOR SELECT 
USING (
  -- Se for admin, pode ver tudo
  public.get_user_role() = 'admin' OR
  -- Se for professional, só pode ver suas comissões
  (public.get_user_role() = 'professional' AND type = 'commission' AND 
   auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id))
);

-- =====================================================
-- 6. SEED DATA - CRIAÇÃO DO SR. DIMAS (ADMIN)
-- =====================================================

-- ATENÇÃO: Execute este bloco DEPOIS de criar o usuário manualmente no Supabase Auth Dashboard
-- ou via signup. Substitua 'dimas@salao.com' pelo email real do Sr. Dimas

-- Passo 1: Atualizar o usuário existente para role admin
-- (Execute isso APÓS o Sr. Dimas se registrar pela primeira vez)
UPDATE public.users
SET 
  role = 'admin',
  full_name = 'Dimas Silva (Proprietário)'
WHERE email = 'dimas@salao.com';  -- SUBSTITUA PELO EMAIL REAL

-- Passo 2: Garantir que existe a unidade principal
INSERT INTO public.units (
  id,
  name, 
  address, 
  phone, 
  image_url,
  opening_hours,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- UUID fixo para facilitar referências
  'Salão Dimas Dona - Matriz',
  'Rua Principal, 100 - Centro',
  '(11) 98765-4321',
  NULL,
  '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "14:00"},
    "sunday": {"open": null, "close": null}
  }'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone;

-- =====================================================
-- 7. SCRIPT AUXILIAR PARA CRIAR PROFISSIONAL
-- =====================================================

-- Use este script para transformar um usuário comum em profissional
-- Substitua os valores conforme necessário

-- Exemplo: Criar profissional a partir de um usuário existente
/*
-- 1. Atualizar role do usuário
UPDATE public.users
SET role = 'professional'
WHERE email = 'profissional@salao.com';

-- 2. Criar registro de profissional
INSERT INTO public.professionals (
  user_id,
  unit_id,
  bio,
  rating,
  commission_percentage,
  is_active
) VALUES (
  (SELECT id FROM public.users WHERE email = 'profissional@salao.com'),
  '00000000-0000-0000-0000-000000000001', -- UUID da unidade principal
  'Especialista em cortes femininos e coloração',
  5.0,
  50.00, -- 50% de comissão
  true
);
*/

-- =====================================================
-- 8. FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
-- =====================================================

-- Atualizar a função is_admin para usar a nova estrutura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNÇÃO PARA VERIFICAR SE USUÁRIO É PROFISSIONAL
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_professional()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'professional'
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. VIEWS ÚTEIS PARA O SISTEMA
-- =====================================================

-- View que combina dados de usuários e profissionais
CREATE OR REPLACE VIEW public.professional_details AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.phone,
  u.avatar_url,
  p.id as professional_id,
  p.unit_id,
  p.bio,
  p.rating,
  p.commission_percentage,
  p.is_active,
  unit.name as unit_name
FROM public.users u
JOIN public.professionals p ON u.id = p.user_id
JOIN public.units unit ON p.unit_id = unit.id
WHERE u.role = 'professional';

-- Garantir que admins podem ver a view
GRANT SELECT ON public.professional_details TO authenticated;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
COMO USAR ESTA MIGRATION:

1. CRIAR USUÁRIO ADMIN (Sr. Dimas):
   a) Vá em Authentication > Users no Supabase Dashboard
   b) Clique em "Add user" > "Create new user"
   c) Email: dimas@salao.com (ou o email desejado)
   d) Senha: Defina uma senha forte
   e) Auto Confirm User: SIM
   f) Execute o UPDATE acima para torná-lo admin

2. CRIAR PROFISSIONAIS:
   a) Eles podem se registrar via aplicação
   b) Ou você cria manualmente no Dashboard
   c) Depois execute o script de criação de profissional

3. TESTAR RLS:
   a) Faça login como admin -> Deve ver tudo
   b) Faça login como professional -> Deve ver apenas sua agenda e comissões
   c) Tente acessar /api/transactions como professional -> Deve retornar apenas comissões

4. VERIFICAR SINCRONIZAÇÃO:
   a) Crie um novo usuário via signup
   b) Verifique se ele aparece em public.users automaticamente
   c) A role padrão deve ser 'client'

IMPORTANTE:
- O trigger sincroniza automaticamente auth.users -> public.users
- As políticas RLS protegem os dados no nível do banco
- O middleware do Next.js protege as rotas no frontend
- Juntos, formam uma defesa em camadas
*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
