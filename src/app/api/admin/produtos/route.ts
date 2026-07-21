import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';
import type { Json } from '@/types/supabase';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCT_TYPES = new Set(['revenda', 'uso_interno', 'insumo']);

function optionalUuid(value: unknown): string | null | undefined {
  if (value === null || value === '') return null;
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const productId = body.id == null ? null : optionalUuid(body.id);
    const groupId = optionalUuid(body.grupo_id);
    const supplierId = optionalUuid(body.fornecedor_id);
    const name = typeof body.nome === 'string' ? body.nome.trim() : '';
    const quantity = Number(body.quantidade);
    const minimumQuantity = Number(body.quantidade_minima);
    const cost = Number(body.preco_custo);
    const price = Number(body.preco_venda);
    const commission = Number(body.percentual_comissao);
    const unit = typeof body.unidade_medida === 'string' ? body.unidade_medida.trim() : '';
    const description = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    const notes = typeof body.observacoes === 'string' ? body.observacoes.trim() : '';

    if (productId === undefined || groupId === undefined || supplierId === undefined
      || !name || name.length > 160 || !PRODUCT_TYPES.has(body.tipo)
      || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000
      || !Number.isSafeInteger(minimumQuantity) || minimumQuantity < 0 || minimumQuantity > 100_000_000
      || !Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price < 0
      || !Number.isFinite(commission) || commission < 0 || commission > 100
      || !unit || unit.length > 20 || description.length > 2000 || notes.length > 2000) {
      return NextResponse.json({ error: 'Dados do produto inválidos' }, { status: 400 });
    }

    const payload = {
      codigo: typeof body.codigo === 'string' ? body.codigo.trim().slice(0, 80) : '',
      codigo_barras: typeof body.codigo_barras === 'string' ? body.codigo_barras.trim().slice(0, 80) : '',
      nome: name,
      descricao: description,
      grupo_id: groupId,
      categoria: typeof body.categoria === 'string' ? body.categoria.trim().slice(0, 120) : '',
      tipo: body.tipo,
      fornecedor_id: supplierId,
      quantidade: quantity,
      quantidade_minima: minimumQuantity,
      unidade_medida: unit,
      preco_custo: Math.round(cost * 100) / 100,
      preco_venda: Math.round(price * 100) / 100,
      controla_estoque: body.controla_estoque !== false,
      permite_venda_estoque_negativo: body.permite_venda_estoque_negativo === true,
      ativo: body.ativo !== false,
      gera_comissao: body.gera_comissao === true,
      percentual_comissao: Math.round(commission * 100) / 100,
      localizacao: typeof body.localizacao === 'string' ? body.localizacao.trim().slice(0, 200) : '',
      observacoes: notes,
    } satisfies Json;

    const supabase = createServerSupabase(authResult.unitId);
    if (productId) {
      const { data: ownedProduct, error: ownershipError } = await supabase
        .from('produtos').select('id').eq('id', productId).eq('unit_id', authResult.unitId).maybeSingle();
      if (ownershipError) return NextResponse.json({ error: 'Não foi possível validar o produto' }, { status: 500 });
      if (!ownedProduct) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    const { data, error } = await supabase.rpc('save_product_atomic', {
      p_product_id: productId as string,
      p_payload: payload,
      p_actor_id: authResult.id,
      p_request_id: typeof body.request_id === 'string' && UUID_PATTERN.test(body.request_id)
        ? body.request_id
        : crypto.randomUUID(),
    });
    if (error) {
      const status = error.code === '23505' ? 409 : error.message === 'product_not_found' ? 404 : 400;
      const message = status === 409 ? 'Código ou código de barras já cadastrado'
        : status === 404 ? 'Produto não encontrado' : 'Não foi possível salvar o produto';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(data, { status: productId ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID_PATTERN.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  const { data, error } = await createServerSupabase(auth.unitId).from('produtos').delete()
    .eq('id', id).eq('unit_id', auth.unitId).select('id').maybeSingle();
  if (error) {
    const status = error.code === '23503' ? 409 : 500;
    return NextResponse.json({ error: status === 409 ? 'Produto possui vínculos e não pode ser excluído' : 'Não foi possível excluir o produto' }, { status });
  }
  if (!data) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
