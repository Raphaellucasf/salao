'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Calendar, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BuscarAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuscarAgendaModal({ isOpen, onClose }: BuscarAgendaModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'cliente' | 'profissional' | 'servico'>('cliente');
  const [results, setResults] = useState<any[]>([]);
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
        .from('appointments')
        .select(`
          *,
          clientes (id, nome, telefone),
          usuarios (id, nome),
          servicos (id, nome)
        `);

      // Filtros por tipo
      if (searchType === 'cliente') {
        query = query.ilike('clientes.nome', `%${searchTerm}%`);
      } else if (searchType === 'profissional') {
        query = query.ilike('usuarios.nome', `%${searchTerm}%`);
      } else if (searchType === 'servico') {
        query = query.ilike('servicos.nome', `%${searchTerm}%`);
      }

      // Filtros de data
      if (dataInicio) {
        query = query.gte('data_hora', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_hora', dataFim);
      }

      query = query.order('data_hora', { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
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
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
      confirmado: 'success',
      pendente: 'warning',
      cancelado: 'danger',
      concluido: 'primary',
    };
    return <Badge variant={variants[status] || 'primary'}>{status}</Badge>;
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
                onChange={(e) => setSearchType(e.target.value as any)}
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
                          {agendamento.clientes?.nome || 'Cliente não encontrado'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {agendamento.servicos?.nome || 'Serviço não especificado'}
                      </p>
                    </div>
                    {getStatusBadge(agendamento.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(agendamento.data_hora).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(agendamento.data_hora).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {agendamento.usuarios && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {agendamento.usuarios.nome}
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
