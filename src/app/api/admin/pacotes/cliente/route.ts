import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { DEFAULT_UNIT_ID } from '@/services/caixa';

/**
 * POST /api/admin/pacotes/cliente
 * Cria registros de pacotes_cliente quando um pacote é vendido em uma comanda.
 */
export async function POST(request: Request) {
  try {
    const userOrError = await requireAdmin(request as any);
    if (userOrError instanceof NextResponse) return userOrError;

    const body = await request.json();
    const { comandaId, clienteId, clienteCpf, itensPacote } = body;

    if (!itensPacote || itensPacote.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const item of itensPacote) {
      const { data: pacoteData, error: pacoteError } = await supabaseAdmin
        .from('pacotes_servicos')
        .select('*, pacotes_servicos_itens(*)')
        .eq('id', item.item_id)
        .single();

      if (pacoteError || !pacoteData || !pacoteData.pacotes_servicos_itens) continue;

      const validadeDias = pacoteData.validade_dias ?? null;
      const dataValidade = validadeDias
        ? new Date(Date.now() + validadeDias * 86_400_000).toISOString().split('T')[0]
        : null;

      const pkRows = pacoteData.pacotes_servicos_itens.map((ps: any) => ({
        unit_id: DEFAULT_UNIT_ID,
        cliente_cpf: clienteCpf || null,
        cliente_id: clienteId,
        servico_id: ps.servico_id,
        sessoes_total: (ps.quantidade || 1) * (item.quantidade || 1),
        sessoes_consumidas: 0,
        comanda_origem_id: comandaId,
        data_validade: dataValidade,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('pacotes_cliente')
        .insert(pkRows);

      if (insertError) {
        console.error('Erro ao inserir pacote do cliente:', insertError);
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API de vincular pacotes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET /api/admin/pacotes/cliente?clienteId=X&servicoId=Y
 * Retorna pacotes ativos do cliente (com sessões disponíveis).
 */
export async function GET(request: Request) {
  try {
    const userOrError = await requireAdmin(request as any);
    if (userOrError instanceof NextResponse) return userOrError;

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const servicoId = searchParams.get('servicoId');

    if (!clienteId) {
      return NextResponse.json({ error: 'clienteId é obrigatório' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('pacotes_cliente')
      .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
      .eq('cliente_id', clienteId)
      .or(`data_validade.is.null,data_validade.gte.${new Date().toISOString().split('T')[0]}`);

    if (servicoId) {
      query = query.eq('servico_id', servicoId);
    }

    const { data: pacotesFetched, error } = await query;
    if (error) throw error;

    // Filtra no JS: sessoes_consumidas < sessoes_total
    const pacotes = (pacotesFetched || []).filter((p: any) => p.sessoes_consumidas < p.sessoes_total);
    if (pacotes.length === 0) return NextResponse.json([]);

    const servicoIds = [...new Set(pacotes.map((p: any) => p.servico_id))];
    const { data: servicos } = await supabaseAdmin
      .from('servicos')
      .select('id, nome')
      .in('id', servicoIds);

    const nomeMap: Record<string, string> = {};
    (servicos ?? []).forEach((s: any) => { nomeMap[s.id] = s.nome; });

    const result = pacotes.map((p: any) => ({
      id: p.id,
      servico_id: p.servico_id,
      servico_nome: nomeMap[p.servico_id] ?? 'Serviço',
      sessoes_restantes: p.sessoes_total - p.sessoes_consumidas,
      sessoes_total: p.sessoes_total,
      data_validade: p.data_validade ?? null,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na API ao buscar pacotes do cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/pacotes/cliente
 * Body: { clienteId: number, servicoId: string, quantidade?: number }
 * Debita sessões do pacote ativo mais antigo do cliente para aquele serviço.
 */
export async function PATCH(request: Request) {
  try {
    const userOrError = await requireAdmin(request as any);
    if (userOrError instanceof NextResponse) return userOrError;

    const body = await request.json();
    const { clienteId, servicoId, quantidade = 1 } = body;

    if (!clienteId || !servicoId) {
      return NextResponse.json({ error: 'clienteId e servicoId são obrigatórios' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: pacotes, error: fetchError } = await supabaseAdmin
      .from('pacotes_cliente')
      .select('id, sessoes_total, sessoes_consumidas')
      .eq('cliente_id', clienteId)
      .eq('servico_id', servicoId)
      .or(`data_validade.is.null,data_validade.gte.${today}`)
      .order('criado_em', { ascending: true });

    if (fetchError) throw fetchError;
    if (!pacotes || pacotes.length === 0) {
      return NextResponse.json({ error: 'Nenhum pacote ativo para este serviço' }, { status: 404 });
    }

    let qtdRestante = quantidade;
    const debitados: string[] = [];

    for (const pk of pacotes) {
      if (qtdRestante <= 0) break;
      const disponivel = pk.sessoes_total - pk.sessoes_consumidas;
      if (disponivel <= 0) continue;

      const toConsume = Math.min(qtdRestante, disponivel);
      const { error: updateError } = await supabaseAdmin
        .from('pacotes_cliente')
        .update({ sessoes_consumidas: pk.sessoes_consumidas + toConsume })
        .eq('id', pk.id);

      if (updateError) throw updateError;
      qtdRestante -= toConsume;
      debitados.push(pk.id);
    }

    return NextResponse.json({ success: true, debitados, saldoInsuficiente: qtdRestante > 0 });
  } catch (error: any) {
    console.error('Erro ao debitar sessão:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
