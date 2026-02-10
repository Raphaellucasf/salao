-- =====================================================
-- INSERIR CATEGORIAS DE SERVIÇOS E SERVIÇOS
-- =====================================================

-- 1. CATEGORIAS DE SERVIÇOS
INSERT INTO service_categories (name, type, created_at) VALUES
  ('Penteado', 'service', NOW()),
  ('Maquiagem', 'service', NOW()),
  ('Cabelo', 'service', NOW()),
  ('Química', 'service', NOW()),
  ('Estética', 'service', NOW()),
  ('MegaHair', 'service', NOW()),
  ('Tratamentos', 'service', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. SERVIÇOS
-- Nota: Assumindo que a tabela services tem: code, name, duration, price, category_id, keywords, description, cost

-- GRUPO: PENTEADO
INSERT INTO services (code, name, duration_minutes, price, category_id, created_at) VALUES
  ('10', 'Penteado Infantil Festa', 30, 120.00, (SELECT id FROM service_categories WHERE name = 'Penteado'), NOW()),
  ('11', 'Penteado Preso', 40, 150.00, (SELECT id FROM service_categories WHERE name = 'Penteado'), NOW());

-- GRUPO: MAQUIAGEM
INSERT INTO services (code, name, duration_minutes, price, category_id, created_at) VALUES
  ('55', 'Maquiagem Festa', 60, 150.00, (SELECT id FROM service_categories WHERE name = 'Maquiagem'), NOW()),
  ('57', 'Maquiagem Infantil', 30, 70.00, (SELECT id FROM service_categories WHERE name = 'Maquiagem'), NOW()),
  ('56', 'Maquiagem Masculina', 30, 80.00, (SELECT id FROM service_categories WHERE name = 'Maquiagem'), NOW()),
  ('265', 'Maquiagem Social', 60, 95.00, (SELECT id FROM service_categories WHERE name = 'Maquiagem'), NOW());

-- GRUPO: CABELO (Cortes/Escovas)
INSERT INTO services (code, name, duration_minutes, price, category_id, created_at) VALUES
  ('227', 'Cauterização', 120, 150.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('6', 'Corte de Franja', 20, 25.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('62', 'Corte Feminino', 60, 150.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('1', 'Corte Masculino', 60, 90.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('7', 'Escova Curta', 60, 42.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('96', 'Escova Festa', 60, 75.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('9', 'Escova Longa', 60, 58.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('8', 'Escova Média', 60, 52.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('272', 'Escova Pacote Coloração', 60, 19.90, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('275', 'Gloss', 20, 170.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('81', 'Lavagem', 30, 30.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW()),
  ('203', 'Aplicação de Procedimento', 50, 120.00, (SELECT id FROM service_categories WHERE name = 'Cabelo'), NOW());

-- GRUPO: QUÍMICA
INSERT INTO services (code, name, duration_minutes, price, category_id, created_at) VALUES
  ('197', 'Avaliação ou Teste Químico', 20, 60.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('21', 'Clean Color (Limpeza de Cor)', 30, 184.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('131', 'Coloração 10gr', 30, 160.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('13', 'Coloração 20gr', 40, 170.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('15', 'Coloração 40gr', 40, 240.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('12', 'Coloração 60gr', 30, 288.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('36', 'Desestruturação Capilar 200g', 150, 380.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  
  -- Luzes
  ('40', 'Luzes + Tonalizante - Longo', 120, 830.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('39', 'Luzes + Tonalizante - Médio', 120, 550.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('38', 'Luzes + Tonalizante - Curto', 90, 430.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('82', 'Luzes Inversa/Contorno T', 60, 300.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('74', 'Luzes Topo/Contorno Total', 150, 250.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),

  -- Progressivas
  ('28', 'Progressiva Longo Tradicional', 150, 180.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('27', 'Progressiva Médio Tradicional', 150, 180.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('134', 'Progressiva Curto Tradicional', 150, 180.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('29', 'Progressiva Contorno/Masc', 60, 100.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('121', 'Progressiva Selante Sem Formol Curto', 60, 360.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('122', 'Progressiva Selante Sem Formol Médio', 60, 380.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('123', 'Progressiva Selante Sem Formol Longo', 60, 460.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW()),
  ('20', 'Protocolo Purificação da Cor', 60, 210.00, (SELECT id FROM service_categories WHERE name = 'Química'), NOW());

-- GRUPO: ESTÉTICA
INSERT INTO services (code, name, duration_minutes, price, category_id, cost, created_at) VALUES
  ('202', 'Aplicação Injetável Capilar', 60, 150.00, (SELECT id FROM service_categories WHERE name = 'Estética'), 52.00, NOW()),
  ('154', 'Depil. Masc. Nariz/Orelha', 15, 30.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW()),
  ('63', 'Depilação Buço/Queixo', 15, 20.00, (SELECT id FROM service_categories WHERE name = 'Estética'), 3.00, NOW()),
  ('220', 'Depilação Orelha', 15, 30.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW()),
  ('194', 'Depilação Egípcia Face', 60, 35.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW()),
  ('58', 'Design de Sobrancelhas', 60, 30.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW()),
  ('59', 'Design + Henna', 60, 36.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW()),
  ('268', 'Spa das Sobrancelhas', 30, 35.00, (SELECT id FROM service_categories WHERE name = 'Estética'), NULL, NOW());

-- GRUPO: MEGAHAIR
INSERT INTO services (code, name, duration_minutes, price, category_id, description, created_at) VALUES
  ('130', 'Mega Hair - Retirada (Adesivo)', 60, 200.00, (SELECT id FROM service_categories WHERE name = 'MegaHair'), NULL, NOW()),
  ('NEW1', 'Mega Hair - Colocação Fita (Externo)', 60, 450.00, (SELECT id FROM service_categories WHERE name = 'MegaHair'), 'Para quem NÃO é nosso cliente', NOW()),
  ('NEW2', 'Mega Hair - Colocação Fita (Cliente)', 60, 200.00, (SELECT id FROM service_categories WHERE name = 'MegaHair'), 'Para quem É nosso cliente', NOW()),
  ('NEW3', 'Mega Hair - Colocação (Mechas)', 20, 0.00, (SELECT id FROM service_categories WHERE name = 'MegaHair'), 'Só algumas mechas, máx duas', NOW());

-- GRUPO: TRATAMENTOS / HIDRATAÇÃO
INSERT INTO services (code, name, duration_minutes, price, category_id, created_at) VALUES
  ('273', 'Hidratação Pacote Coloração', 30, 59.90, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('270', 'Hidratação Wella Blonder', 90, 160.00, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('260', 'Hidratação Sem Escova', 60, 98.00, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('274', 'Hidrocicatrização', 60, 0, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('258', 'Hidratação Wella Ultimate Repair', 60, 0, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('91', 'Tratamento Anti-Quebra', 60, 0, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('42', 'Velaterapia', 90, 0, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW()),
  ('267', 'Tratamento Detox', 90, 0, (SELECT id FROM service_categories WHERE name = 'Tratamentos'), NOW());

-- =====================================================
-- INSERIR PRODUTOS (ESTOQUE)
-- =====================================================

-- Linha CHANGE (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Change Shampoo a Seco', 64.00, true, 'Change', NOW()),
  ('Change Always Blond', 87.00, true, 'Change', NOW()),
  ('Change Ampola Unitária', 14.00, true, 'Change', NOW()),
  ('Change Blend Aminoácido', 87.00, true, 'Change', NOW()),
  ('Change Fiber Máscara', 68.00, true, 'Change', NOW()),
  ('Change Finish 10x1', 70.00, true, 'Change', NOW()),
  ('Change Healing Máscara Líquida', 113.00, true, 'Change', NOW()),
  ('Change Kit Cronograma (3 ampolas)', 82.00, true, 'Change', NOW()),
  ('Change Oil Diamond', 75.00, true, 'Change', NOW()),
  ('Change Oil Finisher', 75.00, true, 'Change', NOW()),
  ('Change Oil Flower', 75.00, true, 'Change', NOW()),
  ('Change Perfect Power', 70.00, true, 'Change', NOW()),
  ('Change Pomada em Pó', 80.00, true, 'Change', NOW()),
  ('Change Spray de Brilho', 80.00, true, 'Change', NOW()),
  ('Change Spray de Fixação', 109.00, true, 'Change', NOW());

-- Linha CHANGE (Uso Interno)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Change Ampola Unitária (Interno)', 30.00, false, 'Change', NOW());

-- Linha MADIOS (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Madios Amino', 75.00, true, 'Madios', NOW()),
  ('Madios Leave-in', 75.00, true, 'Madios', NOW()),
  ('Madios Máscara', 75.00, true, 'Madios', NOW());

-- Linha MADIOS (Uso Interno)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Madios Leave-in 120ml (Interno)', 0, false, 'Madios', NOW()),
  ('Madios Máscara 150ml (Interno)', 0, false, 'Madios', NOW()),
  ('Madios Oils (Interno)', 110.00, false, 'Madios', NOW());

-- Linha WELLA (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Wella Blonder Leave-in', 220.00, true, 'Wella', NOW()),
  ('Wella Blondor Condicionador', 192.00, true, 'Wella', NOW()),
  ('Wella Blondor Shampoo', 119.00, true, 'Wella', NOW()),
  ('Wella Oil', 99.00, true, 'Wella', NOW()),
  ('Wella Oil Reflection 100ml', 196.00, true, 'Wella', NOW()),
  ('Wella Ultimate Luxe Oil Shampoo', 137.00, true, 'Wella', NOW()),
  ('Wella Ultimate Repair Condicionador', 186.00, true, 'Wella', NOW()),
  ('Wella Ultimate Repair Passo 3', 124.00, true, 'Wella', NOW()),
  ('Wella Ultimate Repair Passo 4', 184.00, true, 'Wella', NOW()),
  ('Wella Ultimate Repair Shampoo 250ml', 137.00, true, 'Wella', NOW());

-- Linha WELLA (Uso Interno / Tintas)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Wella Coloração C.P 3/0', 0, false, 'Wella', NOW()),
  ('Wella Coloração C.P 4/0', 0, false, 'Wella', NOW()),
  ('Wella Coloração C.P 5/0', 0, false, 'Wella', NOW()),
  ('Wella Coloração C.P 6/0', 0, false, 'Wella', NOW()),
  ('Wella Coloração C.P 7/07', 0, false, 'Wella', NOW()),
  ('Wella Coloração C.P 8/0', 0, false, 'Wella', NOW()),
  ('Wella Coloração K.P (Diversas Cores)', 0, false, 'Wella', NOW()),
  ('Wella Coloração Illumina (Diversas Cores)', 0, false, 'Wella', NOW()),
  ('Wella Creme Alisante', 0, false, 'Wella', NOW()),
  ('Wella Loção Neutralizante', 0, false, 'Wella', NOW());

-- Linha KEUNE (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Keune Care Vital Nutrition Condicionador', 118.00, true, 'Keune', NOW()),
  ('Keune Care Vital Nutrition Shampoo', 118.00, true, 'Keune', NOW()),
  ('K.Pro Style', 105.00, true, 'Keune', NOW());

-- Linha KEUNE (Uso Interno / Tintas)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Keune Coloração (Cores: 5.0, 6.0, 7.0, 8.0...)', 0, false, 'Keune', NOW()),
  ('Keune Coloração Metallic', 0, false, 'Keune', NOW()),
  ('Keune Style Spray', 0, false, 'Keune', NOW());

-- Linha SEBASTIAN (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Sebastian Dark Oil Óleo', 152.00, true, 'Sebastian', NOW());

-- Linha SEBASTIAN (Uso Interno)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Sebastian Dark Oil Máscara (Interno)', 300.00, false, 'Sebastian', NOW()),
  ('Sebastian No Breaker (Shampoo/Leave-in/Máscara)', 0, false, 'Sebastian', NOW());

-- Diversos / Insumos (Venda Direta)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('Hair Root Concealer', 80.00, true, 'Diversos', NOW()),
  ('Lowell Hidratante Corporal', 66.00, true, 'Lowell', NOW()),
  ('Lowell Shampoo Silver', 91.00, true, 'Lowell', NOW());

-- Diversos / Insumos (Uso Interno)
INSERT INTO products (name, selling_price, is_retail, category, created_at) VALUES
  ('OX 30 Vol', 0, false, 'Insumos', NOW()),
  ('OX 6 Vol', 0, false, 'Insumos', NOW()),
  ('Papel Higiênico', 0, false, 'Insumos', NOW()),
  ('Papel Toalha', 0, false, 'Insumos', NOW()),
  ('Gola Higiênica Preta', 0, false, 'Insumos', NOW()),
  ('Gel para Barbear', 0, false, 'Insumos', NOW()),
  ('Tira Mancha', 0, false, 'Insumos', NOW()),
  ('Spray Got 2b', 0, false, 'Insumos', NOW());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Contar serviços por categoria
SELECT 
  sc.name as categoria,
  COUNT(s.id) as total_servicos
FROM service_categories sc
LEFT JOIN services s ON s.category_id = sc.id
GROUP BY sc.name
ORDER BY sc.name;

-- Contar produtos por tipo
SELECT 
  category,
  is_retail,
  COUNT(*) as total
FROM products
GROUP BY category, is_retail
ORDER BY category, is_retail DESC;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
