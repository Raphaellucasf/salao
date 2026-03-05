-- ================================================
-- FIX URGENTE: Alterar tipo de item_id para TEXT
-- Execute ESTE script no Supabase SQL Editor AGORA
-- ================================================

-- IMPORTANTE: Este script resolve o erro:
-- "invalid input syntax for type bigint: UUID..."

-- 1. Remover constraint de foreign key se existir
ALTER TABLE comanda_itens DROP CONSTRAINT IF EXISTS comanda_itens_item_id_fkey;

-- 2. Converter coluna item_id para TEXT
ALTER TABLE comanda_itens 
  ALTER COLUMN item_id TYPE TEXT USING item_id::TEXT;

-- Mensagem de sucesso
SELECT 'Coluna item_id convertida para TEXT com sucesso! ✅' AS status;
