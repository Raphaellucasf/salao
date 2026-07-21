import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getCachedFinancialStats } from '@/lib/financial-stats-cache';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const today = req.nextUrl.searchParams.get('hoje');
  const monthStart = req.nextUrl.searchParams.get('inicioMes');
  if (!today || !monthStart || !validDate(today) || !validDate(monthStart) || monthStart > today)
    return NextResponse.json({ error: 'Intervalo de datas inválido' }, { status: 400 });

  try {
    const data = await getCachedFinancialStats(auth.unitId, monthStart, today);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Não foi possível calcular o resumo financeiro' }, { status: 500 });
  }
}
