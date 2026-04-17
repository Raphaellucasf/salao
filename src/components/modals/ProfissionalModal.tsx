// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useFormCache } from '@/hooks/useFormCache';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { X as XIcon } from 'lucide-react';

interface ProfissionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profissional?: any;
  onSave: () => void;
}

interface GrupoServico {
  id: string;
  nome: string;
  cor: string | null;
  icone: string | null;
}

interface ServicoItem {
  id: string;
  nome: string;
  duracao_minutos: number | null;
}

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
  const formCache = useFormCache<typeof formData>('profissional_novo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apelidoInput, setApelidoInput] = useState('');
  const [gruposDB, setGruposDB] = useState<GrupoServico[]>([]);
  const [servicosPorGrupo, setServicosPorGrupo] = useState<Record<string, ServicoItem[]>>({});
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());

  // Carrega grupos e serviços dinamicamente da tabela grupos_servicos
  const loadGruposEServicos = async () => {
    try {
      const [{ data: grupos }, { data: servicos }] = await Promise.all([
        supabase
          .from('grupos_servicos')
          .select('id, nome, cor, icone')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('servicos')
          .select('id, nome, duracao_minutos, grupo_id')
          .eq('ativo', true)
          .order('nome'),
      ]);

      if (grupos) {
        setGruposDB(grupos);
        const porGrupo: Record<string, ServicoItem[]> = {};
        grupos.forEach((g: any) => {
          porGrupo[g.nome] = (servicos || [])
            .filter((s: any) => s.grupo_id === g.id)
            .map((s: any) => ({ id: s.id, nome: s.nome, duracao_minutos: s.duracao_minutos }));
        });
        setServicosPorGrupo(porGrupo);
      }
    } catch {
      // Mantém estado vazio como fallback
    }
  };

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    apelido: [] as string[],
    data_nascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    // Tipo e Cor
    tipo_contrato: 'contratado' as 'contratado' | 'autonomo' | 'terceirizado',
    cor_agenda: '#3B82F6',
    // Remuneração
    tem_salario_fixo: false,
    salario_fixo: 0,
    recebe_comissao: true,
    percentual_comissao: 50,
    // Configurações
    grupos: [] as string[], // grupos onde atua (permissão de Auxiliar no grupo inteiro)
    servicos_habilitados: [] as string[], // IDs de serviços onde pode atuar como Principal
    dias_trabalho: [] as number[],
    horario_personalizado: true,
    hora_inicio: '09:00',
    hora_fim: '18:00',
    horarios_por_dia: {} as Record<number, {inicio: string, fim: string}>,
    comissoes_por_grupo: {} as Record<string, {comissao: number, taxa_cartao: string}>,
    senha_app: '',
    é_auxiliar: false,
    ativo: true,
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadGruposEServicos();
      if (profissional) {
        setFormData({
          nome: profissional.nome || '',
          email: profissional.email || '',
          telefone: profissional.telefone || '',
          cpf: profissional.cpf || '',
          apelido: profissional.apelido ? profissional.apelido.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          data_nascimento: profissional.data_nascimento || '',
          endereco: profissional.endereco || '',
          cidade: profissional.cidade || '',
          estado: profissional.estado || '',
          cep: profissional.cep || '',
          tipo_contrato: profissional.tipo_contrato || 'contratado',
          cor_agenda: profissional.cor_agenda || '#3B82F6',
          tem_salario_fixo: profissional.tem_salario_fixo || false,
          salario_fixo: profissional.salario_fixo || 0,
          recebe_comissao: profissional.recebe_comissao !== false,
          percentual_comissao: profissional.percentual_comissao || 50,
          grupos: profissional.grupos || [],
          servicos_habilitados: profissional.servicos_habilitados || [],
          dias_trabalho: profissional.dias_trabalho || [1, 2, 3, 4, 5],
          horario_personalizado: true,
          hora_inicio: profissional.hora_inicio || '09:00',
          hora_fim: profissional.hora_fim || '18:00',
          horarios_por_dia: (() => {
            const existente = profissional.horarios_por_dia || {};
            const temDados = Object.keys(existente).length > 0;
            if (temDados) return existente;
            // Migrar de horário padrão para personalizado
            const dias = profissional.dias_trabalho || [1, 2, 3, 4, 5];
            const inicio = profissional.hora_inicio || '09:00';
            const fim = profissional.hora_fim || '18:00';
            return dias.reduce((acc: Record<number, {inicio: string, fim: string}>, dia: number) => {
              acc[dia] = { inicio, fim };
              return acc;
            }, {});
          })(),
          comissoes_por_grupo: profissional.comissoes_por_grupo || {},
          senha_app: profissional.senha_app || '',
          é_auxiliar: profissional.é_auxiliar || false,
          ativo: profissional.ativo !== false,
          observacoes: profissional.observacoes || '',
        });
        // Busca apelido e grupos frescos do Supabase — state local pode estar desatualizado
        if (profissional.id) {
          supabase
            .from('profissionais')
            .select('apelido, grupos')
            .eq('id', profissional.id)
            .single()
            .then(({ data: fresh }) => {
              if (fresh) {
                setFormData(prev => ({
                  ...prev,
                  apelido: fresh.apelido ? fresh.apelido.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                  grupos: Array.isArray(fresh.grupos) ? fresh.grupos : (fresh.grupos || []),
                }));
              }
            });
        }
      } else {
        const cached = formCache.load();
        if (cached) {
          setFormData(cached);
          setError('');
        } else {
          resetForm();
        }
      }
    }
  }, [isOpen, profissional]);

  // Persiste no cache enquanto preenche (apenas novo cadastro)
  useEffect(() => {
    if (!profissional?.id && isOpen) formCache.save(formData);
  }, [formData]);

  const resetForm = () => {
    setGruposExpandidos(new Set());
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      apelido: [],
      data_nascimento: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      tipo_contrato: 'contratado',
      cor_agenda: '#3B82F6',
      tem_salario_fixo: false,
      salario_fixo: 0,
      recebe_comissao: true,
      percentual_comissao: 50,
      grupos: [],
      servicos_habilitados: [],
      dias_trabalho: [1, 2, 3, 4, 5], // Segunda a Sexta por padrão
      horario_personalizado: true,
      hora_inicio: '09:00',
      hora_fim: '18:00',
      horarios_por_dia: {},
      comissoes_por_grupo: {},
      senha_app: '',
      é_auxiliar: false,
      ativo: true,
      observacoes: '',
    });
    setError('');
  };

  const toggleGrupo = (grupoNome: string) => {
    setFormData(prev => {
      const estaNoGrupo = prev.grupos.includes(grupoNome);
      if (estaNoGrupo) {
        // Ao remover o grupo, remove também os serviços habilitados desse grupo
        const servicosDoGrupo = new Set((servicosPorGrupo[grupoNome] || []).map(s => s.id));
        return {
          ...prev,
          grupos: prev.grupos.filter(g => g !== grupoNome),
          servicos_habilitados: prev.servicos_habilitados.filter(id => !servicosDoGrupo.has(id)),
          comissoes_por_grupo: Object.fromEntries(
            Object.entries(prev.comissoes_por_grupo).filter(([k]) => k !== grupoNome)
          ),
        };
      } else {
        setGruposExpandidos(prev2 => new Set([...prev2, grupoNome]));
        return {
          ...prev,
          grupos: [...prev.grupos, grupoNome],
        };
      }
    });
  };

  const toggleServico = (servicoId: string) => {
    setFormData(prev => ({
      ...prev,
      servicos_habilitados: prev.servicos_habilitados.includes(servicoId)
        ? prev.servicos_habilitados.filter(id => id !== servicoId)
        : [...prev.servicos_habilitados, servicoId],
    }));
  };

  const toggleGrupoExpandido = (grupoNome: string) => {
    setGruposExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(grupoNome)) next.delete(grupoNome); else next.add(grupoNome);
      return next;
    });
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
        apelido: formData.apelido.length > 0 ? formData.apelido.join(', ') : null,
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        tipo_contrato: formData.tipo_contrato,
        cor_agenda: formData.cor_agenda,
        tem_salario_fixo: formData.tem_salario_fixo,
        salario_fixo: formData.tem_salario_fixo ? formData.salario_fixo : null,
        recebe_comissao: formData.recebe_comissao,
        percentual_comissao: formData.recebe_comissao ? formData.percentual_comissao : null,
        grupos: formData.grupos, // array de nomes dos grupos (coluna jsonb)
        servicos_habilitados: formData.servicos_habilitados,
        comissoes_por_grupo: formData.comissoes_por_grupo,
        dias_trabalho: formData.dias_trabalho,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        horario_personalizado: true,
        horarios_por_dia: formData.horarios_por_dia,
        ativo: formData.ativo,
        é_auxiliar: formData.é_auxiliar,
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
      formCache.clear();
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

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Apelido(s)</label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-neutral-300 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
              {formData.apelido.map((ap, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {ap}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, apelido: formData.apelido.filter((_, j) => j !== i) })}
                    className="hover:text-primary-600 focus:outline-none"
                    aria-label={`Remover ${ap}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={apelidoInput}
                onChange={(e) => setApelidoInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && apelidoInput.trim()) {
                    e.preventDefault();
                    const novo = apelidoInput.trim().replace(/,$/, '');
                    if (novo && !formData.apelido.includes(novo)) {
                      setFormData({ ...formData, apelido: [...formData.apelido, novo] });
                    }
                    setApelidoInput('');
                  } else if (e.key === 'Backspace' && !apelidoInput && formData.apelido.length > 0) {
                    setFormData({ ...formData, apelido: formData.apelido.slice(0, -1) });
                  }
                }}
                onBlur={() => {
                  const novo = apelidoInput.trim().replace(/,$/, '');
                  if (novo && !formData.apelido.includes(novo)) {
                    setFormData({ ...formData, apelido: [...formData.apelido, novo] });
                    setApelidoInput('');
                  }
                }}
                placeholder={formData.apelido.length === 0 ? 'Ex: Di, Dimas, Dimi...' : ''}
                className="flex-1 min-w-28 outline-none text-sm bg-transparent"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">Nomes pelos quais o profissional é conhecido. Digite e pressione Enter ou vírgula para adicionar.</p>
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

        {/* Configurações Gerais */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Configurações</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo_contrato}
                onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value as any })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="contratado">Contratado</option>
                <option value="autonomo">Autônomo</option>
                <option value="terceirizado">Terceirizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Cor da Agenda
              </label>
              <input
                type="color"
                value={formData.cor_agenda}
                onChange={(e) => setFormData({ ...formData, cor_agenda: e.target.value })}
                className="w-full h-10 px-2 border border-neutral-300 rounded-lg cursor-pointer"
              />
            </div>

            <Input
              label="Senha para Consultas/App"
              type="password"
              value={formData.senha_app}
              onChange={(e) => setFormData({ ...formData, senha_app: e.target.value })}
              placeholder="Digite a senha"
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
          <h3 className="font-semibold text-lg text-neutral-900 mb-1">Grupos de Atuação *</h3>
          <p className="text-xs text-neutral-500 mb-4">
            Marcar o <strong>grupo</strong> autoriza atuar como{' '}
            <span className="text-amber-600 font-semibold">Auxiliar</span> em todos os serviços dele.
            Expandir e marcar um <strong>serviço</strong> autoriza atuar como{' '}
            <span className="text-green-600 font-semibold">Principal</span> naquele serviço.
          </p>

          {gruposDB.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Carregando grupos...</p>
          ) : (
            <div className="space-y-2">
              {gruposDB.map((grupo) => {
                const selecionado = formData.grupos.includes(grupo.nome);
                const expandido = gruposExpandidos.has(grupo.nome);
                const servicos = servicosPorGrupo[grupo.nome] || [];
                const principaisNoGrupo = servicos.filter(s => formData.servicos_habilitados.includes(s.id));

                return (
                  <div
                    key={grupo.id}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      selecionado ? 'border-primary-400' : 'border-neutral-200'
                    }`}
                  >
                    {/* Cabeçalho do grupo */}
                    <div
                      className={`flex items-center gap-3 p-3 ${
                        selecionado ? 'bg-primary-50' : 'bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => toggleGrupo(grupo.nome)}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                      {grupo.cor && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: grupo.cor }}
                        />
                      )}
                      <span className="text-sm font-semibold text-neutral-800 flex-1">{grupo.nome}</span>

                      {selecionado && (
                        <span className="text-xs text-amber-600 font-medium mr-1">
                          Auxiliar
                          {principaisNoGrupo.length > 0 &&
                            ` · ${principaisNoGrupo.length} Principal${principaisNoGrupo.length > 1 ? 'is' : ''}`}
                        </span>
                      )}

                      {selecionado && servicos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleGrupoExpandido(grupo.nome)}
                          className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded"
                          title={expandido ? 'Recolher serviços' : 'Expandir serviços'}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Sub-lista de serviços (accordion) */}
                    {selecionado && expandido && (
                      <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                        {servicos.length === 0 ? (
                          <p className="text-xs text-neutral-400 italic">Nenhum serviço cadastrado neste grupo.</p>
                        ) : (
                          <>
                            <p className="text-xs text-neutral-500 mb-2 font-medium">
                              Marque os serviços onde pode atuar como{' '}
                              <span className="text-green-600">Principal</span>:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {servicos.map((servico) => {
                                const isPrincipal = formData.servicos_habilitados.includes(servico.id);
                                return (
                                  <label
                                    key={servico.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all text-sm ${
                                      isPrincipal
                                        ? 'bg-green-50 border border-green-300 text-green-800'
                                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isPrincipal}
                                      onChange={() => toggleServico(servico.id)}
                                      className="w-3.5 h-3.5 text-green-600 border-neutral-300 rounded focus:ring-green-500 cursor-pointer"
                                    />
                                    <span className="flex-1 font-medium">{servico.nome}</span>
                                    {isPrincipal && (
                                      <span className="text-xs text-green-600 font-semibold">Principal</span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                            <div className="flex gap-3 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const ids = servicos.map(s => s.id);
                                  setFormData(prev => ({
                                    ...prev,
                                    servicos_habilitados: [...new Set([...prev.servicos_habilitados, ...ids])],
                                  }));
                                }}
                                className="text-xs text-green-600 hover:underline"
                              >
                                Marcar todos como Principal
                              </button>
                              <span className="text-neutral-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const ids = new Set(servicos.map(s => s.id));
                                  setFormData(prev => ({
                                    ...prev,
                                    servicos_habilitados: prev.servicos_habilitados.filter(id => !ids.has(id)),
                                  }));
                                }}
                                className="text-xs text-neutral-400 hover:underline"
                              >
                                Limpar seleção
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabela de Comissões por Grupo */}
          {formData.grupos.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Comissões e Taxas de Cartão por Grupo</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-neutral-700">Grupo</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-700">Comissão (%)</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-700">Taxa Cartão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.grupos.map((grupo) => (
                      <tr key={grupo} className="border-t">
                        <td className="px-4 py-2 font-medium text-neutral-900">{grupo}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.comissoes_por_grupo[grupo]?.comissao || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              comissoes_por_grupo: {
                                ...formData.comissoes_por_grupo,
                                [grupo]: {
                                  ...formData.comissoes_por_grupo[grupo],
                                  comissao: parseFloat(e.target.value) || 0,
                                  taxa_cartao: formData.comissoes_por_grupo[grupo]?.taxa_cartao || 'sem_tx'
                                }
                              }
                            })}
                            className="w-24 px-2 py-1 border border-neutral-300 rounded text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={formData.comissoes_por_grupo[grupo]?.taxa_cartao || 'sem_tx'}
                            onChange={(e) => setFormData({
                              ...formData,
                              comissoes_por_grupo: {
                                ...formData.comissoes_por_grupo,
                                [grupo]: {
                                  comissao: formData.comissoes_por_grupo[grupo]?.comissao || 0,
                                  taxa_cartao: e.target.value
                                }
                              }
                            })}
                            className="w-32 px-2 py-1 border border-neutral-300 rounded text-sm"
                          >
                            <option value="sem_tx">SEM TX</option>
                            <option value="tx_prop">TX PROP</option>
                            <option value="tx_fixa">TX FIXA</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Dias de Trabalho */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Disponibilidade *</h3>
          
          <div className="space-y-4">
            {/* Horários personalizados por dia */}
            <div className="space-y-3">
              {DIAS_SEMANA.map((dia) => {
                    const diaAtivo = formData.dias_trabalho.includes(dia.value);
                    const horarios = formData.horarios_por_dia[dia.value] || { inicio: '09:00', fim: '18:00' };
                    
                    return (
                      <div key={dia.value} className="flex items-center gap-4 p-3 border rounded-lg">
                        <label className="flex items-center gap-2 min-w-[120px]">
                          <input
                            type="checkbox"
                            checked={diaAtivo}
                            onChange={() => toggleDia(dia.value)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700">{dia.label}</span>
                        </label>
                        
                        {diaAtivo && (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="time"
                              value={horarios.inicio}
                              onChange={(e) => setFormData({
                                ...formData,
                                horarios_por_dia: {
                                  ...formData.horarios_por_dia,
                                  [dia.value]: { ...horarios, inicio: e.target.value }
                                }
                              })}
                              className="px-3 py-1.5 border border-neutral-300 rounded text-sm"
                            />
                            <span className="text-neutral-500">até</span>
                            <input
                              type="time"
                              value={horarios.fim}
                              onChange={(e) => setFormData({
                                ...formData,
                                horarios_por_dia: {
                                  ...formData.horarios_por_dia,
                                  [dia.value]: { ...horarios, fim: e.target.value }
                                }
                              })}
                              className="px-3 py-1.5 border border-neutral-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          <div className="space-y-3">
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
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="é_auxiliar"
                checked={formData.é_auxiliar}
                onChange={(e) => setFormData({ ...formData, é_auxiliar: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="é_auxiliar" className="text-sm font-medium text-neutral-700">
                Auxiliar Global
              </label>
              <span className="text-xs text-neutral-400">(pode auxiliar em qualquer serviço)</span>
            </div>
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

