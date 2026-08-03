# Production RLS and Catalog Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair production Supabase tenancy/RLS drift and restore the service/package catalog creation flows without exposing customer or professional data.

**Architecture:** Keep browser writes behind the existing authenticated Next.js API routes and service-role atomic RPCs. Add a single idempotent production migration that completes unit ownership, hardens views and function grants, and installs the missing catalog RPCs. Then make the UI/API error path explicit and verify the complete production flow with database checks and local tests.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/PostgreSQL 17, PostgREST RPCs, PostgreSQL RLS/security-invoker views.

## Global Constraints

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or secret keys to browser code.
- Every business row in exposed `public` tables must have an immutable `unit_id` and a tenant boundary policy.
- Public booking catalog reads may remain available only for active catalog rows; customer, appointment, comanda and professional-sensitive data must not be publicly readable.
- Catalog mutations must remain authenticated-admin API calls using idempotent atomic RPCs.
- All production SQL must be idempotent and verified immediately after execution.

### Task 1: Capture the production baseline

**Files:**
- Read: `src/app/api/admin/servicos/route.ts`
- Read: `src/app/api/admin/pacotes/route.ts`
- Read: `src/components/modals/ServicoModal.tsx`
- Read: `src/components/modals/PacoteServicoModal.tsx`
- Read: `supabase/migrations/20260718203000_complete_unit_tenancy.sql`

- [ ] Record production function signatures, target table columns, RLS flags/policies and recent Postgres/API errors through the `dimas_otimiza` MCP.
- [ ] Confirm the observed root causes: missing `save_service_catalog_atomic`/`save_service_package_atomic`, missing package `unit_id` columns, and public security-definer views.

### Task 2: Apply the production tenancy/RLS migration

**Files:**
- Create: `supabase/migrations/20260803190000_production_rls_catalog_repair.sql`

- [ ] Create the `private` authorization helpers and current-request-unit resolver with fixed `search_path`.
- [ ] Add/backfill immutable `unit_id` columns and foreign keys for every business table, including package/service catalog and operation tables.
- [ ] Enable RLS, revoke direct browser writes from protected tables, and add restrictive unit policies with explicit `USING` and `WITH CHECK` predicates.
- [ ] Preserve only intentional anonymous catalog reads; revoke anonymous access to appointment/professional/customer views and `vw_servicos_n8n`.
- [ ] Convert views to `security_invoker` when they are views and grant them only to authenticated/service-role callers.
- [ ] Add the missing atomic service/package catalog RPCs with service-role-only execution and idempotency keys.
- [ ] Grant the existing atomic sales/comanda RPCs to `service_role` and remove unsafe public execution grants.
- [ ] Run the migration through `mcp__dimas_otimiza__apply_migration`.

### Task 3: Harden the application error/data boundary

**Files:**
- Modify: `src/app/api/admin/servicos/route.ts`
- Modify: `src/app/api/admin/pacotes/route.ts`
- Modify: `src/components/modals/ServicoModal.tsx`
- Modify: `src/components/modals/PacoteServicoModal.tsx`

- [ ] Keep all mutations on API routes and surface RPC error codes/messages in a safe user-facing Portuguese message.
- [ ] Include a generated `request_id` on package saves and reject invalid IDs before any RPC call.
- [ ] Replace broad `select('*')` catalog reads with the minimum fields needed by the modal.
- [ ] Ensure loading/error state cannot leave the modal stuck after a failed save.

### Task 4: Verify production and local behavior

**Files:**
- Test: `tests/appointment-recurrence-validator.js` and existing verification scripts

- [ ] Query production to confirm all public business tables have RLS, tenant columns and no anonymous access to protected views.
- [ ] Query production to confirm the two catalog RPCs exist with the expected signatures and service-role grants.
- [ ] Re-run Supabase security/performance advisors and review remaining findings.
- [ ] Run `npm.cmd run verify`, `npm.cmd run build`, and the focused lint/test commands.
- [ ] Exercise service creation, package creation, package sale, agenda lookup and comanda close against the local app; record any production-only limitation instead of guessing.

### Task 5: Commit and publish

**Files:**
- All files changed by Tasks 2–4

- [ ] Review `git diff`, stage only the intentional migration/code/test changes, commit with a descriptive message, and push the current branch to GitHub.
