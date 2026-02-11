'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import ChequeModal from '@/components/modals/ChequeModal';
import { supabase } from '@/lib/supabase';

export default function ChequesPage() {
  const [cheques, setCheques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<any>(null);
  const [filter, setFilter] = useState<'todos' | 'recebido' | 'emitido'>('todos');

  useEffect(() => {
    loadCheques();
  }, [filter]);

  const loadCheques = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cheques')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (filter !== 'todos') {
        query = query.eq('tipo', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCheques(data || []);
    } catch (error) {
      console.error('Erro ao carregar cheques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cheque: any) => {
    setSelectedCheque(cheque);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="warning">Pendente</Badge>;
      case 'compensado':
        return <Badge variant="success">Compensado</Badge>;
      case 'devolvido':
        return <Badge variant="error">Devolvido</Badge>;
      case 'cancelado':
        return <Badge variant="default">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: cheques.reduce((sum, c) => sum + (c.valor || 0), 0),
    pendentes: cheques.filter(c => c.status === 'pendente').length,
    compensados: cheques.filter(c => c.status === 'compensado').length,
  };

  return (
    <div className="p-6 space-y-6">
      <ChequeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCheque(null);
        }}
        cheque={selectedCheque}
        onSave={loadCheques}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Controle de Cheques</h1>
          <p className="text-neutral-600 mt-1">Gerenciar cheques recebidos e emitidos</p>
        </div>
        <Button
          onClick={() => {
            setSelectedCheque(null);
            setModalOpen(true);
          }}
          variant="primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Cheque
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Total em Cheques</p>
              <p className="text-3xl font-bold text-neutral-900">
                R$ {stats.total.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Pendentes</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.pendentes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Compensados</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.compensados}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="lg">
        <div className="flex gap-2">
          <Button
            variant={filter === 'todos' ? 'primary' : 'secondary'}
            onClick={() => setFilter('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'recebido' ? 'primary' : 'secondary'}
            onClick={() => setFilter('recebido')}
          >
            Recebidos
          </Button>
          <Button
            variant={filter === 'emitido' ? 'primary' : 'secondary'}
            onClick={() => setFilter('emitido')}
          >
            Emitidos
          </Button>
        </div>
      </Card>

      {/* Tabela de Cheques */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Tipo</th>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Número</th>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Banco</th>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Nominal a</th>
                <th className="text-right p-4 text-sm font-semibold text-neutral-900">Valor</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Vencimento</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-600">
                    Carregando cheques...
                  </td>
                </tr>
              ) : cheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-600">
                    Nenhum cheque cadastrado
                  </td>
                </tr>
              ) : (
                cheques.map((cheque) => (
                  <tr key={cheque.id} className="hover:bg-neutral-50">
                    <td className="p-4">
                      <Badge variant={cheque.tipo === 'recebido' ? 'success' : 'info'}>
                        {cheque.tipo}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-neutral-900">{cheque.numero}</td>
                    <td className="p-4 text-neutral-700">{cheque.banco}</td>
                    <td className="p-4 text-neutral-700">{cheque.nominal_a}</td>
                    <td className="p-4 text-right font-bold text-neutral-900">
                      R$ {cheque.valor?.toFixed(2)}
                    </td>
                    <td className="p-4 text-center text-sm text-neutral-600">
                      {new Date(cheque.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(cheque.status)}
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(cheque)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
