import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Json } from '@/types/supabase';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const textValue = (value: unknown, max: number) => typeof value === 'string' && value.trim().length <= max ? value.trim() : null;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body: unknown = await req.json();
    if (!isRecord(body) || !isRecord(body.servico) || !Array.isArray(body.etapas))
      return NextResponse.json({ error: 'Dados do serviço inválidos' }, { status: 400 });
    const service = body.servico;
    const id = service.id == null ? null : typeof service.id === 'string' && UUID.test(service.id) ? service.id : undefined;
    const groupId = typeof service.grupo_id === 'string' && UUID.test(service.grupo_id) ? service.grupo_id : null;
    const name = textValue(service.nome, 160);
    const code = service.codigo ? textValue(service.codigo, 80) : '';
    const description = service.descricao ? textValue(service.descricao, 2000) : '';
    const notes = service.observacoes ? textValue(service.observacoes, 2000) : '';
    const price = Number(service.preco);
    const duration = Number(service.duracao_minutos);
    const hasStages = service.tem_etapas === true;
    const terms = Array.isArray(service.termos_busca) && service.termos_busca.length <= 30
      && service.termos_busca.every(term => typeof term === 'string' && term.trim().length > 0 && term.length <= 80)
      ? service.termos_busca.map(term => (term as string).trim()) : null;
    const stages = body.etapas.map((stage, index) => isRecord(stage) ? {
      nome: textValue(stage.nome, 160), descricao: stage.descricao ? textValue(stage.descricao, 1000) : '',
      duracao_minutos: Number(stage.duracao_minutos), pode_ter_auxiliar: stage.pode_ter_auxiliar !== false,
      exige_profissional: stage.exige_profissional !== false, ordem: index + 1,
    } : null);
    if (id === undefined || !groupId || !name || code === null || description === null || notes === null || !terms
      || !Number.isFinite(price) || price < 0 || price > 100_000_000
      || !Number.isSafeInteger(duration) || duration < 1 || duration > 10080
      || (hasStages ? stages.length < 1 || stages.length > 50 : stages.length !== 0)
      || stages.some(stage => !stage || !stage.nome || stage.descricao === null || !Number.isSafeInteger(stage.duracao_minutos)
        || stage.duracao_minutos < 1 || stage.duracao_minutos > 1440))
      return NextResponse.json({ error: 'Dados do serviço inválidos' }, { status: 400 });

    const payload = { codigo: code, nome: name, descricao: description, termos_busca: terms,
      duracao_minutos: duration, preco: Math.round(price * 100) / 100, ativo: service.ativo !== false,
      observacoes: notes, grupo_id: groupId, tem_etapas: hasStages,
      duracao_calculada: hasStages && service.duracao_calculada === true, usa_produtos: service.usa_produtos === true } satisfies Json;
    const requestId = typeof body.request_id === 'string' && UUID.test(body.request_id) ? body.request_id : crypto.randomUUID();
    const supabase = createServerSupabase(auth.unitId);
    if (id) {
      const { data: ownedService, error: ownershipError } = await supabase
        .from('servicos').select('id').eq('id', id).eq('unit_id', auth.unitId).maybeSingle();
      if (ownershipError) return NextResponse.json({ error: 'Não foi possível validar o serviço' }, { status: 500 });
      if (!ownedService) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }
    const { data, error } = await supabase.rpc('save_service_catalog_atomic', {
      p_service_id: id as string, p_payload: payload, p_stages: stages as Json,
      p_actor_id: auth.id, p_request_id: requestId,
    });
    if (error) {
      const status = error.code === '23505' ? 409 : error.code === 'P0002' ? 404 : 400;
      return NextResponse.json({ error: status === 409 ? 'Código já cadastrado' : status === 404 ? 'Serviço não encontrado' : 'Não foi possível salvar o serviço' }, { status });
    }
    return NextResponse.json(data, { status: id ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body: unknown = await req.json().catch(() => null);
  if (!isRecord(body) || typeof body.id !== 'string' || !UUID.test(body.id) || typeof body.ativo !== 'boolean')
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const { data, error } = await createServerSupabase(auth.unitId).from('servicos')
    .update({ ativo: body.ativo }).eq('id', body.id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error || !data) return NextResponse.json({ error: data ? 'Não foi possível atualizar o serviço' : 'Serviço não encontrado' }, { status: data ? 500 : 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  const supabase = createServerSupabase(auth.unitId);
  const { data: ownedService, error: ownershipError } = await supabase
    .from('servicos').select('id').eq('id', id).eq('unit_id', auth.unitId).maybeSingle();
  if (ownershipError) return NextResponse.json({ error: 'Não foi possível validar o serviço' }, { status: 500 });
  if (!ownedService) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
  const { error } = await supabase.rpc('delete_service_catalog_atomic', { p_service_id: id });
  if (error) {
    const status = error.code === 'P0002' ? 404 : error.code === '23503' ? 409 : 500;
    return NextResponse.json({ error: status === 404 ? 'Serviço não encontrado' : status === 409 ? 'Serviço possui vínculos e não pode ser excluído' : 'Não foi possível excluir o serviço' }, { status });
  }
  return NextResponse.json({ ok: true });
}
