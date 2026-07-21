'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Calendar, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/supabase';

type AgendaResult = Database['public']['Views']['vw_agendamentos_completos']['Row'];

function serviceText(value: Json | null): string {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      return serviceText(JSON.parse(value) as Json);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(serviceText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    for (const key of ['nome', 'servico_nome', 'name'] as const) {
      const name = value[key];
      if (typeof name === 'string') return name;
    }
    // Não percorra valores arbitrários: objetos desconhecidos podem conter
    // IDs, preços ou outros metadados internos que não pertencem à interface.
    return '';
  }
  return '';
}

interface BuscarAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuscarAgendaModal({ isOpen, onClose }: BuscarAgendaModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'cliente' | 'profissional' | 'servico'>('cliente');
  const [results, setResults] = useState<AgendaResult[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('vw_agendamentos_completos')
        .select('*');

      // Filtros de data
      if (dataInicio) {
        query = query.gte('data_agendamento', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_agendamento', dataFim);
      }

      query = query.order('data_agendamento', { ascending: false }).limit(500);

      const { data, error } = await query;

      if (error) throw error;
      const normalized = searchTerm.trim().toLocaleLowerCase('pt-BR');
      setResults((data ?? []).filter((row) => {
        const candidate = searchType === 'cliente'
          ? row.cliente_nome
          : searchType === 'profissional'
            ? row.profissional_nome
            : serviceText(row.servicos);
        return candidate?.toLocaleLowerCase('pt-BR').includes(normalized) ?? false;
      }).slice(0, 50));
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(handleSearch, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchTerm, searchType, dataInicio, dataFim]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      confirmado: 'success',
      pendente: 'warning',
      cancelado: 'error',
      concluido: 'info',
    };
    return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar na Agenda (Ctrl+B)" size="xl">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Buscar por</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="cliente">Cliente</option>
                <option value="profissional">Profissional</option>
                <option value="servico">Serviço</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {searchType === 'cliente' && 'Nome do Cliente'}
                {searchType === 'profissional' && 'Nome do Profissional'}
                {searchType === 'servico' && 'Nome do Serviço'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <Input
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>

        {/* Resultados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">
              Resultados {results.length > 0 && `(${results.length})`}
            </h3>
            {loading && <div className="text-sm text-neutral-500">Buscando...</div>}
          </div>

          {searchTerm.length < 2 ? (
            <div className="text-center py-12 text-neutral-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>Digite pelo menos 2 caracteres para buscar</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-neutral-500" />
                        <span className="font-semibold text-neutral-900">
                          {agendamento.cliente_nome || 'Cliente não encontrado'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {serviceText(agendamento.servicos) || 'Serviço não especificado'}
                      </p>
                    </div>
                    {getStatusBadge(agendamento.status ?? 'pendente')}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {agendamento.data_agendamento
                        ? new Date(`${agendamento.data_agendamento}T00:00:00`).toLocaleDateString('pt-BR')
                        : 'Data não informada'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {agendamento.hora_inicio?.slice(0, 5) || '--:--'}
                    </span>
                    {agendamento.profissional_nome && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {agendamento.profissional_nome}
                      </span>
                    )}
                  </div>

                  {agendamento.observacoes && (
                    <p className="text-sm text-neutral-500 mt-2 line-clamp-1">
                      {agendamento.observacoes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

