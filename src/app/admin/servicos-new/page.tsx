'use client';

import { useState, useEffect } from 'react';
import { 
  Scissors, Plus, Search, DollarSign, Clock, 
  Edit2, Trash2, Box, Eye 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import GrupoServicoModal from '@/components/modals/GrupoServicoModal';
import PacoteServicoModal from '@/components/modals/PacoteServicoModal';
import { supabase } from '@/lib/supabase';

export default function ServicosNewPage() {
  const [activeView, setActiveView] = useState<'servicos' | 'pacotes' | 'grupos'>('servicos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrupo, setFilterGrupo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('ativos');

  const [servicos, setServicos] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [grupoModalOpen, setGrupoModalOpen] = useState(false);
  const [pacoteModalOpen, setPacoteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [stats, setStats] = useState({
    totalServicos: 0,
    servicosAtivos: 0,
    totalPacotes: 0,
    receitaMediaServico: 0,
    duracaoMedia: 0,
    gruposAtivos: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: servicosData },
        { data: pacotesData },
        { data: gruposData },
      ] = await Promise.all([
        supabase.from('servicos').select('*, grupos_servicos(nome, cor, icone)').order('nome'),
        supabase.from('pacotes_servicos').select('*').order('nome'),
        supabase.from('grupos_servicos').select('*').order('nome'),
      ]);

      const svcList = servicosData || [];
      const pctList = pacotesData || [];
      const grpList = gruposData || [];

      setServicos(svcList);
      setPacotes(pctList);
      setGrupos(grpList);

      const totalServicos = svcList.length;
      const servicosAtivos = svcList.filter((s: any) => s.ativo).length;
      const totalPacotes = pctList.filter((p: any) => p.ativo).length;
      const receitaMediaServico = svcList.length > 0 
        ? svcList.reduce((sum: number, s: any) => sum + parseFloat(s.preco || 0), 0) / svcList.length 
        : 0;
      const duracaoMedia = svcList.length > 0
        ? svcList.reduce((sum: number, s: any) => sum + (s.duracao_minutos || 0), 0) / svcList.length
        : 0;
      const gruposAtivos = grpList.filter((g: any) => g.ativo).length;

      setStats({
        totalServicos,
        servicosAtivos,
        totalPacotes,
        receitaMediaServico,
        duracaoMedia,
        gruposAtivos,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'servico' | 'pacote' | 'grupo', id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      const table = type === 'servico' ? 'servicos' : type === 'pacote' ? 'pacotes_servicos' : 'grupos_servicos';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir');
    }
  };

  const servicosFiltrados = servicos.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrupo = filterGrupo === 'todos' || s.grupo_id === filterGrupo;
    const matchStatus = filterStatus === 'todos' || 
                       (filterStatus === 'ativos' && s.ativo) ||
                       (filterStatus === 'inativos' && !s.ativo);
    return matchSearch && matchGrupo && matchStatus;
  });

  const pacotesFiltrados = pacotes.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'todos' || 
                       (filterStatus === 'ativos' && p.ativo) ||
                       (filterStatus === 'inativos' && !p.ativo);
    return matchSearch && matchStatus;
  });

  const gruposFiltrados = grupos.filter((g) =>
    g.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Serviços & Pacotes</h1>
            <p className="text-neutral-600 mt-1">Gerencie serviços, pacotes e grupos</p>
          </div>
          
          <div className="flex gap-3">
            {activeView === 'pacotes' && (
              <Button onClick={() => { setSelectedItem(null); setPacoteModalOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Pacote
              </Button>
            )}
            {activeView === 'grupos' && (
              <Button onClick={() => { setSelectedItem(null); setGrupoModalOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Grupo
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total de Serviços</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.totalServicos}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stats.servicosAtivos} ativos</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Pacotes Ativos</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalPacotes}</p>
                  <p className="text-xs text-neutral-500 mt-1">Disponíveis</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Box className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Preço Médio</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {stats.receitaMediaServico.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Por serviço</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Duração Média</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {Math.round(stats.duracaoMedia)} min
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats.gruposAtivos} grupos ativos
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveView('servicos')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'servicos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Scissors className="w-4 h-4 inline-block mr-2" />
            Serviços ({servicos.length})
          </button>
          <button
            onClick={() => setActiveView('pacotes')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'pacotes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Box className="w-4 h-4 inline-block mr-2" />
            Pacotes ({pacotes.length})
          </button>
          <button
            onClick={() => setActiveView('grupos')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'grupos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Eye className="w-4 h-4 inline-block mr-2" />
            Grupos ({grupos.length})
          </button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {activeView === 'servicos' && (
                <select
                  value={filterGrupo}
                  onChange={(e) => setFilterGrupo(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="todos">Todos os Grupos</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.nome}</option>
                  ))}
                </select>
              )}

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Content - Serviços */}
        {activeView === 'servicos' && (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Serviço</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Grupo</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Preço</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-700">Duração</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-700">Comissão</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-neutral-500">
                          Nenhum serviço encontrado
                        </td>
                      </tr>
                    ) : (
                      servicosFiltrados.map((servico) => (
                        <tr key={servico.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-neutral-900">{servico.nome}</div>
                              {servico.codigo && (
                                <div className="text-xs text-neutral-500 mt-1">#{servico.codigo}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {servico.grupos_servicos ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: servico.grupos_servicos.cor }}
                                />
                                <span className="text-sm">{servico.grupos_servicos.nome}</span>
                              </div>
                            ) : (
                              <span className="text-neutral-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-medium text-neutral-900">
                              R$ {parseFloat(servico.preco).toFixed(2)}
                            </div>
                            {servico.preco_promocional > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                Promo: R$ {parseFloat(servico.preco_promocional).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="default">
                              {servico.duracao_minutos} min
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {servico.comissao_tipo === 'percentual' ? (
                              <span className="text-sm text-neutral-700">
                                {servico.comissao_profissional}%
                              </span>
                            ) : (
                              <span className="text-sm text-neutral-700">
                                R$ {parseFloat(servico.comissao_valor_fixo || 0).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={servico.ativo ? 'success' : 'default'}>
                              {servico.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDelete('servico', servico.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content - Pacotes */}
        {activeView === 'pacotes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pacotesFiltrados.map((pacote) => (
              <Card key={pacote.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: pacote.cor || '#EC4899' }}
                      >
                        ✨
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{pacote.nome}</h3>
                        {pacote.codigo && (
                          <p className="text-xs text-neutral-500 mt-1">#{pacote.codigo}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={pacote.ativo ? 'success' : 'default'}>
                      {pacote.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {pacote.descricao && (
                    <p className="text-sm text-neutral-600 mb-4">{pacote.descricao}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Preço:</span>
                      <span className="text-lg font-bold text-green-600">
                        R$ {parseFloat(pacote.preco_total).toFixed(2)}
                      </span>
                    </div>
                    {pacote.preco_original > pacote.preco_total && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Economia:</span>
                        <span className="text-sm font-medium text-orange-600">
                          {pacote.desconto_percentual?.toFixed(0)}% OFF
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Duração:</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {pacote.duracao_total_minutos} min
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => { setSelectedItem(pacote); setPacoteModalOpen(true); }}
                      className="flex-1 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 inline-block mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete('pacote', pacote.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pacotesFiltrados.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                Nenhum pacote encontrado
              </div>
            )}
          </div>
        )}

        {/* Content - Grupos */}
        {activeView === 'grupos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposFiltrados.map((grupo) => (
              <Card key={grupo.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: grupo.cor }}
                      >
                        {grupo.icone === 'scissors' && '✂️'}
                        {grupo.icone === 'sparkles' && '✨'}
                        {grupo.icone === 'droplet' && '💧'}
                        {grupo.icone === 'zap' && '⚡'}
                        {grupo.icone === 'hand' && '✋'}
                        {grupo.icone === 'footprints' && '👣'}
                        {grupo.icone === 'eye' && '👁️'}
                        {grupo.icone === 'heart' && '❤️'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">{grupo.nome}</h3>
                        {grupo.descricao && (
                          <p className="text-sm text-neutral-600 mt-1">{grupo.descricao}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant={grupo.ativo ? 'success' : 'default'}>
                            {grupo.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setSelectedItem(grupo); setGrupoModalOpen(true); }}
                        className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('grupo', grupo.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <GrupoServicoModal
        isOpen={grupoModalOpen}
        onClose={() => { setGrupoModalOpen(false); setSelectedItem(null); }}
        grupo={selectedItem}
        onSave={loadData}
      />
      <PacoteServicoModal
        isOpen={pacoteModalOpen}
        onClose={() => { setPacoteModalOpen(false); setSelectedItem(null); }}
        pacote={selectedItem}
        onSave={loadData}
      />
    </div>
  );
}
