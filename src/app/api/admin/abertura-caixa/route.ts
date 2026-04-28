import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/admin/abertura-caixa?data=2026-04-27
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data');
  if (!data) return NextResponse.json({ error: 'data obrigatória' }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: abertura, error } = await (supabase as any)
    .from('abertura_caixa')
    .select('*')
    .eq('unit_id', DEFAULT_UNIT_ID)
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
    const { data, valor_abertura, observacao, aberto_por } = body;

    if (!data || valor_abertura === undefined) {
      return NextResponse.json({ error: 'data e valor_abertura são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: result, error } = await (supabase as any)
      .from('abertura_caixa')
      .upsert([{
        unit_id: DEFAULT_UNIT_ID,
        data,
        valor_abertura: Number(valor_abertura),
        observacao: observacao ?? null,
        aberto_por: aberto_por ?? null,
      }], { onConflict: 'unit_id,data' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
