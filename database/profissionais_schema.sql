-- Tabela de Profissionais
-- Gerencia informações detalhadas dos profissionais do salão

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
  percentual_comissao DECIMAL(5, 2), -- Ex: 50.00 para 50%
  
  -- Grupos de Atuação (JSON array de strings)
  grupos JSONB DEFAULT '[]'::jsonb,
  
  -- Disponibilidade
  dias_trabalho INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Dom, 1=Seg, ..., 6=Sáb
  hora_inicio TIME DEFAULT '09:00',
  hora_fim TIME DEFAULT '18:00',
  
  -- Status e Observações
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profissionais_ativo ON profissionais(ativo);
CREATE INDEX IF NOT EXISTS idx_profissionais_email ON profissionais(email);
CREATE INDEX IF NOT EXISTS idx_profissionais_grupos ON profissionais USING GIN(grupos);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_profissionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profissionais_updated_at
  BEFORE UPDATE ON profissionais
  FOR EACH ROW
  EXECUTE FUNCTION update_profissionais_updated_at();

-- Comentários
COMMENT ON TABLE profissionais IS 'Tabela de profissionais do salão com informações completas';
COMMENT ON COLUMN profissionais.grupos IS 'Array JSON com os grupos de atuação do profissional';
COMMENT ON COLUMN profissionais.dias_trabalho IS 'Array de inteiros representando dias da semana (0=Dom, 1=Seg, ..., 6=Sáb)';
COMMENT ON COLUMN profissionais.percentual_comissao IS 'Percentual de comissão sobre serviços realizados';
