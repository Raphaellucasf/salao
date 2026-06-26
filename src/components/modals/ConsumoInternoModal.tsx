// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { FlaskConical, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConsumoInternoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade_medida: string;
  quantidade_minima: number;
}

export default function ConsumoInternoModal({ isOpen, onClose }: ConsumoInternoModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [loading, setLoading] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');

  // Carrega produtos de uso_interno ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarProdutos();
      resetForm();
    }
  }, [isOpen]);

  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, quantidade, unidade_medida, quantidade_minima')
        .eq('tipo', 'uso_interno')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoadingProdutos(false);
    }
  };

  const resetForm = () => {
    setProdutoSelecionado(null);
    setQuantidade(1);
    setMotivo('');
    setErro('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const quantidadeApos = produtoSelecionado
    ? (produtoSelecionado.quantidade || 0) - quantidade
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validacoes
    if (!produtoSelecionado) {
      setErro('Selecione um produto.');
      return;
    }
    if (!quantidade || quantidade <= 0) {
      setErro('A quantidade deve ser maior que zero.');
      return;
    }
    if (quantidade > (produtoSelecionado.quantidade || 0)) {
      setErro(
        `Quantidade insuficiente. Estoque disponivel: ${produtoSelecionado.quantidade} ${produtoSelecionado.unidade_medida}.`
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Inserir movimentacao de estoque com quantidade negativa (saida)
      const { error: movError } = await supabase
        .from('estoque_movimentacoes')
        .insert({
          produto_id: produtoSelecionado.id,
          tipo: 'uso_interno',
          quantidade: -quantidade,
          motivo: motivo.trim() || null,
          data_movimentacao: new Date().toISOString(),
        });

      if (movError) throw movError;

      // 2. Atualizar quantidade do produto subtraindo o consumo
      const { error: prodError } = await supabase
        .from('produtos')
        .update({
          quantidade: (produtoSelecionado.quantidade || 0) - quantidade,
        })
        .eq('id', produtoSelecionado.id);

      if (prodError) throw prodError;

      toast.success(
        `Consumo registrado! ${quantidade} ${produtoSelecionado.unidade_medida} de "${produtoSelecionado.nome}" baixado do estoque.`
      );
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Erro ao registrar consumo interno';
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Consumo Interno"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabecalho informativo */}
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <FlaskConical className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-800">
            Registre a baixa de insumos utilizados internamente no salao. O estoque sera atualizado automaticamente.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Selecao de Produto */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Produto (Uso Interno)
          </label>

          {loadingProdutos ? (
            <div className="flex items-center justify-center py-8 text-neutral-500 text-sm">
              <svg className="animate-spin w-5 h-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-500 text-sm border-2 border-dashed border-neutral-200 rounded-lg">
              <Package className="w-8 h-8 mb-2 text-neutral-300" />
              <span>Nenhum produto de uso interno cadastrado.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {produtos.map((produto) => {
                const isSelected = produtoSelecionado?.id === produto.id;
                const semEstoque = (produto.quantidade || 0) <= 0;
                return (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => {
                      if (!semEstoque) {
                        setProdutoSelecionado(produto);
                        setQuantidade(1);
                        setErro('');
                      }
                    }}
                    disabled={semEstoque}
                    className={`
                      flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left
                      transition-all duration-150
                      ${isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : semEstoque
                          ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                          : 'border-neutral-200 hover:border-orange-300 hover:bg-orange-50/40 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className={`w-5 h-5 shrink-0 ${isSelected ? 'text-orange-500' : 'text-neutral-400'}`} />
                      <div>
                        <p className={`font-medium text-sm ${isSelected ? 'text-orange-900' : 'text-neutral-900'}`}>
                          {produto.nome}
                        </p>
                        {semEstoque && (
                          <p className="text-xs text-red-500">Sem estoque disponivel</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`text-lg font-bold ${
                        semEstoque ? 'text-red-500' :
                        (produto.quantidade || 0) <= produto.quantidade_minima ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {produto.quantidade || 0}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">{produto.unidade_medida}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quantidade e Motivo - so aparecem apos selecionar produto */}
        {produtoSelecionado && (
          <>
            {/* Estoque atual */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-neutral-700">
                Estoque atual de <strong>{produtoSelecionado.nome}</strong>:
              </span>
              <span className="text-xl font-bold text-blue-600">
                {produtoSelecionado.quantidade} {produtoSelecionado.unidade_medida}
              </span>
            </div>

            {/* Quantidade */}
            <Input
              label={`Quantidade a consumir (${produtoSelecionado.unidade_medida})`}
              type="number"
              min="1"
              max={produtoSelecionado.quantidade}
              value={quantidade || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantidade(val);
                setErro('');
              }}
              placeholder="1"
              required
            />

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Motivo / Observacao
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-neutral-900 placeholder:text-neutral-400 text-sm transition-colors"
                placeholder="Descreva o motivo do consumo interno (ex: procedimento, teste, etc)..."
              />
            </div>

            {/* Preview do resultado */}
            <div className={`
              border-2 rounded-xl p-4
              ${quantidadeApos >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            `}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Estoque apos consumo:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-neutral-600">{produtoSelecionado.quantidade}</span>
                  <span className="text-orange-600 font-semibold">- {quantidade}</span>
                  <span className="text-neutral-400">=</span>
                  <span className={`text-2xl font-bold ${quantidadeApos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quantidadeApos} {produtoSelecionado.unidade_medida}
                  </span>
                </div>
              </div>

              {quantidadeApos < 0 && (
                <div className="mt-2 text-sm text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Quantidade maior que o estoque disponivel!
                </div>
              )}

              {quantidadeApos >= 0 && quantidadeApos <= (produtoSelecionado.quantidade_minima || 0) && (
                <div className="mt-2 text-sm text-yellow-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Estoque ficara abaixo do minimo ({produtoSelecionado.quantidade_minima} {produtoSelecionado.unidade_medida})
                </div>
              )}

              {quantidadeApos > (produtoSelecionado.quantidade_minima || 0) && (
                <div className="mt-2 text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Estoque suficiente apos o consumo.
                </div>
              )}
            </div>
          </>
        )}

        {/* Acoes */}
        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !produtoSelecionado || quantidade <= 0}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 !text-white border-0 focus:ring-orange-500"
          >
            {loading ? 'Registrando...' : 'Confirmar Consumo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
