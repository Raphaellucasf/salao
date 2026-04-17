# PROJECT — Otimiza Beauty Manager

_Última atualização: 02/04/2026_

## Visão

**SaaS multi-tenant** para gestão completa de salões de beleza. Cada salão é um tenant isolado. O sistema cobre: agendamento online, gestão de profissionais, financeiro/comandas, estoque, relatórios e automação via WhatsApp.

## Problema que Resolve

Salões usam processos manuais (cadernos, WhatsApp informal, planilhas) que causam:
- Conflitos de agenda
- Perda de receita por falta de controle de comissões
- Nenhuma rastreabilidade financeira
- Zero visibilidade de estoque

## Público-Alvo

| Persona | Descrição | Necessidade Principal |
|---------|-----------|----------------------|
| **Proprietário / Admin** | Dono do salão, controla tudo | Dashboard KPI, financeiro, relatórios |
| **Recepcionista** | Cria/gerencia agendamentos | Agenda rápida, comandas, busca de clientes |
| **Profissional** | Executa atendimentos | Ver própria agenda (PWA), comissões |
| **Cliente Final** | Agenda online | Fluxo de agendamento público simples |

## Contexto Técnico

- **Stack**: Next.js 16, React 19, TypeScript (strict), Tailwind 4, Supabase
- **Deploy**: Vercel (produção ativa)
- **Integração ativa**: n8n + WhatsApp para notificações automáticas
- **Modelo**: SaaS multi-tenant — tabela `units` como tenant boundary

## Escopo Atual (V1 — Em Produção)

**Inclui:**
- Autenticação RBAC (admin / professional / client)
- Módulo de profissionais (CRUD completo)
- Módulo de serviços com grupos, pacotes, etapas
- Módulo de produtos (revenda + uso interno)
- Módulo de comandas / POS
- Agenda visual com verificação de disponibilidade
- Financeiro básico (comissões, fechamento)
- Relatórios e exportação (PDF/Excel)
- Dashboard com KPIs
- WhatsApp bot integration via n8n

**Fora do escopo atual:**
- Pagamento online / gateway de pagamento
- App mobile nativo (iOS/Android)
- Multi-idioma

## Dívida Técnica Crítica (Herdada)

Ver [CONCERNS.md](CONCERNS.md) — itens C-001 a C-005 são bloqueadores de segurança.

## Meta V2 (Próxima Fase)

1. Corrigir gaps de segurança (C-001 a C-005)
2. Completar agenda com disponibilidade em tempo real (Supabase Realtime)
3. Finalizar migração de schema (remover tabelas legadas em inglês)
4. Fortalecer multi-tenancy (RLS por unit_id)
5. Melhorar PWA de profissionais
