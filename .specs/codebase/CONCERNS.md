# CONCERNS — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## 🔴 Alta Prioridade (Bloqueadores para Produção Segura)

### C-001 — Sem `middleware.ts` de Autenticação
- **Risco**: API routes e pages admin não protegidos server-side
- **Impacto**: Usuários não autenticados podem tentar acessar `/api/admin/*`
- **Ação**: Criar `src/middleware.ts` com validação de sessão Supabase

### C-002 — RLS sem Isolamento de Tenant
- **Risco**: Qualquer admin autenticado vê dados de todos os salões
- **Impacto**: Quebra de privacidade entre clientes SaaS
- **Ação**: Adicionar `unit_id` ao contexto de usuário + policies `WHERE unit_id = auth.uid()` ou via claim JWT

### C-003 — API Routes sem Verificação de Role
- **Risco**: Qualquer usuário autenticado pode chamar rotas admin
- **Impacto**: Escalada de privilégio (professional → admin actions)
- **Ação**: Adicionar verificação de role em todas as rotas `/api/admin/*`

### C-004 — Sem CSRF Protection
- **Risco**: Formulários públicos (`/api/appointments`) vulneráveis a CSRF
- **Ação**: Usar padrão de double-submit cookie ou SameSite cookies

### C-005 — Sem Rate Limiting
- **Risco**: DoS em `/api/appointments` (POST público) e `/api/whatsapp/horarios`
- **Ação**: Implementar rate limiting via Vercel Edge ou middleware

---

## 🟡 Média Prioridade (Tech Debt)

### C-006 — `// @ts-nocheck` em API Routes
- Reduz segurança de tipos, esconde erros potenciais
- **Ação**: Remover e corrigir os tipos

### C-007 — Zustand Instalado sem Uso
- Peso desnecessário no bundle
- **Ação**: Remover dependência ou adotar em substituição a alguns useState

### C-008 — Sem Error Boundary
- Erro em qualquer componente admin derruba toda a SPA
- **Ação**: Adicionar `<ErrorBoundary>` no layout admin

### C-009 — Tabelas Duplicadas (Schema em Migração)
- `appointments` ↔ `agendamentos`, `professionals` ↔ `profissionais`, etc.
- **Ação**: Executar DROP das tabelas legadas após validação (task 2 do TASKS.md)

### C-010 — Dashboards Duplicados
- `dashboard/page.tsx` e `dashboard-new.tsx` coexistem
- **Ação**: Remover o legado após validar o novo

### C-011 — Sem Cache de Dados (React Query / SWR)
- Cada navegação refaz todas as queries Supabase
- **Impacto**: Performance degradada, muitas requisições desnecessárias
- **Ação**: Avaliar adoção de `@tanstack/react-query` ou SWR

### C-012 — n8n Webhook Fire-and-Forget
- Falhas silenciosas nas notificações WhatsApp
- **Ação**: Adicionar retry logic + log de status de webhook

---

## 🟢 Baixa Prioridade (Melhorias)

### C-013 — Sem `.env.example`
- Dificulta onboarding de novos devs ou deploy
- **Ação**: Criar `.env.example` com todas as vars necessárias

### C-014 — Sem Audit Trail
- Sem log de quem criou/modificou registros
- **Ação**: Implementar tabela `audit_log` com trigger

### C-015 — Sem Testes Automatizados
- Playwright instalado mas sem suites escritas
- **Ação**: Escrever testes E2E para fluxo de agendamento (crítico)

### C-016 — Proliferação de Modais (30+)
- Manutenção difícil, padrões inconsistentes entre modais
- **Ação**: Refatoração futura — criar factory de modais CRUD

### C-017 — Sem Logging Estruturado
- `console.error` espalhado, sem correlação de requests
- **Ação**: Integrar Sentry ou Axiom para observabilidade em produção
