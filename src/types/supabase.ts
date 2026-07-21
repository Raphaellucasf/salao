export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abertura_caixa: {
        Row: {
          aberto_por: string
          criado_em: string
          data: string
          id: string
          observacao: string | null
          unit_id: string
          valor_abertura: number
        }
        Insert: {
          aberto_por: string
          criado_em?: string
          data: string
          id?: string
          observacao?: string | null
          unit_id?: string
          valor_abertura?: number
        }
        Update: {
          aberto_por?: string
          criado_em?: string
          data?: string
          id?: string
          observacao?: string | null
          unit_id?: string
          valor_abertura?: number
        }
        Relationships: [
          {
            foreignKeyName: "abertura_caixa_aberto_por_fkey"
            columns: ["aberto_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abertura_caixa_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          auxiliar_id: string | null
          cliente_id: number | null
          cliente_nome: string | null
          cliente_telefone: string | null
          comanda_id: number | null
          concluido_em: string | null
          confirmado_em: string | null
          created_at: string | null
          criado_automaticamente: boolean | null
          data_agendamento: string
          duracao_total: number
          hora_fim: string
          hora_inicio: string
          id: string
          observacoes: string | null
          observacoes_internas: string | null
          profissional_id: string | null
          servicos: Json | null
          status: string | null
          unit_id: string
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          auxiliar_id?: string | null
          cliente_id?: number | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comanda_id?: number | null
          concluido_em?: string | null
          confirmado_em?: string | null
          created_at?: string | null
          criado_automaticamente?: boolean | null
          data_agendamento: string
          duracao_total: number
          hora_fim: string
          hora_inicio: string
          id?: string
          observacoes?: string | null
          observacoes_internas?: string | null
          profissional_id?: string | null
          servicos?: Json | null
          status?: string | null
          unit_id?: string
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          auxiliar_id?: string | null
          cliente_id?: number | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comanda_id?: number | null
          concluido_em?: string | null
          confirmado_em?: string | null
          created_at?: string | null
          criado_automaticamente?: boolean | null
          data_agendamento?: string
          duracao_total?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          observacoes?: string | null
          observacoes_internas?: string | null
          profissional_id?: string | null
          servicos?: Json | null
          status?: string | null
          unit_id?: string
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "agendamentos_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "agendamentos_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos_blocos: {
        Row: {
          agendamento_id: string | null
          created_at: string | null
          etapa_id: string | null
          event_id_google: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          profissional_id: string | null
          status_bloco: string
          unit_id: string
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string | null
          etapa_id?: string | null
          event_id_google?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          profissional_id?: string | null
          status_bloco?: string
          unit_id?: string
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string | null
          etapa_id?: string | null
          event_id_google?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          profissional_id?: string | null
          status_bloco?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_blocos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "servico_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_blocos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      anamneses: {
        Row: {
          alergias_capilar: string | null
          alergias_pele: string | null
          alergias_pigmento: string | null
          area_micropigmentacao: string | null
          calosidades: boolean | null
          cirurgias_esteticas: string | null
          cliente_id: number
          couro_cabeludo: string | null
          created_at: string | null
          data_anamnese: string | null
          data_ultima_pigmentacao: string | null
          diabetes: boolean | null
          doencas_pele: string | null
          expectativa_cor: string | null
          expectativas: string | null
          expectativas_corporais: string | null
          formato_desejado: string | null
          fotos: Json | null
          fototipo: string | null
          gestante: boolean | null
          hepatite: boolean | null
          herpes: boolean | null
          historico_quimico: string | null
          id: string
          lactante: boolean | null
          marca_passo: boolean | null
          medicamentos: string | null
          micoses: boolean | null
          observacoes: string | null
          pigmentacao_anterior: boolean | null
          problemas_atuais: string | null
          problemas_circulacao: boolean | null
          problemas_circulatorios: string | null
          procedimentos_anteriores: string | null
          profissional_id: string | null
          queloides: boolean | null
          rachaduras: boolean | null
          resultado_anterior: string | null
          sensibilidade_pe: string | null
          textura_cabelo: string | null
          tipo: string
          tipo_cabelo: string | null
          tipo_pe: string | null
          tipo_pele: string | null
          tom_pele_micro: string | null
          tratamentos_anteriores_pe: string | null
          unhas_encravadas: boolean | null
          unit_id: string
          updated_at: string | null
          usa_acido_retinol: boolean | null
          varizes: boolean | null
        }
        Insert: {
          alergias_capilar?: string | null
          alergias_pele?: string | null
          alergias_pigmento?: string | null
          area_micropigmentacao?: string | null
          calosidades?: boolean | null
          cirurgias_esteticas?: string | null
          cliente_id: number
          couro_cabeludo?: string | null
          created_at?: string | null
          data_anamnese?: string | null
          data_ultima_pigmentacao?: string | null
          diabetes?: boolean | null
          doencas_pele?: string | null
          expectativa_cor?: string | null
          expectativas?: string | null
          expectativas_corporais?: string | null
          formato_desejado?: string | null
          fotos?: Json | null
          fototipo?: string | null
          gestante?: boolean | null
          hepatite?: boolean | null
          herpes?: boolean | null
          historico_quimico?: string | null
          id?: string
          lactante?: boolean | null
          marca_passo?: boolean | null
          medicamentos?: string | null
          micoses?: boolean | null
          observacoes?: string | null
          pigmentacao_anterior?: boolean | null
          problemas_atuais?: string | null
          problemas_circulacao?: boolean | null
          problemas_circulatorios?: string | null
          procedimentos_anteriores?: string | null
          profissional_id?: string | null
          queloides?: boolean | null
          rachaduras?: boolean | null
          resultado_anterior?: string | null
          sensibilidade_pe?: string | null
          textura_cabelo?: string | null
          tipo: string
          tipo_cabelo?: string | null
          tipo_pe?: string | null
          tipo_pele?: string | null
          tom_pele_micro?: string | null
          tratamentos_anteriores_pe?: string | null
          unhas_encravadas?: boolean | null
          unit_id?: string
          updated_at?: string | null
          usa_acido_retinol?: boolean | null
          varizes?: boolean | null
        }
        Update: {
          alergias_capilar?: string | null
          alergias_pele?: string | null
          alergias_pigmento?: string | null
          area_micropigmentacao?: string | null
          calosidades?: boolean | null
          cirurgias_esteticas?: string | null
          cliente_id?: number
          couro_cabeludo?: string | null
          created_at?: string | null
          data_anamnese?: string | null
          data_ultima_pigmentacao?: string | null
          diabetes?: boolean | null
          doencas_pele?: string | null
          expectativa_cor?: string | null
          expectativas?: string | null
          expectativas_corporais?: string | null
          formato_desejado?: string | null
          fotos?: Json | null
          fototipo?: string | null
          gestante?: boolean | null
          hepatite?: boolean | null
          herpes?: boolean | null
          historico_quimico?: string | null
          id?: string
          lactante?: boolean | null
          marca_passo?: boolean | null
          medicamentos?: string | null
          micoses?: boolean | null
          observacoes?: string | null
          pigmentacao_anterior?: boolean | null
          problemas_atuais?: string | null
          problemas_circulacao?: boolean | null
          problemas_circulatorios?: string | null
          procedimentos_anteriores?: string | null
          profissional_id?: string | null
          queloides?: boolean | null
          rachaduras?: boolean | null
          resultado_anterior?: string | null
          sensibilidade_pe?: string | null
          textura_cabelo?: string | null
          tipo?: string
          tipo_cabelo?: string | null
          tipo_pe?: string | null
          tipo_pele?: string | null
          tom_pele_micro?: string | null
          tratamentos_anteriores_pe?: string | null
          unhas_encravadas?: boolean | null
          unit_id?: string
          updated_at?: string | null
          usa_acido_retinol?: boolean | null
          varizes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "anamneses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "anamneses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos_clientes: {
        Row: {
          agendar_para: string | null
          canal: string | null
          cliente_id: string | null
          created_at: string | null
          data_envio: string | null
          enviado: boolean | null
          id: string
          mensagem: string
          tipo: string
          titulo: string
          unit_id: string
          usuario_criador_id: string | null
        }
        Insert: {
          agendar_para?: string | null
          canal?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_envio?: string | null
          enviado?: boolean | null
          id?: string
          mensagem: string
          tipo: string
          titulo: string
          unit_id?: string
          usuario_criador_id?: string | null
        }
        Update: {
          agendar_para?: string | null
          canal?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_envio?: string | null
          enviado?: boolean | null
          id?: string
          mensagem?: string
          tipo?: string
          titulo?: string
          unit_id?: string
          usuario_criador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avisos_clientes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cadastro_templates: {
        Row: {
          ativo: boolean | null
          campos_obrigatorios: Json | null
          campos_padrao: Json
          created_at: string | null
          descricao: string | null
          id: string
          nome_template: string
          tipo: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          campos_obrigatorios?: Json | null
          campos_padrao: Json
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_template: string
          tipo: string
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          campos_obrigatorios?: Json | null
          campos_padrao?: Json
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_template?: string
          tipo?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadastro_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cadastros_excluidos: {
        Row: {
          created_at: string | null
          dados_originais: Json
          data_exclusao: string | null
          data_expiracao: string | null
          id: string
          motivo_exclusao: string | null
          pode_recuperar: boolean | null
          tipo_cadastro: string
          unit_id: string
          usuario_exclusao_id: string | null
        }
        Insert: {
          created_at?: string | null
          dados_originais: Json
          data_exclusao?: string | null
          data_expiracao?: string | null
          id?: string
          motivo_exclusao?: string | null
          pode_recuperar?: boolean | null
          tipo_cadastro: string
          unit_id?: string
          usuario_exclusao_id?: string | null
        }
        Update: {
          created_at?: string | null
          dados_originais?: Json
          data_exclusao?: string | null
          data_expiracao?: string | null
          id?: string
          motivo_exclusao?: string | null
          pode_recuperar?: boolean | null
          tipo_cadastro?: string
          unit_id?: string
          usuario_exclusao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadastros_excluidos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cadastros_recuperacoes: {
        Row: {
          cadastro_excluido_id: string
          dados_originais: Json
          id: string
          recuperado_em: string
          recuperado_por: string
          registro_id: string
          tipo_cadastro: string
          unit_id: string
        }
        Insert: {
          cadastro_excluido_id: string
          dados_originais: Json
          id?: string
          recuperado_em?: string
          recuperado_por: string
          registro_id: string
          tipo_cadastro: string
          unit_id?: string
        }
        Update: {
          cadastro_excluido_id?: string
          dados_originais?: Json
          id?: string
          recuperado_em?: string
          recuperado_por?: string
          registro_id?: string
          tipo_cadastro?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadastros_recuperacoes_recuperado_por_fkey"
            columns: ["recuperado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadastros_recuperacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          active: boolean | null
          bot_message: string | null
          conversation_id: string | null
          created_at: string | null
          id: number
          phone: string | null
          unit_id: string
          user_message: string | null
        }
        Insert: {
          active?: boolean | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          phone?: string | null
          unit_id?: string
          user_message?: string | null
        }
        Update: {
          active?: boolean | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          phone?: string | null
          unit_id?: string
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          ai_service: string | null
          conversation_id: string | null
          created_at: string | null
          email: string | null
          id: number
          phone: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ai_service?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ai_service?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_saldos: {
        Row: {
          cliente_id: string
          created_at: string | null
          descricao: string
          id: string
          referencia: string | null
          saldo_anterior: number | null
          saldo_atual: number
          tipo: string
          unit_id: string
          usuario_id: string | null
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          descricao: string
          id?: string
          referencia?: string | null
          saldo_anterior?: number | null
          saldo_atual: number
          tipo: string
          unit_id?: string
          usuario_id?: string | null
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          referencia?: string | null
          saldo_anterior?: number | null
          saldo_atual?: number
          tipo?: string
          unit_id?: string
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_saldos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          cadastro_completo: boolean
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          id: number
          nome: string
          origem_cadastro: string
          status: string | null
          telefone: string
          unit_id: string
          updated_at: string | null
          vip: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          cadastro_completo?: boolean
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          nome: string
          origem_cadastro?: string
          status?: string | null
          telefone: string
          unit_id?: string
          updated_at?: string | null
          vip?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          cadastro_completo?: boolean
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          nome?: string
          origem_cadastro?: string
          status?: string | null
          telefone?: string
          unit_id?: string
          updated_at?: string | null
          vip?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_item_etapas: {
        Row: {
          auxiliar_id: string | null
          comanda_item_id: number
          comissao_percentual: number | null
          comissao_tipo: string | null
          comissao_valor: number | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          nome: string
          ordem: number
          profissional_id: string | null
          servico_etapa_id: string | null
          status: string | null
          unit_id: string
          updated_at: string | null
          valor_etapa: number | null
        }
        Insert: {
          auxiliar_id?: string | null
          comanda_item_id: number
          comissao_percentual?: number | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos: number
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nome: string
          ordem: number
          profissional_id?: string | null
          servico_etapa_id?: string | null
          status?: string | null
          unit_id?: string
          updated_at?: string | null
          valor_etapa?: number | null
        }
        Update: {
          auxiliar_id?: string | null
          comanda_item_id?: number
          comissao_percentual?: number | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nome?: string
          ordem?: number
          profissional_id?: string | null
          servico_etapa_id?: string | null
          status?: string | null
          unit_id?: string
          updated_at?: string | null
          valor_etapa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_etapa_id_fkey"
            columns: ["servico_etapa_id"]
            isOneToOne: false
            referencedRelation: "servico_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_itens: {
        Row: {
          comanda_id: number | null
          created_at: string | null
          descricao: string
          id: number
          item_id: string | null
          pacote_cliente_id: string | null
          profissional_id: string | null
          quantidade: number | null
          tipo: string | null
          unit_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          comanda_id?: number | null
          created_at?: string | null
          descricao: string
          id?: number
          item_id?: string | null
          pacote_cliente_id?: string | null
          profissional_id?: string | null
          quantidade?: number | null
          tipo?: string | null
          unit_id?: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          comanda_id?: number | null
          created_at?: string | null
          descricao?: string
          id?: number
          item_id?: string | null
          pacote_cliente_id?: string | null
          profissional_id?: string | null
          quantidade?: number | null
          tipo?: string | null
          unit_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "comanda_itens_pacote_cliente_id_fkey"
            columns: ["pacote_cliente_id"]
            isOneToOne: false
            referencedRelation: "pacotes_cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_itens_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_itens_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_pacote_consumos: {
        Row: {
          comanda_id: number
          criado_em: string
          pacote_cliente_id: string
          quantidade: number
          unit_id: string
        }
        Insert: {
          comanda_id: number
          criado_em?: string
          pacote_cliente_id: string
          quantidade: number
          unit_id?: string
        }
        Update: {
          comanda_id?: number
          criado_em?: string
          pacote_cliente_id?: string
          quantidade?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comanda_pacote_consumos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_pacote_consumos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "comanda_pacote_consumos_pacote_cliente_id_fkey"
            columns: ["pacote_cliente_id"]
            isOneToOne: false
            referencedRelation: "pacotes_cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_pacote_consumos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          auxiliar_id: string | null
          cliente_id: number | null
          cliente_nome: string | null
          created_at: string | null
          criado_por: string | null
          data_abertura: string | null
          data_agendamento: string | null
          data_fechamento: string | null
          desconto: number | null
          desconto_aplicado_em: string | null
          desconto_aplicado_por: string | null
          fechado_por: string | null
          hora_inicio: string | null
          id: number
          numero_comanda: number
          observacoes: string | null
          profissional_id: string | null
          status: string | null
          subtotal: number | null
          total: number | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          auxiliar_id?: string | null
          cliente_id?: number | null
          cliente_nome?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_abertura?: string | null
          data_agendamento?: string | null
          data_fechamento?: string | null
          desconto?: number | null
          desconto_aplicado_em?: string | null
          desconto_aplicado_por?: string | null
          fechado_por?: string | null
          hora_inicio?: string | null
          id?: number
          numero_comanda: number
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          auxiliar_id?: string | null
          cliente_id?: number | null
          cliente_nome?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_abertura?: string | null
          data_agendamento?: string | null
          data_fechamento?: string | null
          desconto?: number | null
          desconto_aplicado_em?: string | null
          desconto_aplicado_por?: string | null
          fechado_por?: string | null
          hora_inicio?: string | null
          id?: number
          numero_comanda?: number
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "comandas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_desconto_aplicado_por_fkey"
            columns: ["desconto_aplicado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comandas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comandas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          comanda_id: number
          criado_em: string
          criado_por: string
          id: string
          profissional_id: string
          unit_id: string
          valor_comissao: number
        }
        Insert: {
          comanda_id: number
          criado_em?: string
          criado_por: string
          id?: string
          profissional_id: string
          unit_id?: string
          valor_comissao: number
        }
        Update: {
          comanda_id?: number
          criado_em?: string
          criado_por?: string
          id?: string
          profissional_id?: string
          unit_id?: string
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "comissoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comissoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comissoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          aceita_cartao_credito: boolean | null
          aceita_cartao_debito: boolean | null
          aceita_dinheiro: boolean | null
          aceita_pix: boolean | null
          antecedencia_lembrete: number | null
          antecedencia_maxima_agendamento: number | null
          antecedencia_minima_agendamento: number | null
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          comissao_padrao_produto: number | null
          comissao_padrao_servico: number | null
          complemento: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          duracao_padrao_atendimento: number | null
          email: string | null
          endereco: string | null
          envia_lembrete_email: boolean | null
          envia_lembrete_sms: boolean | null
          envia_lembrete_whatsapp: boolean | null
          estado: string | null
          horario_funcionamento: Json | null
          id: string
          intervalo_entre_atendimentos: number | null
          logo_url: string | null
          nome_empresa: string | null
          numero: string | null
          permite_agendamento_online: boolean | null
          razao_social: string | null
          site: string | null
          telefone: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          aceita_cartao_credito?: boolean | null
          aceita_cartao_debito?: boolean | null
          aceita_dinheiro?: boolean | null
          aceita_pix?: boolean | null
          antecedencia_lembrete?: number | null
          antecedencia_maxima_agendamento?: number | null
          antecedencia_minima_agendamento?: number | null
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_padrao_produto?: number | null
          comissao_padrao_servico?: number | null
          complemento?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          duracao_padrao_atendimento?: number | null
          email?: string | null
          endereco?: string | null
          envia_lembrete_email?: boolean | null
          envia_lembrete_sms?: boolean | null
          envia_lembrete_whatsapp?: boolean | null
          estado?: string | null
          horario_funcionamento?: Json | null
          id?: string
          intervalo_entre_atendimentos?: number | null
          logo_url?: string | null
          nome_empresa?: string | null
          numero?: string | null
          permite_agendamento_online?: boolean | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          aceita_cartao_credito?: boolean | null
          aceita_cartao_debito?: boolean | null
          aceita_dinheiro?: boolean | null
          aceita_pix?: boolean | null
          antecedencia_lembrete?: number | null
          antecedencia_maxima_agendamento?: number | null
          antecedencia_minima_agendamento?: number | null
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_padrao_produto?: number | null
          comissao_padrao_servico?: number | null
          complemento?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          duracao_padrao_atendimento?: number | null
          email?: string | null
          endereco?: string | null
          envia_lembrete_email?: boolean | null
          envia_lembrete_sms?: boolean | null
          envia_lembrete_whatsapp?: boolean | null
          estado?: string | null
          horario_funcionamento?: Json | null
          id?: string
          intervalo_entre_atendimentos?: number | null
          logo_url?: string | null
          nome_empresa?: string | null
          numero?: string | null
          permite_agendamento_online?: boolean | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_sistema_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_fixas: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          id: string
          nome: string
          observacao: string | null
          unit_id: string
          updated_at: string
          valor: number
          vencimento_dia: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          unit_id?: string
          updated_at?: string
          valor?: number
          vencimento_dia?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          unit_id?: string
          updated_at?: string
          valor?: number
          vencimento_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_fixas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_fixas_pagamentos: {
        Row: {
          conta_fixa_id: string
          created_at: string
          data_pagamento: string
          id: string
          observacao: string | null
          pago_por: string | null
          request_id: string
          transacao_id: number
          unit_id: string
          valor_pago: number
        }
        Insert: {
          conta_fixa_id: string
          created_at?: string
          data_pagamento?: string
          id?: string
          observacao?: string | null
          pago_por?: string | null
          request_id: string
          transacao_id: number
          unit_id?: string
          valor_pago: number
        }
        Update: {
          conta_fixa_id?: string
          created_at?: string
          data_pagamento?: string
          id?: string
          observacao?: string | null
          pago_por?: string | null
          request_id?: string
          transacao_id?: number
          unit_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_fixas_pagamentos_conta_fixa_id_fkey"
            columns: ["conta_fixa_id"]
            isOneToOne: false
            referencedRelation: "contas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_fixas_pagamentos_pago_por_fkey"
            columns: ["pago_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_fixas_pagamentos_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: true
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_fixas_pagamentos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_alertas: {
        Row: {
          created_at: string | null
          id: string
          mensagem: string
          produto_id: string
          resolvido: boolean | null
          tipo: string
          unit_id: string
          visualizado: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem: string
          produto_id: string
          resolvido?: boolean | null
          tipo: string
          unit_id?: string
          visualizado?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem?: string
          produto_id?: string
          resolvido?: boolean | null
          tipo?: string
          unit_id?: string
          visualizado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_alertas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_alertas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          comanda_id: number | null
          created_at: string
          estornada_em: string | null
          estornada_por: string | null
          id: string
          motivo: string | null
          motivo_estorno: string | null
          movimentacao_origem_id: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_atual: number
          request_id: string | null
          tipo: string
          unit_id: string
          usuario_id: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          comanda_id?: number | null
          created_at?: string
          estornada_em?: string | null
          estornada_por?: string | null
          id?: string
          motivo?: string | null
          motivo_estorno?: string | null
          movimentacao_origem_id?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior?: number
          quantidade_atual?: number
          request_id?: string | null
          tipo: string
          unit_id?: string
          usuario_id?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          comanda_id?: number | null
          created_at?: string
          estornada_em?: string | null
          estornada_por?: string | null
          id?: string
          motivo?: string | null
          motivo_estorno?: string | null
          movimentacao_origem_id?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_atual?: number
          request_id?: string | null
          tipo?: string
          unit_id?: string
          usuario_id?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_estornada_por_fkey"
            columns: ["estornada_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_movimentacao_origem_id_fkey"
            columns: ["movimentacao_origem_id"]
            isOneToOne: false
            referencedRelation: "estoque_movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_estabelecimento: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          id: string
          pergunta_chave: string
          resposta: string
          unit_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          id?: string
          pergunta_chave: string
          resposta: string
          unit_id?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          id?: string
          pergunta_chave?: string
          resposta?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_estabelecimento_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_caixa: {
        Row: {
          data_fechamento: string
          fechado_em: string
          fechado_por: string
          id: string
          reaberto_em: string | null
          reaberto_por: string | null
          status: string
          total_bruto: number
          total_cartao: number
          total_comissoes: number
          total_desconto: number
          total_dinheiro: number
          total_liquido: number
          total_outros: number
          total_pix: number
          unit_id: string
        }
        Insert: {
          data_fechamento: string
          fechado_em?: string
          fechado_por: string
          id?: string
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: string
          total_bruto?: number
          total_cartao?: number
          total_comissoes?: number
          total_desconto?: number
          total_dinheiro?: number
          total_liquido?: number
          total_outros?: number
          total_pix?: number
          unit_id?: string
        }
        Update: {
          data_fechamento?: string
          fechado_em?: string
          fechado_por?: string
          id?: string
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: string
          total_bruto?: number
          total_cartao?: number
          total_comissoes?: number
          total_desconto?: number
          total_dinheiro?: number
          total_liquido?: number
          total_outros?: number
          total_pix?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_caixa_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_caixa_reaberto_por_fkey"
            columns: ["reaberto_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_caixa_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean | null
          bandeira: string | null
          created_at: string | null
          desconto_percentual: number | null
          id: string
          integracao_ativa: boolean | null
          integracao_config: Json | null
          max_parcelas: number | null
          min_valor_parcela: number | null
          nome: string
          observacoes: string | null
          ordem: number | null
          permite_parcelamento: boolean | null
          taxa_fixa: number | null
          taxa_percentual: number | null
          tipo: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bandeira?: string | null
          created_at?: string | null
          desconto_percentual?: number | null
          id?: string
          integracao_ativa?: boolean | null
          integracao_config?: Json | null
          max_parcelas?: number | null
          min_valor_parcela?: number | null
          nome: string
          observacoes?: string | null
          ordem?: number | null
          permite_parcelamento?: boolean | null
          taxa_fixa?: number | null
          taxa_percentual?: number | null
          tipo: string
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bandeira?: string | null
          created_at?: string | null
          desconto_percentual?: number | null
          id?: string
          integracao_ativa?: boolean | null
          integracao_config?: Json | null
          max_parcelas?: number | null
          min_valor_parcela?: number | null
          nome?: string
          observacoes?: string | null
          ordem?: number | null
          permite_parcelamento?: boolean | null
          taxa_fixa?: number | null
          taxa_percentual?: number | null
          tipo?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          email_representante: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          nome_fantasia: string | null
          nome_representante: string | null
          observacoes: string | null
          telefone: string | null
          telefone_representante: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          email_representante?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          nome_fantasia?: string | null
          nome_representante?: string | null
          observacoes?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          email_representante?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          nome_fantasia?: string | null
          nome_representante?: string | null
          observacoes?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      fundo_caixa: {
        Row: {
          id: string
          unit_id: string
          updated_at: string
          updated_by: string | null
          valor: number
        }
        Insert: {
          id?: string
          unit_id?: string
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Update: {
          id?: string
          unit_id?: string
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fundo_caixa_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundo_caixa_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fundo_caixa_movimentacoes: {
        Row: {
          created_at: string
          criado_por: string | null
          descricao: string
          id: string
          request_id: string
          saldo_apos: number
          tipo: string
          unit_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          descricao: string
          id?: string
          request_id: string
          saldo_apos: number
          tipo: string
          unit_id?: string
          valor: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          request_id?: string
          saldo_apos?: number
          tipo?: string
          unit_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fundo_caixa_movimentacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundo_caixa_movimentacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_produtos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_produtos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_servicos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_servicos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
          unit_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
          unit_id?: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_chat_histories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          desconto: number | null
          descricao: string
          id: string
          item_id: string | null
          observacoes: string | null
          orcamento_id: string
          quantidade: number | null
          tipo: string
          unit_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          desconto?: number | null
          descricao: string
          id?: string
          item_id?: string | null
          observacoes?: string | null
          orcamento_id: string
          quantidade?: number | null
          tipo: string
          unit_id?: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          desconto?: number | null
          descricao?: string
          id?: string
          item_id?: string | null
          observacoes?: string | null
          orcamento_id?: string
          quantidade?: number | null
          tipo?: string
          unit_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          acrescimo: number | null
          cliente_id: string
          created_at: string | null
          data_aprovacao: string | null
          data_orcamento: string | null
          data_recusa: string | null
          desconto: number | null
          id: string
          motivo_recusa: string | null
          numero_orcamento: number
          observacoes: string | null
          profissional_id: string | null
          status: string | null
          subtotal: number
          termos_condicoes: string | null
          total: number
          unit_id: string
          updated_at: string | null
          validade_ate: string | null
        }
        Insert: {
          acrescimo?: number | null
          cliente_id: string
          created_at?: string | null
          data_aprovacao?: string | null
          data_orcamento?: string | null
          data_recusa?: string | null
          desconto?: number | null
          id?: string
          motivo_recusa?: string | null
          numero_orcamento?: number
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          subtotal: number
          termos_condicoes?: string | null
          total: number
          unit_id?: string
          updated_at?: string | null
          validade_ate?: string | null
        }
        Update: {
          acrescimo?: number | null
          cliente_id?: string
          created_at?: string | null
          data_aprovacao?: string | null
          data_orcamento?: string | null
          data_recusa?: string | null
          desconto?: number | null
          id?: string
          motivo_recusa?: string | null
          numero_orcamento?: number
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          subtotal?: number
          termos_condicoes?: string | null
          total?: number
          unit_id?: string
          updated_at?: string | null
          validade_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_consumos: {
        Row: {
          cliente_id: number
          created_at: string
          criado_por: string | null
          detalhes: Json
          id: string
          quantidade: number
          request_id: string
          servico_id: string
          unit_id: string
        }
        Insert: {
          cliente_id: number
          created_at?: string
          criado_por?: string | null
          detalhes?: Json
          id?: string
          quantidade: number
          request_id: string
          servico_id: string
          unit_id?: string
        }
        Update: {
          cliente_id?: number
          created_at?: string
          criado_por?: string | null
          detalhes?: Json
          id?: string
          quantidade?: number
          request_id?: string
          servico_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_consumos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_consumos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "pacote_consumos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "pacote_consumos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_consumos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_consumos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_consumos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_consumos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_operacoes: {
        Row: {
          created_at: string
          criado_por: string
          id: string
          pacote_id: string | null
          request_id: string
          resultado: Json
          unit_id: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          id?: string
          pacote_id?: string | null
          request_id: string
          resultado: Json
          unit_id?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          id?: string
          pacote_id?: string | null
          request_id?: string
          resultado?: Json
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_operacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_operacoes_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_operacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes_cliente: {
        Row: {
          cliente_cpf: string | null
          cliente_id: number | null
          comanda_origem_id: number | null
          criado_em: string
          data_validade: string | null
          id: string
          servico_id: string
          sessoes_consumidas: number
          sessoes_total: number
          source_request_id: string | null
          unit_id: string
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_id?: number | null
          comanda_origem_id?: number | null
          criado_em?: string
          data_validade?: string | null
          id?: string
          servico_id: string
          sessoes_consumidas?: number
          sessoes_total: number
          source_request_id?: string | null
          unit_id?: string
        }
        Update: {
          cliente_cpf?: string | null
          cliente_id?: number | null
          comanda_origem_id?: number | null
          criado_em?: string
          data_validade?: string | null
          id?: string
          servico_id?: string
          sessoes_consumidas?: number
          sessoes_total?: number
          source_request_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "pacotes_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "pacotes_cliente_comanda_origem_id_fkey"
            columns: ["comanda_origem_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_comanda_origem_id_fkey"
            columns: ["comanda_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "pacotes_cliente_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes_servicos: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          cor: string | null
          created_at: string | null
          desconto_percentual: number | null
          descricao: string | null
          duracao_total_minutos: number
          icone: string | null
          id: string
          max_parcelas: number | null
          nome: string
          observacoes: string | null
          permite_parcelamento: boolean | null
          preco_original: number | null
          preco_total: number
          termos_uso: string | null
          unit_id: string
          updated_at: string | null
          validade_dias: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          cor?: string | null
          created_at?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          duracao_total_minutos?: number
          icone?: string | null
          id?: string
          max_parcelas?: number | null
          nome: string
          observacoes?: string | null
          permite_parcelamento?: boolean | null
          preco_original?: number | null
          preco_total: number
          termos_uso?: string | null
          unit_id?: string
          updated_at?: string | null
          validade_dias?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          cor?: string | null
          created_at?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          duracao_total_minutos?: number
          icone?: string | null
          id?: string
          max_parcelas?: number | null
          nome?: string
          observacoes?: string | null
          permite_parcelamento?: boolean | null
          preco_original?: number | null
          preco_total?: number
          termos_uso?: string | null
          unit_id?: string
          updated_at?: string | null
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_servicos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes_servicos_itens: {
        Row: {
          created_at: string | null
          id: string
          obrigatorio: boolean | null
          observacoes: string | null
          ordem: number | null
          pacote_id: string
          preco_unitario: number | null
          quantidade: number | null
          servico_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          ordem?: number | null
          pacote_id: string
          preco_unitario?: number | null
          quantidade?: number | null
          servico_id: string
          unit_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          ordem?: number | null
          pacote_id?: string
          preco_unitario?: number | null
          quantidade?: number | null
          servico_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_servicos_itens_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_servicos_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_servicos_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_servicos_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_servicos_itens_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_operacoes: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          produto_id: string
          request_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          produto_id: string
          request_id: string
          unit_id?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          produto_id?: string
          request_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_operacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_operacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_operacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          codigo: string | null
          codigo_barras: string | null
          controla_estoque: boolean | null
          created_at: string | null
          descricao: string | null
          fornecedor_id: string | null
          gera_comissao: boolean | null
          grupo_id: string | null
          id: string
          localizacao: string | null
          margem_lucro: number | null
          nome: string
          observacoes: string | null
          percentual_comissao: number | null
          permite_venda_estoque_negativo: boolean | null
          preco_custo: number | null
          preco_venda: number
          quantidade: number | null
          quantidade_minima: number | null
          tipo: string | null
          unidade_medida: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          controla_estoque?: boolean | null
          created_at?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          gera_comissao?: boolean | null
          grupo_id?: string | null
          id?: string
          localizacao?: string | null
          margem_lucro?: number | null
          nome: string
          observacoes?: string | null
          percentual_comissao?: number | null
          permite_venda_estoque_negativo?: boolean | null
          preco_custo?: number | null
          preco_venda: number
          quantidade?: number | null
          quantidade_minima?: number | null
          tipo?: string | null
          unidade_medida?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          controla_estoque?: boolean | null
          created_at?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          gera_comissao?: boolean | null
          grupo_id?: string | null
          id?: string
          localizacao?: string | null
          margem_lucro?: number | null
          nome?: string
          observacoes?: string | null
          percentual_comissao?: number | null
          permite_venda_estoque_negativo?: boolean | null
          preco_custo?: number | null
          preco_venda?: number
          quantidade?: number | null
          quantidade_minima?: number | null
          tipo?: string | null
          unidade_medida?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          apelido: string | null
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          comissoes_por_grupo: Json | null
          cor_agenda: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          dias_trabalho: number[] | null
          é_auxiliar: boolean | null
          email: string
          endereco: string | null
          estado: string | null
          foto_url: string | null
          google_calendar_id: string | null
          grupos: Json | null
          grupos_ids: string[] | null
          hora_fim: string | null
          hora_inicio: string | null
          horario_personalizado: boolean | null
          horarios_por_dia: Json | null
          id: string
          nome: string
          observacoes: string | null
          percentual_comissao: number | null
          recebe_comissao: boolean | null
          salario_fixo: number | null
          senha_app: string | null
          servicos_habilitados: Json | null
          telefone: string | null
          tem_salario_fixo: boolean | null
          tipo_contrato: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          comissoes_por_grupo?: Json | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dias_trabalho?: number[] | null
          é_auxiliar?: boolean | null
          email: string
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          google_calendar_id?: string | null
          grupos?: Json | null
          grupos_ids?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horario_personalizado?: boolean | null
          horarios_por_dia?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          percentual_comissao?: number | null
          recebe_comissao?: boolean | null
          salario_fixo?: number | null
          senha_app?: string | null
          servicos_habilitados?: Json | null
          telefone?: string | null
          tem_salario_fixo?: boolean | null
          tipo_contrato?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          apelido?: string | null
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          comissoes_por_grupo?: Json | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dias_trabalho?: number[] | null
          é_auxiliar?: boolean | null
          email?: string
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          google_calendar_id?: string | null
          grupos?: Json | null
          grupos_ids?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horario_personalizado?: boolean | null
          horarios_por_dia?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_comissao?: number | null
          recebe_comissao?: boolean | null
          salario_fixo?: number | null
          senha_app?: string | null
          servicos_habilitados?: Json | null
          telefone?: string | null
          tem_salario_fixo?: boolean | null
          tipo_contrato?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_horarios: {
        Row: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          profissional_id: string | null
          unit_id: string
        }
        Insert: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
          profissional_id?: string | null
          unit_id?: string
        }
        Update: {
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          profissional_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_horarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_horarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "profissional_horarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "profissional_horarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_horarios_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      promocoes: {
        Row: {
          aplica_em: string
          aplica_primeiro_atendimento: boolean | null
          aplica_todos_clientes: boolean | null
          ativo: boolean | null
          codigo: string | null
          cor: string | null
          created_at: string | null
          cupom: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          destaque: boolean | null
          dias_semana: Json | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          maximo_usos_por_cliente: number | null
          nome: string
          observacoes: string | null
          permite_combinar_comissao: boolean | null
          permite_combinar_outras_promocoes: boolean | null
          quantidade_maxima_usos: number | null
          quantidade_usos_atual: number | null
          requer_cupom: boolean | null
          tipo_desconto: string
          unit_id: string
          updated_at: string | null
          valor_desconto: number
          valor_minimo: number | null
        }
        Insert: {
          aplica_em: string
          aplica_primeiro_atendimento?: boolean | null
          aplica_todos_clientes?: boolean | null
          ativo?: boolean | null
          codigo?: string | null
          cor?: string | null
          created_at?: string | null
          cupom?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          destaque?: boolean | null
          dias_semana?: Json | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          maximo_usos_por_cliente?: number | null
          nome: string
          observacoes?: string | null
          permite_combinar_comissao?: boolean | null
          permite_combinar_outras_promocoes?: boolean | null
          quantidade_maxima_usos?: number | null
          quantidade_usos_atual?: number | null
          requer_cupom?: boolean | null
          tipo_desconto: string
          unit_id?: string
          updated_at?: string | null
          valor_desconto: number
          valor_minimo?: number | null
        }
        Update: {
          aplica_em?: string
          aplica_primeiro_atendimento?: boolean | null
          aplica_todos_clientes?: boolean | null
          ativo?: boolean | null
          codigo?: string | null
          cor?: string | null
          created_at?: string | null
          cupom?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          destaque?: boolean | null
          dias_semana?: Json | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          maximo_usos_por_cliente?: number | null
          nome?: string
          observacoes?: string | null
          permite_combinar_comissao?: boolean | null
          permite_combinar_outras_promocoes?: boolean | null
          quantidade_maxima_usos?: number | null
          quantidade_usos_atual?: number | null
          requer_cupom?: boolean | null
          tipo_desconto?: string
          unit_id?: string
          updated_at?: string | null
          valor_desconto?: number
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promocoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuarios: {
        Row: {
          cliente_id: number
          created_at: string | null
          data_atendimento: string
          data_retorno: string | null
          forma_pagamento: string | null
          fotos_antes: Json | null
          fotos_depois: Json | null
          id: string
          observacoes_atendimento: string | null
          produtos_utilizados: Json | null
          profissional_id: string | null
          recomendacoes: string | null
          resultado_obtido: string | null
          retorno_necessario: boolean | null
          satisfacao_cliente: number | null
          servicos_realizados: Json | null
          tecnicas_aplicadas: string | null
          tempo_duracao: number | null
          unit_id: string
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id: number
          created_at?: string | null
          data_atendimento: string
          data_retorno?: string | null
          forma_pagamento?: string | null
          fotos_antes?: Json | null
          fotos_depois?: Json | null
          id?: string
          observacoes_atendimento?: string | null
          produtos_utilizados?: Json | null
          profissional_id?: string | null
          recomendacoes?: string | null
          resultado_obtido?: string | null
          retorno_necessario?: boolean | null
          satisfacao_cliente?: number | null
          servicos_realizados?: Json | null
          tecnicas_aplicadas?: string | null
          tempo_duracao?: number | null
          unit_id?: string
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: number
          created_at?: string | null
          data_atendimento?: string
          data_retorno?: string | null
          forma_pagamento?: string | null
          fotos_antes?: Json | null
          fotos_depois?: Json | null
          id?: string
          observacoes_atendimento?: string | null
          produtos_utilizados?: Json | null
          profissional_id?: string | null
          recomendacoes?: string | null
          resultado_obtido?: string | null
          retorno_necessario?: boolean | null
          satisfacao_cliente?: number | null
          servicos_realizados?: Json | null
          tecnicas_aplicadas?: string | null
          tempo_duracao?: number | null
          unit_id?: string
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "prontuarios_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          desconto_maximo_percentual: number | null
          descricao: string | null
          id: string
          nivel: number
          nome: string
          permissoes_agenda: Json | null
          permissoes_clientes: Json | null
          permissoes_configuracoes: Json | null
          permissoes_financeiro: Json | null
          permissoes_produtos: Json | null
          permissoes_profissionais: Json | null
          permissoes_relatorios: Json | null
          permissoes_servicos: Json | null
          permissoes_usuarios: Json | null
          pode_abrir_caixa: boolean | null
          pode_acessar_todos_profissionais: boolean | null
          pode_cancelar_venda: boolean | null
          pode_dar_desconto: boolean | null
          pode_editar_comissao: boolean | null
          pode_fechar_caixa: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          desconto_maximo_percentual?: number | null
          descricao?: string | null
          id?: string
          nivel?: number
          nome: string
          permissoes_agenda?: Json | null
          permissoes_clientes?: Json | null
          permissoes_configuracoes?: Json | null
          permissoes_financeiro?: Json | null
          permissoes_produtos?: Json | null
          permissoes_profissionais?: Json | null
          permissoes_relatorios?: Json | null
          permissoes_servicos?: Json | null
          permissoes_usuarios?: Json | null
          pode_abrir_caixa?: boolean | null
          pode_acessar_todos_profissionais?: boolean | null
          pode_cancelar_venda?: boolean | null
          pode_dar_desconto?: boolean | null
          pode_editar_comissao?: boolean | null
          pode_fechar_caixa?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          desconto_maximo_percentual?: number | null
          descricao?: string | null
          id?: string
          nivel?: number
          nome?: string
          permissoes_agenda?: Json | null
          permissoes_clientes?: Json | null
          permissoes_configuracoes?: Json | null
          permissoes_financeiro?: Json | null
          permissoes_produtos?: Json | null
          permissoes_profissionais?: Json | null
          permissoes_relatorios?: Json | null
          permissoes_servicos?: Json | null
          permissoes_usuarios?: Json | null
          pode_abrir_caixa?: boolean | null
          pode_acessar_todos_profissionais?: boolean | null
          pode_cancelar_venda?: boolean | null
          pode_dar_desconto?: boolean | null
          pode_editar_comissao?: boolean | null
          pode_fechar_caixa?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      servico_etapas: {
        Row: {
          ativo: boolean | null
          comissao_percentual: number | null
          comissao_tipo: string | null
          comissao_valor: number | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number
          exige_profissional: boolean
          id: string
          nome: string
          ordem: number
          pode_ter_auxiliar: boolean | null
          servico_id: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          exige_profissional?: boolean
          id?: string
          nome: string
          ordem: number
          pode_ter_auxiliar?: boolean | null
          servico_id: string
          unit_id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          exige_profissional?: boolean
          id?: string
          nome?: string
          ordem?: number
          pode_ter_auxiliar?: boolean | null
          servico_id?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servico_etapas_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_etapas_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_etapas_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_etapas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      servico_operacoes: {
        Row: {
          created_at: string
          criado_por: string
          id: string
          request_id: string
          resultado: Json
          servico_id: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          id?: string
          request_id: string
          resultado: Json
          servico_id?: string | null
          unit_id?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          id?: string
          request_id?: string
          resultado?: Json
          servico_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servico_operacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_operacoes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_operacoes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_operacoes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_operacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          aceita_agendamento: boolean | null
          ativo: boolean | null
          categoria: string | null
          codigo: string | null
          comissao_profissional: number | null
          created_at: string | null
          criterio_indicacao: string | null
          descricao: string | null
          duracao: number | null
          duracao_calculada: boolean | null
          duracao_minutos: number
          exige_profissional_especifico: boolean | null
          grupo_id: string | null
          id: string
          instrucoes_profissional: string | null
          nome: string
          observacoes: string | null
          permite_desconto: boolean | null
          preco: number
          preco_promocional: number | null
          tem_etapas: boolean | null
          tempo_preparo_minutos: number | null
          termos_busca: string[] | null
          unit_id: string
          updated_at: string | null
          usa_produtos: boolean | null
        }
        Insert: {
          aceita_agendamento?: boolean | null
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          comissao_profissional?: number | null
          created_at?: string | null
          criterio_indicacao?: string | null
          descricao?: string | null
          duracao?: number | null
          duracao_calculada?: boolean | null
          duracao_minutos?: number
          exige_profissional_especifico?: boolean | null
          grupo_id?: string | null
          id?: string
          instrucoes_profissional?: string | null
          nome: string
          observacoes?: string | null
          permite_desconto?: boolean | null
          preco: number
          preco_promocional?: number | null
          tem_etapas?: boolean | null
          tempo_preparo_minutos?: number | null
          termos_busca?: string[] | null
          unit_id?: string
          updated_at?: string | null
          usa_produtos?: boolean | null
        }
        Update: {
          aceita_agendamento?: boolean | null
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          comissao_profissional?: number | null
          created_at?: string | null
          criterio_indicacao?: string | null
          descricao?: string | null
          duracao?: number | null
          duracao_calculada?: boolean | null
          duracao_minutos?: number
          exige_profissional_especifico?: boolean | null
          grupo_id?: string | null
          id?: string
          instrucoes_profissional?: string | null
          nome?: string
          observacoes?: string | null
          permite_desconto?: boolean | null
          preco?: number
          preco_promocional?: number | null
          tem_etapas?: boolean | null
          tempo_preparo_minutos?: number | null
          termos_busca?: string[] | null
          unit_id?: string
          updated_at?: string | null
          usa_produtos?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_produtos: {
        Row: {
          criado_em: string
          id: string
          produto_id: string
          quantidade_media: number
          servico_id: string
          unit_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          produto_id: string
          quantidade_media: number
          servico_id: string
          unit_id?: string
        }
        Update: {
          criado_em?: string
          id?: string
          produto_id?: string
          quantidade_media?: number
          servico_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_produtos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_produtos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_com_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_produtos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_servicos_n8n"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_produtos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          agendamento_id: string | null
          categoria: string
          comanda_id: number | null
          created_at: string | null
          criado_por: string | null
          data: string
          descricao: string
          estorno_movimentacao_id: string | null
          forma_pagamento_id: string | null
          id: number
          metodo: string
          parcelas: number
          bandeira: string | null
          profissional_id: string | null
          request_id: string | null
          tipo: string
          unit_id: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria: string
          comanda_id?: number | null
          created_at?: string | null
          criado_por?: string | null
          data: string
          descricao: string
          estorno_movimentacao_id?: string | null
          forma_pagamento_id?: string | null
          id?: number
          metodo: string
          parcelas?: number
          bandeira?: string | null
          profissional_id?: string | null
          request_id?: string | null
          tipo: string
          unit_id?: string
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string
          comanda_id?: number | null
          created_at?: string | null
          criado_por?: string | null
          data?: string
          descricao?: string
          estorno_movimentacao_id?: string | null
          forma_pagamento_id?: string | null
          id?: number
          metodo?: string
          parcelas?: number
          bandeira?: string | null
          profissional_id?: string | null
          request_id?: string | null
          tipo?: string
          unit_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "transacoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
          {
            foreignKeyName: "transacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_estorno_movimentacao_id_fkey"
            columns: ["estorno_movimentacao_id"]
            isOneToOne: false
            referencedRelation: "estoque_movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "transacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "transacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          opening_hours: Json | null
          phone: string
          pix_key: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          opening_hours?: Json | null
          phone?: string
          pix_key?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          opening_hours?: Json | null
          phone?: string
          pix_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_units: {
        Row: {
          created_at: string
          is_active: boolean
          is_default: boolean
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          is_default?: boolean
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          is_default?: boolean
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          auth_id: string | null
          avatar_url: string | null
          bloqueado_ate: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          data_nascimento: string | null
          deleted_at: string | null
          email: string
          id: string
          idioma: string | null
          ip_ultimo_acesso: string | null
          nome: string
          notificacoes_email: boolean | null
          notificacoes_push: boolean | null
          notificacoes_sistema: boolean | null
          observacoes: string | null
          permissoes_customizadas: Json | null
          primeiro_acesso: boolean | null
          profissional_id: string | null
          role_id: string | null
          senha_hash: string | null
          senha_temporaria: boolean | null
          telefone: string | null
          tema: string | null
          tentativas_login: number | null
          timezone: string | null
          ultimo_acesso: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          idioma?: string | null
          ip_ultimo_acesso?: string | null
          nome: string
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          notificacoes_sistema?: boolean | null
          observacoes?: string | null
          permissoes_customizadas?: Json | null
          primeiro_acesso?: boolean | null
          profissional_id?: string | null
          role_id?: string | null
          senha_hash?: string | null
          senha_temporaria?: boolean | null
          telefone?: string | null
          tema?: string | null
          tentativas_login?: number | null
          timezone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          idioma?: string | null
          ip_ultimo_acesso?: string | null
          nome?: string
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          notificacoes_sistema?: boolean | null
          observacoes?: string | null
          permissoes_customizadas?: Json | null
          primeiro_acesso?: boolean | null
          profissional_id?: string | null
          role_id?: string | null
          senha_hash?: string | null
          senha_temporaria?: boolean | null
          telefone?: string | null
          tema?: string | null
          tentativas_login?: number | null
          timezone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_sessoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dispositivo: string | null
          expira_em: string
          id: string
          ip_address: string | null
          navegador: string | null
          refresh_token: string | null
          token: string
          ultima_atividade: string | null
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dispositivo?: string | null
          expira_em: string
          id?: string
          ip_address?: string | null
          navegador?: string | null
          refresh_token?: string | null
          token: string
          ultima_atividade?: string | null
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dispositivo?: string | null
          expira_em?: string
          id?: string
          ip_address?: string | null
          navegador?: string | null
          refresh_token?: string | null
          token?: string
          ultima_atividade?: string | null
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_sessoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_log: {
        Row: {
          criado_em: string
          endpoint: string
          erro: string | null
          id: string
          payload: Json | null
          status_code: number | null
          unit_id: string
        }
        Insert: {
          criado_em?: string
          endpoint: string
          erro?: string | null
          id?: string
          payload?: Json | null
          status_code?: number | null
          unit_id?: string
        }
        Update: {
          criado_em?: string
          endpoint?: string
          erro?: string | null
          id?: string
          payload?: Json | null
          status_code?: number | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_log_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_agendamentos_completos: {
        Row: {
          auxiliar_id: string | null
          auxiliar_nome: string | null
          cliente_email: string | null
          cliente_id: number | null
          cliente_nome: string | null
          cliente_telefone: string | null
          comanda_id: number | null
          comanda_status: string | null
          concluido_em: string | null
          confirmado_em: string | null
          created_at: string | null
          data_agendamento: string | null
          duracao_total: number | null
          etapas: Json | null
          grupo_cor: string | null
          grupo_nome: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string | null
          numero_comanda: number | null
          observacoes: string | null
          observacoes_internas: string | null
          profissional_cor: string | null
          profissional_id: string | null
          profissional_nome: string | null
          profissional_telefone: string | null
          servicos: Json | null
          status: string | null
          tem_etapas: boolean | null
          updated_at: string | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "vw_etapas_agendadas"
            referencedColumns: ["comanda_id"]
          },
        ]
      }
      vw_blocos_ocupados: {
        Row: {
          cliente_nome: string | null
          data: string | null
          hora_fim: string | null
          hora_inicio: string | null
          profissional_id: string | null
          referencia_id: string | null
          status: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_comanda_item_etapas_completas: {
        Row: {
          auxiliar_id: string | null
          auxiliar_nome: string | null
          comanda_item_id: number | null
          concluido_em: string | null
          created_at: string | null
          duracao_minutos: number | null
          id: string | null
          iniciado_em: string | null
          nome_etapa: string | null
          ordem: number | null
          profissional_cor: string | null
          profissional_id: string | null
          profissional_nome: string | null
          servico_etapa_id: string | null
          status_etapa: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_etapa_id_fkey"
            columns: ["servico_etapa_id"]
            isOneToOne: false
            referencedRelation: "servico_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_etapas_agendadas: {
        Row: {
          agendamento_hora_inicio: string | null
          agendamento_id: string | null
          auxiliar_id: string | null
          cliente_id: number | null
          cliente_nome: string | null
          comanda_id: number | null
          comanda_item_id: number | null
          data_agendamento: string | null
          duracao_minutos: number | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string | null
          nome_etapa: string | null
          ordem: number | null
          profissional_id: string | null
          servico_etapa_id: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_etapa_id_fkey"
            columns: ["servico_etapa_id"]
            isOneToOne: false
            referencedRelation: "servico_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["auxiliar_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_completos"
            referencedColumns: ["profissional_id"]
          },
          {
            foreignKeyName: "comanda_item_etapas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "vw_profissionais_com_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_profissionais_com_grupos: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          comissoes_por_grupo: Json | null
          cor_agenda: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          dias_trabalho: number[] | null
          é_auxiliar: boolean | null
          email: string | null
          endereco: string | null
          estado: string | null
          google_calendar_id: string | null
          grupos: Json | null
          grupos_ids: string[] | null
          hora_fim: string | null
          hora_inicio: string | null
          horario_personalizado: boolean | null
          horarios_por_dia: Json | null
          id: string | null
          nome: string | null
          nomes_grupos: string[] | null
          observacoes: string | null
          percentual_comissao: number | null
          recebe_comissao: boolean | null
          salario_fixo: number | null
          senha_app: string | null
          servicos_habilitados: Json | null
          telefone: string | null
          tem_salario_fixo: boolean | null
          tipo_contrato: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_servicos_com_etapas: {
        Row: {
          codigo: string | null
          duracao_calculada: boolean | null
          duracao_etapas: number | null
          duracao_minutos: number | null
          etapas: Json | null
          grupo_cor: string | null
          grupo_nome: string | null
          id: string | null
          nome: string | null
          preco: number | null
          tem_etapas: boolean | null
          total_etapas: number | null
        }
        Relationships: []
      }
      vw_servicos_n8n: {
        Row: {
          ativo: boolean | null
          auxiliares: Json | null
          codigo: string | null
          duracao_calculada: boolean | null
          duracao_soma_etapas: number | null
          duracao_total: number | null
          etapas: Json | null
          grupo_cor: string | null
          grupo_nome: string | null
          id: string | null
          nome: string | null
          preco: number | null
          profissionais_principais: Json | null
          tem_etapas: boolean | null
          total_etapas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_cash_fund_atomic: {
        Args: {
          p_actor_id: string
          p_amount: number
          p_description: string
          p_request_id: string
          p_type: string
          p_unit_id: string
        }
        Returns: Json
      }
      adjust_inventory_atomic: {
        Args: {
          p_admin_id: string
          p_movement_type: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_unit_value: number
        }
        Returns: Json
      }
      calcular_desconto_promocao: {
        Args: { p_promocao_id: string; p_valor_original: number }
        Returns: number
      }
      calcular_duracao_servico: {
        Args: { p_servico_id: string }
        Returns: number
      }
      calcular_duracao_total_comanda: {
        Args: { p_comanda_id: number }
        Returns: number
      }
      calcular_totais_pacote: {
        Args: { p_pacote_id: string }
        Returns: undefined
      }
      cancel_comanda_atomic: {
        Args: { p_admin_id: string; p_comanda_id: number }
        Returns: Json
      }
      close_appointment_atomic: {
        Args: {
          p_admin_id: string
          p_appointment_id: string
          p_payment_method: string
          p_unit_id: string
        }
        Returns: Json
      }
      close_comanda_atomic: {
        Args: {
          p_admin_id: string
          p_comanda_id: number
          p_discount: number
          p_payment_method: string
          p_unit_id: string
        }
        Returns: Json
      }
      consume_package_sessions_atomic: {
        Args: {
          p_actor_id: string
          p_client_id: number
          p_quantity: number
          p_request_id: string
          p_service_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      criar_agendamento_da_comanda: {
        Args: { p_comanda_id: number }
        Returns: string
      }
      criar_etapa_padrao_servico: {
        Args: {
          p_duracao_atual?: number
          p_nome_etapa?: string
          p_servico_id: string
        }
        Returns: string
      }
      debitar_sessao_pacote: { Args: { p_pacote_id: string }; Returns: boolean }
      decrement_product_quantity: {
        Args: { product_id: string; quantity_to_remove: number }
        Returns: undefined
      }
      delete_service_catalog_atomic: {
        Args: { p_service_id: string }
        Returns: Json
      }
      delete_standalone_appointment_atomic: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      excluir_comanda: { Args: { p_comanda_id: number }; Returns: undefined }
      finalize_quick_sale_atomic: {
        Args: {
          p_admin_id: string
          p_client_id: number
          p_items: Json
          p_payment_method: string
          p_request_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      fn_buscar_horario_disponivel: {
        Args: {
          p_data: string
          p_preferencia_horario?: string
          p_profissional_principal?: string
          p_servico_id: string
        }
        Returns: {
          auxiliar_id: string
          horario: string
          profissional_id: string
        }[]
      }
      fn_gravar_agendamento: { Args: { p_payload: Json }; Returns: Json }
      fn_horarios_vagos: {
        Args: {
          p_data: string
          p_duracao_minutos?: number
          p_profissional_id: string
        }
        Returns: {
          hora_fim: string
          hora_inicio: string
          livre: boolean
        }[]
      }
      gerar_numero_comanda: { Args: never; Returns: number }
      get_financial_stats: {
        Args: { p_month_start: string; p_today: string; p_unit_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      limpar_sessoes_expiradas: { Args: never; Returns: number }
      pay_fixed_account_atomic: {
        Args: {
          p_actor_id: string
          p_amount: number
          p_fixed_account_id: string
          p_note: string
          p_payment_date: string
          p_request_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      process_product_sale_atomic: {
        Args: {
          p_admin_id: string
          p_installments: number
          p_items: Json
          p_payment_method: string
          p_professional_id: string
          p_request_id: string
          p_sale_type: string
          p_unit_id: string
        }
        Returns: Json
      }
      provision_app_user_atomic: {
        Args: {
          p_active: boolean
          p_actor_id: string
          p_auth_id: string
          p_birth_date: string
          p_cpf: string
          p_email: string
          p_name: string
          p_notes: string
          p_phone: string
          p_role: string
          p_role_id: string
          p_temporary_password: boolean
          p_unit_id: string
        }
        Returns: Json
      }
      registrar_log_acao: {
        Args: {
          p_acao: string
          p_dados_anteriores?: Json
          p_dados_novos?: Json
          p_ip_address?: string
          p_modulo?: string
          p_registro_id?: string
          p_user_agent?: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      registrar_movimentacao_estoque: {
        Args: {
          p_cliente_id?: string
          p_documento?: string
          p_motivo?: string
          p_produto_id: string
          p_profissional_id?: string
          p_quantidade: number
          p_tipo: string
          p_usuario_id?: string
          p_valor_unitario: number
          p_venda_id?: string
        }
        Returns: undefined
      }
      restore_deleted_record_atomic: {
        Args: { p_actor_id: string; p_archive_id: string }
        Returns: Json
      }
      reverse_stock_sale_atomic: {
        Args: {
          p_admin_id: string
          p_movement_id: string
          p_reason: string
          p_unit_id: string
        }
        Returns: Json
      }
      save_comanda_atomic: {
        Args: {
          p_admin_id: string
          p_auxiliary_id: string
          p_client_id: number
          p_comanda_id: number
          p_items: Json
          p_notes: string
          p_professional_id: string
          p_schedule_date: string
          p_start_time: string
          p_unit_id: string
        }
        Returns: Json
      }
      save_product_atomic: {
        Args: {
          p_actor_id: string
          p_payload: Json
          p_product_id: string
          p_request_id: string
        }
        Returns: Json
      }
      save_service_catalog_atomic: {
        Args: {
          p_actor_id: string
          p_payload: Json
          p_request_id: string
          p_service_id: string
          p_stages: Json
        }
        Returns: Json
      }
      save_service_package_atomic: {
        Args: {
          p_actor_id: string
          p_items: Json
          p_package_id: string
          p_payload: Json
          p_request_id: string
        }
        Returns: Json
      }
      sell_package_atomic: {
        Args: {
          p_admin_id: string
          p_client_id: number
          p_package_id: string
          p_payment_method: string
          p_quantity: number
          p_request_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      sincronizar_comandas_existentes: {
        Args: never
        Returns: {
          agendamento_id: string
          comanda_id: number
          status: string
        }[]
      }
      start_appointment_atomic: {
        Args: { p_admin_id: string; p_appointment_id: string }
        Returns: Json
      }
      validar_promocao: {
        Args: {
          p_cliente_id?: string
          p_data?: string
          p_dia_semana?: string
          p_hora?: string
          p_promocao_id: string
          p_valor_total?: number
        }
        Returns: boolean
      }
      verificar_conflito_horario: {
        Args: {
          p_agendamento_id?: string
          p_data: string
          p_hora_fim: string
          p_hora_inicio: string
          p_profissional_id: string
        }
        Returns: boolean
      }
      verificar_conflito_horario_v2: {
        Args: {
          p_agendamento_id?: string
          p_data: string
          p_etapa_id?: string
          p_hora_fim: string
          p_hora_inicio: string
          p_profissional_id: string
        }
        Returns: boolean
      }
      verificar_permissao: {
        Args: { p_acao: string; p_modulo: string; p_usuario_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
