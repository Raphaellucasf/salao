'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ServicoModal } from '@/components/modals/ServicoModal';
import { supabase } from '@/lib/supabase';
import { 
  Scissors, Plus, Edit, Trash2, Clock, DollarSign, 
  TrendingUp, Search, Eye, EyeOff, Filter 
} from 'lucide-react';

interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  duracao: number;
  preco: number;
  comissao: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | undefined>();
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadServicos();
  }, []);

  const loadServicos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setServicos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (servico: Servico) => {
    setServicoSelecionado(servico);
    setIsModalOpen(true);
  };

  const handleNovo = () => {
    setServicoSelecionado(undefined);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir este serviço? Esta ação não pode ser desfeita!')) return;

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Serviço excluído com sucesso!');
      loadServicos();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(error.message || 'Erro ao excluir serviço');
    }
  };

  const toggleAtivo = async (servico: Servico) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .update({ ativo: !servico.ativo })
        .eq('id', servico.id);

      if (error) throw error;
      loadServicos();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar status');
    }
  };

  const servicosFiltrados = servicos.filter(servico => {
    // Filtro de categoria
    if (filtroCategoria !== 'todos' && servico.categoria !== filtroCategoria) return false;
    
    // Filtro de status
    if (filtroStatus === 'ativos' && !servico.ativo) return false;
    if (filtroStatus === 'inativos' && servico.ativo) return false;
    
    // Filtro de busca
    if (search) {
      const searchLower = search.toLowerCase();
      const nome = servico.nome.toLowerCase();
      const descricao = servico.descricao?.toLowerCase() || '';
      
      if (!nome.includes(searchLower) && !descricao.includes(searchLower)) return false;
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: servicos.length,
    ativos: servicos.filter(s => s.ativo).length,
    inativos: servicos.filter(s => !s.ativo).length,
    precoMedio: servicos.length > 0 
      ? servicos.reduce((acc, s) => acc + s.preco, 0) / servicos.length 
      : 0
  };

  // Categorias disponíveis
  const categorias = ['todos', ...new Set(servicos.map(s => s.categoria))];

  // Agrupar serviços por categoria
  const servicosPorCategoria = servicosFiltrados.reduce((acc, servico) => {
    if (!acc[servico.categoria]) acc[servico.categoria] = [];
    acc[servico.categoria].push(servico);
    return acc;
  }, {} as Record<string, Servico[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="w-6 h-6 text-purple-500" />
            Serviços
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os serviços disponíveis para agendamento
          </p>
        </div>

        <Button onClick={handleNovo}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Serviços</p>
              <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inativos}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <EyeOff className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Preço Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {stats.precoMedio.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Buscar serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtros de Categoria e Status */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <Button
                size="sm"
                variant={filtroStatus === 'todos' ? 'primary' : 'outline'}
                onClick={() => setFiltroStatus('todos')}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filtroStatus === 'ativos' ? 'primary' : 'outline'}
                onClick={() => setFiltroStatus('ativos')}
              >
                Ativos
              </Button>
              <Button
                size="sm"
                variant={filtroStatus === 'inativos' ? 'primary' : 'outline'}
                onClick={() => setFiltroStatus('inativos')}
              >
                Inativos
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">Categoria:</span>
              {categorias.slice(0, 6).map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={filtroCategoria === cat ? 'primary' : 'outline'}
                  onClick={() => setFiltroCategoria(cat)}
                >
                  {cat === 'todos' ? 'Todas' : cat}
                </Button>
              ))}
              {categorias.length > 6 && (
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="px-3 py-1 text-sm border rounded"
                >
                  <option value="todos">Mais categorias...</option>
                  {categorias.slice(6).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Serviços */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : servicosFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum serviço encontrado</p>
          <Button onClick={handleNovo} className="mt-4">
            Criar Primeiro Serviço
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(servicosPorCategoria).map(([categoria, servicosCategoria]) => (
            <div key={categoria}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {categoria}
                <Badge variant="default">
                  {servicosCategoria.length} {servicosCategoria.length === 1 ? 'serviço' : 'serviços'}
                </Badge>
              </h2>

              <div className="grid gap-3">
                {servicosCategoria.map((servico) => (
                  <Card key={servico.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{servico.nome}</h3>
                          <Badge variant={servico.ativo ? 'success' : 'default'}>
                            {servico.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        {servico.descricao && (
                          <p className="text-sm text-gray-600 mb-3">{servico.descricao}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{servico.duracao} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="w-4 h-4" />
                            <span>R$ {servico.preco.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>{servico.comissao}% comissão</span>
                          </div>
                          <div className="text-gray-500">
                            Comissão: R$ {(servico.preco * servico.comissao / 100).toFixed(2)}
                          </div>
                        </div>

                        {servico.observacoes && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            {servico.observacoes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAtivo(servico)}
                          title={servico.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {servico.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditar(servico)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExcluir(servico.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ServicoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServicoSelecionado(undefined);
        }}
        servico={servicoSelecionado}
        onSuccess={loadServicos}
      />
    </div>
  );
}
