import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Fechar agendamento e calcular comissões
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointment_id, payment_method } = body;

    if (!appointment_id || !payment_method) {
      return NextResponse.json(
        { error: 'appointment_id e payment_method são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o agendamento com relacionamentos
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        professional:professionals(*, user:users(*))
      `)
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Verifica se já foi finalizado
    if (appointment.status === 'completed') {
      return NextResponse.json({ error: 'Agendamento já foi finalizado' }, { status: 400 });
    }

    const servicePrice = appointment.service.price;
    const commissionPercentage = appointment.professional.commission_percentage;
    const commissionAmount = (servicePrice * commissionPercentage) / 100;
    const salonAmount = servicePrice - commissionAmount;

    // Inicia transação
    // 1. Atualiza status do agendamento
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointment_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Registra entrada de receita (total)
    const { data: incomeTransaction, error: incomeError } = await supabase
      .from('transactions')
      .insert({
        unit_id: appointment.unit_id,
        appointment_id,
        type: 'income',
        amount: servicePrice,
        description: `Serviço: ${appointment.service.name} - Cliente: ${appointment.client_name}`,
        payment_method
      })
      .select()
      .single();

    if (incomeError) {
      return NextResponse.json({ error: incomeError.message }, { status: 500 });
    }

    // 3. Registra comissão do profissional
    const { data: commissionTransaction, error: commissionError } = await supabase
      .from('transactions')
      .insert({
        unit_id: appointment.unit_id,
        appointment_id,
        professional_id: appointment.professional_id,
        type: 'commission',
        amount: commissionAmount,
        description: `Comissão ${commissionPercentage}% - ${appointment.service.name}`,
        payment_method
      })
      .select()
      .single();

    if (commissionError) {
      return NextResponse.json({ error: commissionError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Agendamento finalizado e comissões calculadas com sucesso',
      data: {
        appointment_id,
        service_price: servicePrice,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        salon_amount: salonAmount,
        income_transaction: incomeTransaction,
        commission_transaction: commissionTransaction
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
