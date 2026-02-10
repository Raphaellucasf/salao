'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface FornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor?: any;
  onSave: () => void;
}

export default function FornecedorModal({ isOpen, onClose, fornecedor, onSave }: FornecedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    telefone: '',
    celular: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    nome_representante: '',
    telefone_representante: '',
    email_representante: '',
    observacoes: '',
    ativo: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (fornecedor) {
        setFormData({
          nome: fornecedor.nome || '',
          nome_fantasia: fornecedor.nome_fantasia || '',
          cnpj: fornecedor.cnpj || '',
          email: fornecedor.email || '',
          telefone: fornecedor.telefone || '',
          celular: fornecedor.celular || '',
          endereco: fornecedor.endereco || '',
          cidade: fornecedor.cidade || '',
          estado: fornecedor.estado || '',
          cep: fornecedor.cep || '',
          nome_representante: fornecedor.nome_representante || '',
          telefone_representante: fornecedor.telefone_representante || '',
          email_representante: fornecedor.email_representante || '',
          observacoes: fornecedor.observacoes || '',
          ativo: fornecedor.ativo !== false,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, fornecedor]);

  const resetForm = () => {
    setFormData({
      nome: '',
      nome_fantasia: '',
      cnpj: '',
      email: '',
      telefone: '',
      celular: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      nome_representante: '',
      telefone_representante: '',
      email_representante: '',
      observacoes: '',
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
        throw new Error('Nome do fornecedor é obrigatório');
      }

      const dataToSave = {
        nome: formData.nome.trim(),
        nome_fantasia: formData.nome_fantasia.trim() || null,
        cnpj: formData.cnpj.trim() || null,
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        celular: formData.celular.trim() || null,
        endereco: formData.endereco.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim() || null,
        cep: formData.cep.trim() || null,
        nome_representante: formData.nome_representante.trim() || null,
        telefone_representante: formData.telefone_representante.trim() || null,
        email_representante: formData.email_representante.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
      };

      if (fornecedor) {
        const { error: updateError } = await supabase
          .from('fornecedores')
          .update(dataToSave as any)
          .eq('id', fornecedor.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('fornecedores')
          .insert([dataToSave] as any);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Dados Principais */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Dados Principais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />

            <Input
              label="Nome Fantasia"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
            />

            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <label htmlFor="ativo" className="text-sm text-neutral-700">Fornecedor Ativo</label>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Contato</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 0000-0000"
            />

            <Input
              label="Celular"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Endereço</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Endereço Completo"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              />

              <Input
                label="Estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                maxLength={2}
                placeholder="SP"
              />

              <Input
                label="CEP"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        {/* Representante */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Representante Comercial</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nome do Representante"
              value={formData.nome_representante}
              onChange={(e) => setFormData({ ...formData, nome_representante: e.target.value })}
            />

            <Input
              label="Telefone do Representante"
              value={formData.telefone_representante}
              onChange={(e) => setFormData({ ...formData, telefone_representante: e.target.value })}
              placeholder="(00) 00000-0000"
            />

            <Input
              label="Email do Representante"
              type="email"
              value={formData.email_representante}
              onChange={(e) => setFormData({ ...formData, email_representante: e.target.value })}
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Informações adicionais sobre o fornecedor..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : fornecedor ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
