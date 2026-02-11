// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Box, DollarSign, Clock, Scissors, Plus, X } from 'lucide-react';

interface PacoteServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacote?: any;
  onSave: () => void;
}

export default function PacoteServicoModal({ isOpen, onClose, pacote, onSave }: PacoteServicoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servicos, setServicos] = useState<any[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    preco_total: 0,
    validade_dias: 30,
    permite_parcelamento: true,
    max_parcelas: 12,
    cor: '#EC4899',
    icone: 'sparkles',
    ativo: true,
    observacoes: '',
    termos_uso: '',
  });

  useEffect(() => {
    loadServicos();
  }, []);

  useEffect(() => {
    if (pacote) {
      setFormData({
        codigo: pacote.codigo || '',
        nome: pacote.nome || '',
        descricao: pacote.descricao || '',
        preco_total: pacote.preco_total || 0,
        validade_dias: pacote.validade_dias || 30,
        permite_parcelamento: pacote.permite_parcelamento ?? true,
        max_parcelas: pacote.max_parcelas || 12,
        cor: pacote.cor || '#EC4899',
        icone: pacote.icone || 'sparkles',
        ativo: pacote.ativo ?? true,
        observacoes: pacote.observacoes || '',
        termos_uso: pacote.termos_uso || '',
      });
      loadPacoteItens(pacote.id);
    } else {
      resetForm();
    }
    setError('');
  }, [pacote, isOpen]);

  const loadServicos = async () => {
    try {
      const { data } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      setServicos(data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const loadPacoteItens = async (pacoteId: string) => {
    try {
      const { data } = await supabase
        .from('pacotes_servicos_itens')
        .select('*, servicos(*)')
        .eq('pacote_id', pacoteId)
        .order('ordem');
      
      if (data) {
        setServicosSelecionados(data.map((item: any) => ({
          servico_id: item.servico_id,
          quantidade: item.quantidade,
          ordem: item.ordem,
          servico: item.servicos,
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar itens do pacote:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      preco_total: 0,
      validade_dias: 30,
      permite_parcelamento: true,
      max_parcelas: 12,
      cor: '#EC4899',
      icone: 'sparkles',
      ativo: true,
      observacoes: '',
      termos_uso: '',
    });
    setServicosSelecionados([]);
  };

  const adicionarServico = (servico: any) => {
    if (servicosSelecionados.find(s => s.servico_id === servico.id)) {
      return; // Já está na lista
    }

    setServicosSelecionados([
      ...servicosSelecionados,
      {
        servico_id: servico.id,
        quantidade: 1,
        ordem: servicosSelecionados.length + 1,
        servico: servico,
      },
    ]);
  };

  const removerServico = (servicoId: string) => {
    setServicosSelecionados(servicosSelecionados.filter(s => s.servico_id !== servicoId));
  };

  const atualizarQuantidade = (servicoId: string, quantidade: number) => {
    setServicosSelecionados(servicosSelecionados.map(s =>
      s.servico_id === servicoId ? { ...s, quantidade: Math.max(1, quantidade) } : s
    ));
  };

  // Cálculos automáticos
  const precoOriginal = servicosSelecionados.reduce((sum, item) => 
    sum + (item.servico.preco * item.quantidade), 0
  );
  const duracaoTotal = servicosSelecionados.reduce((sum, item) => 
    sum + (item.servico.duracao_minutos * item.quantidade), 0
  );
  const desconto = precoOriginal > 0 && formData.preco_total > 0 
    ? ((precoOriginal - formData.preco_total) / precoOriginal) * 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (servicosSelecionados.length === 0) {
        throw new Error('Adicione pelo menos um serviço ao pacote');
      }

      if (formData.preco_total <= 0) {
        throw new Error('Preço total deve ser maior que zero');
      }

      let pacoteId = pacote?.id;

      if (pacoteId) {
        // Update pacote
        const { error: updateError } = await supabase
          .from('pacotes_servicos')
          .update(formData as any)
          .eq('id', pacoteId);

        if (updateError) throw updateError;

        // Delete old itens
        await supabase
          .from('pacotes_servicos_itens')
          .delete()
          .eq('pacote_id', pacoteId);
      } else {
        // Insert pacote
        const { data, error: insertError } = await supabase
          .from('pacotes_servicos')
          .insert([formData as any])
          .select()
          .single();

        if (insertError) throw insertError;
        pacoteId = data.id;
      }

      // Insert itens
      const itens = servicosSelecionados.map((item, index) => ({
        pacote_id: pacoteId,
        servico_id: item.servico_id,
        quantidade: item.quantidade,
        ordem: index + 1,
      }));

      const { error: itensError } = await supabase
        .from('pacotes_servicos_itens')
        .insert(itens);

      if (itensError) throw itensError;

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar pacote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pacote ? 'Editar Pacote de Serviços' : 'Novo Pacote de Serviços'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Informações Básicas */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: PKG-001"
            />
            <Input
              label="Nome do Pacote *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Ex: Dia de Beleza Completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição do pacote..."
            />
          </div>
        </div>

        {/* Serviços do Pacote */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Serviços Incluídos</h3>
          
          <div className="space-y-2 mb-4">
            {servicosSelecionados.map((item) => (
              <div key={item.servico_id} className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{item.servico.nome}</div>
                  <div className="text-sm text-neutral-600">
                    R$ {item.servico.preco.toFixed(2)} • {item.servico.duracao_minutos} min
                  </div>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => atualizarQuantidade(item.servico_id, parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <button
                  type="button"
                  onClick={() => removerServico(item.servico_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {servicosSelecionados.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                Nenhum serviço adicionado
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Adicionar Serviço
            </label>
            <select
              onChange={(e) => {
                const servico = servicos.find(s => s.id === e.target.value);
                if (servico) {
                  adicionarServico(servico);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione um serviço...</option>
              {servicos
                .filter(s => !servicosSelecionados.find(sel => sel.servico_id === s.id))
                .map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Resumo */}
        {servicosSelecionados.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-neutral-900 mb-3">Resumo do Pacote</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Preço Original:</span>
                <p className="text-lg font-bold text-neutral-900">R$ {precoOriginal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-neutral-600">Duração Total:</span>
                <p className="text-lg font-bold text-neutral-900">{duracaoTotal} min ({(duracaoTotal / 60).toFixed(1)}h)</p>
              </div>
            </div>
          </div>
        )}

        {/* Valores */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço do Pacote (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.preco_total}
              onChange={(e) => setFormData({ ...formData, preco_total: parseFloat(e.target.value) || 0 })}
              required
              placeholder="0,00"
            />
            <Input
              label="Validade (dias)"
              type="number"
              min="1"
              value={formData.validade_dias}
              onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) || 30 })}
              placeholder="30"
            />
          </div>

          {desconto > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Desconto do Pacote:</span>
                <span className="text-xl font-bold text-green-600">
                  {desconto.toFixed(0)}% OFF
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Parcelamento */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
            <input
              type="checkbox"
              id="permite_parcelamento"
              checked={formData.permite_parcelamento}
              onChange={(e) => setFormData({ ...formData, permite_parcelamento: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="permite_parcelamento" className="flex-1">
              <div className="text-sm font-medium text-neutral-900">Permite Parcelamento</div>
            </label>
          </div>

          {formData.permite_parcelamento && (
            <Input
              label="Máximo de Parcelas"
              type="number"
              min="2"
              max="24"
              value={formData.max_parcelas}
              onChange={(e) => setFormData({ ...formData, max_parcelas: parseInt(e.target.value) || 12 })}
            />
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Termos de Uso
          </label>
          <textarea
            value={formData.termos_uso}
            onChange={(e) => setFormData({ ...formData, termos_uso: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Termos e condições do pacote..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : pacote ? 'Atualizar Pacote' : 'Criar Pacote'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

