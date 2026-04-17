'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Star, Clock, Calendar as CalendarIcon, Check, AlertCircle } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4 | 5;

interface Unit {
  id: string;
  name?: string;
  nome?: string;
  address?: string;
  image?: string;
}

interface Professional {
  id: string;
  nome: string;
  foto_url?: string;
  specialty?: string;
  rating?: number;
}

interface Service {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
  categoria: string;
}

interface TimeSlot {
  hora_inicio: string;
  hora_fim: string;
  livre: boolean;
}

export default function AgendarPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // State from backend
  const [units, setUnits] = useState<Unit[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [isLoadingPros, setIsLoadingPros] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Step 1: units
  useEffect(() => {
    async function fetchUnits() {
      setIsLoadingUnits(true);
      const { data, error } = await supabase.from('units').select('*').eq('is_active', true);
      if (data) {
        setUnits(data as any[]);
      }
      setIsLoadingUnits(false);
    }
    fetchUnits();
  }, []);

  // Step 2: professionals
  useEffect(() => {
    async function fetchPros() {
      setIsLoadingPros(true);
      // Backend handover states: "filtro: ativo = true"
      const { data, error } = await supabase.from('profissionais').select('*').eq('ativo', true);
      if (data) {
        setProfessionals(data as any[]);
      }
      setIsLoadingPros(false);
    }
    if (selectedUnit) {
      fetchPros();
    }
  }, [selectedUnit]);

  // Step 3: services
  useEffect(() => {
    async function fetchServices() {
      setIsLoadingServices(true);
      const { data, error } = await supabase.from('servicos').select('*').eq('ativo', true);
      if (data) {
        setServices(data as any[]);
      }
      setIsLoadingServices(false);
    }
    fetchServices();
  }, []);

  // Step 4: Time slots
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedProfessional || !selectedDate || !selectedService) return;
      setIsLoadingSlots(true);
      
      // @ts-ignore: fn_horarios_vagos is not yet present in the generated types
      const { data, error } = await supabase.rpc('fn_horarios_vagos' as any, {
        profissional_id: selectedProfessional.id,
        data: selectedDate,
        duracao_minutos: selectedService.duracao_minutos
      });

      if (data) {
        setTimeSlots((data as any[]).filter((s: TimeSlot) => s.livre));
      } else {
        setTimeSlots([]);
      }
      setIsLoadingSlots(false);
    }
    fetchSlots();
  }, [selectedProfessional, selectedDate, selectedService]);

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

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: selectedProfessional?.id,
          service_id: selectedService?.id,
          appointment_date: selectedDate,
          start_time: selectedTime,
          client_name: clientName,
          client_phone: clientPhone
        })
      });

      if (!response.ok) {
        if (response.status === 400) setConfirmError("Preencha todos os campos obrigatórios.");
        else if (response.status === 404) setConfirmError("Serviço inválido.");
        else if (response.status === 409) setConfirmError("Esse horário acabou de ser ocupado. Escolha outro.");
        else setConfirmError("Erro ao confirmar. Tente novamente.");
      } else {
        toast.success('Agendamento confirmado! Você receberá a confirmação por WhatsApp.');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      }
    } catch (error) {
      setConfirmError("Erro na conexão ao confirmar. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Fallback somente para exibição — não usa ID falso;
  // o fluxo de booking não depende do unit_id no servidor
  const displayedUnits = units.length > 0 ? units : [
    { id: 'default-unit', name: 'Dimas Dona Concept', address: 'Unidade Principal' }
  ];

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
              <div className="w-10 h-10 bg-linear-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
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
            {isLoadingUnits ? (
              <div className="text-center py-8 opacity-50">Carregando unidades...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {displayedUnits.map((unit) => (
                  <Card
                    key={unit.id}
                    hover
                    padding="none"
                    className={`cursor-pointer transition-all ${
                      selectedUnit?.id === unit.id ? 'ring-2 ring-primary-600' : ''
                    }`}
                    onClick={() => setSelectedUnit(unit as Unit)}
                  >
                    <div className="h-48 bg-linear-to-br from-primary-400 to-primary-600 rounded-t-2xl flex items-center justify-center">
                      <span className="text-white text-6xl font-bold opacity-20">🏢</span>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{unit.name || unit.nome}</h3>
                      <div className="flex items-start space-x-2 text-neutral-600 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{unit.address || 'Endereço não disponível'}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Professional */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha o Profissional</h2>
              <p className="text-neutral-600">Selecione o profissional de sua preferência</p>
            </div>
            {isLoadingPros ? (
              <div className="text-center py-8 opacity-50">Carregando profissionais...</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {professionals.map((professional) => (
                  <Card
                    key={professional.id}
                    hover
                    padding="lg"
                    className={`cursor-pointer transition-all text-center ${
                      selectedProfessional?.id === professional.id ? 'ring-2 ring-primary-600' : ''
                    }`}
                    onClick={() => setSelectedProfessional(professional)}
                  >
                    <div className="w-24 h-24 bg-linear-to-br from-accent-400 to-accent-600 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                      {professional.foto_url ? (
                        <img src={professional.foto_url} alt={professional.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-4xl">👤</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{professional.nome}</h3>
                    {professional.specialty && (
                      <p className="text-sm text-neutral-600 mb-3">{professional.specialty}</p>
                    )}
                    {professional.rating && (
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{professional.rating}</span>
                      </div>
                    )}
                  </Card>
                ))}
                {professionals.length === 0 && !isLoadingPros && (
                  <div className="col-span-3 text-center py-8 text-neutral-500">Nenhum profissional encontrado.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Service */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Escolha o Serviço</h2>
              <p className="text-neutral-600">Selecione o serviço desejado</p>
            </div>
            {isLoadingServices ? (
              <div className="text-center py-8 opacity-50">Carregando serviços...</div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
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
                          <h3 className="font-semibold text-lg">{service.nome}</h3>
                          <Badge variant="info">{service.categoria || 'Serviço'}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duracao_minutos} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">R$ {service.preco}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {services.length === 0 && !isLoadingServices && (
                  <div className="text-center py-8 text-neutral-500">Nenhum serviço disponível.</div>
                )}
              </div>
            )}
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
                label=""
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </Card>

            {selectedDate && (
              <Card padding="lg">
                <h3 className="font-semibold text-lg mb-4">Horários Disponíveis</h3>
                {isLoadingSlots ? (
                  <div className="text-center py-4 opacity-50">Buscando horários...</div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {timeSlots.map((slot) => {
                      const time = slot.hora_inicio.slice(0, 5);
                      return (
                        <button
                          key={slot.hora_inicio}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            selectedTime === time
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                    {timeSlots.length === 0 && (
                      <div className="col-span-full text-center text-neutral-500 py-4">
                        Nenhum horário vago para esta data.
                      </div>
                    )}
                  </div>
                )}
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

            {confirmError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{confirmError}</p>
              </div>
            )}

            <Card padding="lg">
              <h3 className="font-semibold text-lg mb-4">Resumo do Agendamento</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600">Unidade</p>
                  <p className="font-semibold">{selectedUnit?.name || selectedUnit?.nome || 'Unidade Principal'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Profissional</p>
                  <p className="font-semibold">{selectedProfessional?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Serviço</p>
                  <p className="font-semibold">{selectedService?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Data e Horário</p>
                  <p className="font-semibold">{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600">Valor Total</p>
                  <p className="text-3xl font-bold text-primary-600">R$ {selectedService?.preco}</p>
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
            <Button variant="outline" onClick={handleBack} disabled={isConfirming}>
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
              disabled={!canProceed() || isConfirming}
              size="lg"
              isLoading={isConfirming}
            >
              Confirmar Agendamento
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
