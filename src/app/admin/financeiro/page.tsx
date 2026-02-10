'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Download, Filter, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import TransacaoModal from '@/components/modals/TransacaoModal';
import { supabase } from '@/lib/supabase';

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes'>('mes');
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'receita' | 'despesa'>('receita');

  const loadTransacoes = async () => {
    setLoading(true);
    try {
      let query = supabase.from('transacoes').select('*');

      const hoje = new Date();
      let dataInicio: Date;

      if (periodo === 'hoje') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      } else if (periodo === 'semana') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7);
      } else {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      const { data, error } = await query
        .gte('data', dataInicio.toISOString().split('T')[0])
        .order('data', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransacoes();
  }, [periodo]);

  const resumo = {
    receita: transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + parseFloat(t.valor), 0),
    despesas: transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + parseFloat(t.valor), 0),
    lucro: 0,
    crescimento: 12.5,
  };
  resumo.lucro = resumo.receita - resumo.despesas;

  const metodosPagamento = [
    { metodo: 'Cartão de Crédito', valor: 18450, percentual: 43.5, cor: 'bg-blue-500' },
    { metodo: 'PIX', valor: 12890, percentual: 30.4, cor: 'bg-green-500' },
    { metodo: 'Dinheiro', valor: 7320, percentual: 17.2, cor: 'bg-accent-500' },
    { metodo: 'Cartão de Débito', valor: 3790, percentual: 8.9, cor: 'bg-purple-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <TransacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo={modalTipo}
        onSave={loadTransacoes}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Financeiro</h1>
          <p className="text-neutral-600 mt-1">Controle financeiro e fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setModalTipo('receita'); setModalOpen(true); }}
            className="flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
            title="Nova Receita"
          >
            <ArrowUpRight className="w-6 h-6" />
          </button>
          <button
            onClick={() => { setModalTipo('despesa'); setModalOpen(true); }}
            className="flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
            title="Nova Despesa"
          >
            <ArrowDownRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Período Selector */}
      <Card padding="lg">
        <div className="flex gap-2">
          <Button
            variant={periodo === 'hoje' ? 'primary' : 'secondary'}
            onClick={() => setPeriodo('hoje')}
          >
            Hoje
          </Button>
          <Button
            variant={periodo === 'semana' ? 'primary' : 'secondary'}
            onClick={() => setPeriodo('semana')}
          >
            Esta Semana
          </Button>
          <Button
            variant={periodo === 'mes' ? 'primary' : 'secondary'}
            onClick={() => setPeriodo('mes')}
          >
            Este Mês
          </Button>
        </div>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Receita</p>
              <p className="text-3xl font-bold text-neutral-900">R$ {(resumo.receita / 1000).toFixed(1)}k</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">+{resumo.crescimento}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Despesas</p>
              <p className="text-3xl font-bold text-neutral-900">R$ {(resumo.despesas / 1000).toFixed(1)}k</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">-8.2%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Lucro</p>
              <p className="text-3xl font-bold text-neutral-900">R$ {(resumo.lucro / 1000).toFixed(1)}k</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">+18.5%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Margem</p>
              <p className="text-3xl font-bold text-neutral-900">57%</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">+3.2%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Métodos de Pagamento */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <CardTitle>Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {metodosPagamento.map((metodo, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-neutral-600" />
                    <span className="font-medium text-neutral-900">{metodo.metodo}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">R$ {metodo.valor.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-neutral-600">{metodo.percentual}%</p>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className={`${metodo.cor} h-2 rounded-full transition-all`}
                    style={{ width: `${metodo.percentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transações Recentes */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <CardTitle>Transações Recentes</CardTitle>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Data/Hora</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Descrição</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Categoria</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Método</th>
                  <th className="text-right p-4 text-sm font-semibold text-neutral-900">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transacoes.map((transacao) => (
                  <tr key={transacao.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{transacao.data}</p>
                        <p className="text-xs text-neutral-600">{transacao.hora}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-900">{transacao.descricao}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="default">{transacao.categoria}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-600">{transacao.metodo}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className={`text-sm font-bold ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipo === 'receita' ? '+' : '-'} R$ {transacao.valor.toLocaleString('pt-BR')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
