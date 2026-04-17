// Placeholder fixo para unit_id (tabela units não existe em produção)
export const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

export interface ComandaResumo {
  id: number;
  numero_comanda: number;
  cliente_nome: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  data_fechamento: string | null;
}

export interface FechamentoCaixa {
  id: string;
  data_fechamento: string;
  fechado_por: string;
  fechado_em: string;
  total_bruto: number;
  total_desconto: number;
  total_liquido: number;
  total_dinheiro: number;
  total_cartao: number;
  total_pix: number;
  total_outros: number;
  total_comissoes: number;
  status: 'fechado' | 'reaberto';
  fechado_por_nome?: string;
  reaberto_por?: string | null;
  reaberto_em?: string | null;
}

export interface ResumoDia {
  data: string;
  comandas: ComandaResumo[];
  total_bruto: number;
  total_desconto: number;
  total_liquido: number;
  total_comissoes: number;
  total_dinheiro: number;
  total_cartao: number;
  total_pix: number;
  total_outros: number;
  fechamento: FechamentoCaixa | null;
}

// Todas as operações de caixa passam pela API route (/api/admin/caixa)
// que usa supabaseAdmin (service_role) para bypassar RLS em fechamentos_caixa.

export async function buscarResumoDia(data: string): Promise<ResumoDia> {
  const resp = await fetch(`/api/admin/caixa?data=${data}`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${resp.status} ao buscar resumo do dia`);
  }
  return resp.json();
}

export async function fecharCaixa(
  data: string,
  userId: string,
  resumo: Pick<ResumoDia, 'total_bruto' | 'total_desconto' | 'total_liquido' | 'total_comissoes'>,
): Promise<void> {
  const resp = await fetch('/api/admin/caixa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data,
      fechado_por: userId,
      total_bruto: resumo.total_bruto,
      total_desconto: resumo.total_desconto,
      total_liquido: resumo.total_liquido,
      total_comissoes: resumo.total_comissoes,
    }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${resp.status} ao fechar caixa`);
  }
}

export async function reabrirCaixa(fechamentoId: string, userId: string): Promise<void> {
  const resp = await fetch('/api/admin/caixa', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fechamento_id: fechamentoId, reaberto_por: userId }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${resp.status} ao reabrir caixa`);
  }
}
