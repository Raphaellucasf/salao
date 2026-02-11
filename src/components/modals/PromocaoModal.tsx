// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { X, Tag, Calendar, Clock, Percent } from 'lucide-react';

interface PromocaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocao?: any;
}

export default function PromocaoModal({ isOpen, onClose, onSuccess, promocao }: PromocaoModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Desconto
  const [tipoDesconto, setTipoDesconto] = useState('percentual');
  const [valorDesconto, setValorDesconto] = useState('');
  const [aplicaEm, setAplicaEm] = useState('ambos');
  
  // Validade
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Dias da Semana
  const [diasSemana, setDiasSemana] = useState({
    segunda: true,
    terca: true,
    quarta: true,
    quinta: true,
    sexta: true,
    sabado: true,
    domingo: true,
  });
  
  // Horário
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  
  // Restrições
  const [valorMinimo, setValorMinimo] = useState('');
  const [quantidadeMaximaUsos, setQuantidadeMaximaUsos] = useState('');
  const [maximoUsosPorCliente, setMaximoUsosPorCliente] = useState('');
  
  // Clientes
  const [aplicaTodosClientes, setAplicaTodosClientes] = useState(true);
  const [aplicaPrimeiroAtendimento, setAplicaPrimeiroAtendimento] = useState(false);
  
  // Cupom
  const [requerCupom, setRequerCupom] = useState(false);
  const [cupom, setCupom] = useState('');
  
  // Combinação
  const [permiteCombinarOutrasPromocoes, setPermiteCombinarOutrasPromocoes] = useState(false);
  const [permiteCombinarComissao, setPermiteCombinarComissao] = useState(true);
  
  // Visual
  const [cor, setCor] = useState('#F59E0B');
  const [destaque, setDestaque] = useState(false);
  const [ativo, setAtivo] = useState(true);
  
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (promocao) {
        setCodigo(promocao.codigo || '');
        setNome(promocao.nome || '');
        setDescricao(promocao.descricao || '');
        setTipoDesconto(promocao.tipo_desconto || 'percentual');
        setValorDesconto(promocao.valor_desconto?.toString() || '');
        setAplicaEm(promocao.aplica_em || 'ambos');
        setDataInicio(promocao.data_inicio || '');
        setDataFim(promocao.data_fim || '');
        
        // Dias da semana do JSON
        const dias = promocao.dias_semana || [];
        setDiasSemana({
          segunda: dias.includes('segunda'),
          terca: dias.includes('terca'),
          quarta: dias.includes('quarta'),
          quinta: dias.includes('quinta'),
          sexta: dias.includes('sexta'),
          sabado: dias.includes('sabado'),
          domingo: dias.includes('domingo'),
        });
        
        setHorarioInicio(promocao.horario_inicio || '');
        setHorarioFim(promocao.horario_fim || '');
        setValorMinimo(promocao.valor_minimo?.toString() || '');
        setQuantidadeMaximaUsos(promocao.quantidade_maxima_usos?.toString() || '');
        setMaximoUsosPorCliente(promocao.maximo_usos_por_cliente?.toString() || '');
        setAplicaTodosClientes(promocao.aplica_todos_clientes ?? true);
        setAplicaPrimeiroAtendimento(promocao.aplica_primeiro_atendimento ?? false);
        setRequerCupom(promocao.requer_cupom ?? false);
        setCupom(promocao.cupom || '');
        setPermiteCombinarOutrasPromocoes(promocao.permite_combinar_outras_promocoes ?? false);
        setPermiteCombinarComissao(promocao.permite_combinar_comissao ?? true);
        setCor(promocao.cor || '#F59E0B');
        setDestaque(promocao.destaque ?? false);
        setAtivo(promocao.ativo ?? true);
        setObservacoes(promocao.observacoes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, promocao]);

  const resetForm = () => {
    setCodigo('');
    setNome('');
    setDescricao('');
    setTipoDesconto('percentual');
    setValorDesconto('');
    setAplicaEm('ambos');
    
    const hoje = new Date().toISOString().split('T')[0];
    setDataInicio(hoje);
    const umAnoDepois = new Date();
    umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);
    setDataFim(umAnoDepois.toISOString().split('T')[0]);
    
    setDiasSemana({
      segunda: true,
      terca: true,
      quarta: true,
      quinta: true,
      sexta: true,
      sabado: true,
      domingo: true,
    });
    
    setHorarioInicio('');
    setHorarioFim('');
    setValorMinimo('');
    setQuantidadeMaximaUsos('');
    setMaximoUsosPorCliente('');
    setAplicaTodosClientes(true);
    setAplicaPrimeiroAtendimento(false);
    setRequerCupom(false);
    setCupom('');
    setPermiteCombinarOutrasPromocoes(false);
    setPermiteCombinarComissao(true);
    setCor('#F59E0B');
    setDestaque(false);
    setAtivo(true);
    setObservacoes('');
  };

  const handleSubmit = async () => {
    if (!nome || !valorDesconto || !dataInicio || !dataFim) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (requerCupom && !cupom) {
      alert('Informe o código do cupom');
      return;
    }

    setLoading(true);

    try {
      // Montar array de dias da semana
      const diasArray = Object.entries(diasSemana)
        .filter(([_, ativo]) => ativo)
        .map(([dia, _]) => dia);

      const promocaoData = {
        codigo: codigo || null,
        nome,
        descricao,
        tipo_desconto: tipoDesconto,
        valor_desconto: parseFloat(valorDesconto),
        aplica_em: aplicaEm,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dias_semana: JSON.stringify(diasArray),
        horario_inicio: horarioInicio || null,
        horario_fim: horarioFim || null,
        valor_minimo: valorMinimo ? parseFloat(valorMinimo) : null,
        quantidade_maxima_usos: quantidadeMaximaUsos ? parseInt(quantidadeMaximaUsos) : null,
        maximo_usos_por_cliente: maximoUsosPorCliente ? parseInt(maximoUsosPorCliente) : null,
        aplica_todos_clientes: aplicaTodosClientes,
        aplica_primeiro_atendimento: aplicaPrimeiroAtendimento,
        requer_cupom: requerCupom,
        cupom: requerCupom ? cupom.toUpperCase() : null,
        permite_combinar_outras_promocoes: permiteCombinarOutrasPromocoes,
        permite_combinar_comissao: permiteCombinarComissao,
        cor,
        destaque,
        ativo,
        observacoes,
      };

      if (promocao) {
        const { error } = await supabase
          .from('promocoes')
          .update(promocaoData)
          .eq('id', promocao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promocoes')
          .insert([{ ...promocaoData, quantidade_usos_atual: 0 }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cores = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#6366F1', '#EF4444', '#14B8A6',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Tag className="text-orange-600" size={20} />
          </div>
          <h2 className="text-xl font-semibold">
            {promocao ? 'Editar Promoção' : 'Nova Promoção'}
          </h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="PROMO-001"
              />
              
              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Ativa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={destaque}
                    onChange={(e) => setDestaque(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Destacar</span>
                </label>
              </div>
            </div>

            <Input
              label="Nome da Promoção*"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Segunda-feira Feliz"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição da promoção..."
              />
            </div>
          </div>

          {/* Desconto */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Percent size={16} />
              Desconto
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Desconto*
                </label>
                <select
                  value={tipoDesconto}
                  onChange={(e) => setTipoDesconto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="valor_fixo">Valor Fixo (R$)</option>
                  <option value="preco_fixo">Preço Fixo (R$)</option>
                </select>
              </div>

              <Input
                label={`Valor*${tipoDesconto === 'percentual' ? ' (%)' : ' (R$)'}`}
                type="number"
                value={valorDesconto}
                onChange={(e) => setValorDesconto(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aplicar em*
                </label>
                <select
                  value={aplicaEm}
                  onChange={(e) => setAplicaEm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ambos">Serviços e Produtos</option>
                  <option value="servicos">Apenas Serviços</option>
                  <option value="produtos">Apenas Produtos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Validade */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Período de Validade
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data Início*"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <Input
                label="Data Fim*"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Dias da Semana</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(diasSemana).map(([dia, selecionado]) => (
                <label key={dia} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={(e) => setDiasSemana({ ...diasSemana, [dia]: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{dia}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Horário */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Horário (Opcional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Horário Início"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
              />
              <Input
                label="Horário Fim"
                type="time"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Deixe vazio para aplicar em qualquer horário
            </p>
          </div>

          {/* Restrições */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Restrições</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Valor Mínimo (R$)"
                type="number"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
              <Input
                label="Máximo de Usos Total"
                type="number"
                value={quantidadeMaximaUsos}
                onChange={(e) => setQuantidadeMaximaUsos(e.target.value)}
                placeholder="Ilimitado"
              />
              <Input
                label="Máximo por Cliente"
                type="number"
                value={maximoUsosPorCliente}
                onChange={(e) => setMaximoUsosPorCliente(e.target.value)}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          {/* Clientes */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Aplicação</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicaTodosClientes}
                  onChange={(e) => setAplicaTodosClientes(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Aplicar para todos os clientes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicaPrimeiroAtendimento}
                  onChange={(e) => setAplicaPrimeiroAtendimento(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Apenas para primeiro atendimento</span>
              </label>
            </div>
          </div>

          {/* Cupom */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requerCupom}
                  onChange={(e) => setRequerCupom(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Requer Cupom</span>
              </label>
            </div>
            {requerCupom && (
              <Input
                label="Código do Cupom*"
                value={cupom}
                onChange={(e) => setCupom(e.target.value.toUpperCase())}
                placeholder="CUPOM2026"
              />
            )}
          </div>

          {/* Combinações */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Combinações</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permiteCombinarOutrasPromocoes}
                  onChange={(e) => setPermiteCombinarOutrasPromocoes(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Permitir combinar com outras promoções</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permiteCombinarComissao}
                  onChange={(e) => setPermiteCombinarComissao(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Permitir comissão sobre valor com desconto</span>
              </label>
            </div>
          </div>

          {/* Cor */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Cor</h3>
            <div className="flex gap-3">
              {cores.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className="relative w-10 h-10 rounded-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {cor === c && (
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre a promoção..."
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : promocao ? 'Salvar Alterações' : 'Criar Promoção'}
        </Button>
      </div>
    </Modal>
  );
}

