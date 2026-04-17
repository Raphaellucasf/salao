// @ts-nocheck
'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface EtapaServico {
  id?: string;
  ordem: number;
  nome: string;
  descricao?: string;
  duracao_minutos: number;
  pode_ter_auxiliar: boolean;
  exige_profissional?: boolean;
}

interface EtapasServicoEditorProps {
  etapas: EtapaServico[];
  onChange: (etapas: EtapaServico[]) => void;
}

export default function EtapasServicoEditor({ etapas, onChange }: EtapasServicoEditorProps) {
  const adicionarEtapa = () => {
    const novaEtapa: EtapaServico = {
      ordem: etapas.length + 1,
      nome: '',
      duracao_minutos: 30,
      pode_ter_auxiliar: true,
      exige_profissional: true,
    };
    onChange([...etapas, novaEtapa]);
  };

  const removerEtapa = (index: number) => {
    const novasEtapas = etapas.filter((_, i) => i !== index);
    // Reordenar
    const etapasReordenadas = novasEtapas.map((etapa, i) => ({
      ...etapa,
      ordem: i + 1,
    }));
    onChange(etapasReordenadas);
  };

  const atualizarEtapa = (index: number, campo: string, valor: any) => {
    const novasEtapas = etapas.map((etapa, i) => {
      if (i === index) {
        return { ...etapa, [campo]: valor };
      }
      return etapa;
    });
    onChange(novasEtapas);
  };

  const moverEtapa = (index: number, direcao: 'cima' | 'baixo') => {
    if (
      (direcao === 'cima' && index === 0) ||
      (direcao === 'baixo' && index === etapas.length - 1)
    ) {
      return;
    }

    const novasEtapas = [...etapas];
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
    
    // Trocar posições
    [novasEtapas[index], novasEtapas[novoIndex]] = [novasEtapas[novoIndex], novasEtapas[index]];
    
    // Reordenar
    const etapasReordenadas = novasEtapas.map((etapa, i) => ({
      ...etapa,
      ordem: i + 1,
    }));
    
    onChange(etapasReordenadas);
  };

  const calcularDuracaoTotal = () => {
    return etapas.reduce((total, etapa) => total + (etapa.duracao_minutos || 0), 0);
  };

  const todosAtribuidos = etapas.every(e => e.nome && e.nome.trim() !== '');
  const duracaoTotal = calcularDuracaoTotal();

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Etapas do Serviço</h3>
        <Button
          type="button"
          size="sm"
          onClick={adicionarEtapa}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar Etapa
        </Button>
      </div>

      <div className="space-y-3">
        {etapas.map((etapa, index) => (
          <div
            key={index}
            className="p-4 border border-neutral-200 rounded-lg bg-white hover:border-blue-300 transition-colors"
          >
            {/* Cabeçalho da etapa */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moverEtapa(index, 'cima')}
                  disabled={index === 0}
                  className="p-0.5 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <GripVertical className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                  type="button"
                  onClick={() => moverEtapa(index, 'baixo')}
                  disabled={index === etapas.length - 1}
                  className="p-0.5 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <GripVertical className="w-4 h-4 text-neutral-400 rotate-180" />
                </button>
              </div>

              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                {index + 1}
              </div>

              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nome da etapa (ex: Lavagem, Corte, Finalização)"
                  value={etapa.nome}
                  onChange={(e) => atualizarEtapa(index, 'nome', e.target.value)}
                  className="font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => removerEtapa(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remover etapa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Campos da etapa */}
            <div className="grid grid-cols-12 gap-3 mt-3">
              {/* Duração */}
              <div className="col-span-4">
                <label className="text-xs text-neutral-600 mb-1 block">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Duração (min)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={etapa.duracao_minutos}
                  onChange={(e) => atualizarEtapa(index, 'duracao_minutos', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              {/* Checkbox exige profissional */}
              <div className="col-span-4 flex items-end">
                <div className="flex items-center h-10 px-3 bg-neutral-50 rounded border border-neutral-200 w-full overflow-hidden">
                  <input
                    type="checkbox"
                    id={`exige_profissional_${index}`}
                    checked={etapa.exige_profissional === false}
                    onChange={(e) => atualizarEtapa(index, 'exige_profissional', !e.target.checked)}
                    className="shrink-0 mr-2"
                  />
                  <label htmlFor={`exige_profissional_${index}`} className="text-sm text-neutral-700 cursor-pointer select-none truncate">
                    Não exige presença
                  </label>
                </div>
              </div>

              {/* Checkbox auxiliar */}
              <div className="col-span-4 flex items-end">
                <div className="flex items-center h-10 px-3 bg-neutral-50 rounded border border-neutral-200 w-full overflow-hidden">
                  <input
                    type="checkbox"
                    id={`auxiliar_${index}`}
                    checked={etapa.pode_ter_auxiliar}
                    onChange={(e) => atualizarEtapa(index, 'pode_ter_auxiliar', e.target.checked)}
                    disabled={etapa.exige_profissional === false}
                    className="shrink-0 mr-2 disabled:opacity-50"
                  />
                  <label htmlFor={`auxiliar_${index}`} className="text-sm text-neutral-700 cursor-pointer select-none truncate">
                    Pode ter auxiliar
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}

        {etapas.length === 0 && (
          <div className="text-center py-8 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma etapa adicionada</p>
            <p className="text-xs mt-1">Clique em "Adicionar Etapa" para começar</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      {etapas.length > 0 && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-600 mb-1">Total de etapas</p>
              <p className="text-2xl font-bold text-blue-700">{etapas.length}</p>
            </div>
            <div>
              <p className="text-neutral-600 mb-1">Duração total</p>
              <p className="text-2xl font-bold text-blue-700">{duracaoTotal} min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
