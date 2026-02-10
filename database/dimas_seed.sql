-- =====================================================
-- DIMAS DONA CONCEPT - SEED DATA
-- Dados Reais para Inicialização do Sistema
-- =====================================================

-- =====================================================
-- 1. UNIDADE (Salão Dimas Dona Concept)
-- =====================================================
INSERT INTO units (
  name, 
  address, 
  phone, 
  pix_key,
  instagram,
  reference_point,
  postal_code,
  amenities,
  opening_hours
) VALUES (
  'Dimas Dona Concept',
  'Rua Mário de Souza Campos, 773, Centro - Birigui/SP',
  '(18) 99768-1052',
  '55 18 99768-1052',
  '["@dimasdona_concept", "@madiosbeauty", "@dimasdona"]'::JSONB,
  'Próximo ao Pérola Club',
  '16200-110',
  '["Wi-Fi", "Café Bar", "Espumante", "Capuccino", "Chás Premium"]'::JSONB,
  '{
    "monday": {"open": null, "close": null, "blocked": true},
    "tuesday": {"open": "08:00", "close": "19:00", "blocked": false},
    "wednesday": {"open": "08:00", "close": "19:00", "blocked": false},
    "thursday": {"open": "08:00", "close": "19:00", "blocked": false},
    "friday": {"open": "08:00", "close": "19:00", "blocked": false},
    "saturday": {"open": "08:00", "close": "19:00", "blocked": false},
    "sunday": {"open": null, "close": null, "blocked": true}
  }'::JSONB
) RETURNING id as unit_id;

-- Salvar o ID da unidade para usar nas próximas queries
-- Substitua 'UNIT_ID' pelo UUID retornado acima

-- =====================================================
-- 2. USUÁRIOS E PROFISSIONAIS (Equipe Dimas Dona)
-- =====================================================

-- NOTA: Primeiro você precisa criar os usuários no Supabase Auth
-- Depois insira na tabela users e professionals

-- Exemplo de estrutura (substitua os UUIDs reais):

/*
-- 2.1 DIMAS (Admin/Owner)
INSERT INTO users (id, email, full_name, phone, role, is_vip) VALUES
('UUID_DIMAS', 'dimas@dimasdona.com.br', 'Dimas', '(18) 99768-1052', 'admin', true);

INSERT INTO professionals (user_id, unit_id, bio, specialties, commission_percentage, priority_level) VALUES
('UUID_DIMAS', 'UNIT_ID', 
 'Especialista em Estética Masculina, Maquiagem Química e Luzes. Atendimento VIP.',
 '["Estética Masculina", "Maquiagem/Química VIP", "Cortes", "Luzes", "Coloração"]'::JSONB,
 60.00, -- Comissão diferenciada do dono
 1
);

-- 2.2 JULYA (Profissional - MegaHair)
INSERT INTO users (id, email, full_name, phone, role) VALUES
('UUID_JULYA', 'julya@dimasdona.com.br', 'Julya', '(18) 99999-0001', 'professional');

INSERT INTO professionals (user_id, unit_id, bio, specialties, commission_percentage, priority_level) VALUES
('UUID_JULYA', 'UNIT_ID',
 'Especialista em Estética Feminina, Maquiagem e MegaHair.',
 '["Estética Feminina", "Maquiagem", "MegaHair", "Tratamentos Capilares"]'::JSONB,
 50.00,
 1
);

-- 2.3 HENDRIL (Profissional - Química)
INSERT INTO users (id, email, full_name, phone, role) VALUES
('UUID_HENDRIL', 'hendril@dimasdona.com.br', 'Hendril', '(18) 99999-0002', 'professional');

INSERT INTO professionals (user_id, unit_id, bio, specialties, commission_percentage, priority_level) VALUES
('UUID_HENDRIL', 'UNIT_ID',
 'Especialista em Tratamentos e Química (Coloração, Progressiva). Penteados.',
 '["Química", "Coloração", "Progressiva", "Tratamentos", "Penteados"]'::JSONB,
 50.00,
 1
);

-- 2.4 AMÉLIA (Profissional - Química/Tratamentos)
INSERT INTO users (id, email, full_name, phone, role) VALUES
('UUID_AMELIA', 'amelia@dimasdona.com.br', 'Amélia', '(18) 99999-0003', 'professional');

INSERT INTO professionals (user_id, unit_id, bio, specialties, commission_percentage, priority_level) VALUES
('UUID_AMELIA', 'UNIT_ID',
 'Especialista em Progressiva, Tratamentos e Penteados.',
 '["Progressiva", "Tratamentos", "Penteados", "Hidratação"]'::JSONB,
 50.00,
 2
);
*/

-- =====================================================
-- 3. SERVIÇOS (Com Tags para Busca Inteligente)
-- =====================================================

-- 3.1 CATEGORIA: MEGAHAIR (Bloqueio Duplo Obrigatório)
INSERT INTO services (unit_id, name, description, duration_minutes, price, category, keywords, requires_double_booking, required_professionals) VALUES
('UNIT_ID', 'MegaHair - Colocação Fita Cabelo Inteiro VIP', 'Aplicação de MegaHair com Fita Adesiva (Cabelo Inteiro) - Exclusivo', 60, 200.00, 'MegaHair', 
 '["mega hair", "alongamento", "aplique", "fita adesiva", "cabelo inteiro"]'::JSONB, 
 true, 
 '["UUID_JULYA", "UUID_DIMAS"]'::JSONB),

('UNIT_ID', 'MegaHair - Colocação Fita Externo', 'Aplicação de MegaHair com Fita Adesiva (Cliente Externo traz o cabelo)', 60, 450.00, 'MegaHair',
 '["mega hair", "alongamento", "aplique", "fita", "externo"]'::JSONB,
 true,
 '["UUID_JULYA", "UUID_DIMAS"]'::JSONB),

('UNIT_ID', 'MegaHair - Manutenção Fita', 'Manutenção e Reposicionamento de Fitas', 45, 120.00, 'MegaHair',
 '["manutenção", "fita", "reposicionar", "mega hair"]'::JSONB,
 false,
 null);

-- 3.2 CATEGORIA: QUÍMICA (Coloração, Luzes, Progressiva)
INSERT INTO services (unit_id, name, description, duration_minutes, price, category, subcategory, keywords) VALUES
('UNIT_ID', 'Coloração 10GR', 'Coloração com Keune/Wella - Retoque de Raiz (até 10gr de tinta)', 30, 96.00, 'Química', 'Coloração',
 '["coloração", "tingir", "pintar", "cobrir brancos", "fazer raiz", "retoque", "tinta"]'::JSONB),

('UNIT_ID', 'Coloração 20GR', 'Coloração - Raiz e Ponta (até 20gr)', 40, 144.00, 'Química', 'Coloração',
 '["coloração", "tingir", "raiz e ponta", "pintar cabelo"]'::JSONB),

('UNIT_ID', 'Coloração 40GR', 'Coloração Completa (até 40gr)', 50, 192.00, 'Química', 'Coloração',
 '["coloração completa", "tingir todo cabelo", "mudar cor"]'::JSONB),

('UNIT_ID', 'Coloração 60GR', 'Coloração Intensiva Longo (até 60gr)', 60, 288.00, 'Química', 'Coloração',
 '["coloração longo", "cabelo comprido", "tingir longo"]'::JSONB),

('UNIT_ID', 'Luzes + Tonalizante Curto', 'Mechas com Descoloração + Tonalização', 90, 470.00, 'Química', 'Luzes',
 '["luzes", "mechas", "californianas", "descolorir", "clarear"]'::JSONB),

('UNIT_ID', 'Luzes + Tonalizante Longo', 'Luzes em Cabelo Longo + Tonalizante', 120, 830.00, 'Química', 'Luzes',
 '["luzes longo", "mechas longo", "californianas", "ombre"]'::JSONB),

('UNIT_ID', 'Progressiva Tradicional Curto', 'Progressiva com Formol/Sem Formol - Cabelo Curto', 120, 140.00, 'Química', 'Progressiva',
 '["progressiva", "alisar", "escovar", "escova progressiva", "liso"]'::JSONB),

('UNIT_ID', 'Progressiva Tradicional Longo', 'Progressiva - Cabelo Longo', 150, 180.00, 'Química', 'Progressiva',
 '["progressiva longo", "alisar longo", "escova longo"]'::JSONB),

('UNIT_ID', 'Botox Capilar', 'Tratamento Intensivo Botox - Restauração Profunda', 90, 150.00, 'Química', 'Tratamento',
 '["botox", "tratamento", "hidratação profunda", "reconstrução"]'::JSONB);

-- 3.3 CATEGORIA: CABELO (Cortes)
INSERT INTO services (unit_id, name, description, duration_minutes, price, category, keywords) VALUES
('UNIT_ID', 'Corte Feminino', 'Corte Feminino com Finalização', 60, 150.00, 'Cabelo',
 '["corte feminino", "cortar cabelo", "corte"]'::JSONB),

('UNIT_ID', 'Corte Masculino', 'Corte Masculino com Máquina/Tesoura', 60, 90.00, 'Cabelo',
 '["corte masculino", "cortar cabelo homem", "barba"]'::JSONB),

('UNIT_ID', 'Corte Infantil', 'Corte para Crianças até 12 anos', 45, 70.00, 'Cabelo',
 '["corte infantil", "criança", "cortar cabelo criança"]'::JSONB);

-- 3.4 CATEGORIA: ESTÉTICA
INSERT INTO services (unit_id, name, description, duration_minutes, price, category, keywords, is_vip_only) VALUES
('UNIT_ID', 'Aplicação Injetável Capilar', 'Tratamento Injetável para Couro Cabeludo (Vitaminas)', 60, 150.00, 'Estética',
 '["injetável", "aplicação capilar", "vitamina", "mesoterapia"]'::JSONB, false),

('UNIT_ID', 'Design de Sobrancelha', 'Design e Modelagem de Sobrancelhas', 30, 30.00, 'Estética',
 '["sobrancelha", "design", "tirar sobrancelha"]'::JSONB, false),

('UNIT_ID', 'Maquiagem Social', 'Maquiagem para Eventos', 60, 180.00, 'Estética',
 '["maquiagem", "make", "maquiar"]'::JSONB, false),

('UNIT_ID', 'Maquiagem Química VIP', 'Maquiagem com Produtos Premium (Apenas Dimas)', 90, 350.00, 'Estética',
 '["maquiagem vip", "make premium", "química"]'::JSONB, true);

-- 3.5 CATEGORIA: PENTEADOS
INSERT INTO services (unit_id, name, description, duration_minutes, price, category, keywords) VALUES
('UNIT_ID', 'Penteado Social Simples', 'Penteado para Festas/Eventos', 45, 90.00, 'Penteado',
 '["penteado", "preso", "coque", "festa"]'::JSONB),

('UNIT_ID', 'Penteado Noiva Completo', 'Penteado Elaborado para Noivas', 120, 350.00, 'Penteado',
 '["penteado noiva", "cabelo noiva", "casamento"]'::JSONB);

-- =====================================================
-- 4. PRODUTOS (Retail e Uso Interno)
-- =====================================================

-- 4.1 PRODUTOS RETAIL (Venda ao Cliente)

-- Linha Change
INSERT INTO products (unit_id, name, brand, line, is_retail, quantity, unit_type, cost_price, sale_price, category) VALUES
('UNIT_ID', 'Shampoo a Seco Change', 'Change', 'Change Professional', true, 10, 'unidade', 40.00, 64.00, 'Shampoo'),
('UNIT_ID', 'Always Blond Change', 'Change', 'Change Professional', true, 8, 'unidade', 55.00, 87.00, 'Tratamento'),
('UNIT_ID', 'Máscara Matizadora Change', 'Change', 'Change Professional', true, 12, 'unidade', 45.00, 72.00, 'Tratamento');

-- Linha Wella
INSERT INTO products (unit_id, name, brand, line, is_retail, quantity, unit_type, cost_price, sale_price, category) VALUES
('UNIT_ID', 'Oil Reflection Wella', 'Wella', 'Oil Reflection', true, 6, 'unidade', 120.00, 196.00, 'Finalizador'),
('UNIT_ID', 'Shampoo Invigo Wella', 'Wella', 'Invigo', true, 15, 'unidade', 55.00, 89.00, 'Shampoo'),
('UNIT_ID', 'Máscara Fusion Wella', 'Wella', 'Fusion', true, 10, 'unidade', 70.00, 115.00, 'Tratamento');

-- Linha Keune
INSERT INTO products (unit_id, name, brand, line, is_retail, quantity, unit_type, cost_price, sale_price, category) VALUES
('UNIT_ID', 'Care Vital Nutrition Keune', 'Keune', 'Care Vital', true, 8, 'unidade', 72.00, 118.00, 'Shampoo'),
('UNIT_ID', 'So Pure Restore Keune', 'Keune', 'So Pure', true, 7, 'unidade', 80.00, 132.00, 'Tratamento'),
('UNIT_ID', 'Tinta Color Cream Keune 60ml', 'Keune', 'Tinta Color', true, 20, 'unidade', 25.00, 42.00, 'Tinta');

-- 4.2 PRODUTOS USO INTERNO (Backbar - Não vende)

-- Tintas Keune (Todas as cores)
INSERT INTO products (unit_id, name, brand, line, is_retail, quantity, unit_type, cost_price, sale_price, category, sku, min_quantity) VALUES
('UNIT_ID', 'Tinta Keune 6.0 (Louro Escuro Natural)', 'Keune', 'Tinta Professional', false, 15, 'tubo', 18.00, null, 'Tinta', 'KEUNE-6.0', 3),
('UNIT_ID', 'Tinta Keune 7.0 (Louro Médio)', 'Keune', 'Tinta Professional', false, 12, 'tubo', 18.00, null, 'Tinta', 'KEUNE-7.0', 3),
('UNIT_ID', 'Tinta Keune 8.0 (Louro Claro)', 'Keune', 'Tinta Professional', false, 10, 'tubo', 18.00, null, 'Tinta', 'KEUNE-8.0', 3),
('UNIT_ID', 'Tinta Keune 8.1 (Louro Claro Cinza)', 'Keune', 'Tinta Professional', false, 8, 'tubo', 18.00, null, 'Tinta', 'KEUNE-8.1', 3),
('UNIT_ID', 'Tinta Keune 9.0 (Louro Muito Claro)', 'Keune', 'Tinta Professional', false, 6, 'tubo', 18.00, null, 'Tinta', 'KEUNE-9.0', 3),
('UNIT_ID', 'Tinta Keune 10.0 (Louro Claríssimo)', 'Keune', 'Tinta Professional', false, 5, 'tubo', 18.00, null, 'Tinta', 'KEUNE-10.0', 3);

-- Tintas Wella
INSERT INTO products (unit_id, name, brand, line, is_retail, quantity, unit_type, cost_price, sale_price, category, sku, min_quantity) VALUES
('UNIT_ID', 'Tinta Wella Color Touch 6/0', 'Wella', 'Color Touch', false, 12, 'tubo', 16.00, null, 'Tinta', 'WELLA-CT-6/0', 3),
('UNIT_ID', 'Tinta Wella Illumina 7/', 'Wella', 'Illumina Color', false, 10, 'tubo', 22.00, null, 'Tinta', 'WELLA-IL-7/', 3),
('UNIT_ID', 'Pó Descolorante Wella Blondor', 'Wella', 'Blondor', false, 20, 'pacote', 25.00, null, 'Descolorante', 'WELLA-BLONDOR', 5);

-- Consumíveis Gerais
INSERT INTO products (unit_id, name, brand, is_retail, quantity, unit_type, cost_price, sale_price, category, min_quantity) VALUES
('UNIT_ID', 'Papel Higiênico Folha Dupla (Pacote 12un)', 'Diversos', false, 50, 'pacote', 18.00, null, 'Consumível', 10),
('UNIT_ID', 'Luva Látex Descartável (Caixa 100un)', 'Diversos', false, 8, 'caixa', 35.00, null, 'Consumível', 2),
('UNIT_ID', 'Toalha Descartável (Rolo 50m)', 'Diversos', false, 15, 'rolo', 12.00, null, 'Consumível', 5),
('UNIT_ID', 'Gola Higiênica (Pacote 100un)', 'Diversos', false, 10, 'pacote', 8.00, null, 'Consumível', 3),
('UNIT_ID', 'Papel Alumínio Profissional (Rolo 100m)', 'Diversos', false, 12, 'rolo', 22.00, null, 'Consumível', 3);

-- =====================================================
-- 5. EXEMPLOS DE AGENDAMENTOS (Opcional - Para Testes)
-- =====================================================

/*
-- Agendamento Normal (Coloração)
INSERT INTO appointments (
  unit_id, professional_id, service_id, 
  appointment_date, start_time, end_time,
  client_name, client_phone, status
) VALUES (
  'UNIT_ID', 'UUID_HENDRIL', 'SERVICE_ID_COLORACAO_60GR',
  '2026-01-20', '09:00', '10:00',
  'Maria Silva', '(18) 99999-8888', 'confirmed'
);

-- Agendamento MEGAHAIR (Bloqueio Duplo)
INSERT INTO appointments (
  unit_id, professional_id, secondary_professional_id, service_id,
  is_double_booking,
  appointment_date, start_time, end_time,
  client_name, client_phone, client_is_vip, status
) VALUES (
  'UNIT_ID', 'UUID_JULYA', 'UUID_DIMAS', 'SERVICE_ID_MEGAHAIR_FITA',
  true,
  '2026-01-21', '14:00', '15:00',
  'Ana Paula VIP', '(18) 99888-7777', true, 'confirmed'
);
*/

-- =====================================================
-- 6. NOTAS IMPORTANTES
-- =====================================================

/*
APÓS EXECUTAR ESTE SEED:

1. Crie os usuários no Supabase Auth primeiro
2. Substitua todos os 'UNIT_ID' e 'UUID_*' pelos IDs reais
3. Configure as regras de parcelamento (mínimo R$100/parcela)
4. Teste a busca inteligente com keywords
5. Valide o bloqueio duplo do MegaHair na API

PRÓXIMOS PASSOS:
- Implementar API de agendamento com validação de bloqueio duplo
- Criar componente de venda rápida para produtos retail
- Implementar sistema de comissões automático
- Dashboard com separação de faturamento (serviço vs produto)
*/
