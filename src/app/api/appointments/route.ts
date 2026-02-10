import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// @ts-nocheck
// Nota: Os erros de tipo são temporários até que os tipos do Supabase sejam gerados
// Execute: npx supabase gen types typescript --project-id ID > src/types/supabase.ts

// GET - Lista todos os agendamentos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('unit_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = supabase
      .from('appointments')
      .select(`
        *,
        professional:professionals(*),
        service:services(*),
        client:users(*)
      `)
      .order('appointment_date', { ascending: true });

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Cria novo agendamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unit_id,
      professional_id,
      service_id,
      appointment_date,
      start_time,
      client_name,
      client_phone,
      notes
    } = body;

    // Validação básica
    if (!unit_id || !professional_id || !service_id || !appointment_date || !start_time || !client_name || !client_phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Busca o serviço para calcular o end_time
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .single();

    if (serviceError) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Calcula end_time
    const [hours, minutes] = start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Verifica conflitos de horário
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('professional_id', professional_id)
      .eq('appointment_date', appointment_date)
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`)
      .neq('status', 'cancelled');

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Horário indisponível' },
        { status: 409 }
      );
    }

    // Cria o agendamento
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        unit_id,
        professional_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        client_name,
        client_phone,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aqui você pode disparar o webhook para n8n
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment.created',
          data: {
            appointment_id: data.id,
            client_name,
            client_phone,
            appointment_date,
            start_time,
            service_id
          }
        })
      }).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
