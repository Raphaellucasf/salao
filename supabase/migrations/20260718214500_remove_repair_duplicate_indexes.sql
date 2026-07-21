-- Remove only the redundant copies introduced by repair_tenant_relationships.
-- The equivalent legacy indexes named idx_* remain in place.

drop index if exists public.anamneses_cliente_id_idx;
drop index if exists public.prontuarios_cliente_id_idx;
drop index if exists public.servico_etapas_servico_id_idx;
drop index if exists public.comanda_item_etapas_item_id_idx;
drop index if exists public.comanda_item_etapas_etapa_id_idx;
