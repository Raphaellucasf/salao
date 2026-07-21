export type RecurrenceFrequency = 'semanal' | 'mensal';

export interface AppointmentRecurrence {
  frequencia: RecurrenceFrequency;
  ocorrencias: number;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseCivilDate(value: string): Date {
  if (!DATE_PATTERN.test(value)) throw new RangeError('Data de recorrência inválida.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== value) throw new RangeError('Data de recorrência inválida.');
  return date;
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function buildRecurrenceDates(startDate: string, recurrence?: AppointmentRecurrence | null): string[] {
  const start = parseCivilDate(startDate);
  if (!recurrence) return [startDate];
  if (!['semanal', 'mensal'].includes(recurrence.frequencia)
    || !Number.isInteger(recurrence.ocorrencias)
    || recurrence.ocorrencias < 2
    || recurrence.ocorrencias > 52) {
    throw new RangeError('Recorrência inválida.');
  }

  const dates: string[] = [];
  const originalDay = start.getUTCDate();
  for (let index = 0; index < recurrence.ocorrencias; index += 1) {
    if (recurrence.frequencia === 'semanal') {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index * 7);
      dates.push(formatCivilDate(date));
      continue;
    }

    const targetMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const lastDay = new Date(Date.UTC(
      targetMonth.getUTCFullYear(),
      targetMonth.getUTCMonth() + 1,
      0,
    )).getUTCDate();
    targetMonth.setUTCDate(Math.min(originalDay, lastDay));
    dates.push(formatCivilDate(targetMonth));
  }
  return dates;
}
