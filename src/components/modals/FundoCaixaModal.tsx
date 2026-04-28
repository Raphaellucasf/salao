'use client';

import { useState } from 'react';
import { PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface FundoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  saldoAtual: number;
  loading: boolean;
  onConfirmar: (tipo: 'deposito' | 'retirada', valor: number, descricao: string) => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FundoCaixaModal({
  isOpen,
  onClose,
  saldoAtual,
  loading,
  onConfirmar,
}: FundoCaixaModalProps) {
  const [tipo, setTipo] = useState<'deposito' | 'retirada'>('deposito');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num) || num <= 0 || !descricao.trim()) return;
    onConfirmar(tipo, num, descricao.trim());
  };

  const novoSaldo =
    valor !== ''
      ? tipo === 'deposito'
        ? saldoAtual + parseFloat(valor.replace(',', '.') || '0')
        : saldoAtual - parseFloat(valor.replace(',', '.') || '0')
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Movimentar Fundo de Caixa"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Saldo atual */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <PiggyBank className="w-6 h-6 text-neutral-500 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500 font-medium">Saldo atual do fundo</p>
            <p className="text-xl font-bold text-neutral-900">{fmt(saldoAtual)}</p>
          </div>
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipo('deposito')}
            className={`flex items-center gap-2 justify-center py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
              tipo === 'deposito'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Depositar
          </button>
          <button
            type="button"
            onClick={() => setTipo('retirada')}
            className={`flex items-center gap-2 justify-center py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
              tipo === 'retirada'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Retirar
          </button>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Valor (R$)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            required
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Motivo / Descrição
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === 'deposito' ? 'Ex: reforço de caixa' : 'Ex: compra de material'}
            required
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Preview novo saldo */}
        {novoSaldo !== null && !isNaN(novoSaldo) && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border ${
              novoSaldo < 0
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            {novoSaldo < 0
              ? `⚠️ Saldo insuficiente. Novo saldo seria ${fmt(novoSaldo)}.`
              : `Novo saldo após operação: ${fmt(novoSaldo)}`}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !valor || !descricao || (novoSaldo !== null && novoSaldo < 0)}
          >
            {loading ? 'Processando...' : tipo === 'deposito' ? 'Depositar' : 'Retirar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
