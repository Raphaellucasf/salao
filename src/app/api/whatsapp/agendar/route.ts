// @ts-nocheck
/**
 * API para n8n / WhatsApp bot — Criação de agendamento
 * POST /api/whatsapp/agendar
 *
 * Body JSON:
 * {
 *   "profissional_id": "UUID",
 *   "data": "YYYY-MM-DD",
 *   "hora_inicio": "HH:MM",
 *   "servico_id": "UUID",          // opcional
 *   "cliente_nome": "João Silva",
 *   "cliente_telefone": "11999999999",
 *   "cliente_id": "UUID"            // opcional — se já for cliente cadastrado
 * }
 *
 * Chame com a API Key no header: x-api-key: <N8N_API_KEY>
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: NextRequest) {
  // Validação da chave de API
  const apiKey = request.headers.get('x-api-key');
  if (API_KEY && apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      profissional_id,
      data,           // YYYY-MM-DD
      hora_inicio,    // HH:MM
      servico_id,
      cliente_nome,
      cliente_telefone,
      cliente_id: cliente_id_param,
    } = body;

    // Validações obrigatórias
    if (!profissional_id || !data || !hora_inicio || !cliente_nome) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: profissional_id, data, hora_inicio, cliente_nome' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (!/^\d{2}:\d{2}$/.test(hora_inicio)) {
      return NextResponse.json({ error: 'Formato de hora inválido. Use HH:MM' }, { status: 400 });
    }

    // Buscar profissional
    const { data: profissional } = await supabase
      .from('profissionais')
      .select('id, nome')
      .eq('id', profissional_id)
      .eq('ativo', true)
      .single();

    if (!profissional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    // Buscar serviço e calcular hora_fim
    let duracao_minutos = 60; // padrão 1h
    let servico_nome = 'Agendamento via WhatsApp';

    if (servico_id) {
      const { data: servico } = await supabase
        .from('servicos')
        .select('id, nome, duracao_minutos')
        .eq('id', servico_id)
        .single();

      if (servico) {
        duracao_minutos = servico.duracao_minutos || 60;
        servico_nome = servico.nome;
      }
    }

    // Calcular hora_fim
    const [h, m] = hora_inicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + duracao_minutos;
    const hora_fim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

    // Verificar conflito antes de agendar
    const { data: conflito } = await supabase.rpc('verificar_conflito_horario_v2', {
      p_profissional_id: profissional_id,
      p_data: data,
      p_hora_inicio: hora_inicio,
      p_hora_fim: hora_fim,
    });

    if (conflito) {
      return NextResponse.json(
        { error: `Horário ${hora_inicio} já está ocupado com ${profissional.nome}. Escolha outro horário.` },
        { status: 409 }
      );
    }

    // Buscar ou criar cliente
    let cliente_id = cliente_id_param || null;

    if (!cliente_id && cliente_telefone) {
      // Tentar achar pelo telefone
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', cliente_telefone)
        .maybeSingle();

      if (clienteExistente) {
        cliente_id = clienteExistente.id;
      }
    }

    if (!cliente_id) {
      // Criar novo cliente
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          nome: cliente_nome,
          telefone: cliente_telefone || null,
          ativo: true,
        }])
        .select('id')
        .single();

      if (clienteError) throw clienteError;
      cliente_id = novoCliente.id;
    }

    // Criar agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert([{
        profissional_id,
        cliente_id,
        cliente_nome,
        data_agendamento: data,
        hora_inicio,
        hora_fim,
        status: 'agendado',
        observacoes: `Agendado via WhatsApp${servico_id ? '' : ' — serviço a definir'}`,
      }])
      .select('id')
      .single();

    if (agendamentoError) throw agendamentoError;

    // Formatar data para resposta
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return NextResponse.json({
      sucesso: true,
      agendamento_id: agendamento.id,
      mensagem_whatsapp:
        `✅ *Agendamento confirmado!*\n\n` +
        `👤 Cliente: ${cliente_nome}\n` +
        `💇 Profissional: ${profissional.nome}\n` +
        `📅 Data: ${dataFormatada}\n` +
        `🕐 Horário: ${hora_inicio} às ${hora_fim}\n\n` +
        `Te esperamos! 😊`,
    });

  } catch (error: any) {
    console.error('[API agendar]', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
