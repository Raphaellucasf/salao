import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    // Verificar se o usuário é admin
    const userOrError = await requireAdmin(request as any);
    if (userOrError instanceof NextResponse) return userOrError;

    const body = await request.json();
    const { action, pacote, itens } = body;

    if (action === 'CREATE') {
      // 1. Inserir pacote
      const { data: newPacote, error: insertError } = await supabaseAdmin
        .from('pacotes_servicos')
        .insert([pacote])
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Inserir itens
      if (itens && itens.length > 0) {
        const itensPayload = itens.map((item: any) => ({
          ...item,
          pacote_id: newPacote.id
        }));
        
        const { error: itensError } = await supabaseAdmin
          .from('pacotes_servicos_itens')
          .insert(itensPayload);
          
        if (itensError) throw itensError;
      }

      return NextResponse.json({ success: true, pacote: newPacote });
    } 
    
    else if (action === 'UPDATE') {
      const { id, ...pacoteData } = pacote;
      
      // 1. Atualizar pacote
      const { error: updateError } = await supabaseAdmin
        .from('pacotes_servicos')
        .update(pacoteData)
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Deletar itens antigos
      const { error: deleteError } = await supabaseAdmin
        .from('pacotes_servicos_itens')
        .delete()
        .eq('pacote_id', id);

      if (deleteError) throw deleteError;

      // 3. Inserir novos itens
      if (itens && itens.length > 0) {
        const itensPayload = itens.map((item: any) => ({
          ...item,
          pacote_id: id
        }));
        
        const { error: itensError } = await supabaseAdmin
          .from('pacotes_servicos_itens')
          .insert(itensPayload);
          
        if (itensError) throw itensError;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na API de pacotes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin(request as any);
    if (authError instanceof NextResponse) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('pacotes_servicos')
        .select('*, pacotes_servicos_itens(*, servicos(*))')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabaseAdmin
        .from('pacotes_servicos')
        .select('*')
        .order('nome');
        
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Erro ao buscar pacotes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
