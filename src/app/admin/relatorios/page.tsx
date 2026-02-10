'use client';

import { useState } from 'react';
import { BarChart3, DollarSign, Users, ShoppingBag, Scissors, TrendingUp, Calendar, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('mes');

  const handleVisualizar = (titulo: string) => {
    alert(`Visualizando: ${titulo}\nPeríodo: ${periodo}\n\nEm breve com gráficos interativos!`);
  };

  const handleExportar = (titulo: string) => {
    alert(`Exportando: ${titulo}\nPeríodo: ${periodo}\n\nFormatos disponíveis: PDF, Excel, CSV`);
  };

  const stats = [
    {
      icon: DollarSign,
      label: 'Faturamento Total',
      value: 'R$ 45.280,00',
      change: '+12.5%',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Users,
      label: 'Clientes Atendidos',
      value: '342',
      change: '+8.2%',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Scissors,
      label: 'Serviços Realizados',
      value: '156',
      change: '+15.3%',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: ShoppingBag,
      label: 'Produtos Vendidos',
      value: '89',
      change: '+5.7%',
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  const relatorios = [
    {
      titulo: 'Relatório de Faturamento',
      descricao: 'Análise detalhada de receitas por período, formas de pagamento e categorias',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      titulo: 'Relatório de Clientes',
      descricao: 'Métricas de retenção, novos clientes, frequência e ticket médio',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      titulo: 'Relatório de Serviços',
      descricao: 'Serviços mais realizados, horários de pico e duração média',
      icon: Scissors,
      color: 'bg-purple-500',
    },
    {
      titulo: 'Relatório de Produtos',
      descricao: 'Vendas por categoria, estoque, margem de lucro e giro',
      icon: ShoppingBag,
      color: 'bg-orange-500',
    },
    {
      titulo: 'Relatório de Profissionais',
      descricao: 'Performance, comissões, atendimentos e avaliações',
      icon: TrendingUp,
      color: 'bg-pink-500',
    },
    {
      titulo: 'Relatório de Agenda',
      descricao: 'Taxa de ocupação, cancelamentos, remarcações e no-shows',
      icon: Calendar,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análises e métricas do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="ano">Este Ano</option>
            <option value="personalizado">Período Personalizado</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <Badge variant="success">{stat.change}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Relatórios Disponíveis */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatorios.map((relatorio, index) => {
            const Icon = relatorio.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${relatorio.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2">{relatorio.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-4">{relatorio.descricao}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleVisualizar(relatorio.titulo)}
                      >
                        <BarChart3 size={16} className="mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleExportar(relatorio.titulo)}
                      >
                        <Download size={16} className="mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Em Desenvolvimento */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Módulo em Desenvolvimento</h3>
            <p className="text-sm text-blue-700">
              Os relatórios detalhados com gráficos e exportação de dados estão sendo desenvolvidos.
              Em breve você terá acesso a análises completas do seu negócio com visualizações interativas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
