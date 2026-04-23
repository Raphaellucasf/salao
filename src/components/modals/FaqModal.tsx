// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Bot, MessageSquare, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  faq?: any;
}

const CATEGORIAS_SUGERIDAS = [
  'Agendamento',
  'Valores',
  'Horários',
  'Localização',
  'Serviços',
  'Pagamentos',
  'Cancelamentos',
  'Outros',
];

export default function FaqModal({ isOpen, onClose, onSuccess, faq }: FaqModalProps) {
  const [loading, setLoading] = useState(false);
  const [perguntaChave, setPerguntaChave] = useState('');
  const [resposta, setResposta] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaCustom, setCategoriaCustom] = useState('');
  const [ativo, setAtivo] = useState(true);

  const isEditing = !!faq;

  useEffect(() => {
    if (faq) {
      setPerguntaChave(faq.pergunta_chave || '');
      setResposta(faq.resposta || '');
      const catExistente = CATEGORIAS_SUGERIDAS.includes(faq.categoria) ? faq.categoria : 'custom';
      setCategoria(catExistente === 'custom' && faq.categoria ? 'custom' : (faq.categoria || ''));
      setCategoriaCustom(!CATEGORIAS_SUGERIDAS.includes(faq.categoria) ? (faq.categoria || '') : '');
      setAtivo(faq.ativo !== undefined ? faq.ativo : true);
    } else {
      resetForm();
    }
  }, [faq, isOpen]);

  const resetForm = () => {
    setPerguntaChave('');
    setResposta('');
    setCategoria('');
    setCategoriaCustom('');
    setAtivo(true);
  };

  const getCategoriaFinal = () => {
    if (categoria === 'custom') return categoriaCustom.trim();
    return categoria.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perguntaChave.trim() || !resposta.trim()) {
      alert('Pergunta chave e resposta são obrigatórios.');
      return;
    }

    const categoriaFinal = getCategoriaFinal();

    setLoading(true);
    try {
      const payload = {
        pergunta_chave: perguntaChave.trim(),
        resposta: resposta.trim(),
        categoria: categoriaFinal || null,
        ativo,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('faq_estabelecimento')
          .update(payload)
          .eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faq_estabelecimento')
          .insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      alert('Erro ao salvar FAQ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Editar FAQ' : 'Nova FAQ'}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Pergunta Chave */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <MessageSquare size={15} className="text-blue-500" />
              Pergunta Chave <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="text"
            value={perguntaChave}
            onChange={(e) => setPerguntaChave(e.target.value)}
            placeholder="Ex: horário de funcionamento, como agendar, valor do corte..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Palavra ou frase que o robô vai reconhecer na mensagem do cliente.
          </p>
        </div>

        {/* Resposta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <Bot size={15} className="text-green-500" />
              Resposta <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Digite a resposta que o robô enviará automaticamente..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Mensagem enviada automaticamente pelo robô quando a pergunta chave for identificada.
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <Tag size={15} className="text-purple-500" />
              Categoria
            </span>
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Sem categoria</option>
            {CATEGORIAS_SUGERIDAS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="custom">Outra (digitar)</option>
          </select>
          {categoria === 'custom' && (
            <input
              type="text"
              value={categoriaCustom}
              onChange={(e) => setCategoriaCustom(e.target.value)}
              placeholder="Digite a categoria..."
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          )}
        </div>

        {/* Ativo */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Status desta FAQ</p>
            <p className="text-xs text-gray-400">FAQs inativas são ignoradas pelo robô</p>
          </div>
          <button
            type="button"
            onClick={() => setAtivo(!ativo)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              ativo
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {ativo ? (
              <><ToggleRight size={18} /> Ativa</>
            ) : (
              <><ToggleLeft size={18} /> Inativa</>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar FAQ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
