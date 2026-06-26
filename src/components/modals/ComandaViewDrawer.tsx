'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Clock, Scissors, ShoppingBag, Package, MapPin, DollarSign, Lock, Percent, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_UNIT_ID } from '@/services/caixa';
import { registrarCompraPacote, debitarSessaoPorServico, verificarPacoteAtivo, debitarSessaoPacote } from '@/services/pacotes';
import type { PacoteAtivo } from '@/services/pacotes';
import { toast } from 'sonner';

interface ComandaViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId?: number;
  onEdit?: () => void;
  /** Chamado especificamente ao excluir/cancelar uma comanda, antes de onClose */
  onDelete?: () => void;
}

interface ComissaoEntry {
  profissional_id: string;
  nome: string;
  valor_sugerido: number;
  valor: number;
}

export default function ComandaViewDrawer({ isOpen, onClose, comandaId, onEdit, onDelete }: ComandaViewDrawerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comanda, setComanda] = useState<any>(null);
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [fechandoComanda, setFechandoComanda] = useState(false);

  // R6: estados para adição dinâmica de itens
  const [addItemMenuOpen, setAddItemMenuOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<'servico' | 'produto' | 'pacote' | null>(null);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<any[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([]);
  const [pacotesAtivosDisponiveis, setPacotesAtivosDisponiveis] = useState<PacoteAtivo[]>([]);
  const [addingItem, setAddingItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQtd, setItemQtd] = useState(1);

  // T-07: comissões e desconto auditado
  const [comissoes, setComissoes] = useState<ComissaoEntry[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [caixaFechado, setCaixaFechado] = useState(false);

  const subtotalComanda = comanda?.comanda_itens && comanda.comanda_itens.length > 0
    ? comanda.comanda_itens.reduce((sum: number, item: { valor_total?: string | number }) => sum + Number(item.valor_total || 0), 0)
    : Number(comanda?.subtotal || comanda?.total || 0);

  useEffect(() => {
    if (isOpen && comandaId) {
      console.log('🔵 Drawer aberto com comandaId:', comandaId, 'Tipo:', typeof comandaId);
      loadComanda();
    } else {
      console.log('🔴 Drawer sem comandaId:', { isOpen, comandaId });
      setComanda(null);
      // Reset R6 states
      setAddItemMenuOpen(false);
      setAddItemType(null);
      setSelectedItemId('');
      setItemQtd(1);
    }
  }, [isOpen, comandaId]);

  const loadComanda = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando comanda ID:', comandaId, 'Tipo:', typeof comandaId);
      
      // Primeiro, carregar a comanda básica
      const { data: comandaData, error: comandaError } = await (supabase as any)
        .from('comandas')
        .select('*')
        .eq('id', comandaId)
        .single();

      if (comandaError) {
        console.error('❌ Erro Supabase (comanda):', comandaError);
        console.error('❌ Detalhes do erro:', {
          message: comandaError.message,
          details: comandaError.details,
          hint: comandaError.hint,
          code: comandaError.code,
        });
        throw comandaError;
      }
      
      if (!comandaData) {
        console.warn('⚠️ Nenhuma comanda encontrada com ID:', comandaId);
        return;
      }
      
      console.log('✅ Comanda básica carregada:', comandaData);
      
      // Carregar itens da comanda
      const { data: itens, error: itensError } = await (supabase as any)
        .from('comanda_itens')
        .select('*')
        .eq('comanda_id', comandaId);
      
      if (itensError) {
        console.error('❌ Erro ao carregar itens:', itensError);
      }
      
      console.log('📦 Itens carregados:', itens);
      
      // Carregar dados do cliente
      let cliente = null;
      if (comandaData.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('nome, telefone, email, cpf')
          .eq('id', comandaData.cliente_id)
          .single();
        cliente = clienteData;
      }
      
      // Carregar dados do profissional
      let profissional = null;
      if (comandaData.profissional_id) {
        const { data: profData } = await supabase
          .from('profissionais')
          .select('nome, telefone, percentual_comissao')
          .eq('id', comandaData.profissional_id)
          .single();
        profissional = profData;
      }
      
      // Carregar dados do auxiliar
      let auxiliar = null;
      if (comandaData.auxiliar_id) {
        const { data: auxData } = await supabase
          .from('profissionais')
          .select('nome, percentual_comissao')
          .eq('id', comandaData.auxiliar_id)
          .single();
        auxiliar = auxData;
      }
      
      // Carregar etapas dos itens se existirem
      const itensComEtapas = await Promise.all(
        (itens || []).map(async (item: any) => {
          const { data: etapas } = await supabase
            .from('comanda_item_etapas')
            .select('*')
            .eq('comanda_item_id', item.id)
            .order('ordem');
          
          // Carregar dados dos profissionais das etapas
          const etapasComProfs = await Promise.all(
            (etapas || []).map(async (etapa: any) => {
              let profEtapa = null;
              let auxEtapa = null;
              
              if (etapa.profissional_id) {
                const { data } = await supabase
                  .from('profissionais')
                  .select('nome')
                  .eq('id', etapa.profissional_id)
                  .single();
                profEtapa = data;
              }
              
              if (etapa.auxiliar_id) {
                const { data } = await supabase
                  .from('profissionais')
                  .select('nome')
                  .eq('id', etapa.auxiliar_id)
                  .single();
                auxEtapa = data;
              }
              
              return {
                ...etapa,
                profissional: profEtapa,
                auxiliar: auxEtapa,
              };
            })
          );
          
          return {
            ...item,
            etapas: etapasComProfs,
          };
        })
      );
      
      const comandaCompleta = {
        ...comandaData,
        cliente,
        profissional,
        auxiliar,
        comanda_itens: itensComEtapas,
      };
      
      console.log('✅ Comanda completa montada:', comandaCompleta);
      setComanda(comandaCompleta);

      // T-07: inicializar desconto e comissões sugeridas
      setDesconto(Number(comandaData.desconto) || 0);

      const servicosTotal = (itensComEtapas ?? []).reduce(
        (s: number, i: any) => i.tipo === 'servico' ? s + (Number(i.valor_total) || 0) : s, 0,
      );

      const entries: ComissaoEntry[] = [];
      if (comandaData.profissional_id && profissional) {
        const pct = Number((profissional as any).percentual_comissao) || 0;
        entries.push({
          profissional_id: comandaData.profissional_id,
          nome: (profissional as any).nome ?? 'Profissional',
          valor_sugerido: parseFloat(((pct / 100) * servicosTotal).toFixed(2)),
          valor: parseFloat(((pct / 100) * servicosTotal).toFixed(2)),
        });
      }
      if (comandaData.auxiliar_id && auxiliar) {
        const pct = Number((auxiliar as any).percentual_comissao) || 0;
        entries.push({
          profissional_id: comandaData.auxiliar_id,
          nome: (auxiliar as any).nome ?? 'Auxiliar',
          valor_sugerido: parseFloat(((pct / 100) * servicosTotal).toFixed(2)),
          valor: parseFloat(((pct / 100) * servicosTotal).toFixed(2)),
        });
      }
      setComissoes(entries);

      // T-07: verificar se caixa está fechado para a data da comanda
      const dataComanda = (comandaData.data_abertura ?? '').split('T')[0];
      if (dataComanda) {
        const { data: fechamento } = await (supabase as any)
          .from('fechamentos_caixa')
          .select('id, status')
          .eq('data_fechamento', dataComanda)
          .eq('status', 'fechado')
          .maybeSingle();
        setCaixaFechado(!!fechamento);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar comanda:', err);
      console.error('❌ Stack:', err instanceof Error ? err.stack : 'N/A');
      console.error('❌ Tipo do erro:', typeof err);
    } finally {
      setLoading(false);
    }
  };

  // R6: funções de carga de dados para adição dinâmica
  const loadServicos = async () => {
    try {
      const { data } = await supabase
        .from('servicos')
        .select('id, nome, preco')
        .eq('ativo', true)
        .order('nome');
      setServicosDisponiveis(data || []);
    } catch (err) {
      console.error('[R6] Erro ao carregar serviços:', err);
    }
  };

  const loadProdutosVenda = async () => {
    try {
      const { data } = await (supabase as any)
        .from('produtos')
        .select('id, nome, preco')
        .eq('tipo', 'revenda')
        .eq('ativo', true)
        .order('nome');
      setProdutosDisponiveis(data || []);
    } catch (err) {
      console.error('[R6] Erro ao carregar produtos:', err);
    }
  };

  const loadPacotesAtivos = async (clienteId: number) => {
    try {
      const ativos = await verificarPacoteAtivo(clienteId);
      setPacotesAtivosDisponiveis(ativos);
    } catch (err) {
      console.error('[R6] Erro ao carregar pacotes ativos:', err);
    }
  };

  const abrirAddItem = async (tipo: 'servico' | 'produto' | 'pacote') => {
    setAddItemType(tipo);
    setSelectedItemId('');
    setItemQtd(1);
    // Carrega dados sob demanda
    if (tipo === 'servico' && servicosDisponiveis.length === 0) await loadServicos();
    if (tipo === 'produto' && produtosDisponiveis.length === 0) await loadProdutosVenda();
    if (tipo === 'pacote' && pacotesAtivosDisponiveis.length === 0 && comanda?.cliente_id) {
      await loadPacotesAtivos(comanda.cliente_id);
    }
  };

  const adicionarItem = async () => {
    if (!selectedItemId || !comanda) return;
    setAddingItem(true);
    try {
      let novoItemPayload: Record<string, any> | null = null;

      if (addItemType === 'servico') {
        const svc = servicosDisponiveis.find((s) => s.id === selectedItemId);
        if (!svc) throw new Error('Serviço não encontrado');
        novoItemPayload = {
          comanda_id: comanda.id,
          tipo: 'servico',
          item_id: svc.id,
          descricao: svc.nome,
          quantidade: itemQtd,
          valor_unitario: Number(svc.preco) || 0,
          valor_total: (Number(svc.preco) || 0) * itemQtd,
        };
      } else if (addItemType === 'produto') {
        const prod = produtosDisponiveis.find((p) => p.id === selectedItemId);
        if (!prod) throw new Error('Produto não encontrado');
        novoItemPayload = {
          comanda_id: comanda.id,
          tipo: 'produto',
          item_id: prod.id,
          descricao: prod.nome,
          quantidade: itemQtd,
          valor_unitario: Number(prod.preco) || 0,
          valor_total: (Number(prod.preco) || 0) * itemQtd,
        };
      } else if (addItemType === 'pacote') {
        const pac = pacotesAtivosDisponiveis.find((p) => p.id === selectedItemId);
        if (!pac) throw new Error('Pacote não encontrado');
        // Debitar 1 sessão do pacote do cliente
        const debitou = await debitarSessaoPacote(pac.id);
        if (!debitou) {
          toast.error('Não foi possível debitar sessão: saldo esgotado ou pacote inválido.');
          setAddingItem(false);
          return;
        }
        novoItemPayload = {
          comanda_id: comanda.id,
          tipo: 'pacote',
          item_id: pac.id,
          descricao: pac.servico_nome + ' (Sessão de Pacote)',
          quantidade: itemQtd,
          valor_unitario: 0,
          valor_total: 0,
        };
      }

      if (!novoItemPayload) return;

      // Inserir item na comanda
      const { error: insertErr } = await (supabase as any)
        .from('comanda_itens')
        .insert([novoItemPayload]);
      if (insertErr) throw insertErr;

      // Recalcular subtotal buscando todos os itens atualizados
      const { data: itensAtualizados } = await (supabase as any)
        .from('comanda_itens')
        .select('valor_total')
        .eq('comanda_id', comanda.id);

      const novoSubtotal = (itensAtualizados || []).reduce(
        (sum: number, item: { valor_total?: string | number }) => sum + Number(item.valor_total || 0),
        0,
      );

      // Atualizar subtotal e total na comanda
      await (supabase as any)
        .from('comandas')
        .update({ subtotal: novoSubtotal, total: Math.max(0, novoSubtotal - (Number(comanda.desconto) || 0)) })
        .eq('id', comanda.id);

      toast.success('Item adicionado com sucesso!');
      // Fechar painel e recarregar
      setAddItemMenuOpen(false);
      setAddItemType(null);
      setSelectedItemId('');
      setItemQtd(1);
      // Forçar recarga de pacotes ativos se tipo pacote (saldo mudou)
      if (addItemType === 'pacote' && comanda?.cliente_id) {
        setPacotesAtivosDisponiveis([]);
      }
      await loadComanda();
    } catch (err: any) {
      console.error('[R6] Erro ao adicionar item:', err);
      toast.error(`Erro ao adicionar item: ${err?.message || 'Tente novamente'}`);
    } finally {
      setAddingItem(false);
    }
  };

  const fecharComanda = async () => {
    console.log('[fecharComanda] INÍCIO — status:', comanda?.status, 'id:', comanda?.id);
    if (!comanda || comanda.status !== 'aberta') {
      console.warn('[fecharComanda] SAINDO CEDO — comanda ausente ou status não é aberta:', comanda?.status);
      return;
    }
    try {
      setFechandoComanda(true);

      const descontoNum = Math.max(0, Number(desconto) || 0);
      const subtotalFinal = (comanda.comanda_itens || []).reduce(
        (sum: number, item: { valor_total?: string | number }) => sum + Number(item.valor_total || 0), 0,
      );
      const totalFinal = Math.max(0, subtotalFinal - descontoNum);

      const updatePayload: Record<string, any> = {
        status: 'fechada',
        data_fechamento: new Date().toISOString(),
        fechado_por: user?.id ?? null,
        subtotal: subtotalFinal,
        desconto: descontoNum,
        total: totalFinal,
      };

      if (descontoNum > 0) {
        updatePayload.desconto_aplicado_por = user?.id ?? null;
        updatePayload.desconto_aplicado_em = new Date().toISOString();
      } else {
        updatePayload.desconto_aplicado_por = null;
        updatePayload.desconto_aplicado_em = null;
      }

      console.log('[fecharComanda] Chamando supabase.update …');
      const { error: cmdError } = await (supabase as any)
        .from('comandas')
        .update(updatePayload)
        .eq('id', comanda.id);

      console.log('[fecharComanda] update retornou — cmdError:', cmdError);
      if (cmdError) {
        console.error('[fecharComanda] cmdError LANÇADO:', cmdError);
        throw cmdError;
      }

      // PASSO CRÍTICO: registrar transação financeira IMEDIATAMENTE após fechar comanda
      console.log('[fecharComanda] totalFinal calculado:', totalFinal, '— chamando fetch …');
      const hoje = new Date().toISOString().split('T')[0];
      const transResp = await fetch('/api/admin/fechar-comanda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comanda_id: comanda.id,
          metodo_pagamento: metodoPagamento,
          descricao: `Comanda #${comanda.numero_comanda}${comanda.cliente_nome ? ' — ' + comanda.cliente_nome : ''}`,
          valor: totalFinal,
          data: hoje,
        }),
      });
      if (!transResp.ok) {
        const transBody = await transResp.json().catch(() => ({}));
        console.error('[fecharComanda] transResp não ok:', transResp.status, transBody);
        throw new Error(transBody.error || `Erro HTTP ${transResp.status} ao registrar transação`);
      }
      console.log('[fecharComanda] transação registrada com sucesso');

      // Comissões — em try/catch isolado para não bloquear o fechamento
      try {
        if (comissoes.length > 0 && user?.id) {
          const rows = comissoes
            .filter((c) => c.valor >= 0)
            .map((c) => ({
              comanda_id: comanda.id,
              profissional_id: c.profissional_id,
              valor_comissao: c.valor,
              criado_por: user.id,
            }));
          if (rows.length > 0) {
            await (supabase as any).from('comissoes').insert(rows);
          }
        }
      } catch {
        // Comissões não bloqueiam o fechamento
      }

      // Estoque — em try/catch isolado
      try {
        const itensProduto = (comanda.comanda_itens || []).filter(
          (item: any) => item.tipo === 'produto' && item.item_id
        );
        for (const item of itensProduto) {
          const { data: prod } = await supabase
            .from('produtos')
            .select('quantidade')
            .eq('id', item.item_id)
            .single();
          if (prod !== null) {
            await (supabase as any).from('estoque_movimentacoes').insert([{
              produto_id: item.item_id,
              tipo: 'venda',
              quantidade: Math.round(item.quantidade || 1),
              quantidade_anterior: prod.quantidade,
              quantidade_atual: prod.quantidade,
              valor_unitario: item.valor_unitario || 0,
              valor_total: item.valor_total || 0,
              motivo: `Fechamento Comanda #${comanda.numero_comanda}`,
            }]);
          }
        }
      } catch {
        // Ignora se tabela estoque_movimentacoes não existir
      }

      // Pacotes pré-pagos — em try/catch isolado para não bloquear o fechamento
      try {
        const itensPacote = (comanda.comanda_itens || []).filter(
          (item: any) => item.tipo === 'pacote' && item.item_id,
        );
        if (itensPacote.length > 0 && comanda.cliente_id) {
          await registrarCompraPacote({
            comandaId: comanda.id,
            clienteId: comanda.cliente_id,
            clienteCpf: comanda.cliente?.cpf ?? null,
            itensPacote: itensPacote.map((i: any) => ({ item_id: i.item_id, quantidade: i.quantidade || 1 })),
            unitId: DEFAULT_UNIT_ID,
          });
        }

        // Nota: débito de sessões acontece ao CRIAR a comanda (ComandaModal, via pacote_cliente_id)
        //       Aqui registramos apenas a COMPRA de pacotes (tipo='pacote') ao fechar/pagar.
      } catch (err) {
        console.error('Erro ao processar pacotes:', err);
      }

      toast.success(`Comanda #${comanda.numero_comanda} fechada com sucesso!`);
      await loadComanda();
    } catch (err: any) {
      console.error('[fecharComanda] ERRO CAPTURADO:', err?.message, err);
      toast.error(`Erro ao fechar comanda: ${err?.message || 'Tente novamente'}`);
    } finally {
      setFechandoComanda(false);
    }
  };

  const cancelarComanda = async () => {
    if (!comanda || !confirm(`Cancelar comanda #${comanda.numero_comanda}? Ela ficará no histórico como cancelada.`)) return;
    try {
      const { error } = await (supabase as any)
        .from('comandas')
        .update({ status: 'cancelada' })
        .eq('id', comanda.id);
      if (error) throw error;

      // Excluir o agendamento associado (se houver) para refletir no calendário
      await (supabase as any)
        .from('agendamentos')
        .delete()
        .eq('comanda_id', comanda.id);

      toast.success(`Comanda #${comanda.numero_comanda} cancelada e agendamento excluído.`);
      // Notifica o pai sobre exclusão/cancelamento ANTES de fechar o drawer
      onDelete?.();
      onClose();
    } catch (err: any) {
      toast.error(`Erro ao cancelar: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      aberta: { variant: 'warning', label: 'Aberta' },
      fechada: { variant: 'success', label: 'Fechada' },
      cancelada: { variant: 'danger', label: 'Cancelada' },
    };
    return badges[status] || badges.aberta;
  };

  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'servico': return <Scissors className="w-4 h-4 text-blue-500" />;
      case 'produto': return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case 'pacote': return <Package className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Comanda #{comanda?.numero_comanda || '...'}</h2>
              <p className="text-blue-100 text-sm mt-1">Detalhes do atendimento</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {comanda && (
            <Badge 
              variant={getStatusBadge(comanda.status).variant}
              className="text-sm"
            >
              {getStatusBadge(comanda.status).label}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : comanda ? (
            <>
              {/* Informações do Cliente */}
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-600 w-20">Nome:</span>
                    <span className="font-medium">
                      {comanda.cliente?.nome || 'Não informado'}
                    </span>
                  </div>
                  {comanda.cliente?.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-600">
                        {comanda.cliente.telefone}
                      </span>
                    </div>
                  )}
                  {comanda.cliente?.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 text-xs">
                        {comanda.cliente.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profissional e Agendamento */}
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Atendimento
                </h3>
                <div className="space-y-2 text-sm">
                  {comanda.profissional?.nome && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 w-24">Profissional:</span>
                      <span className="font-medium">{comanda.profissional.nome}</span>
                    </div>
                  )}
                  {comanda.auxiliar?.nome && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 w-24">Auxiliar:</span>
                      <span className="font-medium">{comanda.auxiliar.nome}</span>
                    </div>
                  )}
                  {comanda.data_agendamento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-600">
                        {new Date(comanda.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {comanda.hora_inicio && (
                        <>
                          <Clock className="w-4 h-4 text-neutral-400 ml-2" />
                          <span className="text-neutral-600">{comanda.hora_inicio.substring(0, 5)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Itens da Comanda */}
              <div>
                {/* R6: Header de Itens com botão adicionar */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-neutral-900">
                    Itens ({comanda.comanda_itens?.length || 0})
                  </h3>
                  {comanda.status === 'aberta' && !addItemMenuOpen && (
                    <button
                      onClick={() => setAddItemMenuOpen(true)}
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow transition-colors"
                      title="Adicionar item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* R6: Painel inline de adição de item */}
                {comanda.status === 'aberta' && addItemMenuOpen && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-sm font-semibold text-blue-800">Adicionar item à comanda</p>

                    {/* Seleção de tipo */}
                    {!addItemType && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => abrirAddItem('servico')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Scissors className="w-4 h-4" /> + Serviço
                        </button>
                        <button
                          onClick={() => abrirAddItem('produto')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" /> + Produto
                        </button>
                        <button
                          onClick={() => abrirAddItem('pacote')}
                          disabled={!comanda.cliente_id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                          title={!comanda.cliente_id ? 'Comanda sem cliente vinculado' : ''}
                        >
                          <Package className="w-4 h-4" /> + Pacote
                        </button>
                      </div>
                    )}

                    {/* Form de seleção após escolher tipo */}
                    {addItemType && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {addItemType === 'servico' && <Scissors className="w-4 h-4 text-blue-600" />}
                          {addItemType === 'produto' && <ShoppingBag className="w-4 h-4 text-green-600" />}
                          {addItemType === 'pacote' && <Package className="w-4 h-4 text-purple-600" />}
                          <span className="text-sm font-medium text-neutral-700 capitalize">
                            {addItemType === 'servico' ? 'Serviço' : addItemType === 'produto' ? 'Produto' : 'Pacote (crédito)'}
                          </span>
                          <button
                            onClick={() => setAddItemType(null)}
                            className="ml-auto text-xs text-neutral-500 hover:text-neutral-700 underline"
                          >
                            trocar tipo
                          </button>
                        </div>

                        {/* Select do item */}
                        {addItemType === 'servico' && (
                          <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione um serviço...</option>
                            {servicosDisponiveis.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nome} — R$ {Number(s.preco || 0).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        )}

                        {addItemType === 'produto' && (
                          <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Selecione um produto...</option>
                            {produtosDisponiveis.length === 0 && (
                              <option disabled>Nenhum produto para revenda disponível</option>
                            )}
                            {produtosDisponiveis.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} — R$ {Number(p.preco || 0).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        )}

                        {addItemType === 'pacote' && (
                          <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Selecione um pacote ativo...</option>
                            {pacotesAtivosDisponiveis.length === 0 && (
                              <option disabled>Nenhum pacote ativo com saldo para este cliente</option>
                            )}
                            {pacotesAtivosDisponiveis.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.servico_nome} ({p.sessoes_restantes}/{p.sessoes_total} sessões)
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Quantidade */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-neutral-600 shrink-0">Qtd:</label>
                          <input
                            type="number"
                            min={1}
                            max={addItemType === 'pacote' ? 1 : 99}
                            value={itemQtd}
                            onChange={(e) => setItemQtd(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {addItemType === 'pacote' && (
                            <span className="text-xs text-neutral-500">(1 sessão por uso de pacote)</span>
                          )}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          <button
                            onClick={adicionarItem}
                            disabled={!selectedItemId || addingItem}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {addingItem ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Adicionando...
                              </>
                            ) : (
                              <><Plus className="w-4 h-4" /> Adicionar</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setAddItemMenuOpen(false);
                              setAddItemType(null);
                              setSelectedItemId('');
                              setItemQtd(1);
                            }}
                            disabled={addingItem}
                            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {comanda.comanda_itens?.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="flex flex-col gap-2 p-3 bg-white border border-neutral-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getItemIcon(item.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900 text-sm">
                                {item.quantidade}x {item.descricao}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {item.tipo === 'servico' ? 'Serviço' : item.tipo === 'produto' ? 'Produto' : 'Pacote'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-neutral-900">
                                R$ {item.valor_total?.toFixed(2) || '0.00'}
                              </p>
                              {item.quantidade > 1 && (
                                <p className="text-xs text-neutral-500">
                                  R$ {item.valor_unitario?.toFixed(2)}/un
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Etapas do item */}
                      {item.etapas && item.etapas.length > 0 && (
                        <div className="pl-9 pt-2 border-t border-neutral-100">
                          <p className="text-xs font-semibold text-blue-600 mb-2">⚙️ Etapas ({item.etapas.length})</p>
                          <div className="space-y-1">
                            {item.etapas.map((etapa: any, etapaIdx: number) => (
                              <div key={etapaIdx} className="flex items-center gap-2 text-xs">
                                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold shrink-0">
                                  {etapa.ordem}
                                </span>
                                <span className="text-neutral-700 flex-1">{etapa.nome}</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-neutral-600">{etapa.duracao_minutos}min</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-blue-600 font-medium">
                                  {etapa.auxiliar ? '🤝' : '👤'} {etapa.profissional?.nome || etapa.auxiliar?.nome || 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!comanda.comanda_itens || comanda.comanda_itens.length === 0) && (
                    <p className="text-center text-neutral-500 py-8 text-sm">
                      Nenhum item adicionado
                    </p>
                  )}
                </div>
              </div>

              {/* Observações */}
              {comanda.observacoes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-900 mb-2 text-sm">Observações</h3>
                  <p className="text-sm text-neutral-700">{comanda.observacoes}</p>
                </div>
              )}

              {/* Total */}
              <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-600">Subtotal</span>
                  <span className="font-medium text-neutral-700">
                    R$ {subtotalComanda.toFixed(2)}
                  </span>
                </div>
                {((comanda.status === 'fechada' && Number(comanda.desconto) > 0) || (comanda.status === 'aberta' && desconto > 0)) && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-600">Desconto</span>
                    <span className="font-medium text-red-600">
                      - R$ {(comanda.status === 'fechada' ? Number(comanda.desconto) : desconto).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-green-200 mt-2">
                  <span className="text-lg font-semibold text-neutral-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    R$ {comanda.status === 'aberta'
                      ? Math.max(0, subtotalComanda - desconto).toFixed(2)
                      : (comanda.total?.toFixed(2) || '0.00')}
                  </span>
                </div>
              </div>

              {/* T-07: Desconto + Comissões — só para comandas abertas e caixa não fechado */}
              {comanda.status === 'aberta' && !caixaFechado && (
                <>
                  {/* Desconto */}
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      Desconto
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 shrink-0">R$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={desconto}
                        onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0,00"
                      />
                    </div>
                    {desconto > 0 && (
                      <p className="text-xs text-neutral-500">
                        Total com desconto:{' '}
                        <span className="font-semibold text-green-700">
                          R$ {Math.max(0, subtotalComanda - desconto).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Comissões */}
                  {comissoes.length > 0 && (
                    <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-blue-500" />
                        Comissões
                      </h3>
                      <div className="space-y-3">
                        {comissoes.map((entry, idx) => (
                          <div key={`${entry.profissional_id}-${idx}`} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{entry.nome}</p>
                              {entry.valor_sugerido > 0 && (
                                <p className="text-xs text-neutral-500">Sugestão: R$ {entry.valor_sugerido.toFixed(2)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-sm text-neutral-600">R$</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={entry.valor}
                                onChange={(e) => {
                                  const novo = Math.max(0, parseFloat(e.target.value) || 0);
                                  setComissoes((prev) => prev.map((c, i) => i === idx ? { ...c, valor: novo } : c));
                                }}
                                className="w-24 border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Auditoria de desconto — comanda já fechada */}
              {comanda.status === 'fechada' && Number(comanda.desconto) > 0 && comanda.desconto_aplicado_em && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
                  Desconto de R$ {Number(comanda.desconto).toFixed(2)} aplicado em{' '}
                  {new Date(comanda.desconto_aplicado_em).toLocaleString('pt-BR')}
                </div>
              )}

              {/* Caixa fechado — aviso */}
              {caixaFechado && comanda.status === 'aberta' && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <Lock className="w-4 h-4 shrink-0" />
                  Caixa deste dia está fechado — edição bloqueada.
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                {comanda.status === 'aberta' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-1 block">Forma de pagamento</label>
                    <select
                      value={metodoPagamento}
                      onChange={(e) => setMetodoPagamento(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                    </select>
                    <button
                      onClick={fecharComanda}
                      disabled={fechandoComanda}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {fechandoComanda && (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {fechandoComanda ? 'Fechando...' : '✓ Fechar comanda'}
                    </button>
                  </div>
                )}
                <button
                  onClick={cancelarComanda}
                  className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  🗑 Excluir comanda
                </button>
                <div className="flex gap-3">
                  {onEdit && comanda.status === 'aberta' && (
                    <Button
                      onClick={onEdit}
                      variant="primary"
                      className="flex-1"
                    >
                      Editar comanda
                    </Button>
                  )}
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p>Comanda não encontrada</p>
              <p className="text-xs mt-2 text-neutral-400">ID: {comandaId || 'não informado'}</p>
              <p className="text-xs text-neutral-400">Tipo: {typeof comandaId}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
