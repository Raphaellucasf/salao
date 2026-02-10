'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface ChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheque?: any;
  onSave: () => void;
}

export default function ChequeModal({ isOpen, onClose, cheque, onSave }: ChequeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tipo: 'recebido' as 'recebido' | 'emitido',
    numero: '',
    banco: '',
    agencia: '',
    conta: '',
    nominal_a: '',
    valor: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
    cliente_id: '',
    observacoes: '',
    status: 'pendente',
  });

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      if (cheque) {
        setFormData({
          tipo: cheque.tipo || 'recebido',
          numero: cheque.numero || '',
          banco: cheque.banco || '',
          agencia: cheque.agencia || '',
          conta: cheque.conta || '',
          nominal_a: cheque.nominal_a || '',
          valor: cheque.valor || 0,
          data_emissao: cheque.data_emissao || new Date().toISOString().split('T')[0],
          data_vencimento: cheque.data_vencimento || new Date().toISOString().split('T')[0],
          cliente_id: cheque.cliente_id || '',
          observacoes: cheque.observacoes || '',
          status: cheque.status || 'pendente',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, cheque]);

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
      tipo: 'recebido',
      numero: '',
      banco: '',
      agencia: '',
      conta: '',
      nominal_a: '',
      valor: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date().toISOString().split('T')[0],
      cliente_id: '',
      observacoes: '',
      status: 'pendente',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (cheque) {
        // Atualizar cheque existente
        const { error: updateError } = await supabase
          .from('cheques')
          .update(formData)
          .eq('id', cheque.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo cheque
        const { error: insertError } = await supabase
          .from('cheques')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cheque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={cheque ? 'Editar Cheque' : 'Novo Cheque'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de Cheque
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="recebido"
                checked={formData.tipo === 'recebido'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-4 h-4 text-primary-600"
              />
              <span>Recebido</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="emitido"
                checked={formData.tipo === 'emitido'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-4 h-4 text-primary-600"
              />
              <span>Emitido</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Número do Cheque"
            type="text"
            required
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            placeholder="123456"
          />

          <Input
            label="Banco"
            type="text"
            required
            value={formData.banco}
            onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
            placeholder="Ex: Banco do Brasil"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Agência"
            type="text"
            value={formData.agencia}
            onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
            placeholder="0000"
          />

          <Input
            label="Conta"
            type="text"
            value={formData.conta}
            onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
            placeholder="00000-0"
          />
        </div>

        <Input
          label="Nominal a"
          type="text"
          required
          value={formData.nominal_a}
          onChange={(e) => setFormData({ ...formData, nominal_a: e.target.value })}
          placeholder="Nome do beneficiário"
        />

        <Input
          label="Valor"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={formData.valor}
          onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data de Emissão"
            type="date"
            required
            value={formData.data_emissao}
            onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
          />

          <Input
            label="Data de Vencimento"
            type="date"
            required
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
          />
        </div>

        {formData.tipo === 'recebido' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cliente (opcional)
            </label>
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
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
        )}

        {cheque && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="pendente">Pendente</option>
              <option value="compensado">Compensado</option>
              <option value="devolvido">Devolvido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

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
            {loading ? 'Salvando...' : cheque ? 'Atualizar' : 'Salvar Cheque'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
