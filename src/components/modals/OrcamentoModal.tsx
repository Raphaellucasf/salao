// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string;
  orcamento?: any;
  onSave: () => void;
}

export default function OrcamentoModal({ isOpen, onClose, clienteId, orcamento, onSave }: OrcamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    cliente_id: clienteId || '',
    validade_ate: '',
    desconto: 0,
    acrescimo: 0,
    observacoes: '',
    termos_condicoes: '',
  });

  const [itens, setItens] = useState<any[]>([{
    tipo: 'servico',
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
    desconto: 0,
  }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const subtotal = itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario - item.desconto), 0);
      const total = subtotal - formData.desconto + formData.acrescimo;

      const dataToSave = {
        ...formData,
        subtotal,
        total,
        status: 'pendente',
      };

      if (orcamento) {
        const { error: updateError } = await supabase
          .from('orcamentos')
          .update(dataToSave)
          .eq('id', orcamento.id);

        if (updateError) throw updateError;
      } else {
        const { data: orcamentoData, error: insertError } = await supabase
          .from('orcamentos')
          .insert([dataToSave])
          .select()
          .single();

        if (insertError) throw insertError;

        // Inserir itens
        const itensToInsert = itens.map(item => ({
          orcamento_id: orcamentoData.id,
          ...item,
          valor_total: item.quantidade * item.valor_unitario - item.desconto,
        }));

        const { error: itensError } = await supabase
          .from('orcamento_itens')
          .insert(itensToInsert);

        if (itensError) throw itensError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItens([...itens, {
      tipo: 'servico',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const subtotal = itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario - item.desconto), 0);
  const total = subtotal - formData.desconto + formData.acrescimo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Orçamento" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Validade até"
          type="date"
          required
          value={formData.validade_ate}
          onChange={(e) => setFormData({ ...formData, validade_ate: e.target.value })}
        />

        {/* Itens */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Itens do Orçamento</h3>
            <Button type="button" variant="primary" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-4">
            {itens.map((item, index) => (
              <div key={index} className="p-4 border-2 border-neutral-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <select
                    value={item.tipo}
                    onChange={(e) => updateItem(index, 'tipo', e.target.value)}
                    className="px-3 py-1 border border-neutral-300 rounded text-sm"
                  >
                    <option value="servico">Serviço</option>
                    <option value="produto">Produto</option>
                    <option value="pacote">Pacote</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <Input
                  label="Descrição"
                  type="text"
                  required
                  value={item.descricao}
                  onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                  placeholder="Descreva o item..."
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Quantidade"
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    label="Valor Unit."
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Desconto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.desconto}
                    onChange={(e) => updateItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="text-right font-semibold">
                  Total: R$ {(item.quantidade * item.valor_unitario - item.desconto).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totais */}
        <div className="border-t pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Desconto Geral"
              type="number"
              min="0"
              step="0.01"
              value={formData.desconto}
              onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Acréscimo"
              type="number"
              min="0"
              step="0.01"
              value={formData.acrescimo}
              onChange={(e) => setFormData({ ...formData, acrescimo: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary-600">
              <span>TOTAL:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Observações</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Salvando...' : 'Gerar Orçamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

