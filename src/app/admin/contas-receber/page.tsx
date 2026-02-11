'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import ContaReceberModal from '@/components/modals/ContaReceberModal';
import { supabase } from '@/lib/supabase';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

export default function ContasReceberPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'receive'>('create');

  // Atalho Ctrl+D para receber débito
  useKeyboardShortcut('d', () => {
    if (contas.length > 0) {
      const primeiraPendente = contas.find(c => c.status !== 'pago');
      if (primeiraPendente) {
        handleReceive(primeiraPendente);
      }
    }
  }, { ctrl: true });

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = (conta: any) => {
    setSelectedConta(conta);
    setModalMode('receive');
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="warning">Pendente</Badge>;
      case 'parcial':
        return <Badge variant="info">Parcial</Badge>;
      case 'pago':
        return <Badge variant="success">Pago</Badge>;
      case 'vencido':
        return <Badge variant="error">Vencido</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: contas.reduce((sum, c) => sum + (c.valor_pendente || 0), 0),
    vencidas: contas.filter(c => new Date(c.data_vencimento) < new Date() && c.status !== 'pago').length,
    pendentes: contas.filter(c => c.status === 'pendente').length,
  };

  return (
    <div className="p-6 space-y-6">
      <ContaReceberModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedConta(null);
          setModalMode('create');
        }}
        conta={selectedConta}
        mode={modalMode}
        onSave={loadContas}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Contas a Receber</h1>
          <p className="text-neutral-600 mt-1">Gerenciar débitos e recebimentos</p>
        </div>
        <Button
          onClick={() => {
            setSelectedConta(null);
            setModalMode('create');
            setModalOpen(true);
          }}
          variant="primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">A Receber</p>
              <p className="text-3xl font-bold text-neutral-900">
                R$ {stats.total.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
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
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Vencidas</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.vencidas}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Contas */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Cliente</th>
                <th className="text-left p-4 text-sm font-semibold text-neutral-900">Descrição</th>
                <th className="text-right p-4 text-sm font-semibold text-neutral-900">Valor Total</th>
                <th className="text-right p-4 text-sm font-semibold text-neutral-900">Pago</th>
                <th className="text-right p-4 text-sm font-semibold text-neutral-900">Pendente</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Vencimento</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-neutral-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-600">
                    Carregando contas...
                  </td>
                </tr>
              ) : contas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-600">
                    Nenhuma conta cadastrada
                  </td>
                </tr>
              ) : (
                contas.map((conta) => (
                  <tr key={conta.id} className="hover:bg-neutral-50">
                    <td className="p-4">
                      <div className="font-medium text-neutral-900">{conta.cliente_nome}</div>
                    </td>
                    <td className="p-4 text-neutral-700">{conta.descricao}</td>
                    <td className="p-4 text-right font-medium text-neutral-900">
                      R$ {conta.valor_total?.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-green-600 font-medium">
                      R$ {conta.valor_pago?.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-red-600 font-bold">
                      R$ {conta.valor_pendente?.toFixed(2)}
                    </td>
                    <td className="p-4 text-center text-sm text-neutral-600">
                      {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(conta.status)}
                    </td>
                    <td className="p-4 text-center">
                      {conta.status !== 'pago' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleReceive(conta)}
                        >
                          Receber
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Atalho Info */}
      <div className="text-center text-sm text-neutral-500">
        Pressione <kbd className="px-2 py-1 bg-neutral-200 rounded">Ctrl+D</kbd> para receber o primeiro débito pendente
      </div>
    </div>
  );
}
