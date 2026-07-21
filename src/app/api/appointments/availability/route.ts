import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AvailabilityQueryError,
  getAvailableSlots,
  isValidSchedulingDate,
  isValidUuid,
  ProfessionalNotFoundError,
} from '@/lib/appointment-availability';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get('professional_id');
  const serviceId = searchParams.get('service_id');
  const date = searchParams.get('date');

  if (!professionalId || !serviceId || !date) {
    return NextResponse.json(
      { error: 'professional_id, service_id e date são obrigatórios.' },
      { status: 400 },
    );
  }
  if (!isValidUuid(professionalId) || !isValidUuid(serviceId)) {
    return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 });
  }
  if (!isValidSchedulingDate(date)) {
    return NextResponse.json({ error: 'Data inválida ou no passado.' }, { status: 400 });
  }

  try {
    const catalogDb = createServerSupabase() as unknown as SupabaseClient;
    let serviceResult = await catalogDb
      .from('servicos')
      .select('duracao_minutos, unit_id')
      .eq('id', serviceId)
      .eq('ativo', true)
      .maybeSingle();

    if (serviceResult.error && (
      serviceResult.error.code === '42703'
      || serviceResult.error.code === 'PGRST204'
      || serviceResult.error.message.includes('unit_id')
    )) {
      serviceResult = await catalogDb
        .from('servicos')
        .select('duracao_minutos')
        .eq('id', serviceId)
        .eq('ativo', true)
        .maybeSingle() as typeof serviceResult;
    }

    const { data: service, error: serviceError } = serviceResult;

    if (serviceError) throw new AvailabilityQueryError();
    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado ou inativo.' }, { status: 404 });
    }
    if (
      !Number.isInteger(service.duracao_minutos) ||
      service.duracao_minutos < 1 ||
      service.duracao_minutos > 480
    ) throw new AvailabilityQueryError();

    const unitId = (service as { unit_id?: string }).unit_id;
    const db = createServerSupabase(unitId) as unknown as SupabaseClient;
    const { slots } = await getAvailableSlots(db, professionalId, date, service.duracao_minutos, unitId);
    return NextResponse.json(slots);
  } catch (error) {
    if (error instanceof ProfessionalNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro interno ao consultar disponibilidade.' }, { status: 500 });
  }
}
