'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import OrcamentoModal from '@/components/modals/OrcamentoModal';
import { supabase } from '@/lib/supabase';

export default function OrcamentosPage() {
  const [loading, setLoading] = useState(true);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          clientes (id, nome, telefone),
          profissionais (id, nome)
        `)
        .order('data_orcamento', { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', icon: any }> = {
      pendente: { variant: 'warning', icon: Clock },
      aprovado: { variant: 'success', icon: CheckCircle },
      recusado: { variant: 'error', icon: XCircle },
      expirado: { variant: 'error', icon: XCircle },
    };
    return statusMap[status] || { variant: 'info', icon: FileText };
  };

  const stats = [
    { label: 'Total Orçamentos', value: orcamentos.length.toString(), color: 'bg-primary-500' },
    { label: 'Pendentes', value: orcamentos.filter(o => o.status === 'pendente').length.toString(), color: 'bg-yellow-500' },
    { label: 'Aprovados', value: orcamentos.filter(o => o.status === 'aprovado').length.toString(), color: 'bg-green-500' },
    { label: 'Valor Total', value: `R$ ${orcamentos.filter(o => o.status === 'aprovado').reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'bg-blue-500' },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Orçamentos</h1>
          <p className="text-neutral-600 mt-1">Gerencie propostas e cotações</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lista */}
      {orcamentos.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">Nenhum orçamento criado ainda</p>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Criar Primeiro Orçamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {orcamentos.map((orc) => {
            const statusInfo = getStatusInfo(orc.status);
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={orc.id} padding="none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-neutral-900">
                          Orçamento #{orc.numero_orcamento}
                        </h3>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {orc.status}
                        </Badge>
                      </div>
                      <p className="text-neutral-700 font-medium mb-2">{orc.clientes?.nome}</p>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(orc.data_orcamento).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {parseFloat(orc.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {orc.validade_ate && (
                          <span className="text-xs">
                            Validade: {new Date(orc.validade_ate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {orc.observacoes && (
                        <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{orc.observacoes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OrcamentoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={loadOrcamentos}
      />
    </div>
  );
}
