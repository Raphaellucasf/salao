'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ComandaViewDrawer from '@/components/modals/ComandaViewDrawer';

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

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      const dataFormatada = selectedDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('vw_agendamentos_completos')
        .select('*')
        .eq('data_agendamento', dataFormatada);

      if (error) throw error;
      
      console.log('📅 Agendamentos carregados:', data?.length || 0);
      if (data && data.length > 0) {
        const first = data[0] as any;
        console.log('📋 Primeiro agendamento:', {
          id: first.id,
          comanda_id: first.comanda_id,
          cliente: first.cliente_nome,
        });
      }

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
            // Determinar profissional responsável (auxiliar ou profissional)
            const profissionalId = etapa.auxiliar_id || etapa.profissional_id;
            const profissionalNome = etapa.auxiliar_nome || etapa.profissional_nome;
            const profissionalCor = etapa.profissional_cor || ag.grupo_cor || '#6366F1';

            apts.push({
              id: `${ag.id}-etapa-${etapa.id}`,
              professionalId: profissionalId,
              client: ag.cliente_nome || 'Cliente',
              service: `${etapa.ordem}. ${etapa.nome_etapa}`,
              startTime: horaAcumulada,
              duration: etapa.duracao_minutos,
              status,
              comanda_id: ag.comanda_id,
              groupColor: profissionalCor,
              groupName: `${servicosStr} (${etapa.ordem}/${etapas.length})`,
              tem_etapas: true,
              etapas: [etapa],
              // Metadados para vincular etapas do mesmo serviço
              agendamento_id: ag.id,
              etapa_index: etapaIndex,
              total_etapas: etapas.length,
              etapa_id: etapa.id,
              eh_auxiliar: !!etapa.auxiliar_id,
            });

            // Calcular próximo horário
            const [hora, minuto] = horaAcumulada.split(':').map(Number);
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

  // Gerar horários (8:00 às 19:00 a cada 30 min) - memoizado
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
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
              // Verificar se o profissional de destino é auxiliar
              const profissionalDestino = profissionais.find(p => p.id === professionalId);
              const ehAuxiliarDestino = profissionalDestino?.é_auxiliar || false;
              
              // Atualizar etapa específica no banco
              const { error } = await (supabase as any)
                .from('comanda_item_etapas')
                .update({
                  profissional_id: ehAuxiliarDestino ? null : professionalId,
                  auxiliar_id: ehAuxiliarDestino ? professionalId : null,
                  hora_inicio: time + ':00',
                } as any)
                .eq('id', draggedAppointment.etapa_id);

              if (error) throw error;

              console.log(`✓ Etapa ${draggedAppointment.service} movida para ${profissionalDestino?.name} às ${time}`);
            } else if (draggedAppointment.comanda_id) {
              // Atualizar comanda inteira (serviço sem etapas)
              const { error } = await (supabase as any)
                .from('comandas')
                .update({
                  hora_inicio: time + ':00',
                  profissional_id: professionalId,
                } as any)
                .eq('id', draggedAppointment.comanda_id);

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
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
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

            {/* Grid de horários */}
            <div className="relative bg-white">
              <div className="grid" style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)`, gridAutoRows: '40px' }}>
                {timeSlots.map((time, timeIndex) => (
                  <div key={`row-${time}`} className="contents">
                    {/* Coluna de horário */}
                    <div className={`p-2 text-xs text-neutral-600 text-center border-r border-b border-neutral-200 flex items-center justify-center ${timeIndex % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}`}>
                      {timeIndex % 2 === 0 ? time : ''}
                    </div>
                    
                    {/* Colunas dos profissionais */}
                    {professionals.map((prof) => {
                      const isDropTarget = dropTarget?.time === time && dropTarget?.professionalId === prof.id;
                      const isDragInProgress = draggedAppointmentId !== null;
                      
                      // Encontrar agendamento que começa neste horário para este profissional
                      const appointmentAtThisSlot = appointments.find(
                        apt => apt.professionalId === prof.id && apt.startTime === time
                      );
                      
                      // Calcular quantas linhas o agendamento ocupa
                      const rowSpan = appointmentAtThisSlot ? Math.ceil(appointmentAtThisSlot.duration / 30) : 1;
                      
                      return (
                        <div
                          key={`${time}-${prof.id}`}
                          className={`relative border-r border-b border-neutral-200 last:border-r-0 ${
                            timeIndex % 2 === 0 ? 'bg-neutral-50/50' : 'bg-white'
                          } ${
                            isDropTarget 
                              ? 'bg-blue-100 ring-1 ring-blue-400 ring-inset' 
                              : isDragInProgress
                              ? 'hover:bg-blue-50 cursor-copy'
                              : 'hover:bg-blue-50 cursor-pointer'
                          }`}
                          onClick={() => !isDragInProgress && console.log('Novo agendamento', time, prof.name)}
                          onDragOver={(e) => handleDragOver(e, time, prof.id)}
                          onDragEnter={(e) => handleDragEnter(e, time, prof.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, time, prof.id)}
                        >
                          {/* Renderizar appointment se existir e começar aqui */}
                          {appointmentAtThisSlot && (
                            <div
                              key={`apt-${appointmentAtThisSlot.id}-${appointmentAtThisSlot.startTime}-${appointmentAtThisSlot.professionalId}`}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, appointmentAtThisSlot.id);
                              }}
                              onDragEnd={handleDragEnd}
                              className={`absolute inset-1 rounded-lg p-2 border-2 shadow-lg cursor-grab hover:shadow-xl transition-shadow z-20 will-change-transform ${
                                draggedAppointmentId === appointmentAtThisSlot.id ? 'opacity-50' : 'opacity-100'
                              } ${
                                appointmentAtThisSlot.tem_etapas 
                                  ? 'border-white border-dashed' 
                                  : 'border-white/30'
                              }`}
                              style={{
                                height: `calc(${rowSpan * 40}px - 8px)`,
                                backgroundColor: appointmentAtThisSlot.groupColor || '#6366F1',
                                transform: 'translate3d(0, 0, 0)',
                                backfaceVisibility: 'hidden',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('📋 Clicou no agendamento:', {
                                  id: appointmentAtThisSlot.id,
                                  comanda_id: appointmentAtThisSlot.comanda_id,
                                  cliente: appointmentAtThisSlot.client,
                                });
                                if (appointmentAtThisSlot.comanda_id) {
                                  setSelectedComandaId(appointmentAtThisSlot.comanda_id);
                                  setComandaDrawerOpen(true);
                                } else {
                                  console.warn('⚠️ Agendamento sem comanda_id');
                                }
                              }}
                              title={`${appointmentAtThisSlot.groupName || 'Serviço'} - Arraste para mover ${appointmentAtThisSlot.client} para outro horário ou profissional`}
                            >
                              {/* Indicador de status no canto superior direito */}
                              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getStatusIndicator(appointmentAtThisSlot.status)} z-30`} 
                                   title={appointmentAtThisSlot.status === 'confirmed' ? 'Confirmado' : appointmentAtThisSlot.status === 'pending' ? 'Pendente' : 'Cancelado'} />
                              
                              {/* Badge de etapa se fizer parte de sequência */}
                              {appointmentAtThisSlot.tem_etapas && appointmentAtThisSlot.etapa_index !== undefined && (
                                <div className="absolute top-1 left-1 bg-white/90 text-neutral-900 text-[9px] font-bold px-1.5 py-0.5 rounded z-30">
                                  {appointmentAtThisSlot.etapa_index + 1}/{appointmentAtThisSlot.total_etapas}
                                </div>
                              )}
                              
                              {/* Indicador de auxiliar */}
                              {appointmentAtThisSlot.eh_auxiliar && (
                                <div className="absolute top-1 left-10 text-white text-xs z-30">
                                  🤝
                                </div>
                              )}
                              
                              <div className="text-white select-none h-full overflow-hidden flex flex-col justify-center">
                                <p className="font-semibold text-sm truncate mb-0.5">{appointmentAtThisSlot.client}</p>
                                <p className="text-xs opacity-90 truncate">{appointmentAtThisSlot.service}</p>
                                <p className="text-[10px] opacity-75 mt-0.5">
                                  {appointmentAtThisSlot.startTime} ({appointmentAtThisSlot.duration}min)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
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
        }}
        comandaId={selectedComandaId}
      />
    </div>
  );
}
