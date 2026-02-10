'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - profissionais
  const professionals = [
    { id: '1', name: 'Dimas', color: 'from-blue-500 to-blue-600' },
    { id: '2', name: 'Julya', color: 'from-pink-500 to-pink-600' },
    { id: '3', name: 'Hendril', color: 'from-purple-500 to-purple-600' },
    { id: '4', name: 'Amélia', color: 'from-green-500 to-green-600' },
  ];

  // Mock data - agendamentos
  const appointments = [
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
  ];

  // Gerar horários (8:00 às 19:00 a cada 30 min)
  const timeSlots = [];
  for (let hour = 8; hour < 19; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

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

  const getAppointmentStyle = (startTime: string, duration: number) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const startIndex = (startMinutes - 8 * 60) / 30;
    const slots = Math.ceil(duration / 30);
    
    return {
      gridRowStart: startIndex + 1,
      gridRowEnd: startIndex + slots + 1,
    };
  };

  const getStatusColor = (status: string) => {
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
  };

  const todayStats = {
    total: 12,
    confirmed: 8,
    pending: 3,
    cancelled: 1,
  };

  return (
    <div className="p-6 space-y-6">
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
            <div className="relative">
              {/* Linhas de horário */}
              <div className="grid grid-cols-[80px_repeat(4,1fr)]">
                {timeSlots.map((time, index) => (
                  <div key={time} className="contents">
                    {/* Coluna de horário */}
                    <div className={`p-2 text-xs text-neutral-600 text-center border-r border-b border-neutral-200 ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}`}>
                      {index % 2 === 0 ? time : ''}
                    </div>
                    
                    {/* Colunas dos profissionais */}
                    {professionals.map((prof) => (
                      <div
                        key={`${time}-${prof.id}`}
                        className={`relative border-r border-b border-neutral-200 last:border-r-0 hover:bg-blue-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-neutral-50/50' : 'bg-white'}`}
                        style={{ minHeight: '40px' }}
                        onClick={() => console.log('Novo agendamento', time, prof.name)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Appointments overlay */}
              <div className="absolute top-0 left-0 right-0 pointer-events-none">
                <div className="grid grid-cols-[80px_repeat(4,1fr)] h-full">
                  <div /> {/* Coluna de horário */}
                  {professionals.map((prof, profIndex) => (
                    <div key={prof.id} className="relative" style={{ gridColumn: profIndex + 2 }}>
                      {appointments
                        .filter(apt => apt.professionalId === prof.id)
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className={`absolute left-1 right-1 rounded-lg p-2 border-2 shadow-lg pointer-events-auto cursor-pointer hover:shadow-xl transition-shadow ${getStatusColor(apt.status)}`}
                            style={{
                              ...getAppointmentStyle(apt.startTime, apt.duration),
                              top: 0,
                            }}
                            onClick={() => console.log('Detalhes', apt)}
                          >
                            <div className="text-white">
                              <p className="font-semibold text-sm truncate">{apt.client}</p>
                              <p className="text-xs opacity-90 truncate">{apt.service}</p>
                              <p className="text-xs opacity-75 mt-1">
                                {apt.startTime} ({apt.duration}min)
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
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
