-- =====================================================
-- TABELA DE SERVIÇOS
-- Sistema completo de gerenciamento de serviços
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
  intervalo_minimo INTEGER DEFAULT 0, -- minutos entre agendamentos
  
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_grupo ON servicos(grupo);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_nome ON servicos(nome);
CREATE INDEX IF NOT EXISTS idx_servicos_grupos_prof ON servicos USING GIN(grupos_profissionais);

-- Trigger para updated_at
CREATE TRIGGER servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário da tabela
COMMENT ON TABLE servicos IS 'Catálogo completo de serviços oferecidos pelo salão';

-- Dados de exemplo baseados na imagem
INSERT INTO servicos (codigo, nome, descricao, grupo, duracao, valor, custo, ativo) VALUES
  ('10', 'PENTEADO INFANTIL FESTA', '', 'CABELO FESTA', 30, 120.00, 0.00, true),
  ('11', 'PENTEADO PRESO', '', 'CABELO FESTA', 40, 150.00, 0.00, true),
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
  ('20', 'PROTOCOLO TRATAMLENTO PURIFICAÇÃO NA COR', '', 'TRATAMENTOS E TERAPIAS', 45, 233.00, 0.40, true)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar serviços criados
SELECT id, codigo, nome, grupo, duracao, valor FROM servicos ORDER BY codigo;
