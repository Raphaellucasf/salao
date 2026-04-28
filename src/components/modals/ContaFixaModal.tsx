'use client';

import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  vencimento_dia: number | null;
  categoria: string;
  observacao: string | null;
  ativo: boolean;
}

interface ContaFixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta?: ContaFixa | null;
  loading: boolean;
  onSalvar: (dados: Omit<ContaFixa, 'id' | 'ativo'>) => void;
}

const CATEGORIAS = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia' },
  { value: 'agua', label: 'Água' },
  { value: 'internet', label: 'Internet / Telefone' },
  { value: 'folha', label: 'Folha de Pagamento' },
  { value: 'contador', label: 'Contador / Contabilidade' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'software', label: 'Software / Assinaturas' },
  { value: 'outros', label: 'Outros' },
];

export default function ContaFixaModal({
  isOpen,
  onClose,
  conta,
  loading,
  onSalvar,
}: ContaFixaModalProps) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [vencimentoDia, setVencimentoDia] = useState('');
  const [categoria, setCategoria] = useState('outros');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (conta) {
      setNome(conta.nome);
      setValor(String(conta.valor));
      setVencimentoDia(conta.vencimento_dia != null ? String(conta.vencimento_dia) : '');
      setCategoria(conta.categoria ?? 'outros');
      setObservacao(conta.observacao ?? '');
    } else {
      setNome('');
      setValor('');
      setVencimentoDia('');
      setCategoria('outros');
      setObservacao('');
    }
  }, [conta, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num) || num < 0 || !nome.trim()) return;
    onSalvar({
      nome: nome.trim(),
      valor: num,
      vencimento_dia: vencimentoDia !== '' ? parseInt(vencimentoDia) : null,
      categoria,
      observacao: observacao.trim() || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={conta ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
          <Receipt className="w-5 h-5 text-neutral-500 shrink-0" />
          <p className="text-sm text-neutral-600">
            Cadastre contas recorrentes. Você poderá registrar o pagamento direto pelo financeiro.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Nome da conta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Aluguel do salão"
            required
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Valor estimado (R$) <span className="text-red-500">*</span>
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
              Dia de vencimento
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={vencimentoDia}
              onChange={(e) => setVencimentoDia(e.target.value)}
              placeholder="Ex: 10"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Categoria
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Observação (opcional)
          </label>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: vence todo mês 5"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !nome || !valor}>
            {loading ? 'Salvando...' : conta ? 'Salvar Alterações' : 'Cadastrar Conta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
