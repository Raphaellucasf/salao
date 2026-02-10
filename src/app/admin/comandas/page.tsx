'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Receipt, DollarSign, X, Edit } from 'lucide-react';
import ComandaModal from '@/components/modals/ComandaModal';
import { supabase } from '@/lib/supabase';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

export default function ComandasPage() {
  const [comandas, setComandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [filter, setFilter] = useState<'todas' | 'abertas' | 'fechadas'>('abertas');

  // Atalho F8 para abrir nova comanda
  useKeyboardShortcut('F8', () => {
    setSelectedComanda(null);
    setModalOpen(true);
  });

  useEffect(() => {
    loadComandas();
  }, [filter]);

  const loadComandas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('comandas')
        .select('*, comanda_itens(*)')
        .order('data_abertura', { ascending: false });

      if (filter === 'abertas') {
        query = query.eq('status', 'aberta');
      } else if (filter === 'fechadas') {
        query = query.eq('status', 'fechada');
      }

      const { data, error } = await query;
      if (error) throw error;
      setComandas(data || []);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFecharComanda = async (comanda: any) => {
    if (!confirm(`Fechar comanda #${comanda.numero_comanda}?`)) return;

    try {
      const { error } = await supabase
        .from('comandas')
        .update({
          status: 'fechada',
          data_fechamento: new Date().toISOString(),
        })
        .eq('id', comanda.id);

      if (error) throw error;
      loadComandas();
    } catch (error: any) {
      alert('Erro ao fechar comanda: ' + error.message);
    }
  };

  const handleCancelarComanda = async (comanda: any) => {
    if (!confirm(`Cancelar comanda #${comanda.numero_comanda}?`)) return;

    try {
      const { error } = await supabase
        .from('comandas')
        .update({ status: 'cancelada' })
        .eq('id', comanda.id);

      if (error) throw error;
      loadComandas();
    } catch (error: any) {
      alert('Erro ao cancelar comanda: ' + error.message);
    }
  };

  const handleEditComanda = (comanda: any) => {
    setSelectedComanda(comanda);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta':
        return <Badge variant="success">Aberta</Badge>;
      case 'fechada':
        return <Badge variant="default">Fechada</Badge>;
      case 'cancelada':
        return <Badge variant="danger">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    abertas: comandas.filter(c => c.status === 'aberta').length,
    totalAbertas: comandas
      .filter(c => c.status === 'aberta')
      .reduce((sum, c) => sum + (c.total || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <ComandaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedComanda(null);
        }}
        comandaId={selectedComanda?.id}
        onSave={loadComandas}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Comandas</h1>
          <p className="text-neutral-600 mt-1">Gerenciar comandas abertas e fechadas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedComanda(null);
              setModalOpen(true);
            }}
            variant="primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Comanda (F8)
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Comandas Abertas</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.abertas}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Total em Aberto</p>
              <p className="text-3xl font-bold text-neutral-900">
                R$ {stats.totalAbertas.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="lg">
        <div className="flex gap-2">
          <Button
            variant={filter === 'todas' ? 'primary' : 'secondary'}
            onClick={() => setFilter('todas')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'abertas' ? 'primary' : 'secondary'}
            onClick={() => setFilter('abertas')}
          >
            Abertas
          </Button>
          <Button
            variant={filter === 'fechadas' ? 'primary' : 'secondary'}
            onClick={() => setFilter('fechadas')}
          >
            Fechadas
          </Button>
        </div>
      </Card>

      {/* Lista de Comandas */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-neutral-600">
            Carregando comandas...
          </div>
        ) : comandas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-600">
            Nenhuma comanda encontrada
          </div>
        ) : (
          comandas.map((comanda) => (
            <Card key={comanda.id} padding="lg" className="relative">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      Comanda #{comanda.numero_comanda}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {comanda.cliente_nome || 'Cliente não informado'}
                    </p>
                  </div>
                  {getStatusBadge(comanda.status)}
                </div>

                {/* Itens */}
                <div className="border-t pt-3">
                  <p className="text-xs text-neutral-600 mb-2">Itens:</p>
                  <div className="space-y-1">
                    {comanda.comanda_itens?.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span className="text-neutral-700">
                          {item.quantidade}x {item.descricao}
                        </span>
                        <span className="font-medium">
                          R$ {item.valor_total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {comanda.comanda_itens?.length > 3 && (
                      <p className="text-xs text-neutral-500">
                        +{comanda.comanda_itens.length - 3} itens...
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">Total:</span>
                    <span className="text-xl font-bold text-primary-600">
                      R$ {comanda.total?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Data */}
                <div className="text-xs text-neutral-500">
                  Aberta em: {new Date(comanda.data_abertura).toLocaleString('pt-BR')}
                </div>

                {/* Ações */}
                {comanda.status === 'aberta' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditComanda(comanda)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFecharComanda(comanda)}
                      className="flex-1"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Fechar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelarComanda(comanda)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
