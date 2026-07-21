import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS = new Set(['capilar', 'corporal_facial', 'podologica', 'micropigmentacao']);
const TEXT_FIELDS = [
  'tipo_cabelo', 'textura_cabelo', 'couro_cabeludo', 'historico_quimico',
  'alergias_capilar', 'medicamentos', 'procedimentos_anteriores', 'problemas_atuais',
  'expectativas', 'tipo_pele', 'fototipo', 'alergias_pele', 'doencas_pele',
  'cirurgias_esteticas', 'problemas_circulatorios', 'expectativas_corporais', 'tipo_pe',
  'sensibilidade_pe', 'tratamentos_anteriores_pe', 'area_micropigmentacao',
  'resultado_anterior', 'tom_pele_micro', 'expectativa_cor', 'formato_desejado',
  'alergias_pigmento', 'observacoes',
] as const;
const BOOLEAN_FIELDS = [
  'usa_acido_retinol', 'gestante', 'lactante', 'marca_passo', 'varizes',
  'unhas_encravadas', 'micoses', 'calosidades', 'rachaduras', 'diabetes',
  'problemas_circulacao', 'pigmentacao_anterior', 'queloides', 'hepatite', 'herpes',
] as const;

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function sanitize(body: Record<string, unknown>) {
  const payload: Record<string, string | boolean | null> = {};
  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.length > 5000) return null;
    payload[field] = value.trim() || null;
  }
  for (const field of BOOLEAN_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== 'boolean') return null;
    payload[field] = value;
  }
  if (body.data_ultima_pigmentacao !== undefined) {
    if (body.data_ultima_pigmentacao !== '' && !validDate(body.data_ultima_pigmentacao)) return null;
    payload.data_ultima_pigmentacao = body.data_ultima_pigmentacao || null;
  }
  return payload;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const [anamnesesResult, clientesResult] = await Promise.all([
    supabase.from('anamneses')
      .select('*, clientes(id, nome, telefone, email), profissionais(id, nome)')
      .eq('unit_id', auth.unitId)
      .order('data_anamnese', { ascending: false }).limit(500),
    supabase.from('clientes').select('id, nome, telefone, email').eq('unit_id', auth.unitId).order('nome').limit(1000),
  ]);
  const error = anamnesesResult.error || clientesResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anamneses: anamnesesResult.data ?? [], clientes: clientesResult.data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const clientId = Number(body?.cliente_id);
  if (!body || !Number.isSafeInteger(clientId) || clientId <= 0
      || typeof body.tipo !== 'string' || !TIPOS.has(body.tipo)) {
    return NextResponse.json({ error: 'dados obrigatórios inválidos' }, { status: 400 });
  }
  const payload = sanitize(body);
  if (!payload) return NextResponse.json({ error: 'campos clínicos inválidos' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes').select('id').eq('id', clientId).eq('unit_id', auth.unitId).maybeSingle();
  if (clienteError) return NextResponse.json({ error: clienteError.message }, { status: 500 });
  if (!cliente) return NextResponse.json({ error: 'cliente não encontrado' }, { status: 404 });
  const { data, error } = await supabase.from('anamneses')
    .insert({ ...payload, cliente_id: clientId, tipo: body.tipo, unit_id: auth.unitId }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const clientId = Number(body?.cliente_id);
  if (!body || typeof body.id !== 'string' || !UUID.test(body.id)
      || !Number.isSafeInteger(clientId) || clientId <= 0
      || typeof body.tipo !== 'string' || !TIPOS.has(body.tipo)) {
    return NextResponse.json({ error: 'identificadores inválidos' }, { status: 400 });
  }
  const payload = sanitize(body);
  if (!payload) return NextResponse.json({ error: 'campos clínicos inválidos' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase.from('anamneses')
    .update({ ...payload, cliente_id: clientId, tipo: body.tipo })
    .eq('id', body.id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'anamnese não encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId) as unknown as SupabaseClient;
  const { data, error } = await supabase
    .from('anamneses').delete().eq('id', id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'anamnese não encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
