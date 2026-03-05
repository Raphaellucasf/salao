-- ================================================
-- CORREÇÃO RLS E TRIGGER - COMANDAS
-- Execute APENAS este script no Supabase SQL Editor
-- ================================================

-- 1. CORRIGIR POLÍTICAS RLS (permitir para todos os usuários)
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

-- 2. CRIAR TRIGGER PARA AUTO-GERAR NÚMERO DA COMANDA
CREATE OR REPLACE FUNCTION set_numero_comanda()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_comanda IS NULL OR NEW.numero_comanda = 0 THEN
    SELECT COALESCE(MAX(numero_comanda), 0) + 1 INTO NEW.numero_comanda FROM comandas;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_numero_comanda ON comandas;
CREATE TRIGGER trigger_set_numero_comanda
  BEFORE INSERT ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION set_numero_comanda();

-- Mensagem de sucesso
SELECT 'Políticas RLS e Trigger configurados com sucesso! ✅' AS status;
