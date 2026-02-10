'use client';

import { Calendar, Clock, User, Star, ShoppingBag, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect } from 'react';

interface NextAppointment {
  id: string;
  client_name: string;
  client_is_vip: boolean;
  has_anamnese: boolean;
  service_name: string;
  start_time: string;
  duration: number;
}

interface Commission {
  total_pending: number;
  total_paid: number;
  vales_balance: number;
}

export default function ProfessionalDashboard() {
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [todayStats, setTodayStats] = useState({
    appointments: 0,
    completed: 0,
    revenue: 0,
  });
  const [commission, setCommission] = useState<Commission>({
    total_pending: 0,
    total_paid: 0,
    vales_balance: 0,
  });

  // TODO: Substituir por chamadas reais à API
  useEffect(() => {
    // Mock data
    setNextAppointment({
      id: '1',
      client_name: 'Maria Silva',
      client_is_vip: true,
      has_anamnese: true,
      service_name: 'Luzes + Tonalizante',
      start_time: '14:30',
      duration: 120,
    });

    setTodayStats({
      appointments: 6,
      completed: 3,
      revenue: 1850,
    });

    setCommission({
      total_pending: 3250.50,
      total_paid: 8900.00,
      vales_balance: 500.00,
    });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-8">
      {/* Header Mobile */}
      <div className="lg:hidden bg-gradient-to-br from-accent-500 to-accent-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Olá, Dimas</h1>
            <p className="text-accent-100 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <Calendar className="w-5 h-5 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{todayStats.appointments}</p>
            <p className="text-xs text-accent-100">Hoje</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <Clock className="w-5 h-5 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{todayStats.completed}</p>
            <p className="text-xs text-accent-100">Concluídos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <DollarSign className="w-5 h-5 mb-1 opacity-80" />
            <p className="text-2xl font-bold">
              {todayStats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-accent-100">Receita</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 -mt-4 lg:mt-8 max-w-7xl mx-auto">
        {/* Next Appointment Card */}
        {nextAppointment && (
          <Card className="mb-6 border-accent-200 bg-gradient-to-br from-white to-accent-50/30 shadow-luxury overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-neutral-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-600" />
                  Próximo Cliente
                </CardTitle>
                {nextAppointment.client_is_vip && (
                  <Badge variant="warning" className="bg-accent-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900 mb-1">
                    {nextAppointment.client_name}
                  </h3>
                  <p className="text-neutral-600 flex items-center gap-2">
                    <span className="text-accent-600 font-medium text-lg">{nextAppointment.start_time}</span>
                    <span className="text-neutral-400">•</span>
                    <span>{nextAppointment.service_name}</span>
                  </p>
                </div>

                {nextAppointment.has_anamnese && (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Cliente possui anamnese cadastrada</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="default" className="flex-1 bg-accent-500 hover:bg-accent-600 text-white">
                    Iniciar Atendimento
                  </Button>
                  <Button variant="outline" className="border-neutral-300">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-luxury hover:shadow-luxury-hover transition-all cursor-pointer border-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
              <ShoppingBag className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Venda Rápida</h3>
              <p className="text-xs opacity-90 mt-1">Produtos de prateleira</p>
            </CardContent>
          </Card>

          <Card className="shadow-luxury hover:shadow-luxury-hover transition-all cursor-pointer border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
              <TrendingUp className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Novo Agendamento</h3>
              <p className="text-xs opacity-90 mt-1">Marcar cliente</p>
            </CardContent>
          </Card>
        </div>

        {/* Commissions & Vales */}
        <Card className="mb-6 shadow-luxury border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg text-neutral-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent-600" />
              Comissões e Vales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Commission */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <p className="text-sm text-green-700 font-medium">Comissão Pendente</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {commission.total_pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              {/* Vales Balance */}
              {commission.vales_balance > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Vales a Descontar</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {commission.vales_balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              )}

              {/* Total Paid */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                <p className="text-sm text-neutral-600">Total Recebido (Mês)</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {commission.total_paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <Button variant="outline" className="w-full border-accent-300 text-accent-700 hover:bg-accent-50">
                Ver Extrato Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Agenda */}
        <Card className="shadow-luxury border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg text-neutral-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-600" />
              Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock appointments */}
              {[
                { time: '09:00', client: 'Ana Paula', service: 'Corte Feminino', status: 'completed' },
                { time: '10:30', client: 'Carlos Eduardo', service: 'Corte Masculino', status: 'completed' },
                { time: '12:00', client: 'Juliana Santos', service: 'Progressiva', status: 'completed' },
                { time: '14:30', client: 'Maria Silva', service: 'Luzes + Tonalizante', status: 'next' },
                { time: '17:00', client: 'Roberto Lima', service: 'Coloração', status: 'pending' },
                { time: '18:30', client: 'Fernanda Costa', service: 'Penteado', status: 'pending' },
              ].map((apt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    apt.status === 'next'
                      ? 'bg-accent-50 border-2 border-accent-200'
                      : apt.status === 'completed'
                      ? 'bg-neutral-50 opacity-60'
                      : 'bg-white border border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        apt.status === 'next'
                          ? 'bg-accent-600 text-white'
                          : apt.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {apt.time}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{apt.client}</p>
                      <p className="text-sm text-neutral-600">{apt.service}</p>
                    </div>
                  </div>
                  {apt.status === 'completed' && (
                    <Badge variant="success" className="text-xs">Concluído</Badge>
                  )}
                  {apt.status === 'next' && (
                    <Badge variant="warning" className="text-xs bg-accent-500 text-white">Próximo</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
