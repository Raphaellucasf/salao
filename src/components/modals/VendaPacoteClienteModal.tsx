'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Package, User, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { registrarCompraPacote, verificarPacoteAtivo } from '@/services/pacotes';
import type { PacoteAtivo } from '@/services/pacotes';
import { DEFAULT_UNIT_ID } from '@/services/caixa';

interface VendaPacoteClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendaPacoteClienteModal({ isOpen, onClose }: VendaPacoteClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Cliente
  const [clienteBusca, setClienteBusca] = useState('');
  const [clientesResult, setClientesResult] = useState<any[]>([]);
  const [cliente, setCliente] = useState<any | null>(null);
  const [pacotesAtuais, setPacotesAtuais] = useState<PacoteAtivo[]>([]);

  // Pacotes disponiveis no catalogo
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [pacoteSelecionado, setPacoteSelecionado] = useState<any | null>(null);

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState('credito');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      carregarCatalogo();
    }
  }, [isOpen]);

  const carregarCatalogo = async () => {
    try {
      const { data } = await supabase
        .from('pacotes_servicos')
        .select(`
          *,
          pacotes_servicos_itens (
            quantidade,
            servicos (nome)
          )
        `)
        .eq('ativo', true);
      setCatalogo(data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
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
      .select('id, nome, telefone, cpf')
      .ilike('nome', `%${termo}%`)
      .limit(5);
    setClientesResult(data || []);
  };

  const handleSelectCliente = async (c: any) => {
    setCliente(c);
    setClientesResult([]);
    setClienteBusca('');
    
    // Carregar saldo atual do cliente
    setLoading(true);
    try {
      const ativos = await verificarPacoteAtivo(c.id);
      setPacotesAtuais(ativos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setClienteBusca('');
    setClientesResult([]);
    setCliente(null);
    setPacotesAtuais([]);
    setPacoteSelecionado(null);
    setMetodoPagamento('credito');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const confirmarVenda = async () => {
    if (!cliente || !pacoteSelecionado) return;
    
    setLoading(true);
    try {
      // 1. Criar array do item pro service
      const itensPacote = [{ item_id: pacoteSelecionado.id, quantidade: 1 }];

      // 2. Chamar o service para registrar a compra em pacotes_cliente
      await registrarCompraPacote({
        comandaId: null, // Venda direta
        clienteId: cliente.id,
        clienteCpf: cliente.cpf || null,
        itensPacote,
        unitId: DEFAULT_UNIT_ID
      });

      // 3. Registrar transação
      const { data: fechamento } = await supabase
        .from('fechamentos_caixa')
        .select('id')
        .eq('status', 'aberto')
        .single();

      if (fechamento) {
        await supabase.from('transacoes').insert({
          tipo: 'receita',
          valor: pacoteSelecionado.preco,
          descricao: `Venda Pacote: ${pacoteSelecionado.nome} (Cliente: ${cliente.nome})`,
          metodo_pagamento: metodoPagamento,
          data_transacao: new Date().toISOString(),
          fechamento_id: fechamento.id
        });
      }

      toast.success('Pacote vendido e vinculado com sucesso!');
      handleClose();
    } catch (err: any) {
      toast.error('Erro ao realizar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Vender Pacote" size="lg">
      <div className="space-y-6">
        
        {/* Stepper simples */}
        <div className="flex gap-4 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-purple-600' : 'bg-neutral-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-medium text-lg text-neutral-800">1. Selecione o Cliente</h3>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nome..."
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={clienteBusca}
                onChange={(e) => buscarClientes(e.target.value)}
              />
              {clientesResult.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  {clientesResult.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm border-b last:border-0"
                      onClick={() => handleSelectCliente(c)}
                    >
                      <span className="font-medium">{c.nome}</span>
                      {c.cpf && <span className="text-neutral-500 ml-2 text-xs">CPF: {c.cpf}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cliente && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-purple-900 font-medium mb-3">
                  <User className="w-5 h-5" />
                  {cliente.nome}
                </div>
                
                {loading ? (
                  <p className="text-sm text-purple-600">Buscando saldo de pacotes...</p>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-purple-800 mb-2">Saldo de Pacotes Atuais:</p>
                    {pacotesAtuais.length === 0 ? (
                      <p className="text-sm text-purple-600 italic">Cliente não possui pacotes ativos com saldo.</p>
                    ) : (
                      <ul className="space-y-1">
                        {pacotesAtuais.map(p => (
                          <li key={p.id} className="text-sm text-purple-700 flex justify-between bg-white/50 px-2 py-1 rounded">
                            <span>{p.servico_nome}</span>
                            <span className="font-medium">{p.sessoes_restantes} sessões restantes</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button disabled={!cliente || loading} onClick={() => setStep(2)} className="bg-purple-600 hover:bg-purple-700 text-white">
                Próximo Passo
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-medium text-lg text-neutral-800 flex justify-between">
              <span>2. Selecione o Pacote</span>
              <button onClick={() => setStep(1)} className="text-sm text-purple-600 hover:underline">Voltar</button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
              {catalogo.length === 0 && <p className="text-sm text-neutral-500 col-span-2">Nenhum pacote ativo encontrado.</p>}
              
              {catalogo.map(pacote => (
                <button
                  key={pacote.id}
                  onClick={() => setPacoteSelecionado(pacote)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    pacoteSelecionado?.id === pacote.id 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-neutral-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-neutral-900">{pacote.nome}</h4>
                    <span className="font-semibold text-purple-700">R$ {Number(pacote.preco).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-neutral-600 space-y-1">
                    {pacote.pacotes_servicos_itens?.map((item: any, i: number) => (
                      <div key={i}>• {item.quantidade}x {item.servicos?.nome}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button disabled={!pacoteSelecionado} onClick={() => setStep(3)} className="bg-purple-600 hover:bg-purple-700 text-white">
                Próximo Passo
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-medium text-lg text-neutral-800 flex justify-between">
              <span>3. Confirmar Venda</span>
              <button onClick={() => setStep(2)} className="text-sm text-purple-600 hover:underline">Voltar</button>
            </h3>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-4">
              <div className="flex justify-between pb-4 border-b border-neutral-200">
                <div>
                  <p className="text-sm text-neutral-500">Cliente</p>
                  <p className="font-medium text-neutral-900">{cliente?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-500">Pacote</p>
                  <p className="font-medium text-neutral-900">{pacoteSelecionado?.nome}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                    className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                  </select>
                </div>
                <div className="text-right">
                  <span className="text-sm text-neutral-500">Total a Pagar</span>
                  <p className="text-3xl font-bold text-purple-700">R$ {Number(pacoteSelecionado?.preco).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={confirmarVenda}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white border-0"
              >
                {loading ? 'Processando...' : 'Confirmar Venda e Receber'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
