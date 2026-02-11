// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface GrupoProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupo?: any;
  onSave: () => void;
}

const CORES_DISPONIVEIS = [
  { valor: '#3B82F6', nome: 'Azul' },
  { valor: '#8B5CF6', nome: 'Roxo' },
  { valor: '#EC4899', nome: 'Rosa' },
  { valor: '#F59E0B', nome: 'Laranja' },
  { valor: '#10B981', nome: 'Verde' },
  { valor: '#6366F1', nome: 'Índigo' },
  { valor: '#EF4444', nome: 'Vermelho' },
  { valor: '#14B8A6', nome: 'Turquesa' },
  { valor: '#64748B', nome: 'Cinza' },
  { valor: '#78716C', nome: 'Marrom' },
];

export default function GrupoProdutoModal({ isOpen, onClose, grupo, onSave }: GrupoProdutoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    ativo: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (grupo) {
        setFormData({
          nome: grupo.nome || '',
          descricao: grupo.descricao || '',
          cor: grupo.cor || '#3B82F6',
          ativo: grupo.ativo !== false,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, grupo]);

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cor: '#3B82F6',
      ativo: true,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome.trim()) {
        throw new Error('Nome do grupo é obrigatório');
      }

      const dataToSave = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        cor: formData.cor,
        ativo: formData.ativo,
      };

      if (grupo) {
        const { error: updateError } = await supabase
          .from('grupos_produtos')
          .update(dataToSave as any)
          .eq('id', grupo.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('grupos_produtos')
          .insert([dataToSave] as any);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
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
      title={grupo ? 'Editar Grupo de Produto' : 'Novo Grupo de Produto'}
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
          placeholder="Ex: Shampoos, Condicionadores, Coloração..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Descrição do grupo..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Cor do Grupo
          </label>
          <div className="grid grid-cols-5 gap-3">
            {CORES_DISPONIVEIS.map((cor) => (
              <button
                key={cor.valor}
                type="button"
                onClick={() => setFormData({ ...formData, cor: cor.valor })}
                className={`
                  relative h-12 rounded-lg border-2 transition-all
                  ${formData.cor === cor.valor ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105'}
                `}
                style={{ backgroundColor: cor.valor }}
                title={cor.nome}
              >
                {formData.cor === cor.valor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <label htmlFor="ativo" className="text-sm text-neutral-700">Grupo Ativo</label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : grupo ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

