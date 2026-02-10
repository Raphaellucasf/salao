'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, User, Phone, Edit, Trash2 } from 'lucide-react';

interface Agendamento {
  id: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone?: string;
  profissional_nome: string;
  servico_nome: string;
  status: string;
  valor?: number;
  observacoes?: string;
}

export default function AgendamentosFuturosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7dias' | '15dias' | '30dias' | 'todos'>('7dias');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAgendamentos();
  }, [periodo]);

  const loadAgendamentos = async () => {
    try {
      setLoading(true);

      const hoje = new Date();
      let dataLimite = new Date();

      if (periodo === '7dias') {
        dataLimite.setDate(hoje.getDate() + 7);
      } else if (periodo === '15dias') {
        dataLimite.setDate(hoje.getDate() + 15);
      } else if (periodo === '30dias') {
        dataLimite.setDate(hoje.getDate() + 30);
      } else {
        dataLimite.setFullYear(hoje.getFullYear() + 1);
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          data_hora,
          status,
          valor,
          observacoes,
          clientes (
            nome,
            telefone
          ),
          usuarios (
            nome
          ),
          servicos (
            nome
          )
        `)
        .gte('data_hora', hoje.toISOString())
        .lte('data_hora', dataLimite.toISOString())
        .in('status', ['agendado', 'confirmado'])
        .order('data_hora', { ascending: true });

      if (error) throw error;

      const agendamentosFormatados = (data || []).map((ag: any) => ({
        id: ag.id,
        data_hora: ag.data_hora,
        cliente_nome: ag.clientes?.nome || 'Cliente não informado',
        cliente_telefone: ag.clientes?.telefone,
        profissional_nome: ag.usuarios?.nome || 'Profissional não informado',
        servico_nome: ag.servicos?.nome || 'Serviço não informado',
        status: ag.status,
        valor: ag.valor,
        observacoes: ag.observacoes
      }));

      setAgendamentos(agendamentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const agendamentosFiltrados = agendamentos.filter(ag =>
    search === '' ||
    ag.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
    ag.profissional_nome.toLowerCase().includes(search.toLowerCase()) ||
    ag.servico_nome.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por dia
  const agendamentosPorDia = agendamentosFiltrados.reduce((acc, ag) => {
    const data = new Date(ag.data_hora).toLocaleDateString('pt-BR');
    if (!acc[data]) acc[data] = [];
    acc[data].push(ag);
    return acc;
  }, {} as Record<string, Agendamento[]>);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      agendado: { variant: 'warning', label: 'Agendado' },
      confirmado: { variant: 'success', label: 'Confirmado' }
    };
    return badges[status] || badges.agendado;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Agendamentos Futuros
          </h1>
          <p className="text-gray-600 mt-1">
            {agendamentosFiltrados.length} agendamentos confirmados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por cliente, profissional ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={periodo === '7dias' ? 'primary' : 'outline'}
              onClick={() => setPeriodo('7dias')}
            >
              Próximos 7 dias
            </Button>
            <Button
              size="sm"
              variant={periodo === '15dias' ? 'primary' : 'outline'}
              onClick={() => setPeriodo('15dias')}
            >
              Próximos 15 dias
            </Button>
            <Button
              size="sm"
              variant={periodo === '30dias' ? 'primary' : 'outline'}
              onClick={() => setPeriodo('30dias')}
            >
              Próximos 30 dias
            </Button>
            <Button
              size="sm"
              variant={periodo === 'todos' ? 'primary' : 'outline'}
              onClick={() => setPeriodo('todos')}
            >
              Todos
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Agendamentos */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : Object.keys(agendamentosPorDia).length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum agendamento futuro encontrado</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(agendamentosPorDia).map(([data, ags]) => (
            <div key={data}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                {data}
                <Badge variant="default" className="ml-2">
                  {ags.length} agendamento{ags.length > 1 ? 's' : ''}
                </Badge>
              </h2>

              <div className="grid gap-3">
                {ags.map((ag) => {
                  const statusBadge = getStatusBadge(ag.status);
                  const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  return (
                    <Card key={ag.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                            {hora}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{ag.cliente_nome}</h3>
                              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {ag.profissional_nome}
                              </span>
                              <span>• {ag.servico_nome}</span>
                              {ag.cliente_telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {ag.cliente_telefone}
                                </span>
                              )}
                              {ag.valor && (
                                <span>• R$ {ag.valor.toFixed(2)}</span>
                              )}
                            </div>

                            {ag.observacoes && (
                              <p className="text-sm text-gray-500 mt-2 italic">
                                {ag.observacoes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
