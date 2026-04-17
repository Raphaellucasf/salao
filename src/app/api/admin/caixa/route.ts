import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

function proximoDia(data: string): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// GET /api/admin/caixa?data=2026-04-13
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data');
  if (!data) return NextResponse.json({ error: 'data obrigatória' }, { status: 400 });

  const proximo = proximoDia(data);

  const supabase = createServerSupabase();

  // 1. Comandas fechadas no dia (por data_fechamento)
  const { data: comandas, error: cmdErr } = await (supabase as any)
    .from('comandas')
    .select('id, numero_comanda, cliente_nome, subtotal, desconto, total, data_fechamento')
    .eq('status', 'fechada')
    .gte('data_fechamento', `${data}T00:00:00`)
    .lt('data_fechamento', `${proximo}T00:00:00`)
    .order('id', { ascending: true });

  if (cmdErr) return NextResponse.json({ error: cmdErr.message }, { status: 500 });

  const lista = (comandas ?? []) as any[];
  const total_bruto    = lista.reduce((s: number, c: any) => s + (Number(c.subtotal) || 0), 0);
  const total_desconto = lista.reduce((s: number, c: any) => s + (Number(c.desconto)  || 0), 0);
  const total_liquido  = lista.reduce((s: number, c: any) => s + (Number(c.total)     || 0), 0);

  // 2. Comissões do dia
  let total_comissoes = 0;
  if (lista.length > 0) {
    const ids = lista.map((c: any) => c.id);
    const { data: comissoes } = await (supabase as any)
      .from('comissoes')
      .select('valor_comissao')
      .in('comanda_id', ids);
    total_comissoes = ((comissoes ?? []) as any[]).reduce(
      (s: number, c: any) => s + (Number(c.valor_comissao) || 0), 0,
    );
  }

  // 3. Fechamento existente — busca só por data (sem filtro unit_id para evitar mismatch)
  const { data: fechamento } = await (supabase as any)
    .from('fechamentos_caixa')
    .select('*')
    .eq('data_fechamento', data)
    .order('fechado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  let fechamentoFull = null;
  if (fechamento) {
    const { data: usr } = await (supabase as any)
      .from('users')
      .select('full_name')
      .eq('id', fechamento.fechado_por)
      .maybeSingle();
    fechamentoFull = { ...fechamento, fechado_por_nome: usr?.full_name ?? fechamento.fechado_por };
  }

  // 4. Transações do dia — breakdown por método de pagamento
  const { data: txRows } = await (supabase as any)
    .from('transacoes')
    .select('valor, metodo')
    .eq('tipo', 'receita')
    .eq('data', data);

  const txList = (txRows ?? []) as { valor: number; metodo: string }[];
  const CARTAO_METODOS = ['credito', 'debito', 'cartao', 'credit', 'debit'];
  const total_dinheiro = txList.filter(t => t.metodo === 'dinheiro').reduce((s, t) => s + Number(t.valor), 0);
  const total_cartao   = txList.filter(t => CARTAO_METODOS.includes(t.metodo)).reduce((s, t) => s + Number(t.valor), 0);
  const total_pix      = txList.filter(t => t.metodo === 'pix').reduce((s, t) => s + Number(t.valor), 0);
  const total_outros   = txList
    .filter(t => !['dinheiro', 'pix', ...CARTAO_METODOS].includes(t.metodo))
    .reduce((s, t) => s + Number(t.valor), 0);

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
    const body = await req.json();
    const { data, fechado_por, total_bruto, total_desconto, total_liquido, total_comissoes } = body;

    if (!data || !fechado_por) {
      return NextResponse.json({ error: 'data e fechado_por são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const proximo = proximoDia(data);

    // C-04 FIX: calcular totais por método de pagamento no servidor, a partir das
    // transações vinculadas às comandas fechadas no dia. Não confia nos valores
    // enviados pelo cliente — sempre recalcula da fonte (tabela transacoes).
    const { data: comandasDoDia } = await (supabase as any)
      .from('comandas')
      .select('id')
      .eq('status', 'fechada')
      .gte('data_fechamento', `${data}T00:00:00`)
      .lt('data_fechamento', `${proximo}T00:00:00`);

    const CARTAO_METODOS = ['credito', 'debito', 'cartao', 'credit', 'debit',
                            'cartao_credito', 'cartao_debito'];

    let total_dinheiro = 0;
    let total_cartao   = 0;
    let total_pix      = 0;
    let total_outros   = 0;

    if (comandasDoDia && comandasDoDia.length > 0) {
      // Filtrar transações por data (comanda_id não existe na tabela transacoes).
      // Após executar migration A-05 (unit_id em transacoes), adicionar .eq('unit_id', ...) aqui.
      const { data: txRows } = await (supabase as any)
        .from('transacoes')
        .select('valor, metodo')
        .eq('tipo', 'receita')
        .eq('data', data);

      const txList = (txRows ?? []) as { valor: number; metodo: string }[];
      total_dinheiro = txList
        .filter(t => t.metodo === 'dinheiro')
        .reduce((s, t) => s + Number(t.valor), 0);
      total_cartao = txList
        .filter(t => CARTAO_METODOS.includes(t.metodo))
        .reduce((s, t) => s + Number(t.valor), 0);
      total_pix = txList
        .filter(t => t.metodo === 'pix')
        .reduce((s, t) => s + Number(t.valor), 0);
      total_outros = txList
        .filter(t => !['dinheiro', 'pix', ...CARTAO_METODOS].includes(t.metodo))
        .reduce((s, t) => s + Number(t.valor), 0);
    }

    // UPSERT: se já existe registro para o dia, atualiza em vez de falhar com 409
    const { error } = await (supabase as any)
      .from('fechamentos_caixa')
      .upsert([{
        unit_id: DEFAULT_UNIT_ID,
        data_fechamento: data,
        fechado_por,
        total_bruto:     total_bruto    ?? 0,
        total_desconto:  total_desconto ?? 0,
        total_liquido:   total_liquido  ?? 0,
        // C-04 FIX: valores calculados do DB, não zeros fixos
        total_dinheiro,
        total_cartao,
        total_pix,
        total_outros,
        total_comissoes: total_comissoes ?? 0,
        status: 'fechado',
      }], { onConflict: 'unit_id,data_fechamento' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/admin/caixa  — reabrir caixa
export async function PATCH(req: NextRequest) {
  // B-05 FIX: verificar que o chamador é admin antes de reabrir o caixa (RN-CXA-007)
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { fechamento_id, reaberto_por } = await req.json();

    if (!fechamento_id || !reaberto_por) {
      return NextResponse.json({ error: 'fechamento_id e reaberto_por são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await (supabase as any)
      .from('fechamentos_caixa')
      .update({ status: 'reaberto', reaberto_por, reaberto_em: new Date().toISOString() })
      .eq('id', fechamento_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
