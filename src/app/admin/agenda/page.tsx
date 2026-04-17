'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PlayCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ComandaViewDrawer from '@/components/modals/ComandaViewDrawer';

const START_HOUR = 8;
const END_HOUR = 21;
const PIXELS_PER_MINUTE = 2;
const ROW_HEIGHT = 15 * PIXELS_PER_MINUTE;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;
const GRID_OFFSET = 12; // espaço acima do primeiro slot para o rótulo 08:00 não ficar cortado

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
  // Metadados para etapas vinculadas
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
  const [dropTarget, setDropTarget] = useState<{time: string; professionalId: string} | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para o drawer de visualização da comanda
  const [comandaDrawerOpen, setComandaDrawerOpen] = useState(false);
  const [selectedComandaId, setSelectedComandaId] = useState<number | undefined>(undefined);
  const [iniciandoAtendimento, setIniciandoAtendimento] = useState<string | null>(null);

  // Carregar profissionais
  useEffect(() => {
    loadProfessionals();
  }, []);

  // Carregar agendamentos quando mudar a data
  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome, cor_agenda, é_auxiliar')
        .order('nome');

      if (error) throw error;

      setProfissionais(data || []);

      const profs = (data || []).map((prof: any) => ({
        id: prof.id,
        name: prof.nome,
        color: prof.cor_agenda || '#3B82F6',
      }));

      setProfessionals(profs);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  // Carrega appointments do Supabase
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
        // Converter status
        let status: 'confirmed' | 'pending' | 'cancelled' = 'pending';
        if (ag.status === 'concluido' || ag.status === 'confirmado') status = 'confirmed';
        else if (ag.status === 'cancelado') status = 'cancelled';
        else if (ag.status === 'agendado') status = 'pending';

        // Extrair nomes dos serviços do JSON
        let servicosStr = 'Serviço';
        try {
          const servicos = typeof ag.servicos === 'string' ? JSON.parse(ag.servicos) : ag.servicos;
          if (Array.isArray(servicos) && servicos.length > 0) {
            servicosStr = servicos.map((s: any) => s.nome).join(', ');
          }
        } catch (e) {
          console.error('Erro ao parsear serviços:', e);
        }

        // Processar etapas
        let etapas: any[] = [];
        try {
          const etapasData = typeof ag.etapas === 'string' ? JSON.parse(ag.etapas) : ag.etapas;
          if (Array.isArray(etapasData)) {
            etapas = etapasData;
          }
        } catch (e) {
          console.error('Erro ao parsear etapas:', e);
        }

        // Se tem etapas, criar um appointment para cada etapa
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

            // Bloco do profissional principal
            if (etapa.profissional_id) {
              apts.push({
                ...baseApt,
                id: `${ag.id}-etapa-${etapa.id}-prof`,
                professionalId: etapa.profissional_id,
                eh_auxiliar: false,
              });
            }

            // Bloco do auxiliar — aparece na coluna dele também
            if (etapa.auxiliar_id) {
              apts.push({
                ...baseApt,
                id: `${ag.id}-etapa-${etapa.id}-aux`,
                professionalId: etapa.auxiliar_id,
                eh_auxiliar: true,
              });
            }

            // Fallback: sem profissional nem auxiliar definidos
            if (!etapa.profissional_id && !etapa.auxiliar_id) {
              apts.push({
                ...baseApt,
                id: `${ag.id}-etapa-${etapa.id}`,
                professionalId: ag.profissional_id,
                eh_auxiliar: false,
              });
            }

            // Calcular próximo horário
            const [hora, minuto] = horaEtapa.split(':').map(Number);
            const totalMinutos = hora * 60 + minuto + etapa.duracao_minutos;
            const novaHora = Math.floor(totalMinutos / 60);
            const novoMinuto = totalMinutos % 60;
            horaAcumulada = `${novaHora.toString().padStart(2, '0')}:${novoMinuto.toString().padStart(2, '0')}`;
          });
        } else {
          // Serviço sem etapas - renderizar normalmente
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

  // Exclui agendamento (e comanda em cascata, se existir)
  const excluirAgendamento = useCallback(async (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    const nome = apt.client || 'este atendimento';
    if (!confirm(`Excluir agendamento de ${nome}?`)) return;
    try {
      const agendamentoId = apt.agendamento_id || apt.id;
      if (apt.comanda_id) {
        // Deletar comanda — cascade deleta agendamento via FK
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

  // Cria uma comanda vinculada ao agendamento e abre o drawer
  const criarComandaFromAgendamento = async (apt: Appointment) => {
    const agendamentoDbId = apt.agendamento_id || apt.id;
    setIniciandoAtendimento(apt.id);
    try {
      // 1. Buscar dados do agendamento (cliente_id)
      const { data: ag, error: agError } = await supabase
        .from('agendamentos')
        .select('id, cliente_id, cliente_nome, profissional_id')
        .eq('id', agendamentoDbId)
        .single();
      if (agError) throw agError;

      // 2. Criar a comanda vinculada
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

      // 3. Vincular comanda ao agendamento e mover status para em_andamento
      const { error: updError } = await supabase
        .from('agendamentos')
        .update({ comanda_id: novaComanda.id, status: 'em_andamento' })
        .eq('id', agendamentoDbId);
      if (updError) throw updError;

      // 4. Atualizar estado local (todos os blocos do mesmo agendamento)
      setAppointments(prev => prev.map(a => {
        const aId = a.agendamento_id || a.id;
        if (aId === agendamentoDbId) {
          return { ...a, comanda_id: novaComanda.id, status: 'confirmed' };
        }
        return a;
      }));

      // 5. Abrir drawer
      setSelectedComandaId(novaComanda.id);
      setComandaDrawerOpen(true);
    } catch (err: any) {
      alert(`Erro ao iniciar atendimento: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIniciandoAtendimento(null);
    }
  };

  // Gerar horários (8:00 às 19:00 a cada 30 min) - memoizado  // Gerar horários (a cada 15 min) - memoizado
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:15`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:45`);
    }
    return slots;
  }, []);

  const getTopPosition = useCallback((time: string) => {
    const [hour, min] = time.split(':').map(Number);
    return ((hour - START_HOUR) * 60 + min) * PIXELS_PER_MINUTE + GRID_OFFSET;
  }, []);

  const getInitials = useCallback((text: string) => {
    if (!text) return '';
    const parts = text.split(' ').filter(n => n.length > 2 || n === n.toUpperCase());
    if (parts.length === 0) return text.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getAppointmentStyle = useCallback((startTime: string, duration: number) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const startIndex = (startMinutes - 8 * 60) / 30;
    const slots = Math.ceil(duration / 30);
    
    return {
      gridRowStart: startIndex + 1,
      gridRowEnd: startIndex + slots + 1,
    };
  }, []);

  // Drag and Drop handlers (otimizados com useCallback)
  const handleDragStart = useCallback((e: React.DragEvent, appointmentId: string) => {
    setDraggedAppointmentId(appointmentId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointmentId);
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
    target.style.cursor = 'grabbing';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    target.style.cursor = 'grab';
    setDraggedAppointmentId(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, time: string, professionalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, time: string, professionalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Usa requestAnimationFrame para suavizar atualização visual
    requestAnimationFrame(() => {
      setDropTarget({ time, professionalId });
    });
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Só limpa se realmente saiu do elemento (não é um filho)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      requestAnimationFrame(() => {
        setDropTarget(null);
      });
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, time: string, professionalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedAppointmentId) {
      // Busca o appointment atual pelo ID
      const draggedAppointment = appointments.find(apt => apt.id === draggedAppointmentId);
        
      if (draggedAppointment) {
        // Verifica se houve mudança real
        const hasChanged = draggedAppointment.startTime !== time || draggedAppointment.professionalId !== professionalId;
        
        if (hasChanged) {
          try {
            // Se for uma etapa (tem etapa_id), atualizar apenas a etapa
            if (draggedAppointment.tem_etapas && draggedAppointment.etapa_id) {
              // Usa o campo correto baseado em qual bloco foi arrastado:
              // bloco do profissional → atualiza profissional_id
              // bloco do auxiliar → atualiza auxiliar_id
              const campoAtualizar = draggedAppointment.eh_auxiliar
                ? { auxiliar_id: professionalId, hora_inicio: time + ':00' }
                : { profissional_id: professionalId, hora_inicio: time + ':00' };

              const { error } = await (supabase as any)
                .from('comanda_item_etapas')
                .update(campoAtualizar as any)
                .eq('id', draggedAppointment.etapa_id);

              if (error) throw error;

              const profissionalDestino = professionals.find(p => p.id === professionalId);
              console.log(`✓ Etapa ${draggedAppointment.service} movida para ${profissionalDestino?.name} às ${time}`);
            } else {
              // Agendamento simples (sem etapas) — atualiza tabela agendamentos
              // Recalcula hora_fim mantendo a duração original
              const [th, tm] = time.split(':').map(Number);
              const endMin = th * 60 + tm + draggedAppointment.duration;
              const newHoraFim = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;

              const { error } = await supabase
                .from('agendamentos')
                .update({
                  hora_inicio: time + ':00',
                  hora_fim: newHoraFim,
                  profissional_id: professionalId,
                } as any)
                .eq('id', draggedAppointment.id);

              if (error) throw error;

              const professional = professionals.find(p => p.id === professionalId);
              const fromProfessional = professionals.find(p => p.id === draggedAppointment.professionalId);

              if (draggedAppointment.professionalId === professionalId) {
                console.log(`✓ Agendamento de ${draggedAppointment.client} movido de ${draggedAppointment.startTime} para ${time}`);
              } else {
                console.log(`✓ Agendamento de ${draggedAppointment.client} transferido de ${fromProfessional?.name} (${draggedAppointment.startTime}) para ${professional?.name} (${time})`);
              }
            }
            
            // Recarregar agendamentos para refletir mudanças
            await loadAppointments();
          } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            alert('Erro ao mover agendamento. Tente novamente.');
          }
        }
      }
    }
    
    setDraggedAppointmentId(null);
    setDropTarget(null);
  }, [draggedAppointmentId, professionals, appointments, profissionais, loadAppointments]);

  const getStatusIndicator = useCallback((status: string) => {
    // Retorna classes para indicador de status (pequeno círculo no topo direito)
    switch (status) {
      case 'confirmed':
        return 'bg-green-400';
      case 'pending':
        return 'bg-yellow-400';
      case 'cancelled':
        return 'bg-red-400';
      default:
        return 'bg-neutral-400';
    }
  }, []);

  const todayStats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments]);

  return (
    <div className="p-6 space-y-6">
      {/* Drag Feedback Banner */}
      {draggedAppointmentId && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="font-semibold">
            Movendo: {appointments.find(a => a.id === draggedAppointmentId)?.client}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </h1>
            <p className="text-neutral-600">
              {selectedDate.toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="ml-4 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Hoje
          </button>
        </div>

        {/* Stats Resumo */}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-neutral-600">Carregando agendamentos...</p>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto outline-none" style={{ cursor: 'default', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
          <div className="min-w-250">
            {/* Header com nomes dos profissionais */}
            <div className="grid bg-neutral-900 text-white sticky top-0 z-10" style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}>
              <div className="p-4 border-r border-neutral-800 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              {professionals.map((prof) => (
                <div key={prof.id} className="p-4 border-r border-neutral-800 last:border-r-0">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prof.color }} />
                    <span className="font-semibold">{prof.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de horários e colunas (Substituído para Posicionamento Absoluto) */}
            <div className="relative bg-white select-none" style={{ height: `${TOTAL_HEIGHT + GRID_OFFSET + ROW_HEIGHT}px`, caretColor: 'transparent' } as React.CSSProperties}>
              
              {/* Linhas de grade de fundo (horizontal) — absolutas para espaçamento coeso */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {timeSlots.map((time) => (
                  <div
                    key={`bg-line-${time}`}
                    className={`absolute w-full border-t ${
                      time.endsWith(':00') ? 'border-neutral-200' : 'border-neutral-100'
                    }`}
                    style={{
                      top: `${getTopPosition(time)}px`,
                      height: `${ROW_HEIGHT}px`,
                      ...(time.endsWith(':00') ? { backgroundColor: 'rgba(249,250,251,0.4)' } : {}),
                    }}
                  />
                ))}
              </div>

              <div className="grid absolute inset-0 z-10" style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}>
                
                {/* Coluna 1: Rótulos de Tempo */}
                <div className="relative border-r border-neutral-200 bg-white/60 backdrop-blur-sm pointer-events-none">
                  {timeSlots.map((time) => {
                    const isHour = time.endsWith(':00');
                    return (
                      <div 
                        key={`label-${time}`} 
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
                {professionals.map((prof) => {
                  const profAppointments = appointments.filter(apt => apt.professionalId === prof.id);

                  return (
                    <div 
                      key={`col-${prof.id}`} 
                      className="relative border-r border-neutral-200 last:border-r-0 hover:bg-neutral-50/10 transition-colors"
                      onDragOver={(e) => handleDragOver(e, '00:00', prof.id)} // Simplificado para capturar a coluna
                      onDrop={(e) => {
                        // Calcular tempo baseado no drop Y
                        const defaultTime = dropTarget?.time || '12:00'; 
                        handleDrop(e, defaultTime, prof.id);
                      }}
                    >
                      {profAppointments.map(apt => {
                        const top = getTopPosition(apt.startTime);
                        const rawHeight = apt.duration * PIXELS_PER_MINUTE;
                        const height = Math.max(rawHeight, 24); // Visual Snap
                        const isUltraCompact = apt.duration < 20;

                        const serviceInitials = getInitials(apt.service);
                        const profInitials = getInitials(prof.name);
                        
                        let shortLabel = '';
                        if (isUltraCompact) {
                          const stepPrefix = apt.tem_etapas && apt.etapa_index !== undefined ? `${apt.etapa_index + 1}. ` : '';
                          shortLabel = `${stepPrefix}${serviceInitials} (${profInitials})`;
                        }

                        // Agrupamento de cliente será visualizado com a mesma cor base
                        const isDragging = draggedAppointmentId === apt.id;

                        return (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleDragStart(e, apt.id);
                            }}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
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
                                        {/* Linha de progresso fake */}
                            <div 
                              className="absolute bottom-0 left-0 h-0.5 bg-black/10"
                              style={{ width: '0%' }}
                            />

                            <div className={`flex flex-col h-full ${isUltraCompact ? 'p-0.5 px-1 justify-center' : 'p-1.5'}`}>
                              {isUltraCompact ? (
                                <div className="flex justify-between items-center h-full">
                                  <span className="text-[10px] font-bold text-neutral-800 truncate leading-none">
                                    {shortLabel}
                                  </span>
                                  {apt.eh_auxiliar && <span className="text-[9px] ml-1">🤝</span>}
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-neutral-800 truncate" title={apt.client}>{apt.client}</span>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={(e) => excluirAgendamento(e, apt)}
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
                                      <PlayCircle className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="Iniciar Atendimento" />
                                    )}
                                    {!apt.eh_auxiliar && apt.comanda_id && (
                                      <span className="text-[8px] text-green-600 opacity-70" title="Comanda aberta">✓</span>
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
      </div>

      {/* Drawer de visualização da comanda */}
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
