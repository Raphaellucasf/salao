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
  AlertCircle,
  ClipboardList,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  cliente_nome: string;
  servicos: any;
  profissional_nome: string;
  auxiliar_nome: string | null;
  hora_inicio: string;
  status: string;
}

interface Activity {
  id: string;
  text: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [agendamentosHoje, setAgendamentosHoje] = useState(0);
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [novosClientesHoje, setNovosClientesHoje] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayActivity, setTodayActivity] = useState<Activity[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const agoraHora = new Date().toTimeString().slice(0, 8);

      const [
        { data: agendamentosData },
        { data: clientesData },
        { data: proximosData },
        { data: concluidosHojeData },
        { data: novosAgendamentosData },
      ] = await Promise.all([
        // Todos agendamentos de hoje
        supabase
          .from('agendamentos')
          .select('id, status, valor_total, concluido_em')
          .eq('data_agendamento', hoje),

        // Novos clientes criados hoje
        supabase
          .from('clientes')
          .select('id')
          .gte('created_at', `${hoje}T00:00:00`),

        // Próximos agendamentos de hoje (a partir de agora)
        (supabase as any)
          .from('vw_agendamentos_completos')
          .select('id, cliente_nome, servicos, profissional_nome, auxiliar_nome, hora_inicio, status')
          .eq('data_agendamento', hoje)
          .neq('status', 'cancelado')
          .gte('hora_inicio', agoraHora)
          .order('hora_inicio', { ascending: true })
          .limit(5),

        // Agendamentos concluídos hoje (para atividade)
        (supabase as any)
          .from('vw_agendamentos_completos')
          .select('id, cliente_nome, profissional_nome, concluido_em')
          .eq('data_agendamento', hoje)
          .eq('status', 'concluido')
          .order('concluido_em', { ascending: false })
          .limit(3),

        // Agendamentos criados hoje (para atividade)
        (supabase as any)
          .from('vw_agendamentos_completos')
          .select('id, cliente_nome, hora_inicio, created_at')
          .eq('data_agendamento', hoje)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      // Stats
      const lista = agendamentosData || [];
      setAgendamentosHoje(lista.length);

      const fatHoje = lista
        .filter((a: any) => a.status === 'concluido' && a.valor_total)
        .reduce((acc: number, a: any) => acc + parseFloat(a.valor_total || 0), 0);
      setFaturamentoHoje(fatHoje);

      // Faturamento do mês
      const { data: fatMesData } = await supabase
        .from('agendamentos')
        .select('valor_total')
        .eq('status', 'concluido')
        .gte('data_agendamento', inicioMes);

      const fatMes = (fatMesData || []).reduce(
        (acc: number, a: any) => acc + parseFloat(a.valor_total || 0), 0
      );
      setFaturamentoMes(fatMes);

      setNovosClientesHoje((clientesData || []).length);
      setUpcomingAppointments(proximosData || []);

      // Montar atividades reais
      const activities: Activity[] = [];

      (concluidosHojeData || []).forEach((a: any) => {
        if (a.concluido_em) {
          const hora = new Date(a.concluido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          activities.push({
            id: `concluido-${a.id}`,
            text: `${a.profissional_nome || 'Profissional'} concluiu atendimento de ${a.cliente_nome}`,
            time: hora,
            type: 'success',
          });
        }
      });

      (novosAgendamentosData || []).forEach((a: any) => {
        if (a.created_at) {
          const hora = new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          activities.push({
            id: `novo-${a.id}`,
            text: `Novo agendamento: ${a.cliente_nome} para ${a.hora_inicio?.slice(0, 5)}`,
            time: hora,
            type: 'info',
          });
        }
      });

      activities.sort((a, b) => b.time.localeCompare(a.time));
      setTodayActivity(activities.slice(0, 6));

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'agendado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      confirmado: 'Confirmado',
      agendado: 'Pendente',
      em_andamento: 'Em andamento',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      confirmed: 'Confirmado',
      pending: 'Pendente',
    };
    return map[status] || status;
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

  const getServiceNames = (servicos: any): string => {
    try {
      const arr = typeof servicos === 'string' ? JSON.parse(servicos) : servicos;
      if (Array.isArray(arr) && arr.length > 0) return arr.map((s: any) => s.nome).join(', ');
    } catch {}
    return 'Serviço';
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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Link href="/admin/comandas">
          <Card padding="lg" hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Comandas</h3>
                <p className="text-sm text-neutral-600">Abrir/gerenciar (F8)</p>
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

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">Nenhum agendamento pendente para hoje.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => {
                const professional = [apt.profissional_nome, apt.auxiliar_nome].filter(Boolean).join(' + ');
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {apt.cliente_nome?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{apt.cliente_nome}</p>
                        <p className="text-sm text-neutral-600">{getServiceNames(apt.servicos)}</p>
                        {professional && (
                          <p className="text-xs text-neutral-500 mt-0.5">Com {professional}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{apt.hora_inicio?.slice(0, 5)}</p>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Atividade de Hoje */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Atividade de Hoje</h2>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : todayActivity.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">Nenhuma atividade registrada hoje.</p>
          ) : (
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
          )}
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="lg" hover>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600">Agendamentos Hoje</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : agendamentosHoje}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg" hover>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(faturamentoHoje)}
              </p>
              <p className="text-xs text-neutral-500 mt-1">Serviços concluídos</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg" hover>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600">Novos Clientes Hoje</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : novosClientesHoje}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg" hover>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600">Faturamento do Mês</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(faturamentoMes)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
