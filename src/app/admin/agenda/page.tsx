'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PlayCircle, Trash2, ZoomIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ComandaViewDrawer from '@/components/modals/ComandaViewDrawer';

const START_HOUR = 8;
const END_HOUR = 21;
const GRID_OFFSET = 12;
const SNAP_MINUTES = 15;

interface Appointment {
  id: string;
  professionalId: string;
  client: string;
  service: string;
  startTime: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  comanda_id?: number;
  groupColor?: string;
  groupName?: string;
  tem_etapas?: boolean;
  etapas?: Array<{
    id: string;
    ordem: number;
    nome_etapa: string;
    duracao_minutos: number;
    profissional_id?: string;
    profissional_nome?: string;
    profissional_cor?: string;
    auxiliar_id?: string;
    auxiliar_nome?: string;
    status_etapa?: string;
  }>;
  agendamento_id?: string;
  etapa_index?: number;
  total_etapas?: number;
  etapa_id?: string;
  eh_auxiliar?: boolean;
}

interface Professional {
  id: string;
  name: string;
  color: string;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comandaDrawerOpen, setComandaDrawerOpen] = useState(false);
  const [selectedComandaId, setSelectedComandaId] = useState<number | undefined>(undefined);
  const [iniciandoAtendimento, setIniciandoAtendimento] = useState<string | null>(null);

  // ── Zoom de densidade ────────────────────────────────────────────────────────
  const [pixelsPerMinute, setPixelsPerMinute] = useState<number>(() => {
    if (typeof window === 'undefined') return 2;
    return Number(localStorage.getItem('agenda-zoom') ?? 2);
  });

  const handleZoomChange = useCallback((val: number) => {
    setPixelsPerMinute(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agenda-zoom', String(val));
    }
  }, []);

  const rowHeight = useMemo(() => SNAP_MINUTES * pixelsPerMinute, [pixelsPerMinute]);
  const totalHeight = useMemo(
    () => (END_HOUR - START_HOUR) * 60 * pixelsPerMinute,
    [pixelsPerMinute]
  );

  // ── Linha "agora" ────────────────────────────────────────────────────────────
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  const nowLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll para a linha "agora" após carregar
  useEffect(() => {
    if (!loading && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading]);

  const nowLineTop = useMemo(() => {
    return (nowMinutes - START_HOUR * 60) * pixelsPerMinute + GRID_OFFSET;
  }, [nowMinutes, pixelsPerMinute]);

  const isNowVisible = useMemo(
    () => nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60,
    [nowMinutes]
  );

  // ── Helpers de posição ───────────────────────────────────────────────────────
  const getTopPosition = useCallback(
    (time: string) => {
      const [hour, min] = time.split(':').map(Number);
      return ((hour - START_HOUR) * 60 + min) * pixelsPerMinute + GRID_OFFSET;
    },
    [pixelsPerMinute]
  );

  // Converte offsetY (px desde o topo da coluna) em horário snappado a 15min
  const yToTime = useCallback(
    (offsetY: number): string => {
      const rawMinutes = START_HOUR * 60 + (offsetY - GRID_OFFSET) / pixelsPerMinute;
      const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
      const clamped = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - SNAP_MINUTES, snapped));
      const h = Math.floor(clamped / 60);
      const m = clamped % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },
    [pixelsPerMinute]
  );

  // ── Dados ────────────────────────────────────────────────────────────────────
  useEffect(() => { loadProfessionals(); }, []);
  useEffect(() => { loadAppointments(); }, [selectedDate]);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome, cor_agenda, é_auxiliar')
        .order('nome');
      if (error) throw error;
      setProfissionais(data || []);
      setProfessionals(
        (data || []).map((prof: any) => ({
          id: prof.id,
          name: prof.nome,
          color: prof.cor_agenda || '#3B82F6',
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const dataFormatada = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('vw_agendamentos_completos')
        .select('*')
        .eq('data_agendamento', dataFormatada);
      if (error) throw error;

      const apts: Appointment[] = [];
      (data || []).forEach((ag: any) => {
        let status: 'confirmed' | 'pending' | 'cancelled' = 'pending';
        if (ag.status === 'concluido' || ag.status === 'confirmado') status = 'confirmed';
        else if (ag.status === 'cancelado') status = 'cancelled';
        else if (ag.status === 'agendado') status = 'pending';

        let servicosStr = 'Serviço';
        try {
          const servicos = typeof ag.servicos === 'string' ? JSON.parse(ag.servicos) : ag.servicos;
          if (Array.isArray(servicos) && servicos.length > 0) {
            servicosStr = servicos.map((s: any) => s.nome).join(', ');
          }
        } catch (e) { console.error('Erro ao parsear serviços:', e); }

        let etapas: any[] = [];
        try {
          const etapasData = typeof ag.etapas === 'string' ? JSON.parse(ag.etapas) : ag.etapas;
          if (Array.isArray(etapasData)) etapas = etapasData;
        } catch (e) { console.error('Erro ao parsear etapas:', e); }

        if (ag.tem_etapas && etapas.length > 0) {
          let horaAcumulada = ag.hora_inicio ? ag.hora_inicio.substring(0, 5) : '00:00';
          etapas.forEach((etapa, etapaIndex) => {
            const profissionalCor = etapa.profissional_cor || ag.grupo_cor || '#6366F1';
            const horaEtapa = horaAcumulada;
            const baseApt = {
              client: ag.cliente_nome || 'Cliente',
              service: `${etapa.ordem}. ${etapa.nome_etapa}`,
              startTime: horaEtapa,
              duration: etapa.duracao_minutos,
              status,
              comanda_id: ag.comanda_id,
              groupColor: profissionalCor,
              groupName: `${servicosStr} (${etapa.ordem}/${etapas.length})`,
              tem_etapas: true,
              etapas: [etapa],
              agendamento_id: ag.id,
              etapa_index: etapaIndex,
              total_etapas: etapas.length,
              etapa_id: etapa.id,
            };
            if (etapa.profissional_id) {
              apts.push({ ...baseApt, id: `${ag.id}-etapa-${etapa.id}-prof`, professionalId: etapa.profissional_id, eh_auxiliar: false });
            }
            if (etapa.auxiliar_id) {
              apts.push({ ...baseApt, id: `${ag.id}-etapa-${etapa.id}-aux`, professionalId: etapa.auxiliar_id, eh_auxiliar: true });
            }
            if (!etapa.profissional_id && !etapa.auxiliar_id) {
              apts.push({ ...baseApt, id: `${ag.id}-etapa-${etapa.id}`, professionalId: ag.profissional_id, eh_auxiliar: false });
            }
            const [hora, minuto] = horaEtapa.split(':').map(Number);
            const totalMinutos = hora * 60 + minuto + etapa.duracao_minutos;
            horaAcumulada = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
          });
        } else {
          apts.push({
            id: ag.id,
            professionalId: ag.profissional_id,
            client: ag.cliente_nome || 'Cliente',
            service: servicosStr,
            startTime: ag.hora_inicio ? ag.hora_inicio.substring(0, 5) : '00:00',
            duration: ag.duracao_total || 60,
            status,
            comanda_id: ag.comanda_id,
            groupColor: ag.grupo_cor || '#6366F1',
            groupName: ag.grupo_nome,
            tem_etapas: false,
            etapas: [],
          });
        }
      });
      setAppointments(apts);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const excluirAgendamento = useCallback(async (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    if (!confirm(`Excluir agendamento de ${apt.client || 'este atendimento'}?`)) return;
    try {
      const agendamentoId = apt.agendamento_id || apt.id;
      if (apt.comanda_id) {
        const { error } = await supabase.from('comandas').delete().eq('id', apt.comanda_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agendamentos').delete().eq('id', agendamentoId);
        if (error) throw error;
      }
      await loadAppointments();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  }, [loadAppointments]);

  const criarComandaFromAgendamento = async (apt: Appointment) => {
    const agendamentoDbId = apt.agendamento_id || apt.id;
    setIniciandoAtendimento(apt.id);
    try {
      const { data: ag, error: agError } = await (supabase as any)
        .from('agendamentos')
        .select('id, cliente_id, cliente_nome, profissional_id')
        .eq('id', agendamentoDbId)
        .single();
      if (agError) throw agError;

      const { data: novaComanda, error: cmdError } = await (supabase as any)
        .from('comandas')
        .insert([{
          numero_comanda: 0,
          cliente_id: ag?.cliente_id || null,
          cliente_nome: ag?.cliente_nome || apt.client,
          profissional_id: apt.professionalId || ag?.profissional_id || null,
          data_agendamento: selectedDate.toISOString().split('T')[0],
          hora_inicio: apt.startTime,
          status: 'aberta',
          total: 0,
          observacoes: `Originada da agenda em ${selectedDate.toLocaleDateString('pt-BR')}`,
        }])
        .select()
        .single();
      if (cmdError) throw cmdError;

      const { error: updError } = await (supabase as any)
        .from('agendamentos')
        .update({ comanda_id: novaComanda.id, status: 'em_andamento' })
        .eq('id', agendamentoDbId);
      if (updError) throw updError;

      setAppointments(prev => prev.map(a => {
        const aId = a.agendamento_id || a.id;
        if (aId === agendamentoDbId) return { ...a, comanda_id: novaComanda.id, status: 'confirmed' };
        return a;
      }));

      setSelectedComandaId(novaComanda.id);
      setComandaDrawerOpen(true);
    } catch (err: any) {
      alert(`Erro ao iniciar atendimento: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIniciandoAtendimento(null);
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:15`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
      slots.push(`${String(hour).padStart(2, '0')}:45`);
    }
    return slots;
  }, []);

  const getInitials = useCallback((text: string) => {
    if (!text) return '';
    const parts = text.split(' ').filter(n => n.length > 2 || n === n.toUpperCase());
    if (parts.length === 0) return text.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, appointmentId: string) => {
    setDraggedAppointmentId(appointmentId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointmentId);
    (e.target as HTMLElement).style.opacity = '0.4';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedAppointmentId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, prof: Professional) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedAppointmentId) return;

    const draggedAppointment = appointments.find(apt => apt.id === draggedAppointmentId);
    if (!draggedAppointment) {
      setDraggedAppointmentId(null);
      return;
    }

    // ── Calcular horário preciso pelo Y do mouse ────────────────────────────
    const colEl = e.currentTarget as HTMLElement;
    const rect = colEl.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const time = yToTime(offsetY);

    const hasChanged =
      draggedAppointment.startTime !== time ||
      draggedAppointment.professionalId !== prof.id;

    if (hasChanged) {
      // OVERLAP CHECK
      const [th, tm] = time.split(':').map(Number);
      const endMin = th * 60 + tm + draggedAppointment.duration;
      const startMins = th * 60 + tm;
      
      const isOverlapping = appointments.some(a => {
        if (a.id === draggedAppointment.id || a.professionalId !== prof.id || a.status === 'cancelled') return false;
        const [ah, am] = a.startTime.split(':').map(Number);
        const aStartMins = ah * 60 + am;
        const aEndMins = aStartMins + a.duration;
        return startMins < aEndMins && endMin > aStartMins;
      });

      if (isOverlapping) {
        if (!confirm(`Conflito de horário: o profissional já possui outro atendimento neste horário.\nDeseja mover o agendamento mesmo assim?`)) {
          setDraggedAppointmentId(null);
          return;
        }
      }

      try {
        if (draggedAppointment.tem_etapas && draggedAppointment.etapa_id) {
          const campoAtualizar = draggedAppointment.eh_auxiliar
            ? { auxiliar_id: prof.id, hora_inicio: time + ':00' }
            : { profissional_id: prof.id, hora_inicio: time + ':00' };

          const { error } = await (supabase as any)
            .from('comanda_item_etapas')
            .update(campoAtualizar as any)
            .eq('id', draggedAppointment.etapa_id);
          if (error) throw error;
        } else {
          const [th, tm] = time.split(':').map(Number);
          const endMin = th * 60 + tm + draggedAppointment.duration;
          const newHoraFim = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;

          const { error } = await (supabase as any)
            .from('agendamentos')
            .update({ hora_inicio: time + ':00', hora_fim: newHoraFim, profissional_id: prof.id })
            .eq('id', draggedAppointment.id);
          if (error) throw error;
        }
        await loadAppointments();
      } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        alert('Erro ao mover agendamento. Tente novamente.');
      }
    }

    setDraggedAppointmentId(null);
  }, [draggedAppointmentId, appointments, yToTime, loadAppointments]);

  const getStatusIndicator = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-400';
      case 'pending': return 'bg-yellow-400';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-neutral-400';
    }
  }, []);

  const todayStats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
  }), [appointments]);

  // Label do nível de zoom
  const zoomLabel = useMemo(() => {
    if (pixelsPerMinute <= 1.5) return 'Compacto';
    if (pixelsPerMinute <= 2.5) return 'Normal';
    if (pixelsPerMinute <= 3.5) return 'Espaçoso';
    return 'Máximo';
  }, [pixelsPerMinute]);

  return (
    <div className="p-6 space-y-6">
      {/* Drag Feedback Banner */}
      {draggedAppointmentId && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="font-semibold">
            Movendo: {appointments.find(a => a.id === draggedAppointmentId)?.client}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </h1>
            <p className="text-neutral-600">
              {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="ml-4 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Hoje
          </button>
        </div>

        {/* Slider de Densidade */}
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-card">
          <ZoomIn className="w-4 h-4 text-neutral-500 shrink-0" />
          <div className="flex flex-col items-center gap-0.5">
            <input
              type="range"
              min={1}
              max={4}
              step={0.5}
              value={pixelsPerMinute}
              onChange={e => handleZoomChange(Number(e.target.value))}
              className="w-28 accent-neutral-900 cursor-pointer"
              title="Densidade da agenda"
            />
            <span className="text-[10px] text-neutral-500 font-medium">{zoomLabel}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 bg-white rounded-xl px-6 py-3 shadow-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900">{todayStats.total}</p>
            <p className="text-xs text-neutral-600">Total</p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{todayStats.confirmed}</p>
            <p className="text-xs text-neutral-600">Confirmados</p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{todayStats.pending}</p>
            <p className="text-xs text-neutral-600">Pendentes</p>
          </div>
        </div>
      </div>

      {/* Agenda Timeline */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-neutral-600">Carregando agendamentos...</p>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto outline-none" style={{ cursor: 'default', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
            <div className="min-w-250">
              {/* Header com nomes dos profissionais */}
              <div
                className="grid bg-neutral-900 text-white sticky top-0 z-10"
                style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}
              >
                <div className="p-4 border-r border-neutral-800 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                {professionals.map(prof => (
                  <div key={prof.id} className="p-4 border-r border-neutral-800 last:border-r-0">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prof.color }} />
                      <span className="font-semibold">{prof.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid de horários */}
              <div
                className="relative bg-white select-none"
                style={{ height: `${totalHeight + GRID_OFFSET + rowHeight}px`, caretColor: 'transparent' } as React.CSSProperties}
              >
                {/* Linhas de fundo */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {timeSlots.map(time => (
                    <div
                      key={`bg-${time}`}
                      className={`absolute w-full border-t ${time.endsWith(':00') ? 'border-neutral-200' : 'border-neutral-100'}`}
                      style={{
                        top: `${getTopPosition(time)}px`,
                        height: `${rowHeight}px`,
                        ...(time.endsWith(':00') ? { backgroundColor: 'rgba(249,250,251,0.4)' } : {}),
                      }}
                    />
                  ))}
                </div>

                {/* Linha "Agora" */}
                {isNowVisible && (
                  <div
                    ref={nowLineRef}
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${nowLineTop}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-20 flex justify-end pr-1.5">
                        <span className="text-[10px] font-bold text-red-500 bg-white px-1 rounded shadow-sm">
                          {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-red-400" />
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                    </div>
                  </div>
                )}

                <div
                  className="grid absolute inset-0 z-10"
                  style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}
                >
                  {/* Rótulos de tempo */}
                  <div className="relative border-r border-neutral-200 bg-white/60 backdrop-blur-sm pointer-events-none">
                    {timeSlots.map(time => {
                      const isHour = time.endsWith(':00');
                      return (
                        <div
                          key={`lbl-${time}`}
                          className="absolute w-full text-right pr-2 select-none"
                          style={{ top: `${getTopPosition(time)}px`, transform: 'translateY(-50%)' }}
                        >
                          {isHour ? (
                            <span className="text-xs text-neutral-600 font-medium">{time}</span>
                          ) : (
                            <span className="text-[9px] text-neutral-400 font-medium">{time.split(':')[1]}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Colunas dos Profissionais */}
                  {professionals.map(prof => {
                    const profAppointments = appointments.filter(apt => apt.professionalId === prof.id);
                    return (
                      <div
                        key={`col-${prof.id}`}
                        className="relative border-r border-neutral-200 last:border-r-0 hover:bg-neutral-50/10 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={e => handleDrop(e, prof)}
                      >
                        {profAppointments.map(apt => {
                          const top = getTopPosition(apt.startTime);
                          const height = Math.max(apt.duration * pixelsPerMinute, 24);
                          const isUltraCompact = apt.duration < 20;
                          const serviceInitials = getInitials(apt.service);
                          const profInitials = getInitials(prof.name);
                          const shortLabel = isUltraCompact
                            ? `${apt.tem_etapas && apt.etapa_index !== undefined ? `${apt.etapa_index + 1}. ` : ''}${serviceInitials} (${profInitials})`
                            : '';
                          const isDragging = draggedAppointmentId === apt.id;

                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={e => { e.stopPropagation(); handleDragStart(e, apt.id); }}
                              onDragEnd={handleDragEnd}
                              onClick={e => {
                                e.stopPropagation();
                                if (apt.comanda_id) {
                                  setSelectedComandaId(apt.comanda_id);
                                  setComandaDrawerOpen(true);
                                } else if (!apt.eh_auxiliar && !iniciandoAtendimento) {
                                  criarComandaFromAgendamento(apt);
                                }
                              }}
                              className={`absolute left-1 right-1 rounded shadow-sm border overflow-hidden cursor-pointer hover:shadow-md hover:z-30 transition-all duration-200 group ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: apt.groupColor ? `${apt.groupColor}15` : '#f3f4f6',
                                borderColor: apt.groupColor ? `${apt.groupColor}40` : '#e5e7eb',
                                borderLeftWidth: '3px',
                                borderLeftColor: apt.groupColor || '#3b82f6',
                              }}
                              title={`${apt.client}\n${apt.tem_etapas && apt.etapa_index !== undefined ? `Etapa ${apt.etapa_index + 1}: ` : ''}${apt.service}\n${apt.startTime} (${apt.duration}min)`}
                            >
                              <div className="absolute bottom-0 left-0 h-0.5 bg-black/10" style={{ width: '0%' }} />
                              <div className={`flex flex-col h-full ${isUltraCompact ? 'p-0.5 px-1 justify-center' : 'p-1.5'}`}>
                                {isUltraCompact ? (
                                  <div className="flex justify-between items-center h-full">
                                    <span className="text-[10px] font-bold text-neutral-800 truncate leading-none">{shortLabel}</span>
                                    {apt.eh_auxiliar && <span className="text-[9px] ml-1">🤝</span>}
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-bold text-neutral-800 truncate" title={apt.client}>{apt.client}</span>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          onClick={e => excluirAgendamento(e, apt)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded"
                                          title="Excluir agendamento"
                                        >
                                          <Trash2 className="w-2.5 h-2.5 text-red-500" />
                                        </button>
                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusIndicator(apt.status)} shrink-0`} />
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-neutral-600 truncate leading-tight mt-0.5">
                                      {apt.tem_etapas && apt.etapa_index !== undefined ? `${apt.etapa_index + 1}. ` : ''}
                                      {apt.service}
                                    </span>
                                    <div className="flex justify-between items-center mt-auto">
                                      <span className="text-[9px] text-neutral-500 font-medium tracking-tight">
                                        {apt.startTime} ({apt.duration}m)
                                      </span>
                                      {apt.eh_auxiliar && <span className="text-[10px]">🤝</span>}
                                      {!apt.eh_auxiliar && !apt.comanda_id && (
                                        <span title="Iniciar Atendimento"><PlayCircle className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" /></span>
                                      )}
                                      {!apt.eh_auxiliar && apt.comanda_id && (
                                        <span className="text-[8px] text-green-600 opacity-70">✓</span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Legenda */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded" />
          <span className="text-neutral-700">Confirmado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-600 rounded" />
          <span className="text-neutral-700">Pendente</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded" />
          <span className="text-neutral-700">Cancelado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-px bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-neutral-700">Agora</span>
        </div>
      </div>

      {/* Drawer */}
      <ComandaViewDrawer
        isOpen={comandaDrawerOpen}
        onClose={() => {
          setComandaDrawerOpen(false);
          setSelectedComandaId(undefined);
          loadAppointments();
        }}
        comandaId={selectedComandaId}
      />
    </div>
  );
}
