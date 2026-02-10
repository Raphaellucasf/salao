-- =====================================================
-- MIGRAÇÃO DE SERVIÇOS - EXPANSÃO COMPLETA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Backup dos dados existentes (se houver)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servicos') THEN
    CREATE TEMP TABLE servicos_backup AS SELECT * FROM servicos;
    RAISE NOTICE 'Backup criado com % registros', (SELECT COUNT(*) FROM servicos_backup);
  END IF;
END $$;

-- Dropar tabelas dependentes
DROP TABLE IF EXISTS pacotes_servicos_itens CASCADE;
DROP TABLE IF EXISTS pacotes_servicos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS grupos_servicos CASCADE;

-- =====================================================
-- TABELA DE GRUPOS DE SERVIÇOS
-- =====================================================

CREATE TABLE grupos_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  cor VARCHAR(7), -- Hex color para visualização
  icone VARCHAR(50), -- scissors, spray-can, hand-sparkles, etc
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grupos_servicos_ativo ON grupos_servicos(ativo);

-- =====================================================
-- TABELA DE SERVIÇOS (ATUALIZADA)
-- =====================================================

CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  grupo_id UUID REFERENCES grupos_servicos(id),
  categoria VARCHAR(100),
  
  -- Valores
  preco DECIMAL(10, 2) NOT NULL,
  preco_promocional DECIMAL(10, 2),
  
  -- Tempo
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  tempo_preparo_minutos INTEGER DEFAULT 0, -- Tempo antes de começar
  
  -- Comissão
  comissao_profissional DECIMAL(5, 2) DEFAULT 50.00, -- Percentual
  comissao_tipo VARCHAR(20) DEFAULT 'percentual', -- percentual ou valor_fixo
  comissao_valor_fixo DECIMAL(10, 2),
  
  -- Configurações
  aceita_agendamento BOOLEAN DEFAULT true,
  exige_profissional_especifico BOOLEAN DEFAULT false,
  permite_desconto BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  
  -- Produtos relacionados
  usa_produtos BOOLEAN DEFAULT false, -- Se usa produtos do estoque
  
  -- Observações
  observacoes TEXT,
  instrucoes_profissional TEXT, -- Instruções específicas para o profissional
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_servicos_codigo ON servicos(codigo);
CREATE INDEX idx_servicos_grupo ON servicos(grupo_id);
CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_nome ON servicos(nome);
CREATE INDEX idx_servicos_duracao ON servicos(duracao_minutos);

-- =====================================================
-- TABELA DE PACOTES DE SERVIÇOS
-- =====================================================

CREATE TABLE pacotes_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Valores
  preco_total DECIMAL(10, 2) NOT NULL,
  preco_original DECIMAL(10, 2), -- Soma dos preços individuais
  desconto_percentual DECIMAL(5, 2), -- Desconto aplicado
  
  -- Tempo
  duracao_total_minutos INTEGER NOT NULL,
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  validade_dias INTEGER, -- Validade do pacote após compra
  permite_parcelamento BOOLEAN DEFAULT true,
  max_parcelas INTEGER DEFAULT 12,
  
  -- Visual
  cor VARCHAR(7),
  icone VARCHAR(50),
  
  -- Observações
  observacoes TEXT,
  termos_uso TEXT, -- Termos e condições do pacote
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pacotes_codigo ON pacotes_servicos(codigo);
CREATE INDEX idx_pacotes_ativo ON pacotes_servicos(ativo);
CREATE INDEX idx_pacotes_nome ON pacotes_servicos(nome);

-- =====================================================
-- TABELA DE ITENS DOS PACOTES
-- =====================================================

CREATE TABLE pacotes_servicos_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pacote_id UUID NOT NULL REFERENCES pacotes_servicos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id),
  
  quantidade INTEGER DEFAULT 1,
  ordem INTEGER DEFAULT 0, -- Ordem de execução sugerida
  obrigatorio BOOLEAN DEFAULT true, -- Se é obrigatório no pacote
  
  -- Valores específicos (se diferente do serviço padrão)
  preco_unitario DECIMAL(10, 2), -- Preço específico neste pacote
  
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pacotes_itens_pacote ON pacotes_servicos_itens(pacote_id);
CREATE INDEX idx_pacotes_itens_servico ON pacotes_servicos_itens(servico_id);
CREATE INDEX idx_pacotes_itens_ordem ON pacotes_servicos_itens(ordem);

-- =====================================================
-- TABELA DE PRODUTOS USADOS EM SERVIÇOS
-- =====================================================

CREATE TABLE servicos_produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  
  quantidade_media DECIMAL(10, 2) NOT NULL, -- Quantidade média usada
  obrigatorio BOOLEAN DEFAULT true, -- Se é obrigatório para o serviço
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_servicos_produtos_servico ON servicos_produtos(servico_id);
CREATE INDEX idx_servicos_produtos_produto ON servicos_produtos(produto_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER grupos_servicos_updated_at BEFORE UPDATE ON grupos_servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER pacotes_servicos_updated_at BEFORE UPDATE ON pacotes_servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA CALCULAR PREÇO TOTAL DO PACOTE
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_totais_pacote(p_pacote_id UUID)
RETURNS VOID AS $$
DECLARE
  v_preco_original DECIMAL(10, 2);
  v_duracao_total INTEGER;
BEGIN
  -- Calcular preço original (soma dos serviços)
  SELECT 
    COALESCE(SUM(
      COALESCE(psi.preco_unitario, s.preco) * psi.quantidade
    ), 0),
    COALESCE(SUM(
      s.duracao_minutos * psi.quantidade
    ), 0)
  INTO v_preco_original, v_duracao_total
  FROM pacotes_servicos_itens psi
  JOIN servicos s ON s.id = psi.servico_id
  WHERE psi.pacote_id = p_pacote_id;
  
  -- Atualizar pacote
  UPDATE pacotes_servicos
  SET 
    preco_original = v_preco_original,
    duracao_total_minutos = v_duracao_total,
    desconto_percentual = CASE 
      WHEN v_preco_original > 0 THEN 
        ((v_preco_original - preco_total) / v_preco_original) * 100
      ELSE 0
    END
  WHERE id = p_pacote_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular ao adicionar/remover itens
CREATE OR REPLACE FUNCTION trigger_recalcular_pacote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calcular_totais_pacote(OLD.pacote_id);
    RETURN OLD;
  ELSE
    PERFORM calcular_totais_pacote(NEW.pacote_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pacotes_itens_recalcular
AFTER INSERT OR UPDATE OR DELETE ON pacotes_servicos_itens
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_pacote();

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Grupos de serviços
INSERT INTO grupos_servicos (nome, descricao, cor, icone) VALUES
  ('Cabelo - Corte', 'Cortes e finalizações', '#3B82F6', 'scissors'),
  ('Cabelo - Coloração', 'Coloração e luzes', '#8B5CF6', 'droplet'),
  ('Cabelo - Tratamento', 'Hidratações e reconstruções', '#EC4899', 'sparkles'),
  ('Cabelo - Químicas', 'Alisamentos e permanentes', '#F59E0B', 'zap'),
  ('Unhas - Manicure', 'Serviços de unhas das mãos', '#EF4444', 'hand'),
  ('Unhas - Pedicure', 'Serviços de unhas dos pés', '#10B981', 'footprints'),
  ('Estética', 'Serviços estéticos', '#6366F1', 'sparkles'),
  ('Sobrancelhas', 'Design e cuidados', '#78716C', 'eye');

-- Serviços exemplo
INSERT INTO servicos (codigo, nome, descricao, grupo_id, preco, duracao_minutos, comissao_profissional) 
SELECT 
  'SERV001', 
  'Corte Feminino', 
  'Corte feminino com lavagem e finalização', 
  id, 
  80.00, 
  60, 
  50.00
FROM grupos_servicos WHERE nome = 'Cabelo - Corte';

INSERT INTO servicos (codigo, nome, descricao, grupo_id, preco, duracao_minutos, comissao_profissional) 
SELECT 
  'SERV002', 
  'Corte Masculino', 
  'Corte masculino com acabamento', 
  id, 
  40.00, 
  30, 
  50.00
FROM grupos_servicos WHERE nome = 'Cabelo - Corte';

INSERT INTO servicos (codigo, nome, descricao, grupo_id, preco, duracao_minutos, comissao_profissional) 
SELECT 
  'SERV003', 
  'Escova Progressiva', 
  'Alisamento com escova progressiva', 
  id, 
  250.00, 
  180, 
  40.00
FROM grupos_servicos WHERE nome = 'Cabelo - Químicas';

INSERT INTO servicos (codigo, nome, descricao, grupo_id, preco, duracao_minutos, comissao_profissional) 
SELECT 
  'SERV004', 
  'Hidratação Profunda', 
  'Tratamento hidratante intensivo', 
  id, 
  60.00, 
  45, 
  50.00
FROM grupos_servicos WHERE nome = 'Cabelo - Tratamento';

INSERT INTO servicos (codigo, nome, descricao, grupo_id, preco, duracao_minutos, comissao_profissional) 
SELECT 
  'SERV005', 
  'Manicure Completa', 
  'Manicure com esmaltação', 
  id, 
  35.00, 
  45, 
  60.00
FROM grupos_servicos WHERE nome = 'Unhas - Manicure';

-- Pacote exemplo
INSERT INTO pacotes_servicos (codigo, nome, descricao, preco_total, duracao_total_minutos, cor, icone) VALUES
  ('PKG001', 'Dia de Beleza Completo', 'Corte + Hidratação + Manicure + Pedicure', 180.00, 210, '#EC4899', 'sparkles');

-- Itens do pacote
INSERT INTO pacotes_servicos_itens (pacote_id, servico_id, quantidade, ordem)
SELECT 
  (SELECT id FROM pacotes_servicos WHERE codigo = 'PKG001'),
  id,
  1,
  1
FROM servicos WHERE codigo = 'SERV001';

INSERT INTO pacotes_servicos_itens (pacote_id, servico_id, quantidade, ordem)
SELECT 
  (SELECT id FROM pacotes_servicos WHERE codigo = 'PKG001'),
  id,
  1,
  2
FROM servicos WHERE codigo = 'SERV004';

INSERT INTO pacotes_servicos_itens (pacote_id, servico_id, quantidade, ordem)
SELECT 
  (SELECT id FROM pacotes_servicos WHERE codigo = 'PKG001'),
  id,
  1,
  3
FROM servicos WHERE codigo = 'SERV005';

-- Recalcular totais do pacote
SELECT calcular_totais_pacote(id) FROM pacotes_servicos WHERE codigo = 'PKG001';

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE grupos_servicos IS 'Grupos/categorias de serviços para organização';
COMMENT ON TABLE servicos IS 'Cadastro completo de serviços com preços, duração e comissão';
COMMENT ON TABLE pacotes_servicos IS 'Pacotes promocionais com múltiplos serviços';
COMMENT ON TABLE pacotes_servicos_itens IS 'Serviços incluídos em cada pacote';
COMMENT ON TABLE servicos_produtos IS 'Produtos utilizados em cada serviço';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
  'grupos_servicos' as tabela,
  COUNT(*) as registros
FROM grupos_servicos
UNION ALL
SELECT 
  'servicos' as tabela,
  COUNT(*) as registros
FROM servicos
UNION ALL
SELECT 
  'pacotes_servicos' as tabela,
  COUNT(*) as registros
FROM pacotes_servicos
UNION ALL
SELECT 
  'pacotes_servicos_itens' as tabela,
  COUNT(*) as registros
FROM pacotes_servicos_itens;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
