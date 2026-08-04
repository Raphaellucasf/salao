-- A save_comanda_atomic grava a comanda em duas etapas: primeiro cria a linha
-- sem horário e depois atualiza data/profissional, após persistir os itens.
-- O schema de produção tinha a função do trigger, mas não o trigger em si.
-- Sem ele, o UPDATE final da RPC atualizava zero agendamentos e retornava 200.

create or replace function public.trigger_criar_agendamento_comanda()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.data_agendamento is not null
     and new.hora_inicio is not null
     and new.profissional_id is not null
     and not exists (
       select 1
         from public.agendamentos
        where comanda_id = new.id
     ) then
    perform public.criar_agendamento_da_comanda(new.id);
  end if;

  return new;
end;
$$;

revoke all on function public.trigger_criar_agendamento_comanda()
  from public, anon, authenticated;
grant execute on function public.trigger_criar_agendamento_comanda()
  to service_role;

drop trigger if exists trigger_criar_agendamento_comanda on public.comandas;
create trigger trigger_criar_agendamento_comanda
after insert or update of data_agendamento, hora_inicio, profissional_id
on public.comandas
for each row
execute function public.trigger_criar_agendamento_comanda();
