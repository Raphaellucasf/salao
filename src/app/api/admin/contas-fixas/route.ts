import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/admin/contas-fixas?ativo=true
export async function GET(req: NextRequest) {
  const soAtivo = req.nextUrl.searchParams.get('ativo');
  const supabase = createServerSupabase();

  let query = (supabase as any)
    .from('contas_fixas')
    .select('*')
    .eq('unit_id', DEFAULT_UNIT_ID)
    .order('nome');

  if (soAtivo === 'true') query = query.eq('ativo', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/contas-fixas  — criar conta fixa
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { nome, valor, vencimento_dia, categoria, observacao } = body;

    if (!nome || valor === undefined) {
      return NextResponse.json({ error: 'nome e valor são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await (supabase as any)
      .from('contas_fixas')
      .insert([{
        unit_id: DEFAULT_UNIT_ID,
        nome,
        valor: Number(valor),
        vencimento_dia: vencimento_dia ?? null,
        categoria: categoria ?? 'outros',
        observacao: observacao ?? null,
        ativo: true,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/admin/contas-fixas  — editar conta fixa (body deve ter id)
export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { id, nome, valor, vencimento_dia, categoria, observacao, ativo } = body;

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const supabase = createServerSupabase();
    const { data, error } = await (supabase as any)
      .from('contas_fixas')
      .update({
        nome,
        valor: valor !== undefined ? Number(valor) : undefined,
        vencimento_dia: vencimento_dia ?? null,
        categoria: categoria ?? 'outros',
        observacao: observacao ?? null,
        ativo: ativo ?? true,
      })
      .eq('id', id)
      .eq('unit_id', DEFAULT_UNIT_ID)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/admin/contas-fixas?id=xxx  — desativar (soft delete)
export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await (supabase as any)
    .from('contas_fixas')
    .update({ ativo: false })
    .eq('id', id)
    .eq('unit_id', DEFAULT_UNIT_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
