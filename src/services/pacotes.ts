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
      query = query.eq('servico_id', servico_id);
    }

    const { data, error } = await query;
    console.log('[pacotes] pacotes_cliente raw:', { data, error });
    if (error) throw error;

    const pacotesComSaldo = (data || []).filter((p) => p.sessoes_consumidas < p.sessoes_total);
    console.log('[pacotes] pacotesComSaldo:', pacotesComSaldo);
    if (pacotesComSaldo.length === 0) return [];

    const servicoIds = [...new Set(pacotesComSaldo.map((p) => p.servico_id))];
    const { data: servicosData } = await supabase
      .from('servicos')
      .select('id, nome')
      .in('id', servicoIds);

    const nomeMap: Record<string, string> = {};
    (servicosData ?? []).forEach((s) => { nomeMap[s.id] = s.nome; });

    const resultado = pacotesComSaldo.map((p) => ({
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
