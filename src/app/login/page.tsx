'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BrandMark, Button, Card, Input } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Preencha seu e-mail e sua senha para continuar.');
      return;
    }
    if (!email.includes('@')) {
      setError('Digite um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        if (signInError.message?.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Confira os dados e tente novamente.');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
        } else {
          setError(signInError.message || 'Não foi possível entrar agora. Tente novamente.');
        }
        setIsLoading(false);
      }
    } catch {
      setError('Não foi possível conectar ao sistema. Tente novamente em instantes.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      <div className="surface-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 shadow-soft backdrop-blur-sm sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden flex-col justify-between bg-primary-950 p-10 text-white lg:flex xl:p-14">
          <BrandMark inverse />
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Gestão com clareza</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em]">Tudo que sua equipe precisa, no mesmo ritmo.</h1>
            <p className="mt-6 text-lg leading-8 text-white/60">Agenda, clientes e operação em uma experiência focada no que importa durante o atendimento.</p>
            <ul className="mt-9 space-y-4 text-sm text-white/75">
              <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-accent-300" /> Visão diária organizada</li>
              <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-accent-300" /> Atalhos para as tarefas frequentes</li>
              <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-accent-300" /> Acesso protegido por perfil</li>
            </ul>
          </div>
          <p className="text-xs text-white/35">Dimas Dona Concept · Área restrita</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <BrandMark size="sm" />
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-white hover:text-neutral-950">
                <ArrowLeft className="h-4 w-4" /> Início
              </Link>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">Área da equipe</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-neutral-950 sm:text-4xl">Que bom ter você aqui.</h2>
              <p className="mt-3 leading-7 text-neutral-600">Entre com suas credenciais para acessar o painel.</p>
            </div>

            <Card padding="none" className="mt-8 border-neutral-200/70 bg-white/90 p-5 shadow-card sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {error && (
                  <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                    <p className="text-sm leading-5 text-red-800">{error}</p>
                  </div>
                )}
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  inputMode="email"
                  required
                />
                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-8 flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs leading-5 text-neutral-500">Para redefinir seu acesso, solicite uma nova senha ao administrador do sistema.</p>
                <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                  {isLoading ? 'Entrando…' : 'Entrar no sistema'}
                </Button>
              </form>
            </Card>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
              <Link href="/" className="hidden items-center gap-2 font-medium text-neutral-600 hover:text-primary-800 lg:inline-flex"><ArrowLeft className="h-4 w-4" /> Voltar ao início</Link>
              <Link href="/agendar" className="font-semibold text-accent-700 hover:text-accent-800">Fazer agendamento público</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
