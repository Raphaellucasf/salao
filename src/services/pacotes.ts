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
