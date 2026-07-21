import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getAvailableSlots,
  isValidSchedulingDate,
  isValidUuid,
  ProfessionalNotFoundError,
} from '@/lib/appointment-availability';
import { createServerSupabase } from '@/lib/supabase-server';
import { getRequestId, logSecurityEvent, toErrorDetails } from '@/lib/observability';

function safeKeyEquals(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const expectedKey = process.env.N8N_API_KEY;
  if (!expectedKey) {
    logSecurityEvent({ event: 'integration.config_missing', route: request.nextUrl.pathname, status: 503, requestId, integration: 'n8n' });
    return NextResponse.json({ error: 'Integração indisponível.' }, { status: 503 });
  }
  const providedKey = request.headers.get('x-api-key') ?? '';
  if (!providedKey || !safeKeyEquals(providedKey, expectedKey)) {
    logSecurityEvent({ event: 'integration.auth_rejected', route: request.nextUrl.pathname, status: 401, requestId, integration: 'n8n' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get('profissional_id');
  const date = searchParams.get('data');
  const duration = Number(searchParams.get('duracao') ?? '30');
  if (!professionalId || !date) {
    return NextResponse.json(
      { error: 'Parâmetros obrigatórios: profissional_id e data (YYYY-MM-DD).' },
      { status: 400 },
    );
  }
  if (!isValidUuid(professionalId)) {
    return NextResponse.json({ error: 'profissional_id inválido.' }, { status: 400 });
  }
  if (!isValidSchedulingDate(date)) {
    return NextResponse.json({ error: 'Data inválida ou no passado.' }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
    return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 });
  }

  try {
    const catalogDb = createServerSupabase() as unknown as SupabaseClient;
    const { data: owner, error: ownerError } = await catalogDb.from('profissionais')
      .select('unit_id').eq('id', professionalId).eq('ativo', true).maybeSingle();
    if (ownerError || !owner) throw new ProfessionalNotFoundError();
    const unitId = (owner as { unit_id: string }).unit_id;
    const db = createServerSupabase(unitId) as unknown as SupabaseClient;
    const { professional, slots } = await getAvailableSlots(db, professionalId, date, duration, unitId);
    const livres = slots
      .filter((slot) => slot.livre)
      .map(({ hora_inicio, hora_fim }) => ({ hora_inicio, hora_fim }));
    const [ano, mes, dia] = date.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return NextResponse.json({
      profissional: professional,
      data: dataFormatada,
      data_iso: date,
      total_livres: livres.length,
      horarios_livres: livres,
      mensagem_whatsapp:
        livres.length === 0
          ? `Não há horários disponíveis com ${professional.nome} no dia ${dataFormatada}.`
          : `*Horários disponíveis com ${professional.nome} em ${dataFormatada}:*\n\n${livres
              .map((slot, index) => `${index + 1}. ${slot.hora_inicio} às ${slot.hora_fim}`)
              .join('\n')}\n\nQual horário prefere?`,
    });
  } catch (error) {
    if (error instanceof ProfessionalNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    logSecurityEvent({ event: 'integration.availability_failure', route: request.nextUrl.pathname, status: 500, requestId, integration: 'n8n', ...toErrorDetails(error) });
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
