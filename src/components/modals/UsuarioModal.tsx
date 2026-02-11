// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { X, User, Shield, Settings, Eye, EyeOff } from 'lucide-react';

interface Role {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  nivel: number;
  permissoes_agenda: any;
  permissoes_clientes: any;
  permissoes_profissionais: any;
  permissoes_produtos: any;
  permissoes_servicos: any;
  permissoes_financeiro: any;
  permissoes_relatorios: any;
  permissoes_configuracoes: any;
  permissoes_usuarios: any;
  pode_abrir_caixa: boolean;
  pode_fechar_caixa: boolean;
  pode_dar_desconto: boolean;
  desconto_maximo_percentual: number;
  pode_cancelar_venda: boolean;
  pode_editar_comissao: boolean;
  pode_acessar_todos_profissionais: boolean;
}

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuario?: any;
}

export default function UsuarioModal({ isOpen, onClose, onSuccess, usuario }: UsuarioModalProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'permissoes' | 'configuracoes'>('dados');
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Dados Pessoais
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaTemporaria, setSenhaTemporaria] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  
  // Permissões
  const [roleId, setRoleId] = useState('');
  const [permissoesCustomizadas, setPermissoesCustomizadas] = useState<any>(null);
  
  // Configurações
  const [ativo, setAtivo] = useState(true);
  const [tema, setTema] = useState('light');
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesSistema, setNotificacoesSistema] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      
      if (usuario) {
        setNome(usuario.nome || '');
        setEmail(usuario.email || '');
        setTelefone(usuario.telefone || '');
        setCpf(usuario.cpf || '');
        setDataNascimento(usuario.data_nascimento || '');
        setObservacoes(usuario.observacoes || '');
        setRoleId(usuario.role_id || '');
        setPermissoesCustomizadas(usuario.permissoes_customizadas || null);
        setAtivo(usuario.ativo ?? true);
        setTema(usuario.tema || 'light');
        setNotificacoesEmail(usuario.notificacoes_email ?? true);
        setNotificacoesPush(usuario.notificacoes_push ?? true);
        setNotificacoesSistema(usuario.notificacoes_sistema ?? true);
        setSenhaTemporaria(usuario.senha_temporaria ?? false);
      } else {
        resetForm();
      }
    }
  }, [isOpen, usuario]);

  const loadRoles = async () => {
    const { data } = await supabase
      .from('roles')
      .select('*')
      .eq('ativo', true)
      .order('nivel', { ascending: false });
    
    if (data) setRoles(data);
  };

  const resetForm = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setCpf('');
    setDataNascimento('');
    setSenha('');
    setObservacoes('');
    setRoleId('');
    setPermissoesCustomizadas(null);
    setAtivo(true);
    setTema('light');
    setNotificacoesEmail(true);
    setNotificacoesPush(true);
    setNotificacoesSistema(true);
    setSenhaTemporaria(false);
    setActiveTab('dados');
  };

  const handleSubmit = async () => {
    if (!nome || !email || !roleId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (!usuario && !senha) {
      alert('Senha é obrigatória para novo usuário');
      return;
    }

    setLoading(true);

    try {
      const usuarioData = {
        nome,
        email,
        telefone,
        cpf,
        data_nascimento: dataNascimento || null,
        role_id: roleId,
        permissoes_customizadas: permissoesCustomizadas,
        ativo,
        tema,
        notificacoes_email: notificacoesEmail,
        notificacoes_push: notificacoesPush,
        notificacoes_sistema: notificacoesSistema,
        senha_temporaria: senhaTemporaria,
        observacoes,
        ...(senha && { senha_hash: `$2a$10$${senha}` }), // Hash simplificado para demo
      };

      if (usuario) {
        const { error } = await supabase
          .from('usuarios')
          .update(usuarioData)
          .eq('id', usuario.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('usuarios')
          .insert([{ ...usuarioData, primeiro_acesso: true }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermissaoModulo = (modulo: string, acao: string, valor: boolean) => {
    setPermissoesCustomizadas((prev: any) => ({
      ...prev,
      [`permissoes_${modulo}`]: {
        ...(prev?.[`permissoes_${modulo}`] || {}),
        [acao]: valor,
      },
    }));
  };

  const getPermissaoAtual = (modulo: string, acao: string): boolean => {
    // Primeiro verifica customizada, depois role padrão
    if (permissoesCustomizadas?.[`permissoes_${modulo}`]?.[acao] !== undefined) {
      return permissoesCustomizadas[`permissoes_${modulo}`][acao];
    }
    
    const role = roles.find(r => r.id === roleId);
    if (!role) return false;
    
    const permissoesModulo = (role as any)[`permissoes_${modulo}`];
    return permissoesModulo?.[acao] || false;
  };

  const modulos = [
    { key: 'agenda', label: 'Agenda' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'profissionais', label: 'Profissionais' },
    { key: 'produtos', label: 'Produtos' },
    { key: 'servicos', label: 'Serviços' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'relatorios', label: 'Relatórios' },
    { key: 'configuracoes', label: 'Configurações' },
    { key: 'usuarios', label: 'Usuários' },
  ];

  const acoes = [
    { key: 'visualizar', label: 'Visualizar', color: 'bg-blue-50 text-blue-700' },
    { key: 'criar', label: 'Criar', color: 'bg-green-50 text-green-700' },
    { key: 'editar', label: 'Editar', color: 'bg-yellow-50 text-yellow-700' },
    { key: 'excluir', label: 'Excluir', color: 'bg-red-50 text-red-700' },
  ];

  const roleAtual = roles.find(r => r.id === roleId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {usuario ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'dados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={18} />
            <span>Dados Pessoais</span>
          </button>
          <button
            onClick={() => setActiveTab('permissoes')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'permissoes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={18} />
            <span>Permissões</span>
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'configuracoes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {/* Tab: Dados Pessoais */}
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Nome Completo*"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>

              <Input
                label="E-mail*"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />

              <Input
                label="Telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />

              <Input
                label="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />

              <Input
                label="Data de Nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label={usuario ? "Nova Senha (deixe vazio para manter)" : "Senha*"}
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={senhaTemporaria}
                      onChange={(e) => setSenhaTemporaria(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Senha temporária (forçar troca no login)</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações sobre o usuário..."
              />
            </div>
          </div>
        )}

        {/* Tab: Permissões */}
        {activeTab === 'permissoes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função/Perfil*
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma função</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nome} - {role.descricao}
                  </option>
                ))}
              </select>
              
              {roleAtual && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: roleAtual.cor }}
                    />
                    <span className="text-sm text-gray-600">
                      Nível {roleAtual.nivel} - {roleAtual.descricao}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {roleId && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Permissões por Módulo
                    <span className="text-xs text-gray-500 ml-2">
                      (personalize apenas se necessário)
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 pb-2">
                      <div>Módulo</div>
                      {acoes.map((acao) => (
                        <div key={acao.key} className="text-center">{acao.label}</div>
                      ))}
                    </div>

                    {/* Permissões Grid */}
                    {modulos.map((modulo) => (
                      <div key={modulo.key} className="grid grid-cols-5 gap-2 items-center py-2 border-t">
                        <div className="text-sm font-medium text-gray-700">
                          {modulo.label}
                        </div>
                        {acoes.map((acao) => {
                          const temPermissao = getPermissaoAtual(modulo.key, acao.key);
                          return (
                            <div key={acao.key} className="flex justify-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={temPermissao}
                                  onChange={(e) => togglePermissaoModulo(modulo.key, acao.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className={`w-8 h-4 rounded-full peer peer-checked:bg-blue-600 bg-gray-200 transition-colors`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4`}></div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissões Especiais */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Permissões Especiais</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium text-yellow-800">⚠️ Herdado da função {roleAtual?.nome}:</p>
                    <ul className="space-y-1 text-yellow-700">
                      {roleAtual?.pode_abrir_caixa && <li>✓ Pode abrir caixa</li>}
                      {roleAtual?.pode_fechar_caixa && <li>✓ Pode fechar caixa</li>}
                      {roleAtual?.pode_dar_desconto && <li>✓ Pode dar desconto até {roleAtual.desconto_maximo_percentual}%</li>}
                      {roleAtual?.pode_cancelar_venda && <li>✓ Pode cancelar vendas</li>}
                      {roleAtual?.pode_editar_comissao && <li>✓ Pode editar comissões</li>}
                      {roleAtual?.pode_acessar_todos_profissionais && <li>✓ Acessa agenda de todos os profissionais</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Configurações */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Usuários inativos não podem fazer login no sistema
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Preferências</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tema</label>
                <select
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Notificações</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoesEmail}
                    onChange={(e) => setNotificacoesEmail(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notificações por E-mail</span>
                    <p className="text-xs text-gray-500">Receber notificações importantes por e-mail</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoesPush}
                    onChange={(e) => setNotificacoesPush(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notificações Push</span>
                    <p className="text-xs text-gray-500">Receber notificações no navegador</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoesSistema}
                    onChange={(e) => setNotificacoesSistema(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notificações do Sistema</span>
                    <p className="text-xs text-gray-500">Alertas e avisos dentro do sistema</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : usuario ? 'Salvar Alterações' : 'Criar Usuário'}
        </Button>
      </div>
    </Modal>
  );
}

