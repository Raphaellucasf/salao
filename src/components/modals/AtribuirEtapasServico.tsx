// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { User, Clock } from 'lucide-react';

interface EtapaAtribuicao {
  servico_etapa_id: string;
  ordem: number;
  nome: string;
  duracao_minutos: number;
  profissional_id?: string;
  auxiliar_id?: string;
  exige_profissional?: boolean;
}

interface AtribuirEtapasServicoProps {
  etapas: any[];
  profissionais: any[];
  auxiliares: any[];
  profissionalPrincipalId?: string;
  onChange: (atribuicoes: EtapaAtribuicao[]) => void;
}

export default function AtribuirEtapasServico({
  etapas,
  profissionais,
  auxiliares,
  profissionalPrincipalId,
  onChange
}: AtribuirEtapasServicoProps) {
  const [atribuicoes, setAtribuicoes] = useState<EtapaAtribuicao[]>([]);

  useEffect(() => {
    // Inicializar atribuições com dados das etapas
    const iniciais = etapas.map(etapa => ({
      servico_etapa_id: etapa.id,
      ordem: etapa.ordem,
      nome: etapa.nome,
      duracao_minutos: etapa.duracao_minutos,
      profissional_id: (etapa.exige_profissional === false) ? undefined : profissionalPrincipalId,
      auxiliar_id: undefined,
      exige_profissional: etapa.exige_profissional !== false
    }));
    setAtribuicoes(iniciais);
  }, [etapas, profissionalPrincipalId]);

  useEffect(() => {
    onChange(atribuicoes);
  }, [atribuicoes]);

  const atualizarAtribuicao = (index: number, campo: string, valor: any) => {
    const novasAtribuicoes = atribuicoes.map((atribuicao, i) => {
      if (i === index) {
        // Se está selecionando um profissional e já tem auxiliar, limpar auxiliar
        if (campo === 'profissional_id' && valor && atribuicao.auxiliar_id) {
          return { ...atribuicao, [campo]: valor, auxiliar_id: undefined };
        }
        // Se está selecionando um auxiliar e já tem profissional, limpar profissional
        if (campo === 'auxiliar_id' && valor && atribuicao.profissional_id) {
          return { ...atribuicao, [campo]: valor, profissional_id: undefined };
        }
        return { ...atribuicao, [campo]: valor };
      }
      return atribuicao;
    });
    setAtribuicoes(novasAtribuicoes);
  };

  const todosAtribuidos = atribuicoes.every(a => a.exige_profissional === false || (a.profissional_id || a.auxiliar_id));
  const duracaoTotal = atribuicoes.reduce((total, a) => total + a.duracao_minutos, 0);

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Atribuir Profissionais às Etapas
        </h4>
        {!todosAtribuidos && (
          <span className="text-xs text-orange-600 font-medium">
            ⚠️ Atribuir todos os responsáveis
          </span>
        )}
      </div>

      <div className="space-y-2">
        {atribuicoes.map((atribuicao, index) => {
          const etapaOriginal = etapas[index];
          
          return (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-white border border-neutral-200 rounded-lg"
            >
              {/* Número da etapa */}
              <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full font-bold text-sm shrink-0">
                {index + 1}
              </div>

              {/* Nome da etapa */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900 truncate">
                  {atribuicao.nome}
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {atribuicao.duracao_minutos}min
                  </span>
                </div>
              </div>

              {/* Seletor de profissional/auxiliar */}
              <div className="shrink-0 w-48">
                {atribuicao.exige_profissional === false ? (
                  <div className="w-full px-2 py-1.5 text-xs text-center border border-dashed border-neutral-300 rounded bg-neutral-50 text-neutral-500">
                    ⏳ Tempo de Pausa
                  </div>
                ) : etapaOriginal?.pode_ter_auxiliar ? (
                  <select
                    value={atribuicao.profissional_id || atribuicao.auxiliar_id || ''}
                    onChange={(e) => {
                      const valor = e.target.value;
                      const ehAuxiliar = auxiliares.some(a => a.id === valor);
                      
                      if (ehAuxiliar) {
                        atualizarAtribuicao(index, 'auxiliar_id', valor);
                      } else {
                        atualizarAtribuicao(index, 'profissional_id', valor);
                      }
                    }}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      !atribuicao.profissional_id && !atribuicao.auxiliar_id
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-neutral-300'
                    }`}
                  >
                    <option value="">Selecionar...</option>
                    
                    <optgroup label="Profissionais">
                      {profissionais.map(p => (
                        <option key={p.id} value={p.id}>
                          👤 {p.nome}
                        </option>
                      ))}
                    </optgroup>
                    
                    {auxiliares.length > 0 && (
                      <optgroup label="Auxiliares">
                        {auxiliares.map(a => (
                          <option key={a.id} value={a.id}>
                            🤝 {a.nome}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                ) : (
                  <select
                    value={atribuicao.profissional_id || ''}
                    onChange={(e) => atualizarAtribuicao(index, 'profissional_id', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      !atribuicao.profissional_id
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-neutral-300'
                    }`}
                  >
                    <option value="">Selecionar profissional...</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="pt-3 border-t border-blue-200 grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <p className="text-neutral-600 text-xs">Total Etapas</p>
          <p className="font-bold text-blue-700">{atribuicoes.length}</p>
        </div>
        <div className="text-center">
          <p className="text-neutral-600 text-xs">Duração Total</p>
          <p className="font-bold text-blue-700">{duracaoTotal}min</p>
        </div>
        <div className="text-center">
          <p className="text-neutral-600 text-xs">Status</p>
          <p className={`font-bold ${todosAtribuidos ? 'text-green-600' : 'text-orange-600'}`}>
            {todosAtribuidos ? '✓ Completo' : `${atribuicoes.filter(a => a.exige_profissional === false || a.profissional_id || a.auxiliar_id).length}/${atribuicoes.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}
