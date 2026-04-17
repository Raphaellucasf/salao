import { supabase } from '@/lib/supabase';
import { DEFAULT_UNIT_ID } from './caixa';

export interface PacoteAtivo {
  id: string;
  servico_id: string;
  servico_nome: string;
  sessoes_restantes: number;
  sessoes_total: number;
  data_validade: string | null;
}

/**
 * Retorna os pacotes com saldo disponível para um dado CPF + serviço.
 * Se servico_id for omitido, retorna todos os pacotes ativos do cliente.
 */
export async function verificarPacoteAtivo(
  cpf: string,
  servico_id?: string,
): Promise<PacoteAtivo[]> {
  if (!cpf) return [];

  const cpfLimpo = cpf.replace(/\D/g, '');
  if (!cpfLimpo) return [];

  let query = (supabase as any)
    .from('pacotes_cliente')
    .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
    .eq('unit_id', DEFAULT_UNIT_ID)
    .filter('cliente_cpf', 'in', `("${cpf}","${cpfLimpo}")`)
    .lt('sessoes_consumidas', 'sessoes_total')
    .or(`data_validade.is.null,data_validade.gte.${new Date().toISOString().split('T')[0]}`);

  if (servico_id) {
    query = query.eq('servico_id', servico_id);
  }

  const { data: pacotes } = await query;
  if (!pacotes || pacotes.length === 0) return [];

  // Buscar nomes dos serviços
  const servicoIds = [...new Set((pacotes as any[]).map((p: any) => p.servico_id))];
  const { data: servicos } = await supabase
    .from('servicos')
    .select('id, nome')
    .in('id', servicoIds);

  const nomeMap: Record<string, string> = {};
  (servicos ?? []).forEach((s: any) => { nomeMap[s.id] = s.nome; });

  return (pacotes as any[]).map((p: any) => ({
    id: p.id,
    servico_id: p.servico_id,
    servico_nome: nomeMap[p.servico_id] ?? 'Serviço',
    sessoes_restantes: p.sessoes_total - p.sessoes_consumidas,
    sessoes_total: p.sessoes_total,
    data_validade: p.data_validade ?? null,
  }));
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
