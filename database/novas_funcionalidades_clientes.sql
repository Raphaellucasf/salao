-- =====================================================
-- SISTEMA DE ANAMNESE (4 TIPOS)
-- =====================================================

-- Tabela principal de anamneses
CREATE TABLE IF NOT EXISTS anamneses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'capilar', 'corporal_facial', 'podologica', 'micropigmentacao'
  data_anamnese TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profissional_id UUID REFERENCES profissionais(id),
  
  -- Dados Capilar
  tipo_cabelo VARCHAR(50), -- liso, ondulado, cacheado, crespo
  textura_cabelo VARCHAR(50), -- fino, medio, grosso
  couro_cabeludo VARCHAR(50), -- normal, oleoso, seco, misto
  historico_quimico TEXT,
  alergias_capilar TEXT,
  medicamentos TEXT,
  procedimentos_anteriores TEXT,
  problemas_atuais TEXT,
  expectativas TEXT,
  
  -- Dados Corporal e Facial
  tipo_pele VARCHAR(50), -- normal, oleosa, seca, mista, sensivel
  fototipo VARCHAR(20), -- I a VI
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
  tipo_pe VARCHAR(50), -- normal, plano, cavo
  unhas_encravadas BOOLEAN,
  micoses BOOLEAN,
  calosidades BOOLEAN,
  rachaduras BOOLEAN,
  diabetes BOOLEAN,
  problemas_circulacao BOOLEAN,
  sensibilidade_pe TEXT,
  tratamentos_anteriores_pe TEXT,
  
  -- Dados Micropigmentação
  area_micropigmentacao VARCHAR(100), -- sobrancelhas, labios, olhos
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
  
  -- Campos comuns
  observacoes TEXT,
  fotos JSONB, -- Array de URLs de fotos
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anamneses_cliente ON anamneses(cliente_id);
CREATE INDEX idx_anamneses_tipo ON anamneses(tipo);
CREATE INDEX idx_anamneses_data ON anamneses(data_anamnese DESC);

-- =====================================================
-- PRONTUÁRIO DE ATENDIMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS prontuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL,
  profissional_id UUID REFERENCES profissionais(id),
  
  -- Dados do atendimento
  servicos_realizados JSONB, -- Array de {servico_id, nome, valor}
  produtos_utilizados JSONB, -- Array de {produto_id, nome, quantidade}
  tecnicas_aplicadas TEXT,
  observacoes_atendimento TEXT,
  tempo_duracao INTEGER, -- minutos
  
  -- Avaliação
  satisfacao_cliente INTEGER, -- 1 a 5
  resultado_obtido TEXT,
  recomendacoes TEXT,
  retorno_necessario BOOLEAN,
  data_retorno DATE,
  
  -- Fotos antes/depois
  fotos_antes JSONB,
  fotos_depois JSONB,
  
  -- Valores
  valor_total DECIMAL(10, 2),
  forma_pagamento VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prontuarios_cliente ON prontuarios(cliente_id);
CREATE INDEX idx_prontuarios_data ON prontuarios(data_atendimento DESC);
CREATE INDEX idx_prontuarios_profissional ON prontuarios(profissional_id);

-- =====================================================
-- ORÇAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_orcamento SERIAL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  profissional_id UUID REFERENCES profissionais(id),
  
  data_orcamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validade_ate DATE,
  
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, aprovado, recusado, expirado
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  acrescimo DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  observacoes TEXT,
  termos_condicoes TEXT,
  
  -- Aprovação
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_recusa TIMESTAMP WITH TIME ZONE,
  motivo_recusa TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL, -- 'servico', 'produto', 'pacote'
  item_id UUID, -- ID do serviço, produto ou pacote
  descricao TEXT NOT NULL,
  
  quantidade INTEGER DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL,
  
  observacoes TEXT
);

CREATE INDEX idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_orcamentos_data ON orcamentos(data_orcamento DESC);
CREATE INDEX idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- =====================================================
-- MENSAGENS E AVISOS
-- =====================================================

CREATE TABLE IF NOT EXISTS avisos_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL, -- 'manual', 'aniversario', 'retorno', 'promocao', 'lembrete'
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Envio
  canal VARCHAR(50), -- 'whatsapp', 'sms', 'email', 'sistema'
  data_envio TIMESTAMP WITH TIME ZONE,
  enviado BOOLEAN DEFAULT false,
  
  -- Agendamento
  agendar_para TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  usuario_criador_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_avisos_cliente ON avisos_clientes(cliente_id);
CREATE INDEX idx_avisos_enviado ON avisos_clientes(enviado);
CREATE INDEX idx_avisos_agendado ON avisos_clientes(agendar_para);

-- =====================================================
-- SALDOS E HISTÓRICO
-- =====================================================

CREATE TABLE IF NOT EXISTS cliente_saldos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL, -- 'credito', 'debito', 'pontos'
  valor DECIMAL(10, 2) NOT NULL,
  saldo_anterior DECIMAL(10, 2),
  saldo_atual DECIMAL(10, 2) NOT NULL,
  
  descricao TEXT NOT NULL,
  referencia VARCHAR(255), -- Referência a comanda, venda, etc
  
  usuario_id UUID REFERENCES usuarios(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cliente_saldos_cliente ON cliente_saldos(cliente_id);
CREATE INDEX idx_cliente_saldos_tipo ON cliente_saldos(tipo);
CREATE INDEX idx_cliente_saldos_data ON cliente_saldos(created_at DESC);

-- =====================================================
-- TRANSFERÊNCIA DE HISTÓRICO
-- =====================================================

CREATE TABLE IF NOT EXISTS transferencias_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_origem_id UUID NOT NULL REFERENCES clientes(id),
  cliente_destino_id UUID NOT NULL REFERENCES clientes(id),
  
  tipo_dados VARCHAR(50) NOT NULL, -- 'prontuarios', 'anamneses', 'orcamentos', 'saldos', 'todos'
  quantidade_registros INTEGER,
  
  motivo TEXT,
  observacoes TEXT,
  
  usuario_responsavel_id UUID REFERENCES usuarios(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transferencias_origem ON transferencias_historico(cliente_origem_id);
CREATE INDEX idx_transferencias_destino ON transferencias_historico(cliente_destino_id);

-- =====================================================
-- CADASTROS EXCLUÍDOS (LIXEIRA)
-- =====================================================

CREATE TABLE IF NOT EXISTS cadastros_excluidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  tipo_cadastro VARCHAR(50) NOT NULL, -- 'cliente', 'profissional', 'produto', 'servico'
  dados_originais JSONB NOT NULL, -- Todos os dados do registro excluído
  
  motivo_exclusao TEXT,
  data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_exclusao_id UUID REFERENCES usuarios(id),
  
  -- Para recuperação
  pode_recuperar BOOLEAN DEFAULT true,
  data_expiracao DATE, -- Prazo para recuperação
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cadastros_excluidos_tipo ON cadastros_excluidos(tipo_cadastro);
CREATE INDEX idx_cadastros_excluidos_data ON cadastros_excluidos(data_exclusao DESC);
CREATE INDEX idx_cadastros_excluidos_recuperavel ON cadastros_excluidos(pode_recuperar);

-- =====================================================
-- CADASTRO PADRÃO (TEMPLATES)
-- =====================================================

CREATE TABLE IF NOT EXISTS cadastro_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  tipo VARCHAR(50) NOT NULL, -- 'cliente', 'servico', 'produto', 'orcamento'
  nome_template VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  campos_padrao JSONB NOT NULL, -- Estrutura com valores padrão
  campos_obrigatorios JSONB, -- Lista de campos obrigatórios
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cadastro_templates_tipo ON cadastro_templates(tipo);
CREATE INDEX idx_cadastro_templates_ativo ON cadastro_templates(ativo);

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

CREATE TRIGGER anamneses_updated_at BEFORE UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prontuarios_updated_at BEFORE UPDATE ON prontuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orcamentos_updated_at BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cadastro_templates_updated_at BEFORE UPDATE ON cadastro_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE anamneses IS 'Sistema de anamnese completo com 4 tipos: capilar, corporal/facial, podológica e micropigmentação';
COMMENT ON TABLE prontuarios IS 'Prontuário detalhado de atendimento com histórico completo do cliente';
COMMENT ON TABLE orcamentos IS 'Sistema de orçamentos com itens e status de aprovação';
COMMENT ON TABLE avisos_clientes IS 'Sistema de mensagens e avisos para clientes';
COMMENT ON TABLE cliente_saldos IS 'Controle de saldos (crédito/débito/pontos) dos clientes';
COMMENT ON TABLE transferencias_historico IS 'Registro de transferências de histórico entre clientes';
COMMENT ON TABLE cadastros_excluidos IS 'Lixeira de cadastros excluídos com possibilidade de recuperação';
COMMENT ON TABLE cadastro_templates IS 'Templates de cadastro com valores padrão e validações';
