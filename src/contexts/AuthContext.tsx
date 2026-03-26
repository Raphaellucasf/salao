'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'professional' | 'client' | null;

interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
  full_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isProfessional: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [role, setRole]     = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router  = useRouter();

  /**
   * Busca a role real do usuário na tabela `public.users`.
   * Fallback para user_metadata se a tabela não existir ou não tiver a linha.
   * Segundo fallback: 'admin' se email terminar com domínio administrativo.
   */
  const fetchUserRole = async (
    userId: string,
    userMetadata?: any,
    userEmail?: string
  ): Promise<{ role: UserRole; full_name?: string }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const row = data as { role: string; full_name: string };
        return { role: row.role as UserRole, full_name: row.full_name };
      }
    } catch {
      // Tabela pode não existir ainda — continua para fallback
    }

    // Fallback 1: role definida no user_metadata (definida no signUp ou via SQL)
    const metaRole = userMetadata?.role as UserRole;
    if (metaRole === 'admin' || metaRole === 'professional' || metaRole === 'client') {
      return { role: metaRole, full_name: userMetadata?.full_name };
    }

    // Fallback 2: default para client
    return {
      role: 'client',
      full_name: userMetadata?.full_name ?? userEmail,
    };
  };

  /** Redireciona para o dashboard correto baseado na role */
  const redirectByRole = (userRole: UserRole) => {
    if (userRole === 'admin')             window.location.replace('/admin');
    else if (userRole === 'professional') window.location.replace('/admin/agenda');
    else                                  window.location.replace('/');
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) { setLoading(false); return; }

        if (session?.user) {
          // Usa role do user_metadata imediatamente (sem esperar DB)
          // para não bloquear a renderização
          const metaRole = (session.user.user_metadata?.role as UserRole) ?? 'client';
          setUser({
            id:        session.user.id,
            email:     session.user.email,
            role:      metaRole,
            full_name: session.user.user_metadata?.full_name ?? session.user.email,
          });
          setRole(metaRole);
          setLoading(false);

          // Em background, verifica a tabela DB para atualizar se necessário
          fetchUserRole(session.user.id, session.user.user_metadata, session.user.email)
            .then(({ role: dbRole, full_name }) => {
              if (dbRole !== metaRole) {
                setRole(dbRole);
                setUser(prev => prev ? { ...prev, role: dbRole, full_name: full_name ?? prev.full_name } : prev);
              }
            });
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Só limpa o usuário no logout explícito — token refresh e reconexões
        // não devem desmontar o contexto e causar tela em branco
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        // Ignora eventos sem sessão que não sejam logout (ex: reconexão WS)
        if (!session?.user) {
          setLoading(false);
          return;
        }

        const { role: userRole, full_name } = await fetchUserRole(
          session.user.id,
          session.user.user_metadata,
          session.user.email
        );
        setUser({
          id:        session.user.id,
          email:     session.user.email,
          role:      userRole,
          full_name: full_name ?? session.user.user_metadata?.full_name,
        });
        setRole(userRole);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      if (data?.user) {
        const { role: userRole, full_name } = await fetchUserRole(
          data.user.id,
          data.user.user_metadata,
          data.user.email
        );
        setUser({
          id:        data.user.id,
          email:     data.user.email,
          role:      userRole,
          full_name: full_name ?? data.user.user_metadata?.full_name ?? data.user.email,
        });
        setRole(userRole);
        setTimeout(() => redirectByRole(userRole), 100);
        return { error: null };
      }

      return { error: { message: 'Nenhum usuário retornado' } };
    } catch (err: any) {
      return { error: { message: err?.message ?? 'Erro desconhecido' } };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'client'
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      return { error: error ?? null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      signIn, signUp, signOut,
      isAdmin:        role === 'admin',
      isProfessional: role === 'professional',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
