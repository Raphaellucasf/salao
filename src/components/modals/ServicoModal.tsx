// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

interface ServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  servico?: any;
  onSuccess?: () => void;
}

export function ServicoModal({ isOpen, onClose, servico, onSuccess }: ServicoModalProps) {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [duracao, setDuracao] = useState('60');
  const [preco, setPreco] = useState('');
  const [comissao, setComissao] = useState('50');
  const [ativo, setAtivo] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [loading, setLoading] = useState(false);

  // Calcular valores de comissão (memoizado)
  const valoresCalculados = useMemo(() => {
    const precoNum = parseFloat(preco) || 0;
    const comissaoNum = parseFloat(comissao) || 0;
    const valorComissao = (precoNum * comissaoNum) / 100;
    const valorSalao = precoNum - valorComissao;
    return { valorComissao, valorSalao };
  }, [preco, comissao]);

  const resetForm = useCallback(() => {
    setCodigo('');
    setNome('');
    setDescricao('');
    setCategoria('');
    setDuracao('60');
    setPreco('');
    setComissao('50');
    setAtivo(true);
    setObservacoes('');
    setGrupoId('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    if (servico) {
      setCodigo(servico.codigo || '');
      setNome(servico.nome || '');
      setDescricao(servico.descricao || '');
      setCategoria(servico.categoria || '');
      setDuracao(String(servico.duracao_minutos || servico.duracao || 60));
      setPreco(String(servico.preco || ''));
      setComissao(String(servico.comissao || 50));
      setAtivo(servico.ativo !== false);
      setObservacoes(servico.observacoes || '');
      setGrupoId(servico.grupo_id || '');
    } else {
      resetForm();
    }
  }, [servico, isOpen, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !preco) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (!grupoId) {
      alert('É necessário selecionar um grupo para o serviço');
      return;
    }

    try {
      setLoading(true);

      const dados = {
        codigo: codigo || null,
        nome,
        descricao,
        categoria: categoria || null,
        duracao_minutos: parseInt(duracao),
        preco: parseFloat(preco),
        comissao: parseFloat(comissao),
        ativo,
        observacoes,
        grupo_id: grupoId
      };

      if (servico?.id) {
        const { error } = await supabase
          .from('servicos')
          .update(dados)
          .eq('id', servico.id);

        if (error) throw error;
        alert('Serviço atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert(dados);

        if (error) throw error;
        alert('Serviço criado com sucesso!');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      alert(error.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  }, [nome, preco, grupoId, codigo, descricao, categoria, duracao, comissao, ativo, observacoes, servico, onSuccess, handleClose]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={servico ? 'Editar Serviço' : 'Novo Serviço'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Código */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Código (opcional)
          </label>
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: 001, SRV-123"
          />
          <p className="text-xs text-gray-500 mt-1">
            Código interno para identificação
          </p>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome do Serviço *
          </label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Corte Feminino, Manicure Completa"
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Categoria (opcional)
          </label>
          <Input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ex: Química, Hidratação, Corte..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Subcategoria dentro do grupo (opcional)
          </p>
        </div>

        {/* Duração e Preço */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Duração (minutos) *
            </label>
            <Input
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="60"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Preço (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="100.00"
              min="0"
              required
            />
          </div>
        </div>

        {/* Comissão */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Comissão (%) *
          </label>
          <Input
            type="number"
            step="0.1"
            value={comissao}
            onChange={(e) => setComissao(e.target.value)}
            placeholder="50.0"
            min="0"
            max="100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Percentual de comissão para o profissional
          </p>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição detalhada do serviço"
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={3}
          />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações internas sobre o serviço"
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={2}
          />
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ativo"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="ativo" className="text-sm font-medium">
            Serviço ativo (disponível para agendamento)
          </label>
        </div>

        {/* Preview do Valor da Comissão */}
        {preco && comissao && valoresCalculados.valorComissao > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Valores calculados:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Comissão profissional:</span>
                <span className="ml-2 font-bold text-blue-600">
                  R$ {valoresCalculados.valorComissao.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Valor salão:</span>
                <span className="ml-2 font-bold text-green-600">
                  R$ {valoresCalculados.valorSalao.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

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
            {loading ? 'Salvando...' : servico ? 'Atualizar' : 'Criar Serviço'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

