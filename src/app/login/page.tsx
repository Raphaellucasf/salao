'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Input } from '@/components/ui';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('=== INÍCIO DO LOGIN ===');
    console.log('Email:', email);

    // Validações básicas
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, digite um email válido');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Chamando signIn...');
      const { error: signInError } = await signIn(email, password);

      console.log('Resultado do signIn:', { error: signInError });

      if (signInError) {
        console.error('Login error:', signInError);
        
        // Mensagens de erro amigáveis
        if (signInError.message?.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Tente novamente.');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          setError(`Erro: ${signInError.message || 'Tente novamente mais tarde.'}`);
        }
        setIsLoading(false);
      } else {
        console.log('Login bem-sucedido! Aguardando redirecionamento...');
        // Não desabilitar loading - será redirecionado
      }
    } catch (err) {
      console.error('Exceção no handleSubmit:', err);
      setError('Erro inesperado ao fazer login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl mb-4">
            <span className="text-white font-bold text-3xl">O</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Bem-vindo de Volta
          </h1>
          <p className="text-neutral-600">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Card de Login */}
        <Card padding="lg" className="shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Campo Email */}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />

            {/* Campo Senha */}
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Link Esqueci Senha */}
            <div className="text-right">
              <Link 
                href="/recuperar-senha" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        {/* Link para Agendamento Público */}
        <div className="mt-6 text-center">
          <p className="text-neutral-600 text-sm mb-3">
            Não tem uma conta?
          </p>
          <Link href="/agendar">
            <Button variant="outline" className="w-full">
              Fazer Agendamento
            </Button>
          </Link>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            © 2026 Otimiza Beauty Manager
          </p>
        </div>
      </div>
    </div>
  );
}
