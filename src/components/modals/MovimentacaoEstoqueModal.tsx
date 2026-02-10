'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: any;
  onSave: () => void;
}

const TIPOS_MOVIMENTACAO = [
  { value: 'entrada', label: 'Entrada', icon: TrendingUp, color: 'text-green-600', desc: 'Compra ou recebimento' },
  { value: 'saida', label: 'Saída', icon: TrendingDown, color: 'text-red-600', desc: 'Venda ou uso' },
  { value: 'ajuste', label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600', desc: 'Correção de estoque' },
  { value: 'uso_interno', label: 'Uso Interno', icon: TrendingDown, color: 'text-orange-600', desc: 'Uso no salão' },
  { value: 'perda', label: 'Perda', icon: TrendingDown, color: 'text-gray-600', desc: 'Vencimento, quebra, etc' },
  { value: 'devolucao', label: 'Devolução', icon: TrendingUp, color: 'text-purple-600', desc: 'Devolução de fornecedor' },
];

export default function MovimentacaoModal({ isOpen, onClose, produto, onSave }: MovimentacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tipo: 'entrada',
    quantidade: 1,
    valor_unitario: produto?.preco_custo || 0,
    motivo: '',
    documento: '',
  });

  const tipoSelecionado = TIPOS_MOVIMENTACAO.find(t => t.value === formData.tipo);
  const isEntrada = ['entrada', 'devolucao', 'ajuste_positivo'].includes(formData.tipo);
  const quantidadeAtual = produto?.quantidade || 0;
  const quantidadeApos = isEntrada 
    ? quantidadeAtual + formData.quantidade 
    : quantidadeAtual - formData.quantidade;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      if (!isEntrada && formData.quantidade > quantidadeAtual && produto.controla_estoque) {
        throw new Error('Quantidade maior que o estoque disponível');
      }

      // Chamar função do banco para registrar movimentação
      const { error: funcError } = await supabase.rpc('registrar_movimentacao_estoque', {
        p_produto_id: produto.id,
        p_tipo: formData.tipo,
        p_quantidade: formData.quantidade,
        p_valor_unitario: formData.valor_unitario,
        p_motivo: formData.motivo.trim() || null,
        p_documento: formData.documento.trim() || null,
        p_usuario_id: null, // TODO: pegar do contexto de auth
      });

      if (funcError) throw funcError;

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'entrada',
      quantidade: 1,
      valor_unitario: produto?.preco_custo || 0,
      motivo: '',
      documento: '',
    });
    setError('');
  };

  if (!produto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimentar Estoque - ${produto.nome}`}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Estoque Atual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">Estoque Atual:</span>
            <span className="text-2xl font-bold text-blue-600">
              {quantidadeAtual} {produto.unidade_medida}
            </span>
          </div>
        </div>

        {/* Tipo de Movimentação */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Tipo de Movimentação
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_MOVIMENTACAO.map((tipo) => {
              const Icon = tipo.icon;
              const isSelected = formData.tipo === tipo.value;
              
              return (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: tipo.value })}
                  className={`
                    relative p-3 border-2 rounded-lg text-left transition-all
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : tipo.color}`} />
                    <div className="flex-1">
                      <div className={`font-semibold ${isSelected ? 'text-primary-900' : 'text-neutral-900'}`}>
                        {tipo.label}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {tipo.desc}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantidade */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Quantidade (${produto.unidade_medida})`}
            type="number"
            min="1"
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
            required
          />

          <Input
            label="Valor Unitário"
            type="number"
            step="0.01"
            value={formData.valor_unitario}
            onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Documentação */}
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Documento (NF, Pedido, etc)"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            placeholder="Ex: NF-123456"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Motivo/Observação
            </label>
            <textarea
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Descreva o motivo da movimentação..."
            />
          </div>
        </div>

        {/* Preview do resultado */}
        <div className={`
          border-2 rounded-lg p-4
          ${quantidadeApos >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
        `}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Estoque após operação:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-neutral-600">{quantidadeAtual}</span>
              <span className={tipoSelecionado?.color}>{isEntrada ? '+' : '-'}{formData.quantidade}</span>
              <span className="text-neutral-400">=</span>
              <span className={`text-2xl font-bold ${quantidadeApos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quantidadeApos} {produto.unidade_medida}
              </span>
            </div>
          </div>
          
          {quantidadeApos < 0 && (
            <div className="mt-2 text-sm text-red-700">
              ⚠️ Atenção: Esta operação resultará em estoque negativo!
            </div>
          )}

          {quantidadeApos <= produto.quantidade_minima && quantidadeApos >= 0 && (
            <div className="mt-2 text-sm text-yellow-700">
              ⚠️ Estoque ficará abaixo do mínimo ({produto.quantidade_minima} {produto.unidade_medida})
            </div>
          )}
        </div>

        {/* Valor Total */}
        {formData.valor_unitario > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Valor Total:</span>
              <span className="text-lg font-bold text-neutral-900">
                R$ {(formData.valor_unitario * formData.quantidade).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Confirmar Movimentação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
