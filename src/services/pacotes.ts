import { supabase } from '@/lib/supabase';

export interface PacoteAtivo {
  id: string;
  servico_id: string;
  servico_nome: string;
  sessoes_restantes: number;
  sessoes_total: number;
  data_validade: string | null;
}

/**
 * Retorna os pacotes com saldo disponível para um cliente + serviço.
 * Se servico_id for omitido, retorna todos os pacotes ativos do cliente.
 */
export async function verificarPacoteAtivo(
  cliente_id: number,
  servico_id?: string,
): Promise<PacoteAtivo[]> {
  if (!cliente_id) return [];

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('pacotes_cliente')
      .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
      .eq('cliente_id', cliente_id)
      .or(`data_validade.is.null,data_validade.gte.${today}`);

    if (servico_id) {
      query = (query as any).eq('servico_id', servico_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const pacotesComSaldo = (data || []).filter((p: any) => p.sessoes_consumidas < p.sessoes_total);
    if (pacotesComSaldo.length === 0) return [];

    const servicoIds = [...new Set(pacotesComSaldo.map((p: any) => p.servico_id as string))];
    const { data: servicosData } = await supabase
      .from('servicos')
      .select('id, nome')
      .in('id', servicoIds);

    const nomeMap: Record<string, string> = {};
    (servicosData ?? []).forEach((s: any) => { nomeMap[s.id] = s.nome; });

    return pacotesComSaldo.map((p: any) => ({
      id: p.id,
      servico_id: p.servico_id,
      servico_nome: nomeMap[p.servico_id] ?? 'Serviço',
      sessoes_restantes: p.sessoes_total - p.sessoes_consumidas,
      sessoes_total: p.sessoes_total,
      data_validade: p.data_validade ?? null,
    }));
  } catch (error) {
    console.error('Erro em verificarPacoteAtivo:', error);
    return [];
  }
}

/**
 * Debita 1 sessão do pacote de forma atômica.
 * Retorna false se o saldo já estiver esgotado no momento do débito.
 */
export async function debitarSessaoPacote(pacoteId: string): Promise<boolean> {
  // UPDATE atômico: só executa se sessoes_consumidas < sessoes_total
  const { data, error } = await (supabase as any).rpc('debitar_sessao_pacote', {
    p_pacote_id: pacoteId,
  });
  if (error) throw error;
  // A função retorna TRUE se debitou, FALSE se já estava esgotado
  return data === true;
}

/**
 * Debita N sessões do pacote ativo mais antigo do cliente para um serviço.
 * Usado ao fechar comanda com itens "(Sessão de Pacote)".
 */
export async function debitarSessaoPorServico(
  clienteId: number,
  servicoId: string,
  quantidade = 1,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('pacotes_cliente')
    .select('id, sessoes_consumidas, sessoes_total')
    .eq('cliente_id', clienteId)
    .eq('servico_id', servicoId)
    .or(`data_validade.is.null,data_validade.gte.${today}`)
    .order('criado_em', { ascending: true });

  if (error || !data) return;

  let restante = quantidade;
  for (const pk of data) {
    if (restante <= 0) break;
    if (pk.sessoes_consumidas >= pk.sessoes_total) continue;
    const disponivel = pk.sessoes_total - pk.sessoes_consumidas;
    const debitar = Math.min(restante, disponivel);
    for (let i = 0; i < debitar; i++) {
      await debitarSessaoPacote(pk.id).catch(() => null);
    }
    restante -= debitar;
  }
}
 * em pacotes_cliente. Chamado após salvar a comanda.
 */
export async function registrarCompraPacote(params: {
  comandaId: number | null;
  clienteId: number;
  clienteCpf: string | null;
  itensPacote: Array<{ item_id: string; quantidade: number }>;
  unitId: string;
}): Promise<void> {
  const { comandaId, clienteId, clienteCpf, itensPacote, unitId } = params;
  if (!itensPacote || itensPacote.length === 0) return;

  for (const item of itensPacote) {
    try {
      // Busca o pacote e seus itens (serviços incluídos)
      const { data: pacoteData, error: pacoteError } = await supabase
        .from('pacotes_servicos')
        .select('validade_dias, pacotes_servicos_itens(servico_id, quantidade)')
        .eq('id', item.item_id)
        .single();

      if (pacoteError || !pacoteData) {
        console.error('Pacote não encontrado:', item.item_id, pacoteError);
        continue;
      }

      const itens: any[] = (pacoteData as any).pacotes_servicos_itens ?? [];
      if (itens.length === 0) continue;

      const validadeDias: number | null = (pacoteData as any).validade_dias ?? null;
      const dataValidade = validadeDias
        ? new Date(Date.now() + validadeDias * 86_400_000).toISOString().split('T')[0]
        : null;

      const pkRows = itens.map((ps: any) => ({
        unit_id: unitId,
        cliente_cpf: clienteCpf || null,
        cliente_id: clienteId,
        servico_id: ps.servico_id,
        sessoes_total: (ps.quantidade || 1) * (item.quantidade || 1),
        sessoes_consumidas: 0,
        comanda_origem_id: comandaId,
        data_validade: dataValidade,
      }));

      const { error: insertError } = await supabase
        .from('pacotes_cliente')
        .insert(pkRows);

      if (insertError) {
        console.error('Erro ao inserir pacote_cliente:', insertError);
      }
    } catch (e) {
      console.error('Erro em registrarCompraPacote item:', item.item_id, e);
    }
  }
}
