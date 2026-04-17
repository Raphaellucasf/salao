import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// GET /api/admin/transacoes?dataInicio=2026-04-01
export async function GET(req: NextRequest) {
  const dataInicio = req.nextUrl.searchParams.get('dataInicio');
  if (!dataInicio) {
    return NextResponse.json({ error: 'dataInicio obrigatório' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await (supabase as any)
    .from('transacoes')
    .select('*')
    .gte('data', dataInicio)
    .order('data', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/admin/transacoes — inserir transação manual (despesa, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, descricao, categoria, valor, metodo, data } = body;

    if (!tipo || !descricao || !valor || !data) {
      return NextResponse.json({ error: 'tipo, descricao, valor e data são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: inserted, error } = await (supabase as any)
      .from('transacoes')
      .insert([{ tipo, descricao, categoria: categoria ?? '', valor, metodo: metodo ?? 'dinheiro', data }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(inserted);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
