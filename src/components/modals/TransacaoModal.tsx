// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Transacao {
  id?: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  categoria: string;
  valor: number;
  metodo: string;
  data: string;
}

interface TransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'receita' | 'despesa';
  onSave: () => void;
}

export default function TransacaoModal({ isOpen, onClose, tipo, onSave }: TransacaoModalProps) {
  const [formData, setFormData] = useState<Transacao>({
    tipo: tipo,
    descricao: '',
    categoria: '',
    valor: 0,
    metodo: 'Dinheiro',
    data: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      tipo: tipo,
      descricao: '',
      categoria: '',
      valor: 0,
      metodo: 'Dinheiro',
      data: new Date().toISOString().split('T')[0],
    });
    setError('');
  }, [tipo, isOpen]);

  const categoriasReceita = ['Serviço', 'Produto', 'Outros'];
  const categoriasDespesa = ['Fornecedor', 'Contas', 'Salários', 'Manutenção', 'Outros'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('transacoes')
        .insert([{
          tipo: formData.tipo,
          descricao: formData.descricao,
          categoria: formData.categoria,
          valor: formData.valor,
          metodo: formData.metodo,
          data: formData.data,
        }]);

      if (insertError) throw insertError;

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tipo === 'receita' ? 'Nova Receita' : 'Nova Despesa'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Descrição"
          type="text"
          required
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder={tipo === 'receita' ? 'Ex: Venda de produto' : 'Ex: Conta de luz'}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Categoria</label>
            <select
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {(tipo === 'receita' ? categoriasReceita : categoriasDespesa).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Input
            label="Valor (R$)"
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Método de Pagamento</label>
            <select
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.metodo}
              onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
            >
              <option value="Dinheiro">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Boleto">Boleto</option>
              <option value="Débito Automático">Débito Automático</option>
            </select>
          </div>

          <Input
            label="Data"
            type="date"
            required
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="flex-1">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

