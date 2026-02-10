'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Calendar, Edit, Trash2, User, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ClienteModal from '@/components/modals/ClienteModal';
import { supabase } from '@/lib/supabase';

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const handleEdit = (cliente: any) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedCliente(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCliente(null);
  };

  const stats = [
    { label: 'Total de Clientes', value: clientes.length.toString(), change: '+12', icon: User, color: 'bg-primary-500' },
    { label: 'Clientes Ativos', value: clientes.filter(c => c.status === 'ativo').length.toString(), change: '+8', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Ticket Médio', value: 'R$ 385', change: '+15%', icon: DollarSign, color: 'bg-accent-500' },
    { label: 'Novos este Mês', value: '23', change: '+5', icon: Calendar, color: 'bg-blue-500' },
  ];

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || cliente.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <ClienteModal 
        isOpen={modalOpen}
        onClose={handleModalClose}
        cliente={selectedCliente}
        onSave={loadClientes}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-neutral-600 mt-1">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center justify-center w-14 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-green-600 font-medium mt-2">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'todos' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'ativos' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('ativos')}
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === 'inativos' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('inativos')}
            >
              Inativos
            </Button>
          </div>
        </div>
      </Card>

      {/* Clientes List */}
      <Card padding="none">
        <CardHeader className="p-6 border-b border-neutral-100">
          <CardTitle>Lista de Clientes ({filteredClientes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Cliente</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Contato</th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-900">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-neutral-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {cliente.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{cliente.nome}</p>
                          <p className="text-sm text-neutral-600">ID: {cliente.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Phone className="w-4 h-4" />
                          {cliente.telefone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Mail className="w-4 h-4" />
                          {cliente.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={cliente.status === 'ativo' ? 'success' : 'default'}>
                        {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(cliente)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
