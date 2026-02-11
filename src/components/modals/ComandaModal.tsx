// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, ShoppingBag, Scissors, Package as PackageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ComandaItem {
  id?: string;
  tipo: 'servico' | 'produto' | 'pacote';
  item_id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface ComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId?: string;
  onSave: () => void;
}

export default function ComandaModal({ isOpen, onClose, comandaId, onSave }: ComandaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nome: '',
    observacoes: '',
  });

  const [itens, setItens] = useState<ComandaItem[]>([]);
  const [novoItem, setNovoItem] = useState<ComandaItem>({
    tipo: 'servico',
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (comandaId) {
        loadComanda();
      } else {
        resetForm();
      }
    }
  }, [isOpen, comandaId]);

  const loadData = async () => {
    try {
      const [clientesData, produtosData, servicosData, pacotesData] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('produtos').select('*').eq('categoria', 'revenda').order('nome'),
        supabase.from('servicos').select('*').order('nome'),
        supabase.from('pacotes').select('*').eq('ativo', true).order('nome'),
      ]);

      if (clientesData.data) setClientes(clientesData.data);
      if (produtosData.data) setProdutos(produtosData.data);
      if (servicosData.data) setServicos(servicosData.data);
      if (pacotesData.data) setPacotes(pacotesData.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const loadComanda = async () => {
    if (!comandaId) return;

    try {
      const { data: comanda, error } = await supabase
        .from('comandas')
        .select('*, comanda_itens(*)')
        .eq('id', comandaId)
        .single();

      if (error) throw error;

      setFormData({
        cliente_id: comanda.cliente_id || '',
        cliente_nome: comanda.cliente_nome || '',
        observacoes: comanda.observacoes || '',
      });

      setItens(comanda.comanda_itens || []);
    } catch (err) {
      console.error('Erro ao carregar comanda:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      cliente_nome: '',
      observacoes: '',
    });
    setItens([]);
    setNovoItem({
      tipo: 'servico',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    });
    setError('');
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    let item: any;
    let tipo = novoItem.tipo;

    if (tipo === 'produto') {
      item = produtos.find(p => p.id === value);
      if (item) {
        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: item.nome,
          valor_unitario: item.preco_venda || 0,
          valor_total: (item.preco_venda || 0) * novoItem.quantidade,
        });
      }
    } else if (tipo === 'servico') {
      item = servicos.find(s => s.id === value);
      if (item) {
        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: item.nome,
          valor_unitario: item.preco || 0,
          valor_total: (item.preco || 0) * novoItem.quantidade,
        });
      }
    } else if (tipo === 'pacote') {
      item = pacotes.find(p => p.id === value);
      if (item) {
        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: item.nome,
          valor_unitario: item.preco || 0,
          valor_total: (item.preco || 0) * novoItem.quantidade,
        });
      }
    }
  };

  const handleQuantidadeChange = (quantidade: number) => {
    setNovoItem({
      ...novoItem,
      quantidade,
      valor_total: novoItem.valor_unitario * quantidade,
    });
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.valor_unitario <= 0) {
      setError('Selecione um item válido');
      return;
    }

    setItens([...itens, { ...novoItem, id: crypto.randomUUID() }]);
    setNovoItem({
      tipo: 'servico',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    });
    setError('');
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.valor_total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (itens.length === 0) {
      setError('Adicione pelo menos um item à comanda');
      setLoading(false);
      return;
    }

    try {
      const cliente = clientes.find(c => c.id === formData.cliente_id);
      const total = calcularTotal();

      if (comandaId) {
        // Atualizar comanda existente
        const { error: updateError } = await supabase
          .from('comandas')
          .update({
            cliente_id: formData.cliente_id || null,
            cliente_nome: cliente?.nome || formData.cliente_nome,
            total,
            observacoes: formData.observacoes,
          })
          .eq('id', comandaId);

        if (updateError) throw updateError;

        // Deletar itens antigos
        await supabase.from('comanda_itens').delete().eq('comanda_id', comandaId);

        // Inserir novos itens
        const { error: itensError } = await supabase
          .from('comanda_itens')
          .insert(itens.map(item => ({
            comanda_id: comandaId,
            ...item,
          })));

        if (itensError) throw itensError;
      } else {
        // Criar nova comanda
        const { data: novaComanda, error: insertError } = await supabase
          .from('comandas')
          .insert([{
            numero_comanda: 0, // Será atualizado por trigger
            cliente_id: formData.cliente_id || null,
            cliente_nome: cliente?.nome || formData.cliente_nome,
            status: 'aberta',
            total,
            observacoes: formData.observacoes,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Inserir itens
        const { error: itensError } = await supabase
          .from('comanda_itens')
          .insert(itens.map(item => ({
            comanda_id: novaComanda.id,
            ...item,
          })));

        if (itensError) throw itensError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar comanda');
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'produto': return <ShoppingBag className="w-4 h-4" />;
      case 'servico': return <Scissors className="w-4 h-4" />;
      case 'pacote': return <PackageIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={comandaId ? 'Editar Comanda' : 'Nova Comanda'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cliente (opcional)
            </label>
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Ou digite o nome"
            type="text"
            value={formData.cliente_nome}
            onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
            placeholder="Nome do cliente"
          />
        </div>

        {/* Adicionar Item */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-neutral-900 mb-4">Adicionar Item</h3>
          
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo</label>
              <select
                value={novoItem.tipo}
                onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as any, descricao: '', item_id: '', valor_unitario: 0 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="servico">Serviço</option>
                <option value="produto">Produto</option>
                <option value="pacote">Pacote</option>
              </select>
            </div>

            <div className="col-span-5">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Item</label>
              <select
                onChange={handleItemSelect}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {novoItem.tipo === 'produto' && produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco_venda}</option>
                ))}
                {novoItem.tipo === 'servico' && servicos.map(s => (
                  <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                ))}
                {novoItem.tipo === 'pacote' && pacotes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Qtd</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={novoItem.quantidade}
                onChange={(e) => handleQuantidadeChange(parseFloat(e.target.value) || 1)}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Total</label>
              <Input
                type="text"
                value={`R$ ${novoItem.valor_total.toFixed(2)}`}
                disabled
              />
            </div>

            <div className="col-span-1 flex items-end">
              <Button type="button" onClick={adicionarItem} variant="primary" size="sm" className="w-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Itens */}
        {itens.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Itens da Comanda</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {itens.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant={item.tipo === 'servico' ? 'default' : item.tipo === 'produto' ? 'success' : 'warning'}>
                      <div className="flex items-center gap-1">
                        {getItemIcon(item.tipo)}
                        <span className="text-xs">{item.tipo}</span>
                      </div>
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.descricao}</p>
                      <p className="text-xs text-neutral-600">
                        {item.quantidade}x R$ {item.valor_unitario.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900">
                      R$ {item.valor_total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        {itens.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-neutral-900">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                R$ {calcularTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Observações adicionais..."
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading || itens.length === 0}
          >
            {loading ? 'Salvando...' : comandaId ? 'Atualizar' : 'Abrir Comanda'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

