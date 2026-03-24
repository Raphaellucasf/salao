// @ts-nocheck - Supabase types incomplete for this project
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// =====================================================
// API DE AGENDAMENTOS - DIMAS DONA CONCEPT
// Com suporte a bloqueio duplo (MegaHair)
// =====================================================

// GET - Lista agendamentos com filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('unit_id');
    const professionalId = searchParams.get('professional_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const clientId = searchParams.get('client_id');

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        profissional:profissionais(id, nome),
        cliente:clientes(id, nome, telefone)
      `)
      .order('data_agendamento', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (professionalId) {
      query = query.eq('profissional_id', professionalId);
    }
    if (status) query = query.eq('status', status);
    if (date) query = query.eq('data_agendamento', date);
    if (clientId) query = query.eq('cliente_id', clientId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agendamentos: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Cria novo agendamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      professional_id,
      service_id,
      appointment_date,
      start_time,
      client_name,
      client_phone,
      client_id,
      notes,
      internal_notes
    } = body;

    // Validação
    if (!professional_id || !appointment_date || !start_time || !client_name || !client_phone) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Buscar duração do serviço
    let duracao_minutos = 60;
    if (service_id) {
      const { data: service } = await supabase
        .from('servicos')
        .select('duracao_minutos, nome')
        .eq('id', service_id)
        .single();
      if (service) duracao_minutos = service.duracao_minutos || 60;
    }

    // Calcular hora_fim
    const [hours, minutes] = start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duracao_minutos;
    const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Verificar conflito
    const { data: conflicts } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', professional_id)
      .eq('data_agendamento', appointment_date)
      .or(`and(hora_inicio.lte.${start_time},hora_fim.gt.${start_time}),and(hora_inicio.lt.${end_time},hora_fim.gte.${end_time})`)
      .neq('status', 'cancelado');

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 409 });
    }

    // Criar agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert({
        profissional_id: professional_id,
        cliente_id: client_id || null,
        data_agendamento: appointment_date,
        hora_inicio: start_time,
        hora_fim: end_time,
        cliente_nome: client_name,
        cliente_telefone: client_phone,
        observacoes: notes,
        observacoes_internas: internal_notes,
        status: 'agendado'
      })
      .select(`*, profissional:profissionais(nome)`)
      .single();

    if (agendamentoError) {
      return NextResponse.json({ error: agendamentoError.message }, { status: 500 });
    }

    // Disparar webhook (n8n)
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment.created',
          data: {
            appointment_id: agendamento.id,
            client_name,
            client_phone,
            appointment_date,
            start_time,
            professional: (agendamento as any).profissional?.nome
          }
        })
      }).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json(
      { agendamento, message: 'Agendamento criado com sucesso' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
