'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, X } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
  onSuccess?: () => void;
}

interface CampoPadrao {
  nome: string;
  valor: string;
  tipo: string;
}

export function TemplateModal({ isOpen, onClose, template, onSuccess }: TemplateModalProps) {
  const [tipo, setTipo] = useState('cliente');
  const [nomeTemplate, setNomeTemplate] = useState('');
  const [descricao, setDescricao] = useState('');
  const [campos, setCampos] = useState<CampoPadrao[]>([]);
  const [camposObrigatorios, setCamposObrigatorios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setTipo(template.tipo || 'cliente');
      setNomeTemplate(template.nome_template || '');
      setDescricao(template.descricao || '');
      setCampos(template.campos_padrao || []);
      setCamposObrigatorios(template.campos_obrigatorios || []);
    } else {
      resetForm();
    }
  }, [template]);

  const resetForm = () => {
    setTipo('cliente');
    setNomeTemplate('');
    setDescricao('');
    setCampos([]);
    setCamposObrigatorios([]);
  };

  const adicionarCampo = () => {
    setCampos([...campos, { nome: '', valor: '', tipo: 'text' }]);
  };

  const removerCampo = (index: number) => {
    const novosCampos = campos.filter((_, i) => i !== index);
    setCampos(novosCampos);
  };

  const atualizarCampo = (index: number, field: keyof CampoPadrao, value: string) => {
    const novosCampos = [...campos];
    novosCampos[index][field] = value;
    setCampos(novosCampos);
  };

  const toggleCampoObrigatorio = (nomeCampo: string) => {
    if (camposObrigatorios.includes(nomeCampo)) {
      setCamposObrigatorios(camposObrigatorios.filter(c => c !== nomeCampo));
    } else {
      setCamposObrigatorios([...camposObrigatorios, nomeCampo]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeTemplate || campos.length === 0) {
      alert('Preencha o nome do template e adicione pelo menos um campo');
      return;
    }

    try {
      setLoading(true);

      const dados = {
        tipo,
        nome_template: nomeTemplate,
        descricao,
        campos_padrao: campos,
        campos_obrigatorios: camposObrigatorios,
        ativo: true
      };

      if (template?.id) {
        // Atualizar
        const { error } = await supabase
          .from('cadastro_templates')
          .update(dados)
          .eq('id', template.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('cadastro_templates')
          .insert(dados);

        if (error) throw error;
      }

      alert('Template salvo com sucesso!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={template ? 'Editar Template' : 'Novo Template de Cadastro'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Cadastro *
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="cliente">Cliente</option>
            <option value="produto">Produto</option>
            <option value="servico">Serviço</option>
            <option value="profissional">Profissional</option>
            <option value="fornecedor">Fornecedor</option>
          </select>
        </div>

        {/* Nome do Template */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome do Template *
          </label>
          <Input
            value={nomeTemplate}
            onChange={(e) => setNomeTemplate(e.target.value)}
            placeholder="Ex: Cliente VIP, Produto para Revenda"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do template"
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={2}
          />
        </div>

        {/* Campos Padrão */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Campos Padrão *
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={adicionarCampo}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Campo
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {campos.map((campo, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Campo {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerCampo(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nome do Campo
                    </label>
                    <Input
                      value={campo.nome}
                      onChange={(e) => atualizarCampo(index, 'nome', e.target.value)}
                      placeholder="Ex: telefone, cpf"
                      size="sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Tipo
                    </label>
                    <select
                      value={campo.tipo}
                      onChange={(e) => atualizarCampo(index, 'tipo', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="text">Texto</option>
                      <option value="email">E-mail</option>
                      <option value="tel">Telefone</option>
                      <option value="number">Número</option>
                      <option value="date">Data</option>
                      <option value="select">Seleção</option>
                      <option value="textarea">Texto Longo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Valor Padrão
                  </label>
                  <Input
                    value={campo.valor}
                    onChange={(e) => atualizarCampo(index, 'valor', e.target.value)}
                    placeholder="Valor padrão (opcional)"
                    size="sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`obrigatorio-${index}`}
                    checked={camposObrigatorios.includes(campo.nome)}
                    onChange={() => toggleCampoObrigatorio(campo.nome)}
                    className="mr-2"
                    disabled={!campo.nome}
                  />
                  <label htmlFor={`obrigatorio-${index}`} className="text-xs text-gray-600">
                    Campo obrigatório
                  </label>
                </div>
              </div>
            ))}
          </div>

          {campos.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed rounded-lg">
              Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
