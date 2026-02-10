'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Phone, Star, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Otimiza Beauty</h1>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent-500 via-accent-600 to-primary-700 text-neutral-900 py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900">
            Beleza que se Agenda Online
          </h2>
          <p className="text-xl text-neutral-800 mb-8">
            Agende seu horário de forma rápida e fácil. Escolha o profissional, serviço e horário ideal para você.
          </p>
          <Link href="/agendar">
            <Button variant="primary" size="lg" className="text-lg px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white">
              Agendar Agora
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-neutral-900 mb-12">
            Como Funciona
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">1. Escolha a Unidade</h4>
              <p className="text-neutral-600 text-sm">Selecione o salão mais próximo de você</p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-accent-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">2. Selecione o Profissional</h4>
              <p className="text-neutral-600 text-sm">Veja avaliações e escolha seu favorito</p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">3. Escolha Data e Hora</h4>
              <p className="text-neutral-600 text-sm">Horários disponíveis em tempo real</p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">4. Confirmação Instantânea</h4>
              <p className="text-neutral-600 text-sm">Receba confirmação por WhatsApp</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-100 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-neutral-900 mb-4">
            Pronto para sua Transformação?
          </h3>
          <p className="text-lg text-neutral-600 mb-8">
            Agende agora mesmo e garanta seu horário com os melhores profissionais.
          </p>
          <Link href="/agendar">
            <Button variant="primary" size="lg" className="text-lg px-8">
              Fazer Agendamento
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Otimiza Beauty Manager</h4>
              <p className="text-neutral-400 text-sm">
                Sistema completo de gestão e agendamento para salões de beleza.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contato</h4>
              <div className="space-y-2 text-sm text-neutral-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>(11) 98765-4321</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Rua das Flores, 123 - Centro</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
              <div className="space-y-2 text-sm text-neutral-400">
                <Link href="/agendar" className="block hover:text-white transition-colors">
                  Agendar Online
                </Link>
                <Link href="/login" className="block hover:text-white transition-colors">
                  Área do Cliente
                </Link>
                <Link href="/profissionais" className="block hover:text-white transition-colors">
                  Área do Profissional
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-neutral-500">
            © 2026 Otimiza Beauty Manager. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
