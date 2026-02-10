'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Mock data - será substituído por dados reais do Supabase
  const stats = [
    {
      name: 'Agendamentos Hoje',
      value: '12',
      change: '+3',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Faturamento Hoje',
      value: 'R$ 2.450',
      change: '+18%',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Novos Clientes',
      value: '4',
      change: '+2',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Meta do Mês',
      value: '68%',
      change: '+12%',
      icon: TrendingUp,
      color: 'from-accent-500 to-accent-600',
    },
  ];

  const upcomingAppointments = [
    {
      id: '1',
      client: 'Maria Silva',
      service: 'Corte + Coloração',
      professional: 'Dimas',
      time: '14:00',
      status: 'confirmed',
    },
    {
      id: '2',
      client: 'Ana Santos',
      service: 'Mega Hair',
      professional: 'Julya + Dimas',
      time: '15:00',
      status: 'pending',
    },
    {
      id: '3',
      client: 'Paula Costa',
      service: 'Botox Capilar',
      professional: 'Hendril',
      time: '16:00',
      status: 'confirmed',
    },
  ];

  const todayActivity = [
    { id: '1', text: 'Julya concluiu atendimento de Maria Silva', time: '13:45', type: 'success' },
    { id: '2', text: 'Novo agendamento: Ana Santos para 15:00', time: '13:30', type: 'info' },
    { id: '3', text: 'Produto "Shampoo Loreal" está com estoque baixo', time: '13:15', type: 'warning' },
    { id: '4', text: 'Pagamento recebido: R$ 450,00 (Débito)', time: '13:00', type: 'success' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Olá, {user?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-neutral-600 mt-1">
            Aqui está um resumo do que está acontecendo hoje
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Hoje</p>
          <p className="text-lg font-semibold text-neutral-900">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} padding="lg" hover>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Agendamentos */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900">Próximos Agendamentos</h2>
            <Link href="/admin/agenda" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {appointment.client.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{appointment.client}</p>
                    <p className="text-sm text-neutral-600">{appointment.service}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Com {appointment.professional}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <div>
                    <p className="text-lg font-bold text-neutral-900">{appointment.time}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(appointment.status)}`}>
                      {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Atividade de Hoje */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Atividade de Hoje</h2>
          <div className="space-y-4">
            {todayActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900">{activity.text}</p>
                  <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/agenda">
          <Card padding="lg" hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Ver Agenda</h3>
                <p className="text-sm text-neutral-600">Timeline completa</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/clientes">
          <Card padding="lg" hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Clientes</h3>
                <p className="text-sm text-neutral-600">Gerenciar cadastros</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/financeiro">
          <Card padding="lg" hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Financeiro</h3>
                <p className="text-sm text-neutral-600">Relatórios e caixa</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
