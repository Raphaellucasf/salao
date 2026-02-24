'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Appointment {
  id: string;
  professionalId: string;
  client: string;
  service: string;
  startTime: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{time: string; professionalId: string} | null>(null);

  // Mock data - profissionais (memoizado para evitar re-renders)
  const professionals = useMemo(() => [
    { id: '1', name: 'Dimas', color: 'from-blue-500 to-blue-600' },
    { id: '2', name: 'Julya', color: 'from-pink-500 to-pink-600' },
    { id: '3', name: 'Hendril', color: 'from-purple-500 to-purple-600' },
    { id: '4', name: 'Amélia', color: 'from-green-500 to-green-600' },
  ], []);

  // Mock data - agendamentos (agora com setState)
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      professionalId: '1',
      client: 'Maria Silva',
      service: 'Corte Feminino',
      startTime: '09:00',
      duration: 60,
      status: 'confirmed',
    },
    {
      id: '2',
      professionalId: '2',
      client: 'Ana Santos',
      service: 'Coloração + Corte',
      startTime: '10:00',
      duration: 120,
      status: 'confirmed',
    },
    {
      id: '3',
      professionalId: '1',
      client: 'Paula Costa',
      service: 'Escova',
      startTime: '14:00',
      duration: 45,
      status: 'pending',
    },
    {
      id: '4',
      professionalId: '3',
      client: 'Carla Souza',
      service: 'Progressiva',
      startTime: '09:30',
      duration: 180,
      status: 'confirmed',
    },
  ]);

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

  const handleDrop = useCallback((e: React.DragEvent, time: string, professionalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedAppointmentId) {
      // Busca o appointment atual pelo ID
      setAppointments(prevAppointments => {
        const draggedAppointment = prevAppointments.find(apt => apt.id === draggedAppointmentId);
        
        if (draggedAppointment) {
          // Verifica se houve mudança real
          const hasChanged = draggedAppointment.startTime !== time || draggedAppointment.professionalId !== professionalId;
          
          if (hasChanged) {
            // Feedback visual
            const professional = professionals.find(p => p.id === professionalId);
            const fromProfessional = professionals.find(p => p.id === draggedAppointment.professionalId);
            
            if (draggedAppointment.professionalId === professionalId) {
              console.log(`✓ Agendamento de ${draggedAppointment.client} movido de ${draggedAppointment.startTime} para ${time}`);
            } else {
              console.log(`✓ Agendamento de ${draggedAppointment.client} transferido de ${fromProfessional?.name} (${draggedAppointment.startTime}) para ${professional?.name} (${time})`);
            }
            
            // Retorna novo array com appointment atualizado
            return prevAppointments.map(apt => 
              apt.id === draggedAppointmentId
                ? { ...apt, startTime: time, professionalId: professionalId }
                : apt
            );
          }
        }
        return prevAppointments;
      });
    }
    
    setDraggedAppointmentId(null);
    setDropTarget(null);
  }, [draggedAppointmentId, professionals]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 border-green-600';
      case 'pending':
        return 'bg-yellow-500 border-yellow-600';
      case 'cancelled':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-neutral-500 border-neutral-600';
    }
  }, []);

  const todayStats = {
    total: 12,
    confirmed: 8,
    pending: 3,
    cancelled: 1,
  };

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
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header com nomes dos profissionais */}
            <div className="grid grid-cols-[80px_repeat(4,1fr)] bg-neutral-900 text-white sticky top-0 z-10">
              <div className="p-4 border-r border-neutral-800 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              {professionals.map((prof) => (
                <div key={prof.id} className="p-4 border-r border-neutral-800 last:border-r-0">
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${prof.color}`} />
                    <span className="font-semibold">{prof.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de horários */}
            <div className="relative bg-white">
              <div className="grid grid-cols-[80px_repeat(4,1fr)]" style={{ gridAutoRows: '40px' }}>
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
                              className={`absolute inset-1 rounded-lg p-2 border-2 shadow-lg cursor-grab hover:shadow-xl transition-shadow z-20 will-change-transform ${getStatusColor(appointmentAtThisSlot.status)} ${
                                draggedAppointmentId === appointmentAtThisSlot.id ? 'opacity-50' : 'opacity-100'
                              }`}
                              style={{
                                height: `calc(${rowSpan * 40}px - 8px)`,
                                transform: 'translate3d(0, 0, 0)', // Força aceleração GPU
                                backfaceVisibility: 'hidden', // Otimiza rendering
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Detalhes', appointmentAtThisSlot);
                              }}
                              title={`Arraste para mover ${appointmentAtThisSlot.client} para outro horário ou profissional`}
                            >
                              <div className="text-white select-none h-full overflow-hidden">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-sm truncate">{appointmentAtThisSlot.client}</p>
                                  <svg className="w-4 h-4 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                  </svg>
                                </div>
                                <p className="text-xs opacity-90 truncate">{appointmentAtThisSlot.service}</p>
                                <p className="text-xs opacity-75 mt-1">
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
    </div>
  );
}
