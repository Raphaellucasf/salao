'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface ProfissionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profissional?: any;
  onSave: () => void;
}

// Grupos fixos de profissionais
const GRUPOS_PROFISSIONAIS = [
  'Aplicação Procedimento',
  'Cabelo',
  'Cabelo Festa',
  'Eventos',
  'Estética',
  'Finalização',
  'Manicure e Pedicure',
];

// Dias da semana
const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function ProfissionalModal({ isOpen, onClose, profissional, onSave }: ProfissionalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    // Remuneração
    tem_salario_fixo: false,
    salario_fixo: 0,
    recebe_comissao: true,
    percentual_comissao: 50,
    // Configurações
    grupos: [] as string[],
    dias_trabalho: [] as number[],
    hora_inicio: '09:00',
    hora_fim: '18:00',
    ativo: true,
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (profissional) {
        setFormData({
          nome: profissional.nome || '',
          email: profissional.email || '',
          telefone: profissional.telefone || '',
          cpf: profissional.cpf || '',
          data_nascimento: profissional.data_nascimento || '',
          endereco: profissional.endereco || '',
          cidade: profissional.cidade || '',
          estado: profissional.estado || '',
          cep: profissional.cep || '',
          tem_salario_fixo: profissional.tem_salario_fixo || false,
          salario_fixo: profissional.salario_fixo || 0,
          recebe_comissao: profissional.recebe_comissao !== false,
          percentual_comissao: profissional.percentual_comissao || 50,
          grupos: profissional.grupos || [],
          dias_trabalho: profissional.dias_trabalho || [1, 2, 3, 4, 5],
          hora_inicio: profissional.hora_inicio || '09:00',
          hora_fim: profissional.hora_fim || '18:00',
          ativo: profissional.ativo !== false,
          observacoes: profissional.observacoes || '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, profissional]);

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      data_nascimento: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      tem_salario_fixo: false,
      salario_fixo: 0,
      recebe_comissao: true,
      percentual_comissao: 50,
      grupos: [],
      dias_trabalho: [1, 2, 3, 4, 5], // Segunda a Sexta por padrão
      hora_inicio: '09:00',
      hora_fim: '18:00',
      ativo: true,
      observacoes: '',
    });
    setError('');
  };

  const toggleGrupo = (grupo: string) => {
    setFormData(prev => ({
      ...prev,
      grupos: prev.grupos.includes(grupo)
        ? prev.grupos.filter(g => g !== grupo)
        : [...prev.grupos, grupo]
    }));
  };

  const toggleDia = (dia: number) => {
    setFormData(prev => ({
      ...prev,
      dias_trabalho: prev.dias_trabalho.includes(dia)
        ? prev.dias_trabalho.filter(d => d !== dia)
        : [...prev.dias_trabalho, dia].sort()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }

    if (formData.grupos.length === 0) {
      setError('Selecione pelo menos um grupo');
      setLoading(false);
      return;
    }

    if (formData.dias_trabalho.length === 0) {
      setError('Selecione pelo menos um dia de trabalho');
      setLoading(false);
      return;
    }

    try {
      const dataToSave = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || null,
        cpf: formData.cpf || null,
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        tem_salario_fixo: formData.tem_salario_fixo,
        salario_fixo: formData.tem_salario_fixo ? formData.salario_fixo : null,
        recebe_comissao: formData.recebe_comissao,
        percentual_comissao: formData.recebe_comissao ? formData.percentual_comissao : null,
        grupos: formData.grupos,
        dias_trabalho: formData.dias_trabalho,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        ativo: formData.ativo,
        observacoes: formData.observacoes || null,
      };

      if (profissional) {
        // Atualizar profissional existente
        const { error: updateError } = await supabase
          .from('profissionais')
          .update(dataToSave)
          .eq('id', profissional.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo profissional
        const { error: insertError } = await supabase
          .from('profissionais')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar profissional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={profissional ? 'Editar Profissional' : 'Novo Profissional'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Dados Pessoais */}
        <div>
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Dados Pessoais</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome Completo *"
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do profissional"
            />

            <Input
              label="Email *"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />

            <Input
              label="CPF"
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />

            <Input
              label="Data de Nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
            />

            <Input
              label="CEP"
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              placeholder="00000-000"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="col-span-2">
              <Input
                label="Endereço"
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>

            <Input
              label="Cidade"
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Cidade"
            />
          </div>
        </div>

        {/* Remuneração */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Remuneração</h3>
          
          <div className="space-y-4">
            {/* Salário Fixo */}
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="tem_salario_fixo"
                  checked={formData.tem_salario_fixo}
                  onChange={(e) => setFormData({ ...formData, tem_salario_fixo: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="tem_salario_fixo" className="text-sm font-medium text-neutral-700">
                  Tem Salário Fixo
                </label>
              </div>

              {formData.tem_salario_fixo && (
                <div className="flex-1">
                  <Input
                    label="Valor do Salário Fixo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salario_fixo}
                    onChange={(e) => setFormData({ ...formData, salario_fixo: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Comissão */}
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="recebe_comissao"
                  checked={formData.recebe_comissao}
                  onChange={(e) => setFormData({ ...formData, recebe_comissao: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="recebe_comissao" className="text-sm font-medium text-neutral-700">
                  Recebe Comissão
                </label>
              </div>

              {formData.recebe_comissao && (
                <div className="flex-1">
                  <Input
                    label="Percentual de Comissão (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.percentual_comissao}
                    onChange={(e) => setFormData({ ...formData, percentual_comissao: parseFloat(e.target.value) || 0 })}
                    placeholder="50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grupos de Atuação */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Grupos de Atuação *</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GRUPOS_PROFISSIONAIS.map((grupo) => (
              <label
                key={grupo}
                className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.grupos.includes(grupo)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.grupos.includes(grupo)}
                  onChange={() => toggleGrupo(grupo)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">{grupo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dias de Trabalho */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Disponibilidade *</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Dias de Trabalho
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <label
                    key={dia.value}
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      formData.dias_trabalho.includes(dia.value)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.dias_trabalho.includes(dia.value)}
                      onChange={() => toggleDia(dia.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      {dia.label.substring(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Horário de Início"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              />

              <Input
                label="Horário de Término"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Informações adicionais sobre o profissional..."
          />
        </div>

        {/* Status */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-neutral-700">
              Profissional Ativo
            </label>
          </div>
        </div>

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
            disabled={loading}
          >
            {loading ? 'Salvando...' : profissional ? 'Atualizar' : 'Criar Profissional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
