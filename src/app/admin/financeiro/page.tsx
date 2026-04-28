'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, CreditCard, Wallet, Calendar, ArrowUpRight, ArrowDownRight,
  Lock, Unlock, CheckCircle, ChevronDown, ChevronUp, PiggyBank, Receipt,
  Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Banknote, AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import FechamentoCaixaModal from '@/components/modals/FechamentoCaixaModal';
import AberturaCaixaModal from '@/components/modals/AberturaCaixaModal';
import FundoCaixaModal from '@/components/modals/FundoCaixaModal';
import ContaFixaModal, { type ContaFixa } from '@/components/modals/ContaFixaModal';
import { withAdminOnly } from '@/components/auth/withAdminOnly';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { buscarResumoDia, fecharCaixa, reabrirCaixa, type ResumoDia } from '@/services/caixa';

// ── helpers ──────────────────────────────────────────────────────────
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function isoHoje() {
  return new Date().toISOString().split('T')[0];
}

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function inicioSemana() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

// ── tipos locais ──────────────────────────────────────────────────────
interface PagarContaState {
  conta: ContaFixa;
  valor: string;
  observacao: string;
}

// ─────────────────────────────────────────────────────────────────────
function FinanceiroPage() {
  const { user } = useAuth();

  // ── Período / filtro de datas ──────────────────────────────────────
  const hoje = isoHoje();
  const [dataInicio, setDataInicio] = useState<string>(inicioMes());
  const [dataFim, setDataFim] = useState<string>(hoje);
  const [atalho, setAtalho] = useState<'hoje' | 'semana' | 'mes' | 'custom'>('mes');

  const aplicarAtalho = (tipo: 'hoje' | 'semana' | 'mes') => {
    setAtalho(tipo);
    setDataFim(hoje);
    if (tipo === 'hoje') setDataInicio(hoje);
    else if (tipo === 'semana') setDataInicio(inicioSemana());
    else setDataInicio(inicioMes());
  };

  // ── Transações ────────────────────────────────────────────────────
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransacoes = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `/api/admin/transacoes?dataInicio=${dataInicio}&dataFim=${dataFim}`,
      );
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => { loadTransacoes(); }, [loadTransacoes]);

  useEffect(() => {
    const onFocus = () => loadTransacoes();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadTransacoes]);

  useEffect(() => {
    const channel = supabase
      .channel('financeiro-transacoes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transacoes' }, loadTransacoes)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transacoes' }, loadTransacoes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTransacoes]);

  // ── Resumo financeiro ─────────────────────────────────────────────
  const resumo = {
    receita:  transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + parseFloat(t.valor || 0), 0),
    despesas: transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + parseFloat(t.valor || 0), 0),
    lucro: 0,
  };
  resumo.lucro = resumo.receita - resumo.despesas;

  // ── Métodos de pagamento ──────────────────────────────────────────
  const METODO_LABELS: Record<string, string> = {
    dinheiro: 'Dinheiro', cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito', pix: 'PIX', outros: 'Outros',
  };
  const METODO_CORES: Record<string, string> = {
    dinheiro: 'bg-accent-500', cartao_credito: 'bg-blue-500',
    cartao_debito: 'bg-purple-500', pix: 'bg-green-500', outros: 'bg-orange-500',
  };
  const porMetodoMap: Record<string, number> = {};
  transacoes.filter(t => t.tipo === 'receita').forEach(t => {
    const m = t.metodo || 'dinheiro';
    porMetodoMap[m] = (porMetodoMap[m] || 0) + parseFloat(t.valor || 0);
  });
  const totalReceita = resumo.receita || 1;
  const metodosPagamento = Object.entries(porMetodoMap)
    .map(([m, valor]) => ({
      metodo: METODO_LABELS[m] || m, valor,
      percentual: Math.round((valor / totalReceita) * 100),
      cor: METODO_CORES[m] || 'bg-neutral-400',
    }))
    .sort((a, b) => b.valor - a.valor);

  // ── Histórico por dia ─────────────────────────────────────────────
  const historicoPorDia = (() => {
    const map: Record<string, { entrou: number; saiu: number }> = {};
    transacoes.forEach(t => {
      const d = t.data || '';
      if (!map[d]) map[d] = { entrou: 0, saiu: 0 };
      if (t.tipo === 'receita') map[d].entrou += parseFloat(t.valor || 0);
      else map[d].saiu += parseFloat(t.valor || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([data, vals]) => ({
        data,
        dataFmt: data.split('-').reverse().join('/'),
        entrou: vals.entrou,
        saiu: vals.saiu,
        saldo: vals.entrou - vals.saiu,
      }));
  })();

  // ── Fechamento de Caixa ───────────────────────────────────────────
  const [dataFechamento, setDataFechamento] = useState<string>(hoje);
  const [resumoDia, setResumoDia] = useState<ResumoDia | null>(null);
  const [loadingFechamento, setLoadingFechamento] = useState(false);
  const [erroFechamento, setErroFechamento] = useState<string | null>(null);
  const [modalFechamento, setModalFechamento] = useState<'fechar' | 'reabrir' | null>(null);
  const [processandoFechamento, setProcessandoFechamento] = useState(false);
  const [expandidoCaixa, setExpandidoCaixa] = useState(true);

  const carregarResumoDia = useCallback(async (data: string) => {
    setLoadingFechamento(true);
    setErroFechamento(null);
    try {
      setResumoDia(await buscarResumoDia(data));
    } catch (e: any) {
      setErroFechamento(e?.message ?? 'Erro ao carregar resumo do dia');
    } finally {
      setLoadingFechamento(false);
    }
  }, []);

  useEffect(() => { carregarResumoDia(dataFechamento); }, [dataFechamento, carregarResumoDia]);

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

  // ── Abertura de Caixa ─────────────────────────────────────────────
  const [aberturaCaixa, setAberturaCaixa] = useState<number | null>(null);
  const [modalAbertura, setModalAbertura] = useState(false);
  const [processandoAbertura, setProcessandoAbertura] = useState(false);

  const carregarAbertura = useCallback(async (data: string) => {
    try {
      const r = await fetch(`/api/admin/abertura-caixa?data=${data}`);
      const d = await r.json();
      setAberturaCaixa(d ? Number(d.valor_abertura) : null);
    } catch { setAberturaCaixa(null); }
  }, []);

  useEffect(() => { carregarAbertura(dataFechamento); }, [dataFechamento, carregarAbertura]);

  const handleSalvarAbertura = async (valor: number, observacao: string) => {
    if (!user?.id) return;
    setProcessandoAbertura(true);
    try {
      await fetch('/api/admin/abertura-caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataFechamento, valor_abertura: valor, observacao, aberto_por: user.id }),
      });
      setAberturaCaixa(valor);
      setModalAbertura(false);
    } catch (e: any) {
      setErroFechamento(e?.message ?? 'Erro ao salvar abertura');
    } finally {
      setProcessandoAbertura(false);
    }
  };

  // ── Fundo de Caixa ────────────────────────────────────────────────
  const [saldoFundo, setSaldoFundo] = useState<number>(0);
  const [movsF, setMovsF] = useState<any[]>([]);
  const [modalFundo, setModalFundo] = useState(false);
  const [processandoFundo, setProcessandoFundo] = useState(false);
  const [expandidoFundo, setExpandidoFundo] = useState(false);

  const carregarFundo = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/fundo-caixa');
      const d = await r.json();
      setSaldoFundo(Number(d.saldo ?? 0));
      setMovsF(d.movimentacoes ?? []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregarFundo(); }, [carregarFundo]);

  const handleMovFundo = async (tipo: 'deposito' | 'retirada', valor: number, descricao: string) => {
    if (!user?.id) return;
    setProcessandoFundo(true);
    try {
      const r = await fetch('/api/admin/fundo-caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, valor, descricao, user_id: user.id }),
      });
      if (!r.ok) { const b = await r.json(); throw new Error(b.error); }
      await carregarFundo();
      setModalFundo(false);
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao movimentar fundo');
    } finally {
      setProcessandoFundo(false);
    }
  };

  // ── Contas Fixas ──────────────────────────────────────────────────
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);
  const [modalContaFixa, setModalContaFixa] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaFixa | null>(null);
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [pagarContaState, setPagarContaState] = useState<PagarContaState | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [expandidoContas, setExpandidoContas] = useState(true);

  const carregarContas = useCallback(async () => {
    setLoadingContas(true);
    try {
      const r = await fetch('/api/admin/contas-fixas');
      setContasFixas(await r.json());
    } catch { /* silencioso */ } finally {
      setLoadingContas(false);
    }
  }, []);

  useEffect(() => { carregarContas(); }, [carregarContas]);

  const handleSalvarConta = async (dados: Omit<ContaFixa, 'id' | 'ativo'>) => {
    setSalvandoConta(true);
    try {
      if (contaEditando) {
        await fetch('/api/admin/contas-fixas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: contaEditando.id, ...dados }),
        });
      } else {
        await fetch('/api/admin/contas-fixas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        });
      }
      await carregarContas();
      setModalContaFixa(false);
      setContaEditando(null);
    } catch { /* silencioso */ } finally {
      setSalvandoConta(false);
    }
  };

  const handleDesativarConta = async (id: string) => {
    if (!confirm('Desativar esta conta fixa?')) return;
    await fetch(`/api/admin/contas-fixas?id=${id}`, { method: 'DELETE' });
    await carregarContas();
  };

  const handlePagarConta = async () => {
    if (!pagarContaState || !user?.id) return;
    const valorNum = parseFloat(pagarContaState.valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return;
    setProcessandoPagamento(true);
    try {
      const r = await fetch('/api/admin/contas-fixas/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conta_fixa_id: pagarContaState.conta.id,
          valor_pago: valorNum,
          observacao: pagarContaState.observacao,
          user_id: user.id,
        }),
      });
      if (!r.ok) { const b = await r.json(); throw new Error(b.error); }
      setPagarContaState(null);
      await loadTransacoes();
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao registrar pagamento');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const CATEGORIA_LABELS: Record<string, string> = {
    aluguel: 'Aluguel', energia: 'Energia', agua: 'Água',
    internet: 'Internet', folha: 'Folha', contador: 'Contador',
    seguro: 'Seguro', manutencao: 'Manutenção', software: 'Software', outros: 'Outros',
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Modais ── */}
      {modalFechamento && resumoDia && (
        <FechamentoCaixaModal
          isOpen
          onClose={() => setModalFechamento(null)}
          modo={modalFechamento}
          data={dataFechamento}
          totalLiquido={resumoDia.total_liquido}
          totalComissoes={resumoDia.total_comissoes}
          totalComandas={resumoDia.comandas.length}
          totalDinheiro={resumoDia.total_dinheiro}
          valorAbertura={aberturaCaixa}
          saldoFundo={saldoFundo}
          loading={processandoFechamento}
          onConfirmar={modalFechamento === 'fechar' ? handleFecharCaixa : handleReabrirCaixa}
        />
      )}

      <AberturaCaixaModal
        isOpen={modalAbertura}
        onClose={() => setModalAbertura(false)}
        data={dataFechamento}
        aberturaExistente={aberturaCaixa}
        loading={processandoAbertura}
        onConfirmar={handleSalvarAbertura}
      />

      <FundoCaixaModal
        isOpen={modalFundo}
        onClose={() => setModalFundo(false)}
        saldoAtual={saldoFundo}
        loading={processandoFundo}
        onConfirmar={handleMovFundo}
      />

      <ContaFixaModal
        isOpen={modalContaFixa}
        onClose={() => { setModalContaFixa(false); setContaEditando(null); }}
        conta={contaEditando}
        loading={salvandoConta}
        onSalvar={handleSalvarConta}
      />

      {/* Modal inline de pagamento de conta fixa */}
      {pagarContaState && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Pagar: {pagarContaState.conta.nome}</h2>
            <p className="text-sm text-neutral-600">
              Valor estimado: <strong>{fmt(pagarContaState.conta.valor)}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Valor pago (R$)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={pagarContaState.valor}
                onChange={e => setPagarContaState(s => s ? { ...s, valor: e.target.value } : s)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Observação (opcional)</label>
              <input
                type="text"
                value={pagarContaState.observacao}
                onChange={e => setPagarContaState(s => s ? { ...s, observacao: e.target.value } : s)}
                placeholder="Ex: referente a abril/2026"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3 pt-2 justify-end">
              <Button variant="secondary" onClick={() => setPagarContaState(null)} disabled={processandoPagamento}>Cancelar</Button>
              <Button variant="primary" onClick={handlePagarConta} disabled={processandoPagamento || !pagarContaState.valor}>
                {processandoPagamento ? 'Registrando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1 — FECHAMENTO DE CAIXA                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Card padding="none">
        <button
          type="button"
          onClick={() => setExpandidoCaixa(v => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {resumoDia?.fechamento?.status === 'fechado'
              ? <Lock className="w-5 h-5 text-amber-600" />
              : <CheckCircle className="w-5 h-5 text-neutral-400" />}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Fechamento de Caixa</h2>
              {resumoDia?.fechamento?.status === 'fechado' && (
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Fechado por {resumoDia.fechamento.fechado_por_nome} em{' '}
                  {new Date(resumoDia.fechamento.fechado_em).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            {resumoDia?.fechamento?.status === 'fechado' && (
              <Badge variant="warning">Caixa Fechado</Badge>
            )}
          </div>
          {expandidoCaixa ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </button>

        {expandidoCaixa && (
          <div className="border-t border-neutral-100 p-6 space-y-5">
            {/* Seletor de data */}
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-5 h-5 text-neutral-500 shrink-0" />
              <label className="text-sm font-medium text-neutral-700 shrink-0">Data:</label>
              <input
                type="date" value={dataFechamento} max={hoje}
                onChange={e => setDataFechamento(e.target.value)}
                className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Abertura de caixa do dia */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Banknote className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Abertura do caixa</p>
                <p className="text-lg font-bold text-blue-800">
                  {aberturaCaixa != null ? fmt(aberturaCaixa) : <span className="text-blue-400 font-normal text-sm">Não registrada</span>}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setModalAbertura(true)}>
                {aberturaCaixa != null ? 'Editar' : 'Registrar'}
              </Button>
            </div>

            {erroFechamento && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {erroFechamento}
              </p>
            )}
            {loadingFechamento && (
              <p className="text-sm text-neutral-500 animate-pulse">Carregando resumo...</p>
            )}

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
                          {resumoDia.comandas.map(c => (
                            <tr key={c.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-2 text-neutral-500">{c.numero_comanda}</td>
                              <td className="px-4 py-2 text-neutral-900">{c.cliente_nome ?? '—'}</td>
                              <td className="px-4 py-2 text-right text-neutral-700">
                                {Number(c.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-4 py-2 text-right text-red-600">
                                {Number(c.desconto) > 0 ? `- ${Number(c.desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '—'}
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
                              {resumoDia.total_desconto > 0 ? `- ${resumoDia.total_desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {resumoDia.total_liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                          {resumoDia.total_comissoes > 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-neutral-600 text-sm font-normal">Comissões do dia</td>
                              <td className="px-4 py-2 text-right text-neutral-900 text-sm">
                                {resumoDia.total_comissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>

                    {/* Resumo por método de pagamento do dia */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Dinheiro', valor: resumoDia.total_dinheiro, cor: 'text-green-700', bg: 'bg-green-50' },
                        { label: 'Cartão', valor: resumoDia.total_cartao, cor: 'text-blue-700', bg: 'bg-blue-50' },
                        { label: 'PIX', valor: resumoDia.total_pix, cor: 'text-purple-700', bg: 'bg-purple-50' },
                        { label: 'Outros', valor: resumoDia.total_outros, cor: 'text-orange-700', bg: 'bg-orange-50' },
                      ].map(({ label, valor, cor, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                          <p className="text-xs text-neutral-500 font-medium">{label}</p>
                          <p className={`font-bold text-sm ${cor}`}>{fmt(valor ?? 0)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end gap-3">
                      {resumoDia.fechamento?.status === 'fechado' ? (
                        <Button variant="secondary" onClick={() => setModalFechamento('reabrir')} disabled={processandoFechamento}>
                          <Unlock className="w-4 h-4 mr-2" /> Reabrir Caixa
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => setModalFechamento('fechar')}
                          disabled={processandoFechamento || resumoDia.comandas.length === 0}
                        >
                          <Lock className="w-4 h-4 mr-2" /> Fechar Caixa
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2 — FUNDO DE CAIXA                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Card padding="none">
        <button
          type="button"
          onClick={() => setExpandidoFundo(v => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Fundo de Caixa</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Saldo reservado: <strong className="text-blue-700">{fmt(saldoFundo)}</strong></p>
            </div>
          </div>
          {expandidoFundo ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </button>

        {expandidoFundo && (
          <div className="border-t border-neutral-100 p-6 space-y-4">
            <p className="text-sm text-neutral-600">
              O fundo de caixa é um valor reservado separado do caixa operacional, utilizado para giro do negócio.
              Ele não entra no fechamento diário, mas pode ser consultado e movimentado conforme necessário.
            </p>

            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={() => setModalFundo(true)}>
                <ArrowUpCircle className="w-4 h-4 mr-1" /> Movimentar
              </Button>
            </div>

            {movsF.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-neutral-100">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Data</th>
                      <th className="text-left px-4 py-2 font-medium">Tipo</th>
                      <th className="text-left px-4 py-2 font-medium">Descrição</th>
                      <th className="text-right px-4 py-2 font-medium">Valor</th>
                      <th className="text-right px-4 py-2 font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {movsF.map((m: any) => (
                      <tr key={m.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-2 text-neutral-500">
                          {new Date(m.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2">
                          {m.tipo === 'deposito'
                            ? <span className="flex items-center gap-1 text-green-700"><ArrowUpCircle className="w-3.5 h-3.5" /> Depósito</span>
                            : <span className="flex items-center gap-1 text-red-600"><ArrowDownCircle className="w-3.5 h-3.5" /> Retirada</span>}
                        </td>
                        <td className="px-4 py-2 text-neutral-700">{m.descricao}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${m.tipo === 'deposito' ? 'text-green-700' : 'text-red-600'}`}>
                          {m.tipo === 'deposito' ? '+' : '-'} {fmt(Number(m.valor))}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-900">{fmt(Number(m.saldo_apos))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {movsF.length === 0 && (
              <p className="text-sm text-neutral-500 bg-neutral-50 rounded-lg px-4 py-3">
                Nenhuma movimentação registrada no fundo de caixa.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 3 — CONTAS FIXAS                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Card padding="none">
        <button
          type="button"
          onClick={() => setExpandidoContas(v => !v)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Contas Fixas</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {contasFixas.filter(c => c.ativo).length} conta{contasFixas.filter(c => c.ativo).length !== 1 ? 's' : ''} ativa{contasFixas.filter(c => c.ativo).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {expandidoContas ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </button>

        {expandidoContas && (
          <div className="border-t border-neutral-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-600">
                Cadastre contas recorrentes (aluguel, energia, etc.) e registre pagamentos diretamente no caixa.
              </p>
              <Button variant="primary" size="sm" onClick={() => { setContaEditando(null); setModalContaFixa(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Nova Conta
              </Button>
            </div>

            {loadingContas && <p className="text-sm text-neutral-500 animate-pulse">Carregando...</p>}

            {!loadingContas && contasFixas.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0" />
                <p className="text-sm text-neutral-600">Nenhuma conta fixa cadastrada. Clique em "Nova Conta" para adicionar.</p>
              </div>
            )}

            {!loadingContas && contasFixas.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-neutral-100">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Nome</th>
                      <th className="text-left px-4 py-2 font-medium">Categoria</th>
                      <th className="text-center px-4 py-2 font-medium">Vencimento</th>
                      <th className="text-right px-4 py-2 font-medium">Valor</th>
                      <th className="text-center px-4 py-2 font-medium">Status</th>
                      <th className="text-right px-4 py-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {contasFixas.map(c => (
                      <tr key={c.id} className={`hover:bg-neutral-50 ${!c.ativo ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-2 font-medium text-neutral-900">
                          {c.nome}
                          {c.observacao && <p className="text-xs text-neutral-500 font-normal">{c.observacao}</p>}
                        </td>
                        <td className="px-4 py-2 text-neutral-600">{CATEGORIA_LABELS[c.categoria] ?? c.categoria}</td>
                        <td className="px-4 py-2 text-center text-neutral-600">
                          {c.vencimento_dia != null ? `Dia ${c.vencimento_dia}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-neutral-900">{fmt(c.valor)}</td>
                        <td className="px-4 py-2 text-center">
                          {c.ativo
                            ? <Badge variant="success">Ativa</Badge>
                            : <Badge variant="default">Inativa</Badge>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.ativo && (
                              <Button
                                variant="primary" size="sm"
                                onClick={() => setPagarContaState({ conta: c, valor: String(c.valor), observacao: '' })}
                              >
                                Pagar
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setContaEditando(c); setModalContaFixa(true); }}
                              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {c.ativo && (
                              <button
                                type="button"
                                onClick={() => handleDesativarConta(c.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t border-neutral-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-neutral-700">
                        Total mensal estimado
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">
                        {fmt(contasFixas.filter(c => c.ativo).reduce((s, c) => s + c.valor, 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 4 — FINANCEIRO (resumo + histórico)                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Financeiro</h1>
        <p className="text-neutral-600 mt-1">Controle financeiro e fluxo de caixa</p>
      </div>

      {/* Filtro de período */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          {/* Atalhos */}
          <div className="flex gap-2 flex-wrap">
            {(['hoje', 'semana', 'mes'] as const).map(a => (
              <Button
                key={a}
                variant={atalho === a ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => aplicarAtalho(a)}
              >
                {a === 'hoje' ? 'Hoje' : a === 'semana' ? 'Últimos 7 dias' : 'Este Mês'}
              </Button>
            ))}
          </div>

          {/* Datas customizadas */}
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">De</label>
              <input
                type="date" value={dataInicio} max={dataFim}
                onChange={e => { setDataInicio(e.target.value); setAtalho('custom'); }}
                className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Até</label>
              <input
                type="date" value={dataFim} min={dataInicio} max={hoje}
                onChange={e => { setDataFim(e.target.value); setAtalho('custom'); }}
                className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Cards de resumo */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Receita', value: resumo.receita, icon: ArrowUpRight, bg: 'bg-green-500' },
          { label: 'Despesas', value: resumo.despesas, icon: ArrowDownRight, bg: 'bg-red-500' },
          { label: 'Lucro', value: resumo.lucro, icon: DollarSign, bg: 'bg-accent-500', colored: true },
          {
            label: 'Margem', value: null, icon: Wallet, bg: 'bg-blue-500',
            text: resumo.receita > 0 ? `${Math.round((resumo.lucro / resumo.receita) * 100)}%` : '—',
          },
        ].map(({ label, value, icon: Icon, bg, colored, text }) => (
          <Card key={label} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${colored && value !== null && value < 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                  {text ?? (value !== null ? fmt(value) : '—')}
                </p>
              </div>
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Histórico por dia */}
      {historicoPorDia.length > 0 && (
        <Card padding="none">
          <CardHeader className="p-6 border-b border-neutral-100">
            <CardTitle>Histórico de Caixa por Dia</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {historicoPorDia.map(d => (
                <div key={d.data} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-medium text-neutral-900">{d.dataFmt}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500">Entrou</p>
                        <p className="text-sm font-semibold text-green-700">{fmt(d.entrou)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500">Saiu</p>
                        <p className="text-sm font-semibold text-red-600">{fmt(d.saiu)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-400 shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500">Saldo</p>
                        <p className={`text-sm font-bold ${d.saldo >= 0 ? 'text-neutral-900' : 'text-red-600'}`}>{fmt(d.saldo)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métodos de pagamento */}
      {metodosPagamento.length > 0 && (
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
                      <p className="font-bold text-neutral-900">{fmt(metodo.valor)}</p>
                      <p className="text-sm text-neutral-600">{metodo.percentual}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div className={`${metodo.cor} h-2 rounded-full transition-all`} style={{ width: `${metodo.percentual}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transações Recentes */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-neutral-500 animate-pulse p-6">Carregando...</p>
          ) : transacoes.length === 0 ? (
            <p className="text-sm text-neutral-500 p-6">Nenhuma transação no período selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">Data</th>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">Descrição</th>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">Categoria</th>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">Método</th>
                    <th className="text-right p-4 text-sm font-semibold text-neutral-900">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transacoes.map(transacao => (
                    <tr key={transacao.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-neutral-900">
                        {new Date(`${transacao.data}T00:00:00`).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-sm text-neutral-900">{transacao.descricao}</td>
                      <td className="p-4"><Badge variant="default">{transacao.categoria}</Badge></td>
                      <td className="p-4 text-sm text-neutral-600">{METODO_LABELS[transacao.metodo] || transacao.metodo}</td>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminOnly(FinanceiroPage);
