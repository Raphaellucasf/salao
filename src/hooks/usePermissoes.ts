'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PermissoesModulo {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface PermissoesEspeciais {
  pode_abrir_caixa: boolean;
  pode_fechar_caixa: boolean;
  pode_dar_desconto: boolean;
  desconto_maximo_percentual: number;
  pode_cancelar_venda: boolean;
  pode_editar_comissao: boolean;
  pode_acessar_todos_profissionais: boolean;
}

interface PermissoesCompletas extends PermissoesEspeciais {
  agenda: PermissoesModulo;
  clientes: PermissoesModulo;
  profissionais: PermissoesModulo;
  produtos: PermissoesModulo;
  servicos: PermissoesModulo;
  financeiro: PermissoesModulo;
  relatorios: PermissoesModulo;
  configuracoes: PermissoesModulo;
  usuarios: PermissoesModulo;
}

const PERMISSOES_ADMIN: PermissoesCompletas = {
  agenda:        { visualizar: true, criar: true, editar: true, excluir: true },
  clientes:      { visualizar: true, criar: true, editar: true, excluir: true },
  profissionais: { visualizar: true, criar: true, editar: true, excluir: true },
  produtos:      { visualizar: true, criar: true, editar: true, excluir: true },
  servicos:      { visualizar: true, criar: true, editar: true, excluir: true },
  financeiro:    { visualizar: true, criar: true, editar: true, excluir: true },
  relatorios:    { visualizar: true, criar: true, editar: true, excluir: true },
  configuracoes: { visualizar: true, criar: true, editar: true, excluir: true },
  usuarios:      { visualizar: true, criar: true, editar: true, excluir: true },
  pode_abrir_caixa: true,
  pode_fechar_caixa: true,
  pode_dar_desconto: true,
  desconto_maximo_percentual: 100,
  pode_cancelar_venda: true,
  pode_editar_comissao: true,
  pode_acessar_todos_profissionais: true,
};

const PERMISSOES_VAZIO: PermissoesCompletas = {
  agenda:        { visualizar: false, criar: false, editar: false, excluir: false },
  clientes:      { visualizar: false, criar: false, editar: false, excluir: false },
  profissionais: { visualizar: false, criar: false, editar: false, excluir: false },
  produtos:      { visualizar: false, criar: false, editar: false, excluir: false },
  servicos:      { visualizar: false, criar: false, editar: false, excluir: false },
  financeiro:    { visualizar: false, criar: false, editar: false, excluir: false },
  relatorios:    { visualizar: false, criar: false, editar: false, excluir: false },
  configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
  usuarios:      { visualizar: false, criar: false, editar: false, excluir: false },
  pode_abrir_caixa: false,
  pode_fechar_caixa: false,
  pode_dar_desconto: false,
  desconto_maximo_percentual: 0,
  pode_cancelar_venda: false,
  pode_editar_comissao: false,
  pode_acessar_todos_profissionais: false,
};

function buildModuloPermissao(
  rolePermissao: any,
  customPermissao: any
): PermissoesModulo {
  const base: PermissoesModulo = {
    visualizar: rolePermissao?.visualizar ?? false,
    criar:      rolePermissao?.criar      ?? false,
    editar:     rolePermissao?.editar     ?? false,
    excluir:    rolePermissao?.excluir    ?? false,
  };
  if (!customPermissao) return base;
  return {
    visualizar: customPermissao.visualizar ?? base.visualizar,
    criar:      customPermissao.criar      ?? base.criar,
    editar:     customPermissao.editar     ?? base.editar,
    excluir:    customPermissao.excluir    ?? base.excluir,
  };
}

export function usePermissoes() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissoesCompletas | null>(null);
  const [loading, setLoading] = useState(true);
  const [nomeRole, setNomeRole] = useState<string>('');

  const loadPermissoes = useCallback(async () => {
    if (!user) { setPermissoes(null); setLoading(false); return; }

    // Admin tem acesso total — sem necessidade de consultar o banco
    if (isAdmin) {
      setPermissoes(PERMISSOES_ADMIN);
      setNomeRole('Administrador');
      setLoading(false);
      return;
    }

    try {
      // Busca o registro do usuário com a role associada
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          permissoes_customizadas,
          roles (
            nome,
            permissoes_agenda,
            permissoes_clientes,
            permissoes_profissionais,
            permissoes_produtos,
            permissoes_servicos,
            permissoes_financeiro,
            permissoes_relatorios,
            permissoes_configuracoes,
            permissoes_usuarios,
            pode_abrir_caixa,
            pode_fechar_caixa,
            pode_dar_desconto,
            desconto_maximo_percentual,
            pode_cancelar_venda,
            pode_editar_comissao,
            pode_acessar_todos_profissionais
          )
        `)
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error || !data) {
        // Se não encontrou registro, dá permissões mínimas
        setPermissoes(PERMISSOES_VAZIO);
        setLoading(false);
        return;
      }

      const role = data.roles as any;
      const custom = data.permissoes_customizadas as any;

      setNomeRole(role?.nome ?? 'Usuário');

      const moduloKeys = [
        'agenda', 'clientes', 'profissionais', 'produtos',
        'servicos', 'financeiro', 'relatorios', 'configuracoes', 'usuarios',
      ] as const;

      const perms = {} as any;
      for (const mod of moduloKeys) {
        perms[mod] = buildModuloPermissao(
          role?.[`permissoes_${mod}`],
          custom?.[`permissoes_${mod}`]
        );
      }

      // Permissões especiais (não customizáveis por usuário, só via role)
      perms.pode_abrir_caixa                = role?.pode_abrir_caixa                ?? false;
      perms.pode_fechar_caixa               = role?.pode_fechar_caixa               ?? false;
      perms.pode_dar_desconto               = role?.pode_dar_desconto               ?? false;
      perms.desconto_maximo_percentual      = role?.desconto_maximo_percentual       ?? 0;
      perms.pode_cancelar_venda             = role?.pode_cancelar_venda             ?? false;
      perms.pode_editar_comissao            = role?.pode_editar_comissao            ?? false;
      perms.pode_acessar_todos_profissionais = role?.pode_acessar_todos_profissionais ?? false;

      setPermissoes(perms as PermissoesCompletas);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setPermissoes(PERMISSOES_VAZIO);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!authLoading) loadPermissoes();
  }, [authLoading, loadPermissoes]);

  /**
   * Verifica se o usuário pode acessar um módulo com determinada ação.
   * @param modulo - ex: 'financeiro', 'clientes'
   * @param acao   - ex: 'visualizar', 'criar', 'editar', 'excluir'
   */
  const podeAcessar = useCallback(
    (modulo: keyof Omit<PermissoesCompletas, keyof PermissoesEspeciais>, acao: keyof PermissoesModulo = 'visualizar'): boolean => {
      if (isAdmin) return true;
      if (!permissoes) return false;
      return permissoes[modulo]?.[acao] ?? false;
    },
    [isAdmin, permissoes]
  );

  return {
    permissoes,
    loading: loading || authLoading,
    nomeRole,
    podeAcessar,
    isAdmin,
  };
}
