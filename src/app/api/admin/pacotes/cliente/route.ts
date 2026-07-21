import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Créditos de pacotes são criados pelos fluxos atômicos de venda/fechamento.
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  return NextResponse.json(
    { error: 'Use o fluxo canônico de venda ou fechamento de comanda' },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const clientId = Number(searchParams.get('clienteId'));
  const serviceId = searchParams.get('servicoId');
  if (!Number.isSafeInteger(clientId) || clientId <= 0
    || (serviceId !== null && !UUID_PATTERN.test(serviceId))) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  const supabase = createServerSupabase(authResult.unitId);
  let query = supabase.from('pacotes_cliente')
    .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
    .eq('unit_id', authResult.unitId)
    .eq('cliente_id', clientId)
    .or(`data_validade.is.null,data_validade.gte.${new Date().toISOString().slice(0, 10)}`);
  if (serviceId) query = query.eq('servico_id', serviceId);

  const { data: balances, error } = await query.order('criado_em', { ascending: true });
  if (error) {
    return NextResponse.json({ error: 'Não foi possível carregar os pacotes' }, { status: 500 });
  }
  const available = (balances ?? []).filter((balance) => balance.sessoes_consumidas < balance.sessoes_total);
  if (available.length === 0) return NextResponse.json([]);

  const serviceIds = [...new Set(available.map((balance) => balance.servico_id))];
  const { data: services, error: servicesError } = await supabase.from('servicos')
    .select('id, nome').eq('unit_id', authResult.unitId).in('id', serviceIds);
  if (servicesError) {
    return NextResponse.json({ error: 'Não foi possível carregar os pacotes' }, { status: 500 });
  }
  const names = new Map((services ?? []).map((service) => [service.id, service.nome]));
  return NextResponse.json(available.map((balance) => ({
    id: balance.id,
    servico_id: balance.servico_id,
    servico_nome: names.get(balance.servico_id) ?? 'Serviço',
    sessoes_restantes: balance.sessoes_total - balance.sessoes_consumidas,
    sessoes_total: balance.sessoes_total,
    data_validade: balance.data_validade,
  })));
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const clientId = Number(body.clienteId);
    const quantity = Number(body.quantidade ?? 1);
    const requestId = typeof body.request_id === 'string' && UUID_PATTERN.test(body.request_id)
      ? body.request_id
      : crypto.randomUUID();
    if (!Number.isSafeInteger(clientId) || clientId <= 0 || !UUID_PATTERN.test(body.servicoId ?? '')
      || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000) {
      return NextResponse.json({ error: 'Dados de consumo inválidos' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data, error } = await supabase.rpc('consume_package_sessions_atomic', {
      p_unit_id: authResult.unitId,
      p_client_id: clientId,
      p_service_id: body.servicoId,
      p_quantity: quantity,
      p_actor_id: authResult.id,
      p_request_id: requestId,
    });
    if (error) {
      const insufficient = error.message === 'insufficient_package_balance';
      return NextResponse.json(
        { error: insufficient ? 'Saldo insuficiente no pacote' : 'Não foi possível consumir o pacote' },
        { status: 400 },
      );
    }
    const result = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
