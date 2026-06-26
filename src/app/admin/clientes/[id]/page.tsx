'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  User,
  ShoppingBag,
  Package,
  Calendar,
  Clock,
  Filter,
  Scissors,
  Star,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  status: string;
  created_at: string;
}

interface ComandaItem {
  id: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  comanda_data: string;
}

interface PacoteAtivo {
  id: string;
  servico_nome: string;
  sessoes_consumidas: number;
  sessoes_total: number;
  sessoes_restantes: number;
  data_validade: string | null;
}

interface Agendamento {
  id: string;
  data_agendamento: string;
  hora_inicio: string;
  servico_nome: string;
  profissional_nome: string;
  status: string;
}

type TipoFiltro = 'Todos' | 'Serviços' | 'Produtos' | 'Pacotes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function getTipoBadgeVariant(tipo: string): 'default' | 'success' | 'warning' | 'info' | 'error' {
  if (tipo === 'servico' || tipo === 'serviço') return 'info';
  if (tipo === 'produto') return 'success';
  if (tipo === 'pacote') return 'warning';
  return 'default';
}

function getTipoLabel(tipo: string) {
  if (tipo === 'servico' || tipo === 'serviço') return 'Serviço';
  if (tipo === 'produto') return 'Produto';
  if (tipo === 'pacote') return 'Pacote';
  return tipo;
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      <td className="p-4"><div className="h-4 bg-neutral-100 rounded animate-pulse w-24" /></td>
      <td className="p-4"><div className="h-4 bg-neutral-100 rounded animate-pulse w-40" /></td>
      <td className="p-4"><div className="h-4 bg-neutral-100 rounded animate-pulse w-16" /></td>
      <td className="p-4"><div className="h-4 bg-neutral-100 rounded animate-pulse w-12" /></td>
      <td className="p-4"><div className="h-4 bg-neutral-100 rounded animate-pulse w-20" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 border border-neutral-100 rounded-xl animate-pulse space-y-2">
      <div className="h-4 bg-neutral-100 rounded w-32" />
      <div className="h-3 bg-neutral-100 rounded w-full" />
      <div className="h-2 bg-neutral-100 rounded w-3/4" />
    </div>
  );
}

// ─── Barra de Progresso ────────────────────────────────────────────────────────

function ProgressBar({ consumed, total }: { consumed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (consumed / total) * 100) : 0;
  const restante = total - consumed;
  const color = restante === 0 ? 'bg-red-400' : restante <= 2 ? 'bg-yellow-400' : 'bg-green-500';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-neutral-500 mb-1">
        <span>{consumed} usadas</span>
        <span>{restante} restantes de {total}</span>
      </div>
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ClientePerfilPage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params?.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(true);

  const [historico, setHistorico] = useState<ComandaItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('Todos');

  const [pacotes, setPacotes] = useState<PacoteAtivo[]>([]);
  const [loadingPacotes, setLoadingPacotes] = useState(true);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);

  // ── Carregar cliente ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!clienteId) return;

    async function loadCliente() {
      setLoadingCliente(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) console.error('[perfil] Erro ao carregar cliente:', error);
      setCliente(data ?? null);
      setLoadingCliente(false);
    }

    loadCliente();
  }, [clienteId]);

  // ── Carregar histórico de compras ─────────────────────────────────────────

  useEffect(() => {
    if (!clienteId) return;

    async function loadHistorico() {
      setLoadingHistorico(true);
      try {
        // Busca comandas fechadas do cliente
        const { data: comandas, error: erroComandas } = await supabase
          .from('comandas')
          .select('id, created_at')
          .eq('cliente_id', clienteId)
          .eq('status', 'fechada');

        if (erroComandas) throw erroComandas;
        if (!comandas || comandas.length === 0) {
          setHistorico([]);
          setLoadingHistorico(false);
          return;
        }

        const comandaIds = comandas.map((c) => c.id);
        const comandaDateMap: Record<string, string> = {};
        comandas.forEach((c) => { comandaDateMap[c.id] = c.created_at; });

        // Busca itens dessas comandas
        const { data: itens, error: erroItens } = await supabase
          .from('comanda_itens')
          .select('id, comanda_id, descricao, tipo, quantidade, valor_unitario, valor_total')
          .in('comanda_id', comandaIds)
          .order('id', { ascending: false });

        if (erroItens) throw erroItens;

        const resultado: ComandaItem[] = (itens || []).map((item: any) => ({
          id: item.id,
          descricao: item.descricao,
          tipo: item.tipo || 'servico',
          quantidade: item.quantidade || 1,
          valor_unitario: item.valor_unitario || 0,
          valor_total: item.valor_total || 0,
          comanda_data: comandaDateMap[item.comanda_id] || '',
        }));

        setHistorico(resultado);
      } catch (err) {
        console.error('[perfil] Erro ao carregar histórico:', err);
        setHistorico([]);
      } finally {
        setLoadingHistorico(false);
      }
    }

    loadHistorico();
  }, [clienteId]);

  // ── Carregar pacotes ativos ───────────────────────────────────────────────

  useEffect(() => {
    if (!clienteId) return;

    async function loadPacotes() {
      setLoadingPacotes(true);
      try {
        const { data, error } = await supabase
          .from('pacotes_cliente')
          .select('id, servico_id, sessoes_total, sessoes_consumidas, data_validade')
          .eq('cliente_id', clienteId);

        if (error) throw error;

        const comSaldo = (data || []).filter((p: any) => p.sessoes_consumidas < p.sessoes_total);

        if (comSaldo.length === 0) {
          setPacotes([]);
          setLoadingPacotes(false);
          return;
        }

        const servicoIds = [...new Set(comSaldo.map((p: any) => p.servico_id as string))];
        const { data: servicos } = await supabase
          .from('servicos')
          .select('id, nome')
          .in('id', servicoIds);

        const nomeMap: Record<string, string> = {};
        (servicos ?? []).forEach((s: any) => { nomeMap[s.id] = s.nome; });

        const resultado: PacoteAtivo[] = comSaldo.map((p: any) => ({
          id: p.id,
          servico_nome: nomeMap[p.servico_id] ?? 'Serviço',
          sessoes_consumidas: p.sessoes_consumidas,
          sessoes_total: p.sessoes_total,
          sessoes_restantes: p.sessoes_total - p.sessoes_consumidas,
          data_validade: p.data_validade ?? null,
        }));

        setPacotes(resultado);
      } catch (err) {
        console.error('[perfil] Erro ao carregar pacotes:', err);
        setPacotes([]);
      } finally {
        setLoadingPacotes(false);
      }
    }

    loadPacotes();
  }, [clienteId]);

  // ── Carregar agendamentos futuros ─────────────────────────────────────────

  useEffect(() => {
    if (!clienteId) return;

    async function loadAgendamentos() {
      setLoadingAgendamentos(true);
      try {
        const hoje = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            id,
            data_agendamento,
            hora_inicio,
            status,
            servicos(nome),
            profissionais(nome)
          `)
          .eq('cliente_id', clienteId)
          .gte('data_agendamento', hoje)
          .neq('status', 'cancelado')
          .order('data_agendamento', { ascending: true })
          .order('hora_inicio', { ascending: true });

        if (error) throw error;

        const resultado: Agendamento[] = (data || []).map((ag: any) => ({
          id: ag.id,
          data_agendamento: ag.data_agendamento,
          hora_inicio: ag.hora_inicio,
          status: ag.status,
          servico_nome: ag.servicos?.nome ?? 'Serviço',
          profissional_nome: ag.profissionais?.nome ?? 'Profissional',
        }));

        setAgendamentos(resultado);
      } catch (err) {
        console.error('[perfil] Erro ao carregar agendamentos:', err);
        setAgendamentos([]);
      } finally {
        setLoadingAgendamentos(false);
      }
    }

    loadAgendamentos();
  }, [clienteId]);

  // ── Filtro do histórico ───────────────────────────────────────────────────

  const filtroMap: Record<TipoFiltro, string[]> = {
    'Todos': [],
    'Serviços': ['servico', 'serviço'],
    'Produtos': ['produto'],
    'Pacotes': ['pacote'],
  };

  const historicoFiltrado = filtroTipo === 'Todos'
    ? historico
    : historico.filter((item) => filtroMap[filtroTipo].includes(item.tipo));

  const totalGasto = historico.reduce((acc, i) => acc + (i.valor_total || 0), 0);

  const tiposFiltro: TipoFiltro[] = ['Todos', 'Serviços', 'Produtos', 'Pacotes'];

  // ── Status badge do agendamento ───────────────────────────────────────────

  function getAgendamentoVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    if (status === 'confirmado') return 'success';
    if (status === 'pendente') return 'warning';
    if (status === 'cancelado') return 'error';
    return 'info';
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Botão Voltar */}
      <button
        onClick={() => router.push('/admin/clientes')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Voltar para Clientes</span>
      </button>

      {/* ── Header do Cliente ─────────────────────────────────────────────── */}
      {loadingCliente ? (
        <Card padding="lg">
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-neutral-200" />
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-neutral-200 rounded w-48" />
              <div className="h-4 bg-neutral-100 rounded w-64" />
              <div className="h-4 bg-neutral-100 rounded w-40" />
            </div>
          </div>
        </Card>
      ) : cliente ? (
        <Card padding="lg">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-neutral-900">{cliente.nome}</h1>
                <Badge variant={cliente.status === 'ativo' ? 'success' : 'default'}>
                  {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  {cliente.telefone || '-'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {cliente.email || '-'}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Cliente desde {formatDate(cliente.created_at.split('T')[0])}
                </span>
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="flex gap-4 shrink-0">
              <div className="text-center px-4 py-3 bg-neutral-50 rounded-xl">
                <p className="text-xs text-neutral-500 mb-1">Total Gasto</p>
                <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalGasto)}</p>
              </div>
              <div className="text-center px-4 py-3 bg-neutral-50 rounded-xl">
                <p className="text-xs text-neutral-500 mb-1">Compras</p>
                <p className="text-lg font-bold text-neutral-900">{historico.length}</p>
              </div>
              <div className="text-center px-4 py-3 bg-neutral-50 rounded-xl">
                <p className="text-xs text-neutral-500 mb-1">Pacotes</p>
                <p className="text-lg font-bold text-neutral-900">{pacotes.length}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="lg">
          <p className="text-neutral-500 text-center py-4">Cliente não encontrado.</p>
        </Card>
      )}

      {/* ── Seção 1: Histórico de Compras ─────────────────────────────────── */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-accent-600" />
              </div>
              <CardTitle>Histórico de Compras</CardTitle>
              {!loadingHistorico && (
                <span className="text-sm text-neutral-400 ml-1">({historicoFiltrado.length} itens)</span>
              )}
            </div>
            {/* Filtros por tipo */}
            <div className="flex gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-neutral-400 self-center" />
              {tiposFiltro.map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    filtroTipo === t
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">Data</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">Descrição</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">Tipo</th>
                  <th className="text-center p-4 text-sm font-semibold text-neutral-700">Qtd</th>
                  <th className="text-right p-4 text-sm font-semibold text-neutral-700">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingHistorico ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : historicoFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-400">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Nenhum item encontrado</p>
                    </td>
                  </tr>
                ) : (
                  historicoFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 text-sm text-neutral-600 whitespace-nowrap">
                        {formatDateTime(item.comanda_data)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-neutral-900">{item.descricao}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={getTipoBadgeVariant(item.tipo)}>
                          {getTipoLabel(item.tipo)}
                        </Badge>
                      </td>
                      <td className="p-4 text-center text-sm text-neutral-700">
                        {item.quantidade}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(item.valor_total)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loadingHistorico && historicoFiltrado.length > 0 && (
                <tfoot className="bg-neutral-50 border-t border-neutral-200">
                  <tr>
                    <td colSpan={4} className="p-4 text-sm font-semibold text-neutral-700 text-right">
                      Total
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-neutral-900">
                      {formatCurrency(historicoFiltrado.reduce((acc, i) => acc + i.valor_total, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Seção 2: Pacotes Ativos ────────────────────────────────────────── */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-yellow-600" />
            </div>
            <CardTitle>Pacotes Ativos</CardTitle>
            {!loadingPacotes && (
              <span className="text-sm text-neutral-400 ml-1">({pacotes.length})</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingPacotes ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : pacotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhum pacote ativo</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pacotes.map((pk) => (
                <div
                  key={pk.id}
                  className="p-4 border border-neutral-200 rounded-xl hover:border-yellow-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-yellow-500 shrink-0" />
                      <p className="font-semibold text-neutral-900 text-sm leading-tight">{pk.servico_nome}</p>
                    </div>
                    <Badge variant="warning">{pk.sessoes_restantes} restantes</Badge>
                  </div>

                  <ProgressBar consumed={pk.sessoes_consumidas} total={pk.sessoes_total} />

                  {pk.data_validade && (
                    <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Válido até {formatDate(pk.data_validade)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Seção 3: Próximos Agendamentos ────────────────────────────────── */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <CardTitle>Próximos Agendamentos</CardTitle>
            {!loadingAgendamentos && (
              <span className="text-sm text-neutral-400 ml-1">({agendamentos.length})</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingAgendamentos ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <Calendar className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhum agendamento futuro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentos.map((ag) => (
                <div
                  key={ag.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-neutral-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  {/* Data / hora */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">
                        {new Date(ag.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Clock className="w-3.5 h-3.5" />
                      {ag.hora_inicio?.slice(0, 5) || '--:--'}
                    </div>
                  </div>

                  {/* Serviço + profissional */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm">{ag.servico_nome}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3" />
                      {ag.profissional_nome}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge variant={getAgendamentoVariant(ag.status)}>
                    {ag.status.charAt(0).toUpperCase() + ag.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
