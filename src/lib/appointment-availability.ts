import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export interface TimeSlot {
  hora_inicio: string;
  hora_fim: string;
  livre: boolean;
}

export interface AvailabilityResult {
  professional: { id: string; nome: string };
  slots: TimeSlot[];
}

export class AvailabilityQueryError extends Error {
  constructor() {
    super('Não foi possível consultar a disponibilidade.');
    this.name = 'AvailabilityQueryError';
  }
}

export class ProfessionalNotFoundError extends Error {
  constructor() {
    super('Profissional não encontrado ou inativo.');
    this.name = 'ProfessionalNotFoundError';
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isValidSchedulingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const civilDate = new Date(Date.UTC(year, month - 1, day));
  if (
    civilDate.getUTCFullYear() !== year ||
    civilDate.getUTCMonth() !== month - 1 ||
    civilDate.getUTCDate() !== day
  ) return false;

  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    todayParts.find((item) => item.type === type)?.value ?? '';
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  return value >= today;
}

function isLegacyCatalogSchema(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (
    error.code === '42703'
    || error.code === 'PGRST204'
    || error.message?.includes('unit_id')
  ));
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function earliestBookableMinute(date: string, now: Date): number | null {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  const today = `${value('year')}-${value('month')}-${value('day')}`;
  if (date !== today) return null;
  const currentMinute = Number(value('hour')) * 60 + Number(value('minute'));
  return Math.ceil(currentMinute / 30) * 30;
}

function workingPeriod(
  schedule: unknown,
  date: string,
  fallbackStart: string | null,
  fallbackEnd: string | null,
): { start: number; end: number } {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay().toString();
  let startText = fallbackStart;
  let endText = fallbackEnd;

  if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
    const entry = (schedule as Record<string, unknown>)[dayOfWeek];
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const values = entry as Record<string, unknown>;
      if (typeof values.inicio === 'string') startText = values.inicio;
      if (typeof values.fim === 'string') endText = values.fim;
    }
  }

  const start = timeToMinutes(startText ?? '08:00') ?? 8 * 60;
  const end = timeToMinutes(endText ?? '20:00') ?? 20 * 60;
  return { start, end };
}

export async function getAvailableSlots(
  db: SupabaseClient,
  professionalId: string,
  date: string,
  durationMinutes: number,
  unitId?: string,
  now: Date = new Date(),
): Promise<AvailabilityResult> {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 480) {
    throw new RangeError('Duração inválida.');
  }

  const baseProfessionalQuery = () => db
    .from('profissionais')
    .select('id, nome, horarios_por_dia, hora_inicio, hora_fim')
    .eq('id', professionalId)
    .eq('ativo', true);
  let professionalResult = await (unitId
    ? baseProfessionalQuery().eq('unit_id', unitId)
    : baseProfessionalQuery()).maybeSingle();
  if (unitId && isLegacyCatalogSchema(professionalResult.error)) {
    professionalResult = await baseProfessionalQuery().maybeSingle();
  }
  const { data: professional, error: professionalError } = professionalResult;
  if (professionalError) throw new AvailabilityQueryError();
  if (!professional) throw new ProfessionalNotFoundError();

  const { data: occupied, error: occupiedError } = await db
    .from('vw_blocos_ocupados')
    .select('hora_inicio, hora_fim')
    .eq('profissional_id', professionalId)
    .eq('data', date);
  if (occupiedError) throw new AvailabilityQueryError();

  const busyIntervals = (occupied ?? []).map((item) => ({
    start: timeToMinutes(item.hora_inicio),
    end: timeToMinutes(item.hora_fim),
  }));
  if (busyIntervals.some((item) => item.start === null || item.end === null)) {
    throw new AvailabilityQueryError();
  }

  const period = workingPeriod(
    professional.horarios_por_dia,
    date,
    professional.hora_inicio,
    professional.hora_fim,
  );
  if (period.end <= period.start) {
    return { professional: { id: professional.id, nome: professional.nome }, slots: [] };
  }

  const slots: TimeSlot[] = [];
  const earliestStart = earliestBookableMinute(date, now);
  for (let start = period.start; start + durationMinutes <= period.end; start += 30) {
    if (earliestStart !== null && start < earliestStart) continue;
    const end = start + durationMinutes;
    const livre = !busyIntervals.some(
      (busy) => busy.start !== null && busy.end !== null && start < busy.end && end > busy.start,
    );
    slots.push({
      hora_inicio: minutesToTime(start),
      hora_fim: minutesToTime(end),
      livre,
    });
  }

  return {
    professional: { id: professional.id, nome: professional.nome },
    slots,
  };
}
