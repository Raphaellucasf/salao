// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Busca horários disponíveis para um profissional em uma data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const professionalId = searchParams.get('professional_id');
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');

    if (!professionalId || !date || !serviceId) {
      return NextResponse.json(
        { error: 'professional_id, date e service_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o serviço para pegar a duração
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();

    if (serviceError) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Busca agendamentos existentes do profissional nesta data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('professional_id', professionalId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
    }

    // Busca horários bloqueados
    const { data: blockedTimes, error: blockedError } = await supabase
      .from('blocked_times')
      .select('start_datetime, end_datetime')
      .eq('professional_id', professionalId)
      .gte('start_datetime', `${date}T00:00:00`)
      .lte('start_datetime', `${date}T23:59:59`);

    if (blockedError) {
      return NextResponse.json({ error: blockedError.message }, { status: 500 });
    }

    // Gera todos os slots possíveis (ex: 9h às 18h, a cada 30 minutos)
    const workingHours = {
      start: 9 * 60, // 9:00 em minutos
      end: 18 * 60,  // 18:00 em minutos
      interval: 30    // intervalo de 30 minutos
    };

    const allSlots: string[] = [];
    for (let minutes = workingHours.start; minutes < workingHours.end; minutes += workingHours.interval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      allSlots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }

    // Filtra slots disponíveis
    const availableSlots = allSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotMinutes = hours * 60 + minutes;
      const slotEndMinutes = slotMinutes + (service as any).duration_minutes;

      // Verifica se o slot termina dentro do horário de trabalho
      if (slotEndMinutes > workingHours.end) {
        return false;
      }

      // Verifica conflito com agendamentos existentes
      const hasConflict = appointments?.some((apt: any) => {
        const [aptStartHours, aptStartMins] = apt.start_time.split(':').map(Number);
        const [aptEndHours, aptEndMins] = apt.end_time.split(':').map(Number);
        const aptStart = aptStartHours * 60 + aptStartMins;
        const aptEnd = aptEndHours * 60 + aptEndMins;

        return (slotMinutes < aptEnd && slotEndMinutes > aptStart);
      });

      // Verifica conflito com horários bloqueados
      const hasBlockedConflict = blockedTimes?.some((blocked: any) => {
        const blockedStart = new Date(blocked.start_datetime);
        const blockedEnd = new Date(blocked.end_datetime);
        const slotStart = new Date(`${date}T${slot}:00`);
        const slotEnd = new Date(slotStart.getTime() + (service as any).duration_minutes * 60000);

        return (slotStart < blockedEnd && slotEnd > blockedStart);
      });

      return !hasConflict && !hasBlockedConflict;
    });

    return NextResponse.json({ available_slots: availableSlots });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
