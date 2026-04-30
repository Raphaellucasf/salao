'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Clock, Scissors, ShoppingBag, Package, MapPin, DollarSign, Lock, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_UNIT_ID } from '@/services/caixa';
import { toast } from 'sonner';

interface ComandaViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId?: number;
  onEdit?: () => void;
}

interface ComissaoEntry {
  profissional_id: string;
  nome: string;
  valor_sugerido: number;
  valor: number;
}

export default function ComandaViewDrawer({ isOpen, onClose, comandaId, onEdit }: ComandaViewDrawerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comanda, setComanda] = useState<any>(null);
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [fechandoComanda, setFechandoComanda] = useState(false);

  // T-07: comissões e desconto auditado
  const [comissoes, setComissoes] = useState<ComissaoEntry[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [caixaFechado, setCaixaFechado] = useState(false);

  useEffect(() => {
    if (isOpen && comandaId) {
      console.log('🔵 Drawer aberto com comandaId:', comandaId, 'Tipo:', typeof comandaId);
      loadComanda();
    } else {
      console.log('🔴 Drawer sem comandaId:', { isOpen, comandaId });
      setComanda(null);
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

  const fecharComanda = async () => {
    console.log('[fecharComanda] INÍCIO — status:', comanda?.status, 'id:', comanda?.id);
    if (!comanda || comanda.status !== 'aberta') {
      console.warn('[fecharComanda] SAINDO CEDO — comanda ausente ou status não é aberta:', comanda?.status);
      return;
    }
    try {
      setFechandoComanda(true);

      const descontoNum = Math.max(0, Number(desconto) || 0);
      const updatePayload: Record<string, any> = {
        status: 'fechada',
        data_fechamento: new Date().toISOString(),
        fechado_por: user?.id ?? null,
      };
      if (descontoNum > 0) {
        updatePayload.desconto = descontoNum;
        updatePayload.desconto_aplicado_por = user?.id ?? null;
        updatePayload.desconto_aplicado_em = new Date().toISOString();
        updatePayload.total = Math.max(0, (Number(comanda.subtotal) || 0) - descontoNum);
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

      // Calcular total final
      const itemsTotal = (comanda.comanda_itens || []).reduce(
        (sum: number, item: any) => sum + Number(item.valor_total || 0), 0,
      );
      const baseTotal = Number(comanda.subtotal || comanda.total || itemsTotal) || 0;
      const totalFinal = descontoNum > 0 ? Math.max(0, baseTotal - descontoNum) : baseTotal;

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

      // Pacotes pré-pagos — em try/catch isolado
      try {
        const itensPacote = (comanda.comanda_itens || []).filter(
          (item: any) => item.tipo === 'pacote' && item.item_id,
        );
        if (itensPacote.length > 0 && comanda.cliente_id) {
          try {
            await fetch('/api/admin/pacotes/cliente', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                comandaId: comanda.id,
                clienteId: comanda.cliente_id,
                clienteCpf: comanda.cliente?.cpf,
                itensPacote
              })
            });
          } catch (err) {
            console.error('Erro ao vincular pacote:', err);
          }
        }

        // T-08: Dar baixa nas sessões de pacote via API (bypass RLS)
        const servicosPacote = (comanda.comanda_itens || []).filter(
          (item: any) => item.tipo === 'servico' &&
            item.descricao?.includes('(Sess\u00e3o de Pacote)') &&
            item.valor_unitario === 0 &&
            item.item_id
        );

        for (const item of servicosPacote) {
          try {
            await fetch('/api/admin/pacotes/cliente', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clienteId: comanda.cliente_id,
                servicoId: item.item_id,
                quantidade: item.quantidade || 1,
              }),
            });
          } catch (err) {
            console.error('Erro ao debitar sess\u00e3o do pacote:', err);
          }
        }

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
      onClose();
    } catch (err: any) {
      alert(`Erro ao cancelar: ${err.message}`);
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
                <h3 className="font-semibold text-neutral-900 mb-3">
                  Itens ({comanda.comanda_itens?.length || 0})
                </h3>
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
                    R$ {Number(comanda.subtotal || comanda.total || 0).toFixed(2)}
                  </span>
                </div>
                {Number(comanda.desconto) > 0 && comanda.status === 'fechada' && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-600">Desconto</span>
                    <span className="font-medium text-red-600">- R$ {Number(comanda.desconto).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-green-200 mt-2">
                  <span className="text-lg font-semibold text-neutral-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    R$ {comanda.total?.toFixed(2) || '0.00'}
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
                          R$ {Math.max(0, (Number(comanda.subtotal || comanda.total) || 0) - desconto).toFixed(2)}
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
