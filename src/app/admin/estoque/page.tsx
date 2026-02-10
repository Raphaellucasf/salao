'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Search, TrendingUp, ArrowUpRight, ArrowDownRight, Edit, BarChart3, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ProdutoModal from '@/components/modals/ProdutoModal';
import DesfazerVendaModal from '@/components/modals/DesfazerVendaModal';
import { supabase } from '@/lib/supabase';

export default function EstoquePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<'todos' | 'revenda' | 'backbar'>('todos');
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [desfazerVendaModalOpen, setDesfazerVendaModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<any>(null);

  const loadProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProdutos();
  }, []);

  const handleEdit = (produto: any) => {
    setSelectedProduto(produto);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedProduto(null);
    setModalOpen(true);
  };

  const stats = [
    { label: 'Total Produtos', value: produtos.length.toString(), icon: Package, color: 'bg-primary-500' },
    { label: 'Valor em Estoque', value: 'R$ 48.5k', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Alertas', value: produtos.filter(p => p.quantidade <= p.minimo).length.toString(), icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: 'Movimentações Hoje', value: '24', icon: BarChart3, color: 'bg-blue-500' },
  ];

  const movimentacoes = [
    { tipo: 'entrada', descricao: 'Compra - Fornecedor ABC', quantidade: 50, produto: 'Shampoo Loreal', data: '20/01/2026 09:30' },
    { tipo: 'saida', descricao: 'Venda - Maria Silva', quantidade: 1, produto: 'Máscara Hidratação', data: '20/01/2026 14:20' },
    { tipo: 'uso', descricao: 'Uso Interno - Atendimento', quantidade: 0.5, produto: 'Botox Capilar Premium', data: '20/01/2026 15:45' },
    { tipo: 'saida', descricao: 'Venda - Paula Costa', quantidade: 2, produto: 'Shampoo Loreal', data: '19/01/2026 16:30' },
  ];

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'todos' || produto.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="p-6 space-y-6">
      <ProdutoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        produto={selectedProduto}
        onSave={loadProdutos}
      />

      <DesfazerVendaModal
        isOpen={desfazerVendaModalOpen}
        onClose={() => setDesfazerVendaModalOpen(false)}
        onSave={loadProdutos}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Estoque</h1>
          <p className="text-neutral-600 mt-1">Controle de produtos e inventário</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDesfazerVendaModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="font-medium">Desfazer Venda</span>
          </button>
          <button
            onClick={handleNew}
            className="flex items-center justify-center w-14 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg transition-all hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {produtos.filter(p => p.quantidade <= p.minimo).length > 0 && (
        <Card padding="lg" className="border-l-4 border-yellow-500 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Produtos com Estoque Baixo</h3>
              <p className="text-sm text-yellow-800">
                {produtos.filter(p => p.quantidade <= p.minimo).length} produtos estão abaixo do estoque mínimo. Considere fazer um pedido de reposição.
              </p>
            </div>
            <Button variant="secondary" size="sm">Ver produtos</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterCategoria === 'todos' ? 'primary' : 'secondary'}
              onClick={() => setFilterCategoria('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filterCategoria === 'revenda' ? 'primary' : 'secondary'}
              onClick={() => setFilterCategoria('revenda')}
            >
              Revenda
            </Button>
            <Button
              variant={filterCategoria === 'backbar' ? 'primary' : 'secondary'}
              onClick={() => setFilterCategoria('backbar')}
            >
              BackBar
            </Button>
          </div>
        </div>
      </Card>

      {/* Produtos List */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <CardTitle>Produtos em Estoque ({filteredProdutos.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Produto</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Categoria</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Estoque</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Localização</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Preço Venda</th>
                  <th className="text-right p-4 text-sm font-semibold text-neutral-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{produto.nome}</p>
                          <p className="text-xs text-neutral-600">ID: {produto.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={produto.categoria === 'revenda' ? 'default' : 'warning'}>
                        {produto.categoria === 'revenda' ? 'Revenda' : 'BackBar'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className={`text-sm font-bold ${produto.quantidade <= produto.minimo ? 'text-red-600' : 'text-neutral-900'}`}>
                          {produto.quantidade} {produto.unidade}
                        </p>
                        <p className="text-xs text-neutral-600">Mín: {produto.minimo}</p>
                        {produto.quantidade <= produto.minimo && (
                          <Badge variant="danger" className="mt-1 text-xs">Baixo</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-600">{produto.localizacao}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-green-600">
                        {produto.preco > 0 ? `R$ ${produto.preco.toFixed(2)}` : '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(produto)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors">
                          <ArrowUpRight className="w-4 h-4 text-primary-600" />
                        </button>
                        <button className="p-2 hover:bg-accent-50 rounded-lg transition-colors">
                          <ArrowDownRight className="w-4 h-4 text-accent-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Movimentações Recentes */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <CardTitle>Movimentações Recentes</CardTitle>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {movimentacoes.map((mov, index) => (
              <div key={index} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      mov.tipo === 'entrada' ? 'bg-green-100' :
                      mov.tipo === 'saida' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {mov.tipo === 'entrada' ? (
                        <ArrowUpRight className={`w-5 h-5 ${mov.tipo === 'entrada' ? 'text-green-600' : ''}`} />
                      ) : (
                        <ArrowDownRight className={`w-5 h-5 ${mov.tipo === 'saida' ? 'text-red-600' : 'text-blue-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{mov.produto}</p>
                      <p className="text-sm text-neutral-600">{mov.descricao}</p>
                      <p className="text-xs text-neutral-500 mt-1">{mov.data}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={mov.tipo === 'entrada' ? 'success' : mov.tipo === 'saida' ? 'danger' : 'default'}>
                      {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
