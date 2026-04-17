# ROADMAP — Otimiza Beauty Manager

_Última atualização: 02/04/2026_

## Status Atual: V1 (Produção) → V2 (Em Planejamento)

---

## ✅ V1 — Concluído (Em Produção)

| Feature | Status |
|---------|--------|
| Auth + RBAC (admin/professional/client) | ✅ |
| Login / Logout / Sessão | ✅ |
| CRUD Profissionais | ✅ |
| CRUD Serviços + Grupos + Pacotes + Etapas | ✅ |
| CRUD Produtos (revenda + uso interno) | ✅ |
| Comandas / POS | ✅ |
| Agenda com verificação de conflito | ✅ |
| Financeiro + Comissões | ✅ |
| Dashboard KPI | ✅ |
| Relatórios + Export PDF/Excel | ✅ |
| WhatsApp bot via n8n | ✅ |
| Deploy Vercel | ✅ |

---

## 🔧 V2 — Correções Urgentes (Próxima Sprint)

_Prioridade: segurança + estabilidade. Sistema em produção com usuários reais._

| # | Feature | Esforço | Concern |
|---|---------|---------|---------|
| 1 | `middleware.ts` — proteger rotas server-side | Médio | C-001 |
| 2 | Role check em API routes admin | Médio | C-003 |
| 3 | RLS por unit_id (isolamento multi-tenant) | Alto | C-002 |
| 4 | Remover tabelas legadas (DROP appointments, services, etc.) | Baixo | C-009 |
| 5 | Executar `VIEWS_HORARIOS_VAGOS.sql` | Baixo | TASKS #1 |
| 6 | Separar páginas estoque/produtos por tipo | Baixo | TASKS #3 |
| 7 | Baixa automática de estoque em comandas | Médio | TASKS #5 |
| 8 | Validar cards do Dashboard com schema novo | Baixo | TASKS #7 |

---

## 🚀 V3 — Agenda em Tempo Real (Feature Principal)

_Prioridade declarada pelo sistema: maior dor atual._

| # | Feature | Esforço |
|---|---------|---------|
| 1 | Supabase Realtime na agenda (atualização ao vivo) | Alto |
| 2 | Drag-and-drop de horários com etapas | Alto |
| 3 | Disponibilidade em tempo real no agendamento público | Alto |
| 4 | Notificação de novo agendamento para profissional (PWA) | Médio |
| 5 | Bloqueio de horário via PWA profissional | Médio |

---

## 💡 V4 — Multi-Tenancy Completo

| # | Feature | Esforço |
|---|---------|---------|
| 1 | UI para cadastro de novos salões (tenants) | Alto |
| 2 | Dashboard de super-admin (visão multi-salão) | Alto |
| 3 | Billing/planos por tenant | Muito Alto |
| 4 | Onboarding wizard para novo salão | Médio |

---

## 🔮 Backlog / Deferred

- Fidelidade / pontos para clientes
- Anamnese digital (já tem base)
- App mobile nativo (PWA atual é intermediário)
- Gateway de pagamento online
- Integração com agenda do Google Calendar
- Relatórios customizáveis por tenant
