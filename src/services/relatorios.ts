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
      .from('transactions')
      .select('*')
      .eq('type', 'income')
      .gte('transaction_date', formatDate(periodo.dataInicio))
      .lte('transaction_date', formatDate(periodo.dataFim))
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar faturamento:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((t: any) => ({
      Data: new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      Descrição: t.description || 'N/A',
      Valor: t.amount,
      Pagamento: formatPaymentMethod(t.payment_method),
      Tipo: t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Comissão',
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
      .from('users')
      .select('id, full_name, phone, email, created_at')
      .eq('role', 'client')
      .order('full_name');

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Busca appointments separadamente
    const { data: appointments } = await supabase
      .from('appointments')
      .select('client_id, appointment_date, status')
      .gte('appointment_date', formatDate(periodo.dataInicio))
      .lte('appointment_date', formatDate(periodo.dataFim));

    return data
      .map((cliente: any) => {
        const clienteAppointments = (appointments || []).filter(
          (apt: any) => apt.client_id === cliente.id
        );

        if (clienteAppointments.length === 0) return null;

        const ultimaVisita = clienteAppointments.reduce((latest: any, apt: any) => {
          return !latest || new Date(apt.appointment_date) > new Date(latest.appointment_date)
            ? apt
            : latest;
        }, null);

        return {
          Nome: cliente.full_name,
          Telefone: cliente.phone || 'N/A',
          Email: cliente.email || 'N/A',
          'Última Visita': ultimaVisita
            ? new Date(ultimaVisita.appointment_date).toLocaleDateString('pt-BR')
            : 'N/A',
          Visitas: clienteAppointments.length,
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
      .from('services')
      .select('id, name, price, duration_minutes, category')
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Busca appointments separadamente
    const { data: appointments } = await supabase
      .from('appointments')
      .select('service_id, appointment_date, status')
      .gte('appointment_date', formatDate(periodo.dataInicio))
      .lte('appointment_date', formatDate(periodo.dataFim))
      .eq('status', 'completed');

    return data
      .map((servico: any) => {
        const servicoAppointments = (appointments || []).filter(
          (apt: any) => apt.service_id === servico.id
        );

        if (servicoAppointments.length === 0) return null;

        return {
          Serviço: servico.name,
          Categoria: servico.category || 'Geral',
          'Qtd Realizada': servicoAppointments.length,
          'Duração': `${servico.duration_minutes} min`,
          'Valor': servico.price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
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
      .from('inventory')
      .select('id, name, category, quantity, cost_price, sale_price')
      .order('name');

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Nota: Atualmente não há tabela de vendas de produtos
    // Retorna apenas informações de estoque
    return data.map((produto: any) => ({
      Produto: produto.name,
      Categoria: produto.category || 'Geral',
      'Estoque Atual': produto.quantity,
      'Preço Custo': produto.cost_price?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }) || 'N/A',
      'Preço Venda': produto.sale_price?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }) || 'N/A',
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

// ==================== RELATÓRIO DE PROFISSIONAIS ====================
export async function buscarProfissionais(periodo: PeriodoFiltro) {
  try {
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('id, user_id, commission_percentage, rating')
      .eq('is_active', true);

    if (profError || !professionals || professionals.length === 0) {
      console.error('Erro ao buscar profissionais:', profError);
      return [];
    }

    // Busca users separadamente
    const userIds = professionals.map((p: any) => p.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds);

    // Busca appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('professional_id, appointment_date, status')
      .gte('appointment_date', formatDate(periodo.dataInicio))
      .lte('appointment_date', formatDate(periodo.dataFim))
      .eq('status', 'completed');

    return professionals
      .map((prof: any) => {
        const user = (users || []).find((u: any) => u.id === prof.user_id);
        const profAppointments = (appointments || []).filter(
          (apt: any) => apt.professional_id === prof.id
        );

        if (profAppointments.length === 0) return null;

        return {
          Profissional: (user as any)?.full_name || 'N/A',
          'Atendimentos': profAppointments.length,
          'Comissão': `${prof.commission_percentage}%`,
          'Avaliação': `${prof.rating || 5.0}/5.0`,
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
      .from('appointments')
      .select('id, appointment_date, status')
      .gte('appointment_date', formatDate(periodo.dataInicio))
      .lte('appointment_date', formatDate(periodo.dataFim))
      .order('appointment_date');

    if (error) {
      console.error('Erro ao buscar agenda:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupa por data
    const porData: Record<string, any> = {};

    data.forEach((apt: any) => {
      const data = apt.appointment_date;
      if (!porData[data]) {
        porData[data] = {
          total: 0,
          realizados: 0,
          cancelados: 0,
          noShow: 0,
        };
      }

      porData[data].total++;

      if (apt.status === 'completed') porData[data].realizados++;
      if (apt.status === 'cancelled') porData[data].cancelados++;
      if (apt.status === 'no_show') porData[data].noShow++;
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
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    cash: 'Dinheiro',
    card: 'Cartão',
    pix: 'PIX',
    other: 'Outro',
  };
  return methods[method] || method;
}

// Função para obter período pré-definido
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
