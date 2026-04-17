'use client';

import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface FechamentoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modo: 'fechar' | 'reabrir';
  data: string;
  totalLiquido: number;
  totalComissoes: number;
  totalComandas: number;
  loading: boolean;
  onConfirmar: () => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(iso: string) {
  return iso.split('-').reverse().join('/');
}

export default function FechamentoCaixaModal({
  isOpen,
  onClose,
  modo,
  data,
  totalLiquido,
  totalComissoes,
  totalComandas,
  loading,
  onConfirmar,
}: FechamentoCaixaModalProps) {
  const isFechar = modo === 'fechar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isFechar ? 'Confirmar Fechamento de Caixa' : 'Reabrir Caixa'}
      size="sm"
    >
      <div className="space-y-6">
        {/* Ícone + alerta */}
        <div className={`flex items-start gap-4 p-4 rounded-xl ${isFechar ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isFechar ? 'bg-amber-100' : 'bg-red-100'}`}>
            {isFechar
              ? <Lock className="w-5 h-5 text-amber-700" />
              : <AlertTriangle className="w-5 h-5 text-red-700" />
            }
          </div>
          <div>
            <p className={`font-semibold ${isFechar ? 'text-amber-900' : 'text-red-900'}`}>
              {isFechar
                ? `Fechar caixa de ${fmtData(data)}?`
                : `Reabrir caixa de ${fmtData(data)}?`
              }
            </p>
            <p className={`text-sm mt-1 ${isFechar ? 'text-amber-700' : 'text-red-700'}`}>
              {isFechar
                ? 'Após fechar, as comandas deste dia não poderão ser editadas.'
                : 'Remoção do fechamento permite edição das comandas do período.'
              }
            </p>
          </div>
        </div>

        {/* Resumo — só no fechamento */}
        {isFechar && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Comandas fechadas</span>
              <span className="font-semibold text-neutral-900">{totalComandas}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Total líquido</span>
              <span className="font-semibold text-green-700">{fmt(totalLiquido)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600">Total comissões</span>
              <span className="font-semibold text-neutral-900">{fmt(totalComissoes)}</span>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          {isFechar ? (
            <Button variant="primary" onClick={onConfirmar} disabled={loading}>
              {loading
                ? 'Processando...'
                : <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Fechar Caixa</span>
              }
            </Button>
          ) : (
            <button
              type="button"
              onClick={onConfirmar}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processando...' : <><Unlock className="w-4 h-4" /> Reabrir Caixa</>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
