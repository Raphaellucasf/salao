import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRequestId, logSecurityEvent, toErrorDetails } from '@/lib/observability';

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

// GET — lista agendamentos (com filtros opcionais)
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = createServerSupabase(authResult.unitId);
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const date   = searchParams.get('date');

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        profissional:profissionais(id, nome),
        cliente:clientes(id, nome, telefone)
      `)
      .eq('unit_id', authResult.unitId)
      .order('data_agendamento', { ascending: true });

    if (status) query = query.eq('status', status);
    if (date)   query = query.eq('data_agendamento', date);

    const { data, error } = await query;
    if (error?.code === '23P01') {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 409 });
    }
    if (error) {
      return NextResponse.json({ error: 'Não foi possível criar o agendamento' }, { status: 500 });
    }

    return NextResponse.json({ agendamentos: data });
  } catch (error: unknown) {
    logSecurityEvent({ event: 'appointment.list_failure', route: request.nextUrl.pathname, status: 500, requestId, ...toErrorDetails(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — cria novo agendamento via fluxo público /agendar
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const catalogDb = createServerSupabase() as unknown as SupabaseClient;
    const body = await request.json();
    const {
      professional_id,
      service_id,
      appointment_date,
      start_time,
      client_name,
      client_phone,
      notes,
    } = body;

    const normalizedName = typeof client_name === 'string' ? client_name.trim() : '';
    const normalizedPhone = typeof client_phone === 'string' ? client_phone.replace(/\D/g, '') : '';
    const normalizedNotes = typeof notes === 'string' ? notes.trim() : '';

    if (
      !professional_id ||
      !service_id ||
      typeof appointment_date !== 'string' ||
      typeof start_time !== 'string' ||
      !isValidDate(appointment_date) ||
      !isValidTime(start_time) ||
      appointment_date < new Date().toISOString().slice(0, 10) ||
      normalizedName.length < 2 ||
      normalizedName.length > 120 ||
      normalizedPhone.length < 10 ||
      normalizedPhone.length > 13 ||
      normalizedNotes.length > 1000
    ) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Busca serviço para calcular hora_fim e montar JSONB
    const { data: serviceData, error: serviceError } = await catalogDb
      .from('servicos')
      .select('id, nome, duracao_minutos, preco, unit_id')
      .eq('id', service_id)
      .eq('ativo', true)
      .single();

    if (serviceError || !serviceData) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }
    const service = serviceData as {
      id: string; nome: string; duracao_minutos: number; preco: number; unit_id: string;
    };
    const supabase = createServerSupabase(service.unit_id);
    const { data: professional, error: professionalError } = await supabase
      .from('profissionais').select('id').eq('id', professional_id)
      .eq('unit_id', service.unit_id).eq('ativo', true).maybeSingle();
    if (professionalError || !professional) {
      return NextResponse.json({ error: 'Profissional não encontrado para esta unidade' }, { status: 404 });
    }

    const durationMinutes = Number(service.duracao_minutos);
    const servicePrice = Number(service.preco);
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 ||
      durationMinutes > 720 ||
      !Number.isFinite(servicePrice) ||
      servicePrice < 0
    ) {
      return NextResponse.json({ error: 'Serviço com configuração inválida' }, { status: 409 });
    }

    // Calcula hora_fim
    const [h, m] = start_time.split(':').map(Number);
    const endMin  = h * 60 + m + durationMinutes;
    if (endMin > 24 * 60) {
      return NextResponse.json({ error: 'Horário ultrapassa o fim do dia' }, { status: 400 });
    }
    const end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    // Verifica conflitos: novo bloco [start, end) sobrepõe existente se
    // existente.hora_inicio < novo.end  AND  existente.hora_fim > novo.start
    const { data: conflicts, error: conflictsError } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('unit_id', service.unit_id)
      .eq('profissional_id', professional_id)
      .eq('data_agendamento', appointment_date)
      .lt('hora_inicio', `${end_time}:00`)
      .gt('hora_fim', `${start_time}:00`)
      .neq('status', 'cancelado');

    if (conflictsError) {
      logSecurityEvent({ event: 'appointment.conflict_check_failure', route: request.nextUrl.pathname, status: 503, requestId, unitId: service.unit_id, ...toErrorDetails(conflictsError) });
      return NextResponse.json({ error: 'Não foi possível validar a disponibilidade' }, { status: 503 });
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 409 });
    }

    // Upsert de cliente: busca por telefone, cria se não existir
    let cliente_id: number | null = null;
    const { data: clienteExistente, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('unit_id', service.unit_id)
      .eq('telefone', normalizedPhone)
      .maybeSingle();

    if (clienteError) {
      return NextResponse.json({ error: 'Não foi possível validar o cliente' }, { status: 503 });
    }

    if (clienteExistente) {
      cliente_id = clienteExistente.id;
    } else {
      const { data: novoCliente, error: novoClienteError } = await supabase
        .from('clientes')
        .insert([{ nome: normalizedName, telefone: normalizedPhone, ativo: true, unit_id: service.unit_id }])
        .select('id')
        .single();
      if (novoClienteError || !novoCliente) {
        // Outra requisição pode ter criado o mesmo telefone entre o SELECT e o INSERT.
        const { data: clienteConcorrente } = await supabase
          .from('clientes')
          .select('id')
          .eq('unit_id', service.unit_id)
          .eq('telefone', normalizedPhone)
          .maybeSingle();
        if (!clienteConcorrente) {
          return NextResponse.json({ error: 'Não foi possível cadastrar o cliente' }, { status: 503 });
        }
        cliente_id = clienteConcorrente.id;
      } else {
        cliente_id = novoCliente.id;
      }
    }

    // Cria agendamento com todos os campos obrigatórios
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        unit_id: service.unit_id,
        profissional_id: professional_id,
        cliente_id,
        data_agendamento: appointment_date,
        hora_inicio: `${start_time}:00`,
        hora_fim:    `${end_time}:00`,
        duracao_total: durationMinutes,
        servicos: [
          {
            id:      service.id,
            nome:    service.nome,
            duracao: durationMinutes,
            valor:   servicePrice,
          },
        ],
        valor_total:      servicePrice,
        cliente_nome:     normalizedName,
        cliente_telefone: normalizedPhone,
        observacoes:      normalizedNotes || null,
        status:           'agendado',
      })
      .select()
      .single();

    if (error?.code === '23P01') {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 409 });
    }
    if (error) return NextResponse.json({ error: 'Não foi possível criar o agendamento' }, { status: 500 });

    // Dispara webhook n8n (não bloqueia a resposta)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl && webhookUrl !== 'your_n8n_webhook_url_here') {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment.created',
          data: {
            appointment_id:   data.id,
            client_name: normalizedName,
            client_phone: normalizedPhone,
            appointment_date,
            start_time,
            service_name:     service.nome,
            service_price:    servicePrice,
          },
        }),
      }).catch((error: unknown) => logSecurityEvent({
        event: 'integration.webhook_failure', route: request.nextUrl.pathname, status: 502,
        requestId, unitId: service.unit_id, integration: 'n8n', ...toErrorDetails(error),
      }));
    }

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (err: unknown) {
    logSecurityEvent({ event: 'appointment.create_failure', route: request.nextUrl.pathname, status: 500, requestId, ...toErrorDetails(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
