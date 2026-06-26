'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { verificarPacoteAtivo, debitarSessaoPacote, type PacoteAtivo } from '@/services/pacotes';
import { X, User, Scissors, Clock, Search, Calendar, ChevronDown, Gift, ShoppingBag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professionalId: string;
  professionalColor: string;
  date: string;
  time: string;
  professionals: { id: string; name: string; color: string }[];
}

interface Cliente { id: string; nome: string; telefone?: string; }
interface Servico { id: string; nome: string; duracao_minutos: number; preco?: number; pacoteClienteId?: string; }
interface Produto { id: string; nome: string; preco?: number; quantidade?: number; }
interface ItemProduto { id: string; nome: string; preco: number; quantidade: number; }

export default function NovoAgendamentoModal({
  isOpen, onClose, onSuccess,
  professionalId, professionalColor, date, time, professionals,
}: Props) {
  const [profId, setProfId] = useState(professionalId);
  const [horaInicio, setHoraInicio] = useState(time);
  const [searchCliente, setSearchCliente] = useState('');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [clienteDropdown, setClienteDropdown] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingC, setLoadingC] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosSel, setServicosSel] = useState<Servico[]>([]);
  const [servicoOpen, setServicosOpen] = useState(false);
  const [searchS, setSearchS] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [pacotesAtivos, setPacotesAtivos] = useState<PacoteAtivo[]>([]);
  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itensProduto, setItensProduto] = useState<ItemProduto[]>([]);
  const [produtoOpen, setProdutoOpen] = useState(false);
  const [searchP, setSearchP] = useState('');
  const clienteRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) return;
    setProfId(professionalId);
    setHoraInicio(time);
    setSearchCliente(''); setClienteSel(null); setServicosSel([]);
    setObservacoes(''); setClienteDropdown(false); setServicosOpen(false);
    setPacotesAtivos([]);
    setItensProduto([]); setProdutoOpen(false); setSearchP('');
    supabase.from('servicos').select('id,nome,duracao_minutos,preco').eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setServicos(data); });
    supabase.from('produtos').select('id,nome,preco').in('tipo', ['venda', 'revenda']).eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setProdutos(data || []); });
    setTimeout(() => clienteRef.current?.focus(), 120);
  }, [isOpen, professionalId, time]);

  useEffect(() => {
    if (!clienteSel?.id) { setPacotesAtivos([]); return; }
    verificarPacoteAtivo(Number(clienteSel.id)).then(setPacotesAtivos).catch(() => setPacotesAtivos([]));
  }, [clienteSel]);

  const usarSessaoPacote = (pacote: PacoteAtivo) => {
    const srv = servicos.find(s => s.id === pacote.servico_id);
    if (!srv) return;
    if (servicosSel.some(s => s.id === srv.id && s.pacoteClienteId === pacote.id)) return;
    setServicosSel(p => [...p, { ...srv, preco: 0, pacoteClienteId: pacote.id }]);
  };

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setClientes([]); return; }
    setLoadingC(true);
    const { data } = await supabase.from('clientes').select('id,nome,telefone').ilike('nome', `%${q}%`).limit(8);
    setClientes(data || []); setLoadingC(false);
  }, []);

  const onSearchChange = (v: string) => {
    setSearchCliente(v); setClienteSel(null); setClienteDropdown(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => buscar(v), 300);
  };

  const toggle = (s: Servico) =>
    setServicosSel(p => p.find(x => x.id === s.id) ? p.filter(x => x.id !== s.id) : [...p, s]);

  const duracao = servicosSel.reduce((a, s) => a + s.duracao_minutos, 0) || 60;

  const horaFim = (): string => {
    const [h, m] = horaInicio.split(':').map(Number);
    const t = h * 60 + m + duracao;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`;
  };

  const salvar = async () => {
    if (!searchCliente.trim()) { alert('Informe o cliente'); return; }
    setSaving(true);
    try {
      // 1. Criar o agendamento
      const { data: novoAg, error: agError } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: clienteSel?.id || null,
          cliente_nome: clienteSel?.nome || searchCliente.trim(),
          profissional_id: profId,
          data_agendamento: date,
          hora_inicio: horaInicio + ':00',
          hora_fim: horaFim(),
          status: 'agendado',
          servicos: JSON.stringify(servicosSel.map(s => ({ id: s.id, nome: s.nome, duracao_minutos: s.duracao_minutos, preco: s.preco ?? 0 }))),
          duracao_total: duracao,
          observacoes: observacoes || null,
        }])
        .select()
        .single();
      if (agError) throw agError;

      // 2. Criar a comanda vinculada ao agendamento
      const totalServicos = servicosSel.reduce((sum, s) => sum + (s.preco ?? 0), 0);
      const { data: novaComanda, error: cmdError } = await supabase
        .from('comandas')
        .insert([{
          cliente_id: clienteSel?.id || null,
          cliente_nome: clienteSel?.nome || searchCliente.trim(),
          profissional_id: profId,
          data_agendamento: date,
          hora_inicio: horaInicio,
          status: 'aberta',
          total: totalServicos,
          observacoes: observacoes || null,
        }])
        .select()
        .single();
      if (cmdError) throw cmdError;

      // 3. Criar os itens da comanda (serviços + produtos)
      const itensServico = servicosSel.map(s => ({
        comanda_id: novaComanda.id,
        tipo: 'servico' as const,
        item_id: String(s.id),
        descricao: s.pacoteClienteId ? s.nome + ' (Sessão de Pacote)' : s.nome,
        quantidade: 1,
        valor_unitario: s.preco ?? 0,
        valor_total: s.preco ?? 0,
        profissional_id: profId,
      }));
      const itensProd = itensProduto.map(p => ({
        comanda_id: novaComanda.id,
        tipo: 'produto' as const,
        item_id: String(p.id),
        descricao: p.nome,
        quantidade: p.quantidade,
        valor_unitario: p.preco,
        valor_total: p.preco * p.quantidade,
        profissional_id: profId,
      }));
      const todosItens = [...itensServico, ...itensProd];
      if (todosItens.length > 0 && novaComanda) {
        const { error: itensError } = await supabase.from('comanda_itens').insert(todosItens);
        if (itensError) console.warn('Aviso: erro ao criar itens da comanda:', itensError.message);
      }

      // 4. Vincular comanda ao agendamento
      await supabase
        .from('agendamentos')
        .update({ comanda_id: novaComanda.id, status: 'em_andamento' })
        .eq('id', novoAg.id);

      // 5. Debitar sessões de pacotes usados
      const itensPacote = servicosSel.filter(s => s.pacoteClienteId);
      for (const item of itensPacote) {
        try { await debitarSessaoPacote(item.pacoteClienteId!); } catch (e) { console.error('Erro ao debitar sessão:', e); }
      }

      onSuccess(); onClose();
    } catch (e: any) { alert('Erro: ' + e.message); }
    finally { setSaving(false); }
  };


  const profSel = professionals.find(p => p.id === profId);
  const cor = profSel?.color || professionalColor || '#6366F1';
  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(searchS.toLowerCase()));
  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(searchP.toLowerCase()));
  const dataFormatada = (() => {
    try { return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch { return date; }
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${cor}ee, ${cor}99)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 opacity-80" />
              <div>
                <h2 className="font-bold text-lg leading-none">Novo Agendamento</h2>
                <p className="text-white/80 text-sm mt-0.5">{dataFormatada} · {horaInicio}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Profissional */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Profissional</label>
            <div className="relative">
              <select value={profId} onChange={e => setProfId(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              <Clock className="inline w-3.5 h-3.5 mr-1" />Horário
            </label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Cliente */}
          <div className="relative">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              <User className="inline w-3.5 h-3.5 mr-1" />Cliente *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input ref={clienteRef} type="text" value={searchCliente}
                onChange={e => onSearchChange(e.target.value)}
                onFocus={() => searchCliente.length >= 2 && setClienteDropdown(true)}
                placeholder="Buscar ou digitar nome..."
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {clienteSel && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full" />}
            </div>
            {clienteDropdown && (clientes.length > 0 || loadingC) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                {loadingC
                  ? <div className="p-3 text-center text-sm text-neutral-500">Buscando...</div>
                  : clientes.map(c => (
                    <button key={c.id} onClick={() => { setClienteSel(c); setSearchCliente(c.nome); setClienteDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors">
                      <div className="text-sm font-medium text-neutral-900">{c.nome}</div>
                      {c.telefone && <div className="text-xs text-neutral-500">{c.telefone}</div>}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              <Scissors className="inline w-3.5 h-3.5 mr-1" />Serviços
              {servicosSel.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {servicosSel.length} · {duracao}min
                </span>
              )}
            </label>
            {servicosSel.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {servicosSel.map(s => (
                  <span key={s.id + (s.pacoteClienteId ?? '')} onClick={() => toggle(s)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                      s.pacoteClienteId
                        ? 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100'
                        : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
                    }`}>
                    {s.pacoteClienteId && <Gift className="w-3 h-3" />}
                    {s.nome} <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setServicosOpen(!servicoOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-xl text-sm hover:border-neutral-300 transition-colors">
              <span className="text-neutral-500">{servicosSel.length === 0 ? 'Selecionar serviços...' : 'Adicionar mais...'}</span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${servicoOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicoOpen && (
              <div className="mt-1 border border-neutral-200 rounded-xl overflow-hidden shadow-md">
                <div className="p-2 border-b border-neutral-100">
                  <input type="text" value={searchS} onChange={e => setSearchS(e.target.value)}
                    placeholder="Filtrar serviços..." className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none" />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {servicosFiltrados.map(s => {
                    const sel = !!servicosSel.find(x => x.id === s.id);
                    return (
                      <button key={s.id} onClick={() => toggle(s)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50 border-b border-neutral-50 last:border-0 transition-colors ${sel ? 'bg-blue-50' : ''}`}>
                        <span className="text-sm font-medium">{s.nome} <span className="text-neutral-400 font-normal">{s.duracao_minutos}min</span></span>
                        {sel && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Produtos */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              <ShoppingBag className="inline w-3.5 h-3.5 mr-1" />Produtos
              {itensProduto.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {itensProduto.length} item(ns)
                </span>
              )}
            </label>
            {itensProduto.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {itensProduto.map(p => (
                  <span key={p.id}
                    onClick={() => setItensProduto(prev => prev.filter(x => x.id !== p.id))}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer bg-green-50 border border-green-200 text-green-800 hover:bg-green-100">
                    {p.nome} ×{p.quantidade} <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setProdutoOpen(!produtoOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-xl text-sm hover:border-neutral-300 transition-colors">
              <span className="text-neutral-500">{itensProduto.length === 0 ? 'Adicionar produto (opcional)...' : 'Adicionar mais...'}</span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${produtoOpen ? 'rotate-180' : ''}`} />
            </button>
            {produtoOpen && (
              <div className="mt-1 border border-neutral-200 rounded-xl overflow-hidden shadow-md">
                <div className="p-2 border-b border-neutral-100">
                  <input type="text" value={searchP} onChange={e => setSearchP(e.target.value)}
                    placeholder="Filtrar produtos..." className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none" />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {produtosFiltrados.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => {
                        setItensProduto(prev => {
                          const exists = prev.find(x => x.id === p.id);
                          if (exists) return prev.map(x => x.id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x);
                          return [...prev, { id: p.id, nome: p.nome, preco: p.preco ?? 0, quantidade: 1 }];
                        });
                        setProdutoOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50 border-b border-neutral-50 last:border-0 transition-colors">
                      <span className="text-sm font-medium">{p.nome}</span>
                      <span className="text-xs text-neutral-400">R$ {Number(p.preco ?? 0).toFixed(2)}</span>
                    </button>
                  ))}
                  {produtosFiltrados.length === 0 && (
                    <div className="px-4 py-3 text-sm text-neutral-400">Nenhum produto encontrado</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pacotes do Cliente */}
          {pacotesAtivos.length > 0 && (
            <div className="border border-green-200 rounded-xl overflow-hidden">
              <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Pacotes disponíveis</span>
              </div>
              <div className="divide-y divide-green-50 bg-white">
                {pacotesAtivos.map(pacote => (
                  <div key={pacote.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{pacote.servico_nome}</p>
                      <p className="text-xs text-neutral-500">
                        <span className="font-semibold text-green-600">{pacote.sessoes_restantes}</span> sessão{pacote.sessoes_restantes !== 1 ? 'ões' : ''} disponível{pacote.sessoes_restantes !== 1 ? 'is' : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => usarSessaoPacote(pacote)}
                      className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors">
                      + Usar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              placeholder="Opcional..." rows={2}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs font-medium text-neutral-600">
            {`⏱ ${horaInicio} → ${horaFim().slice(0, 5)} (${duracao}min)`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancelar</button>
            <button onClick={salvar} disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: cor }}>
              {saving ? 'Agendando...' : 'Agendar ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
