'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MapPin, Star, Clock, Check, AlertCircle, Building2, ShieldCheck, UserRound, Search } from 'lucide-react';
import { Button, Card, Input, Badge, BrandMark } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4 | 5;

const stepLabels = ['Unidade', 'Profissional', 'Serviço', 'Horário', 'Confirmação'];

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

function isLegacyCatalogSchema(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (
    error.code === '42703'
    || error.code === 'PGRST204'
    || error.message?.includes('unit_id')
  ));
}

export default function AgendarPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceCategory, setServiceCategory] = useState('todas');
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
      const { data } = await supabase
        .from('units')
        .select('id, name, address, is_active')
        .eq('is_active', true);
      if (data) {
        setUnits(data as Unit[]);
      }
      setIsLoadingUnits(false);
    }
    fetchUnits();
  }, []);

  // Step 2: professionals
  useEffect(() => {
    async function fetchPros() {
      setIsLoadingPros(true);
      setProfessionals([]);
      let result = await supabase
        .from('profissionais')
        .select('id, nome, ativo, cor_agenda, foto_url')
        .eq('ativo', true)
        .eq('unit_id', selectedUnit!.id)
        .order('nome');
      if (isLegacyCatalogSchema(result.error)) {
        result = await supabase
          .from('profissionais')
          .select('id, nome, ativo, cor_agenda, foto_url')
          .eq('ativo', true)
          .order('nome');
      }
      if (result.data) {
        setProfessionals(result.data as Professional[]);
      }
      setIsLoadingPros(false);
    }
    if (selectedUnit) {
      fetchPros();
    }
  }, [selectedUnit]);

  // Step 3: services da unidade selecionada
  useEffect(() => {
    async function fetchServices() {
      setIsLoadingServices(true);
      setServices([]);
      let result = await supabase
        .from('servicos')
        .select('id, nome, duracao_minutos, preco, categoria')
        .eq('ativo', true)
        .eq('unit_id', selectedUnit!.id)
        .order('nome');
      if (isLegacyCatalogSchema(result.error)) {
        result = await supabase
          .from('servicos')
          .select('id, nome, duracao_minutos, preco, categoria')
          .eq('ativo', true)
          .order('nome');
      }
      if (result.data) {
        setServices(result.data as Service[]);
      }
      setIsLoadingServices(false);
    }
    if (selectedUnit) fetchServices();
    else setServices([]);
  }, [selectedUnit]);

  const normalizedServiceQuery = serviceQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const serviceCategories = useMemo(
    () => Array.from(new Set(services.map((service) => service.categoria).filter(Boolean))).sort(),
    [services],
  );
  const filteredServices = useMemo(() => services.filter((service) => {
    const normalizedName = service.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const matchesQuery = !normalizedServiceQuery || normalizedName.includes(normalizedServiceQuery);
    const matchesCategory = serviceCategory === 'todas' || service.categoria === serviceCategory;
    return matchesQuery && matchesCategory;
  }), [services, normalizedServiceQuery, serviceCategory]);

  const selectUnit = (unit: Unit) => {
    if (selectedUnit?.id !== unit.id) {
      setSelectedProfessional(null);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setServiceQuery('');
      setServiceCategory('todas');
    }
    setSelectedUnit(unit);
  };

  // Step 4: Time slots
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function fetchSlots() {
      setSelectedTime('');
      setTimeSlots([]);
      if (!selectedProfessional || !selectedDate || !selectedService) return;
      setIsLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          professional_id: selectedProfessional.id,
          service_id: selectedService.id,
          date: selectedDate,
        });
        const response = await fetch(`/api/appointments/availability?${params}`, {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error('Falha ao buscar horários.');
        if (active) {
          const slots = Array.isArray(payload)
            ? payload.filter(
                (slot): slot is TimeSlot =>
                  typeof slot === 'object' &&
                  slot !== null &&
                  'livre' in slot &&
                  slot.livre === true &&
                  'hora_inicio' in slot &&
                  typeof slot.hora_inicio === 'string' &&
                  'hora_fim' in slot &&
                  typeof slot.hora_fim === 'string',
              )
            : [];
          setTimeSlots(slots);
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
          setTimeSlots([]);
        }
      } finally {
        if (active) setIsLoadingSlots(false);
      }
    }

    void fetchSlots();
    return () => {
      active = false;
      controller.abort();
    };
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
    } catch {
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
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950" aria-label="Voltar ao início">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <BrandMark size="sm" className="hidden sm:inline-flex" />
            <div className="h-8 w-px bg-neutral-200 sm:block" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-950 sm:text-base">Novo agendamento</p>
              <p className="text-xs text-neutral-500">Etapa {currentStep} de 5</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Ambiente seguro</span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-neutral-200/70 bg-white/60 py-4">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold sm:hidden">
            <span className="text-primary-800">{stepLabels[currentStep - 1]}</span>
            <span className="text-neutral-400">{currentStep}/5</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 sm:hidden"><div className="h-full rounded-full bg-accent-600 transition-[width] duration-300" style={{ width: `${currentStep * 20}%` }} /></div>
          <div className="hidden items-start justify-between sm:flex">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-1 items-start last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                  step < currentStep ? 'border-primary-800 bg-primary-800 text-white' :
                  step === currentStep ? 'border-accent-600 bg-accent-600 text-white shadow-card' :
                  'border-neutral-200 bg-white text-neutral-400'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                  </div>
                  <span className={`mt-2 text-[0.68rem] font-semibold ${step === currentStep ? 'text-accent-700' : step < currentStep ? 'text-primary-800' : 'text-neutral-400'}`}>{stepLabels[step - 1]}</span>
                </div>
                {step < 5 && (
                  <div className={`mt-4 h-px flex-1 ${step < currentStep ? 'bg-primary-700' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Step 1: Select Unit */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Primeiro passo</p>
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Onde você quer ser atendido?</h1>
              <p className="mt-3 leading-7 text-neutral-600">Escolha a unidade mais conveniente para o seu atendimento.</p>
            </div>
            {isLoadingUnits ? (
              <div className="grid gap-5 md:grid-cols-2" aria-label="Carregando unidades">
                {[1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-neutral-200 bg-white/70" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {displayedUnits.map((unit) => (
                  <Card
                    key={unit.id}
                    hover
                    padding="none"
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedUnit?.id === unit.id}
                    className={`cursor-pointer overflow-hidden transition-all ${
                      selectedUnit?.id === unit.id ? 'border-accent-400 ring-4 ring-accent-100' : ''
                    }`}
                    onClick={() => selectUnit(unit as Unit)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectUnit(unit as Unit); }}
                  >
                    <div className="surface-grid flex h-40 items-center justify-center bg-primary-800 sm:h-48">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-white backdrop-blur-sm"><Building2 className="h-7 w-7" /></div>
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
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Seu atendimento</p>
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Com quem você quer cuidar de si?</h1>
              <p className="mt-3 leading-7 text-neutral-600">Selecione o profissional de sua preferência.</p>
            </div>
            {isLoadingPros ? (
              <div className="grid gap-5 md:grid-cols-3" aria-label="Carregando profissionais">
                {[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-white/70" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {professionals.map((professional) => (
                  <Card
                    key={professional.id}
                    hover
                    padding="lg"
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedProfessional?.id === professional.id}
                    className={`cursor-pointer text-center transition-all ${
                      selectedProfessional?.id === professional.id ? 'border-accent-400 ring-4 ring-accent-100' : ''
                    }`}
                    onClick={() => setSelectedProfessional(professional)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedProfessional(professional); }}
                  >
                    <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-primary-100 to-accent-100 text-primary-700">
                      {professional.foto_url ? (
                        <Image src={professional.foto_url} alt={professional.nome} fill sizes="96px" unoptimized className="object-cover" />
                      ) : (
                        <UserRound className="h-9 w-9" />
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
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Escolha seu cuidado</p>
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">O que você quer fazer hoje?</h1>
              <p className="mt-3 leading-7 text-neutral-600">Selecione o serviço desejado e confira a duração estimada.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <label className="relative block">
                <span className="sr-only">Filtrar serviços</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Buscar serviço..."
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                />
              </label>
              <label>
                <span className="sr-only">Filtrar por categoria</span>
                <select
                  value={serviceCategory}
                  onChange={(event) => setServiceCategory(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="todas">Todas as categorias</option>
                  {serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>
            {isLoadingServices ? (
              <div className="space-y-3" aria-label="Carregando serviços">
                {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-neutral-200 bg-white/70" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    hover
                    padding="md"
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedService?.id === service.id}
                    className={`cursor-pointer transition-all ${
                      selectedService?.id === service.id ? 'border-accent-400 ring-4 ring-accent-100' : ''
                    }`}
                    onClick={() => setSelectedService(service)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedService(service); }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                        <div className="text-xl font-semibold tracking-[-0.025em] text-primary-800">{Number(service.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredServices.length === 0 && !isLoadingServices && (
                  <div className="text-center py-8 text-neutral-500">
                    {services.length === 0 ? 'Nenhum serviço disponível nesta unidade.' : 'Nenhum serviço corresponde aos filtros.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Select Date & Time */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Quando fica melhor?</p>
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Escolha data e horário</h1>
              <p className="mt-3 leading-7 text-neutral-600">Mostramos apenas os horários disponíveis para a sua seleção.</p>
            </div>
            
            <Card padding="lg">
              <h3 className="font-semibold text-lg mb-4">Data</h3>
              <Input
                label="Data do atendimento"
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
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" aria-label="Buscando horários">
                    {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-11 animate-pulse rounded-xl bg-neutral-100" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 sm:gap-3">
                    {timeSlots.map((slot) => {
                      const time = slot.hora_inicio.slice(0, 5);
                      return (
                        <button
                          key={slot.hora_inicio}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            selectedTime === time
                              ? 'bg-primary-800 text-white shadow-card ring-4 ring-primary-100'
                              : 'border border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50'
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
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Tudo certo?</p>
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Revise e confirme</h1>
              <p className="mt-3 leading-7 text-neutral-600">Confira seu atendimento e informe os dados para contato.</p>
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
                  <p className="font-semibold">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')} às {selectedTime}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600">Valor Total</p>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-primary-800">{Number(selectedService?.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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
                  required
                />
                <Input
                  label="WhatsApp"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  helperText="Você receberá a confirmação por WhatsApp"
                  required
                />
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="sticky bottom-4 z-30 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/92 p-3 shadow-soft backdrop-blur-xl sm:p-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isConfirming}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          {currentStep === 1 && <p className="hidden pl-2 text-xs text-neutral-500 sm:block">Selecione uma opção para continuar</p>}
          <div className="flex-1" />
          {currentStep < 5 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-w-32"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleConfirm}
              disabled={!canProceed() || isConfirming}
              size="lg"
              className="min-w-48"
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
