'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, ShoppingBag, Scissors, Package as PackageIcon, Gift, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AtribuirEtapasServico from './AtribuirEtapasServico';
import { verificarPacoteAtivo, debitarSessaoPacote, registrarCompraPacote, type PacoteAtivo } from '@/services/pacotes';
import { DEFAULT_UNIT_ID } from '@/services/caixa';

interface ComandaItem {
  id?: string;
  tipo: 'servico' | 'produto' | 'pacote';
  item_id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tem_etapas?: boolean;
  etapas?: any[];
  atribuicoes_etapas?: any[];
  pacote_cliente_id?: string;
}

interface ComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId?: string;
  onSave: () => void;
}

export default function ComandaModal({ isOpen, onClose, comandaId, onSave }: ComandaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [auxiliares, setAuxiliares] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: '',
    profissional_id: '',
    auxiliar_id: '',
    data_agendamento: '',
    hora_inicio: '',
    observacoes: '',
  });

  const [itens, setItens] = useState<ComandaItem[]>([]);
  const [novoItem, setNovoItem] = useState<ComandaItem>({
    tipo: 'servico',
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
  });

  // T-08: pacotes ativos do cliente selecionado
  const [pacotesAtivos, setPacotesAtivos] = useState<PacoteAtivo[]>([]);
  const [pacotesDismissed, setPacotesDismissed] = useState<Set<string>>(new Set());

  // Verifica pacotes sempre que o cliente mudar
  useEffect(() => {
    async function checarPacotes() {
      if (!formData.cliente_id) { setPacotesAtivos([]); return; }
      // Usa == para comparar mesmo que um seja string e o outro number
      const cliente = clientes.find((c) => String(c.id) === String(formData.cliente_id));
      if (!cliente) { setPacotesAtivos([]); return; }
      try {
        const ativos = await verificarPacoteAtivo(Number(cliente.id));
        setPacotesAtivos(ativos);
        setPacotesDismissed(new Set()); // reset ao trocar de cliente
      } catch {
        setPacotesAtivos([]);
      }
    }
    checarPacotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cliente_id, clientes]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (comandaId) {
        loadComanda();
      } else {
        resetForm();
      }
    }
  }, [isOpen, comandaId]);

  const loadData = async () => {
    try {
      const [clientesData, produtosData, servicosData, profissionaisData, pacotesFetchResult] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('produtos').select('*').eq('tipo', 'revenda').eq('ativo', true).order('nome'),
        supabase.from('servicos').select('*').order('nome'),
        supabase.from('profissionais').select('id, nome, é_auxiliar').eq('ativo', true).order('nome'),
        fetch('/api/admin/pacotes').then(r => r.json())
      ]);

      if (clientesData.data) setClientes(clientesData.data);
      if (produtosData.data) setProdutos(produtosData.data);
      if (servicosData.data) setServicos(servicosData.data);
      
      const pacotesFiltrados = pacotesFetchResult.error ? [] : pacotesFetchResult.filter((p: any) => p.ativo);
      setPacotes(pacotesFiltrados);
      
      if (profissionaisData.data) {
        // Todos os profissionais (incluindo os que não são auxiliares)
        setProfissionais(profissionaisData.data);
        // Apenas profissionais que também são auxiliares
        setAuxiliares(profissionaisData.data.filter((p: any) => p.é_auxiliar));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadComanda = async () => {
    if (!comandaId) return;

    try {
      const { data: comanda, error } = await supabase
        .from('comandas')
        .select('*, comanda_itens(*)')
        .eq('id', comandaId)
        .single();

      if (error) throw error;

      setFormData({
        cliente_id: comanda.cliente_id || '',
        profissional_id: comanda.profissional_id || '',
        auxiliar_id: comanda.auxiliar_id || '',
        data_agendamento: comanda.data_agendamento || '',
        hora_inicio: comanda.hora_inicio || '',
        observacoes: comanda.observacoes || '',
      });

      // Load items with their etapas
      const itemsWithEtapas = await Promise.all(
        (comanda.comanda_itens || []).map(async (item: any) => {
          // Check if item is a service and if it has etapas
          if (item.tipo === 'servico' && item.item_id) {
            const { data: servico } = await supabase
              .from('servicos')
              .select('tem_etapas')
              .eq('id', item.item_id)
              .single();

            if (servico?.tem_etapas) {
              // Load etapas definition
              const { data: etapas } = await supabase
                .from('servico_etapas')
                .select('*')
                .eq('servico_id', item.item_id)
                .eq('ativo', true)
                .order('ordem');

              // Load etapas assignments
              const { data: atribuicoes } = await supabase
                .from('comanda_item_etapas')
                .select('*')
                .eq('comanda_item_id', item.id)
                .order('ordem');

              return {
                ...item,
                tem_etapas: true,
                etapas: etapas || [],
                atribuicoes_etapas: atribuicoes || [],
              };
            }
          }

          return {
            ...item,
            tem_etapas: false,
            etapas: [],
            atribuicoes_etapas: [],
          };
        })
      );

      setItens(itemsWithEtapas);
    } catch (err) {
      console.error('Erro ao carregar comanda:', err);
    }
  };

  const resetForm = () => {
    // Auto-fill with today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      cliente_id: '',
      profissional_id: '',
      auxiliar_id: '',
      data_agendamento: today,
      hora_inicio: '',
      observacoes: '',
    });
    setItens([]);
    setNovoItem({
      tipo: 'servico',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    });
    setError('');
  };

  const handleItemSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    let item: any;
    let tipo = novoItem.tipo;

    if (tipo === 'produto') {
      item = produtos.find(p => p.id === value);
      if (item) {
        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: item.nome,
          valor_unitario: item.preco || 0,
          valor_total: (item.preco || 0) * novoItem.quantidade,
          tem_etapas: false,
          etapas: [],
          atribuicoes_etapas: [],
        });
      }
    } else if (tipo === 'servico') {
      item = servicos.find(s => s.id === value);
      if (item) {
        // Verificar se o serviço tem etapas
        let etapas: any[] = [];
        if (item.tem_etapas) {
          const { data } = await supabase
            .from('servico_etapas')
            .select('*')
            .eq('servico_id', item.id)
            .eq('ativo', true)
            .order('ordem');
          etapas = data || [];
        }

        const pacoteDisponivel = pacotesAtivos.find(p => p.servico_id === item.id);
        const precoNormal = item.preco || 0;
        
        let valorUn = precoNormal;
        let isPacote = false;
        let desc = item.nome;

        if (pacoteDisponivel) {
           valorUn = 0;
           isPacote = true;
           desc = item.nome + ' (Sessão de Pacote)';
        }

        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: desc,
          valor_unitario: valorUn,
          valor_total: valorUn * novoItem.quantidade,
          tem_etapas: item.tem_etapas || false,
          etapas: etapas,
          atribuicoes_etapas: [],
          pacote_cliente_id: isPacote ? pacoteDisponivel.id : undefined,
        });
      }
    } else if (tipo === 'pacote') {
      item = pacotes.find(p => p.id === value);
      if (item) {
        const precoPacote = item.preco_total || item.preco || 0;
        setNovoItem({
          ...novoItem,
          item_id: item.id,
          descricao: item.nome,
          valor_unitario: precoPacote,
          valor_total: precoPacote * novoItem.quantidade,
          tem_etapas: false,
          etapas: [],
          atribuicoes_etapas: [],
        });
      }
    }
  };

  const handleQuantidadeChange = (quantidade: number) => {
    setNovoItem({
      ...novoItem,
      quantidade,
      valor_total: novoItem.valor_unitario * quantidade,
    });
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || (novoItem.valor_unitario <= 0 && !novoItem.pacote_cliente_id)) {
      setError('Selecione um item válido');
      return;
    }

    // Se tem etapas, validar que todas estão atribuídas (exceto as que não exigem profissional)
    if (novoItem.tem_etapas && novoItem.etapas && novoItem.etapas.length > 0) {
      const todasAtribuidas = novoItem.atribuicoes_etapas?.every(
        (a: any) => a.exige_profissional === false || (a.profissional_id || a.auxiliar_id)
      );
      if (!todasAtribuidas) {
        setError('Atribua profissionais/auxiliares a todas as etapas obrigatórias do serviço');
        return;
      }
    }

    setItens([...itens, { ...novoItem, id: crypto.randomUUID() }]);
    setNovoItem({
      tipo: 'servico',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      tem_etapas: false,
      etapas: [],
      atribuicoes_etapas: [],
    });
    setError('');
  };

  const adicionarPacoteDireto = async (pacote: PacoteAtivo) => {
    const srv = servicos.find(s => s.id === pacote.servico_id);
    let etapas: any[] = [];
    let atribuicoes: any[] = [];
    
    if (srv?.tem_etapas) {
      const { data } = await supabase
        .from('servico_etapas')
        .select('*')
        .eq('servico_id', pacote.servico_id)
        .eq('ativo', true)
        .order('ordem');
      etapas = data || [];
      
      // Auto-atribuir ao profissional responsável principal se existir
      if (formData.profissional_id) {
        atribuicoes = etapas.map(e => ({
          etapa_id: e.id,
          profissional_id: formData.profissional_id,
          exige_profissional: true, // Assuming default true for now to avoid validation errors
          percentual: 100
        }));
      }
    }

    const itemPacote: ComandaItem = {
      id: crypto.randomUUID(),
      tipo: 'servico',
      item_id: pacote.servico_id,
      descricao: `${pacote.servico_nome} (Sessão de Pacote)`,
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      tem_etapas: srv?.tem_etapas || false,
      etapas: etapas,
      atribuicoes_etapas: atribuicoes,
      pacote_cliente_id: pacote.id,
    };

    setItens(prev => [...prev, itemPacote]);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.valor_total, 0);
  };

  // Atualiza o estoque: delta = -1 para debitar (venda/uso), +1 para estornar (edição)
  const movimentarEstoque = async (itemsComanda: ComandaItem[], delta: number) => {
    const produtoItems = itemsComanda.filter(i => i.tipo === 'produto' && i.item_id);
    if (produtoItems.length === 0) return;

    // Agrupa por produto para somar quantidades
    const agrupado: Record<string, number> = {};
    for (const item of produtoItems) {
      agrupado[item.item_id!] = (agrupado[item.item_id!] || 0) + item.quantidade;
    }

    for (const [produtoId, qtd] of Object.entries(agrupado)) {
      const { data: prod } = await supabase
        .from('produtos')
        .select('quantidade')
        .eq('id', produtoId)
        .single();
      if (prod !== null) {
        const novaQtd = Math.max(0, (prod.quantidade || 0) + delta * qtd);
        await supabase.from('produtos').update({ quantidade: novaQtd }).eq('id', produtoId);
      }
    }
  };

  // Task 6: consome insumos de uso_interno vinculados a serviços via servicos_produtos
  // delta = -1 ao salvar, +1 ao estornar (edição de comanda existente)
  const consumirInsumosServico = async (itemsComanda: ComandaItem[], delta: number) => {
    const servicoItems = itemsComanda.filter(i => i.tipo === 'servico' && i.item_id);
    if (servicoItems.length === 0) return;

    // Coleta todos os servico_ids únicos
    const servicoIds = [...new Set(servicoItems.map(i => i.item_id!))];

    // Busca produtos vinculados a esses serviços
    const { data: vinculos, error } = await supabase
      .from('servicos_produtos')
      .select('servico_id, produto_id, quantidade_media')
      .in('servico_id', servicoIds);

    if (error || !vinculos || vinculos.length === 0) return;

    // Agrega: para cada produto, multiplica quantidade_media × QTD do serviço na comanda
    const agrupado: Record<string, number> = {};
    for (const item of servicoItems) {
      const vinculosServico = vinculos.filter(v => v.servico_id === item.item_id);
      for (const v of vinculosServico) {
        const qtdConsumo = (v.quantidade_media || 0) * item.quantidade;
        agrupado[v.produto_id] = (agrupado[v.produto_id] || 0) + qtdConsumo;
      }
    }

    for (const [produtoId, qtd] of Object.entries(agrupado)) {
      if (qtd <= 0) continue;

      const { data: prod } = await supabase
        .from('produtos')
        .select('quantidade, tipo')
        .eq('id', produtoId)
        .single();

      if (!prod) continue;

      const qtdAnterior = prod.quantidade || 0;
      const qtdNova = Math.max(0, qtdAnterior + delta * qtd);

      await supabase.from('produtos').update({ quantidade: qtdNova }).eq('id', produtoId);

      // Registra movimentação (tabela pode não existir em todos os envs)
      if (delta < 0) {
        try {
          await supabase.from('estoque_movimentacoes').insert([{
            produto_id: produtoId,
            tipo: 'uso_interno',
            quantidade: qtd,
            quantidade_anterior: qtdAnterior,
            quantidade_atual: qtdNova,
            motivo: 'Consumo automático por serviço na comanda',
          }]);
        } catch {
          // Ignora se tabela não existir
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (itens.length === 0) {
      setError('Adicione pelo menos um item à comanda');
      setLoading(false);
      return;
    }

    if (!formData.cliente_id) {
      setError('Selecione um cliente para a comanda');
      setLoading(false);
      return;
    }

    try {
      const cliente = clientes.find(c => c.id === formData.cliente_id);
      const total = calcularTotal();

      if (comandaId) {
        const { error: updateError } = await supabase
          .from('comandas')
          .update({
            cliente_id: formData.cliente_id || null,
            cliente_nome: cliente?.nome || null,
            profissional_id: formData.profissional_id || null,
            auxiliar_id: formData.auxiliar_id || null,
            data_agendamento: formData.data_agendamento || null,
            hora_inicio: formData.hora_inicio || null,
            subtotal: total,
            total,
            observacoes: formData.observacoes,
          })
          .eq('id', comandaId);

        if (updateError) throw updateError;

        // Estornar estoque dos itens antigos antes de deletar
        const { data: itensAntigos } = await supabase
          .from('comanda_itens')
          .select('tipo, item_id, quantidade')
          .eq('comanda_id', comandaId);
        await movimentarEstoque(itensAntigos || [], +1);
        await consumirInsumosServico(itensAntigos || [], +1);

        // Deletar itens antigos e suas etapas
        await supabase.from('comanda_itens').delete().eq('comanda_id', comandaId);

        // Inserir novos itens e capturar IDs
        const { data: itensInseridos, error: itensError } = await supabase
          .from('comanda_itens')
          .insert(itens.map(item => {
            const { id, tem_etapas, etapas, atribuicoes_etapas, pacote_cliente_id, ...itemData } = item;
            return {
              comanda_id: comandaId,
              ...itemData,
              item_id: itemData.item_id ? String(itemData.item_id) : null,
            };
          }))
          .select();

        if (itensError) throw itensError;

        // Inserir atribuições de etapas
        const etapasParaInserir: any[] = [];
        itens.forEach((item, index) => {
          if (item.tem_etapas && item.atribuicoes_etapas && item.atribuicoes_etapas.length > 0) {
            const comandaItemId = itensInseridos?.[index]?.id;
            if (comandaItemId) {
              item.atribuicoes_etapas.forEach((atrib: any) => {
                etapasParaInserir.push({
                  comanda_item_id: comandaItemId,
                  servico_etapa_id: atrib.servico_etapa_id,
                  ordem: atrib.ordem,
                  nome: atrib.nome,
                  duracao_minutos: atrib.duracao_minutos,
                  profissional_id: atrib.profissional_id || null,
                  auxiliar_id: atrib.auxiliar_id || null,
                });
              });
            }
          }
        });

        if (etapasParaInserir.length > 0) {
          const { error: etapasError } = await supabase
            .from('comanda_item_etapas')
            .insert(etapasParaInserir);
          if (etapasError) throw etapasError;
        }

        // Debitar estoque dos novos itens produto e consumir insumos dos serviços
        await movimentarEstoque(itens, -1);
        await consumirInsumosServico(itens, -1);

        // Debitar sessões de pacotes usadas nesta edição
        const itensPacoteUsoUp = itens.filter(i => i.pacote_cliente_id);
        for (const item of itensPacoteUsoUp) {
          try { await debitarSessaoPacote(item.pacote_cliente_id!); } catch (e) { console.error('Erro ao debitar sessão de pacote:', e); }
        }

        // Sincroniza servicos + cliente no agendamento vinculado
        const servicosJsonUp = itens
          .filter(i => i.tipo === 'servico' && i.item_id)
          .map(i => {
            const svc = servicos.find(s => s.id === i.item_id);
            return { id: i.item_id, nome: i.descricao, valor: i.valor_unitario, duracao: svc?.duracao_minutos || 0, quantidade: i.quantidade };
          });
        await supabase.from('agendamentos').update({
          servicos: servicosJsonUp,
          cliente_nome: cliente?.nome || null,
          cliente_telefone: (cliente as any)?.telefone || null,
        }).eq('comanda_id', comandaId);
      } else {
        // Validar conflito de horário antes de criar
        if (formData.profissional_id && formData.data_agendamento && formData.hora_inicio) {
          const duracaoItems = itens
            .filter(i => i.tipo === 'servico' && i.item_id)
            .reduce((s, i) => {
              const svc = servicos.find(sv => sv.id === i.item_id);
              return s + (svc?.duracao_minutos || 0) * (i.quantidade || 1);
            }, 0) || 60;
          const [h, m] = formData.hora_inicio.split(':').map(Number);
          const fimMin = h * 60 + m + duracaoItems;
          const horaFimConflito = `${String(Math.floor(fimMin / 60)).padStart(2, '0')}:${String(fimMin % 60).padStart(2, '0')}:00`;
          const horaInicioConflito = formData.hora_inicio + ':00';
          const { data: overlap } = await supabase
            .from('agendamentos')
            .select('id, hora_inicio, hora_fim, cliente_nome')
            .eq('profissional_id', formData.profissional_id)
            .eq('data_agendamento', formData.data_agendamento)
            .neq('status', 'cancelado')
            .lt('hora_inicio', horaFimConflito)
            .gt('hora_fim', horaInicioConflito);
          if (overlap && overlap.length > 0) {
            const h0 = (overlap[0] as any).hora_inicio?.substring(0, 5) || '';
            const confirmMsg = `Conflito de horário: o profissional já possui atendimento às ${h0}.\nDeseja agendar neste horário mesmo assim?`;
            if (!confirm(confirmMsg)) {
              return; // Cancela a operação se o usuário não confirmar
            }
          }
        }

        // Criar nova comanda
        const { data: novaComanda, error: insertError } = await supabase
          .from('comandas')
          .insert([{
            numero_comanda: 0, // Será atualizado por trigger
            cliente_id: formData.cliente_id || null,
            cliente_nome: cliente?.nome || null,
            profissional_id: formData.profissional_id || null,
            auxiliar_id: formData.auxiliar_id || null,
            data_agendamento: formData.data_agendamento || null,
            hora_inicio: formData.hora_inicio || null,
            status: 'aberta',
            subtotal: total,
            total,
            observacoes: formData.observacoes,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Inserir itens e capturar IDs
        const { data: itensInseridos, error: itensError } = await supabase
          .from('comanda_itens')
          .insert(itens.map(item => {
            const { id, tem_etapas, etapas, atribuicoes_etapas, pacote_cliente_id, ...itemData } = item;
            return {
              comanda_id: novaComanda.id,
              ...itemData,
              item_id: itemData.item_id ? String(itemData.item_id) : null,
            };
          }))
          .select();

        if (itensError) throw itensError;

        // Inserir atribuições de etapas
        const etapasParaInserir: any[] = [];
        itens.forEach((item, index) => {
          if (item.tem_etapas && item.atribuicoes_etapas && item.atribuicoes_etapas.length > 0) {
            const comandaItemId = itensInseridos?.[index]?.id;
            if (comandaItemId) {
              item.atribuicoes_etapas.forEach((atrib: any) => {
                etapasParaInserir.push({
                  comanda_item_id: comandaItemId,
                  servico_etapa_id: atrib.servico_etapa_id,
                  ordem: atrib.ordem,
                  nome: atrib.nome,
                  duracao_minutos: atrib.duracao_minutos,
                  profissional_id: atrib.profissional_id || null,
                  auxiliar_id: atrib.auxiliar_id || null,
                });
              });
            }
          }
        });

        if (etapasParaInserir.length > 0) {
          const { error: etapasError } = await supabase
            .from('comanda_item_etapas')
            .insert(etapasParaInserir);
          if (etapasError) throw etapasError;
        }

        // Debitar estoque dos itens produto na criação e insumos dos serviços
        await movimentarEstoque(itens, -1);
        await consumirInsumosServico(itens, -1);

        // Debitar sessões de pacotes usadas nesta comanda (compra de pacote é registrada só ao fechar)
        const itensPacoteUso = itens.filter(i => i.pacote_cliente_id);
        console.log('[ComandaModal] itensPacoteUso para débito:', itensPacoteUso.map(i => ({ descricao: i.descricao, pacote_cliente_id: i.pacote_cliente_id })));
        for (const item of itensPacoteUso) {
          try {
            const ok = await debitarSessaoPacote(item.pacote_cliente_id!);
            console.log('[ComandaModal] debitarSessaoPacote resultado:', { pacote_cliente_id: item.pacote_cliente_id, ok });
          } catch (e) { console.error('[ComandaModal] Erro ao debitar sessão de pacote:', e); }
        }

        // Sincroniza servicos + cliente no agendamento criado pelo trigger
        // (trigger dispara no INSERT, antes dos itens — precisa de update posterior)
        const servicosJson = itens
          .filter(i => i.tipo === 'servico' && i.item_id)
          .map(i => {
            const svc = servicos.find(s => s.id === i.item_id);
            return { id: i.item_id, nome: i.descricao, valor: i.valor_unitario, duracao: svc?.duracao_minutos || 0, quantidade: i.quantidade };
          });
        await supabase
          .from('agendamentos')
          .update({
            servicos: servicosJson,
            cliente_nome: cliente?.nome || null,
            cliente_telefone: (cliente as any)?.telefone || null,
          })
          .eq('comanda_id', novaComanda.id);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar comanda');
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'produto': return <ShoppingBag className="w-4 h-4" />;
      case 'servico': return <Scissors className="w-4 h-4" />;
      case 'pacote': return <PackageIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={comandaId ? 'Editar Comanda' : 'Nova Comanda'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Cliente
          </label>
          <select
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Profissional e Auxiliar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Profissional responsável
            </label>
            <select
              value={formData.profissional_id}
              onChange={(e) => setFormData({ ...formData, profissional_id: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecionar profissional...</option>
              {profissionais.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Auxiliar (opcional)
            </label>
            <select
              value={formData.auxiliar_id}
              onChange={(e) => setFormData({ ...formData, auxiliar_id: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecionar auxiliar...</option>
              {auxiliares.map(aux => (
                <option key={aux.id} value={aux.id}>
                  {aux.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data e Hora do Agendamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Data do agendamento
            </label>
            <input
              type="date"
              value={formData.data_agendamento}
              onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Hora de início
            </label>
            <input
              type="time"
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Adicionar Item */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-neutral-900 mb-4">Adicionar item</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo</label>
              <select
                value={novoItem.tipo}
                onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as any, descricao: '', item_id: '', valor_unitario: 0 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="servico">Serviço</option>
                <option value="produto">Produto</option>
                <option value="pacote">Pacote</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-5">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Item</label>
              <select
                onChange={handleItemSelect}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">Selecionar item...</option>
                {novoItem.tipo === 'produto' && produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco?.toFixed(2) || '0.00'}</option>
                ))}
                {novoItem.tipo === 'servico' && servicos.map(s => (
                  <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                ))}
                {novoItem.tipo === 'pacote' && pacotes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - R$ {(p.preco_total || p.preco || 0).toFixed(2)}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Qtd</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={novoItem.quantidade}
                onChange={(e) => handleQuantidadeChange(parseFloat(e.target.value) || 1)}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Total</label>
              <Input
                type="text"
                value={`R$ ${novoItem.valor_total.toFixed(2)}`}
                disabled
              />
            </div>

            <div className="col-span-1 md:col-span-1 flex items-end">
              <Button type="button" onClick={adicionarItem} variant="primary" size="sm" className="w-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Atribuir Etapas (se o serviço tiver etapas) */}
          {novoItem.tem_etapas && novoItem.etapas && novoItem.etapas.length > 0 && (
            <div className="mt-4">
              <AtribuirEtapasServico
                etapas={novoItem.etapas}
                profissionais={profissionais}
                auxiliares={auxiliares}
                profissionalPrincipalId={formData.profissional_id}
                onChange={(atribuicoes) => {
                  setNovoItem({ ...novoItem, atribuicoes_etapas: atribuicoes });
                }}
              />
            </div>
          )}

          {/* Pacotes do Cliente */}
          {pacotesAtivos.length > 0 && (
            <div className="mt-6 border border-primary-200 rounded-lg overflow-hidden">
              <div className="bg-primary-50 px-4 py-2 border-b border-primary-200 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary-600" />
                <h4 className="font-semibold text-primary-900 text-sm">Pacotes Disponíveis do Cliente</h4>
              </div>
              <div className="divide-y divide-primary-100 bg-white">
                {pacotesAtivos.map((pacote) => (
                  <div key={pacote.id} className="flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 text-sm">
                        {pacote.servico_nome}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        <span className="font-semibold text-primary-600">{pacote.sessoes_restantes} sessão{pacote.sessoes_restantes !== 1 ? 'ões' : ''}</span> de {pacote.sessoes_total} disponível{pacote.sessoes_restantes !== 1 ? 'is' : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="shrink-0"
                      onClick={() => adicionarPacoteDireto(pacote)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Usar Sessão
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-neutral-900 mb-3">Itens da comanda</h3>
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
              <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhum item adicionado à comanda</p>
              <p className="text-xs mt-1">Selecione um serviço ou produto acima</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {itens.map((item, index) => (
                <div key={index} className="bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant={item.tipo === 'servico' ? 'default' : item.tipo === 'produto' ? 'success' : 'warning'}>
                        <div className="flex items-center gap-1">
                          {getItemIcon(item.tipo)}
                          <span className="text-xs">{item.tipo}</span>
                        </div>
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.descricao}</p>
                        <p className="text-xs text-neutral-600">
                          {item.quantidade}x R$ {item.valor_unitario.toFixed(2)}
                        </p>
                        {item.tem_etapas && item.atribuicoes_etapas && item.atribuicoes_etapas.length > 0 && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            ⚙️ {item.atribuicoes_etapas.length} etapas atribuídas
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-900">
                        R$ {item.valor_total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Mostrar detalhes das etapas */}
                  {item.tem_etapas && item.atribuicoes_etapas && item.atribuicoes_etapas.length > 0 && (
                    <div className="px-3 pb-3 pt-1 border-t border-neutral-200 mt-2">
                      <div className="grid grid-cols-1 gap-1">
                        {item.atribuicoes_etapas.map((etapa: any, etapaIndex: number) => {
                          const prof = profissionais.find(p => p.id === etapa.profissional_id);
                          const aux = auxiliares.find(a => a.id === etapa.auxiliar_id);
                          const responsavel = prof || aux;
                          
                          return (
                            <div key={etapaIndex} className="flex items-center gap-2 text-xs">
                              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                                {etapa.ordem}
                              </span>
                              <span className="text-neutral-700">{etapa.nome}</span>
                              <span className="text-neutral-500">•</span>
                              <span className="text-neutral-600">{etapa.duracao_minutos}min</span>
                              <span className="text-neutral-500">•</span>
                              <span className="text-blue-600 font-medium">
                                {etapa.exige_profissional === false ? (
                                  '⏳ Tempo de Pausa'
                                ) : (
                                  <>{aux ? '🤝' : '👤'} {responsavel?.nome || 'Sem atribuição'}</>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {itens.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-neutral-900">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                R$ {calcularTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Observações adicionais</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
            placeholder="Digite alguma observação se necessário..."
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading || itens.length === 0}
            isLoading={loading}
          >
            {comandaId ? 'Atualizar comanda' : 'Abrir comanda'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

