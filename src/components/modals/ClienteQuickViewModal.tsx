'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ExternalLink, Mail, Package, Phone, UserRound, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ClienteQuickViewModalProps {
  clienteId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface ClienteResumo {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  created_at: string | null;
  status: string | null;
  vip: boolean | null;
}

interface AgendamentoResumo {
  id: string;
  data_agendamento: string;
  hora_inicio: string;
  status: string;
  servicos: unknown;
}

interface PacoteResumo {
  id: string;
  servico_id: string;
  sessoes_total: number;
  sessoes_consumidas: number;
  data_validade: string | null;
  servico_nome?: string;
}

function serviceNames(value: unknown): string {
  if (!Array.isArray(value)) return 'Serviço';
  const names = value
    .map(item => item && typeof item === 'object' && 'nome' in item ? String(item.nome) : '')
    .filter(Boolean);
  return names.join(', ') || 'Serviço';
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function ClienteQuickViewModal({ clienteId, isOpen, onClose }: ClienteQuickViewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [cliente, setCliente] = useState<ClienteResumo | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [pacotes, setPacotes] = useState<PacoteResumo[]>([]);
  const [totalGasto, setTotalGasto] = useState(0);
  const [compras, setCompras] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !clienteId) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, clienteId, onClose]);

  useEffect(() => {
    if (!isOpen || !clienteId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const today = new Date().toLocaleDateString('en-CA');
      const [clientResult, commandsResult, packagesResult, appointmentsResult] = await Promise.all([
        supabase.from('clientes').select('id,nome,telefone,email,cpf,data_nascimento,created_at,status,vip').eq('id', clienteId).single(),
        supabase.from('comandas').select('id,total,status').eq('cliente_id', clienteId),
        supabase.from('pacotes_cliente').select('id,servico_id,sessoes_total,sessoes_consumidas,data_validade').eq('cliente_id', clienteId),
        supabase.from('agendamentos').select('id,data_agendamento,hora_inicio,status,servicos')
          .eq('cliente_id', clienteId).gte('data_agendamento', today).neq('status', 'cancelado')
          .order('data_agendamento').order('hora_inicio').limit(5),
      ]);
      if (!active) return;
      if (clientResult.error || !clientResult.data) {
        setError('Não foi possível carregar os detalhes deste cliente.');
        setLoading(false);
        return;
      }

      const packageRows = (packagesResult.data || []) as PacoteResumo[];
      const serviceIds = [...new Set(packageRows.map(item => item.servico_id))];
      const serviceResult = serviceIds.length > 0
        ? await supabase.from('servicos').select('id,nome').in('id', serviceIds)
        : { data: [] };
      if (!active) return;
      const serviceMap = new Map((serviceResult.data || []).map(item => [item.id, item.nome]));
      const closedCommands = (commandsResult.data || []).filter(item => item.status === 'fechada');
      setCliente(clientResult.data as ClienteResumo);
      setTotalGasto(closedCommands.reduce((sum, item) => sum + Number(item.total || 0), 0));
      setCompras(closedCommands.length);
      setPacotes(packageRows.map(item => ({ ...item, servico_nome: serviceMap.get(item.servico_id) || 'Serviço' })));
      setAgendamentos((appointmentsResult.data || []) as AgendamentoResumo[]);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [isOpen, clienteId]);

  const activePackages = useMemo(
    () => pacotes.filter(item => Number(item.sessoes_consumidas) < Number(item.sessoes_total)),
    [pacotes],
  );

  if (!isOpen || !clienteId) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Fechar detalhes do cliente" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="client-quick-title"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Detalhes do cliente</p>
            <h2 id="client-quick-title" className="mt-1 text-2xl font-bold text-neutral-900">{cliente?.nome || 'Cliente'}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}
            </div>
          ) : error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-red-700" role="alert">{error}</p>
          ) : cliente && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{cliente.nome}</h3>
                      <p className="text-sm text-neutral-500">{cliente.vip ? 'Cliente VIP' : cliente.status || 'Cliente ativo'}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p className="flex items-center gap-2 text-neutral-700"><Phone className="h-4 w-4 text-neutral-400" /> {cliente.telefone || 'Não informado'}</p>
                    <p className="flex items-center gap-2 text-neutral-700"><Mail className="h-4 w-4 text-neutral-400" /> {cliente.email || 'Não informado'}</p>
                    <p className="text-neutral-600"><span className="font-medium">CPF:</span> {cliente.cpf || 'Não informado'}</p>
                    <p className="text-neutral-600"><span className="font-medium">Nascimento:</span> {formatDate(cliente.data_nascimento)}</p>
                    <p className="text-neutral-600 sm:col-span-2"><span className="font-medium">Cliente desde:</span> {formatDate(cliente.created_at)}</p>
                  </div>
                </section>
                <section className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-primary-50 p-4 text-center"><p className="text-xs text-neutral-500">Total gasto</p><p className="mt-2 font-bold text-primary-800">{totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                  <div className="rounded-2xl bg-green-50 p-4 text-center"><p className="text-xs text-neutral-500">Compras</p><p className="mt-2 text-xl font-bold text-green-700">{compras}</p></div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-center"><p className="text-xs text-neutral-500">Pacotes</p><p className="mt-2 text-xl font-bold text-amber-700">{activePackages.length}</p></div>
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-neutral-200 p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><Calendar className="h-5 w-5 text-blue-600" /> Próximos agendamentos</h3>
                  {agendamentos.length === 0 ? <p className="text-sm text-neutral-500">Nenhum agendamento futuro.</p> : (
                    <div className="space-y-2">
                      {agendamentos.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 text-sm">
                          <div><p className="font-medium text-neutral-800">{serviceNames(item.servicos)}</p><p className="text-neutral-500">{formatDate(item.data_agendamento)} às {item.hora_inicio.slice(0, 5)}</p></div>
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="rounded-2xl border border-neutral-200 p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><Package className="h-5 w-5 text-amber-600" /> Pacotes ativos</h3>
                  {activePackages.length === 0 ? <p className="text-sm text-neutral-500">Nenhum pacote com saldo.</p> : (
                    <div className="space-y-2">
                      {activePackages.map(item => (
                        <div key={item.id} className="rounded-xl bg-neutral-50 p-3 text-sm">
                          <div className="flex justify-between gap-3"><p className="font-medium text-neutral-800">{item.servico_nome}</p><p className="font-bold text-amber-700">{item.sessoes_total - item.sessoes_consumidas} restantes</p></div>
                          {item.data_validade && <p className="mt-1 text-xs text-neutral-500">Validade: {formatDate(item.data_validade)}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Fechar</button>
          <Link href={`/admin/clientes/${clienteId}`} onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
            Abrir perfil completo <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
