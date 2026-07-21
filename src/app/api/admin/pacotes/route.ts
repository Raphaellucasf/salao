import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Json } from '@/types/supabase';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type PackageItem = { servico_id: string; quantidade: number; ordem: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized || null : undefined;
}

function parseItems(value: unknown): PackageItem[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return null;
  const items: PackageItem[] = [];
  const services = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!isRecord(item) || typeof item.servico_id !== 'string' || !UUID_PATTERN.test(item.servico_id)) return null;
    const quantity = Number(item.quantidade);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000 || services.has(item.servico_id)) return null;
    services.add(item.servico_id);
    items.push({ servico_id: item.servico_id, quantidade: quantity, ordem: index + 1 });
  }
  return items;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body: unknown = await req.json();
    if (!isRecord(body) || !isRecord(body.pacote)) {
      return NextResponse.json({ error: 'Dados do pacote inválidos' }, { status: 400 });
    }

    const action = body.action;
    const pacote = body.pacote;
    const packageId = action === 'UPDATE' && typeof pacote.id === 'string' && UUID_PATTERN.test(pacote.id)
      ? pacote.id
      : action === 'CREATE' ? null : undefined;
    const items = parseItems(body.itens);
    const name = typeof pacote.nome === 'string' ? pacote.nome.trim() : '';
    const code = optionalText(pacote.codigo, 80);
    const description = optionalText(pacote.descricao, 2000);
    const notes = optionalText(pacote.observacoes, 2000);
    const terms = optionalText(pacote.termos_uso, 10_000);
    const icon = optionalText(pacote.icone, 50);
    const totalPrice = Number(pacote.preco_total);
    const validityDays = Number(pacote.validade_dias);
    const maxInstallments = Number(pacote.max_parcelas);
    const allowsInstallments = pacote.permite_parcelamento !== false;
    const color = typeof pacote.cor === 'string' ? pacote.cor.trim() : '';

    if (packageId === undefined || !items || !name || name.length > 160
      || code === undefined || description === undefined || notes === undefined || terms === undefined || icon === undefined
      || !Number.isFinite(totalPrice) || totalPrice <= 0 || totalPrice > 100_000_000
      || !Number.isSafeInteger(validityDays) || validityDays < 1 || validityDays > 3650
      || !Number.isSafeInteger(maxInstallments) || maxInstallments < 1 || maxInstallments > 24
      || !COLOR_PATTERN.test(color)) {
      return NextResponse.json({ error: 'Dados do pacote inválidos' }, { status: 400 });
    }

    const payload = {
      codigo: code,
      nome: name,
      descricao: description,
      preco_total: Math.round(totalPrice * 100) / 100,
      validade_dias: validityDays,
      permite_parcelamento: allowsInstallments,
      max_parcelas: allowsInstallments ? maxInstallments : 1,
      cor: color,
      icone: icon,
      ativo: pacote.ativo !== false,
      observacoes: notes,
      termos_uso: terms,
    } satisfies Json;

    const requestId = typeof body.request_id === 'string' && UUID_PATTERN.test(body.request_id)
      ? body.request_id
      : crypto.randomUUID();
    const supabase = createServerSupabase(authResult.unitId);
    if (packageId) {
      const { data: ownedPackage, error: ownershipError } = await supabase
        .from('pacotes_servicos').select('id').eq('id', packageId).eq('unit_id', authResult.unitId).maybeSingle();
      if (ownershipError) return NextResponse.json({ error: 'Não foi possível validar o pacote' }, { status: 500 });
      if (!ownedPackage) return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }
    const { data, error } = await supabase.rpc('save_service_package_atomic', {
      p_package_id: packageId as string,
      p_payload: payload,
      p_items: items,
      p_actor_id: authResult.id,
      p_request_id: requestId,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Código de pacote já cadastrado' }, { status: 409 });
      }
      if (error.code === 'P0002') {
        return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
      }
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Um dos serviços não existe ou está inativo' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Não foi possível salvar o pacote' }, { status: 400 });
    }

    return NextResponse.json(data, { status: packageId ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const id = req.nextUrl.searchParams.get('id');
  if (id && !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
  }

  const supabase = createServerSupabase(authResult.unitId);
  const query = supabase
    .from('pacotes_servicos')
    .select('*, pacotes_servicos_itens(*, servicos(*))')
    .eq('unit_id', authResult.unitId)
    .order('nome');
  const { data, error } = id ? await query.eq('id', id).maybeSingle() : await query;

  if (error) {
    return NextResponse.json({ error: 'Não foi possível carregar os pacotes' }, { status: 500 });
  }
  if (id && !data) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
  }
  return NextResponse.json(data ?? []);
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
  }

  const supabase = createServerSupabase(authResult.unitId);
  const { data, error } = await supabase
    .from('pacotes_servicos')
    .delete()
    .eq('id', id)
    .eq('unit_id', authResult.unitId)
    .select('id')
    .maybeSingle();

  if (error) {
    const status = error.code === '23503' ? 409 : 500;
    const message = status === 409 ? 'Pacote já utilizado e não pode ser excluído' : 'Não foi possível excluir o pacote';
    return NextResponse.json({ error: message }, { status });
  }
  if (!data) return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body: unknown = await req.json();
    if (!isRecord(body) || typeof body.id !== 'string' || !UUID_PATTERN.test(body.id)
      || typeof body.ativo !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data, error } = await supabase
      .from('pacotes_servicos')
      .update({ ativo: body.ativo, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('unit_id', authResult.unitId)
      .select('id,ativo')
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: 'Não foi possível alterar o pacote' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
