'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Cake, Phone, Mail, Gift, Calendar } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  idade?: number;
  dias_ate_aniversario?: number;
}

export default function AniversariantesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadAniversariantes();
  }, [mesAtual]);

  const loadAniversariantes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone, email, data_nascimento')
        .not('data_nascimento', 'is', null)
        .order('nome');

      if (error) throw error;

      // Filtrar e calcular idade/dias
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      
      const aniversariantes = (data || [])
        .map((cliente: any) => {
          const dataNasc = new Date(cliente.data_nascimento);
          const mesNasc = dataNasc.getMonth() + 1;
          const diaNasc = dataNasc.getDate();
          
          // Calcular idade
          const idade = anoAtual - dataNasc.getFullYear();
          
          // Calcular dias até o aniversário
          const proxAniver = new Date(anoAtual, mesNasc - 1, diaNasc);
          if (proxAniver < hoje) {
            proxAniver.setFullYear(anoAtual + 1);
          }
          const diasAte = Math.ceil((proxAniver.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            ...cliente,
            idade,
            dias_ate_aniversario: diasAte,
            mes_nascimento: mesNasc
          };
        })
        .filter((c: any) => c.mes_nascimento === mesAtual)
        .sort((a: any, b: any) => {
          const diaA = new Date(a.data_nascimento).getDate();
          const diaB = new Date(b.data_nascimento).getDate();
          return diaA - diaB;
        });

      setClientes(aniversariantes);
    } catch (error) {
      console.error('Erro ao carregar aniversariantes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = (cliente: Cliente) => {
    // Abrir modal de mensagem com template de aniversário
    console.log('Enviar mensagem de aniversário para', cliente.nome);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-500" />
            Aniversariantes
          </h1>
          <p className="text-gray-600 mt-1">
            Clientes fazendo aniversário este mês
          </p>
        </div>
      </div>

      {/* Seletor de Mês */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {meses.map((mes, index) => (
            <Button
              key={mes}
              size="sm"
              variant={mesAtual === index + 1 ? 'primary' : 'outline'}
              onClick={() => setMesAtual(index + 1)}
            >
              {mes}
            </Button>
          ))}
        </div>
      </Card>

      {/* Lista de Aniversariantes */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : clientes.length === 0 ? (
        <Card className="p-8 text-center">
          <Cake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum aniversariante em {meses[mesAtual - 1]}</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clientes.map((cliente) => {
            const dataNasc = new Date(cliente.data_nascimento!);
            const dia = dataNasc.getDate();
            const isHoje = cliente.dias_ate_aniversario === 0;

            return (
              <Card key={cliente.id} className={`p-4 ${isHoje ? 'border-2 border-pink-500 bg-pink-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${isHoje ? 'bg-pink-500' : 'bg-purple-500'}`}>
                      {dia}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {cliente.nome}
                        {isHoje && (
                          <span className="text-pink-500 text-sm">
                            🎉 HOJE!
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {cliente.idade} anos • {cliente.dias_ate_aniversario === 0 ? 'Hoje' : `Faltam ${cliente.dias_ate_aniversario} dias`}
                      </p>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => enviarMensagem(cliente)}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Enviar Parabéns
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
