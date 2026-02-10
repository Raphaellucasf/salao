'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { DollarSign, Plus, Minus, TrendingUp, AlertCircle } from 'lucide-react';

interface SaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string;
  onSuccess?: () => void;
}

interface Cliente {
  id: string;
  nome: string;
}

interface SaldoAtual {
  credito: number;
  debito: number;
  pontos: number;
}

export function SaldoModal({ isOpen, onClose, clienteId, onSuccess }: SaldoModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(clienteId || '');
  const [saldoAtual, setSaldoAtual] = useState<SaldoAtual>({ credito: 0, debito: 0, pontos: 0 });
  const [tipo, setTipo] = useState<'credito' | 'debito' | 'pontos'>('credito');
  const [operacao, setOperacao] = useState<'adicionar' | 'subtrair'>('adicionar');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      if (clienteSelecionado) {
        loadSaldoAtual(clienteSelecionado);
      }
    }
  }, [isOpen, clienteSelecionado]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadSaldoAtual = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('cliente_saldos')
        .select('tipo, saldo_atual')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Pegar o último saldo de cada tipo
      const saldos = { credito: 0, debito: 0, pontos: 0 };
      
      if (data && data.length > 0) {
        const creditoSaldo = data.find((s: any) => s.tipo === 'credito');
        const debitoSaldo = data.find((s: any) => s.tipo === 'debito');
        const pontosSaldo = data.find((s: any) => s.tipo === 'pontos');

        if (creditoSaldo) saldos.credito = creditoSaldo.saldo_atual || 0;
        if (debitoSaldo) saldos.debito = creditoSaldo.saldo_atual || 0;
        if (pontosSaldo) saldos.pontos = pontosSaldo.saldo_atual || 0;
      }

      setSaldoAtual(saldos);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteSelecionado || !valor || !descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const valorNumerico = parseFloat(valor);
      const saldoAnterior = saldoAtual[tipo];
      let novoSaldo = saldoAnterior;

      if (operacao === 'adicionar') {
        novoSaldo = saldoAnterior + valorNumerico;
      } else {
        novoSaldo = saldoAnterior - valorNumerico;
      }

      const { error } = await supabase
        .from('cliente_saldos')
        .insert({
          cliente_id: clienteSelecionado,
          tipo,
          valor: operacao === 'adicionar' ? valorNumerico : -valorNumerico,
          saldo_anterior: saldoAnterior,
          saldo_atual: novoSaldo,
          descricao,
          referencia: referencia || null
        });

      if (error) throw error;

      alert('Saldo atualizado com sucesso!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      alert('Erro ao atualizar saldo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClienteSelecionado(clienteId || '');
    setTipo('credito');
    setOperacao('adicionar');
    setValor('');
    setDescricao('');
    setReferencia('');
    setSaldoAtual({ credito: 0, debito: 0, pontos: 0 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Saldo do Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seleção de Cliente */}
        {!clienteId && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Cliente *
            </label>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Saldo Atual */}
        {clienteSelecionado && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Saldo Atual</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-600">Crédito</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {saldoAtual.credito.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Débito</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {saldoAtual.debito.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Pontos</p>
                <p className="text-lg font-bold text-blue-600">
                  {saldoAtual.pontos}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tipo de Saldo */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Saldo *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipo('credito')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tipo === 'credito'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <span className="text-sm font-medium">Crédito</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo('debito')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tipo === 'debito'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
              <span className="text-sm font-medium">Débito</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo('pontos')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tipo === 'pontos'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <span className="text-sm font-medium">Pontos</span>
            </button>
          </div>
        </div>

        {/* Operação */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Operação *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOperacao('adicionar')}
              className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                operacao === 'adicionar'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <Plus className="w-5 h-5" />
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setOperacao('subtrair')}
              className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                operacao === 'subtrair'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <Minus className="w-5 h-5" />
              Subtrair
            </button>
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {tipo === 'pontos' ? 'Quantidade de Pontos' : 'Valor'} *
          </label>
          <Input
            type="number"
            step={tipo === 'pontos' ? '1' : '0.01'}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={tipo === 'pontos' ? 'Ex: 100' : 'Ex: 50.00'}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Descrição *
          </label>
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Motivo da alteração"
            required
          />
        </div>

        {/* Referência */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Referência
          </label>
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Número do pedido, nota fiscal, etc."
          />
        </div>

        {/* Preview do novo saldo */}
        {clienteSelecionado && valor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Novo saldo após a operação:
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {tipo === 'pontos' 
                ? `${operacao === 'adicionar' 
                    ? saldoAtual.pontos + parseFloat(valor || '0') 
                    : saldoAtual.pontos - parseFloat(valor || '0')} pontos`
                : `R$ ${(operacao === 'adicionar' 
                    ? saldoAtual[tipo] + parseFloat(valor || '0') 
                    : saldoAtual[tipo] - parseFloat(valor || '0')).toFixed(2)}`
              }
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Salvar Alteração'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
