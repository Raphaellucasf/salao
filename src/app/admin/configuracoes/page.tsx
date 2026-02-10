'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, CreditCard, Tag, Store, Plus, Pencil, Trash2, Search, DollarSign, Calendar, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import FormaPagamentoModal from '@/components/modals/FormaPagamentoModal';
import PromocaoModal from '@/components/modals/PromocaoModal';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'pagamentos' | 'promocoes'>('geral');
  const [loading, setLoading] = useState(true);
  
  // Geral
  const [config, setConfig] = useState<any>(null);
  const [editandoGeral, setEditandoGeral] = useState(false);
  
  // Formas de Pagamento
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [formaModalOpen, setFormaModalOpen] = useState(false);
  const [selectedForma, setSelectedForma] = useState<any>(null);
  const [searchForma, setSearchForma] = useState('');
  
  // Promoções
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [promocaoModalOpen, setPromocaoModalOpen] = useState(false);
  const [selectedPromocao, setSelectedPromocao] = useState<any>(null);
  const [searchPromocao, setSearchPromocao] = useState('');
  const [filterStatusPromocao, setFilterStatusPromocao] = useState('todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar configurações
      const { data: configData } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .single();
      
      if (configData) setConfig(configData);

      // Carregar formas de pagamento
      const { data: formasData } = await supabase
        .from('formas_pagamento')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (formasData) setFormasPagamento(formasData);

      // Carregar promoções
      const { data: promocoesData } = await supabase
        .from('promocoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (promocoesData) setPromocoes(promocoesData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeral = async () => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({
          nome_empresa: config.nome_empresa,
          cnpj: config.cnpj,
          telefone: config.telefone,
          email: config.email,
          endereco: config.endereco,
          cidade: config.cidade,
          estado: config.estado,
          cep: config.cep,
          comissao_padrao_servico: config.comissao_padrao_servico,
          comissao_padrao_produto: config.comissao_padrao_produto,
          duracao_padrao_atendimento: config.duracao_padrao_atendimento,
          intervalo_entre_atendimentos: config.intervalo_entre_atendimentos,
        })
        .eq('id', config.id);

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
      setEditandoGeral(false);
      loadData();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleDeleteForma = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta forma de pagamento?')) return;

    try {
      const { error } = await supabase
        .from('formas_pagamento')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleDeletePromocao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return;

    try {
      const { error } = await supabase
        .from('promocoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // Filtros
  const formasFiltradas = formasPagamento.filter((forma) =>
    forma.nome.toLowerCase().includes(searchForma.toLowerCase())
  );

  const promocoesFiltradas = promocoes.filter((promo) => {
    const matchSearch =
      promo.nome.toLowerCase().includes(searchPromocao.toLowerCase()) ||
      promo.codigo?.toLowerCase().includes(searchPromocao.toLowerCase());

    const matchStatus =
      filterStatusPromocao === 'todos' ||
      (filterStatusPromocao === 'ativos' && promo.ativo) ||
      (filterStatusPromocao === 'inativos' && !promo.ativo);

    return matchSearch && matchStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isPromocaoValida = (promo: any) => {
    const hoje = new Date().toISOString().split('T')[0];
    return promo.ativo && promo.data_inicio <= hoje && promo.data_fim >= hoje;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações gerais do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'geral'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store size={20} />
            <span>Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('pagamentos')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'pagamentos'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard size={20} />
            <span>Formas de Pagamento</span>
            <Badge>{formasPagamento.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('promocoes')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'promocoes'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag size={20} />
            <span>Promoções</span>
            <Badge>{promocoes.filter(p => p.ativo).length}</Badge>
          </button>
        </div>
      </div>

      {/* Tab: Geral */}
      {activeTab === 'geral' && config && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Informações da Empresa</h2>
            {!editandoGeral ? (
              <Button onClick={() => setEditandoGeral(true)}>
                <Pencil size={18} className="mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => {
                  setEditandoGeral(false);
                  loadData();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveGeral}>
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={config.nome_empresa || ''}
                onChange={(e) => setConfig({ ...config, nome_empresa: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={config.cnpj || ''}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={config.telefone || ''}
                onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={config.endereco || ''}
                onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={config.cidade || ''}
                onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
                disabled={!editandoGeral}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  type="text"
                  value={config.estado || ''}
                  onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                  disabled={!editandoGeral}
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={config.cep || ''}
                  onChange={(e) => setConfig({ ...config, cep: e.target.value })}
                  disabled={!editandoGeral}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Configurações de Agenda</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração Padrão (minutos)
                </label>
                <input
                  type="number"
                  value={config.duracao_padrao_atendimento || 60}
                  onChange={(e) => setConfig({ ...config, duracao_padrao_atendimento: parseInt(e.target.value) })}
                  disabled={!editandoGeral}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intervalo Entre Atendimentos (minutos)
                </label>
                <input
                  type="number"
                  value={config.intervalo_entre_atendimentos || 0}
                  onChange={(e) => setConfig({ ...config, intervalo_entre_atendimentos: parseInt(e.target.value) })}
                  disabled={!editandoGeral}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Comissões Padrão</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comissão em Serviços (%)
                </label>
                <input
                  type="number"
                  value={config.comissao_padrao_servico || 50}
                  onChange={(e) => setConfig({ ...config, comissao_padrao_servico: parseFloat(e.target.value) })}
                  disabled={!editandoGeral}
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comissão em Produtos (%)
                </label>
                <input
                  type="number"
                  value={config.comissao_padrao_produto || 10}
                  onChange={(e) => setConfig({ ...config, comissao_padrao_produto: parseFloat(e.target.value) })}
                  disabled={!editandoGeral}
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Formas de Pagamento */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar forma de pagamento..."
                value={searchForma}
                onChange={(e) => setSearchForma(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button onClick={() => {
              setSelectedForma(null);
              setFormaModalOpen(true);
            }}>
              <Plus size={20} className="mr-2" />
              Nova Forma de Pagamento
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcelamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formasFiltradas.map((forma) => (
                  <tr key={forma.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{forma.nome}</div>
                      {forma.bandeira && <div className="text-sm text-gray-500">{forma.bandeira}</div>}
                    </td>
                    <td className="px-6 py-4 capitalize text-sm">{forma.tipo.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm">
                      {forma.permite_parcelamento ? (
                        <span className="text-green-600">Até {forma.max_parcelas}x</span>
                      ) : (
                        <span className="text-gray-400">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {forma.taxa_percentual > 0 || forma.taxa_fixa > 0 ? (
                        <div className="text-red-600">
                          {forma.taxa_percentual > 0 && `${forma.taxa_percentual}%`}
                          {forma.taxa_fixa > 0 && ` + R$ ${forma.taxa_fixa.toFixed(2)}`}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem taxas</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={forma.ativo ? 'success' : 'default'}>
                        {forma.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedForma(forma);
                            setFormaModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteForma(forma.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Promoções */}
      {activeTab === 'promocoes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar promoção..."
                value={searchPromocao}
                onChange={(e) => setSearchPromocao(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatusPromocao}
              onChange={(e) => setFilterStatusPromocao(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
            <Button onClick={() => {
              setSelectedPromocao(null);
              setPromocaoModalOpen(true);
            }}>
              <Plus size={20} className="mr-2" />
              Nova Promoção
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promocoesFiltradas.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-2" style={{ backgroundColor: promo.cor }} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{promo.nome}</h3>
                        {promo.destaque && (
                          <Badge variant="warning">Destaque</Badge>
                        )}
                      </div>
                      {promo.codigo && (
                        <p className="text-sm text-gray-500">Código: {promo.codigo}</p>
                      )}
                    </div>
                    <Badge variant={isPromocaoValida(promo) ? 'success' : promo.ativo ? 'default' : 'default'}>
                      {isPromocaoValida(promo) ? 'Válida' : promo.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  {promo.descricao && (
                    <p className="text-sm text-gray-600 mb-4">{promo.descricao}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} className="text-green-600" />
                      <span>
                        {promo.tipo_desconto === 'percentual' && `${promo.valor_desconto}% off`}
                        {promo.tipo_desconto === 'valor_fixo' && `R$ ${promo.valor_desconto.toFixed(2)} off`}
                        {promo.tipo_desconto === 'preco_fixo' && `Por R$ ${promo.valor_desconto.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-blue-600" />
                      <span>{formatDate(promo.data_inicio)} - {formatDate(promo.data_fim)}</span>
                    </div>
                  </div>

                  {promo.requer_cupom && promo.cupom && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cupom:</span>
                        <span className="font-mono font-bold text-gray-900">{promo.cupom}</span>
                      </div>
                    </div>
                  )}

                  {promo.quantidade_maxima_usos && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Users size={16} />
                      <span>{promo.quantidade_usos_atual || 0} / {promo.quantidade_maxima_usos} usos</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedPromocao(promo);
                        setPromocaoModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePromocao(promo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {promocoesFiltradas.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Tag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma promoção encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FormaPagamentoModal
        isOpen={formaModalOpen}
        onClose={() => {
          setFormaModalOpen(false);
          setSelectedForma(null);
        }}
        onSuccess={loadData}
        forma={selectedForma}
      />

      <PromocaoModal
        isOpen={promocaoModalOpen}
        onClose={() => {
          setPromocaoModalOpen(false);
          setSelectedPromocao(null);
        }}
        onSuccess={loadData}
        promocao={selectedPromocao}
      />
    </div>
  );
}
