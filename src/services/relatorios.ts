import { supabase } from '@/lib/supabase';

export interface PeriodoFiltro {
  dataInicio: Date;
  dataFim: Date;
}

// Função auxiliar para formatar datas
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ==================== RELATÓRIO DE FATURAMENTO ====================
export async function buscarFaturamento(periodo: PeriodoFiltro) {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('tipo', 'receita')
      .gte('data', formatDate(periodo.dataInicio))
      .lte('data', formatDate(periodo.dataFim))
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar faturamento:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((t: any) => ({
      Data: new Date(t.data).toLocaleDateString('pt-BR'),
      Descrição: t.descricao || 'N/A',
      Valor: t.valor,
      Pagamento: t.metodo || 'N/A',
      Tipo: t.tipo === 'receita' ? 'Receita' : t.tipo === 'despesa' ? 'Despesa' : 'Comissão',
    }));
  } catch (error) {
    console.error('Erro ao buscar faturamento:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE CLIENTES ====================
export async function buscarClientes(periodo: PeriodoFiltro) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, telefone, email, created_at')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('cliente_id, data_agendamento, status')
      .gte('data_agendamento', formatDate(periodo.dataInicio))
      .lte('data_agendamento', formatDate(periodo.dataFim));

    return data
      .map((cliente: any) => {
        const clienteAgendamentos = (agendamentos || []).filter(
          (ag: any) => ag.cliente_id === cliente.id
        );

        if (clienteAgendamentos.length === 0) return null;

        const ultimaVisita = clienteAgendamentos.reduce((latest: any, ag: any) => {
          return !latest || new Date(ag.data_agendamento) > new Date(latest.data_agendamento)
            ? ag
            : latest;
        }, null);

        return {
          Nome: cliente.nome,
          Telefone: cliente.telefone || 'N/A',
          Email: cliente.email || 'N/A',
          'Última Visita': ultimaVisita
            ? new Date(ultimaVisita.data_agendamento).toLocaleDateString('pt-BR')
            : 'N/A',
          Visitas: clienteAgendamentos.length,
          Status: 'Ativo',
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE SERVIÇOS ====================
export async function buscarServicos(periodo: PeriodoFiltro) {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('id, nome, preco, duracao_minutos, categoria')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Contar uso via coluna JSONB de agendamentos concluídos
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('servicos')
      .gte('data_agendamento', formatDate(periodo.dataInicio))
      .lte('data_agendamento', formatDate(periodo.dataFim))
      .eq('status', 'concluido');

    const contagemServicos: Record<string, number> = {};
    (agendamentos || []).forEach((ag: any) => {
      try {
        const servs = typeof ag.servicos === 'string' ? JSON.parse(ag.servicos) : ag.servicos;
        if (Array.isArray(servs)) {
          servs.forEach((s: any) => {
            if (s.id) contagemServicos[s.id] = (contagemServicos[s.id] || 0) + 1;
          });
        }
      } catch {}
    });

    return data
      .map((servico: any) => {
        const qtd = contagemServicos[servico.id] || 0;
        if (qtd === 0) return null;
        return {
          Serviço: servico.nome,
          Categoria: servico.categoria || 'Geral',
          'Qtd Realizada': qtd,
          Duração: `${servico.duracao_minutos} min`,
          Valor: (servico.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b['Qtd Realizada'] - a['Qtd Realizada']);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE PRODUTOS ====================
export async function buscarProdutos(periodo: PeriodoFiltro) {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, categoria, quantidade, preco_custo, preco_venda')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((produto: any) => ({
      Produto: produto.nome,
      Categoria: produto.categoria || 'Geral',
      'Estoque Atual': produto.quantidade ?? 0,
      'Preço Custo': produto.preco_custo != null
        ? produto.preco_custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'N/A',
      'Preço Venda': produto.preco_venda != null
        ? produto.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'N/A',
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE PROFISSIONAIS ====================
export async function buscarProfissionais(periodo: PeriodoFiltro) {
  try {
    const { data: profissionais, error: profError } = await supabase
      .from('profissionais')
      .select('id, nome, percentual_comissao')
      .eq('ativo', true);

    if (profError || !profissionais || profissionais.length === 0) {
      console.error('Erro ao buscar profissionais:', profError);
      return [];
    }

    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('profissional_id, data_agendamento, status')
      .gte('data_agendamento', formatDate(periodo.dataInicio))
      .lte('data_agendamento', formatDate(periodo.dataFim))
      .eq('status', 'concluido');

    return profissionais
      .map((prof: any) => {
        const profAgendamentos = (agendamentos || []).filter(
          (ag: any) => ag.profissional_id === prof.id
        );

        if (profAgendamentos.length === 0) return null;

        return {
          Profissional: prof.nome,
          Atendimentos: profAgendamentos.length,
          Comissão: `${prof.percentual_comissao || 0}%`,
          Status: 'Ativo',
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.Atendimentos - a.Atendimentos);
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE AGENDA ====================
export async function buscarAgenda(periodo: PeriodoFiltro) {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, data_agendamento, status')
      .gte('data_agendamento', formatDate(periodo.dataInicio))
      .lte('data_agendamento', formatDate(periodo.dataFim))
      .order('data_agendamento');

    if (error) {
      console.error('Erro ao buscar agenda:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupa por data
    const porData: Record<string, any> = {};

    data.forEach((ag: any) => {
      const d = ag.data_agendamento;
      if (!porData[d]) {
        porData[d] = {
          total: 0,
          realizados: 0,
          cancelados: 0,
          noShow: 0,
        };
      }

      porData[d].total++;

      if (ag.status === 'concluido') porData[d].realizados++;
      if (ag.status === 'cancelado') porData[d].cancelados++;
      if (ag.status === 'faltou')    porData[d].noShow++;
    });

    return Object.entries(porData).map(([data, stats]) => ({
      Data: new Date(data).toLocaleDateString('pt-BR'),
      'Agendamentos': stats.total,
      'Realizados': stats.realizados,
      'Cancelados': stats.cancelados,
      'No-Show': stats.noShow,
      'Taxa Ocupação': `${Math.round((stats.realizados / stats.total) * 100)}%`,
    }));
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    return [];
  }
}

// ==================== UTILITÁRIOS ====================
export function getPeriodo(tipo: string): PeriodoFiltro {
  const hoje = new Date();
  const dataFim = new Date(hoje);
  dataFim.setHours(23, 59, 59, 999);

  let dataInicio = new Date(hoje);

  switch (tipo) {
    case 'hoje':
      dataInicio.setHours(0, 0, 0, 0);
      break;

    case 'semana':
      dataInicio.setDate(hoje.getDate() - hoje.getDay()); // Domingo desta semana
      dataInicio.setHours(0, 0, 0, 0);
      break;

    case 'mes':
      dataInicio.setDate(1); // Primeiro dia do mês
      dataInicio.setHours(0, 0, 0, 0);
      break;

    case 'ano':
      dataInicio.setMonth(0, 1); // 1º de janeiro
      dataInicio.setHours(0, 0, 0, 0);
      break;

    default:
      // Padrão: último mês
      dataInicio.setMonth(hoje.getMonth() - 1);
      dataInicio.setHours(0, 0, 0, 0);
  }

  return { dataInicio, dataFim };
}
