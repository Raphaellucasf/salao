'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { Trash2, RotateCcw, User, Package, Calendar, FileText } from 'lucide-react';

interface CadastroExcluido {
  id: string;
  tipo_cadastro: string;
  dados_originais: any;
  motivo_exclusao?: string;
  data_exclusao: string;
  usuario_exclusao_id?: string;
  pode_recuperar: boolean;
  data_expiracao?: string;
  dias_restantes?: number;
}

export default function CadastrosExcluidosPage() {
  const [cadastros, setCadastros] = useState<CadastroExcluido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCadastrosExcluidos();
  }, []);

  const loadCadastrosExcluidos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cadastros_excluidos')
        .select('*')
        .order('data_exclusao', { ascending: false });

      if (error) throw error;

      const cadastrosComDias = (data || []).map((cadastro: any) => {
        let diasRestantes = null;
        if (cadastro.data_expiracao) {
          const hoje = new Date();
          const expiracao = new Date(cadastro.data_expiracao);
          diasRestantes = Math.ceil((expiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          ...cadastro,
          dias_restantes: diasRestantes
        };
      });

      setCadastros(cadastrosComDias);
    } catch (error) {
      console.error('Erro ao carregar cadastros excluídos:', error);
      setCadastros([]);
    } finally {
      setLoading(false);
    }
  };

  const recuperarCadastro = async (cadastro: CadastroExcluido) => {
    if (!confirm(`Deseja recuperar este ${cadastro.tipo_cadastro}?`)) return;

    try {
      // Aqui você implementaria a lógica de recuperação
      // Inserir de volta na tabela original
      console.log('Recuperar cadastro:', cadastro);

      // Remover da tabela de excluídos
      const { error } = await supabase
        .from('cadastros_excluidos')
        .delete()
        .eq('id', cadastro.id);

      if (error) throw error;

      alert('Cadastro recuperado com sucesso!');
      loadCadastrosExcluidos();
    } catch (error) {
      console.error('Erro ao recuperar cadastro:', error);
      alert('Erro ao recuperar cadastro');
    }
  };

  const excluirDefinitivamente = async (cadastro: CadastroExcluido) => {
    if (!confirm(`Deseja excluir DEFINITIVAMENTE este ${cadastro.tipo_cadastro}? Esta ação não pode ser desfeita!`)) return;

    try {
      const { error } = await supabase
        .from('cadastros_excluidos')
        .delete()
        .eq('id', cadastro.id);

      if (error) throw error;

      alert('Cadastro excluído definitivamente');
      loadCadastrosExcluidos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir cadastro');
    }
  };

  const cadastrosFiltrados = cadastros.filter(cadastro => {
    // Filtro de tipo
    if (filtroTipo !== 'todos' && cadastro.tipo_cadastro !== filtroTipo) {
      return false;
    }

    // Filtro de busca
    if (search) {
      const dados = cadastro.dados_originais;
      const searchLower = search.toLowerCase();
      const nome = dados?.nome?.toLowerCase() || '';
      const motivo = cadastro.motivo_exclusao?.toLowerCase() || '';
      
      if (!nome.includes(searchLower) && !motivo.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const tiposDisponiveis = ['todos', ...new Set(cadastros.map(c => c.tipo_cadastro))];

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, any> = {
      cliente: User,
      produto: Package,
      servico: FileText,
      agendamento: Calendar
    };
    const Icon = icons[tipo] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-gray-500" />
            Cadastros Excluídos
          </h1>
          <p className="text-gray-600 mt-1">
            {cadastrosFiltrados.length} cadastros excluídos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome ou motivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {tiposDisponiveis.map(tipo => (
              <Button
                key={tipo}
                size="sm"
                variant={filtroTipo === tipo ? 'primary' : 'outline'}
                onClick={() => setFiltroTipo(tipo)}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista de Cadastros */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : cadastrosFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cadastro excluído encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cadastrosFiltrados.map((cadastro) => {
            const nome = cadastro.dados_originais?.nome || 'Nome não disponível';
            const dataExclusao = new Date(cadastro.data_exclusao).toLocaleDateString('pt-BR');
            const isExpirado = cadastro.dias_restantes !== null && cadastro.dias_restantes !== undefined && cadastro.dias_restantes <= 0;

            return (
              <Card key={cadastro.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                      {getTipoIcon(cadastro.tipo_cadastro)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{nome}</h3>
                        <Badge variant="default">
                          {cadastro.tipo_cadastro}
                        </Badge>
                        {!cadastro.pode_recuperar && (
                          <Badge variant="error">Não recuperável</Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Excluído em:</strong> {dataExclusao}
                        </p>
                        {cadastro.motivo_exclusao && (
                          <p>
                            <strong>Motivo:</strong> {cadastro.motivo_exclusao}
                          </p>
                        )}
                        {cadastro.dias_restantes !== null && cadastro.dias_restantes !== undefined && (
                          <p>
                            <strong>Expira em:</strong>{' '}
                            {isExpirado ? (
                              <span className="text-red-500">Expirado</span>
                            ) : (
                              <span className={cadastro.dias_restantes <= 7 ? 'text-orange-500' : ''}>
                                {cadastro.dias_restantes} dias
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Preview dos dados */}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                          Ver dados originais
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(cadastro.dados_originais, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cadastro.pode_recuperar && !isExpirado && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => recuperarCadastro(cadastro)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Recuperar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => excluirDefinitivamente(cadastro)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
