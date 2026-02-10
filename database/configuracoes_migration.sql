-- =====================================================
-- MIGRAÇÃO DE CONFIGURAÇÕES DO SISTEMA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Dropar tabelas antigas (caso existam)
DROP TABLE IF EXISTS promocoes_servicos CASCADE;
DROP TABLE IF EXISTS promocoes_produtos CASCADE;
DROP TABLE IF EXISTS promocoes CASCADE;
DROP TABLE IF EXISTS formas_pagamento CASCADE;
DROP TABLE IF EXISTS configuracoes_sistema CASCADE;

-- =====================================================
-- TABELA DE CONFIGURAÇÕES GERAIS DO SISTEMA
-- =====================================================

CREATE TABLE configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações da Empresa
  nome_empresa VARCHAR(255),
  cnpj VARCHAR(18),
  razao_social VARCHAR(255),
  
  -- Contato
  telefone VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  
  -- Endereço
  endereco TEXT,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  
  -- Horário de Funcionamento (JSON)
  horario_funcionamento JSONB DEFAULT '{
    "segunda": {"abertura": "09:00", "fechamento": "18:00", "ativo": true},
    "terca": {"abertura": "09:00", "fechamento": "18:00", "ativo": true},
    "quarta": {"abertura": "09:00", "fechamento": "18:00", "ativo": true},
    "quinta": {"abertura": "09:00", "fechamento": "18:00", "ativo": true},
    "sexta": {"abertura": "09:00", "fechamento": "18:00", "ativo": true},
    "sabado": {"abertura": "09:00", "fechamento": "14:00", "ativo": true},
    "domingo": {"abertura": "00:00", "fechamento": "00:00", "ativo": false}
  }'::jsonb,
  
  -- Configurações de Agenda
  duracao_padrao_atendimento INTEGER DEFAULT 60, -- minutos
  intervalo_entre_atendimentos INTEGER DEFAULT 0, -- minutos
  antecedencia_minima_agendamento INTEGER DEFAULT 60, -- minutos
  antecedencia_maxima_agendamento INTEGER DEFAULT 60, -- dias
  permite_agendamento_online BOOLEAN DEFAULT true,
  
  -- Configurações de Pagamento
  aceita_dinheiro BOOLEAN DEFAULT true,
  aceita_pix BOOLEAN DEFAULT true,
  aceita_cartao_debito BOOLEAN DEFAULT true,
  aceita_cartao_credito BOOLEAN DEFAULT true,
  
  -- Comissões
  comissao_padrao_servico DECIMAL(5, 2) DEFAULT 50.00,
  comissao_padrao_produto DECIMAL(5, 2) DEFAULT 10.00,
  
  -- Avisos e Lembretes
  envia_lembrete_whatsapp BOOLEAN DEFAULT true,
  envia_lembrete_email BOOLEAN DEFAULT false,
  envia_lembrete_sms BOOLEAN DEFAULT false,
  antecedencia_lembrete INTEGER DEFAULT 1440, -- minutos (24h)
  
  -- Logo e Identidade Visual
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#3B82F6',
  cor_secundaria VARCHAR(7) DEFAULT '#10B981',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração inicial
INSERT INTO configuracoes_sistema (nome_empresa) VALUES ('Otimiza Beauty');

-- =====================================================
-- TABELA DE FORMAS DE PAGAMENTO
-- =====================================================

CREATE TABLE formas_pagamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- dinheiro, pix, cartao_debito, cartao_credito, boleto, crediario
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  permite_parcelamento BOOLEAN DEFAULT false,
  max_parcelas INTEGER DEFAULT 1,
  min_valor_parcela DECIMAL(10, 2),
  
  -- Taxas
  taxa_percentual DECIMAL(5, 2) DEFAULT 0, -- Taxa sobre o valor
  taxa_fixa DECIMAL(10, 2) DEFAULT 0, -- Taxa fixa por transação
  
  -- Desconto
  desconto_percentual DECIMAL(5, 2) DEFAULT 0, -- Desconto para esta forma
  
  -- Bandeira do Cartão
  bandeira VARCHAR(50), -- visa, mastercard, elo, amex, etc
  
  -- Integração
  integracao_ativa BOOLEAN DEFAULT false,
  integracao_config JSONB, -- Configs de integração
  
  -- Ordem de exibição
  ordem INTEGER DEFAULT 0,
  
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_formas_pagamento_ativo ON formas_pagamento(ativo);
CREATE INDEX idx_formas_pagamento_tipo ON formas_pagamento(tipo);
CREATE INDEX idx_formas_pagamento_ordem ON formas_pagamento(ordem);

-- =====================================================
-- TABELA DE PROMOÇÕES
-- =====================================================

CREATE TABLE promocoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Tipo de Desconto
  tipo_desconto VARCHAR(50) NOT NULL, -- percentual, valor_fixo, preco_fixo
  valor_desconto DECIMAL(10, 2) NOT NULL, -- % ou R$
  
  -- Aplicação
  aplica_em VARCHAR(50) NOT NULL, -- servicos, produtos, ambos
  
  -- Período de Validade
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  
  -- Dias da Semana (JSON array)
  dias_semana JSONB DEFAULT '["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]'::jsonb,
  
  -- Horário
  horario_inicio TIME,
  horario_fim TIME,
  
  -- Restrições
  valor_minimo DECIMAL(10, 2), -- Valor mínimo para aplicar
  quantidade_maxima_usos INTEGER, -- Limite de usos total
  quantidade_usos_atual INTEGER DEFAULT 0,
  maximo_usos_por_cliente INTEGER, -- Limite por cliente
  
  -- Clientes
  aplica_todos_clientes BOOLEAN DEFAULT true,
  aplica_primeiro_atendimento BOOLEAN DEFAULT false,
  
  -- Cupom
  requer_cupom BOOLEAN DEFAULT false,
  cupom VARCHAR(50) UNIQUE,
  
  -- Combinação
  permite_combinar_outras_promocoes BOOLEAN DEFAULT false,
  permite_combinar_comissao BOOLEAN DEFAULT true,
  
  -- Visual
  cor VARCHAR(7) DEFAULT '#F59E0B',
  destaque BOOLEAN DEFAULT false, -- Destacar na interface
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promocoes_ativo ON promocoes(ativo);
CREATE INDEX idx_promocoes_codigo ON promocoes(codigo);
CREATE INDEX idx_promocoes_cupom ON promocoes(cupom);
CREATE INDEX idx_promocoes_validade ON promocoes(data_inicio, data_fim);
CREATE INDEX idx_promocoes_tipo ON promocoes(aplica_em);

-- =====================================================
-- TABELA DE PRODUTOS NA PROMOÇÃO
-- =====================================================

CREATE TABLE promocoes_produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  promocao_id UUID NOT NULL REFERENCES promocoes(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(promocao_id, produto_id)
);

CREATE INDEX idx_promocoes_produtos_promocao ON promocoes_produtos(promocao_id);
CREATE INDEX idx_promocoes_produtos_produto ON promocoes_produtos(produto_id);

-- =====================================================
-- TABELA DE SERVIÇOS NA PROMOÇÃO
-- =====================================================

CREATE TABLE promocoes_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  promocao_id UUID NOT NULL REFERENCES promocoes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(promocao_id, servico_id)
);

CREATE INDEX idx_promocoes_servicos_promocao ON promocoes_servicos(promocao_id);
CREATE INDEX idx_promocoes_servicos_servico ON promocoes_servicos(servico_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER configuracoes_sistema_updated_at BEFORE UPDATE ON configuracoes_sistema
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER formas_pagamento_updated_at BEFORE UPDATE ON formas_pagamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER promocoes_updated_at BEFORE UPDATE ON promocoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA VALIDAR PROMOÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION validar_promocao(
  p_promocao_id UUID,
  p_data DATE DEFAULT CURRENT_DATE,
  p_hora TIME DEFAULT CURRENT_TIME,
  p_dia_semana VARCHAR DEFAULT NULL,
  p_valor_total DECIMAL DEFAULT 0,
  p_cliente_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_promocao RECORD;
BEGIN
  -- Buscar promoção
  SELECT * INTO v_promocao FROM promocoes WHERE id = p_promocao_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se está ativa
  IF NOT v_promocao.ativo THEN
    RETURN false;
  END IF;
  
  -- Verificar período de validade
  IF p_data < v_promocao.data_inicio OR p_data > v_promocao.data_fim THEN
    RETURN false;
  END IF;
  
  -- Verificar dia da semana
  IF p_dia_semana IS NOT NULL AND v_promocao.dias_semana IS NOT NULL THEN
    IF NOT (v_promocao.dias_semana ? p_dia_semana) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar horário
  IF v_promocao.horario_inicio IS NOT NULL AND v_promocao.horario_fim IS NOT NULL THEN
    IF p_hora < v_promocao.horario_inicio OR p_hora > v_promocao.horario_fim THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar valor mínimo
  IF v_promocao.valor_minimo IS NOT NULL AND p_valor_total < v_promocao.valor_minimo THEN
    RETURN false;
  END IF;
  
  -- Verificar limite de usos
  IF v_promocao.quantidade_maxima_usos IS NOT NULL THEN
    IF v_promocao.quantidade_usos_atual >= v_promocao.quantidade_maxima_usos THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA CALCULAR DESCONTO DE PROMOÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_desconto_promocao(
  p_promocao_id UUID,
  p_valor_original DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_promocao RECORD;
  v_desconto DECIMAL;
BEGIN
  SELECT * INTO v_promocao FROM promocoes WHERE id = p_promocao_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  IF v_promocao.tipo_desconto = 'percentual' THEN
    v_desconto := p_valor_original * (v_promocao.valor_desconto / 100);
  ELSIF v_promocao.tipo_desconto = 'valor_fixo' THEN
    v_desconto := v_promocao.valor_desconto;
  ELSIF v_promocao.tipo_desconto = 'preco_fixo' THEN
    v_desconto := p_valor_original - v_promocao.valor_desconto;
  ELSE
    v_desconto := 0;
  END IF;
  
  -- Garantir que desconto não seja maior que o valor original
  IF v_desconto > p_valor_original THEN
    v_desconto := p_valor_original;
  END IF;
  
  RETURN v_desconto;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO - FORMAS DE PAGAMENTO
-- =====================================================

INSERT INTO formas_pagamento (nome, tipo, ativo, permite_parcelamento, max_parcelas, ordem) VALUES
  ('Dinheiro', 'dinheiro', true, false, 1, 1),
  ('PIX', 'pix', true, false, 1, 2),
  ('Cartão de Débito', 'cartao_debito', true, false, 1, 3),
  ('Cartão de Crédito Visa', 'cartao_credito', true, true, 12, 4),
  ('Cartão de Crédito Master', 'cartao_credito', true, true, 12, 5),
  ('Cartão de Crédito Elo', 'cartao_credito', true, true, 12, 6);

-- =====================================================
-- DADOS DE EXEMPLO - PROMOÇÕES
-- =====================================================

-- Promoção de Segunda-feira
INSERT INTO promocoes (
  codigo, nome, descricao, tipo_desconto, valor_desconto,
  aplica_em, data_inicio, data_fim,
  dias_semana, ativo, cor, destaque
) VALUES (
  'SEGUNDA-FELIZ',
  'Segunda-feira Feliz',
  'Todo serviço com 20% de desconto nas segundas-feiras',
  'percentual',
  20.00,
  'servicos',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  '["segunda"]'::jsonb,
  true,
  '#3B82F6',
  true
);

-- Promoção de Primeiro Atendimento
INSERT INTO promocoes (
  codigo, nome, descricao, tipo_desconto, valor_desconto,
  aplica_em, data_inicio, data_fim,
  aplica_todos_clientes, aplica_primeiro_atendimento,
  ativo, cor, destaque
) VALUES (
  'PRIMEIRA-VISITA',
  'Primeira Visita',
  '15% de desconto para novos clientes',
  'percentual',
  15.00,
  'ambos',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  false,
  true,
  true,
  '#10B981',
  true
);

-- Promoção com Cupom
INSERT INTO promocoes (
  codigo, nome, descricao, tipo_desconto, valor_desconto,
  aplica_em, data_inicio, data_fim,
  requer_cupom, cupom, quantidade_maxima_usos,
  ativo, cor
) VALUES (
  'BELEZA2026',
  'Cupom Beleza 2026',
  'R$ 50 de desconto com o cupom BELEZA2026',
  'valor_fixo',
  50.00,
  'ambos',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  true,
  'BELEZA2026',
  100,
  true,
  '#F59E0B'
);

-- Promoção de Pacote (valor mínimo)
INSERT INTO promocoes (
  codigo, nome, descricao, tipo_desconto, valor_desconto,
  aplica_em, data_inicio, data_fim,
  valor_minimo, ativo, cor
) VALUES (
  'PACOTE-200',
  'Desconto em Pacotes',
  '10% de desconto em compras acima de R$ 200',
  'percentual',
  10.00,
  'ambos',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  200.00,
  true,
  '#EC4899'
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema e da empresa';
COMMENT ON TABLE formas_pagamento IS 'Formas de pagamento aceitas pelo estabelecimento';
COMMENT ON TABLE promocoes IS 'Promoções e descontos aplicáveis a produtos e serviços';
COMMENT ON TABLE promocoes_produtos IS 'Relacionamento entre promoções e produtos específicos';
COMMENT ON TABLE promocoes_servicos IS 'Relacionamento entre promoções e serviços específicos';

COMMENT ON COLUMN promocoes.tipo_desconto IS 'percentual: desconto em %, valor_fixo: desconto em R$, preco_fixo: preço final em R$';
COMMENT ON COLUMN promocoes.aplica_em IS 'servicos: apenas serviços, produtos: apenas produtos, ambos: serviços e produtos';
COMMENT ON COLUMN formas_pagamento.tipo IS 'dinheiro, pix, cartao_debito, cartao_credito, boleto, crediario';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
  'configuracoes_sistema' as tabela,
  COUNT(*) as registros
FROM configuracoes_sistema
UNION ALL
SELECT 
  'formas_pagamento' as tabela,
  COUNT(*) as registros
FROM formas_pagamento
UNION ALL
SELECT 
  'promocoes' as tabela,
  COUNT(*) as registros
FROM promocoes;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
