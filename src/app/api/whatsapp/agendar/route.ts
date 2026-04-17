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
// C-01 FIX: usar service_role (createServerSupabase) em vez do browser client (anon_key).
// O browser client usa anon_key e pode ser bloqueado por RLS em inserts server-side.
import { createServerSupabase } from '@/lib/supabase-server';

const API_KEY = process.env.N8N_API_KEY;

/** Registra cada chamada em webhook_log. Falha silenciosa — nunca propaga erros. */
async function logWebhook(
  payload: unknown,
  status_code: number,
  erro: string | null,
): Promise<void> {
  try {
    const supabase = createServerSupabase() as any;
    await supabase.from('webhook_log').insert([{
      endpoint: '/api/whatsapp/agendar',
      payload,
      status_code,
      erro,
    }]);
  } catch {
    // Intencional: erro de log não cancela nem atrasa a resposta principal
  }
}

export async function POST(request: NextRequest) {
  // Validação da chave de API (antes de parsear body)
  const apiKey = request.headers.get('x-api-key');
  if (API_KEY && apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};

  try {
    body = await request.json();
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
      void logWebhook(body, 400, 'Campos obrigatórios ausentes');
      return NextResponse.json(
        { error: 'Campos obrigatórios: profissional_id, data, hora_inicio, cliente_nome' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      void logWebhook(body, 400, 'Formato de data inválido');
      return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (!/^\d{2}:\d{2}$/.test(hora_inicio)) {
      void logWebhook(body, 400, 'Formato de hora inválido');
      return NextResponse.json({ error: 'Formato de hora inválido. Use HH:MM' }, { status: 400 });
    }

    // Instância server-side para todas as operações desta request
    const supabase = createServerSupabase();

    // Buscar profissional
    const { data: profissional } = await (supabase as any)
      .from('profissionais')
      .select('id, nome')
      .eq('id', profissional_id)
      .eq('ativo', true)
      .single();

    if (!profissional) {
      void logWebhook(body, 404, 'Profissional não encontrado');
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    // Buscar serviço e calcular hora_fim
    let duracao_minutos = 60; // padrão 1h
    let servico_nome = 'Agendamento via WhatsApp';

    if (servico_id) {
      const { data: servico } = await (supabase as any)
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

    // Normalizar telefone (somente dígitos) para lookup consistente
    const telefoneLimpo = cliente_telefone ? cliente_telefone.replace(/\D/g, '') : null;

    // Buscar ou criar cliente
    let cliente_id = cliente_id_param || null;

    if (!cliente_id && telefoneLimpo) {
      const { data: clienteExistente } = await (supabase as any)
        .from('clientes')
        .select('id')
        .eq('telefone', telefoneLimpo)
        .maybeSingle();

      if (clienteExistente) {
        cliente_id = clienteExistente.id;
      }
    }

    if (!cliente_id) {
      // C-01 FIX: criar cliente com flags de completude (RN-CLI-001, T-03)
      const { data: novoCliente, error: clienteError } = await (supabase as any)
        .from('clientes')
        .insert([{
          nome: cliente_nome,
          telefone: telefoneLimpo || null,
          ativo: true,
          cadastro_completo: false,     // cliente criado pelo robô: cadastro incompleto
          origem_cadastro: 'whatsapp',  // rastrear origem (RN-CLI-001)
        }])
        .select('id')
        .single();

      if (clienteError) throw clienteError;
      cliente_id = novoCliente.id;
    }

    // ── IDEMPOTÊNCIA ───────────────────────────────────────────────────────────
    // Chave: mesmo cliente + data + horário já existe → retorna agendamento existente
    // sem duplicar (o n8n pode reenviar o mesmo payload mais de uma vez)
    const { data: agendamentoExistente } = await (supabase as any)
      .from('agendamentos')
      .select('id')
      .eq('cliente_id', cliente_id)
      .eq('data_agendamento', data)
      .eq('hora_inicio', hora_inicio)
      .neq('status', 'cancelado')
      .maybeSingle();

    if (agendamentoExistente) {
      const [ano, mes, dia] = data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      void logWebhook(body, 200, null);
      return NextResponse.json({
        sucesso: true,
        agendamento_id: agendamentoExistente.id,
        idempotente: true,
        mensagem_whatsapp:
          `✅ *Agendamento já confirmado!*\n\n` +
          `👤 Cliente: ${cliente_nome}\n` +
          `💇 Profissional: ${profissional.nome}\n` +
          `📅 Data: ${dataFormatada}\n` +
          `🕐 Horário: ${hora_inicio} às ${hora_fim}\n\n` +
          `Te esperamos! 😊`,
      });
    }
    // ── FIM IDEMPOTÊNCIA ───────────────────────────────────────────────────────

    // Verificar conflito com outros clientes antes de agendar
    const { data: conflito } = await (supabase as any).rpc('verificar_conflito_horario_v2', {
      p_profissional_id: profissional_id,
      p_data: data,
      p_hora_inicio: hora_inicio,
      p_hora_fim: hora_fim,
    });

    if (conflito) {
      void logWebhook(body, 409, `Conflito de horário: ${hora_inicio}`);
      return NextResponse.json(
        { error: `Horário ${hora_inicio} já está ocupado com ${profissional.nome}. Escolha outro horário.` },
        { status: 409 }
      );
    }

    // Criar agendamento — incluir servico_id quando fornecido (A-04 partial fix)
    const { data: agendamento, error: agendamentoError } = await (supabase as any)
      .from('agendamentos')
      .insert([{
        profissional_id,
        cliente_id,
        cliente_nome,
        data_agendamento: data,
        hora_inicio,
        hora_fim,
        status: 'agendado',
        origem: 'whatsapp',
        ...(servico_id ? { servico_id } : {}),
        observacoes: `Agendado via WhatsApp${servico_id ? ` — ${servico_nome}` : ' — serviço a definir'}`,
      }])
      .select('id')
      .single();

    if (agendamentoError) throw agendamentoError;

    // Formatar data para resposta
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    void logWebhook(body, 200, null);
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
    void logWebhook(body, 500, error?.message || 'Erro interno');
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
