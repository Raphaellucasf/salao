// @ts-nocheck
/**
 * API para n8n / WhatsApp bot
 * GET /api/whatsapp/horarios?profissional_id=UUID&data=YYYY-MM-DD&duracao=30
 *
 * Retorna os slots livres de um profissional em um dia específico.
 * Chame com a API Key no header: x-api-key: <N8N_API_KEY>
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.N8N_API_KEY;

export async function GET(request: NextRequest) {
  // Validação da chave de API
  const apiKey = request.headers.get('x-api-key');
  if (API_KEY && apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const profissional_id = searchParams.get('profissional_id');
    const data = searchParams.get('data'); // formato YYYY-MM-DD
    const duracao = parseInt(searchParams.get('duracao') || '30');

    if (!profissional_id || !data) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: profissional_id e data (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json(
        { error: 'Formato de data inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Buscar nome do profissional
    const { data: profissional } = await supabase
      .from('profissionais')
      .select('id, nome')
      .eq('id', profissional_id)
      .eq('ativo', true)
      .single();

    if (!profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Chamar a função de horários vagos
    const { data: slots, error } = await supabase
      .rpc('fn_horarios_vagos', {
        p_profissional_id: profissional_id,
        p_data: data,
        p_duracao_minutos: duracao,
      });

    if (error) throw error;

    // Filtrar apenas os horários livres e formatar
    const livres = (slots || [])
      .filter((s: any) => s.livre)
      .map((s: any) => ({
        hora_inicio: s.hora_inicio.slice(0, 5), // "HH:MM"
        hora_fim: s.hora_fim.slice(0, 5),
      }));

    // Formatar data para exibição
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return NextResponse.json({
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
      },
      data: dataFormatada,
      data_iso: data,
      total_livres: livres.length,
      horarios_livres: livres,
      // Texto pronto para enviar no WhatsApp
      mensagem_whatsapp: livres.length === 0
        ? `Não há horários disponíveis com ${profissional.nome} no dia ${dataFormatada}.`
        : `*Horários disponíveis com ${profissional.nome} em ${dataFormatada}:*\n\n` +
          livres.map((h: any, i: number) => `${i + 1}. ${h.hora_inicio} às ${h.hora_fim}`).join('\n') +
          '\n\nQual horário prefere?',
    });
  } catch (error: any) {
    console.error('[API horarios]', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
