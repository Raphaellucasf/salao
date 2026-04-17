import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

/**
 * POST /api/admin/fechar-comanda
 * Registra a transação de receita ao fechar uma comanda.
 * Usa supabaseAdmin (service_role) para garantir que o insert
 * em `transacoes` não seja bloqueado por RLS.
 * Protegido pelo middleware (verifica cookie de sessão).
 */
export async function POST(req: NextRequest) {
  try {
    const {
      comanda_id,
      metodo_pagamento,
      descricao,
      valor,
      data,
      categoria = 'Serviços',
    } = await req.json();

    if (!comanda_id || !descricao || !data || valor === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: comanda_id, descricao, valor, data' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { error } = await (supabase as any)
      .from('transacoes')
      .insert({
        tipo: 'receita',
        descricao,
        categoria,
        valor: Number(valor),
        metodo: metodo_pagamento || 'dinheiro',
        data,
      });

    if (error) {
      console.error('[fechar-comanda] Erro ao inserir transação:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[fechar-comanda] Erro inesperado:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
