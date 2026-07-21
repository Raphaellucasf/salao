import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const CARTAO_METODOS = [
  'credito', 'debito', 'cartao', 'credit', 'debit', 'cartao_credito', 'cartao_debito',
];

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

function somarValores(rows: Array<{ valor?: string | number | null }>, field: 'valor' = 'valor'): number {
  const centavos = rows.reduce((total, row) => {
    const value = Number(row[field] ?? 0);
    return total + (Number.isFinite(value) ? Math.round(value * 100) : 0);
  }, 0);
  return centavos / 100;
}

function totaisPorMetodo(rows: Array<{ valor: string | number; metodo: string | null }>) {
  const somar = (predicate: (metodo: string) => boolean) => somarValores(
    rows.filter((row) => predicate(row.metodo ?? '')).map((row) => ({ valor: row.valor }))
  );
  return {
    total_dinheiro: somar((metodo) => metodo === 'dinheiro'),
    total_cartao: somar((metodo) => CARTAO_METODOS.includes(metodo)),
    total_pix: somar((metodo) => metodo === 'pix'),
    total_outros: somar((metodo) => !['dinheiro', 'pix', ...CARTAO_METODOS].includes(metodo)),
  };
}

function proximoDia(data: string): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

// GET /api/admin/caixa?data=2026-04-13
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const data = req.nextUrl.searchParams.get('data');
  if (!data || !dataValida(data)) {
    return NextResponse.json({ error: 'data inválida' }, { status: 400 });
  }

  const proximo = proximoDia(data);

  const supabase = createServerSupabase(authResult.unitId);

  // Primeira fase: fontes independentes são lidas em paralelo.
  const [comandasResult, fechamentoResult, transacoesResult] = await Promise.all([
    supabase
      .from('comandas')
      .select('id, numero_comanda, cliente_nome, subtotal, desconto, total, data_fechamento')
      .eq('unit_id', authResult.unitId)
      .eq('status', 'fechada')
      .gte('data_fechamento', `${data}T00:00:00`)
      .lt('data_fechamento', `${proximo}T00:00:00`)
      .order('id', { ascending: true }),
    supabase
      .from('fechamentos_caixa')
      .select('*')
      .eq('unit_id', authResult.unitId)
      .eq('data_fechamento', data)
      .order('fechado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('transacoes')
      .select('valor, metodo')
      .eq('unit_id', authResult.unitId)
      .eq('tipo', 'receita')
      .eq('data', data),
  ]);

  const firstError = comandasResult.error || fechamentoResult.error || transacoesResult.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const lista = (comandasResult.data ?? []) as Array<{
    id: number;
    numero_comanda: number;
    cliente_nome: string | null;
    subtotal: string | number | null;
    desconto: string | number | null;
    total: string | number | null;
    data_fechamento: string;
  }>;
  const fechamento = fechamentoResult.data;
  const ids = lista.map((comanda) => comanda.id);

  // Segunda fase: dependências das comandas e do fechamento também são paralelas.
  const [comissoesResult, userResult] = await Promise.all([
    ids.length > 0
      ? supabase.from('comissoes').select('valor_comissao').in('comanda_id', ids)
      : Promise.resolve({ data: [], error: null }),
    fechamento
      ? supabase
          .from('users')
          .select('full_name')
          .eq('id', fechamento.fechado_por)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const dependentError = comissoesResult.error || userResult.error;
  if (dependentError) return NextResponse.json({ error: dependentError.message }, { status: 500 });

  const total_bruto = somarValores(lista.map((row) => ({ valor: row.subtotal })));
  const total_desconto = somarValores(lista.map((row) => ({ valor: row.desconto })));
  const total_liquido = somarValores(lista.map((row) => ({ valor: row.total })));
  const total_comissoes = somarValores(
    ((comissoesResult.data ?? []) as Array<{ valor_comissao: string | number | null }>).map(
      (row) => ({ valor: row.valor_comissao })
    )
  );
  const fechamentoFull = fechamento
    ? {
        ...fechamento,
        fechado_por_nome: userResult.data?.full_name ?? fechamento.fechado_por,
      }
    : null;

  const txRows = transacoesResult.data;

  const txList = (txRows ?? []) as { valor: number; metodo: string }[];
  const { total_dinheiro, total_cartao, total_pix, total_outros } = totaisPorMetodo(txList);

  return NextResponse.json({
    data,
    comandas: lista,
    total_bruto,
    total_desconto,
    total_liquido,
    total_comissoes,
    total_dinheiro,
    total_cartao,
    total_pix,
    total_outros,
    fechamento: fechamentoFull,
  });
}

// POST /api/admin/caixa  — fechar caixa
export async function POST(req: NextRequest) {
  // B-05 FIX: verificar que o chamador é admin antes de fechar o caixa (RN-CXA-001)
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { data } = await req.json();

    if (typeof data !== 'string' || !dataValida(data)) {
      return NextResponse.json({ error: 'data inválida' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const proximo = proximoDia(data);

    // C-04 FIX: calcular totais por método de pagamento no servidor, a partir das
    // transações vinculadas às comandas fechadas no dia. Não confia nos valores
    // enviados pelo cliente — sempre recalcula da fonte (tabela transacoes).
    const [comandasResult, transacoesResult] = await Promise.all([
      supabase
        .from('comandas')
        .select('id, subtotal, desconto, total')
        .eq('unit_id', authResult.unitId)
        .eq('status', 'fechada')
        .gte('data_fechamento', `${data}T00:00:00`)
        .lt('data_fechamento', `${proximo}T00:00:00`),
      supabase
        .from('transacoes')
        .select('valor, metodo')
        .eq('unit_id', authResult.unitId)
        .eq('tipo', 'receita')
        .eq('data', data),
    ]);

    if (comandasResult.error || transacoesResult.error) {
      return NextResponse.json(
        { error: comandasResult.error?.message || transacoesResult.error?.message },
        { status: 500 }
      );
    }

    const comandasDoDia = (comandasResult.data ?? []) as Array<{
      id: number;
      subtotal: string | number | null;
      desconto: string | number | null;
      total: string | number | null;
    }>;
    const txList = (transacoesResult.data ?? []) as Array<{
      valor: string | number;
      metodo: string | null;
    }>;
    const ids = comandasDoDia.map((comanda) => comanda.id);
    let total_comissoes = 0;
    if (ids.length > 0) {
      const { data: comissoes, error: comissoesError } = await supabase
        .from('comissoes')
        .select('valor_comissao')
        .in('comanda_id', ids);
      if (comissoesError) {
        return NextResponse.json({ error: comissoesError.message }, { status: 500 });
      }
      total_comissoes = somarValores(
        ((comissoes ?? []) as Array<{ valor_comissao: string | number | null }>).map(
          (row) => ({ valor: row.valor_comissao })
        )
      );
    }

    const total_bruto = somarValores(comandasDoDia.map((row) => ({ valor: row.subtotal })));
    const total_desconto = somarValores(comandasDoDia.map((row) => ({ valor: row.desconto })));
    const total_liquido = somarValores(comandasDoDia.map((row) => ({ valor: row.total })));
    const { total_dinheiro, total_cartao, total_pix, total_outros } = totaisPorMetodo(txList);

    // UPSERT: se já existe registro para o dia, atualiza em vez de falhar com 409
    const { error } = await supabase
      .from('fechamentos_caixa')
      .upsert([{
        unit_id: authResult.unitId,
        data_fechamento: data,
        fechado_por: authResult.id,
        total_bruto,
        total_desconto,
        total_liquido,
        // C-04 FIX: valores calculados do DB, não zeros fixos
        total_dinheiro,
        total_cartao,
        total_pix,
        total_outros,
        total_comissoes,
        status: 'fechado',
      }], { onConflict: 'unit_id,data_fechamento' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/admin/caixa  — reabrir caixa
export async function PATCH(req: NextRequest) {
  // B-05 FIX: verificar que o chamador é admin antes de reabrir o caixa (RN-CXA-007)
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { fechamento_id } = await req.json();

    if (!fechamento_id) {
      return NextResponse.json({ error: 'fechamento_id é obrigatório' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { error } = await supabase
      .from('fechamentos_caixa')
      .update({ status: 'reaberto', reaberto_por: authResult.id, reaberto_em: new Date().toISOString() })
      .eq('id', fechamento_id)
      .eq('unit_id', authResult.unitId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
