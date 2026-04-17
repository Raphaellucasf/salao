'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, CreditCard, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Lock, Unlock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import FechamentoCaixaModal from '@/components/modals/FechamentoCaixaModal';
import { withAdminOnly } from '@/components/auth/withAdminOnly';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { buscarResumoDia, fecharCaixa, reabrirCaixa, type ResumoDia } from '@/services/caixa';

function FinanceiroPage() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes'>('mes');
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fechamento de Caixa ──────────────────────────────────────────
  const hoje = new Date().toISOString().split('T')[0];
  const [dataFechamento, setDataFechamento] = useState<string>(hoje);
  const [resumoDia, setResumoDia] = useState<ResumoDia | null>(null);
  const [loadingFechamento, setLoadingFechamento] = useState(false);
  const [erroFechamento, setErroFechamento] = useState<string | null>(null);
  const [modalFechamento, setModalFechamento] = useState<'fechar' | 'reabrir' | null>(null);
  const [processandoFechamento, setProcessandoFechamento] = useState(false);
  const [expandido, setExpandido] = useState(true);

  const carregarResumoDia = useCallback(async (data: string) => {
    setLoadingFechamento(true);
    setErroFechamento(null);
    try {
      const resumo = await buscarResumoDia(data);
      setResumoDia(resumo);
    } catch (e: any) {
      setErroFechamento(e?.message ?? 'Erro ao carregar resumo do dia');
    } finally {
      setLoadingFechamento(false);
    }
  }, []);

  useEffect(() => {
    carregarResumoDia(dataFechamento);
  }, [dataFechamento, carregarResumoDia]);

  const handleFecharCaixa = async () => {
    if (!user?.id || !resumoDia) return;
    setProcessandoFechamento(true);
    try {
      await fecharCaixa(dataFechamento, user.id, resumoDia);
      setModalFechamento(null);
      await carregarResumoDia(dataFechamento);
    } catch (e: any) {
      setErroFechamento(e?.message ?? 'Erro ao fechar caixa');
      setModalFechamento(null);
      // Recarrega para refletir estado real (ex: caixa já fechado por outro processo)
      await carregarResumoDia(dataFechamento);
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const handleReabrirCaixa = async () => {
    if (!user?.id || !resumoDia?.fechamento) return;
    setProcessandoFechamento(true);
    try {
      await reabrirCaixa(resumoDia.fechamento.id, user.id);
      setModalFechamento(null);
      await carregarResumoDia(dataFechamento);
    } catch (e: any) {
      setErroFechamento(e?.message ?? 'Erro ao reabrir caixa');
      setModalFechamento(null);
    } finally {
      setProcessandoFechamento(false);
    }
  };
  // ────────────────────────────────────────────────────────────────

  const loadTransacoes = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      let dataInicio: Date;

      if (periodo === 'hoje') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      } else if (periodo === 'semana') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7);
      } else {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      const dataInicioStr = dataInicio.toISOString().split('T')[0];
      const resp = await fetch(`/api/admin/transacoes?dataInicio=${dataInicioStr}`);
      if (!resp.ok) throw new Error(`Erro ${resp.status} ao carregar transações`);
      const data = await resp.json();
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

  // Recarrega transações ao voltar para esta aba/janela
  useEffect(() => {
    const onFocus = () => loadTransacoes();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [periodo]);

  // Realtime: atualiza automaticamente quando nova transação é inserida
  useEffect(() => {
    const channel = supabase
      .channel('financeiro-transacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transacoes' },
        () => { loadTransacoes(); }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transacoes' },
        () => { loadTransacoes(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [periodo]);

  const resumo = {
    receita: transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + parseFloat(t.valor || 0), 0),
    despesas: transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + parseFloat(t.valor || 0), 0),
    lucro: 0,
  };
  resumo.lucro = resumo.receita - resumo.despesas;

  // Métodos de pagamento calculados a partir das transações reais
  const METODO_LABELS: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    outros: 'Outros',
  };
  const METODO_CORES: Record<string, string> = {
    dinheiro: 'bg-accent-500',
    cartao_credito: 'bg-blue-500',
    cartao_debito: 'bg-purple-500',
    pix: 'bg-green-500',
    outros: 'bg-orange-500',
  };
  const porMetodoMap: Record<string, number> = {};
  transacoes
    .filter(t => t.tipo === 'receita')
    .forEach(t => {
      const m = t.metodo || 'dinheiro';
      porMetodoMap[m] = (porMetodoMap[m] || 0) + parseFloat(t.valor || 0);
    });
  const totalReceita = resumo.receita || 1;
  const metodosPagamento = Object.entries(porMetodoMap)
    .map(([m, valor]) => ({
      metodo: METODO_LABELS[m] || m,
      valor,
      percentual: Math.round((valor / totalReceita) * 100),
      cor: METODO_CORES[m] || 'bg-neutral-400',
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="p-6 space-y-6">
      {/* Modal de confirmação de fechamento / reabertura */}
      {modalFechamento && resumoDia && (
        <FechamentoCaixaModal
          isOpen={true}
          onClose={() => setModalFechamento(null)}
          modo={modalFechamento}
          data={dataFechamento}
          totalLiquido={resumoDia.total_liquido}
          totalComissoes={resumoDia.total_comissoes}
          totalComandas={resumoDia.comandas.length}
          loading={processandoFechamento}
          onConfirmar={modalFechamento === 'fechar' ? handleFecharCaixa : handleReabrirCaixa}
        />
      )}

      {/* ── FECHAMENTO DE CAIXA ── */}
      <Card padding="none">
        {/* Cabeçalho colapsável */}
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {resumoDia?.fechamento?.status === 'fechado'
              ? <Lock className="w-5 h-5 text-amber-600" />
              : <CheckCircle className="w-5 h-5 text-neutral-400" />
            }
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Fechamento de Caixa</h2>
              {resumoDia?.fechamento?.status === 'fechado' && (
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Caixa fechado por {resumoDia.fechamento.fechado_por_nome} em{' '}
                  {new Date(resumoDia.fechamento.fechado_em).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            {resumoDia?.fechamento?.status === 'fechado' && (
              <Badge variant="warning">Caixa Fechado</Badge>
            )}
          </div>
          {expandido ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </button>

        {expandido && (
          <div className="border-t border-neutral-100 p-6 space-y-5">
            {/* Seletor de data */}
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-5 h-5 text-neutral-500 shrink-0" />
              <label className="text-sm font-medium text-neutral-700 shrink-0">Data:</label>
              <input
                type="date"
                value={dataFechamento}
                max={hoje}
                onChange={(e) => setDataFechamento(e.target.value)}
                className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Erro */}
            {erroFechamento && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {erroFechamento}
              </p>
            )}

            {/* Loading */}
            {loadingFechamento && (
              <p className="text-sm text-neutral-500 animate-pulse">Carregando resumo...</p>
            )}

            {/* Conteúdo */}
            {!loadingFechamento && resumoDia && (
              <>
                {resumoDia.comandas.length === 0 ? (
                  <p className="text-sm text-neutral-500 bg-neutral-50 rounded-lg px-4 py-3">
                    Nenhuma comanda fechada em {dataFechamento.split('-').reverse().join('/')}.
                  </p>
                ) : (
                  <>
                    {/* Tabela de comandas */}
                    <div className="overflow-x-auto rounded-lg border border-neutral-100">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 text-neutral-600">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">#</th>
                            <th className="text-left px-4 py-2 font-medium">Cliente</th>
                            <th className="text-right px-4 py-2 font-medium">Subtotal</th>
                            <th className="text-right px-4 py-2 font-medium">Desconto</th>
                            <th className="text-right px-4 py-2 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {resumoDia.comandas.map((c) => (
                            <tr key={c.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-2 text-neutral-500">{c.numero_comanda}</td>
                              <td className="px-4 py-2 text-neutral-900">{c.cliente_nome ?? '—'}</td>
                              <td className="px-4 py-2 text-right text-neutral-700">
                                {Number(c.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-2 text-right text-red-600">
                                {Number(c.desconto) > 0
                                  ? `- ${Number(c.desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-green-700">
                                {Number(c.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-semibold border-t border-neutral-200">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-neutral-900">
                              {resumoDia.comandas.length} comanda{resumoDia.comandas.length !== 1 ? 's' : ''}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700">
                              {resumoDia.total_bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600">
                              {resumoDia.total_desconto > 0
                                ? `- ${resumoDia.total_desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {resumoDia.total_liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                          {resumoDia.total_comissoes > 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-neutral-600 text-sm font-normal">
                                Comissões do dia
                              </td>
                              <td className="px-4 py-2 text-right text-neutral-900 text-sm">
                                {resumoDia.total_comissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end">
                      {resumoDia.fechamento?.status === 'fechado' ? (
                        <Button
                          variant="secondary"
                          onClick={() => setModalFechamento('reabrir')}
                          disabled={processandoFechamento}
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Reabrir Caixa
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => setModalFechamento('fechar')}
                          disabled={processandoFechamento || resumoDia.comandas.length === 0}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Fechar Caixa
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Card>
      {/* ── FIM FECHAMENTO DE CAIXA ── */}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Financeiro</h1>
        <p className="text-neutral-600 mt-1">Controle financeiro e fluxo de caixa</p>
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
              <p className="text-3xl font-bold text-neutral-900">
                {resumo.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
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
              <p className="text-3xl font-bold text-neutral-900">
                {resumo.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
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
              <p className={`text-3xl font-bold ${resumo.lucro >= 0 ? 'text-neutral-900' : 'text-red-600'}`}>
                {resumo.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
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
              <p className="text-3xl font-bold text-neutral-900">
                {resumo.receita > 0 ? `${Math.round((resumo.lucro / resumo.receita) * 100)}%` : '—'}
              </p>
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
                      <p className="text-sm font-medium text-neutral-900">
                        {new Date(`${transacao.data}T00:00:00`).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-900">{transacao.descricao}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="default">{transacao.categoria}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-600">{METODO_LABELS[transacao.metodo] || transacao.metodo}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className={`text-sm font-bold ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipo === 'receita' ? '+' : '-'} {parseFloat(transacao.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

export default withAdminOnly(FinanceiroPage);
