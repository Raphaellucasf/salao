'use client';

import { useState } from 'react';
import { Unlock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface AberturaCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  aberturaExistente?: number | null;
  loading: boolean;
  onConfirmar: (valor: number, observacao: string) => void;
}

function fmtData(iso: string) {
  return iso.split('-').reverse().join('/');
}

export default function AberturaCaixaModal({
  isOpen,
  onClose,
  data,
  aberturaExistente,
  loading,
  onConfirmar,
}: AberturaCaixaModalProps) {
  const [valor, setValor] = useState(
    aberturaExistente != null ? String(aberturaExistente) : '',
  );
  const [observacao, setObservacao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    onConfirmar(num, observacao);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Abrir Caixa"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Unlock className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Abertura do caixa em {fmtData(data)}</p>
            <p className="text-sm text-blue-700 mt-1">
              Informe o valor em dinheiro disponível no caixa no início do dia.
            </p>
          </div>
        </div>

        {aberturaExistente != null && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            ⚠️ Já existe uma abertura registrada para este dia (
            {aberturaExistente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).
            Salvar irá substituir o valor atual.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Valor em dinheiro (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            required
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Observação (opcional)
          </label>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: troco incluído"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading || valor === ''}>
            {loading ? 'Salvando...' : 'Confirmar Abertura'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
