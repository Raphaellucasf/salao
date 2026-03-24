// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// GET — lista agendamentos (com filtros opcionais)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
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
      .order('data_agendamento', { ascending: true });

    if (status) query = query.eq('status', status);
    if (date)   query = query.eq('data_agendamento', date);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ agendamentos: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — cria novo agendamento via fluxo público /agendar
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
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

    // Validação básica
    if (!professional_id || !service_id || !appointment_date || !start_time || !client_name || !client_phone) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Busca serviço para calcular hora_fim e montar JSONB
    const { data: service, error: serviceError } = await supabase
      .from('servicos')
      .select('id, nome, duracao_minutos, preco')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Calcula hora_fim
    const [h, m] = start_time.split(':').map(Number);
    const endMin  = h * 60 + m + service.duracao_minutos;
    const end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    // Verifica conflitos: novo bloco [start, end) sobrepõe existente se
    // existente.hora_inicio < novo.end  AND  existente.hora_fim > novo.start
    const { data: conflicts } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', professional_id)
      .eq('data_agendamento', appointment_date)
      .lt('hora_inicio', `${end_time}:00`)
      .gt('hora_fim', `${start_time}:00`)
      .neq('status', 'cancelado');

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 409 });
    }

    // Upsert de cliente: busca por telefone, cria se não existir
    let cliente_id: number | null = null;
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', client_phone)
      .maybeSingle();

    if (clienteExistente) {
      cliente_id = clienteExistente.id;
    } else {
      const { data: novoCliente } = await supabase
        .from('clientes')
        .insert([{ nome: client_name, telefone: client_phone, ativo: true }])
        .select('id')
        .single();
      if (novoCliente) cliente_id = novoCliente.id;
    }

    // Cria agendamento com todos os campos obrigatórios
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        profissional_id: professional_id,
        cliente_id,
        data_agendamento: appointment_date,
        hora_inicio: `${start_time}:00`,
        hora_fim:    `${end_time}:00`,
        duracao_total: service.duracao_minutos,
        servicos: [
          {
            id:      service.id,
            nome:    service.nome,
            duracao: service.duracao_minutos,
            valor:   service.preco,
          },
        ],
        valor_total:      service.preco,
        cliente_nome:     client_name,
        cliente_telefone: client_phone,
        observacoes:      notes ?? null,
        status:           'agendado',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
            client_name,
            client_phone,
            appointment_date,
            start_time,
            service_name:     service.nome,
            service_price:    service.preco,
          },
        }),
      }).catch(err => console.error('[n8n webhook]', err));
    }

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/appointments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
