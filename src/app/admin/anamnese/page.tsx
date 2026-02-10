'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, User, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import AnamneseModal from '@/components/modals/AnamneseModal';
import { supabase } from '@/lib/supabase';

type TipoAnamnese = 'capilar' | 'corporal_facial' | 'podologica' | 'micropigmentacao';

const TIPOS_ANAMNESE = [
  { value: 'capilar', label: 'Capilar', icon: '💇', color: 'bg-purple-500' },
  { value: 'corporal_facial', label: 'Corporal e Facial', icon: '✨', color: 'bg-pink-500' },
  { value: 'podologica', label: 'Podológica', icon: '🦶', color: 'bg-blue-500' },
  { value: 'micropigmentacao', label: 'Micropigmentação', icon: '🎨', color: 'bg-green-500' },
];

export default function AnamnesePage() {
  const [loading, setLoading] = useState(true);
  const [anamneses, setAnamneses] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<TipoAnamnese>('capilar');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [anamneseSelecionada, setAnamneseSelecionada] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [anamnesesData, clientesData] = await Promise.all([
        supabase
          .from('anamneses')
          .select(`
            *,
            clientes (id, nome, telefone, email),
            profissionais (id, nome)
          `)
          .order('data_anamnese', { ascending: false }),
        supabase
          .from('clientes')
          .select('id, nome, telefone, email')
          .order('nome')
      ]);

      if (anamnesesData.error) throw anamnesesData.error;
      if (clientesData.error) throw clientesData.error;

      setAnamneses(anamnesesData.data || []);
      setClientes(clientesData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaAnamnese = (tipo: TipoAnamnese, clienteId?: string) => {
    setModalTipo(tipo);
    setClienteSelecionado(clienteId || '');
    setAnamneseSelecionada(null);
    setModalOpen(true);
  };

  const handleEditarAnamnese = (anamnese: any) => {
    setModalTipo(anamnese.tipo);
    setClienteSelecionado(anamnese.cliente_id);
    setAnamneseSelecionada(anamnese);
    setModalOpen(true);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta anamnese?')) return;

    try {
      const { error } = await supabase
        .from('anamneses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir anamnese');
    }
  };

  const filteredAnamneses = anamneses.filter(a => {
    const matchesSearch = a.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !tipoFiltro || a.tipo === tipoFiltro;
    return matchesSearch && matchesTipo;
  });

  const stats = [
    { label: 'Total Anamneses', value: anamneses.length.toString(), color: 'bg-primary-500' },
    { label: 'Capilar', value: anamneses.filter(a => a.tipo === 'capilar').length.toString(), color: 'bg-purple-500' },
    { label: 'Corporal/Facial', value: anamneses.filter(a => a.tipo === 'corporal_facial').length.toString(), color: 'bg-pink-500' },
    { label: 'Outras', value: anamneses.filter(a => !['capilar', 'corporal_facial'].includes(a.tipo)).length.toString(), color: 'bg-blue-500' },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Carregando anamneses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Anamnese</h1>
          <p className="text-neutral-600 mt-1">Gerencie as fichas de avaliação dos clientes</p>
        </div>
      </div>

      {/* Botões de Novo por Tipo */}
      <div className="grid md:grid-cols-4 gap-4">
        {TIPOS_ANAMNESE.map((tipo) => (
          <Card key={tipo.value} padding="none" className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent 
              className="p-6 text-center"
              onClick={() => handleNovaAnamnese(tipo.value as TipoAnamnese)}
            >
              <div className={`w-16 h-16 ${tipo.color} rounded-full flex items-center justify-center text-3xl mx-auto mb-3`}>
                {tipo.icon}
              </div>
              <h3 className="font-bold text-neutral-900">{tipo.label}</h3>
              <p className="text-sm text-neutral-600 mt-1">
                {anamneses.filter(a => a.tipo === tipo.value).length} fichas
              </p>
              <Button variant="primary" size="sm" className="mt-3 w-full gap-2">
                <Plus className="w-4 h-4" />
                Nova Ficha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card padding="lg">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_ANAMNESE.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Lista de Anamneses */}
      {filteredAnamneses.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">Nenhuma anamnese encontrada</p>
            <p className="text-sm text-neutral-500">Selecione um tipo de anamnese acima para começar</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnamneses.map((anamnese) => {
            const tipoInfo = TIPOS_ANAMNESE.find(t => t.value === anamnese.tipo);
            return (
              <Card key={anamnese.id} padding="none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 ${tipoInfo?.color} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
                        {tipoInfo?.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-neutral-900">
                            {anamnese.clientes?.nome}
                          </h3>
                          <Badge variant="primary">{tipoInfo?.label}</Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">
                          {anamnese.clientes?.telefone} • {anamnese.clientes?.email}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(anamnese.data_anamnese).toLocaleDateString('pt-BR')}
                          </span>
                          {anamnese.profissionais && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {anamnese.profissionais.nome}
                            </span>
                          )}
                        </div>
                        {anamnese.observacoes && (
                          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                            {anamnese.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditarAnamnese(anamnese)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExcluir(anamnese.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && clienteSelecionado && (
        <AnamneseModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setClienteSelecionado('');
            setAnamneseSelecionada(null);
          }}
          clienteId={clienteSelecionado}
          tipo={modalTipo}
          anamnese={anamneseSelecionada}
          onSave={loadData}
        />
      )}

      {/* Modal de Seleção de Cliente */}
      {modalOpen && !clienteSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Selecione o Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {clientes
                  .filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(cliente => (
                    <div
                      key={cliente.id}
                      onClick={() => setClienteSelecionado(cliente.id)}
                      className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-500 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-neutral-900">{cliente.nome}</p>
                      <p className="text-sm text-neutral-600">{cliente.telefone} • {cliente.email}</p>
                    </div>
                  ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
