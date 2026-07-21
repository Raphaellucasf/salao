'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, MoveRight, UserRound, X } from 'lucide-react';

interface ProfessionalOption {
  id: string;
  name: string;
}

interface MoverAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (date: string) => void;
  appointmentId?: string;
  clientName?: string;
  initialDate: string;
  initialTime?: string;
  initialProfessionalId?: string;
  professionals: ProfessionalOption[];
}

export default function MoverAgendamentoModal({
  isOpen,
  onClose,
  onSuccess,
  appointmentId,
  clientName,
  initialDate,
  initialTime = '09:00',
  initialProfessionalId = '',
  professionals,
}: MoverAgendamentoModalProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [professionalId, setProfessionalId] = useState(initialProfessionalId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDate(initialDate);
    setTime(initialTime);
    setProfessionalId(initialProfessionalId);
    setError('');
  }, [isOpen, initialDate, initialTime, initialProfessionalId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const save = async () => {
    if (!appointmentId || !date || !time || !professionalId) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/agendamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: appointmentId,
          data_agendamento: date,
          hora_inicio: time,
          profissional_id: professionalId,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Erro HTTP ${response.status}`);
      onSuccess(date);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível mover o agendamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" role="presentation">
      <button className="absolute inset-0 bg-black/45 backdrop-blur-sm" aria-label="Fechar" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="move-appointment-title">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Reagendar</p>
            <h2 id="move-appointment-title" className="mt-1 text-2xl font-bold text-neutral-900">Mover agendamento</h2>
            <p className="mt-1 text-sm text-neutral-500">{clientName || 'Cliente'}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-1.5 flex items-center gap-2"><Calendar className="h-4 w-4" /> Nova data</span>
            <input type="date" value={date} onChange={event => setDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:ring-2 focus:ring-primary-400" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-1.5 flex items-center gap-2"><Clock className="h-4 w-4" /> Novo horário</span>
            <input type="time" value={time} onChange={event => setTime(event.target.value)} step={900}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:ring-2 focus:ring-primary-400" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-1.5 flex items-center gap-2"><UserRound className="h-4 w-4" /> Profissional</span>
            <select value={professionalId} onChange={event => setProfessionalId(event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:ring-2 focus:ring-primary-400">
              {professionals.map(professional => (
                <option key={professional.id} value={professional.id}>{professional.name}</option>
              ))}
            </select>
          </label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-neutral-100 pt-4">
          <button onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Cancelar</button>
          <button onClick={save} disabled={saving || !appointmentId || !date || !time || !professionalId}
            className="flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
            <MoveRight className="h-4 w-4" /> {saving ? 'Movendo...' : 'Mover'}
          </button>
        </div>
      </div>
    </div>
  );
}
