// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Clock, Scissors, ShoppingBag, Package, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface ComandaViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId?: number;
  onEdit?: () => void;
}

export default function ComandaViewDrawer({ isOpen, onClose, comandaId, onEdit }: ComandaViewDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [comanda, setComanda] = useState<any>(null);

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
      const { data: comandaData, error: comandaError } = await supabase
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
      const { data: itens, error: itensError } = await supabase
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
          .select('nome, telefone, email')
          .eq('id', comandaData.cliente_id)
          .single();
        cliente = clienteData;
      }
      
      // Carregar dados do profissional
      let profissional = null;
      if (comandaData.profissional_id) {
        const { data: profData } = await supabase
          .from('profissionais')
          .select('nome, telefone')
          .eq('id', comandaData.profissional_id)
          .single();
        profissional = profData;
      }
      
      // Carregar dados do auxiliar
      let auxiliar = null;
      if (comandaData.auxiliar_id) {
        const { data: auxData } = await supabase
          .from('profissionais')
          .select('nome')
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
    } catch (err) {
      console.error('❌ Erro ao carregar comanda:', err);
      console.error('❌ Stack:', err instanceof Error ? err.stack : 'N/A');
      console.error('❌ Tipo do erro:', typeof err);
    } finally {
      setLoading(false);
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
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-neutral-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    R$ {comanda.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                {onEdit && comanda.status === 'aberta' && (
                  <Button
                    onClick={onEdit}
                    variant="primary"
                    className="flex-1"
                  >
                    Editar Comanda
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
