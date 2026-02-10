'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PacoteServico {
  servico_id?: string;
  servico_nome: string;
  quantidade: number;
}

interface PacoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacote?: any;
  onSave: () => void;
}

export default function PacoteModal({ isOpen, onClose, pacote, onSave }: PacoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servicos, setServicos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    validade_dias: 30,
    ativo: true,
  });

  const [servicosPacote, setServicosPacote] = useState<PacoteServico[]>([]);
  const [novoServico, setNovoServico] = useState<PacoteServico>({
    servico_nome: '',
    quantidade: 1,
  });

  useEffect(() => {
    if (isOpen) {
      loadServicos();
      if (pacote) {
        loadPacote();
      } else {
        resetForm();
      }
    }
  }, [isOpen, pacote]);

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const loadPacote = async () => {
    if (!pacote) return;

    try {
      const { data: servicosData } = await supabase
        .from('pacote_servicos')
        .select('*')
        .eq('pacote_id', pacote.id);

      setFormData({
        nome: pacote.nome || '',
        descricao: pacote.descricao || '',
        preco: pacote.preco || 0,
        validade_dias: pacote.validade_dias || 30,
        ativo: pacote.ativo !== false,
      });

      setServicosPacote(servicosData || []);
    } catch (err) {
      console.error('Erro ao carregar pacote:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      validade_dias: 30,
      ativo: true,
    });
    setServicosPacote([]);
    setNovoServico({
      servico_nome: '',
      quantidade: 1,
    });
    setError('');
  };

  const handleServicoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const servicoId = e.target.value;
    const servico = servicos.find(s => s.id === servicoId);
    
    if (servico) {
      setNovoServico({
        servico_id: servico.id,
        servico_nome: servico.nome,
        quantidade: 1,
      });
    }
  };

  const adicionarServico = () => {
    if (!novoServico.servico_nome) {
      setError('Selecione um serviço');
      return;
    }

    // Verificar se já existe
    const existe = servicosPacote.some(s => s.servico_id === novoServico.servico_id);
    if (existe) {
      setError('Este serviço já foi adicionado');
      return;
    }

    setServicosPacote([...servicosPacote, { ...novoServico }]);
    setNovoServico({
      servico_nome: '',
      quantidade: 1,
    });
    setError('');
  };

  const removerServico = (index: number) => {
    setServicosPacote(servicosPacote.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (servicosPacote.length === 0) {
      setError('Adicione pelo menos um serviço ao pacote');
      setLoading(false);
      return;
    }

    try {
      if (pacote) {
        // Atualizar pacote existente
        const { error: updateError } = await supabase
          .from('pacotes')
          .update(formData)
          .eq('id', pacote.id);

        if (updateError) throw updateError;

        // Deletar serviços antigos
        await supabase.from('pacote_servicos').delete().eq('pacote_id', pacote.id);

        // Inserir novos serviços
        const { error: servicosError } = await supabase
          .from('pacote_servicos')
          .insert(servicosPacote.map(s => ({
            pacote_id: pacote.id,
            ...s,
          })));

        if (servicosError) throw servicosError;
      } else {
        // Criar novo pacote
        const { data: novoPacote, error: insertError } = await supabase
          .from('pacotes')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Inserir serviços
        const { error: servicosError } = await supabase
          .from('pacote_servicos')
          .insert(servicosPacote.map(s => ({
            pacote_id: novoPacote.id,
            ...s,
          })));

        if (servicosError) throw servicosError;
      }

      onSave();
      onClose();
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
      title={pacote ? 'Editar Pacote' : 'Novo Pacote'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nome do Pacote"
          type="text"
          required
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Pacote Corte e Barba"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Descreva o pacote..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Preço do Pacote"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.preco}
            onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
            placeholder="0.00"
          />

          <Input
            label="Validade (dias)"
            type="number"
            min="1"
            required
            value={formData.validade_dias}
            onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) })}
            placeholder="30"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-neutral-700">
            Pacote Ativo
          </label>
        </div>

        {/* Adicionar Serviço */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-neutral-900 mb-3">Serviços Inclusos</h3>
          
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Serviço</label>
              <select
                onChange={handleServicoSelect}
                value={novoServico.servico_id || ''}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">Selecione um serviço...</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome} - R$ {s.preco}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Quantidade</label>
              <Input
                type="number"
                min="1"
                value={novoServico.quantidade}
                onChange={(e) => setNovoServico({ ...novoServico, quantidade: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="col-span-1 flex items-end">
              <Button type="button" onClick={adicionarServico} variant="primary" size="sm" className="w-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Serviços */}
        {servicosPacote.length > 0 && (
          <div className="border-t pt-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {servicosPacote.map((servico, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{servico.servico_nome}</p>
                    <p className="text-xs text-neutral-600">
                      Quantidade: {servico.quantidade}x
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerServico(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            disabled={loading || servicosPacote.length === 0}
          >
            {loading ? 'Salvando...' : pacote ? 'Atualizar' : 'Criar Pacote'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
