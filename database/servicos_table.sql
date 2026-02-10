-- =====================================================
-- TABELA DE SERVIÇOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações Básicas
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) NOT NULL,
  
  -- Duração e Preço
  duracao INTEGER NOT NULL DEFAULT 60, -- em minutos
  preco DECIMAL(10, 2) NOT NULL,
  
  -- Comissão
  comissao DECIMAL(5, 2) NOT NULL DEFAULT 50.00, -- percentual
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_nome ON servicos(nome);

-- Trigger para updated_at
CREATE TRIGGER servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE servicos IS 'Serviços disponíveis para agendamento vinculados aos profissionais e clientes';

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

INSERT INTO servicos (nome, descricao, categoria, duracao, preco, comissao, ativo) VALUES
-- Cabelo
('Corte Feminino', 'Corte de cabelo feminino com finalização', 'Cabelo', 60, 80.00, 50.00, true),
('Corte Masculino', 'Corte de cabelo masculino', 'Cabelo', 30, 40.00, 50.00, true),
('Escova', 'Escova modeladora', 'Cabelo', 45, 60.00, 50.00, true),
('Hidratação', 'Hidratação profunda', 'Cabelo', 60, 70.00, 50.00, true),
('Coloração Completa', 'Coloração de todo o cabelo', 'Cabelo', 120, 150.00, 50.00, true),
('Mechas', 'Aplicação de mechas', 'Cabelo', 180, 200.00, 50.00, true),
('Progressiva', 'Escova progressiva', 'Cabelo', 240, 300.00, 50.00, true),

-- Manicure e Pedicure
('Manicure', 'Manicure completa', 'Manicure', 45, 35.00, 50.00, true),
('Pedicure', 'Pedicure completa', 'Pedicure', 60, 45.00, 50.00, true),
('Manicure + Pedicure', 'Combo manicure e pedicure', 'Manicure', 90, 70.00, 50.00, true),
('Esmaltação em Gel', 'Aplicação de esmalte em gel', 'Manicure', 30, 50.00, 50.00, true),

-- Estética Facial
('Limpeza de Pele', 'Limpeza de pele profunda', 'Estética Facial', 90, 120.00, 50.00, true),
('Peeling', 'Peeling químico facial', 'Estética Facial', 60, 150.00, 50.00, true),
('Hidratação Facial', 'Hidratação profunda facial', 'Estética Facial', 60, 100.00, 50.00, true),

-- Estética Corporal
('Massagem Relaxante', 'Massagem corporal relaxante', 'Massagem', 60, 100.00, 50.00, true),
('Drenagem Linfática', 'Drenagem linfática corporal', 'Massagem', 60, 120.00, 50.00, true),

-- Depilação
('Depilação Perna Completa', 'Depilação com cera perna completa', 'Depilação', 45, 60.00, 50.00, true),
('Depilação Virilha', 'Depilação com cera região da virilha', 'Depilação', 20, 35.00, 50.00, true),
('Depilação Axilas', 'Depilação com cera axilas', 'Depilação', 15, 25.00, 50.00, true),
('Depilação Buço', 'Depilação com cera buço', 'Depilação', 10, 20.00, 50.00, true),

-- Sobrancelha
('Design de Sobrancelha', 'Design e modelagem de sobrancelhas', 'Sobrancelha', 30, 40.00, 50.00, true),
('Henna', 'Aplicação de henna nas sobrancelhas', 'Sobrancelha', 45, 50.00, 50.00, true),

-- Maquiagem
('Maquiagem Social', 'Maquiagem para eventos sociais', 'Maquiagem', 60, 120.00, 50.00, true),
('Maquiagem para Noiva', 'Maquiagem especial para noivas', 'Maquiagem', 90, 250.00, 50.00, true),

-- Micropigmentação
('Micropigmentação de Sobrancelhas', 'Micropigmentação fio a fio', 'Micropigmentação', 180, 800.00, 50.00, true),
('Retoque Micropigmentação', 'Retoque de micropigmentação', 'Micropigmentação', 90, 400.00, 50.00, true)

ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Ver serviços criados por categoria
SELECT categoria, COUNT(*) as quantidade, AVG(preco) as preco_medio
FROM servicos
WHERE ativo = true
GROUP BY categoria
ORDER BY categoria;
