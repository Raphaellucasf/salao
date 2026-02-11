// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface AnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  tipo: 'capilar' | 'corporal_facial' | 'podologica' | 'micropigmentacao';
  anamnese?: any;
  onSave: () => void;
}

const TIPOS_ANAMNESE = {
  capilar: 'Anamnese Capilar',
  corporal_facial: 'Anamnese Corporal e Facial',
  podologica: 'Anamnese Podológica',
  micropigmentacao: 'Anamnese Micropigmentação',
};

export default function AnamneseModal({ isOpen, onClose, clienteId, tipo, anamnese, onSave }: AnamneseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cliente, setCliente] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    // Dados Capilar
    tipo_cabelo: '',
    textura_cabelo: '',
    couro_cabeludo: '',
    historico_quimico: '',
    alergias_capilar: '',
    medicamentos: '',
    procedimentos_anteriores: '',
    problemas_atuais: '',
    expectativas: '',
    
    // Dados Corporal e Facial
    tipo_pele: '',
    fototipo: '',
    alergias_pele: '',
    doencas_pele: '',
    cirurgias_esteticas: '',
    usa_acido_retinol: false,
    gestante: false,
    lactante: false,
    marca_passo: false,
    varizes: false,
    problemas_circulatorios: '',
    expectativas_corporais: '',
    
    // Dados Podológica
    tipo_pe: '',
    unhas_encravadas: false,
    micoses: false,
    calosidades: false,
    rachaduras: false,
    diabetes: false,
    problemas_circulacao: false,
    sensibilidade_pe: '',
    tratamentos_anteriores_pe: '',
    
    // Dados Micropigmentação
    area_micropigmentacao: '',
    pigmentacao_anterior: false,
    data_ultima_pigmentacao: '',
    resultado_anterior: '',
    tom_pele_micro: '',
    expectativa_cor: '',
    formato_desejado: '',
    alergias_pigmento: '',
    queloides: false,
    hepatite: false,
    herpes: false,
    
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen && clienteId) {
      loadCliente();
      if (anamnese) {
        setFormData(anamnese);
      }
    }
  }, [isOpen, clienteId, anamnese]);

  const loadCliente = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) throw error;
      setCliente(data);
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        cliente_id: clienteId,
        tipo,
        ...formData,
      };

      if (anamnese) {
        const { error: updateError } = await supabase
          .from('anamneses')
          // @ts-ignore - anamneses table not in types
          .update(dataToSave)
          .eq('id', anamnese.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('anamneses')
          // @ts-ignore - anamneses table not in types
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar anamnese');
    } finally {
      setLoading(false);
    }
  };

  const renderCapilar = () => (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Cabelo</label>
          <select
            value={formData.tipo_cabelo}
            onChange={(e) => setFormData({ ...formData, tipo_cabelo: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="liso">Liso</option>
            <option value="ondulado">Ondulado</option>
            <option value="cacheado">Cacheado</option>
            <option value="crespo">Crespo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Textura</label>
          <select
            value={formData.textura_cabelo}
            onChange={(e) => setFormData({ ...formData, textura_cabelo: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="fino">Fino</option>
            <option value="medio">Médio</option>
            <option value="grosso">Grosso</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Couro Cabeludo</label>
          <select
            value={formData.couro_cabeludo}
            onChange={(e) => setFormData({ ...formData, couro_cabeludo: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="normal">Normal</option>
            <option value="oleoso">Oleoso</option>
            <option value="seco">Seco</option>
            <option value="misto">Misto</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Histórico Químico</label>
        <textarea
          value={formData.historico_quimico}
          onChange={(e) => setFormData({ ...formData, historico_quimico: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Descreva procedimentos químicos anteriores..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Alergias</label>
          <textarea
            value={formData.alergias_capilar}
            onChange={(e) => setFormData({ ...formData, alergias_capilar: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Liste alergias conhecidas..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Medicamentos em Uso</label>
          <textarea
            value={formData.medicamentos}
            onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Liste medicamentos..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Problemas Atuais</label>
        <textarea
          value={formData.problemas_atuais}
          onChange={(e) => setFormData({ ...formData, problemas_atuais: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Queda, caspa, ressecamento, etc..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Expectativas do Cliente</label>
        <textarea
          value={formData.expectativas}
          onChange={(e) => setFormData({ ...formData, expectativas: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="O que o cliente espera do tratamento..."
        />
      </div>
    </>
  );

  const renderCorporalFacial = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Pele</label>
          <select
            value={formData.tipo_pele}
            onChange={(e) => setFormData({ ...formData, tipo_pele: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="normal">Normal</option>
            <option value="oleosa">Oleosa</option>
            <option value="seca">Seca</option>
            <option value="mista">Mista</option>
            <option value="sensivel">Sensível</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Fototipo</label>
          <select
            value={formData.fototipo}
            onChange={(e) => setFormData({ ...formData, fototipo: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="I">I - Muito clara</option>
            <option value="II">II - Clara</option>
            <option value="III">III - Morena clara</option>
            <option value="IV">IV - Morena moderada</option>
            <option value="V">V - Morena escura</option>
            <option value="VI">VI - Negra</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'usa_acido_retinol', label: 'Usa Ácido/Retinol' },
          { key: 'gestante', label: 'Gestante' },
          { key: 'lactante', label: 'Lactante' },
          { key: 'marca_passo', label: 'Marca-passo' },
          { key: 'varizes', label: 'Varizes' },
        ].map((item) => (
          <label key={item.key} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={formData[item.key]}
              onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Alergias</label>
          <textarea
            value={formData.alergias_pele}
            onChange={(e) => setFormData({ ...formData, alergias_pele: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Doenças de Pele</label>
          <textarea
            value={formData.doencas_pele}
            onChange={(e) => setFormData({ ...formData, doencas_pele: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Cirurgias Estéticas Anteriores</label>
        <textarea
          value={formData.cirurgias_esteticas}
          onChange={(e) => setFormData({ ...formData, cirurgias_esteticas: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Problemas Circulatórios</label>
        <textarea
          value={formData.problemas_circulatorios}
          onChange={(e) => setFormData({ ...formData, problemas_circulatorios: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Expectativas</label>
        <textarea
          value={formData.expectativas_corporais}
          onChange={(e) => setFormData({ ...formData, expectativas_corporais: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </>
  );

  const renderPodologica = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Pé</label>
        <select
          value={formData.tipo_pe}
          onChange={(e) => setFormData({ ...formData, tipo_pe: e.target.value })}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Selecione</option>
          <option value="normal">Normal</option>
          <option value="plano">Plano</option>
          <option value="cavo">Cavo</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'unhas_encravadas', label: 'Unhas Encravadas' },
          { key: 'micoses', label: 'Micoses' },
          { key: 'calosidades', label: 'Calosidades' },
          { key: 'rachaduras', label: 'Rachaduras' },
          { key: 'diabetes', label: 'Diabetes' },
          { key: 'problemas_circulacao', label: 'Problemas Circulação' },
        ].map((item) => (
          <label key={item.key} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={formData[item.key]}
              onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Sensibilidade</label>
        <textarea
          value={formData.sensibilidade_pe}
          onChange={(e) => setFormData({ ...formData, sensibilidade_pe: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Tratamentos Anteriores</label>
        <textarea
          value={formData.tratamentos_anteriores_pe}
          onChange={(e) => setFormData({ ...formData, tratamentos_anteriores_pe: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </>
  );

  const renderMicropigmentacao = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Área a Pigmentar</label>
          <select
            value={formData.area_micropigmentacao}
            onChange={(e) => setFormData({ ...formData, area_micropigmentacao: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="sobrancelhas">Sobrancelhas</option>
            <option value="labios">Lábios</option>
            <option value="olhos">Olhos (Delineado)</option>
            <option value="aureola">Aréola Mamária</option>
            <option value="capilar">Capilar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Tom de Pele</label>
          <select
            value={formData.tom_pele_micro}
            onChange={(e) => setFormData({ ...formData, tom_pele_micro: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione</option>
            <option value="muito_claro">Muito Claro</option>
            <option value="claro">Claro</option>
            <option value="medio">Médio</option>
            <option value="moreno">Moreno</option>
            <option value="escuro">Escuro</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.pigmentacao_anterior}
            onChange={(e) => setFormData({ ...formData, pigmentacao_anterior: e.target.checked })}
            className="w-4 h-4 text-primary-600"
          />
          <span className="text-sm font-medium">Já fez micropigmentação antes</span>
        </label>

        {formData.pigmentacao_anterior && (
          <Input
            label="Data da Última Pigmentação"
            type="date"
            value={formData.data_ultima_pigmentacao}
            onChange={(e) => setFormData({ ...formData, data_ultima_pigmentacao: e.target.value })}
          />
        )}
      </div>

      {formData.pigmentacao_anterior && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Como foi o resultado anterior?</label>
          <textarea
            value={formData.resultado_anterior}
            onChange={(e) => setFormData({ ...formData, resultado_anterior: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cor Desejada</label>
          <Input
            type="text"
            value={formData.expectativa_cor}
            onChange={(e) => setFormData({ ...formData, expectativa_cor: e.target.value })}
            placeholder="Ex: castanho médio, nude rosado..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Formato Desejado</label>
          <Input
            type="text"
            value={formData.formato_desejado}
            onChange={(e) => setFormData({ ...formData, formato_desejado: e.target.value })}
            placeholder="Ex: arqueada, reta, fio a fio..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: 'queloides', label: 'Tendência a Queloides' },
          { key: 'hepatite', label: 'Hepatite' },
          { key: 'herpes', label: 'Herpes' },
        ].map((item) => (
          <label key={item.key} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={formData[item.key]}
              onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Alergias a Pigmentos</label>
        <textarea
          value={formData.alergias_pigmento}
          onChange={(e) => setFormData({ ...formData, alergias_pigmento: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={TIPOS_ANAMNESE[tipo]}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {cliente && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="font-semibold text-primary-900">{cliente.nome}</p>
            <p className="text-sm text-primary-700">{cliente.telefone} • {cliente.email}</p>
          </div>
        )}

        {tipo === 'capilar' && renderCapilar()}
        {tipo === 'corporal_facial' && renderCorporalFacial()}
        {tipo === 'podologica' && renderPodologica()}
        {tipo === 'micropigmentacao' && renderMicropigmentacao()}

        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Observações Gerais</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Informações adicionais..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Salvando...' : anamnese ? 'Atualizar' : 'Salvar Anamnese'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

