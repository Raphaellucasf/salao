// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useFormCache } from '@/hooks/useFormCache';
import { verificarPacoteAtivo, type PacoteAtivo } from '@/services/pacotes';

interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  email: string;
  status?: string;
  cpf?: string;
  data_nascimento?: string;
}

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: () => void;
  titulo?: string;
}

export default function ClienteModal({ isOpen, onClose, cliente, onSave, titulo }: ClienteModalProps) {
  const formCache = useFormCache<Cliente>('cliente_novo');
  const [formData, setFormData] = useState<Cliente>({
    nome: '',
    telefone: '',
    email: '',
    status: 'ativo',
    cpf: '',
    data_nascimento: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacotesAtivos, setPacotesAtivos] = useState<PacoteAtivo[]>([]);

  useEffect(() => {
    if (cliente?.id) {
      verificarPacoteAtivo(cliente.id)
        .then(setPacotesAtivos)
        .catch(() => setPacotesAtivos([]));
    } else {
      setPacotesAtivos([]);
    }
  }, [cliente]);

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      const cached = formCache.load();
      setFormData(cached ?? { nome: '', telefone: '', email: '', status: 'ativo', cpf: '', data_nascimento: '' });
    }
    setError('');
  }, [cliente, isOpen]);

  // Persiste no cache enquanto preenche (apenas novo cadastro)
  useEffect(() => {
    if (!cliente?.id && isOpen) formCache.save(formData);
  }, [formData]);

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
            email: formData.email || null,
            status: formData.status,
            cpf: formData.cpf || null,
            data_nascimento: formData.data_nascimento || null,
            ...(formData.cpf ? { cadastro_completo: true } : {}),
          })
          .eq('id', cliente.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([{
            id: crypto.randomUUID(),
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email?.trim() || null,
            status: formData.status || 'ativo',
            cpf: formData.cpf?.trim() || null,
            data_nascimento: formData.data_nascimento || null,
          }]);

        if (insertError) throw insertError;
      }

      onSave();
      formCache.clear();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo ?? (cliente ? 'Editar Cliente' : 'Novo Cliente')}>
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
            label="CPF"
            type="text"
            value={formData.cpf || ''}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={formData.data_nascimento || ''}
            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
          />
        </div>

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

        {/* Pacotes Ativos */}
        {cliente && pacotesAtivos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <span className="text-xl">🎁</span> Pacotes Ativos
            </h3>
            <div className="space-y-2">
              {pacotesAtivos.map((pacote) => {
                const disponivel = pacote.sessoes_total - pacote.sessoes_consumidas;
                const perc = Math.round((pacote.sessoes_consumidas / pacote.sessoes_total) * 100);
                return (
                  <div key={pacote.id} className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-neutral-800 text-sm">{pacote.servico?.nome || 'Serviço'}</span>
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                        {disponivel} sessões restando
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${perc}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-neutral-500">Usadas: {pacote.sessoes_consumidas}</span>
                      <span className="text-[10px] text-neutral-500">Total: {pacote.sessoes_total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
