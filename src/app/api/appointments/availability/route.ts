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
      .from('servicos')
      .select('duracao_minutos')
      .eq('id', serviceId)
      .single();

    if (serviceError) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Busca agendamentos existentes do profissional nesta data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('agendamentos')
      .select('hora_inicio, hora_fim')
      .eq('profissional_id', professionalId)
      .eq('data_agendamento', date)
      .neq('status', 'cancelado');

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
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
      const slotEndMinutes = slotMinutes + (service as any).duracao_minutos;

      // Verifica se o slot termina dentro do horário de trabalho
      if (slotEndMinutes > workingHours.end) {
        return false;
      }

      // Verifica conflito com agendamentos existentes
      const hasConflict = appointments?.some((apt: any) => {
        const [aptStartHours, aptStartMins] = apt.hora_inicio.split(':').map(Number);
        const [aptEndHours, aptEndMins] = apt.hora_fim.split(':').map(Number);
        const aptStart = aptStartHours * 60 + aptStartMins;
        const aptEnd = aptEndHours * 60 + aptEndMins;

        return (slotMinutes < aptEnd && slotEndMinutes > aptStart);
      });

      return !hasConflict;
    });

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar disponibilidade' }, { status: 500 });
  }
}
