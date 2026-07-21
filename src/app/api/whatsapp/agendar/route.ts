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
import { createHash, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
// C-01 FIX: usar service_role (createServerSupabase) em vez do browser client (anon_key).
// O browser client usa anon_key e pode ser bloqueado por RLS em inserts server-side.
import { createServerSupabase } from '@/lib/supabase-server';
import { getRequestId, logSecurityEvent } from '@/lib/observability';

const API_KEY = process.env.N8N_API_KEY;

interface WhatsAppAppointmentBody {
  profissional_id?: string;
  data?: string;
  hora_inicio?: string;
  servico_id?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_id?: number;
}

function safeKeyEquals(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

/** Registra cada chamada em webhook_log. Falha silenciosa — nunca propaga erros. */
function logWebhook(
  statusCode: number,
  errorCode: string | null,
  requestId: string,
  unitId?: string,
): void {
  logSecurityEvent({
    event: errorCode ? 'integration.whatsapp_rejected' : 'integration.whatsapp_success',
    route: '/api/whatsapp/agendar', status: statusCode, requestId, unitId,
    integration: 'n8n', ...(errorCode ? { errorCode } : {}),
  });
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  // Validação da chave de API (antes de parsear body)
  if (!API_KEY) {
    return NextResponse.json({ error: 'Integração indisponível.' }, { status: 503 });
  }

  const apiKey = request.headers.get('x-api-key') ?? '';
  if (!apiKey || !safeKeyEquals(apiKey, API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: WhatsAppAppointmentBody = {};
  let requestUnitId: string | undefined;

  try {
    body = await request.json() as WhatsAppAppointmentBody;
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
      logWebhook(400, 'required_fields', requestId);
      return NextResponse.json(
        { error: 'Campos obrigatórios: profissional_id, data, hora_inicio, cliente_nome' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      logWebhook(400, 'invalid_date', requestId);
      return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (!/^\d{2}:\d{2}$/.test(hora_inicio)) {
      logWebhook(400, 'invalid_time', requestId);
      return NextResponse.json({ error: 'Formato de hora inválido. Use HH:MM' }, { status: 400 });
    }

    // Instância server-side para todas as operações desta request
    let supabase = createServerSupabase() as unknown as SupabaseClient;

    // Buscar profissional
    const { data: profissional } = await supabase
      .from('profissionais')
      .select('id, nome, unit_id')
      .eq('id', profissional_id)
      .eq('ativo', true)
      .single();

    if (!profissional) {
      logWebhook(404, 'professional_not_found', requestId);
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }
    const unitId = profissional.unit_id as string;
    requestUnitId = unitId;
    supabase = createServerSupabase(unitId) as unknown as SupabaseClient;

    // Buscar serviço e calcular hora_fim
    let duracao_minutos = 60; // padrão 1h
    let servico_nome = 'Agendamento via WhatsApp';

    if (servico_id) {
      const { data: servico } = await supabase
        .from('servicos')
        .select('id, nome, duracao_minutos')
        .eq('id', servico_id)
        .eq('unit_id', unitId)
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
    if (cliente_id) {
      const { data: ownedClient } = await supabase.from('clientes')
        .select('id').eq('id', cliente_id).eq('unit_id', unitId).maybeSingle();
      if (!ownedClient) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    if (!cliente_id && telefoneLimpo) {
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('unit_id', unitId)
        .eq('telefone', telefoneLimpo)
        .maybeSingle();

      if (clienteExistente) {
        cliente_id = clienteExistente.id;
      }
    }

    if (!cliente_id) {
      // C-01 FIX: criar cliente com flags de completude (RN-CLI-001, T-03)
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          nome: cliente_nome,
          telefone: telefoneLimpo || null,
          ativo: true,
          cadastro_completo: false,     // cliente criado pelo robô: cadastro incompleto
          origem_cadastro: 'whatsapp',  // rastrear origem (RN-CLI-001)
          unit_id: unitId,
        }])
        .select('id')
        .single();

      if (clienteError) throw clienteError;
      cliente_id = novoCliente.id;
    }

    // ── IDEMPOTÊNCIA ───────────────────────────────────────────────────────────
    // Chave: mesmo cliente + data + horário já existe → retorna agendamento existente
    // sem duplicar (o n8n pode reenviar o mesmo payload mais de uma vez)
    const { data: agendamentoExistente } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('unit_id', unitId)
      .eq('cliente_id', cliente_id)
      .eq('data_agendamento', data)
      .eq('hora_inicio', hora_inicio)
      .neq('status', 'cancelado')
      .maybeSingle();

    if (agendamentoExistente) {
      const [ano, mes, dia] = data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      logWebhook(200, null, requestId, unitId);
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
    const { data: conflito } = await supabase.rpc('verificar_conflito_horario_v2', {
      p_profissional_id: profissional_id,
      p_data: data,
      p_hora_inicio: hora_inicio,
      p_hora_fim: hora_fim,
    });

    if (conflito) {
      logWebhook(409, 'schedule_conflict', requestId, unitId);
      return NextResponse.json(
        { error: `Horário ${hora_inicio} já está ocupado com ${profissional.nome}. Escolha outro horário.` },
        { status: 409 }
      );
    }

    // Criar agendamento — incluir servico_id quando fornecido (A-04 partial fix)
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert([{
        unit_id: unitId,
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

    logWebhook(200, null, requestId, unitId);
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

  } catch {
    logWebhook(500, 'internal_error', requestId, requestUnitId);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
