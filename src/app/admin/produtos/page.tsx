'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, TrendingUp, TrendingDown, 
  AlertTriangle, Archive, Edit2, Trash2, BarChart3, FileText 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ProdutoModal from '@/components/modals/ProdutoModal';
import GrupoProdutoModal from '@/components/modals/GrupoProdutoModal';
import FornecedorModal from '@/components/modals/FornecedorModal';
import MovimentacaoEstoqueModal from '@/components/modals/MovimentacaoEstoqueModal';
import { supabase } from '@/lib/supabase';

export default function ProdutosPage() {
  const [activeView, setActiveView] = useState<'produtos' | 'grupos' | 'fornecedores'>('produtos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterGrupo, setFilterGrupo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('ativos');

  // Data
  const [produtos, setProdutos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [produtoModalOpen, setProdutoModalOpen] = useState(false);
  const [grupoModalOpen, setGrupoModalOpen] = useState(false);
  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState({
    totalProdutos: 0,
    produtosAtivos: 0,
    produtosEstoqueBaixo: 0,
    valorTotalEstoque: 0,
    gruposAtivos: 0,
    fornecedoresAtivos: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: produtosData },
        { data: gruposData },
        { data: fornecedoresData },
        { data: alertasData },
      ] = await Promise.all([
        supabase.from('produtos').select('*, grupos_produtos(nome, cor), fornecedores(nome)').order('nome'),
        supabase.from('grupos_produtos').select('*').order('nome'),
        supabase.from('fornecedores').select('*').order('nome'),
        supabase.from('estoque_alertas').select('*, produtos(nome)').eq('resolvido', false).order('created_at', { ascending: false }),
      ]);

      const prodList = produtosData || [];
      const gruposList = gruposData || [];
      const fornList = fornecedoresData || [];

      setProdutos(prodList);
      setGrupos(gruposList);
      setFornecedores(fornList);
      setAlertas(alertasData || []);

      // Calculate stats
      const totalProdutos = prodList.length;
      const produtosAtivos = prodList.filter((p: any) => p.ativo).length;
      const produtosEstoqueBaixo = prodList.filter((p: any) => 
        p.controla_estoque && p.quantidade <= p.quantidade_minima
      ).length;
      const valorTotalEstoque = prodList.reduce((sum: number, p: any) => 
        sum + (p.quantidade * p.preco_custo), 0
      );
      const gruposAtivos = gruposList.filter((g: any) => g.ativo).length;
      const fornecedoresAtivos = fornList.filter((f: any) => f.ativo).length;

      setStats({
        totalProdutos,
        produtosAtivos,
        produtosEstoqueBaixo,
        valorTotalEstoque,
        gruposAtivos,
        fornecedoresAtivos,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'produto' | 'grupo' | 'fornecedor', id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      const table = type === 'produto' ? 'produtos' : type === 'grupo' ? 'grupos_produtos' : 'fornecedores';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir');
    }
  };

  const handleMovimentacao = (produto: any) => {
    setSelectedItem(produto);
    setMovimentacaoModalOpen(true);
  };

  // Filtros
  const produtosFiltrados = produtos.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo;
    const matchGrupo = filterGrupo === 'todos' || p.grupo_id?.toString() === filterGrupo;
    const matchStatus = filterStatus === 'todos' || 
                       (filterStatus === 'ativos' && p.ativo) ||
                       (filterStatus === 'inativos' && !p.ativo) ||
                       (filterStatus === 'estoque_baixo' && p.controla_estoque && p.quantidade <= p.quantidade_minima);
    return matchSearch && matchTipo && matchGrupo && matchStatus;
  });

  const gruposFiltrados = grupos.filter((g) =>
    g.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fornecedoresFiltrados = fornecedores.filter((f) =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-neutral-900">Produtos & Estoque</h1>
            <p className="text-neutral-600 mt-1">Gerencie produtos, grupos e fornecedores</p>
          </div>
          
          <div className="flex gap-3">
            {activeView === 'produtos' && (
              <Button onClick={() => { setSelectedItem(null); setProdutoModalOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Produto
              </Button>
            )}
            {activeView === 'grupos' && (
              <Button onClick={() => { setSelectedItem(null); setGrupoModalOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Grupo
              </Button>
            )}
            {activeView === 'fornecedores' && (
              <Button onClick={() => { setSelectedItem(null); setFornecedorModalOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Fornecedor
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
                  <p className="text-sm text-neutral-600">Total de Produtos</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.totalProdutos}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stats.produtosAtivos} ativos</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.produtosEstoqueBaixo}</p>
                  <p className="text-xs text-neutral-500 mt-1">Necessita atenção</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Valor em Estoque</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {stats.valorTotalEstoque.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Custo total</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Grupos / Fornecedores</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.gruposAtivos} / {stats.fornecedoresAtivos}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Ativos</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Archive className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">Alertas de Estoque</h3>
                  <div className="space-y-1">
                    {alertas.slice(0, 5).map((alerta) => (
                      <div key={alerta.id} className="text-sm text-orange-800">
                        • {alerta.mensagem}
                      </div>
                    ))}
                  </div>
                  {alertas.length > 5 && (
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-2">
                      Ver todos os {alertas.length} alertas →
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveView('produtos')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'produtos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-2" />
            Produtos ({produtos.length})
          </button>
          <button
            onClick={() => setActiveView('grupos')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'grupos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Archive className="w-4 h-4 inline-block mr-2" />
            Grupos ({grupos.length})
          </button>
          <button
            onClick={() => setActiveView('fornecedores')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeView === 'fornecedores'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Fornecedores ({fornecedores.length})
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
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {activeView === 'produtos' && (
                <>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="revenda">Revenda</option>
                    <option value="uso_interno">Uso Interno</option>
                    <option value="insumo">Insumo</option>
                  </select>

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

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ativos">Ativos</option>
                    <option value="inativos">Inativos</option>
                    <option value="estoque_baixo">Estoque Baixo</option>
                    <option value="todos">Todos</option>
                  </select>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeView === 'produtos' && (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Produto</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Grupo</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Estoque</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Preço Custo</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Preço Venda</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-neutral-500">
                          Nenhum produto encontrado
                        </td>
                      </tr>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <tr key={produto.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-neutral-900">{produto.nome}</div>
                              {produto.codigo && (
                                <div className="text-xs text-neutral-500 mt-1">#{produto.codigo}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {produto.grupos_produtos ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: produto.grupos_produtos.cor }}
                                />
                                <span className="text-sm">{produto.grupos_produtos.nome}</span>
                              </div>
                            ) : (
                              <span className="text-neutral-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={
                              produto.tipo === 'revenda' ? 'success' :
                              produto.tipo === 'uso_interno' ? 'warning' : 'default'
                            }>
                              {produto.tipo === 'revenda' ? 'Revenda' :
                               produto.tipo === 'uso_interno' ? 'Uso Interno' : 'Insumo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={`font-medium ${
                              produto.quantidade <= produto.quantidade_minima 
                                ? 'text-orange-600' 
                                : 'text-neutral-900'
                            }`}>
                              {produto.quantidade} {produto.unidade_medida}
                            </div>
                            {produto.quantidade_minima > 0 && (
                              <div className="text-xs text-neutral-500 mt-1">
                                Mín: {produto.quantidade_minima}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-neutral-900">
                            R$ {produto.preco_custo.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-medium text-neutral-900">
                              R$ {produto.preco_venda.toFixed(2)}
                            </div>
                            {produto.margem_lucro > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                +{produto.margem_lucro.toFixed(0)}%
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={produto.ativo ? 'success' : 'default'}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleMovimentacao(produto)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Movimentar Estoque"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedItem(produto); setProdutoModalOpen(true); }}
                                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('produto', produto.id)}
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

        {activeView === 'grupos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposFiltrados.map((grupo) => (
              <Card key={grupo.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: grupo.cor }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">{grupo.nome}</h3>
                        {grupo.descricao && (
                          <p className="text-sm text-neutral-600 mt-1">{grupo.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
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

        {activeView === 'fornecedores' && (
          <div className="grid grid-cols-1 gap-4">
            {fornecedoresFiltrados.map((fornecedor) => (
              <Card key={fornecedor.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg text-neutral-900">{fornecedor.nome}</h3>
                        <Badge variant={fornecedor.ativo ? 'success' : 'default'}>
                          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">CNPJ:</span>
                          <p className="font-medium text-neutral-900">{fornecedor.cnpj || '-'}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Telefone:</span>
                          <p className="font-medium text-neutral-900">{fornecedor.telefone || '-'}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Email:</span>
                          <p className="font-medium text-neutral-900">{fornecedor.email || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedItem(fornecedor); setFornecedorModalOpen(true); }}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('fornecedor', fornecedor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
      <ProdutoModal
        isOpen={produtoModalOpen}
        onClose={() => { setProdutoModalOpen(false); setSelectedItem(null); }}
        produto={selectedItem}
        onSave={loadData}
      />
      <GrupoProdutoModal
        isOpen={grupoModalOpen}
        onClose={() => { setGrupoModalOpen(false); setSelectedItem(null); }}
        grupo={selectedItem}
        onSave={loadData}
      />
      <FornecedorModal
        isOpen={fornecedorModalOpen}
        onClose={() => { setFornecedorModalOpen(false); setSelectedItem(null); }}
        fornecedor={selectedItem}
        onSave={loadData}
      />
      <MovimentacaoEstoqueModal
        isOpen={movimentacaoModalOpen}
        onClose={() => { setMovimentacaoModalOpen(false); setSelectedItem(null); }}
        produto={selectedItem}
        onSave={loadData}
      />
    </div>
  );
}
