'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PendingCadastro {
  agendamento_id: string;
  hora_inicio: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  cliente_cpf: string | null;
  cliente_data_nascimento: string | null;
}

export function useCadastrosPendentes() {
  const [pending, setPending] = useState<PendingCadastro[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];

      // Clientes com cadastro incompleto (campo pode ser null nos registros antigos)
      const { data: incompletos } = await supabase
        .from('clientes')
        .select('id, nome, telefone, email, cpf, data_nascimento')
        .or('cadastro_completo.is.null,cadastro_completo.eq.false');

      if (!incompletos || incompletos.length === 0) {
        setPending([]);
        return;
      }

      const ids = (incompletos as any[]).map((c: any) => c.id);

      const { data: ags } = await supabase
        .from('agendamentos')
        .select('id, cliente_id, hora_inicio')
        .eq('data_agendamento', hoje)
        .in('cliente_id', ids)
        .neq('status', 'cancelado')
        .order('hora_inicio');

      if (!ags || ags.length === 0) {
        setPending([]);
        return;
      }

      const clienteMap: Record<string, any> = {};
      (incompletos as any[]).forEach((c: any) => { clienteMap[c.id] = c; });

      setPending(
        (ags as any[]).map((ag: any) => {
          const c = clienteMap[ag.cliente_id] ?? {};
          return {
            agendamento_id: ag.id,
            hora_inicio: ag.hora_inicio,
            cliente_id: ag.cliente_id,
            cliente_nome: c.nome ?? 'Cliente',
            cliente_telefone: c.telefone ?? '',
            cliente_email: c.email ?? '',
            cliente_cpf: c.cpf ?? null,
            cliente_data_nascimento: c.data_nascimento ?? null,
          };
        }),
      );
    } catch {
      // ignora silenciosamente — não bloqueia a UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { pending, count: pending.length, loading, reload: load };
}
