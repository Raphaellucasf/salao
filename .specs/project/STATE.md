# STATE — Otimiza Beauty Manager

_Memória persistente do projeto. Atualizar a cada sessão de trabalho._

---

## 📌 Sessão Atual: 02/04/2026

### Contexto da Sessão
- Mapeamento brownfield completo executado
- Projeto rodando em `http://localhost:3001`
- **V2 Sprint 1 — Correções de Segurança: CONCLUÍDO**

### ✅ Implementado nesta sessão
| Item | Arquivo | Status |
|------|---------|--------|
| Middleware de auth server-side | `src/middleware.ts` | ✅ Compilando, 200 OK |
| Helper de role check | `src/lib/api-auth.ts` | ✅ Sem erros TS |
| Role check em create-user | `src/app/api/admin/create-user/route.ts` | ✅ |
| Role check em update-user-role | `src/app/api/admin/update-user-role/route.ts` | ✅ |
| SQL RLS Fase 1 | `database/fix_rls_tenant_isolation.sql` | ✅ Pronto p/ aplicar |

### ⚠️ Nota técnica
- `@supabase/ssr` NÃO é compatível com Edge Runtime do Next.js 16 neste projeto
- `middleware.ts` usa verificação de cookie simples (sem Supabase) — seguro como camada 1
- Verificação JWT completa ocorre server-side via `requireAdmin()` (camada 2)
- Próxima melhoria: usar `jose` para verificar JWT Supabase no middleware sem SSR


---

## ✅ Decisões Confirmadas

| # | Decisão | Data | Impacto |
|---|---------|------|---------|
| D-001 | **SaaS multi-tenant** (não single-tenant) | 02/04/2026 | Requer RLS por unit_id, billing futuro |
| D-002 | **Agenda** é a dor principal do sistema | 02/04/2026 | V3 foca em agenda em tempo real |
| D-003 | **WhatsApp via n8n** está em produção, só manutenção | 02/04/2026 | Não reescrever integração |
| D-004 | **Schema novo** = tabelas em português (agendamentos, profissionais, etc.) | 02/04/2026 | Tabelas em inglês são legadas |
| D-005 | Deploy na **Vercel** como plataforma primária | 02/04/2026 | Edge functions disponíveis |

---

## 🚧 Bloqueadores Ativos

| # | Bloqueador | Severity | Resolução |
|---|-----------|----------|-----------|
| ~~B-001~~ | ~~Sem `middleware.ts`~~ | ~~🔴 Crítico~~ | ✅ Resolvido 13/04/2026 — `src/middleware.ts` ativo |
| ~~B-002~~ | ~~RLS sem isolamento por tenant~~ | ~~🔴 Crítico~~ | ✅ Resolvido 13/04/2026 — `fix_rls_tenant_isolation.sql` aplicado |
| ~~B-003~~ | ~~`VIEWS_HORARIOS_VAGOS.sql` não executado~~ | ~~🟡 Médio~~ | ✅ Resolvido 13/04/2026 |
| ~~B-004~~ | ~~Tabelas legadas (inglês) ainda existem~~ | ~~🟡 Médio~~ | ✅ Resolvido 13/04/2026 — DROP executado |

---

## 💡 Ideias Deferidas

| # | Ideia | Motivo do Defer |
|---|-------|----------------|
| I-001 | Supabase Realtime na agenda | Complexidade — V3 |
| I-002 | Zustand para state management | Avaliar quando React Context virar problema |
| I-003 | Validade de pacotes (`expira_em`) | Sem regra definida — backlog |

---

## 📋 Sessão 03/04/2026 — Spec SDD Completo

### Contexto
- Spec completo gerado por entrevista de 10 decisões (D-006 a D-015)
- Arquivo: `.specs/features/sistema-completo/spec.md`

### Decisões Registradas
| # | Decisão |
|---|---------|
| D-006 | Comissão manual no fechamento da comanda (percentual = sugestão) |
| D-007 | Split payment — múltiplos métodos por comanda |
| D-008 | Disponibilidade apenas pela agenda do profissional (sem recursos físicos) |
| D-009 | Cancelamento sem impacto financeiro; admin ou professional cancela |
| D-010 | Desconto no total; qualquer usuário; salva `aplicado_por` |
| D-011 | Estados: agendado → confirmado → em_atendimento → concluído → cancelado |
| D-012 | Pacotes = pré-pagamento em comanda, CPF, sessões abatidas por agendamento |
| D-013 | Payload n8n: telefone, nome, servico_id, data, horário, escalacao_do_servico |
| D-014 | Cliente novo via robô: sem CPF, `cadastro_completo = false` |
| D-015 | Fechamento de caixa manual por admin; congela período |

### Gaps Identificados (Requer Implementação)
| # | Gap | Prioridade |
|---|-----|-----------|
| G-001 | `fechamentos_caixa` não existe | Alta |
| G-002 | `pacotes_cliente` não existe | Alta |
| G-003 | `comandas` sem campos de desconto auditado | Média |
| G-004 | `clientes` sem `cadastro_completo` / `origem_cadastro` | Média |
| G-005 | API n8n sem idempotência formal | Média |
| G-006 | UI para fechar caixa não existe | Alta |
| G-007 | Painel de cadastros pendentes não existe | Média |
| G-008 | Alerta de pacote ativo na abertura de comanda | Média |
| G-009 | Comissão editável no fechamento (UI) | Alta |
| I-003 | React Query / SWR | Após estabilizar schema |
| I-004 | Testes E2E com Playwright | Após V2 correções |
| I-005 | Error Boundary admin | C-008 — fácil, baixo risco |

---

## 📝 Lições Aprendidas

- Schema passou por refatoração: tabelas em inglês → português. Manter atenção a qual schema está ativo.
- `dashboard-new.tsx` e `servicos`/`servicos-new` têm duplicações a resolver.
- `reactStrictMode: false` foi desabilitado intencionalmente por double-mount Supabase.

---

## 🔜 Próxima Ação Recomendada

**Iniciar V2 Sprint 1: Correções de Segurança**

1. `middleware.ts` → proteger `/admin/*` e `/api/admin/*` server-side (esforço: ~2h)
2. Role checks nas API routes admin (esforço: ~1h)
3. Executar SQLs pendentes do TASKS.md (esforço: ~30min)

Perguntar ao usuário qual dessas quer atacar primeiro.

---

## 📊 Contexto de Carga

- Brownfield docs criados: 5 arquivos (STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, INTEGRATIONS, CONCERNS)
- PROJECT.md + ROADMAP.md + STATE.md criados
- Pasta agentskills-template usada como molde de referência metodológica
