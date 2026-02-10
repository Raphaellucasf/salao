'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Shield, Mail, Phone, Calendar, Search, Plus, Pencil, Trash2, Key } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import UsuarioModal from '@/components/modals/UsuarioModal';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  ativo: boolean;
  role_id: string;
  roles: {
    nome: string;
    cor: string;
    nivel: number;
  };
  ultimo_acesso: string;
  created_at: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    usuariosInativos: 0,
    acessosHoje: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (
            nome,
            cor,
            nivel
          )
        `)
        .order('created_at', { ascending: false });

      if (usuariosError) throw usuariosError;

      if (usuariosData) {
        setUsuarios(usuariosData);

        // Calcular stats
        const hoje = new Date().toISOString().split('T')[0];
        setStats({
          totalUsuarios: usuariosData.length,
          usuariosAtivos: usuariosData.filter((u) => u.ativo).length,
          usuariosInativos: usuariosData.filter((u) => !u.ativo).length,
          acessosHoje: usuariosData.filter(
            (u) => u.ultimo_acesso && u.ultimo_acesso.startsWith(hoje)
          ).length,
        });
      }

      // Carregar roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .order('nivel', { ascending: false });

      if (rolesData) setRoles(rolesData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedUsuario(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);

      if (error) throw error;

      loadData();
    } catch (error: any) {
      alert('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handleResetPassword = async (usuario: Usuario) => {
    if (!confirm(`Resetar senha de ${usuario.nome}? Uma senha temporária será gerada.`)) return;

    try {
      const senhaTempor = Math.random().toString(36).slice(-8);
      
      const { error } = await supabase
        .from('usuarios')
        .update({
          senha_hash: `$2a$10$${senhaTempor}`,
          senha_temporaria: true,
        })
        .eq('id', usuario.id);

      if (error) throw error;

      alert(`Senha resetada com sucesso!\n\nSenha temporária: ${senhaTempor}\n\nO usuário deverá trocar a senha no próximo login.`);
      loadData();
    } catch (error: any) {
      alert('Erro ao resetar senha: ' + error.message);
    }
  };

  // Filtros
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchSearch =
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.cpf?.includes(searchTerm);

    const matchRole = !filterRole || usuario.role_id === filterRole;

    const matchStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'ativos' && usuario.ativo) ||
      (filterStatus === 'inativos' && !usuario.ativo);

    return matchSearch && matchRole && matchStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários e permissões de acesso</p>
        </div>
        <Button onClick={handleNew}>
          <Plus size={20} className="mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsuarios}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.usuariosAtivos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Inativos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.usuariosInativos}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Users className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acessos Hoje</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.acessosHoje}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as funções</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nome}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{usuario.nome}</div>
                        <div className="text-sm text-gray-500">{usuario.cpf || 'CPF não informado'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail size={14} />
                          {usuario.email}
                        </div>
                        {usuario.telefone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone size={14} />
                            {usuario.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.roles ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: usuario.roles.cor }}
                          />
                          <div className="font-medium text-gray-900">{usuario.roles.nome}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem função</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(usuario.ultimo_acesso)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={usuario.ativo ? 'success' : 'default'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(usuario)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Resetar senha"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo */}
      <div className="text-sm text-gray-500 text-center">
        Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
      </div>

      {/* Modal */}
      <UsuarioModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUsuario(null);
        }}
        onSuccess={loadData}
        usuario={selectedUsuario}
      />
    </div>
  );
}
