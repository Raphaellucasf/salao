# Sincronização e Menu Rápido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar falhas de unidade administrativa nos fluxos de agenda/vendas e corrigir a apresentação e o foco dos modais do menu rápido.

**Architecture:** A autorização continua falhando fechado e usa `user_units` como fonte canônica. Uma migração de reparo cria o vínculo padrão apenas quando a unidade pode ser derivada sem ambiguidade; a UI normaliza o JSON legado e o modal mantém seu ciclo de foco estável.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/PostgreSQL, Playwright, validadores Node.js.

## Global Constraints

- Não selecionar silenciosamente uma unidade quando houver mais de uma possibilidade.
- Não relaxar RLS nem permitir fallback administrativo baseado em dados enviados pelo navegador.
- Preservar os commits já publicados da auditoria e da agenda.
- A migração precisa ser idempotente e segura para localhost e produção.

---

### Task 1: Reparar associações administrativas ausentes

**Files:**
- Create: `supabase/migrations/20260721140000_repair_missing_admin_unit_memberships.sql`
- Modify: `tests/database-hardening-validator.js`

**Interfaces:**
- Consumes: `public.users`, `public.units`, `public.user_units`.
- Produces: uma associação ativa e padrão para administradores sem vínculo somente quando existe exatamente uma unidade ativa.

- [ ] Escrever asserções do validador para exigir derivação não ambígua, idempotência e ausência de UUID fixo.
- [ ] Executar `node tests/database-hardening-validator.js` e confirmar a falha pela migração ausente.
- [ ] Criar a migração transacional que insere somente administradores sem unidade padrão quando `count(units ativas) = 1`.
- [ ] Fazer a migração abortar com diagnóstico claro se ainda houver administradores sem vínculo após o reparo.
- [ ] Executar novamente o validador e confirmar `PASS`.

### Task 2: Validar correções dos modais

**Files:**
- Verify: `src/components/ui/Modal.tsx`
- Verify: `src/components/modals/BuscarAgendaModal.tsx`
- Modify: `tests/code-quality-validator.js`

**Interfaces:**
- Consumes: `serviceText(Json)` e `Modal({ onClose })`.
- Produces: serviços legíveis e foco persistente durante renders assíncronos.

- [ ] Exigir no validador que strings JSON sejam desserializadas antes da renderização.
- [ ] Exigir que o efeito de foco do modal dependa apenas do estado de abertura e use uma ref para `onClose`.
- [ ] Executar `node tests/code-quality-validator.js` e confirmar `PASS`.

### Task 3: Verificação integrada

**Files:**
- Verify: `src/app/api/admin/comandas/route.ts`
- Verify: `src/app/api/admin/venda-rapida/route.ts`
- Verify: `src/app/api/admin/pacotes/venda/route.ts`

**Interfaces:**
- Consumes: `requireAdmin()` e a associação reparada.

- [ ] Executar `npm run verify` e confirmar código 0.
- [ ] Revisar o diff, confirmar que nenhuma policy RLS foi afrouxada e que todos os endpoints usam `auth.unitId`.
- [ ] Fazer commit e push somente após todas as verificações.
