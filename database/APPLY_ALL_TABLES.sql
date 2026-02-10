-- =====================================================
-- SCRIPT COMPLETO PARA CRIAR TODAS AS TABELAS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE PROFISSIONAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS profissionais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados Pessoais
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  data_nascimento DATE,
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  
  -- Remuneração
  tem_salario_fixo BOOLEAN DEFAULT false,
  salario_fixo DECIMAL(10, 2),
  recebe_comissao BOOLEAN DEFAULT true,
  percentual_comissao DECIMAL(5, 2),
  
  -- Grupos de Atuação (JSON array de strings)
  grupos JSONB DEFAULT '[]'::jsonb,
  
  -- Disponibilidade
  dias_trabalho INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  hora_inicio TIME DEFAULT '09:00',
  hora_fim TIME DEFAULT '18:00',
  
  -- Status e Observações
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profissionais_ativo ON profissionais(ativo);
CREATE INDEX IF NOT EXISTS idx_profissionais_email ON profissionais(email);
CREATE INDEX IF NOT EXISTS idx_profissionais_grupos ON profissionais USING GIN(grupos);

-- =====================================================
-- TABELA DE ANAMNESES
-- =====================================================

CREATE TABLE IF NOT EXISTS anamneses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  data_anamnese TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profissional_id UUID,
  
  -- Dados Capilar
  tipo_cabelo VARCHAR(50),
  textura_cabelo VARCHAR(50),
  couro_cabeludo VARCHAR(50),
  historico_quimico TEXT,
  alergias_capilar TEXT,
  medicamentos TEXT,
  procedimentos_anteriores TEXT,
  problemas_atuais TEXT,
  expectativas TEXT,
  
  -- Dados Corporal e Facial
  tipo_pele VARCHAR(50),
  fototipo VARCHAR(20),
  alergias_pele TEXT,
  doencas_pele TEXT,
  cirurgias_esteticas TEXT,
  usa_acido_retinol BOOLEAN,
  gestante BOOLEAN,
  lactante BOOLEAN,
  marca_passo BOOLEAN,
  varizes BOOLEAN,
  problemas_circulatorios TEXT,
  expectativas_corporais TEXT,
  
  -- Dados Podológica
  tipo_pe VARCHAR(50),
  unhas_encravadas BOOLEAN,
  micoses BOOLEAN,
  calosidades BOOLEAN,
  rachaduras BOOLEAN,
  diabetes BOOLEAN,
  problemas_circulacao BOOLEAN,
  sensibilidade_pe TEXT,
  tratamentos_anteriores_pe TEXT,
  
  -- Dados Micropigmentação
  area_micropigmentacao VARCHAR(100),
  pigmentacao_anterior BOOLEAN,
  data_ultima_pigmentacao DATE,
  resultado_anterior TEXT,
  tom_pele_micro VARCHAR(50),
  expectativa_cor VARCHAR(100),
  formato_desejado TEXT,
  alergias_pigmento TEXT,
  queloides BOOLEAN,
  hepatite BOOLEAN,
  herpes BOOLEAN,
  
  observacoes TEXT,
  fotos JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamneses_cliente ON anamneses(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_tipo ON anamneses(tipo);
CREATE INDEX IF NOT EXISTS idx_anamneses_data ON anamneses(data_anamnese DESC);

-- =====================================================
-- TABELA DE PRONTUÁRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS prontuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL,
  data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL,
  profissional_id UUID,
  
  servicos_realizados JSONB,
  produtos_utilizados JSONB,
  tecnicas_aplicadas TEXT,
  observacoes_atendimento TEXT,
  tempo_duracao INTEGER,
  
  satisfacao_cliente INTEGER,
  resultado_obtido TEXT,
  recomendacoes TEXT,
  retorno_necessario BOOLEAN,
  data_retorno DATE,
  
  fotos_antes JSONB,
  fotos_depois JSONB,
  
  valor_total DECIMAL(10, 2),
  forma_pagamento VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prontuarios_cliente ON prontuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_data ON prontuarios(data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_prontuarios_profissional ON prontuarios(profissional_id);

-- =====================================================
-- TABELA DE ORÇAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_orcamento SERIAL UNIQUE,
  cliente_id UUID NOT NULL,
  profissional_id UUID,
  
  data_orcamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validade_ate DATE,
  
  status VARCHAR(50) DEFAULT 'pendente',
  
  subtotal DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  acrescimo DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  observacoes TEXT,
  termos_condicoes TEXT,
  
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_recusa TIMESTAMP WITH TIME ZONE,
  motivo_recusa TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL,
  item_id UUID,
  descricao TEXT NOT NULL,
  
  quantidade INTEGER DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL,
  
  observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(data_orcamento DESC);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- =====================================================
-- TABELA DE AVISOS
-- =====================================================

CREATE TABLE IF NOT EXISTS avisos_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID,
  
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  
  canal VARCHAR(50),
  data_envio TIMESTAMP WITH TIME ZONE,
  enviado BOOLEAN DEFAULT false,
  
  agendar_para TIMESTAMP WITH TIME ZONE,
  
  usuario_criador_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avisos_cliente ON avisos_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_avisos_enviado ON avisos_clientes(enviado);
CREATE INDEX IF NOT EXISTS idx_avisos_agendado ON avisos_clientes(agendar_para);

-- =====================================================
-- TABELA DE SALDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS cliente_saldos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL,
  
  tipo VARCHAR(50) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  saldo_anterior DECIMAL(10, 2),
  saldo_atual DECIMAL(10, 2) NOT NULL,
  
  descricao TEXT NOT NULL,
  referencia VARCHAR(255),
  
  usuario_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_saldos_cliente ON cliente_saldos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_saldos_tipo ON cliente_saldos(tipo);
CREATE INDEX IF NOT EXISTS idx_cliente_saldos_data ON cliente_saldos(created_at DESC);

-- =====================================================
-- TABELA DE TRANSFERÊNCIAS DE HISTÓRICO
-- =====================================================

CREATE TABLE IF NOT EXISTS transferencias_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_origem_id UUID NOT NULL,
  cliente_destino_id UUID NOT NULL,
  
  tipo_dados VARCHAR(50) NOT NULL,
  quantidade_registros INTEGER,
  
  motivo TEXT,
  observacoes TEXT,
  
  usuario_responsavel_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON transferencias_historico(cliente_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON transferencias_historico(cliente_destino_id);

-- =====================================================
-- TABELA DE CADASTROS EXCLUÍDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS cadastros_excluidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  tipo_cadastro VARCHAR(50) NOT NULL,
  dados_originais JSONB NOT NULL,
  
  motivo_exclusao TEXT,
  data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_exclusao_id UUID,
  
  pode_recuperar BOOLEAN DEFAULT true,
  data_expiracao DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cadastros_excluidos_tipo ON cadastros_excluidos(tipo_cadastro);
CREATE INDEX IF NOT EXISTS idx_cadastros_excluidos_data ON cadastros_excluidos(data_exclusao DESC);
CREATE INDEX IF NOT EXISTS idx_cadastros_excluidos_recuperavel ON cadastros_excluidos(pode_recuperar);

-- =====================================================
-- TABELA DE TEMPLATES DE CADASTRO
-- =====================================================

CREATE TABLE IF NOT EXISTS cadastro_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  tipo VARCHAR(50) NOT NULL,
  nome_template VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  campos_padrao JSONB NOT NULL,
  campos_obrigatorios JSONB,
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cadastro_templates_tipo ON cadastro_templates(tipo);
CREATE INDEX IF NOT EXISTS idx_cadastro_templates_ativo ON cadastro_templates(ativo);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profissionais_updated_at ON profissionais;
CREATE TRIGGER profissionais_updated_at BEFORE UPDATE ON profissionais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS anamneses_updated_at ON anamneses;
CREATE TRIGGER anamneses_updated_at BEFORE UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS prontuarios_updated_at ON prontuarios;
CREATE TRIGGER prontuarios_updated_at BEFORE UPDATE ON prontuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS orcamentos_updated_at ON orcamentos;
CREATE TRIGGER orcamentos_updated_at BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS cadastro_templates_updated_at ON cadastro_templates;
CREATE TRIGGER cadastro_templates_updated_at BEFORE UPDATE ON cadastro_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir profissional de exemplo
INSERT INTO profissionais (nome, email, telefone, tem_salario_fixo, salario_fixo, recebe_comissao, percentual_comissao, grupos, ativo)
VALUES 
  ('Dimas Martins', 'dimas@otimizabeauty.com', '(11) 99999-9999', true, 3000.00, true, 50.00, '["Cabelo", "Cabelo Festa"]'::jsonb, true),
  ('Julya Ferreira', 'julya@otimizabeauty.com', '(11) 98888-8888', false, null, true, 55.00, '["Cabelo", "Eventos"]'::jsonb, true),
  ('Ana Paula', 'ana@otimizabeauty.com', '(11) 97777-7777', false, null, true, 45.00, '["Manicure e Pedicure"]'::jsonb, true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE profissionais IS 'Profissionais do salão com dados completos de remuneração e disponibilidade';
COMMENT ON TABLE anamneses IS 'Sistema de anamnese com 4 tipos: capilar, corporal/facial, podológica e micropigmentação';
COMMENT ON TABLE prontuarios IS 'Prontuário detalhado de atendimento com histórico completo';
COMMENT ON TABLE orcamentos IS 'Sistema de orçamentos com itens e controle de status';
COMMENT ON TABLE avisos_clientes IS 'Sistema de mensagens e avisos para clientes';
COMMENT ON TABLE cliente_saldos IS 'Controle de saldos (crédito/débito/pontos) dos clientes';

-- =====================================================
-- TABELA DE SERVIÇOS
-- =====================================================

CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  grupo VARCHAR(100) NOT NULL,
  categoria VARCHAR(100),
  
  -- Tempo e Valores
  duracao INTEGER NOT NULL, -- em minutos
  valor DECIMAL(10, 2) NOT NULL,
  custo DECIMAL(10, 2) DEFAULT 0,
  
  -- Comissão
  percentual_comissao DECIMAL(5, 2),
  valor_comissao_fixo DECIMAL(10, 2),
  
  -- Configurações
  requer_agendamento BOOLEAN DEFAULT true,
  aceita_encaixe BOOLEAN DEFAULT false,
  intervalo_minimo INTEGER DEFAULT 0,
  
  -- Disponibilidade
  ativo BOOLEAN DEFAULT true,
  disponivel_online BOOLEAN DEFAULT true,
  
  -- Grupos de Profissionais Habilitados
  grupos_profissionais JSONB DEFAULT '[]'::jsonb,
  profissionais_especificos UUID[],
  
  -- Produtos Relacionados
  produtos_utilizados JSONB,
  
  -- Observações
  observacoes TEXT,
  instrucoes_cliente TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_grupo ON servicos(grupo);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_nome ON servicos(nome);
CREATE INDEX IF NOT EXISTS idx_servicos_grupos_prof ON servicos USING GIN(grupos_profissionais);

DROP TRIGGER IF EXISTS servicos_updated_at ON servicos;
CREATE TRIGGER servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE servicos IS 'Catálogo completo de serviços oferecidos pelo salão';

-- Inserir todos os serviços do salão
INSERT INTO servicos (codigo, nome, descricao, grupo, duracao, valor, custo, ativo) VALUES
  -- CABELO FESTA
  ('10', 'PENTEADO INFANTIL FESTA', '', 'CABELO FESTA', 30, 120.00, 0.00, true),
  ('11', 'PENTEADO PRESO', '', 'CABELO FESTA', 40, 150.00, 0.00, true),
  
  -- MAQUIAGEM
  ('55', 'MAQUIAGEM FESTA', '', 'MAQUIAGEM', 60, 150.00, 0.00, true),
  ('57', 'MAQUIAGEM INFANTIL', '', 'MAQUIAGEM', 30, 70.00, 0.00, true),
  ('56', 'MAQUIAGEM MASCULINA', '', 'MAQUIAGEM', 30, 80.00, 0.00, true),
  ('265', 'MAQUIAGEM SOCIAL', '', 'MAQUIAGEM', 60, 95.00, 0.00, true),
  
  -- CABELO
  ('227', 'CAUTERIZAÇÃO', '', 'CABELO', 120, 150.00, 0.00, true),
  ('6', 'CORTE DE FRANJA', '', 'CABELO', 20, 25.00, 0.00, true),
  ('62', 'CORTE FEMININO', '', 'CABELO', 60, 150.00, 0.00, true),
  ('1', 'CORTE MASCULINO', '', 'CABELO', 60, 90.00, 0.00, true),
  ('7', 'ESCOVA CURTA', '', 'CABELO', 60, 42.00, 0.00, true),
  ('96', 'ESCOVA FESTA', '', 'CABELO', 60, 75.00, 0.00, true),
  ('9', 'ESCOVA LONGA', '', 'CABELO', 60, 58.00, 0.00, true),
  ('8', 'ESCOVA MÉDIA', '', 'CABELO', 60, 52.00, 0.00, true),
  ('272', 'ESCOVA PACOTE COLORAÇÃO', '', 'CABELO', 60, 19.90, 0.00, true),
  ('275', 'GLOSS', 'COLORAÇÃO', 'CABELO', 20, 170.00, 0.00, true),
  ('81', 'LAVAGEM', '"LAVAR O CABELO" mas atenção para não confundir com escova', 'TRATAMENTOS E TERAPIAS', 30, 30.00, 0.00, true),
  ('203', 'APLICACAO DE PROCEDIMENTO', '"APLICAR TINTA" ou "APLICAR PROGRESSIVA"', 'APLICACAO PROCEDIMENTO', 50, 120.00, 0.00, true),
  
  -- HIDRATAÇÃO/TRATAMENTOS
  ('273', 'HIDRATAÇÃO PACOTE COLORAÇÃO', '', 'CABELO', 30, 59.90, 0.00, true),
  ('270', 'HIDRATAÇÃO WELLA BLONDER', '', 'CABELO', 90, 160.00, 0.00, true),
  ('274', 'HIDROCICATRIZAÇÃO', '', 'CABELO', 60, 420.00, 0.00, true),
  ('260', 'HIDRATAÇÃO SEM ESCOVA', '', 'TRATAMENTOS E TERAPIAS', 60, 98.00, 0.00, true),
  ('258', 'HIDRATAÇÃO TRATAMENTO WELLA ULTIMATE REPAIR', '', 'TRATAMENTOS E TERAPIAS', 60, 115.00, 0.00, true),
  ('91', 'TRATAMENTO ANTI QUEBRA FORÇA E RESISTÊNCIA', '', 'TRATAMENTOS E TERAPIAS', 60, 260.00, 0.00, true),
  ('42', 'VELATERAPIA', '', 'TRATAMENTOS E TERAPIAS', 90, 250.00, 0.00, true),
  ('267', 'TRATAMENTO DETOX', '', 'APLICACAO PROCEDIMENTO', 90, 350.00, 0.00, true),
  
  -- TRATAMENTOS E TERAPIAS
  ('22', 'CLEAN COLOR (LIMPEZA DE COR)', '', 'TRATAMENTOS E TERAPIAS', 30, 194.00, 0.40, true),
  ('131', 'COLORAÇÃO 10GR', 'Colorir as Raízes, Coloração de Raiz, Coloração de Comprimentos, Esmaecer Raiz, Pintar Cabelo, Tintas (Bisnaga de Raiz, Tonalizar, Hidratizellar e Cor', 'TRATAMENTOS E TERAPIAS', 30, 160.00, 0.40, true),
  ('13', 'COLORAÇÃO 20GR', 'Colorir as Raízes, Coloração de Raiz, Coloração de Comprimentos, Esmaecer Raiz, Pintar Cabelo, Tintas (Bisnaga de Raiz, Tonalizar, Hidratizellar e Cor', 'TRATAMENTOS E TERAPIAS', 40, 170.00, 0.40, true),
  ('15', 'COLORAÇÃO 40G', 'Colorir as Raízes, Coloração de Raiz, Coloração de Comprimentos, Esmaecer Raiz, Pintar Cabelo, Tintas (Bisnaga de Raiz, Tonalizar, Hidratizellar e Cor', 'TRATAMENTOS E TERAPIAS', 40, 249.00, 0.40, true),
  ('12', 'COLORAÇÃO 60GR', 'Colorir as Raízes, Coloração de Raiz, Coloração de Comprimentos, Esmaecer Raiz, Pintar Cabelo, Tintas (Bisnaga de Raiz, Tonalizar, Hidratizellar e Cor', 'TRATAMENTOS E TERAPIAS', 45, 288.00, 0.40, true),
  ('86', 'DESESTRUTURAÇÃO CAPILAR 2000', '', 'TRATAMENTOS E TERAPIAS', 150, 389.00, 0.40, true),
  ('48', 'LUZES + TONALIZANTE LONGO', 'Luzes, Mechas Iluminadas, Matizas, Correção de cor, Abrir e ou Clarear o Cabelo, Rsmaecer o Cabelo, Desilcar melhor Melhor e Neutraizas a cor', 'TRATAMENTOS E TERAPIAS', 120, 859.00, 0.40, true),
  ('39', 'LUZES + TONALIZANTE MÉDIO', 'Luzes, Mechas Iluminadas, Matizas, Correção de cor, Abrir e ou Clarear o Cabelo, Rsmaecer o Cabelo, Desilcar melhor Melhor e Neutraizas a cor', 'TRATAMENTOS E TERAPIAS', 120, 569.00, 0.40, true),
  ('38', 'LUZES + TONALIZANTE CURTO', 'Luzes, Mechas Iluminadas, Matizas, Correção de cor, Abrir e ou Clarear o Cabelo, Rsmaecer o Cabelo, Desilcar melhor Melhor e Neutraizas a cor', 'TRATAMENTOS E TERAPIAS', 90, 433.00, 0.40, true),
  ('82', 'LUZES INVERSÃO/COLORAÇÃO Y', 'Luzes, Mechas Iluminadas, Matizas, Correção de cor, Abrir e ou Clarear o Cabelo, Rsmaecer o Cabelo, Desilcar melhor Melhor e Neutraizas a cor', 'TRATAMENTOS E TERAPIAS', 40, 300.00, 0.40, true),
  ('74', 'LUZES TOPOS/CONTORNO/DENS', 'Luzes, Mechas Iluminadas, Matizas, Correção de cor, Abrir e ou Clarear o Cabelo, Rsmaecer o Cabelo, Desilcar melhor Melhor e Neutraizas a cor', 'TRATAMENTOS E TERAPIAS', 110, 259.00, 0.40, true),
  ('28', 'PROGRESSIVA LONGO TRADICIONAL', 'Escova Progressiva, Alisamento, Relaxar Frizz, Maciez, Cabelo Liso, Definitiva, Escova Definitiva, Definitiva, Progressiva com Formol', 'TRATAMENTOS E TERAPIAS', 150, 189.00, 0.20, true),
  ('27', 'PROGRESSIVA MÉDIO TRADICIONAL', 'Escova Progressiva, Alisamento, Relaxar Frizz, Maciez, Cabelo Liso, Definitiva, Escova Definitiva, Definitiva, Progressiva com Formol', 'TRATAMENTOS E TERAPIAS', 150, 189.00, 0.20, true),
  ('29', 'PROGRESSIVA CONTORNO SRAT QUE NAO MASCALINO', 'Progressiva Organica, Progressiva sem Formol, Biotox, Selante, Alisamento', 'TRATAMENTOS E TERAPIAS', 45, 103.00, 0.30, true),
  ('126', 'PROGRESSIVA CURTO TRADICIONAL', 'Escova Progressiva, Alisamento, Relaxar Frizz, Maciez, Cabelo Liso, Definitiva, Escova Definitiva, Definitiva, Progressiva com Formol', 'TRATAMENTOS E TERAPIAS', 130, 189.00, 0.20, true),
  ('121', 'PROGRESSIVA SELANTE SEM FORMOL CURTO', 'Progressiva Organica, Progressiva sem Formol, Biotox, Selante, Alisamento', 'TRATAMENTOS E TERAPIAS', 40, 360.00, 0.40, true),
  ('123', 'PROGRESSIVA SELANTE SEM FORMOL LONGO', 'Progressiva Organica, Progressiva sem Formol, Biotox, Selante, Alisamento', 'TRATAMENTOS E TERAPIAS', 45, 469.00, 0.40, true),
  ('122', 'PROGRESSIVA SELANTE SEM FORMOL MÉDIO', 'Progressiva Organica, Progressiva sem Formol, Biotox, Selante, Alisamento', 'TRATAMENTOS E TERAPIAS', 45, 389.00, 0.40, true),
  ('20', 'PROTOCOLO TRATAMLENTO PURIFICAÇÃO NA COR', '', 'TRATAMENTOS E TERAPIAS', 45, 233.00, 0.40, true),
  
  -- ESTÉTICA
  ('202', 'APLICAÇÃO INJETÁVEL CAPILAR', '', 'ESTÉTICA', 60, 150.00, 52.00, true),
  ('154', 'DEPIL. MASC. NARIZ/ORELHA', '', 'ESTÉTICA', 15, 30.00, 0.00, true),
  ('63', 'DEPILACAO DE BUÇO / QUEIXO', '', 'ESTÉTICA', 15, 20.00, 3.00, true),
  ('220', 'DEPILAÇÃO DE ORELHA', '', 'ESTÉTICA', 15, 30.00, 0.00, true),
  ('194', 'DEPILAÇÃO EGÍPCIA FACE', '', 'ESTÉTICA', 60, 35.00, 0.00, true),
  ('58', 'DESIGNER DE SOBRANCELHAS', '', 'ESTÉTICA', 60, 30.00, 0.00, true),
  ('59', 'DESIGNER MAIS HENNA', '', 'ESTÉTICA', 60, 36.00, 0.00, true),
  ('268', 'SPA DAS SOBRANCELHA', '', 'ESTÉTICA', 30, 35.00, 0.00, true),
  
  -- MEGA HAIR
  ('130', 'MEGA HAIR RETIRADA DE MEGA COM ADESIVO', '', 'MEGA', 60, 200.00, 0.00, true),
  ('131M', 'MEGA HAIR COLOCACAO DE MEGA COM FITA (cabelo inteiro) para quem NÃO é nosso cliente', '', 'MEGA', 60, 450.00, 0.00, true),
  ('132M', 'MEGA HAIR COLOCACAO DE MEGA COM FITA (cabelo inteiro) para quem É nosso cliente', '', 'MEGA', 60, 200.00, 0.00, true),
  ('133M', 'MEGA HAIR COLOCACAO DE MEGA COM FITA (só algumas mechas no máx duas)', '', 'MEGA', 20, 0.00, 0.00, true)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profissionais', 'anamneses', 'prontuarios', 'orcamentos', 'avisos_clientes', 'cliente_saldos', 'servicos')
ORDER BY table_name;
