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
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (isRetail) query = query.eq('tipo', isRetail === 'true' ? 'revenda' : 'uso_interno');
    if (category) query = query.eq('categoria', category);
    if (search) query = query.ilike('nome', `%${search}%`);
    if (lowStock === 'true') query = query.filter('quantidade', 'lte', 'quantidade_minima');

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
    if (!sale_type || !professional_id || !products || products.length === 0) {
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
        .from('produtos')
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
      if (sale_type === 'retail_sale' && product.tipo !== 'revenda') {
        return NextResponse.json(
          { error: `${product.nome} não é produto de venda (é uso interno)` },
          { status: 400 }
        );
      }

      // Verificar estoque
      if (product.quantidade < quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para ${product.nome}`,
            available: product.quantidade,
            requested: quantity
          },
          { status: 409 }
        );
      }

      // Calcular valor (apenas para venda retail)
      if (sale_type === 'retail_sale') {
        const price = item.price || product.preco_venda;
        if (!price) {
          return NextResponse.json(
            { error: `Preço não definido para ${product.nome}` },
            { status: 400 }
          );
        }
        totalAmount += price * quantity;
      }

      productDetails.push({
        product_id,
        name: product.nome,
        quantity,
        price: sale_type === 'retail_sale' ? (item.price || product.preco_venda) : null
      });

      // Sem logs de movimentação (tabela removida)
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
        .from('transacoes')
        .insert({
          tipo: 'receita',
          valor: totalAmount,
          descricao: `Venda de produtos: ${productDetails.map(p => p.name).join(', ')}`,
          metodo: payment_method || 'dinheiro'
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
      const { data: prodAtual } = await supabase
        .from('produtos')
        .select('quantidade')
        .eq('id', item.product_id)
        .single();
      if (prodAtual) {
        await supabase
          .from('produtos')
          .update({ quantidade: prodAtual.quantidade - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // =====================================================
    // 5. VERIFICAR ALERTAS DE ESTOQUE CRÍTICO
    // =====================================================
    const lowStockAlerts = [];
    for (const item of products) {
      const { data: updatedProduct } = await supabase
        .from('produtos')
        .select('nome, quantidade, quantidade_minima')
        .eq('id', item.product_id)
        .single();

      if (updatedProduct && updatedProduct.quantidade <= (updatedProduct.quantidade_minima || 0)) {
        lowStockAlerts.push({
          product: updatedProduct.nome,
          quantity: updatedProduct.quantidade,
          min_quantity: updatedProduct.quantidade_minima
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
