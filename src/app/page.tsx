import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { BrandMark, Card } from '@/components/ui';

const steps = [
  {
    number: '01',
    title: 'Escolha seu atendimento',
    description: 'Encontre o serviço e o profissional que combinam com o seu momento.',
    icon: Sparkles,
  },
  {
    number: '02',
    title: 'Encontre o melhor horário',
    description: 'Consulte a disponibilidade e escolha a opção mais conveniente para você.',
    icon: CalendarDays,
  },
  {
    number: '03',
    title: 'Confirme em instantes',
    description: 'Informe seus dados e receba os detalhes do agendamento pelo WhatsApp.',
    icon: UserRoundCheck,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-neutral-950">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Página inicial do Dimas Dona Concept">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="#como-funciona" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-white/70 hover:text-neutral-950 sm:inline-flex">
              Como funciona
            </Link>
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-white/70 hover:text-neutral-950">
              Acessar sistema
            </Link>
            <Link href="/agendar" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary-800 px-4 py-2 text-sm font-semibold text-white shadow-card transition-all hover:bg-primary-900 hover:shadow-luxury">
              Agendar <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="surface-grid absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="absolute -right-28 top-8 h-96 w-96 rounded-full bg-accent-200/35 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:py-32">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Seu tempo, do seu jeito
              </div>
              <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-primary-950 sm:text-6xl lg:text-7xl">
                Cuidado que começa antes de você chegar.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">
                Escolha seu serviço, profissional e horário em uma experiência de agendamento simples, segura e feita para caber na sua rotina.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/agendar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent-600 px-6 py-3 font-semibold text-white shadow-luxury transition-all hover:-translate-y-0.5 hover:bg-accent-700 hover:shadow-luxury-hover">
                  Fazer meu agendamento <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-primary-200 bg-white/75 px-6 py-3 font-semibold text-primary-800 shadow-card transition-colors hover:border-primary-300 hover:bg-white">
                  Ver como funciona
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-700" /> Disponibilidade atualizada</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Confirmação segura</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              <div className="absolute -inset-5 rotate-3 rounded-[2.5rem] bg-primary-800/8" aria-hidden="true" />
              <Card padding="none" className="relative overflow-hidden rounded-[2rem] border-white/80 bg-white/90 p-5 shadow-soft sm:p-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Próximo passo</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Seu momento de cuidado</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow-card"><Sparkles className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs text-neutral-500">1. Atendimento</p>
                        <p className="mt-0.5 font-semibold text-neutral-900">Escolha seu serviço</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <Clock3 className="mb-3 h-5 w-5 text-accent-700" />
                      <p className="text-xs text-neutral-500">Horário</p>
                      <p className="mt-0.5 text-sm font-semibold">Você escolhe</p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <MapPin className="mb-3 h-5 w-5 text-accent-700" />
                      <p className="text-xs text-neutral-500">Unidade</p>
                      <p className="mt-0.5 text-sm font-semibold">Mais conveniente</p>
                    </div>
                  </div>
                </div>
                <Link href="/agendar" className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-800 px-5 font-semibold text-white transition-colors hover:bg-primary-900">
                  Começar agora <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-neutral-200/70 bg-white/55 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">Simples do início ao fim</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.045em] text-primary-950 sm:text-5xl">Três passos. Um horário reservado para você.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map(({ number, title, description, icon: Icon }) => (
                <article key={number} className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-800 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-[0.18em] text-neutral-400">{number}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-semibold tracking-[-0.025em] text-neutral-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary-950 px-6 py-12 text-white shadow-soft sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Quando for melhor para você</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Seu próximo cuidado está a poucos cliques.</h2>
              <p className="mt-4 text-base leading-7 text-white/65">Consulte as opções disponíveis e monte seu agendamento no seu ritmo.</p>
            </div>
            <Link href="/agendar" className="mt-8 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 font-semibold text-white transition-colors hover:bg-accent-400 lg:mt-0">
              Ver horários <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white/60 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark size="sm" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-neutral-600" aria-label="Links do rodapé">
            <Link href="/agendar" className="hover:text-primary-800">Agendamento online</Link>
            <Link href="/login" className="hover:text-primary-800">Acesso da equipe</Link>
            <Link href="/profissionais" className="hover:text-primary-800">Área profissional</Link>
          </nav>
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Dimas Dona Concept</p>
        </div>
      </footer>
    </div>
  );
}
