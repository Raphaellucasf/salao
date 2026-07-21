import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGAMENTOS = new Set(['', 'dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia']);

function dateValid(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function sanitize(body: Record<string, unknown>) {
  const clientId = Number(body.cliente_id);
  if (!Number.isSafeInteger(clientId) || clientId <= 0 || !dateValid(body.data_atendimento)) return null;
  if (body.profissional_id && (typeof body.profissional_id !== 'string' || !UUID.test(body.profissional_id))) return null;
  if (body.data_retorno && !dateValid(body.data_retorno)) return null;
  if (typeof body.forma_pagamento !== 'string' || !PAGAMENTOS.has(body.forma_pagamento)) return null;
  const textFields = ['tecnicas_aplicadas', 'observacoes_atendimento', 'resultado_obtido', 'recomendacoes'] as const;
  const texts: Record<string, string | null> = {};
  for (const field of textFields) {
    const value = body[field];
    if (typeof value !== 'string' || value.length > 5000) return null;
    texts[field] = value.trim() || null;
  }
  const tempo = Number(body.tempo_duracao);
  const satisfacao = Number(body.satisfacao_cliente);
  const valor = Number(body.valor_total);
  if (!Number.isInteger(tempo) || tempo < 0 || tempo > 1440
      || !Number.isInteger(satisfacao) || satisfacao < 1 || satisfacao > 5
      || !Number.isFinite(valor) || valor < 0 || valor > 1_000_000
      || typeof body.retorno_necessario !== 'boolean') return null;
  return {
    ...texts, cliente_id: clientId, profissional_id: body.profissional_id || null,
    data_atendimento: body.data_atendimento, tempo_duracao: tempo,
    satisfacao_cliente: satisfacao, retorno_necessario: body.retorno_necessario,
    data_retorno: body.retorno_necessario ? body.data_retorno || null : null,
    valor_total: Math.round(valor * 100) / 100, forma_pagamento: body.forma_pagamento || null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const clienteId = Number(req.nextUrl.searchParams.get('cliente_id'));
  if (!Number.isSafeInteger(clienteId) || clienteId <= 0) return NextResponse.json({ error: 'cliente_id inválido' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase.from('prontuarios').select('*')
    .eq('cliente_id', clienteId).eq('unit_id', auth.unitId).order('data_atendimento', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prontuarios: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const values = body ? sanitize(body) : null;
  if (!values) return NextResponse.json({ error: 'dados de prontuário inválidos' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase.from('prontuarios').insert({ ...values, unit_id: auth.unitId }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== 'string' || !UUID.test(body.id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }
  const values = sanitize(body);
  if (!values) return NextResponse.json({ error: 'dados de prontuário inválidos' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase.from('prontuarios')
    .update(values).eq('id', body.id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'prontuário não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase
    .from('prontuarios').delete().eq('id', id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'prontuário não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
