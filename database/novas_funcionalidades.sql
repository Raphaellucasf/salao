-- ================================================
-- NOVAS FUNCIONALIDADES - SISTEMA DIMAS
-- ================================================

-- TABELA DE COMANDAS
CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_comanda INTEGER NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome VARCHAR(255),
  profissional_id UUID REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  subtotal DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITENS DA COMANDA
CREATE TABLE IF NOT EXISTS comanda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) CHECK (tipo IN ('servico', 'produto', 'pacote')),
  item_id UUID,
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  profissional_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE PACOTES
CREATE TABLE IF NOT EXISTS pacotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  validade_dias INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERVIÇOS DO PACOTE
CREATE TABLE IF NOT EXISTS pacote_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pacote_id UUID REFERENCES pacotes(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id),
  servico_nome VARCHAR(255) NOT NULL,
  quantidade INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE CONTAS A RECEBER
CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome VARCHAR(255),
  descricao VARCHAR(255) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  valor_pendente DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago', 'vencido')),
  origem VARCHAR(50), -- 'comanda', 'venda', 'servico'
  origem_id UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECEBIMENTOS DA CONTA
CREATE TABLE IF NOT EXISTS conta_recebimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID REFERENCES contas_receber(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  metodo_pagamento VARCHAR(50) NOT NULL,
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE CHEQUES
CREATE TABLE IF NOT EXISTS cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) CHECK (tipo IN ('recebido', 'emitido')),
  numero VARCHAR(50) NOT NULL,
  banco VARCHAR(100) NOT NULL,
  agencia VARCHAR(20),
  conta VARCHAR(20),
  nominal_a VARCHAR(255),
  valor DECIMAL(10,2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_compensacao DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'devolvido', 'cancelado')),
  cliente_id UUID REFERENCES clientes(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HISTÓRICO DE VENDAS (para controle de estornos)
CREATE TABLE IF NOT EXISTS vendas_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id),
  produto_nome VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome VARCHAR(255),
  metodo_pagamento VARCHAR(50),
  usuario_id UUID REFERENCES usuarios(id),
  estornada BOOLEAN DEFAULT false,
  data_estorno TIMESTAMP WITH TIME ZONE,
  motivo_estorno TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_data_abertura ON comandas(data_abertura);
CREATE INDEX IF NOT EXISTS idx_comandas_cliente ON comandas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_comandas_profissional ON comandas(profissional_id);

CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda ON comanda_itens(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_tipo ON comanda_itens(tipo);

CREATE INDEX IF NOT EXISTS idx_pacotes_ativo ON pacotes(ativo);

CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);

CREATE INDEX IF NOT EXISTS idx_cheques_tipo ON cheques(tipo);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_vencimento ON cheques(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_vendas_estornada ON vendas_produtos(estornada);
CREATE INDEX IF NOT EXISTS idx_vendas_created ON vendas_produtos(created_at);

-- ================================================
-- SEQUÊNCIA PARA NÚMERO DE COMANDA
-- ================================================

CREATE SEQUENCE IF NOT EXISTS comandas_numero_seq START WITH 1;

-- ================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comandas_updated_at BEFORE UPDATE ON comandas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacotes_updated_at BEFORE UPDATE ON pacotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON contas_receber
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cheques_updated_at BEFORE UPDATE ON cheques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DADOS INICIAIS - PACOTES EXEMPLO
-- ================================================

INSERT INTO pacotes (nome, descricao, preco, validade_dias) VALUES
  ('Pacote Corte e Barba', 'Corte de cabelo masculino + Barba completa', 80.00, 30),
  ('Pacote Hidratação Completa', 'Lavagem + Hidratação + Escova', 150.00, 45),
  ('Pacote Coloração Premium', 'Coloração + Corte + Finalização', 280.00, 60),
  ('Pacote Noiva', 'Penteado + Maquiagem + Unha', 350.00, 90)
ON CONFLICT DO NOTHING;

-- ================================================
-- COMENTÁRIOS NAS TABELAS
-- ================================================

COMMENT ON TABLE comandas IS 'Comandas abertas no salão para controle de consumo';
COMMENT ON TABLE comanda_itens IS 'Itens adicionados em cada comanda';
COMMENT ON TABLE pacotes IS 'Pacotes de serviços combinados';
COMMENT ON TABLE pacote_servicos IS 'Serviços incluídos em cada pacote';
COMMENT ON TABLE contas_receber IS 'Contas a receber de clientes';
COMMENT ON TABLE conta_recebimentos IS 'Pagamentos recebidos das contas';
COMMENT ON TABLE cheques IS 'Controle de cheques recebidos e emitidos';
COMMENT ON TABLE vendas_produtos IS 'Histórico de vendas de produtos para controle de estornos';
