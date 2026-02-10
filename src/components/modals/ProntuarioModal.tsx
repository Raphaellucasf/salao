'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface ProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  prontuario?: any;
  onSave: () => void;
}

export default function ProntuarioModal({ isOpen, onClose, clienteId, prontuario, onSave }: ProntuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cliente, setCliente] = useState<any>(null);

  const [formData, setFormData] = useState({
    data_atendimento: new Date().toISOString().split('T')[0],
    profissional_id: '',
    tecnicas_aplicadas: '',
    observacoes_atendimento: '',
    tempo_duracao: 60,
    satisfacao_cliente: 5,
    resultado_obtido: '',
    recomendacoes: '',
    retorno_necessario: false,
    data_retorno: '',
    valor_total: 0,
    forma_pagamento: '',
  });

  useEffect(() => {
    if (isOpen && clienteId) {
      loadCliente();
      if (prontuario) {
        setFormData(prontuario);
      }
    }
  }, [isOpen, clienteId, prontuario]);

  const loadCliente = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) throw error;
      setCliente(data);
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        cliente_id: clienteId,
        ...formData,
      };

      if (prontuario) {
        const { error: updateError } = await supabase
          .from('prontuarios')
          .update(dataToSave)
          .eq('id', prontuario.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('prontuarios')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar prontuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prontuário de Atendimento" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {cliente && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="font-semibold text-primary-900">{cliente.nome}</p>
            <p className="text-sm text-primary-700">{cliente.telefone} • {cliente.email}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data do Atendimento"
            type="date"
            required
            value={formData.data_atendimento}
            onChange={(e) => setFormData({ ...formData, data_atendimento: e.target.value })}
          />

          <Input
            label="Tempo de Duração (minutos)"
            type="number"
            min="0"
            value={formData.tempo_duracao}
            onChange={(e) => setFormData({ ...formData, tempo_duracao: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Técnicas Aplicadas</label>
          <textarea
            value={formData.tecnicas_aplicadas}
            onChange={(e) => setFormData({ ...formData, tecnicas_aplicadas: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Descreva as técnicas e procedimentos realizados..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Observações do Atendimento</label>
          <textarea
            value={formData.observacoes_atendimento}
            onChange={(e) => setFormData({ ...formData, observacoes_atendimento: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Observações gerais sobre o atendimento..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Satisfação do Cliente: {formData.satisfacao_cliente}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.satisfacao_cliente}
            onChange={(e) => setFormData({ ...formData, satisfacao_cliente: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>Insatisfeito</span>
            <span>Muito Satisfeito</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Resultado Obtido</label>
          <textarea
            value={formData.resultado_obtido}
            onChange={(e) => setFormData({ ...formData, resultado_obtido: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Descreva o resultado alcançado..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Recomendações</label>
          <textarea
            value={formData.recomendacoes}
            onChange={(e) => setFormData({ ...formData, recomendacoes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Recomendações para o cliente..."
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.retorno_necessario}
              onChange={(e) => setFormData({ ...formData, retorno_necessario: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm font-medium">Retorno Necessário</span>
          </label>

          {formData.retorno_necessario && (
            <Input
              label="Data do Retorno"
              type="date"
              value={formData.data_retorno}
              onChange={(e) => setFormData({ ...formData, data_retorno: e.target.value })}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor Total"
            type="number"
            min="0"
            step="0.01"
            value={formData.valor_total}
            onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Forma de Pagamento</label>
            <select
              value={formData.forma_pagamento}
              onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Salvando...' : prontuario ? 'Atualizar' : 'Salvar Prontuário'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
