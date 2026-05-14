// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { X as XIcon } from 'lucide-react';
import EtapasServicoEditor from './EtapasServicoEditor';

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
  const [termosBusca, setTermosBusca] = useState<string[]>([]);
  const [termoInput, setTermoInput] = useState('');
  const [duracao, setDuracao] = useState('60');
  const [preco, setPreco] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [temEtapas, setTemEtapas] = useState(false);
  const [duracaoCalculada, setDuracaoCalculada] = useState(false);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);

  const resetForm = useCallback(() => {
    setCodigo('');
    setNome('');
    setDescricao('');
    setTermosBusca([]);
    setTermoInput('');
    setDuracao('60');
    setPreco('');
    setAtivo(true);
    setObservacoes('');
    setGrupoId('');
    setTemEtapas(false);
    setDuracaoCalculada(false);
    setEtapas([]);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    loadGrupos();
    
    if (servico) {
      setCodigo(servico.codigo || '');
      setNome(servico.nome || '');
      setDescricao(servico.descricao || '');
      setTermosBusca(Array.isArray(servico.termos_busca) ? servico.termos_busca : []);
      setTermoInput('');
      setDuracao(String(servico.duracao_minutos || servico.duracao || 60));
      setPreco(String(servico.preco || ''));
      setAtivo(servico.ativo !== false);
      setObservacoes(servico.observacoes || '');
      setGrupoId(servico.grupo_id || '');
      // Não seta temEtapas aqui - será setado ao carregar etapas
      // duracaoCalculada será definido ao carregar etapas (sempre true se tiver etapas)
      
      // Sempre tenta carregar etapas ao editar (se houver ID)
      if (servico.id) {
        carregarEtapas(servico.id);
        // Busca termos_busca fresco do Supabase — o state local pode estar desatualizado
        supabase
          .from('servicos')
          .select('termos_busca')
          .eq('id', servico.id)
          .single()
          .then(({ data: fresh }) => {
            if (fresh) {
              setTermosBusca(Array.isArray(fresh.termos_busca) ? fresh.termos_busca : []);
            }
          });
      } else {
        setEtapas([]);
        setTemEtapas(false);
      }
    } else {
      resetForm();
    }
  }, [servico, isOpen, resetForm]);

  const carregarEtapas = async (servicoId: string) => {
    try {
      const { data, error } = await supabase
        .from('servico_etapas')
        .select('*')
        .eq('servico_id', servicoId)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      
      const etapasCarregadas = data || [];
      setEtapas(etapasCarregadas);
      
      // Se tem etapas, ativa o checkbox automaticamente
      if (etapasCarregadas.length > 0) {
        setTemEtapas(true);
        setDuracaoCalculada(true);
      } else {
        setTemEtapas(false);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      setEtapas([]);
      setTemEtapas(false);
    }
  };

  const loadGrupos = async () => {
    try {
      const { data, error } = await supabase
        .from('grupos_servicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setGrupos([]);
    }
  };

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

    if (temEtapas && etapas.length === 0) {
      alert('Adicione ao menos uma etapa ou desative a opção "Possui etapas"');
      return;
    }

    if (temEtapas && etapas.some(e => !e.nome || e.nome.trim() === '')) {
      alert('Todas as etapas devem ter um nome');
      return;
    }

    try {
      setLoading(true);

      // Garante que qualquer termo ainda no input seja incluído antes de salvar
      const termoPendente = termoInput.trim().replace(/,$/, '');
      const termosFinais = termoPendente && !termosBusca.includes(termoPendente)
        ? [...termosBusca, termoPendente]
        : termosBusca;

      const duracaoFinal = (temEtapas && duracaoCalculada) 
        ? etapas.reduce((total, etapa) => total + (etapa.duracao_minutos || 0), 0)
        : parseInt(duracao);

      const dados = {
        codigo: codigo || null,
        nome,
        descricao,
        termos_busca: termosFinais,
        duracao_minutos: duracaoFinal,
        preco: parseFloat(preco),
        ativo,
        observacoes,
        grupo_id: grupoId,
        tem_etapas: temEtapas,
        duracao_calculada: temEtapas ? duracaoCalculada : false
      };

      let servicoId = servico?.id;

      if (servico?.id) {
        const { error } = await supabase
          .from('servicos')
          .update(dados)
          .eq('id', servico.id);

        if (error) throw error;
      } else {
        const novoId = crypto.randomUUID();
        const { data: novoServico, error } = await supabase
          .from('servicos')
          .insert({ ...dados, id: novoId })
          .select()
          .single();

        if (error) throw error;
        servicoId = novoServico.id;
      }

      if (temEtapas && servicoId) {
        await salvarEtapas(servicoId);
      }

      alert(servico ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      alert(error.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  }, [nome, preco, grupoId, codigo, descricao, termosBusca, termoInput, duracao, ativo, observacoes, servico, temEtapas, duracaoCalculada, etapas, onSuccess, handleClose]);

  const salvarEtapas = async (servicoId: string) => {
    try {
      // Deletar todas as etapas existentes
      await supabase
        .from('servico_etapas')
        .delete()
        .eq('servico_id', servicoId);

      const etapasParaSalvar = etapas.map((etapa, index) => ({
        servico_id: servicoId,
        ordem: index + 1,
        nome: etapa.nome,
        descricao: etapa.descricao || null,
        duracao_minutos: etapa.duracao_minutos,
        pode_ter_auxiliar: etapa.pode_ter_auxiliar !== false,
        exige_profissional: etapa.exige_profissional !== false,
        ativo: true
      }));

      const { error } = await supabase
        .from('servico_etapas')
        .insert(etapasParaSalvar);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar etapas:', error);
      throw error;
    }
  };

  const renderEtapasSection = () => {
    if (!temEtapas) return null;
    
    return (
      <div className="space-y-2">
        <EtapasServicoEditor etapas={etapas} onChange={setEtapas} />
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={servico ? 'Editar Serviço' : 'Novo Serviço'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Código (opcional)</label>
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: 001, SRV-123"
          />
          <p className="text-xs text-gray-500 mt-1">Código interno para identificação</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome do Serviço *</label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Corte Feminino, Manicure Completa"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Termos de Busca</label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {termosBusca.map((termo, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {termo}
                <button
                  type="button"
                  onClick={() => setTermosBusca(termosBusca.filter((_, j) => j !== i))}
                  className="hover:text-blue-600 focus:outline-none"
                  aria-label={`Remover ${termo}`}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={termoInput}
              onChange={(e) => setTermoInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && termoInput.trim()) {
                  e.preventDefault();
                  const novo = termoInput.trim().replace(/,$/, '');
                  if (novo && !termosBusca.includes(novo)) {
                    setTermosBusca([...termosBusca, novo]);
                  }
                  setTermoInput('');
                } else if (e.key === 'Backspace' && !termoInput && termosBusca.length > 0) {
                  setTermosBusca(termosBusca.slice(0, -1));
                }
              }}
              onBlur={() => {
                const novo = termoInput.trim().replace(/,$/, '');
                if (novo && !termosBusca.includes(novo)) {
                  setTermosBusca([...termosBusca, novo]);
                  setTermoInput('');
                }
              }}
              placeholder={termosBusca.length === 0 ? 'Ex: clarear, retocar raiz, luzes...' : ''}
              className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Digite e pressione Enter ou vírgula para adicionar. Facilita a busca pelo serviço.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grupo do Serviço *</label>
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Selecione um grupo...</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Grupo principal ao qual este serviço pertence</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duração (minutos) *</label>
            <Input
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="60"
              min="1"
              required
              disabled={temEtapas && duracaoCalculada}
            />
            {temEtapas && duracaoCalculada && (
              <p className="text-xs text-blue-600 mt-1">Calculado automaticamente pela soma das etapas</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
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

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tem_etapas"
                checked={temEtapas}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTemEtapas(checked);
                  if (checked && etapas.length === 0) {
                    setEtapas([{
                      ordem: 1,
                      nome: 'Execução',
                      duracao_minutos: parseInt(duracao) || 60,
                      pode_ter_auxiliar: true,
                      exige_profissional: true
                    }]);
                    setDuracaoCalculada(true);
                  }
                }}
                className="mr-2"
              />
              <label htmlFor="tem_etapas" className="text-sm font-medium">Este serviço possui etapas</label>
            </div>
          </div>

          {temEtapas && (
            <p className="text-xs text-neutral-600">Divida o serviço em etapas detalhadas (ex: lavagem, corte, finalização) para melhor controle de execução.</p>
          )}
        </div>

        {renderEtapasSection()}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Descrição</label>
            <span className={`text-xs font-medium ${descricao.length > 130 ? descricao.length >= 150 ? 'text-red-500' : 'text-yellow-500' : 'text-neutral-400'}`}>
              {descricao.length}/150
            </span>
          </div>
          <textarea
            value={descricao}
            onChange={(e) => { if (e.target.value.length <= 150) setDescricao(e.target.value); }}
            placeholder="Descrição breve sobre o serviço"
            className={`w-full px-3 py-2 border rounded-lg resize-none transition-colors ${descricao.length >= 150 ? 'border-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`}
            rows={3}
            maxLength={150}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações internas sobre o serviço"
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ativo"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="ativo" className="text-sm font-medium">Serviço ativo (disponível para agendamento)</label>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : servico ? 'Atualizar' : 'Criar Serviço'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

