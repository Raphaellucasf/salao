'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Package as PackageIcon, Edit, Trash2 } from 'lucide-react';
import PacoteModal from '@/components/modals/PacoteModal';
import { supabase } from '@/lib/supabase';

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPacote, setSelectedPacote] = useState<any>(null);

  useEffect(() => {
    loadPacotes();
  }, []);

  const loadPacotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacotes')
        .select('*, pacote_servicos(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPacotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pacote: any) => {
    setSelectedPacote(pacote);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este pacote?')) return;

    try {
      const { error } = await supabase
        .from('pacotes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      loadPacotes();
    } catch (error: any) {
      alert('Erro ao desativar pacote: ' + error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PacoteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPacote(null);
        }}
        pacote={selectedPacote}
        onSave={loadPacotes}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pacotes</h1>
          <p className="text-neutral-600 mt-1">Serviços combinados com desconto</p>
        </div>
        <Button
          onClick={() => {
            setSelectedPacote(null);
            setModalOpen(true);
          }}
          variant="primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Pacote
        </Button>
      </div>

      {/* Grid de Pacotes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-neutral-600">
            Carregando pacotes...
          </div>
        ) : pacotes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-600">
            Nenhum pacote cadastrado
          </div>
        ) : (
          pacotes.map((pacote) => (
            <Card key={pacote.id} padding="lg">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PackageIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{pacote.nome}</h3>
                      <p className="text-sm text-neutral-600 mt-1">{pacote.descricao}</p>
                    </div>
                  </div>
                  <Badge variant={pacote.ativo ? 'success' : 'danger'}>
                    {pacote.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-neutral-600 mb-2">Serviços inclusos:</p>
                  <div className="space-y-1">
                    {pacote.pacote_servicos?.map((s: any, idx: number) => (
                      <div key={idx} className="text-sm text-neutral-700">
                        • {s.quantidade}x {s.servico_nome}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-600">Preço</p>
                    <p className="text-2xl font-bold text-primary-600">
                      R$ {pacote.preco.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-600">Validade</p>
                    <p className="font-semibold text-neutral-900">{pacote.validade_dias} dias</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(pacote)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(pacote.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
