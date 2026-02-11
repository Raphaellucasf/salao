// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// =====================================================
// API DE VENDAS - DIMAS DONA CONCEPT
// Venda Rápida de Produtos Retail + Uso Interno (Backbar)
// =====================================================

// GET - Lista produtos (com filtro retail/internal)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('unit_id');
    const isRetail = searchParams.get('is_retail'); // 'true' ou 'false'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('low_stock'); // 'true' para alertas

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (unitId) query = query.eq('unit_id', unitId);
    if (isRetail) query = query.eq('is_retail', isRetail === 'true');
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    if (lowStock === 'true') {
      query = query.lte('quantity', supabase.rpc('min_quantity'));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Registrar Venda ou Uso Interno
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sale_type, // 'retail_sale' ou 'internal_use'
      unit_id,
      professional_id, // Obrigatório
      products, // Array: [{product_id, quantity, price?}]
      appointment_id, // Opcional (se for uso interno durante serviço)
      payment_method,
      installments,
      notes
    } = body;

    // =====================================================
    // 1. VALIDAÇÕES
    // =====================================================
    if (!sale_type || !unit_id || !professional_id || !products || products.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    if (!['retail_sale', 'internal_use'].includes(sale_type)) {
      return NextResponse.json(
        { error: 'Tipo de venda inválido' },
        { status: 400 }
      );
    }

    let totalAmount = 0;
    const inventoryLogs = [];
    const productDetails = [];

    // =====================================================
    // 2. PROCESSAR CADA PRODUTO
    // =====================================================
    for (const item of products) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Dados do produto inválidos' },
          { status: 400 }
        );
      }

      // Buscar produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `Produto ${product_id} não encontrado` },
          { status: 404 }
        );
      }

      // Validar tipo de venda vs tipo de produto
      if (sale_type === 'retail_sale' && !product.is_retail) {
        return NextResponse.json(
          { error: `${product.name} não é produto de venda (é uso interno)` },
          { status: 400 }
        );
      }

      // Verificar estoque
      if (product.quantity < quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para ${product.name}`,
            available: product.quantity,
            requested: quantity
          },
          { status: 409 }
        );
      }

      // Calcular valor (apenas para venda retail)
      if (sale_type === 'retail_sale') {
        const price = item.price || product.sale_price;
        if (!price) {
          return NextResponse.json(
            { error: `Preço não definido para ${product.name}` },
            { status: 400 }
          );
        }
        totalAmount += price * quantity;
      }

      productDetails.push({
        product_id,
        name: product.name,
        quantity,
        price: sale_type === 'retail_sale' ? (item.price || product.sale_price) : null
      });

      // Preparar log de estoque
      inventoryLogs.push({
        product_id,
        unit_id,
        professional_id,
        appointment_id: appointment_id || null,
        movement_type: sale_type === 'retail_sale' ? 'sale' : 'internal_use',
        quantity: -quantity, // Negativo = saída
        reason: sale_type === 'retail_sale' 
          ? 'Venda direta ao cliente'
          : `Uso interno${appointment_id ? ' (serviço)' : ''}`,
        notes
      });
    }

    // =====================================================
    // 3. CRIAR TRANSAÇÃO (Apenas para Venda Retail)
    // =====================================================
    let transactionId = null;

    if (sale_type === 'retail_sale') {
      // Validar parcelamento (mínimo R$100/parcela)
      const installmentCount = installments || 1;
      if (installmentCount > 1) {
        const installmentValue = totalAmount / installmentCount;
        if (installmentValue < 100) {
          return NextResponse.json(
            {
              error: 'Valor mínimo de R$100,00 por parcela',
              total: totalAmount,
              installments: installmentCount,
              installment_value: installmentValue
            },
            { status: 400 }
          );
        }
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          unit_id,
          professional_id,
          type: 'product_sale',
          amount: totalAmount,
          description: `Venda de produtos: ${productDetails.map(p => p.name).join(', ')}`,
          payment_method: payment_method || 'cash',
          installments: installmentCount,
          installment_value: totalAmount / installmentCount
        })
        .select()
        .single();

      if (transactionError) {
        return NextResponse.json(
          { error: 'Erro ao criar transação' },
          { status: 500 }
        );
      }

      transactionId = transaction.id;
    }

    // =====================================================
    // 4. ATUALIZAR ESTOQUE E CRIAR LOGS
    // =====================================================
    for (const item of products) {
      // Atualizar quantidade do produto
      await supabase.rpc('decrement_product_quantity', {
        product_id: item.product_id,
        quantity_to_remove: item.quantity
      });

      // Nota: Se sua versão do Supabase não tem RPC, use UPDATE:
      // await supabase
      //   .from('products')
      //   .update({ quantity: supabase.sql`quantity - ${item.quantity}` })
      //   .eq('id', item.product_id);
    }

    // Inserir logs de movimentação
    const { error: logsError } = await supabase
      .from('inventory_logs')
      .insert(inventoryLogs);

    if (logsError) {
      console.error('Erro ao criar logs de estoque:', logsError);
      // Não retorna erro para não bloquear a venda
    }

    // =====================================================
    // 5. VERIFICAR ALERTAS DE ESTOQUE CRÍTICO
    // =====================================================
    const lowStockAlerts = [];
    for (const item of products) {
      const { data: updatedProduct } = await supabase
        .from('products')
        .select('name, quantity, min_quantity')
        .eq('id', item.product_id)
        .single();

      if (updatedProduct && updatedProduct.quantity <= updatedProduct.min_quantity) {
        lowStockAlerts.push({
          product: updatedProduct.name,
          quantity: updatedProduct.quantity,
          min_quantity: updatedProduct.min_quantity
        });
      }
    }

    // =====================================================
    // 6. RETORNAR RESPOSTA
    // =====================================================
    return NextResponse.json(
      {
        success: true,
        sale_type,
        transaction_id: transactionId,
        total_amount: totalAmount,
        products: productDetails,
        low_stock_alerts: lowStockAlerts.length > 0 ? lowStockAlerts : null,
        message: sale_type === 'retail_sale' 
          ? `Venda registrada: R$ ${totalAmount.toFixed(2)}`
          : 'Uso interno registrado com sucesso'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing sale:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// FUNÇÃO RPC NO SUPABASE (Execute no SQL Editor)
// =====================================================
/*
CREATE OR REPLACE FUNCTION decrement_product_quantity(
  product_id UUID,
  quantity_to_remove DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET quantity = quantity - quantity_to_remove,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
