// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  email: string;
  status?: string;
}

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: () => void;
}

export default function ClienteModal({ isOpen, onClose, cliente, onSave }: ClienteModalProps) {
  const [formData, setFormData] = useState<Cliente>({
    nome: '',
    telefone: '',
    email: '',
    status: 'ativo',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({ nome: '', telefone: '', email: '', status: 'ativo' });
    }
    setError('');
  }, [cliente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (cliente?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email,
            status: formData.status,
          })
          .eq('id', cliente.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([{
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email,
            status: formData.status,
          }]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cliente ? 'Editar Cliente' : 'Novo Cliente'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nome Completo"
          type="text"
          required
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Maria Silva"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefone"
            type="tel"
            required
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(11) 98765-4321"
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
          <select
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="flex-1">
            {cliente ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
