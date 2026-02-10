'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SaldoModal } from '@/components/modals/SaldoModal';
import { supabase } from '@/lib/supabase';
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, Search, Edit } from 'lucide-react';

interface ClienteSaldo {
  cliente_id: string;
  cliente_nome: string;
  credito: number;
  debito: number;
  pontos: number;
  ultima_atualizacao?: string;
}

export default function SaldosPage() {
  const [clientes, setClientes] = useState<ClienteSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>();

  useEffect(() => {
    loadSaldos();
  }, []);

  const loadSaldos = async () => {
    try {
      setLoading(true);

      // Buscar todos os saldos
      const { data, error } = await supabase
        .from('cliente_saldos')
        .select(`
          cliente_id,
          tipo,
          saldo_atual,
          created_at,
          clientes (
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por cliente e tipo
      const saldosMap = new Map<string, ClienteSaldo>();

      (data || []).forEach((saldo: any) => {
        const clienteId = saldo.cliente_id;
        const clienteNome = saldo.clientes?.nome || 'Cliente não identificado';

        if (!saldosMap.has(clienteId)) {
          saldosMap.set(clienteId, {
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            credito: 0,
            debito: 0,
            pontos: 0,
            ultima_atualizacao: saldo.created_at
          });
        }

        const cliente = saldosMap.get(clienteId)!;

        // Pegar o saldo mais recente de cada tipo
        if (saldo.tipo === 'credito' && cliente.credito === 0) {
          cliente.credito = saldo.saldo_atual || 0;
        } else if (saldo.tipo === 'debito' && cliente.debito === 0) {
          cliente.debito = saldo.saldo_atual || 0;
        } else if (saldo.tipo === 'pontos' && cliente.pontos === 0) {
          cliente.pontos = saldo.saldo_atual || 0;
        }

        if (saldo.created_at > (cliente.ultima_atualizacao || '')) {
          cliente.ultima_atualizacao = saldo.created_at;
        }
      });

      setClientes(Array.from(saldosMap.values()));
    } catch (error) {
      console.error('Erro ao carregar saldos:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    search === '' || cliente.cliente_nome.toLowerCase().includes(search.toLowerCase())
  );

  const totais = clientesFiltrados.reduce(
    (acc, cliente) => ({
      credito: acc.credito + cliente.credito,
      debito: acc.debito + cliente.debito,
      pontos: acc.pontos + cliente.pontos
    }),
    { credito: 0, debito: 0, pontos: 0 }
  );

  const handleAlterarSaldo = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-purple-500" />
            Consultar Saldos
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie créditos, débitos e pontos dos clientes
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Alterar Saldo
        </Button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total em Créditos</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totais.credito.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total em Débitos</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {totais.debito.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total em Pontos</p>
              <p className="text-2xl font-bold text-blue-600">
                {totais.pontos.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Busca */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : clientesFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cliente com saldo encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.cliente_id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">{cliente.cliente_nome}</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Crédito</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={cliente.credito > 0 ? 'success' : 'default'}>
                          R$ {cliente.credito.toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">Débito</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={cliente.debito > 0 ? 'error' : 'default'}>
                          R$ {cliente.debito.toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">Pontos</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={cliente.pontos > 0 ? 'default' : 'default'}>
                          {cliente.pontos}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {cliente.ultima_atualizacao && (
                    <p className="text-xs text-gray-500 mt-2">
                      Última atualização: {new Date(cliente.ultima_atualizacao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAlterarSaldo(cliente.cliente_id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Alterar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Alterar Saldo */}
      <SaldoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClienteSelecionado(undefined);
        }}
        clienteId={clienteSelecionado}
        onSuccess={loadSaldos}
      />
    </div>
  );
}
