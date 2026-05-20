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
    console.log('[pacotes] verificarPacoteAtivo →', { cliente_id, servico_id, today });

    let query = supabase
      .from('pacotes_cliente')
      .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
      .eq('cliente_id', cliente_id)
      .or(`data_validade.is.null,data_validade.gte.${today}`);

    if (servico_id) {
      query = (query as any).eq('servico_id', servico_id);
    }

    const { data, error } = await query;
    console.log('[pacotes] pacotes_cliente raw:', { data, error });
    if (error) throw error;

    const pacotesComSaldo = (data || []).filter((p: any) => p.sessoes_consumidas < p.sessoes_total);
    console.log('[pacotes] pacotesComSaldo:', pacotesComSaldo);
    if (pacotesComSaldo.length === 0) return [];

    const servicoIds = [...new Set(pacotesComSaldo.map((p: any) => p.servico_id as string))];
    const { data: servicosData } = await supabase
      .from('servicos')
      .select('id, nome')
      .in('id', servicoIds);

    const nomeMap: Record<string, string> = {};
    (servicosData ?? []).forEach((s: any) => { nomeMap[s.id] = s.nome; });

    const resultado = pacotesComSaldo.map((p: any) => ({
      id: p.id,
      servico_id: p.servico_id,
      servico_nome: nomeMap[p.servico_id] ?? 'Serviço',
      sessoes_restantes: p.sessoes_total - p.sessoes_consumidas,
      sessoes_total: p.sessoes_total,
      data_validade: p.data_validade ?? null,
    }));
    console.log('[pacotes] resultado final:', resultado);
    return resultado;
  } catch (error) {
    console.error('[pacotes] Erro em verificarPacoteAtivo:', error);
    return [];
  }
}

/**
 * Debita 1 sessão do pacote de forma atômica.
 * Retorna false se o saldo já estiver esgotado no momento do débito.
 */
export async function debitarSessaoPacote(pacoteId: string): Promise<boolean> {
  console.log('[pacotes] debitarSessaoPacote →', pacoteId);
  const { data, error } = await (supabase as any).rpc('debitar_sessao_pacote', {
    p_pacote_id: pacoteId,
  });
  console.log('[pacotes] debitarSessaoPacote resultado:', { data, error });
  if (error) throw error;
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
  console.log('[pacotes] debitarSessaoPorServico →', { clienteId, servicoId, quantidade });
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('pacotes_cliente')
    .select('id, sessoes_consumidas, sessoes_total')
    .eq('cliente_id', clienteId)
    .eq('servico_id', servicoId)
    .or(`data_validade.is.null,data_validade.gte.${today}`)
    .order('criado_em', { ascending: true });

  console.log('[pacotes] pacotes candidatos ao débito:', { data, error });
  if (error || !data) return;

  let restante = quantidade;
  for (const pk of data) {
    if (restante <= 0) break;
    if (pk.sessoes_consumidas >= pk.sessoes_total) continue;
    const disponivel = pk.sessoes_total - pk.sessoes_consumidas;
    const debitar = Math.min(restante, disponivel);
    for (let i = 0; i < debitar; i++) {
      await debitarSessaoPacote(pk.id).catch((e) => console.error('[pacotes] erro ao debitar:', e));
    }
    restante -= debitar;
  }
}

/**
 * Registra a compra de um pacote de serviços, criando os registros de sessões
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
  console.log('[pacotes] registrarCompraPacote →', { comandaId, clienteId, itensPacote, unitId });

  // Guard: evita duplicação se fecharComanda for chamado mais de uma vez
  if (comandaId) {
    const { data: existing } = await supabase
      .from('pacotes_cliente')
      .select('id')
      .eq('comanda_origem_id', comandaId)
      .limit(1);
    if (existing && existing.length > 0) {
      console.log('[pacotes] registrarCompraPacote: já registrado para comanda', comandaId, '— ignorando');
      return;
    }
  }

  for (const item of itensPacote) {
    try {
      console.log('[pacotes] buscando pacote_servico id:', item.item_id);
      // Busca o pacote e seus itens (serviços incluídos)
      const { data: pacoteData, error: pacoteError } = await supabase
        .from('pacotes_servicos')
        .select('validade_dias, pacotes_servicos_itens(servico_id, quantidade)')
        .eq('id', item.item_id)
        .single();

      console.log('[pacotes] pacote_servico resultado:', { pacoteData, pacoteError });

      if (pacoteError || !pacoteData) {
        console.error('[pacotes] Pacote não encontrado:', item.item_id, pacoteError);
        continue;
      }

      const itens: any[] = (pacoteData as any).pacotes_servicos_itens ?? [];
      console.log('[pacotes] itens do pacote:', itens);
      if (itens.length === 0) {
        console.warn('[pacotes] AVISO: pacote sem itens — nada será registrado em pacotes_cliente');
        continue;
      }

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

      console.log('[pacotes] inserindo em pacotes_cliente:', pkRows);

      const { data: insertData, error: insertError } = await supabase
        .from('pacotes_cliente')
        .insert(pkRows)
        .select();

      console.log('[pacotes] resultado insert:', { insertData, insertError });

      if (insertError) {
        console.error('[pacotes] Erro ao inserir pacote_cliente:', insertError);
      }
    } catch (e) {
      console.error('[pacotes] Erro em registrarCompraPacote item:', item.item_id, e);
    }
  }
}
