// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { Package, DollarSign, Archive, Settings } from 'lucide-react';

interface ProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: any;
  onSave: () => void;
}

const TABS = [
  { id: 'geral', label: 'Geral', icon: Package },
  { id: 'valores', label: 'Valores', icon: DollarSign },
  { id: 'estoque', label: 'Estoque', icon: Archive },
  { id: 'config', label: 'Configurações', icon: Settings },
];

const TIPOS_PRODUTO = [
  { value: 'revenda', label: 'Revenda', desc: 'Produtos para venda ao cliente' },
  { value: 'uso_interno', label: 'Uso Interno', desc: 'Produtos para uso no salão' },
  { value: 'insumo', label: 'Insumo', desc: 'Matéria-prima ou componente' },
];

const UNIDADES_MEDIDA = ['unidade', 'kg', 'g', 'l', 'ml', 'cx', 'pacote', 'par'];

export default function ProdutoModal({ isOpen, onClose, produto, onSave }: ProdutoModalProps) {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);


  const [formData, setFormData] = useState({
    codigo: '',
    codigo_barras: '',
    nome: '',
    descricao: '',
    grupo_id: null as number | null,
    categoria: '',
    tipo: 'revenda',
    fornecedor_id: null as number | null,
    quantidade: 0,
    quantidade_minima: 0,
    unidade_medida: 'unidade',
    preco_custo: 0,
    preco_venda: 0,
    margem_lucro: 0,
    controla_estoque: true,
    permite_venda_estoque_negativo: false,
    ativo: true,
    gera_comissao: false,
    percentual_comissao: 0,
    localizacao: '',
    observacoes: '',
  });

  useEffect(() => {
    loadGruposEFornecedores();
  }, []);

  useEffect(() => {
    if (produto) {
      setFormData({
        codigo: produto.codigo || '',
        codigo_barras: produto.codigo_barras || '',
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        grupo_id: produto.grupo_id || null,
        categoria: produto.categoria || '',
        tipo: produto.tipo || 'revenda',
        fornecedor_id: produto.fornecedor_id || null,
        quantidade: produto.quantidade || 0,
        quantidade_minima: produto.quantidade_minima || 0,
        unidade_medida: produto.unidade_medida || 'unidade',
        preco_custo: produto.preco_custo || 0,
        preco_venda: produto.preco_venda || 0,
        margem_lucro: produto.margem_lucro || 0,
        controla_estoque: produto.controla_estoque ?? true,
        permite_venda_estoque_negativo: produto.permite_venda_estoque_negativo ?? false,
        ativo: produto.ativo ?? true,
        gera_comissao: produto.gera_comissao ?? false,
        percentual_comissao: produto.percentual_comissao || 0,
        localizacao: produto.localizacao || '',
        observacoes: produto.observacoes || '',
      });
    } else {
      resetForm();
    }
    setError('');
    setActiveTab('geral');
  }, [produto, isOpen]);

  // Auto-calcular margem de lucro
  useEffect(() => {
    if (formData.preco_custo > 0 && formData.preco_venda > 0) {
      const margem = ((formData.preco_venda - formData.preco_custo) / formData.preco_custo) * 100;
      setFormData(prev => ({ ...prev, margem_lucro: Math.round(margem * 100) / 100 }));
    }
  }, [formData.preco_custo, formData.preco_venda]);

  const loadGruposEFornecedores = async () => {
    try {
      const [{ data: gruposData }, { data: fornecedoresData }] = await Promise.all([
        supabase.from('grupos_produtos').select('*').eq('ativo', true).order('nome'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
      ]);

      setGrupos(gruposData || []);
      setFornecedores(fornecedoresData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      codigo_barras: '',
      nome: '',
      descricao: '',
      grupo_id: null,
      categoria: '',
      tipo: 'revenda',
      fornecedor_id: null,
      quantidade: 0,
      quantidade_minima: 0,
      unidade_medida: 'unidade',
      preco_custo: 0,
      preco_venda: 0,
      margem_lucro: 0,
      controla_estoque: true,
      permite_venda_estoque_negativo: false,
      ativo: true,
      gera_comissao: false,
      percentual_comissao: 0,
      localizacao: '',
      observacoes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        grupo_id: formData.grupo_id || null,
        fornecedor_id: formData.fornecedor_id || null,
      };

      if (produto?.id) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update(dataToSave as any)
          .eq('id', produto.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('produtos')
          .insert([dataToSave as any]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: PROD-001"
                />
                <Input
                  label="Código de Barras"
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  placeholder="Ex: 7891234567890"
                />
              </div>

              <Input
                label="Nome do Produto *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Ex: Shampoo L'Oréal Professional 500ml"
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Grupo
                  </label>
                  <select
                    value={formData.grupo_id || ''}
                    onChange={(e) => setFormData({ ...formData, grupo_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione...</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Cabelo, Unha, Pele..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Tipo de Produto *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TIPOS_PRODUTO.map((tipo) => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo: tipo.value })}
                      className={`
                        p-3 border-2 rounded-lg text-left transition-all
                        ${formData.tipo === tipo.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                    >
                      <div className={`font-semibold text-sm ${formData.tipo === tipo.value ? 'text-primary-900' : 'text-neutral-900'}`}>
                        {tipo.label}
                      </div>
                      <div className="text-xs text-neutral-600 mt-1">
                        {tipo.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fornecedor
                </label>
                <select
                  value={formData.fornecedor_id || ''}
                  onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione...</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB: VALORES */}
          {activeTab === 'valores' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço de Custo (R$)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData({ ...formData, preco_custo: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
                <Input
                  label="Preço de Venda (R$) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="0,00"
                />
              </div>

              {formData.preco_custo > 0 && formData.preco_venda > 0 && (
                <div className={`
                  p-4 rounded-lg border-2
                  ${formData.margem_lucro > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
                `}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Margem de Lucro:</span>
                    <span className={`text-2xl font-bold ${formData.margem_lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.margem_lucro.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Lucro: R$ {(formData.preco_venda - formData.preco_custo).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="gera_comissao"
                    checked={formData.gera_comissao}
                    onChange={(e) => setFormData({ ...formData, gera_comissao: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="gera_comissao" className="text-sm font-medium text-neutral-700">
                    Gera Comissão para Profissionais
                  </label>
                </div>

                {formData.gera_comissao && (
                  <Input
                    label="Percentual de Comissão (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentual_comissao}
                    onChange={(e) => setFormData({ ...formData, percentual_comissao: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB: ESTOQUE */}
          {activeTab === 'estoque' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Quantidade Atual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Quantidade Mínima"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantidade_minima}
                  onChange={(e) => setFormData({ ...formData, quantidade_minima: parseFloat(e.target.value) || 0 })}
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {UNIDADES_MEDIDA.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unidade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.quantidade_minima > 0 && formData.quantidade <= formData.quantidade_minima && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Estoque abaixo do mínimo!</span>
                  </div>
                </div>
              )}

              <Input
                label="Localização"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Prateleira A3, Armário 2, Gaveta 5..."
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Informações adicionais sobre o produto..."
                />
              </div>
            </div>
          )}

          {/* TAB: CONFIGURAÇÕES */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="ativo" className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">Produto Ativo</div>
                    <div className="text-xs text-neutral-600">Produto disponível para vendas e uso</div>
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="controla_estoque"
                    checked={formData.controla_estoque}
                    onChange={(e) => setFormData({ ...formData, controla_estoque: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="controla_estoque" className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">Controlar Estoque</div>
                    <div className="text-xs text-neutral-600">Registrar movimentações de entrada e saída</div>
                  </label>
                </div>

                {formData.controla_estoque && (
                  <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                    <input
                      type="checkbox"
                      id="permite_negativo"
                      checked={formData.permite_venda_estoque_negativo}
                      onChange={(e) => setFormData({ ...formData, permite_venda_estoque_negativo: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="permite_negativo" className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">Permitir Estoque Negativo</div>
                      <div className="text-xs text-neutral-600">Permite vendas mesmo com estoque zerado</div>
                    </label>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="text-sm font-semibold text-neutral-900 mb-3">Informações do Sistema</h4>
                {produto?.id && (
                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono">{produto.id}</span>
                    </div>
                    {produto.created_at && (
                      <div className="flex justify-between">
                        <span>Criado em:</span>
                        <span>{new Date(produto.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                    {produto.updated_at && (
                      <div className="flex justify-between">
                        <span>Última atualização:</span>
                        <span>{new Date(produto.updated_at).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : produto ? 'Atualizar Produto' : 'Cadastrar Produto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

