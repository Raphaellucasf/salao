'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Star, TrendingUp, DollarSign, Calendar, Award, Edit, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ProfissionalModal from '@/components/modals/ProfissionalModal';
import { supabase } from '@/lib/supabase';

export default function ProfissionaisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProfissional, setSelectedProfissional] = useState<any>(null);

  useEffect(() => {
    loadProfissionais();
  }, []);

  const loadProfissionais = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .order('nome');

      if (error) throw error;
      setProfissionais(data || []);
    } catch (error) {
      console.error('Erro:', error);
      setProfissionais([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (profissional?: any) => {
    setSelectedProfissional(profissional || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProfissional(null);
  };

  const handleSave = () => {
    loadProfissionais();
  };

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const stats = [
    { label: 'Total Profissionais', value: profissionais.length.toString(), icon: Award, color: 'bg-primary-500' },
    { label: 'Profissionais Ativos', value: profissionais.filter(p => p.ativo).length.toString(), icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Com Salário Fixo', value: profissionais.filter(p => p.tem_salario_fixo).length.toString(), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Com Comissão', value: profissionais.filter(p => p.recebe_comissao).length.toString(), icon: Star, color: 'bg-accent-500' },
  ];

  const filteredProfissionais = profissionais.filter(prof =>
    prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prof.grupos || []).some((g: string) => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Carregando profissionais...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Profissionais</h1>
          <p className="text-neutral-600 mt-1">Gerencie sua equipe e performance</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5" />
          Novo Profissional
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card padding="lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Buscar profissional ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Profissionais Grid */}
      {filteredProfissionais.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <p className="text-neutral-600">Nenhum profissional encontrado</p>
            <Button variant="primary" className="mt-4 gap-2" onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Profissional
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProfissionais.map((prof) => (
            <Card key={prof.id} padding="none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {prof.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">{prof.nome}</h3>
                      <p className="text-sm text-neutral-600">{prof.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={prof.ativo ? 'success' : 'error'} className="text-xs">
                          {prof.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenModal(prof)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>

                {/* Grupos */}
                {prof.grupos && prof.grupos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-neutral-600 uppercase mb-2">Grupos</p>
                    <div className="flex flex-wrap gap-2">
                      {prof.grupos.map((grupo: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                          {grupo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remuneração */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {prof.tem_salario_fixo && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        R$ {prof.salario_fixo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">Salário Fixo</p>
                    </div>
                  )}
                  {prof.recebe_comissao && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{prof.percentual_comissao}%</p>
                      <p className="text-xs text-neutral-600 mt-1">Comissão</p>
                    </div>
                  )}
                </div>

                {/* Dias de Trabalho */}
                {prof.dias_trabalho && prof.dias_trabalho.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-neutral-600 uppercase mb-2">Dias de Trabalho</p>
                    <div className="flex flex-wrap gap-2">
                      {prof.dias_trabalho.map((dia: number) => (
                        <span key={dia} className="px-3 py-1 bg-accent-50 text-accent-700 text-xs font-medium rounded-full">
                          {diasSemana[dia]}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      {prof.hora_inicio} às {prof.hora_fim}
                    </p>
                  </div>
                )}

                {/* Telefone */}
                {prof.telefone && (
                  <div className="text-sm text-neutral-600 mb-2">
                    📞 {prof.telefone}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <ProfissionalModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        profissional={selectedProfissional}
        onSave={handleSave}
      />
    </div>
  );
}
