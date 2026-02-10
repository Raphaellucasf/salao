'use client';

import Sidebar from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Package, 
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock data
  const stats = {
    todayAppointments: 18,
    serviceRevenue: 12850.50,
    productRevenue: 2450.00,
    activeClients: 234,
  };

  const lowStockProducts = [
    { name: 'Tinta Keune 8.0', quantity: 2, min: 3, category: 'Tinta' },
    { name: 'Papel Alumínio', quantity: 1, min: 3, category: 'Consumível' },
  ];

  const currentlyWorking = [
    { professional: 'Dimas', client: 'Maria Silva VIP', service: 'MegaHair', time: '14:30', end: '15:30' },
    { professional: 'Julya', client: 'Maria Silva VIP', service: 'MegaHair', time: '14:30', end: '15:30' },
    { professional: 'Hendril', client: 'Ana Costa', service: 'Coloração 60GR', time: '14:00', end: '15:00' },
    { professional: 'Amélia', client: 'Juliana Santos', service: 'Progressiva', time: '13:00', end: '15:30' },
  ];

  const recentAppointments = [
    { id: 1, client: 'Maria Silva', professional: 'Dimas', service: 'Corte Feminino', time: '09:00', status: 'completed', vip: true },
    { id: 2, client: 'João Santos', professional: 'Hendril', service: 'Coloração', time: '10:30', status: 'completed', vip: false },
    { id: 3, client: 'Ana Costa', professional: 'Amélia', service: 'Progressiva', time: '14:00', status: 'in_progress', vip: false },
    { id: 4, client: 'Pedro Lima', professional: 'Dimas', service: 'Corte Masculino', time: '15:30', status: 'confirmed', vip: false },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar userRole="admin" />

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
            <p className="text-neutral-600">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-luxury border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-neutral-600 mb-1">Agendamentos Hoje</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.todayAppointments}</p>
              </CardContent>
            </Card>

            <Card className="shadow-luxury border-0 bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-green-700 font-medium">Serviços</span>
                </div>
                <p className="text-sm text-neutral-600 mb-1">Receita (Serviços)</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {stats.serviceRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-luxury border-0 bg-gradient-to-br from-accent-50 to-accent-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-accent-700 font-medium">Produtos</span>
                </div>
                <p className="text-sm text-neutral-600 mb-1">Receita (Venda Retail)</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {stats.productRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-luxury border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mb-1">Clientes Ativos</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.activeClients}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Currently Working */}
            <Card className="lg:col-span-2 shadow-luxury border-neutral-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-600" />
                  Quem Está Atendendo Agora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentlyWorking.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent-50 to-transparent border border-accent-200">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-medium text-sm">
                            {item.professional[0]}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{item.professional}</p>
                          <p className="text-sm text-neutral-600">{item.client}</p>
                          <p className="text-xs text-neutral-500">{item.service}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-accent-700">{item.time} - {item.end}</p>
                        <Badge variant="success" className="text-xs mt-1">Em atendimento</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card className="shadow-luxury border-orange-200 bg-gradient-to-br from-orange-50/50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Alertas de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.map((product, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-neutral-900 text-sm">{product.name}</p>
                        <Badge variant="warning" className="text-xs">Crítico</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-600">{product.category}</span>
                        <span className="text-orange-700 font-medium">
                          {product.quantity} / {product.min} un
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-sm text-accent-700 hover:text-accent-800 font-medium py-2">
                    Ver Todos os Alertas →
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Appointments */}
          <Card className="shadow-luxury border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-600" />
                Agendamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Cliente</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Profissional</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Serviço</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Horário</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900">{apt.client}</span>
                            {apt.vip && (
                              <Badge variant="warning" className="text-xs bg-accent-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{apt.professional}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{apt.service}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{apt.time}</td>
                        <td className="py-3 px-4">
                          {apt.status === 'completed' && (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Concluído
                            </Badge>
                          )}
                          {apt.status === 'in_progress' && (
                            <Badge variant="info" className="text-xs bg-blue-100 text-blue-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Em Atendimento
                            </Badge>
                          )}
                          {apt.status === 'confirmed' && (
                            <Badge variant="default" className="text-xs">Confirmado</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
