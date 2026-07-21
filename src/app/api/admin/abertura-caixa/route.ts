import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/admin/abertura-caixa?data=2026-04-27
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const data = req.nextUrl.searchParams.get('data');
  if (!data || !DATE_PATTERN.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))) {
    return NextResponse.json({ error: 'data inválida' }, { status: 400 });
  }

  const supabase = createServerSupabase(authResult.unitId);
  const { data: abertura, error } = await supabase
    .from('abertura_caixa')
    .select('*')
    .eq('unit_id', authResult.unitId)
    .eq('data', data)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(abertura ?? null);
}

// POST /api/admin/abertura-caixa
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { data, valor_abertura, observacao } = body;
    const valor = Number(valor_abertura);

    if (!data || !DATE_PATTERN.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))
      || !Number.isFinite(valor) || valor < 0 || valor > 1_000_000) {
      return NextResponse.json({ error: 'Dados de abertura inválidos' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data: result, error } = await supabase
      .from('abertura_caixa')
      .upsert([{
        unit_id: authResult.unitId,
        data,
        valor_abertura: Math.round(valor * 100) / 100,
        observacao: typeof observacao === 'string' ? observacao.trim().slice(0, 1000) || null : null,
        aberto_por: authResult.id,
      }], { onConflict: 'unit_id,data' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
