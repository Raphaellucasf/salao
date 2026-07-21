-- Repair legacy relationships that could not enforce tenant consistency.
-- Clinical tables were created with UUID client references while clientes.id
-- is bigint; both tables are empty in the test preflight.

alter table public.anamneses
  alter column cliente_id type bigint using cliente_id::text::bigint;
alter table public.prontuarios
  alter column cliente_id type bigint using cliente_id::text::bigint;

alter table public.anamneses
  add constraint anamneses_cliente_id_fkey foreign key (cliente_id)
  references public.clientes(id) on delete restrict;
alter table public.prontuarios
  add constraint prontuarios_cliente_id_fkey foreign key (cliente_id)
  references public.clientes(id) on delete restrict;

-- Four stages referenced services that no longer exist. They were unreachable
-- application residue; remove them before installing the missing FK.
delete from public.servico_etapas se
where not exists (select 1 from public.servicos s where s.id=se.servico_id);

alter table public.servico_etapas
  add constraint servico_etapas_servico_id_fkey foreign key (servico_id)
  references public.servicos(id) on delete cascade;

alter table public.comanda_item_etapas
  add constraint comanda_item_etapas_item_id_fkey foreign key (comanda_item_id)
  references public.comanda_itens(id) on delete cascade,
  add constraint comanda_item_etapas_etapa_id_fkey foreign key (servico_etapa_id)
  references public.servico_etapas(id) on delete restrict,
  add constraint comanda_item_etapas_profissional_id_fkey foreign key (profissional_id)
  references public.profissionais(id) on delete restrict,
  add constraint comanda_item_etapas_auxiliar_id_fkey foreign key (auxiliar_id)
  references public.profissionais(id) on delete restrict;

-- These columns already have equivalent leading indexes in the legacy schema.
-- Do not create name-different duplicates: the existing indexes also satisfy
-- PostgreSQL's foreign-key lookup requirements.

create trigger tenant_fk_anamnese_cliente before insert or update on public.anamneses
for each row execute function private.enforce_parent_unit('cliente_id','public','clientes','id');
create trigger tenant_fk_prontuario_cliente before insert or update on public.prontuarios
for each row execute function private.enforce_parent_unit('cliente_id','public','clientes','id');
create trigger tenant_fk_servico_etapa before insert or update on public.servico_etapas
for each row execute function private.enforce_parent_unit('servico_id','public','servicos','id');
create trigger tenant_fk_comanda_item before insert or update on public.comanda_item_etapas
for each row execute function private.enforce_parent_unit('comanda_item_id','public','comanda_itens','id');
create trigger tenant_fk_comanda_servico_etapa before insert or update on public.comanda_item_etapas
for each row execute function private.enforce_parent_unit('servico_etapa_id','public','servico_etapas','id');
create trigger tenant_fk_comanda_profissional before insert or update on public.comanda_item_etapas
for each row execute function private.enforce_parent_unit('profissional_id','public','profissionais','id');
create trigger tenant_fk_comanda_auxiliar before insert or update on public.comanda_item_etapas
for each row execute function private.enforce_parent_unit('auxiliar_id','public','profissionais','id');
