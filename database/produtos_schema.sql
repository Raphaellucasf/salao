-- =====================================================
-- SCHEMA COMPLETO DE PRODUTOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- TABELA DE GRUPOS DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS grupos_produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  cor VARCHAR(7), -- Hex color para visualização
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grupos_produtos_ativo ON grupos_produtos(ativo);

-- =====================================================
-- TABELA DE FORNECEDORES
-- =====================================================

CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados Principais
  nome VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  
  -- Contato
  email VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  
  -- Endereço
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  
  -- Dados Comerciais
  nome_representante VARCHAR(255),
  telefone_representante VARCHAR(20),
  email_representante VARCHAR(255),
  
  -- Observações
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);

-- =====================================================
-- TABELA DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE,
  codigo_barras VARCHAR(50) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Classificação
  grupo_id UUID REFERENCES grupos_produtos(id),
  categoria VARCHAR(100),
  tipo VARCHAR(50) DEFAULT 'revenda', -- revenda, uso_interno, insumo
  
  -- Fornecedor
  fornecedor_id UUID REFERENCES fornecedores(id),
  
  -- Estoque
  quantidade INTEGER DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 0,
  unidade_medida VARCHAR(20) DEFAULT 'UN', -- UN, CX, L, ML, KG, G
  
  -- Valores
  preco_custo DECIMAL(10, 2) DEFAULT 0,
  preco_venda DECIMAL(10, 2) NOT NULL,
  margem_lucro DECIMAL(5, 2),
  
  -- Configurações
  controla_estoque BOOLEAN DEFAULT true,
  permite_venda_estoque_negativo BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  
  -- Comissão
  gera_comissao BOOLEAN DEFAULT false,
  percentual_comissao DECIMAL(5, 2),
  
  -- Localização
  localizacao VARCHAR(100), -- Prateleira, gaveta, etc
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_grupo ON produtos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

-- =====================================================
-- TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  produto_id UUID NOT NULL REFERENCES produtos(id),
  
  tipo VARCHAR(50) NOT NULL, -- entrada, saida, ajuste, venda, uso_interno, devolucao, perda
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER NOT NULL,
  quantidade_atual INTEGER NOT NULL,
  
  valor_unitario DECIMAL(10, 2),
  valor_total DECIMAL(10, 2),
  
  motivo TEXT,
  documento VARCHAR(100), -- Nota fiscal, número pedido, etc
  
  usuario_id UUID,
  
  -- Referências
  venda_id UUID, -- Se for uma venda
  cliente_id UUID, -- Se for venda ou uso em cliente
  profissional_id UUID, -- Se foi usado por profissional
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_tipo ON estoque_movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_data ON estoque_movimentacoes(created_at DESC);

-- =====================================================
-- TABELA DE ALERTAS DE ESTOQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS estoque_alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  produto_id UUID NOT NULL REFERENCES produtos(id),
  tipo VARCHAR(50) NOT NULL, -- estoque_baixo, estoque_critico, estoque_zerado, vencimento_proximo
  
  mensagem TEXT NOT NULL,
  visualizado BOOLEAN DEFAULT false,
  resolvido BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_produto ON estoque_alertas(produto_id);
CREATE INDEX IF NOT EXISTS idx_alertas_visualizado ON estoque_alertas(visualizado);
CREATE INDEX IF NOT EXISTS idx_alertas_resolvido ON estoque_alertas(resolvido);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS grupos_produtos_updated_at ON grupos_produtos;
CREATE TRIGGER grupos_produtos_updated_at BEFORE UPDATE ON grupos_produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS fornecedores_updated_at ON fornecedores;
CREATE TRIGGER fornecedores_updated_at BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS produtos_updated_at ON produtos;
CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA REGISTRAR MOVIMENTAÇÃO DE ESTOQUE
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(
  p_produto_id UUID,
  p_tipo VARCHAR,
  p_quantidade INTEGER,
  p_valor_unitario DECIMAL,
  p_motivo TEXT,
  p_documento VARCHAR,
  p_usuario_id UUID,
  p_venda_id UUID DEFAULT NULL,
  p_cliente_id UUID DEFAULT NULL,
  p_profissional_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_quantidade_anterior INTEGER;
  v_quantidade_atual INTEGER;
  v_controla_estoque BOOLEAN;
BEGIN
  -- Buscar quantidade atual e se controla estoque
  SELECT quantidade, controla_estoque INTO v_quantidade_anterior, v_controla_estoque
  FROM produtos
  WHERE id = p_produto_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  
  -- Se não controla estoque, não faz nada
  IF NOT v_controla_estoque THEN
    RETURN;
  END IF;
  
  -- Calcular nova quantidade
  IF p_tipo IN ('entrada', 'ajuste_positivo', 'devolucao') THEN
    v_quantidade_atual := v_quantidade_anterior + p_quantidade;
  ELSIF p_tipo IN ('saida', 'ajuste_negativo', 'venda', 'uso_interno', 'perda') THEN
    v_quantidade_atual := v_quantidade_anterior - p_quantidade;
  ELSE
    v_quantidade_atual := v_quantidade_anterior;
  END IF;
  
  -- Atualizar quantidade do produto
  UPDATE produtos
  SET quantidade = v_quantidade_atual
  WHERE id = p_produto_id;
  
  -- Registrar movimentação
  INSERT INTO estoque_movimentacoes (
    produto_id, tipo, quantidade, quantidade_anterior, quantidade_atual,
    valor_unitario, valor_total, motivo, documento,
    usuario_id, venda_id, cliente_id, profissional_id
  ) VALUES (
    p_produto_id, p_tipo, p_quantidade, v_quantidade_anterior, v_quantidade_atual,
    p_valor_unitario, (p_valor_unitario * p_quantidade), p_motivo, p_documento,
    p_usuario_id, p_venda_id, p_cliente_id, p_profissional_id
  );
  
  -- Criar alerta se estoque baixo
  IF v_quantidade_atual <= (SELECT quantidade_minima FROM produtos WHERE id = p_produto_id) THEN
    INSERT INTO estoque_alertas (produto_id, tipo, mensagem)
    VALUES (p_produto_id, 'estoque_baixo', 'Estoque abaixo do mínimo');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Grupos de produtos
INSERT INTO grupos_produtos (nome, descricao, cor) VALUES
  ('Shampoos', 'Shampoos diversos', '#3B82F6'),
  ('Condicionadores', 'Condicionadores e finalizadores', '#8B5CF6'),
  ('Tratamentos', 'Máscaras e tratamentos', '#EC4899'),
  ('Coloração', 'Tintas e oxigenadas', '#F59E0B'),
  ('Alisamento', 'Progressivas e alisantes', '#10B981'),
  ('Styling', 'Produtos de finalização', '#6366F1'),
  ('Ferramentas', 'Escovas, chapinhas, etc', '#64748B'),
  ('Descartáveis', 'Luvas, toucas, papel', '#78716C')
ON CONFLICT (nome) DO NOTHING;

-- Fornecedores exemplo
INSERT INTO fornecedores (nome, nome_fantasia, cnpj, telefone, email) VALUES
  ('Distribuidora Beauty LTDA', 'Beauty Dist', '12.345.678/0001-90', '(11) 3000-0000', 'contato@beautydist.com.br'),
  ('Professional Hair Products', 'ProHair', '98.765.432/0001-10', '(11) 4000-0000', 'vendas@prohair.com.br')
ON CONFLICT (cnpj) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE grupos_produtos IS 'Grupos/categorias de produtos para organização';
COMMENT ON TABLE fornecedores IS 'Fornecedores de produtos';
COMMENT ON TABLE produtos IS 'Cadastro completo de produtos com controle de estoque';
COMMENT ON TABLE estoque_movimentacoes IS 'Histórico de todas as movimentações de estoque';
COMMENT ON TABLE estoque_alertas IS 'Alertas de estoque baixo, vencimento, etc';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
