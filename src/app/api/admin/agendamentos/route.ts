import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/api-auth';
import {createServerSupabase} from '@/lib/supabase-server';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const TIME=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
export async function POST(request:NextRequest){
 const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
 const body=await request.json().catch(()=>null);const id=body?.agendamento_id;
 if(typeof id!=='string'||!UUID.test(id))return NextResponse.json({error:'agendamento_id inválido'},{status:400});
 const {data,error}=await createServerSupabase(auth.unitId).rpc('start_appointment_atomic' as never,
  {p_appointment_id:id,p_admin_id:auth.id} as never);
 if(error){const status=error.message==='APPOINTMENT_NOT_FOUND'?404:
  error.message==='APPOINTMENT_NOT_STARTABLE'?409:500;
  return NextResponse.json({error:status===404?'Agendamento não encontrado':status===409?
   'Agendamento não pode ser iniciado':'Não foi possível iniciar o atendimento'},{status});}
 return NextResponse.json({ok:true,data});
}
export async function PATCH(request:NextRequest){
 const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
 const body=await request.json().catch(()=>null);
 const id=body?.agendamento_id;const date=body?.data_agendamento;
 const time=body?.hora_inicio;const professionalId=body?.profissional_id;
 if(typeof id!=='string'||!UUID.test(id)||typeof professionalId!=='string'||!UUID.test(professionalId)
  ||typeof date!=='string'||!DATE.test(date)||Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  ||typeof time!=='string'||!TIME.test(time)){
  return NextResponse.json({error:'Dados de reagendamento inválidos'},{status:400});
 }
 const {data,error}=await createServerSupabase(auth.unitId).rpc('move_appointment_atomic' as never,{
  p_appointment_id:id,p_date:date,p_start_time:time,
  p_professional_id:professionalId,p_unit_id:auth.unitId,
 } as never);
 if(error){
  const status=error.code==='23P01'?409:['APPOINTMENT_NOT_FOUND','PROFESSIONAL_NOT_FOUND'].includes(error.message)?404:
   ['APPOINTMENT_NOT_MOVABLE','INVALID_SCHEDULE'].includes(error.message)?409:500;
  const message=error.code==='23P01'?'O novo horário está ocupado':error.message==='APPOINTMENT_NOT_MOVABLE'?
   'Agendamentos cancelados ou concluídos não podem ser movidos':status===404?'Agendamento ou profissional não encontrado':
   'Não foi possível mover o agendamento';
  return NextResponse.json({error:message},{status});
 }
 return NextResponse.json({ok:true,data});
}

export async function DELETE(request:NextRequest){
 const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
 const id=request.nextUrl.searchParams.get('agendamento_id');
 if(!id||!UUID.test(id))return NextResponse.json({error:'agendamento_id inválido'},{status:400});
 const removeFromCalendar=request.nextUrl.searchParams.get('remove_from_calendar')==='true';
 if(removeFromCalendar){
  const {data,error}=await createServerSupabase(auth.unitId).rpc('remove_appointment_from_calendar_atomic' as never,
   {p_appointment_id:id,p_unit_id:auth.unitId} as never);
  if(error){const status=error.message==='APPOINTMENT_NOT_FOUND'?404:
   error.message==='OPEN_COMANDA_MUST_BE_CANCELLED'?409:500;
   return NextResponse.json({error:status===404?'Agendamento não encontrado':status===409?
    'Cancele a comanda aberta para remover este agendamento':'Não foi possível remover o agendamento da agenda'},{status});}
  return NextResponse.json({ok:true,data});
 }
 const {data,error}=await createServerSupabase(auth.unitId).rpc('delete_standalone_appointment_atomic' as never,
  {p_appointment_id:id} as never);
 if(error){const status=error.message==='APPOINTMENT_NOT_FOUND'?404:
  ['APPOINTMENT_HAS_COMANDA','COMPLETED_APPOINTMENT_CANNOT_BE_DELETED'].includes(error.message)?409:500;
  return NextResponse.json({error:status===404?'Agendamento não encontrado':status===409?
   'Agendamento vinculado ou concluído não pode ser excluído':'Não foi possível excluir o agendamento'},{status});}
 return NextResponse.json({ok:true,data});
}
