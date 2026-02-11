'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TemplateModal } from '@/components/modals/TemplateModal';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

interface Template {
  id: string;
  tipo: string;
  nome_template: string;
  descricao?: string;
  campos_padrao: any[];
  campos_obrigatorios?: string[];
  ativo: boolean;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | undefined>();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cadastro_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (template: Template) => {
    setTemplateSelecionado(template);
    setIsModalOpen(true);
  };

  const handleNovo = () => {
    setTemplateSelecionado(undefined);
    setIsModalOpen(true);
  };

  const handleDuplicar = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('cadastro_templates')
        // @ts-ignore - cadastro_templates table not in types
        .insert({
          tipo: template.tipo,
          nome_template: `${template.nome_template} (Cópia)`,
          descricao: template.descricao,
          campos_padrao: template.campos_padrao,
          campos_obrigatorios: template.campos_obrigatorios,
          ativo: false
        });

      if (error) throw error;
      alert('Template duplicado com sucesso!');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao duplicar template');
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('cadastro_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Template excluído com sucesso!');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir template');
    }
  };

  const toggleAtivo = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('cadastro_templates')
        // @ts-ignore - cadastro_templates table not in types
        .update({ ativo: !template.ativo })
        .eq('id', template.id);

      if (error) throw error;
      loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar status');
    }
  };

  const templatesFiltrados = templates.filter(template => {
    if (filtroTipo !== 'todos' && template.tipo !== filtroTipo) return false;
    if (search && !template.nome_template.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tiposDisponiveis = ['todos', ...new Set(templates.map(t => t.tipo))];

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      cliente: 'Cliente',
      produto: 'Produto',
      servico: 'Serviço',
      profissional: 'Profissional',
      fornecedor: 'Fornecedor'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Templates de Cadastro
          </h1>
          <p className="text-gray-600 mt-1">
            {templatesFiltrados.length} templates cadastrados
          </p>
        </div>

        <Button onClick={handleNovo}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar template..."
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
                {tipo === 'todos' ? 'Todos' : getTipoLabel(tipo)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista de Templates */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </Card>
      ) : templatesFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum template encontrado</p>
          <Button onClick={handleNovo} className="mt-4">
            Criar Primeiro Template
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templatesFiltrados.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{template.nome_template}</h3>
                    <Badge variant="default">{getTipoLabel(template.tipo)}</Badge>
                    <Badge variant={template.ativo ? 'success' : 'default'}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {template.descricao && (
                    <p className="text-sm text-gray-600 mb-3">{template.descricao}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {template.campos_padrao?.length || 0} campos configurados
                    </span>
                    {template.campos_obrigatorios && template.campos_obrigatorios.length > 0 && (
                      <span>
                        • {template.campos_obrigatorios.length} campos obrigatórios
                      </span>
                    )}
                    <span>
                      • Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Preview dos campos */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-indigo-600 hover:underline">
                      Ver campos do template
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                      {template.campos_padrao?.map((campo: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{campo.nome}</span>
                          <Badge variant="default">{campo.tipo}</Badge>
                          {template.campos_obrigatorios?.includes(campo.nome) && (
                            <Badge variant="error">Obrigatório</Badge>
                          )}
                          {campo.valor && (
                            <span className="text-gray-500">• Padrão: {campo.valor}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAtivo(template)}
                    title={template.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {template.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicar(template)}
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditar(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExcluir(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTemplateSelecionado(undefined);
        }}
        template={templateSelecionado}
        onSuccess={loadTemplates}
      />
    </div>
  );
}
