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
  cliente_id: number,
  servico_id?: string,
): Promise<PacoteAtivo[]> {
  if (!cliente_id) return [];

  try {
    let url = `/api/admin/pacotes/cliente?clienteId=${cliente_id}`;
    if (servico_id) {
      url += `&servicoId=${servico_id}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar pacotes');

    const pacotes = await res.json();
    return Array.isArray(pacotes) ? pacotes : [];
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
