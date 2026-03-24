// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Registrar transação financeira
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unit_id,
      appointment_id,
      professional_id,
      type, // 'income', 'expense', 'commission'
      amount,
      description,
      payment_method
    } = body;

    // Validação
    if (!unit_id || !type || !amount || !description || !payment_method) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('transacoes')
      .insert({
        tipo: type,
        valor: amount,
        descricao: description,
        metodo: payment_method,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Listar transações
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('unit_id');
    const type = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false });

    if (type) {
      query = query.eq('tipo', type);
    }

    if (startDate) {
      query = query.gte('data', startDate);
    }

    if (endDate) {
      query = query.lte('data', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
