'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  // Função para buscar role do usuário
  const fetchUserRole = async (userId: string, userMetadata?: any): Promise<{ role: UserRole; full_name?: string }> => {
    // FORÇAR ADMIN PARA DESENVOLVIMENTO
    console.log('🔐 Forçando role ADMIN para desenvolvimento');
    return {
      role: 'admin',
      full_name: userMetadata?.full_name || undefined
    };
  };

  // Carregar usuário ao montar o componente
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔄 Carregando sessão do usuário...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erro ao buscar sessão:', sessionError);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.email);
          try {
            const { role: userRole, full_name } = await fetchUserRole(
              session.user.id, 
              session.user.user_metadata
            );
            console.log('✅ Role obtida:', userRole);
            setUser({ 
              id: session.user.id, 
              email: session.user.email, 
              role: userRole, 
              full_name: full_name || session.user.user_metadata?.full_name
            });
            setRole(userRole);
          } catch (roleError) {
            console.error('❌ Erro ao buscar role:', roleError);
            // Mesmo com erro, define usuário com role default
            setUser({ 
              id: session.user.id, 
              email: session.user.email, 
              role: 'admin', // Força admin em caso de erro
              full_name: session.user.user_metadata?.full_name
            });
            setRole('admin');
          }
        } else {
          console.log('ℹ️ Nenhuma sessão encontrada');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { role: userRole, full_name } = await fetchUserRole(
            session.user.id,
            session.user.user_metadata
          );
          setUser({ 
            id: session.user.id, 
            email: session.user.email, 
            role: userRole, 
            full_name: full_name || session.user.user_metadata?.full_name
          });
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('=== INÍCIO signIn ===');
    console.log('Email:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('=== RESPOSTA Supabase ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('ERRO no login:', error);
        return { error };
      }

      if (data?.user) {
        console.log('✅ LOGIN OK! User ID:', data.user.id);
        
        // Forçar role admin sem buscar no banco
        const userRole = 'admin';
        setUser({ 
          id: data.user.id, 
          email: data.user.email, 
          role: userRole,
          full_name: data.user.user_metadata?.full_name || data.user.email
        });
        setRole(userRole);
        
        console.log('🔄 Redirecionando para /admin...');
        
        setTimeout(() => {
          window.location.replace('/admin');
        }, 100);
        
        return { error: null };
      }

      console.log('❌ Nenhum usuário retornado');
      return { error: { message: 'Nenhum usuário retornado' } };
    } catch (err: any) {
      console.error('EXCEÇÃO no signIn:', err);
      return { error: { message: err.message || 'Erro desconhecido' } };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string,
    role: UserRole = 'client'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) return { error };

      return { error: null };
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

  const value = {
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
    isProfessional: role === 'professional',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
