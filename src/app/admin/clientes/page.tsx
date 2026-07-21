'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Edit, Eye, Mail, Phone, Plus, Search, Trash2, TrendingUp, User, Users } from 'lucide-react';
import { Badge, Button, Card, Input, PageHeader, StatCard } from '@/components/ui';
import ClienteModal from '@/components/modals/ClienteModal';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  status?: string;
  created_at?: string | null;
}

export default function ClientesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClientes((data || []) as Cliente[]);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClientes();
  }, [loadClientes]);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      await loadClientes();
    } catch (error: unknown) {
      const detail = error as { message?: string; details?: string };
      const message = detail.message || detail.details || 'Erro desconhecido';
      if (message.includes('foreign key') || message.includes('violates') || message.includes('referenced')) {
        alert('Não é possível excluir este cliente porque ele possui registros vinculados. Considere inativá-lo.');
      } else {
        alert(`Erro ao excluir cliente: ${message}`);
      }
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
  };

  const clientesAtivos = clientes.filter((cliente) => cliente.status === 'ativo').length;
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const novosMes = clientes.filter((cliente) => cliente.created_at && new Date(cliente.created_at) >= inicioMes).length;
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = !normalizedSearch || [cliente.nome, cliente.telefone, cliente.email]
      .some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
    const matchesStatus = filterStatus === 'todos' || cliente.status === filterStatus.slice(0, -1);
    return matchesSearch && matchesStatus;
  });

  const openNewClient = () => {
    setSelectedCliente(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
  };

  return (
    <div className="app-page space-y-6">
      <ClienteModal isOpen={modalOpen} onClose={closeModal} cliente={selectedCliente} onSave={loadClientes} />

      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        description="Encontre contatos, acompanhe sua base e mantenha os cadastros organizados."
        icon={Users}
        actions={(
          <Button onClick={openNewClient} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de clientes" value={loading ? '—' : clientes.length} icon={User} />
        <StatCard label="Clientes ativos" value={loading ? '—' : clientesAtivos} icon={TrendingUp} tone="success" />
        <StatCard label="Novos neste mês" value={loading ? '—' : novosMes} icon={Calendar} tone="info" />
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              aria-label="Buscar clientes"
              type="search"
              placeholder="Buscar por nome, telefone ou e-mail"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-neutral-100 p-1" aria-label="Filtrar por status">
            {(['todos', 'ativos', 'inativos'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                aria-pressed={filterStatus === status}
                className={`min-h-9 rounded-xl px-3 text-sm font-semibold capitalize transition-all ${filterStatus === status ? 'bg-white text-primary-800 shadow-card' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-neutral-950">Lista de clientes</h2>
            <p className="mt-1 text-xs text-neutral-500">{filteredClientes.length} {filteredClientes.length === 1 ? 'resultado' : 'resultados'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 sm:p-6" aria-label="Carregando clientes">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />)}
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><Search className="h-6 w-6" /></div>
            <h3 className="mt-5 font-semibold text-neutral-950">Nenhum cliente encontrado</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">Revise a busca ou o filtro selecionado. Você também pode cadastrar um novo cliente.</p>
            <Button variant="outline" onClick={openNewClient} className="mt-5"><Plus className="h-4 w-4" /> Cadastrar cliente</Button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-100 md:hidden">
              {filteredClientes.map((cliente) => (
                <article key={cliente.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-semibold text-primary-800">{cliente.nome?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><h3 className="truncate font-semibold text-neutral-950">{cliente.nome || 'Sem nome'}</h3><p className="mt-0.5 text-xs text-neutral-400">ID {String(cliente.id).padStart(4, '0')}</p></div>
                        <Badge variant={cliente.status === 'ativo' ? 'success' : 'default'}>{cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      <div className="mt-3 space-y-1.5 text-sm text-neutral-600">
                        {cliente.telefone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-neutral-400" />{cliente.telefone}</p>}
                        {cliente.email && <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-neutral-400" /><span className="truncate">{cliente.email}</span></p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => router.push(`/admin/clientes/${cliente.id}`)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary-50 text-xs font-semibold text-primary-800"><Eye className="h-4 w-4" /> Perfil</button>
                    <button type="button" onClick={() => handleEdit(cliente)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700"><Edit className="h-4 w-4" /> Editar</button>
                    <button type="button" onClick={() => handleDelete(cliente.id)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" /> Excluir</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-neutral-100 bg-neutral-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Cliente</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Contato</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="transition-colors hover:bg-primary-50/35">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 font-semibold text-primary-800">{cliente.nome?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div><p className="font-semibold text-neutral-950">{cliente.nome || 'Sem nome'}</p><p className="mt-0.5 text-xs text-neutral-400">ID {String(cliente.id).padStart(4, '0')}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        <div className="space-y-1.5">{cliente.telefone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-neutral-400" />{cliente.telefone}</p>}{cliente.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-neutral-400" />{cliente.email}</p>}</div>
                      </td>
                      <td className="px-6 py-4"><Badge variant={cliente.status === 'ativo' ? 'success' : 'default'}>{cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => router.push(`/admin/clientes/${cliente.id}`)} className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-700 hover:bg-primary-50" aria-label={`Ver perfil de ${cliente.nome || 'cliente'}`}><Eye className="h-4 w-4" /></button>
                          <button type="button" onClick={() => handleEdit(cliente)} className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100" aria-label={`Editar ${cliente.nome || 'cliente'}`}><Edit className="h-4 w-4" /></button>
                          <button type="button" onClick={() => handleDelete(cliente.id)} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Excluir ${cliente.nome || 'cliente'}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
