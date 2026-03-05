-- ================================================
-- SCHEMA DE COMANDAS - SISTEMA DIMAS
-- Execute este script no Supabase SQL Editor
-- ================================================

-- TABELA DE COMANDAS
CREATE TABLE IF NOT EXISTS comandas (
  id BIGSERIAL PRIMARY KEY,
  numero_comanda INTEGER NOT NULL UNIQUE,
  cliente_id BIGINT REFERENCES clientes(id),
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
  id BIGSERIAL PRIMARY KEY,
  comanda_id BIGINT REFERENCES comandas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) CHECK (tipo IN ('servico', 'produto', 'pacote')),
  item_id TEXT, -- Armazena o ID como texto (pode ser UUID de serviço ou BIGINT de produto)
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  profissional_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_cliente ON comandas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_comandas_data ON comandas(data_abertura);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda ON comanda_itens(comanda_id);

-- Comentários
COMMENT ON TABLE comandas IS 'Comandas abertas no salão para controle de consumo';
COMMENT ON TABLE comanda_itens IS 'Itens adicionados às comandas (serviços, produtos, pacotes)';
COMMENT ON COLUMN comanda_itens.item_id IS 'ID do item (UUID para serviços, BIGINT para produtos) - armazenado como texto';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_comandas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_comandas_updated_at ON comandas;
CREATE TRIGGER trigger_update_comandas_updated_at
  BEFORE UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_comandas_updated_at();

-- Sequência para número da comanda (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'comandas_numero_seq') THEN
    CREATE SEQUENCE comandas_numero_seq START WITH 1;
  END IF;
END $$;

-- Função para gerar próximo número de comanda
CREATE OR REPLACE FUNCTION gerar_numero_comanda()
RETURNS INTEGER AS $$
DECLARE
  proximo_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_comanda), 0) + 1 INTO proximo_numero FROM comandas;
  RETURN proximo_numero;
END;
$$ LANGUAGE plpgsql;

-- Função para auto-gerar número da comanda antes de inserir
CREATE OR REPLACE FUNCTION set_numero_comanda()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_comanda IS NULL OR NEW.numero_comanda = 0 THEN
    NEW.numero_comanda := gerar_numero_comanda();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número da comanda automaticamente
DROP TRIGGER IF EXISTS trigger_set_numero_comanda ON comandas;
CREATE TRIGGER trigger_set_numero_comanda
  BEFORE INSERT ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION set_numero_comanda();

-- Habilitar RLS (Row Level Security)
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo para usuários autenticados e anônimos)
DROP POLICY IF EXISTS "Permitir tudo em comandas para usuários autenticados" ON comandas;
CREATE POLICY "Permitir tudo em comandas para usuários autenticados"
  ON comandas
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em comanda_itens para usuários autenticados" ON comanda_itens;
CREATE POLICY "Permitir tudo em comanda_itens para usuários autenticados"
  ON comanda_itens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Schema de Comandas criado com sucesso!';
END $$;
