'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface ContaReceberModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta?: any;
  onSave: () => void;
  mode?: 'create' | 'receive';
}

export default function ContaReceberModal({ isOpen, onClose, conta, onSave, mode = 'create' }: ContaReceberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: '',
    descricao: '',
    valor_total: 0,
    data_vencimento: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  const [recebimento, setRecebimento] = useState({
    valor: 0,
    metodo_pagamento: 'Dinheiro',
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      if (conta && mode === 'receive') {
        setRecebimento({
          valor: conta.valor_pendente || 0,
          metodo_pagamento: 'Dinheiro',
          observacoes: '',
        });
      } else if (!conta) {
        resetForm();
      }
    }
  }, [isOpen, conta, mode]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      descricao: '',
      valor_total: 0,
      data_vencimento: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setError('');
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cliente = clientes.find(c => c.id === formData.cliente_id);

      const { error: insertError } = await supabase
        .from('contas_receber')
        .insert([{
          ...formData,
          cliente_nome: cliente?.nome || '',
          valor_pendente: formData.valor_total,
          status: 'pendente',
        }]);

      if (insertError) throw insertError;

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!conta) return;

    try {
      // Registrar recebimento
      const { error: recebError } = await supabase
        .from('conta_recebimentos')
        .insert([{
          conta_id: conta.id,
          valor: recebimento.valor,
          metodo_pagamento: recebimento.metodo_pagamento,
          observacoes: recebimento.observacoes,
        }]);

      if (recebError) throw recebError;

      // Atualizar conta
      const valorPago = conta.valor_pago + recebimento.valor;
      const valorPendente = conta.valor_total - valorPago;
      let status = 'pendente';
      
      if (valorPendente <= 0) {
        status = 'pago';
      } else if (valorPago > 0) {
        status = 'parcial';
      }

      const { error: updateError } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: valorPago,
          valor_pendente: valorPendente,
          status: status,
        })
        .eq('id', conta.id);

      if (updateError) throw updateError;

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar recebimento');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'receive' && conta) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Receber Débito"
      >
        <form onSubmit={handleSubmitReceive} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Informações da Conta */}
          <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Cliente:</span>
              <span className="font-medium">{conta.cliente_nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Descrição:</span>
              <span className="font-medium">{conta.descricao}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Valor Total:</span>
              <span className="font-medium">R$ {conta.valor_total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Já Pago:</span>
              <span className="font-medium text-green-600">R$ {conta.valor_pago?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold">Pendente:</span>
              <span className="font-bold text-red-600">R$ {conta.valor_pendente?.toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Valor a Receber"
            type="number"
            min="0.01"
            step="0.01"
            max={conta.valor_pendente}
            required
            value={recebimento.valor}
            onChange={(e) => setRecebimento({ ...recebimento, valor: parseFloat(e.target.value) || 0 })}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Método de Pagamento
            </label>
            <select
              value={recebimento.metodo_pagamento}
              onChange={(e) => setRecebimento({ ...recebimento, metodo_pagamento: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="Dinheiro">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Observações
            </label>
            <textarea
              value={recebimento.observacoes}
              onChange={(e) => setRecebimento({ ...recebimento, observacoes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Observações..."
            />
          </div>

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
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Confirmar Recebimento'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nova Conta a Receber"
    >
      <form onSubmit={handleSubmitCreate} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Cliente
          </label>
          <select
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Descrição"
          type="text"
          required
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Serviço realizado em..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor Total"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={formData.valor_total}
            onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />

          <Input
            label="Data de Vencimento"
            type="date"
            required
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Observações adicionais..."
          />
        </div>

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
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Criar Conta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
