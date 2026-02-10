'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Phone, Mail, DollarSign, Calendar, Filter } from 'lucide-react';

interface ClienteDebito {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  valor_debito: number;
  ultima_compra?: string;
  dias_em_aberto: number;
}

export default function DebitosPage() {
  const [clientes, setClientes] = useState<ClienteDebito[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroValor, setFiltroValor] = useState<'todos' | 'ate100' | 'ate500' | 'acima500'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClientesDebito();
  }, []);

  const loadClientesDebito = async () => {
    try {
      setLoading(true);

      // Buscar clientes com saldo negativo
      const { data: saldos, error } = await supabase
        .from('cliente_saldos')
        .select(`
          cliente_id,
          valor,
          created_at,
          clientes (
            id,
            nome,
            telefone,
            email
          )
        `)
        .eq('tipo', 'debito')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por cliente e calcular total de débito
      const debitosMap = new Map<string, ClienteDebito>();
      
      (saldos || []).forEach((saldo: any) => {
        const clienteId = saldo.cliente_id;
        const cliente = saldo.clientes;
        
        if (cliente) {
          const existing = debitosMap.get(clienteId);
          const valor = Math.abs(saldo.valor);
          const diasAberto = Math.floor((Date.now() - new Date(saldo.created_at).getTime()) / (1000 * 60 * 60 * 24));

          if (existing) {
            existing.valor_debito += valor;
            if (!existing.ultima_compra || saldo.created_at > existing.ultima_compra) {
              existing.ultima_compra = saldo.created_at;
              existing.dias_em_aberto = diasAberto;
            }
          } else {
            debitosMap.set(clienteId, {
              id: cliente.id,
              nome: cliente.nome,
              telefone: cliente.telefone,
              email: cliente.email,
              valor_debito: valor,
              ultima_compra: saldo.created_at,
              dias_em_aberto: diasAberto
            });
          }
        }
      });

      const clientesComDebito = Array.from(debitosMap.values())
        .sort((a, b) => b.valor_debito - a.valor_debito);

      setClientes(clientesComDebito);
    } catch (error) {
      console.error('Erro ao carregar clientes com débito:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro de busca
    if (search && !cliente.nome.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Filtro de valor
    if (filtroValor === 'ate100' && cliente.valor_debito > 100) return false;
    if (filtroValor === 'ate500' && cliente.valor_debito > 500) return false;
    if (filtroValor === 'acima500' && cliente.valor_debito <= 500) return false;

    return true;
  });

  const totalDebito = clientesFiltrados.reduce((acc, c) => acc + c.valor_debito, 0);

  const getStatusColor = (dias: number) => {
    if (dias <= 7) return 'warning';
    if (dias <= 30) return 'error';
    return 'default';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            Clientes com Débito
          </h1>
          <p className="text-gray-600 mt-1">
            {clientesFiltrados.length} clientes • Total: R$ {totalDebito.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Button
              size="sm"
              variant={filtroValor === 'todos' ? 'primary' : 'outline'}
              onClick={() => setFiltroValor('todos')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filtroValor === 'ate100' ? 'primary' : 'outline'}
              onClick={() => setFiltroValor('ate100')}
            >
              Até R$ 100
            </Button>
            <Button
              size="sm"
              variant={filtroValor === 'ate500' ? 'primary' : 'outline'}
              onClick={() => setFiltroValor('ate500')}
            >
              Até R$ 500
            </Button>
            <Button
              size="sm"
              variant={filtroValor === 'acima500' ? 'primary' : 'outline'}
              onClick={() => setFiltroValor('acima500')}
            >
              Acima R$ 500
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : clientesFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cliente com débito encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                    R$
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      {cliente.telefone && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {cliente.telefone}
                        </span>
                      )}
                      {cliente.email && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {cliente.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(cliente.dias_em_aberto)}>
                        {cliente.dias_em_aberto} dias em aberto
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    R$ {cliente.valor_debito.toFixed(2)}
                  </div>
                  {cliente.ultima_compra && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 justify-end mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(cliente.ultima_compra).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Registrar Pagamento
                    </Button>
                    <Button size="sm" variant="outline">
                      Cobrar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
