'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Star, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';

type Step = 1 | 2 | 3 | 4 | 5;

interface Unit {
  id: string;
  name: string;
  address: string;
  image: string;
}

interface Professional {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  specialty: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

// Mock Data
const mockUnits: Unit[] = [
  { id: '1', name: 'Otimiza Beauty - Centro', address: 'Rua das Flores, 123', image: '/unit1.jpg' },
  { id: '2', name: 'Otimiza Beauty - Shopping', address: 'Shopping Center, Piso 2', image: '/unit2.jpg' },
];

const mockProfessionals: Professional[] = [
  { id: '1', name: 'Ana Silva', rating: 4.9, avatar: '/avatar1.jpg', specialty: 'Coloração Especialista' },
  { id: '2', name: 'Carlos Santos', rating: 5.0, avatar: '/avatar2.jpg', specialty: 'Cortes Masculinos' },
  { id: '3', name: 'Juliana Costa', rating: 4.8, avatar: '/avatar3.jpg', specialty: 'Design de Sobrancelhas' },
];

const mockServices: Service[] = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80, category: 'Cabelo' },
  { id: '2', name: 'Corte Masculino', duration: 30, price: 45, category: 'Cabelo' },
  { id: '3', name: 'Coloração Completa', duration: 180, price: 250, category: 'Cabelo' },
  { id: '4', name: 'Hidratação', duration: 90, price: 120, category: 'Cabelo' },
  { id: '5', name: 'Design de Sobrancelhas', duration: 30, price: 40, category: 'Estética' },
  { id: '6', name: 'Manicure', duration: 45, price: 35, category: 'Unhas' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

export default function AgendarPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedUnit !== null;
      case 2: return selectedProfessional !== null;
      case 3: return selectedService !== null;
      case 4: return selectedDate !== '' && selectedTime !== '';
      case 5: return clientName !== '' && clientPhone !== '';
      default: return false;
    }
  };

  const handleConfirm = () => {
    // Aqui você faria a chamada à API para confirmar o agendamento
    alert('Agendamento confirmado! Em produção, isso enviaria dados ao backend.');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Novo Agendamento</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-neutral-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step < currentStep ? 'bg-primary-600 text-white' :
                  step === currentStep ? 'bg-primary-600 text-white' :
                  'bg-neutral-200 text-neutral-500'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary-600' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Step 1: Select Unit */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha a Unidade</h2>
              <p className="text-neutral-600">Selecione o salão mais próximo de você</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {mockUnits.map((unit) => (
                <Card
                  key={unit.id}
                  hover
                  padding="none"
                  className={`cursor-pointer transition-all ${
                    selectedUnit?.id === unit.id ? 'ring-2 ring-primary-600' : ''
                  }`}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-t-2xl flex items-center justify-center">
                    <span className="text-white text-6xl font-bold opacity-20">🏢</span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{unit.name}</h3>
                    <div className="flex items-start space-x-2 text-neutral-600 text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{unit.address}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Professional */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha o Profissional</h2>
              <p className="text-neutral-600">Selecione o profissional de sua preferência</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {mockProfessionals.map((professional) => (
                <Card
                  key={professional.id}
                  hover
                  padding="lg"
                  className={`cursor-pointer transition-all text-center ${
                    selectedProfessional?.id === professional.id ? 'ring-2 ring-primary-600' : ''
                  }`}
                  onClick={() => setSelectedProfessional(professional)}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-4xl">👤</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{professional.name}</h3>
                  <p className="text-sm text-neutral-600 mb-3">{professional.specialty}</p>
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{professional.rating}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Service */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha o Serviço</h2>
              <p className="text-neutral-600">Selecione o serviço desejado</p>
            </div>
            <div className="space-y-3">
              {mockServices.map((service) => (
                <Card
                  key={service.id}
                  hover
                  padding="md"
                  className={`cursor-pointer transition-all ${
                    selectedService?.id === service.id ? 'ring-2 ring-primary-600' : ''
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <Badge variant="info">{service.category}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">R$ {service.price}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Select Date & Time */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha Data e Horário</h2>
              <p className="text-neutral-600">Selecione o melhor dia e hora para você</p>
            </div>
            
            <Card padding="lg">
              <h3 className="font-semibold text-lg mb-4">Data</h3>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </Card>

            {selectedDate && (
              <Card padding="lg">
                <h3 className="font-semibold text-lg mb-4">Horários Disponíveis</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        selectedTime === time
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Confirme seus Dados</h2>
              <p className="text-neutral-600">Revise as informações do agendamento</p>
            </div>

            <Card padding="lg">
              <h3 className="font-semibold text-lg mb-4">Resumo do Agendamento</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600">Unidade</p>
                  <p className="font-semibold">{selectedUnit?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Profissional</p>
                  <p className="font-semibold">{selectedProfessional?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Serviço</p>
                  <p className="font-semibold">{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Data e Horário</p>
                  <p className="font-semibold">{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600">Valor Total</p>
                  <p className="text-3xl font-bold text-primary-600">R$ {selectedService?.price}</p>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="font-semibold text-lg mb-4">Seus Dados</h3>
              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
                <Input
                  label="WhatsApp"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  helperText="Você receberá a confirmação por WhatsApp"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < 5 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleConfirm}
              disabled={!canProceed()}
              size="lg"
            >
              Confirmar Agendamento
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
