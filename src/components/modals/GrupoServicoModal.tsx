'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';

interface GrupoServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupo?: any;
  onSave: () => void;
}

const CORES_DISPONIVEIS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // orange
  '#10B981', // green
  '#6366F1', // indigo
  '#EF4444', // red
  '#14B8A6', // teal
  '#64748B', // slate
  '#78716C', // stone
];

const ICONES_DISPONIVEIS = [
  { value: 'scissors', label: '✂️ Tesoura' },
  { value: 'sparkles', label: '✨ Brilho' },
  { value: 'droplet', label: '💧 Gota' },
  { value: 'zap', label: '⚡ Raio' },
  { value: 'hand', label: '✋ Mão' },
  { value: 'footprints', label: '👣 Pés' },
  { value: 'eye', label: '👁️ Olho' },
  { value: 'heart', label: '❤️ Coração' },
];

export default function GrupoServicoModal({ isOpen, onClose, grupo, onSave }: GrupoServicoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: CORES_DISPONIVEIS[0],
    icone: 'scissors',
    ativo: true,
  });

  useEffect(() => {
    if (grupo) {
      setFormData({
        nome: grupo.nome || '',
        descricao: grupo.descricao || '',
        cor: grupo.cor || CORES_DISPONIVEIS[0],
        icone: grupo.icone || 'scissors',
        ativo: grupo.ativo ?? true,
      });
    } else {
      resetForm();
    }
    setError('');
  }, [grupo, isOpen]);

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cor: CORES_DISPONIVEIS[0],
      icone: 'scissors',
      ativo: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (grupo?.id) {
        const { error: updateError } = await supabase
          .from('grupos_servicos')
          .update(formData as any)
          .eq('id', grupo.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('grupos_servicos')
          .insert([formData as any]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={grupo ? 'Editar Grupo de Serviços' : 'Novo Grupo de Serviços'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="Nome do Grupo *"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
          placeholder="Ex: Cabelo - Corte"
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
            placeholder="Descrição do grupo de serviços..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Cor do Grupo
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CORES_DISPONIVEIS.map((cor) => (
              <button
                key={cor}
                type="button"
                onClick={() => setFormData({ ...formData, cor })}
                className={`
                  relative h-12 rounded-lg transition-all
                  ${formData.cor === cor ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'hover:scale-105'}
                `}
                style={{ backgroundColor: cor }}
              >
                {formData.cor === cor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Ícone
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ICONES_DISPONIVEIS.map((icone) => (
              <button
                key={icone.value}
                type="button"
                onClick={() => setFormData({ ...formData, icone: icone.value })}
                className={`
                  p-3 border-2 rounded-lg text-center transition-all
                  ${formData.icone === icone.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <div className="text-2xl mb-1">{icone.label.split(' ')[0]}</div>
                <div className="text-xs text-neutral-600">{icone.label.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="ativo" className="flex-1">
            <div className="text-sm font-medium text-neutral-900">Grupo Ativo</div>
            <div className="text-xs text-neutral-600">Grupo disponível para novos serviços</div>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : grupo ? 'Atualizar Grupo' : 'Criar Grupo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
