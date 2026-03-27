-- ============================================================
-- MIGRAÇÃO: Adicionar campo servicos_habilitados em profissionais
-- 
-- Contexto:
--   - profissionais.grupos (JSONB string[]) = permissão de AUXILIAR no grupo inteiro
--   - profissionais.servicos_habilitados (JSONB uuid[]) = permissão de PRINCIPAL
--     nos serviços específicos cadastrados
--
-- Executar no Supabase SQL Editor (projeto: otimiza-beauty)
-- ============================================================

-- 1. Adicionar coluna
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS servicos_habilitados JSONB DEFAULT '[]'::jsonb;

-- 2. Índice GIN para buscas eficientes (ex: "quem pode ser Principal no serviço X?")
CREATE INDEX IF NOT EXISTS idx_profissionais_servicos_habilitados
  ON profissionais USING GIN (servicos_habilitados);

-- 3. Comentário descritivo
COMMENT ON COLUMN profissionais.servicos_habilitados IS
  'Array de UUIDs de serviços onde o profissional pode atuar como Principal (responsável e comissão cheia). '
  'Pertencer ao grupo (campo grupos) já concede permissão de Auxiliar em todos os serviços do grupo.';

-- 4. Verificar resultado
SELECT id, nome, grupos, servicos_habilitados
FROM profissionais
ORDER BY nome
LIMIT 10;
