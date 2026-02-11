// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DesfazerVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function DesfazerVendaModal({ isOpen, onClose, onSave }: DesfazerVendaModalProps) {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadVendas();
    }
  }, [isOpen]);

  const loadVendas = async () => {
    try {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() - 7); // Últimos 7 dias

      const { data, error } = await supabase
        .from('vendas_produtos')
        .select('*')
        .eq('estornada', false)
        .gte('created_at', hoje.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendas(data || []);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    }
  };

  const handleEstornar = async () => {
    if (!selectedVenda) {
      setError('Selecione uma venda');
      return;
    }

    if (!motivo.trim()) {
      setError('Informe o motivo do estorno');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const venda = vendas.find(v => v.id === selectedVenda);
      if (!venda) throw new Error('Venda não encontrada');

      // Marcar venda como estornada
      const { error: updateError } = await supabase
        .from('vendas_produtos')
        .update({
          estornada: true,
          data_estorno: new Date().toISOString(),
          motivo_estorno: motivo,
        })
        .eq('id', selectedVenda);

      if (updateError) throw updateError;

      // Devolver produto ao estoque
      const { data: produto } = await supabase
        .from('produtos')
        .select('quantidade')
        .eq('id', venda.produto_id)
        .single();

      if (produto) {
        await supabase
          .from('produtos')
          .update({
            quantidade: produto.quantidade + venda.quantidade,
          })
          .eq('id', venda.produto_id);
      }

      onSave();
      onClose();
      setSelectedVenda(null);
      setMotivo('');
    } catch (err: any) {
      setError(err.message || 'Erro ao estornar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Desfazer Venda de Produtos"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Atenção!</p>
              <p>O estorno devolverá o produto ao estoque e registrará a operação no sistema.</p>
              <p className="mt-1">Esta ação não pode ser desfeita.</p>
            </div>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Selecione a venda para estornar:
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
            {vendas.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                Nenhuma venda recente encontrada
              </div>
            ) : (
              vendas.map((venda) => (
                <div
                  key={venda.id}
                  onClick={() => setSelectedVenda(venda.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedVenda === venda.id
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-neutral-50 border-2 border-transparent hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{venda.produto_nome}</p>
                      <p className="text-sm text-neutral-600">
                        Cliente: {venda.cliente_nome || 'Não informado'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(venda.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-neutral-900">
                        {venda.quantidade}x R$ {venda.valor_unitario.toFixed(2)}
                      </p>
                      <p className="text-lg font-bold text-primary-600">
                        R$ {venda.valor_total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivo do Estorno */}
        {selectedVenda && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Motivo do Estorno *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Descreva o motivo do estorno..."
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleEstornar}
            className="flex-1"
            disabled={loading || !selectedVenda || !motivo.trim()}
          >
            {loading ? 'Estornando...' : 'Confirmar Estorno'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

