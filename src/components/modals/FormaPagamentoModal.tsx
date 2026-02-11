// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { X, CreditCard, Percent } from 'lucide-react';

interface FormaPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  forma?: any;
}

export default function FormaPagamentoModal({ isOpen, onClose, onSuccess, forma }: FormaPagamentoModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('dinheiro');
  const [bandeira, setBandeira] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [ordem, setOrdem] = useState(0);
  
  // Parcelamento
  const [permiteParcelamento, setPermiteParcelamento] = useState(false);
  const [maxParcelas, setMaxParcelas] = useState(1);
  const [minValorParcela, setMinValorParcela] = useState('');
  
  // Taxas
  const [taxaPercentual, setTaxaPercentual] = useState('');
  const [taxaFixa, setTaxaFixa] = useState('');
  
  // Desconto
  const [descontoPercentual, setDescontoPercentual] = useState('');
  
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (forma) {
        setNome(forma.nome || '');
        setTipo(forma.tipo || 'dinheiro');
        setBandeira(forma.bandeira || '');
        setAtivo(forma.ativo ?? true);
        setOrdem(forma.ordem || 0);
        setPermiteParcelamento(forma.permite_parcelamento ?? false);
        setMaxParcelas(forma.max_parcelas || 1);
        setMinValorParcela(forma.min_valor_parcela?.toString() || '');
        setTaxaPercentual(forma.taxa_percentual?.toString() || '');
        setTaxaFixa(forma.taxa_fixa?.toString() || '');
        setDescontoPercentual(forma.desconto_percentual?.toString() || '');
        setObservacoes(forma.observacoes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, forma]);

  const resetForm = () => {
    setNome('');
    setTipo('dinheiro');
    setBandeira('');
    setAtivo(true);
    setOrdem(0);
    setPermiteParcelamento(false);
    setMaxParcelas(1);
    setMinValorParcela('');
    setTaxaPercentual('');
    setTaxaFixa('');
    setDescontoPercentual('');
    setObservacoes('');
  };

  const handleSubmit = async () => {
    if (!nome || !tipo) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const formaData = {
        nome,
        tipo,
        bandeira: bandeira || null,
        ativo,
        ordem,
        permite_parcelamento: permiteParcelamento,
        max_parcelas: permiteParcelamento ? maxParcelas : 1,
        min_valor_parcela: minValorParcela ? parseFloat(minValorParcela) : null,
        taxa_percentual: taxaPercentual ? parseFloat(taxaPercentual) : 0,
        taxa_fixa: taxaFixa ? parseFloat(taxaFixa) : 0,
        desconto_percentual: descontoPercentual ? parseFloat(descontoPercentual) : 0,
        observacoes,
      };

      if (forma) {
        const { error } = await supabase
          .from('formas_pagamento')
          .update(formaData)
          .eq('id', forma.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('formas_pagamento')
          .insert([formaData]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-blue-600" size={20} />
          </div>
          <h2 className="text-xl font-semibold">
            {forma ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
          </h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nome*"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cartão de Crédito Visa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo*
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto</option>
                <option value="crediario">Crediário</option>
              </select>
            </div>

            <Input
              label="Bandeira"
              value={bandeira}
              onChange={(e) => setBandeira(e.target.value)}
              placeholder="Visa, Master, Elo..."
            />

            <Input
              label="Ordem de Exibição"
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
            />

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Forma Ativa</span>
              </label>
            </div>
          </div>

          {/* Parcelamento */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permiteParcelamento}
                  onChange={(e) => setPermiteParcelamento(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Permite Parcelamento</span>
              </label>
            </div>

            {permiteParcelamento && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <Input
                  label="Máximo de Parcelas"
                  type="number"
                  value={maxParcelas}
                  onChange={(e) => setMaxParcelas(parseInt(e.target.value) || 1)}
                  min="1"
                  max="24"
                />
                <Input
                  label="Valor Mínimo por Parcela"
                  type="number"
                  value={minValorParcela}
                  onChange={(e) => setMinValorParcela(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Taxas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Percent size={16} />
              Taxas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Taxa Percentual (%)"
                type="number"
                value={taxaPercentual}
                onChange={(e) => setTaxaPercentual(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
              <Input
                label="Taxa Fixa (R$)"
                type="number"
                value={taxaFixa}
                onChange={(e) => setTaxaFixa(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Taxas aplicadas sobre o valor da transação (ex: taxas de cartão)
            </p>
          </div>

          {/* Desconto */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Desconto</h3>
            <Input
              label="Desconto Percentual (%)"
              type="number"
              value={descontoPercentual}
              onChange={(e) => setDescontoPercentual(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-2">
              Desconto concedido para pagamentos com esta forma (ex: 5% de desconto para PIX)
            </p>
          </div>

          {/* Observações */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre esta forma de pagamento..."
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : forma ? 'Salvar Alterações' : 'Criar Forma de Pagamento'}
        </Button>
      </div>
    </Modal>
  );
}

