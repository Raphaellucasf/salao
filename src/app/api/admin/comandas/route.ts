import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';
import { buildRecurrenceDates, type AppointmentRecurrence } from '@/lib/appointment-recurrence';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_ITEMS: { status: 400, message: 'Itens da comanda inválidos' },
  DUPLICATE_ITEMS: { status: 400, message: 'Itens duplicados na comanda' },
  CLIENT_NOT_FOUND: { status: 404, message: 'Cliente não encontrado' },
  PROFESSIONAL_NOT_FOUND: { status: 404, message: 'Profissional não encontrado' },
  AUXILIARY_NOT_FOUND: { status: 404, message: 'Auxiliar não encontrado' },
  INVALID_SCHEDULE: { status: 400, message: 'Data, horário ou profissional inválido' },
  COMANDA_NOT_FOUND: { status: 404, message: 'Comanda não encontrada' },
  COMANDA_NOT_OPEN: { status: 409, message: 'Somente comandas abertas podem ser editadas' },
  CATALOG_ITEM_NOT_FOUND: { status: 409, message: 'Item inativo ou não encontrado' },
  INVALID_CATALOG_PRICE: { status: 409, message: 'Preço cadastrado inválido' },
  INSUFFICIENT_STOCK: { status: 409, message: 'Estoque insuficiente' },
  INSUFFICIENT_SUPPLY_STOCK: { status: 409, message: 'Estoque de insumo insuficiente' },
  PACKAGE_BALANCE_UNAVAILABLE: { status: 409, message: 'Saldo de pacote indisponível' },
  INVALID_SERVICE_STAGE: { status: 409, message: 'Etapa de serviço inválida' },
};

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const comandaId = body.comanda_id == null ? null : Number(body.comanda_id);
    const clientId = Number(body.cliente_id);
    const professionalId = optionalUuid(body.profissional_id);
    const auxiliaryId = optionalUuid(body.auxiliar_id);
    const scheduleDate = body.data_agendamento == null || body.data_agendamento === ''
      ? null : String(body.data_agendamento);
    const startTime = body.hora_inicio == null || body.hora_inicio === ''
      ? null : String(body.hora_inicio);
    const items = normalizeItems(body.itens);

    if ((comandaId !== null && (!Number.isSafeInteger(comandaId) || comandaId <= 0))
      || !Number.isSafeInteger(clientId) || clientId <= 0 || professionalId === undefined
      || auxiliaryId === undefined || !items
      || (scheduleDate !== null && (!DATE_PATTERN.test(scheduleDate)
        || Number.isNaN(Date.parse(`${scheduleDate}T00:00:00Z`))))
      || (startTime !== null && !TIME_PATTERN.test(startTime))) {
      return NextResponse.json({ error: 'Payload de comanda inválido' }, { status: 400 });
    }

    let scheduleDates: Array<string | null> = [scheduleDate];
    if (body.recorrencia != null) {
      if (comandaId !== null || scheduleDate === null || startTime === null
        || items.some((item) => item.tipo !== 'servico' || item.pacote_cliente_id !== null)) {
        return NextResponse.json(
          { error: 'Recorrência aceita somente novas comandas com serviços avulsos agendados' },
          { status: 400 },
        );
      }
      try {
        scheduleDates = buildRecurrenceDates(scheduleDate, body.recorrencia as AppointmentRecurrence);
      } catch {
        return NextResponse.json({ error: 'Configuração de recorrência inválida' }, { status: 400 });
      }
    }

    const db = createServerSupabase(authResult.unitId);
    const createdCommandIds: number[] = [];
    const created: unknown[] = [];
    for (const occurrenceDate of scheduleDates) {
      const { data, error } = await db.rpc('save_comanda_atomic' as never, {
        p_comanda_id: comandaId,
        p_client_id: clientId,
        p_professional_id: professionalId,
        p_auxiliary_id: auxiliaryId,
        p_schedule_date: occurrenceDate,
        p_start_time: startTime,
        p_notes: typeof body.observacoes === 'string' ? body.observacoes.trim().slice(0, 2000) : '',
        p_items: items,
        p_admin_id: authResult.id,
        p_unit_id: authResult.unitId,
      } as never);

      if (error) {
        for (const createdId of [...createdCommandIds].reverse()) {
          await db.rpc('cancel_comanda_atomic' as never, {
            p_comanda_id: createdId,
            p_admin_id: authResult.id,
          } as never);
        }
        if (error.code === '23P01') {
          return NextResponse.json(
            { error: `Conflito de horário em ${occurrenceDate}` },
            { status: 409 },
          );
        }
        const mapped = ERRORS[error.message];
        return NextResponse.json(
          { error: mapped?.message ?? 'Não foi possível salvar a comanda' },
          { status: mapped?.status ?? 500 },
        );
      }

      const createdId = Number((data as { comanda_id?: unknown } | null)?.comanda_id);
      if (Number.isSafeInteger(createdId) && createdId > 0) createdCommandIds.push(createdId);
      created.push(data);
    }
    return NextResponse.json({
      ok: true,
      data: created[0],
      recorrencia: scheduleDates.length > 1 ? { total: created.length, ocorrencias: created } : null,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const comandaId = Number(request.nextUrl.searchParams.get('comanda_id'));
  if (!Number.isSafeInteger(comandaId) || comandaId <= 0) {
    return NextResponse.json({ error: 'comanda_id inválido' }, { status: 400 });
  }

  const { data, error } = await createServerSupabase(authResult.unitId).rpc('cancel_comanda_atomic' as never, {
    p_comanda_id: comandaId,
    p_admin_id: authResult.id,
  } as never);
  if (error) {
    const mapped = error.message === 'COMANDA_NOT_FOUND'
      ? { status: 404, message: 'Comanda não encontrada' }
      : error.message === 'ONLY_OPEN_COMANDA_CAN_BE_CANCELLED'
        ? { status: 409, message: 'Somente comandas abertas podem ser canceladas' }
        : null;
    return NextResponse.json(
      { error: mapped?.message ?? 'Não foi possível cancelar a comanda' },
      { status: mapped?.status ?? 500 },
    );
  }
  return NextResponse.json({ ok: true, data });
}

function optionalUuid(value: unknown): string | null | undefined {
  if (value == null || value === '') return null;
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return null;
  const normalized = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    const tipo = item.tipo;
    const itemId = typeof item.item_id === 'string' ? item.item_id : '';
    const quantidade = Number(item.quantidade);
    const pacoteClienteId = optionalUuid(item.pacote_cliente_id);
    if (!['produto', 'servico', 'pacote'].includes(String(tipo)) || !UUID_PATTERN.test(itemId)
      || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 1000
      || pacoteClienteId === undefined) return null;
    const assignments = Array.isArray(item.atribuicoes_etapas)
      ? item.atribuicoes_etapas.map(normalizeAssignment) : [];
    if (assignments.some((entry) => entry === null)) return null;
    normalized.push({
      tipo,
      item_id: itemId,
      quantidade,
      pacote_cliente_id: pacoteClienteId,
      atribuicoes_etapas: assignments,
    });
  }
  return normalized;
}

function normalizeAssignment(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const stageId = item.servico_etapa_id ?? item.etapa_id;
  const professionalId = optionalUuid(item.profissional_id);
  const auxiliaryId = optionalUuid(item.auxiliar_id);
  if (typeof stageId !== 'string' || !UUID_PATTERN.test(stageId)
    || professionalId === undefined || auxiliaryId === undefined) return null;
  return { servico_etapa_id: stageId, profissional_id: professionalId, auxiliar_id: auxiliaryId };
}
