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
      .from('appointments')
      .select(`
        *,
        professional:professionals(
          id,
          user:users(full_name, avatar_url)
        ),
        secondary_professional:professionals!secondary_professional_id(
          id,
          user:users(full_name, avatar_url)
        ),
        service:services(
          id, name, duration_minutes, price, category, requires_double_booking
        ),
        client:users(
          id, full_name, phone, is_vip
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (unitId) query = query.eq('unit_id', unitId);
    if (professionalId) {
      query = query.or(`professional_id.eq.${professionalId},secondary_professional_id.eq.${professionalId}`);
    }
    if (status) query = query.eq('status', status);
    if (date) query = query.eq('appointment_date', date);
    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Cria novo agendamento (com suporte a bloqueio duplo)
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
      client_id,
      notes,
      internal_notes
    } = body;

    // =====================================================
    // 1. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
    // =====================================================
    if (!unit_id || !professional_id || !service_id || !appointment_date || !start_time || !client_name || !client_phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. BUSCAR INFORMAÇÕES DO SERVIÇO
    // =====================================================
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, requires_double_booking, required_professionals, is_vip_only, name')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // =====================================================
    // 3. VERIFICAR SE É CLIENTE VIP (se serviço exige)
    // =====================================================
    if (service.is_vip_only) {
      if (!client_id) {
        return NextResponse.json(
          { error: 'Este serviço é exclusivo para clientes VIP cadastrados' },
          { status: 403 }
        );
      }

      const { data: clientData } = await supabase
        .from('users')
        .select('is_vip')
        .eq('id', client_id)
        .single();

      if (!clientData?.is_vip) {
        return NextResponse.json(
          { error: 'Este serviço é exclusivo para clientes VIP' },
          { status: 403 }
        );
      }
    }

    // =====================================================
    // 4. CALCULAR END_TIME
    // =====================================================
    const [hours, minutes] = start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // =====================================================
    // 5. BLOQUEIO DUPLO (MEGAHAIR)
    // =====================================================
    let secondary_professional_id = null;
    let is_double_booking = false;

    if (service.requires_double_booking && service.required_professionals) {
      is_double_booking = true;
      const requiredProfs = service.required_professionals as string[];

      // Encontrar o segundo profissional (que não é o principal)
      secondary_professional_id = requiredProfs.find(id => id !== professional_id);

      if (!secondary_professional_id) {
        return NextResponse.json(
          { 
            error: `Este serviço (${service.name}) requer dois profissionais específicos. Verifique a configuração.`,
            service_name: service.name,
            required_professionals: requiredProfs
          },
          { status: 400 }
        );
      }

      // =====================================================
      // 6. VERIFICAR DISPONIBILIDADE DE AMBOS OS PROFISSIONAIS
      // =====================================================
      const professionalsToCheck = [professional_id, secondary_professional_id];

      for (const profId of professionalsToCheck) {
        // Verificar conflitos de agendamento
        const { data: conflicts } = await supabase
          .from('appointments')
          .select('id, client_name, start_time, end_time')
          .eq('appointment_date', appointment_date)
          .or(`professional_id.eq.${profId},secondary_professional_id.eq.${profId}`)
          .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`)
          .neq('status', 'cancelled');

        if (conflicts && conflicts.length > 0) {
          // Buscar nome do profissional
          const { data: prof } = await supabase
            .from('professionals')
            .select('user:users(full_name)')
            .eq('id', profId)
            .single();

          return NextResponse.json(
            {
              error: `Horário indisponível para ${prof?.user?.full_name || 'profissional'}`,
              conflicting_appointment: conflicts[0],
              professional_id: profId
            },
            { status: 409 }
          );
        }

        // Verificar bloqueios de horário
        const { data: blocked } = await supabase
          .from('blocked_times')
          .select('id, reason')
          .eq('professional_id', profId)
          .gte('end_datetime', `${appointment_date}T${start_time}`)
          .lte('start_datetime', `${appointment_date}T${end_time}`);

        if (blocked && blocked.length > 0) {
          const { data: prof } = await supabase
            .from('professionals')
            .select('user:users(full_name)')
            .eq('id', profId)
            .single();

          return NextResponse.json(
            {
              error: `Horário bloqueado para ${prof?.user?.full_name || 'profissional'}`,
              reason: blocked[0].reason
            },
            { status: 409 }
          );
        }
      }
    } else {
      // =====================================================
      // 7. VERIFICAÇÃO PADRÃO (UM PROFISSIONAL)
      // =====================================================
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id, client_name, start_time, end_time')
        .eq('professional_id', professional_id)
        .eq('appointment_date', appointment_date)
        .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`)
        .neq('status', 'cancelled');

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Horário indisponível',
            conflicting_appointment: conflicts[0]
          },
          { status: 409 }
        );
      }

      // Verificar bloqueios
      const { data: blocked } = await supabase
        .from('blocked_times')
        .select('id, reason')
        .eq('professional_id', professional_id)
        .gte('end_datetime', `${appointment_date}T${start_time}`)
        .lte('start_datetime', `${appointment_date}T${end_time}`);

      if (blocked && blocked.length > 0) {
        return NextResponse.json(
          {
            error: 'Horário bloqueado',
            reason: blocked[0].reason
          },
          { status: 409 }
        );
      }
    }

    // =====================================================
    // 8. CRIAR O AGENDAMENTO
    // =====================================================
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        unit_id,
        professional_id,
        secondary_professional_id,
        is_double_booking,
        service_id,
        client_id,
        appointment_date,
        start_time,
        end_time,
        client_name,
        client_phone,
        notes,
        internal_notes,
        status: 'pending'
      })
      .select(`
        *,
        professional:professionals(user:users(full_name)),
        secondary_professional:professionals!secondary_professional_id(user:users(full_name)),
        service:services(name, price, category)
      `)
      .single();

    if (appointmentError) {
      return NextResponse.json({ error: appointmentError.message }, { status: 500 });
    }

    // =====================================================
    // 9. DISPARAR WEBHOOK (n8n)
    // =====================================================
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment.created',
          data: {
            appointment_id: appointment.id,
            client_name,
            client_phone,
            appointment_date,
            start_time,
            service_name: service.name,
            professional: appointment.professional?.user?.full_name,
            secondary_professional: appointment.secondary_professional?.user?.full_name,
            is_double_booking
          }
        })
      }).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json(
      {
        appointment,
        message: is_double_booking 
          ? `Agendamento criado com bloqueio duplo para ${appointment.professional?.user?.full_name} e ${appointment.secondary_professional?.user?.full_name}`
          : 'Agendamento criado com sucesso'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
