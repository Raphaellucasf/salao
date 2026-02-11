// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

interface MensagemAvisoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string;
  onSave: () => void;
}

export default function MensagemAvisoModal({ isOpen, onClose, clienteId, onSave }: MensagemAvisoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: clienteId || '',
    tipo: 'manual',
    titulo: '',
    mensagem: '',
    canal: 'whatsapp',
    agendar_para: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        enviado: !formData.agendar_para, // Se não tiver agendamento, marca como enviado
        data_envio: formData.agendar_para ? null : new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('avisos_clientes')
        .insert([dataToSave]);

      if (insertError) throw insertError;

      onSave();
      onClose();
      
      // Reset form
      setFormData({
        cliente_id: '',
        tipo: 'manual',
        titulo: '',
        mensagem: '',
        canal: 'whatsapp',
        agendar_para: '',
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    {
      titulo: 'Lembrete de Agendamento',
      mensagem: 'Olá {nome}! Este é um lembrete do seu agendamento marcado para {data} às {hora}. Aguardamos você! 😊',
    },
    {
      titulo: 'Promoção Especial',
      mensagem: 'Olá {nome}! Temos uma promoção especial para você! Entre em contato para saber mais.',
    },
    {
      titulo: 'Retorno de Procedimento',
      mensagem: 'Olá {nome}! Lembramos que está na hora do seu retorno. Agende conosco!',
    },
  ];

  const aplicarTemplate = (template: any) => {
    setFormData({
      ...formData,
      titulo: template.titulo,
      mensagem: template.mensagem,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mensagem de Aviso (Ctrl+M)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Templates */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Templates Rápidos</label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => aplicarTemplate(template)}
                className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                {template.titulo}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cliente</label>
          <select
            required
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome} - {cliente.telefone}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Canal</label>
            <select
              value={formData.canal}
              onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">E-mail</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>

          <Input
            label="Agendar para (opcional)"
            type="datetime-local"
            value={formData.agendar_para}
            onChange={(e) => setFormData({ ...formData, agendar_para: e.target.value })}
          />
        </div>

        <Input
          label="Título"
          type="text"
          required
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Assunto da mensagem"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Mensagem *</label>
          <textarea
            required
            value={formData.mensagem}
            onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Digite sua mensagem aqui..."
          />
          <p className="text-xs text-neutral-500 mt-2">
            Caracteres: {formData.mensagem.length}
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 gap-2" disabled={loading}>
            <Send className="w-4 h-4" />
            {loading ? 'Enviando...' : formData.agendar_para ? 'Agendar' : 'Enviar Agora'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

