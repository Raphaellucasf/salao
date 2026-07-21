create or replace function public.start_appointment_atomic(p_appointment_id uuid,p_admin_id uuid)
returns jsonb language plpgsql set search_path=pg_catalog,public as $$
declare v_appointment public.agendamentos%rowtype;v_command public.comandas%rowtype;
begin
 select * into v_appointment from public.agendamentos where id=p_appointment_id for update;
 if not found then raise exception using errcode='P0002',message='APPOINTMENT_NOT_FOUND';end if;
 if v_appointment.comanda_id is not null then
  select * into v_command from public.comandas where id=v_appointment.comanda_id;
  return jsonb_build_object('duplicate',true,'comanda_id',v_command.id,'numero_comanda',v_command.numero_comanda);
 end if;
 if v_appointment.status in ('cancelado','concluido') then
  raise exception using errcode='23514',message='APPOINTMENT_NOT_STARTABLE';end if;
 insert into public.comandas(cliente_id,cliente_nome,status,subtotal,desconto,total,observacoes,criado_por)
 values(v_appointment.cliente_id,v_appointment.cliente_nome,'aberta',coalesce(v_appointment.valor_total,0),0,
  coalesce(v_appointment.valor_total,0),v_appointment.observacoes,p_admin_id) returning * into v_command;
 update public.agendamentos set comanda_id=v_command.id,status='em_andamento',updated_at=clock_timestamp()
  where id=p_appointment_id;
 update public.comandas set profissional_id=v_appointment.profissional_id,auxiliar_id=v_appointment.auxiliar_id,
  data_agendamento=v_appointment.data_agendamento,hora_inicio=v_appointment.hora_inicio,
  updated_at=clock_timestamp() where id=v_command.id;
 return jsonb_build_object('duplicate',false,'comanda_id',v_command.id,'numero_comanda',v_command.numero_comanda);
end;$$;
revoke all on function public.start_appointment_atomic(uuid,uuid) from public,anon,authenticated;
grant execute on function public.start_appointment_atomic(uuid,uuid) to service_role;

create or replace function public.delete_standalone_appointment_atomic(p_appointment_id uuid)
returns jsonb language plpgsql set search_path=pg_catalog,public as $$
declare v_appointment public.agendamentos%rowtype;
begin
 select * into v_appointment from public.agendamentos where id=p_appointment_id for update;
 if not found then raise exception using errcode='P0002',message='APPOINTMENT_NOT_FOUND';end if;
 if v_appointment.comanda_id is not null then
  raise exception using errcode='23514',message='APPOINTMENT_HAS_COMANDA';end if;
 if v_appointment.status='concluido' then
  raise exception using errcode='23514',message='COMPLETED_APPOINTMENT_CANNOT_BE_DELETED';end if;
 delete from public.agendamentos where id=p_appointment_id;
 return jsonb_build_object('appointment_id',p_appointment_id);
end;$$;
revoke all on function public.delete_standalone_appointment_atomic(uuid) from public,anon,authenticated;
grant execute on function public.delete_standalone_appointment_atomic(uuid) to service_role;
