'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Trash2, User, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface VendaRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemSelecionado {
  id: string; // id temporario
  tipo: 'servico' | 'produto';
  item_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export default function VendaRapidaModal({ isOpen, onClose }: VendaRapidaModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Cliente (opcional)
  const [clienteBusca, setClienteBusca] = useState('');
  const [clientesResult, setClientesResult] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);

  // Itens
  const [itens, setItens] = useState<ItemSelecionado[]>([]);
  const [addItemTipo, setAddItemTipo] = useState<'servico'|'produto'>('produto');
  const [addItemId, setAddItemId] = useState('');
  const [addItemQtd, setAddItemQtd] = useState(1);
  
  // Catalogos
  const [servicos, setServicos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');

  const total = itens.reduce((sum, item) => sum + item.valor_total, 0);

  useEffect(() => {
    if (isOpen) {
      carregarCatalogos();
      resetForm();
    }
  }, [isOpen]);

  const carregarCatalogos = async () => {
    try {
      const [resServicos, resProdutos] = await Promise.all([
        supabase.from('servicos').select('id, nome, preco').eq('ativo', true).order('nome'),
        supabase.from('produtos').select('id, nome, preco').in('tipo', ['venda', 'revenda']).eq('ativo', true).order('nome')
      ]);
      setServicos(resServicos.data || []);
      setProdutos(resProdutos.data || []);
    } catch (err) {
      console.error('Erro ao carregar catalogos:', err);
    }
  };

  const buscarClientes = async (termo: string) => {
    setClienteBusca(termo);
    if (termo.length < 2) {
      setClientesResult([]);
      return;
    }
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, telefone')
      .ilike('nome', `%${termo}%`)
      .limit(5);
    setClientesResult(data || []);
  };

  const resetForm = () => {
    setClienteBusca('');
    setClientesResult([]);
    setClienteSelecionado(null);
    setItens([]);
    setAddItemTipo('produto');
    setAddItemId('');
    setAddItemQtd(1);
    setMetodoPagamento('dinheiro');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const adicionarItemLista = () => {
    if (!addItemId || addItemQtd <= 0) return;

    let itemInfo: any = null;
    if (addItemTipo === 'servico') {
      itemInfo = servicos.find(s => s.id === addItemId);
    } else {
      itemInfo = produtos.find(p => p.id === addItemId);
    }

    if (!itemInfo) return;

    const preco = Number(itemInfo.preco || 0);

    const novoItem: ItemSelecionado = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: addItemTipo,
      item_id: itemInfo.id,
      descricao: itemInfo.nome,
      quantidade: addItemQtd,
      valor_unitario: preco,
      valor_total: preco * addItemQtd
    };

    setItens([...itens, novoItem]);
    setAddItemId('');
    setAddItemQtd(1);
  };

  const removerItem = (id: string) => {
    setItens(itens.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item para realizar a venda.');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar comanda fechada
      const { data: comandaNova, error: comandaErr } = await supabase
        .from('comandas')
        .insert({
          cliente_id: clienteSelecionado?.id || null,
          cliente_nome: clienteSelecionado?.nome || 'Cliente Balcão',
          status: 'fechada',
          subtotal: total,
          desconto: 0,
          total: total,
          data_fechamento: new Date().toISOString()
        })
        .select()
        .single();
      
      if (comandaErr) throw comandaErr;

      // 2. Inserir itens
      const comandaItensData = itens.map(item => ({
        comanda_id: comandaNova.id,
        tipo: item.tipo,
        item_id: item.item_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total
      }));

      const { error: itensErr } = await supabase.from('comanda_itens').insert(comandaItensData);
      if (itensErr) throw itensErr;

      // 3. Registrar transação
      const { data: fechamento } = await supabase
        .from('fechamentos_caixa')
        .select('id')
        .eq('status', 'aberto')
        .single();

      if (fechamento) {
         await supabase.from('transacoes').insert({
          tipo: 'receita',
          valor: total,
          descricao: `Venda Rápida #${comandaNova.numero_comanda || comandaNova.id}`,
          metodo_pagamento: metodoPagamento,
          data_transacao: new Date().toISOString(),
          fechamento_id: fechamento.id,
          comanda_id: comandaNova.id
        });
      }

      // 4. Movimentar estoque para produtos (em try/catch isolado — não bloqueia a venda)
      try {
        const produtosParaEstoque = itens.filter(i => i.tipo === 'produto');
        for (const prod of produtosParaEstoque) {
          const { data: currentProd } = await supabase.from('produtos').select('quantidade').eq('id', prod.item_id).single();
          if (currentProd) {
            const qtdAnterior = currentProd.quantidade || 0;
            await supabase.from('estoque_movimentacoes').insert({
              produto_id: prod.item_id,
              tipo: 'venda',
              quantidade: prod.quantidade,
              quantidade_anterior: qtdAnterior,
              quantidade_atual: qtdAnterior - prod.quantidade,
              valor_unitario: prod.valor_unitario,
              valor_total: prod.valor_total,
              motivo: `Venda Rápida #${comandaNova.numero_comanda || comandaNova.id}`
            });
            // Update product qty
            await supabase.from('produtos').update({ quantidade: qtdAnterior - prod.quantidade }).eq('id', prod.item_id);
          }
        }
      } catch (estoqueErr) {
        console.warn('[VendaRapida] Estoque não movimentado (tabela pode não existir):', estoqueErr);
      }

      toast.success('Venda rápida realizada com sucesso!');
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao realizar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Venda Rápida (Balcão)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Cliente Opcional */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Cliente (Opcional)
          </label>
          {!clienteSelecionado ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nome..."
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                value={clienteBusca}
                onChange={(e) => buscarClientes(e.target.value)}
              />
              {clientesResult.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  {clientesResult.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm"
                      onClick={() => {
                        setClienteSelecionado(c);
                        setClientesResult([]);
                        setClienteBusca('');
                      }}
                    >
                      <span className="font-medium">{c.nome}</span>
                      {c.telefone && <span className="text-neutral-500 ml-2">{c.telefone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-teal-800">
                <User className="w-5 h-5" />
                <span className="font-medium">{clienteSelecionado.nome}</span>
              </div>
              <button type="button" onClick={() => setClienteSelecionado(null)} className="text-sm text-teal-600 hover:underline">
                Alterar
              </button>
            </div>
          )}
        </div>

        {/* Adicionar Itens */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-4">
          <h4 className="font-semibold text-neutral-800 text-sm">Adicionar Item</h4>
          <div className="flex gap-2">
            <select
              value={addItemTipo}
              onChange={(e) => { setAddItemTipo(e.target.value as 'produto'|'servico'); setAddItemId(''); }}
              className="w-1/4 border border-neutral-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="produto">Produto</option>
              <option value="servico">Serviço</option>
            </select>
            <select
              value={addItemId}
              onChange={(e) => setAddItemId(e.target.value)}
              className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selecione...</option>
              {addItemTipo === 'produto' && produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome} - R$ {Number(p.preco || 0).toFixed(2)}</option>
              ))}
              {addItemTipo === 'servico' && servicos.map(s => (
                <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco || 0).toFixed(2)}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={addItemQtd}
              onChange={(e) => setAddItemQtd(parseInt(e.target.value) || 1)}
              className="w-20 border border-neutral-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={adicionarItemLista}
              disabled={!addItemId}
              className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Itens */}
        <div>
          <h4 className="font-semibold text-neutral-800 text-sm mb-2">Itens da Venda ({itens.length})</h4>
          {itens.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-sm border-2 border-dashed border-neutral-200 rounded-lg">
              Nenhum item adicionado
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {itens.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-neutral-200 rounded-lg bg-white">
                  <div>
                    <p className="font-medium text-sm text-neutral-900">{item.quantidade}x {item.descricao}</p>
                    <p className="text-xs text-neutral-500 capitalize">{item.tipo}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900">R$ {item.valor_total.toFixed(2)}</span>
                    <button type="button" onClick={() => removerItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total e Pagamento */}
        <div className="flex items-end justify-between bg-neutral-100 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Forma de Pagamento</label>
            <select
              value={metodoPagamento}
              onChange={(e) => setMetodoPagamento(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-teal-500"
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
            </select>
          </div>
          <div className="text-right">
            <span className="text-sm text-neutral-500">Total a Pagar</span>
            <p className="text-2xl font-bold text-teal-700">R$ {total.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || itens.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white border-0"
          >
            {loading ? 'Processando...' : 'Confirmar Venda'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
