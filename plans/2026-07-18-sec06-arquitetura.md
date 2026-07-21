# SEC-06 e Arquitetura Implementation Plan

> **For agentic workers:** execução inline nesta tarefa; subagentes não foram solicitados.

**Goal:** eliminar o uso das chaves Supabase legadas expostas e encerrar os três achados de arquitetura com uma única fonte de migrações, clientes Supabase canônicos e documentação coerente.

**Architecture:** o browser usa somente URL pública e chave `sb_publishable_`; APIs usam uma fábrica server-only com `sb_secret_` e contexto opcional de unidade. Autenticação SSR fica em uma fábrica de request única. `supabase/migrations` é a única fonte SQL executável; materiais antigos em `database` são históricos e não podem ser instruídos como rollout.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Supabase hosted.

## Global Constraints

- Não fazer deploy, commit ou push.
- Não aplicar migrações ou SQL no ambiente de produção.
- Não registrar, imprimir ou copiar valores de chaves.
- Alterações externas de SEC-06 exigem sessão administrativa no Dashboard.

---

### Task 1: Configuração e clientes Supabase canônicos

**Files:**
- Create: `src/lib/supabase-config.ts`
- Create: `src/lib/supabase-request.ts`
- Modify: `src/lib/supabase.ts`
- Modify: `src/lib/supabase-server.ts`
- Delete: `src/lib/supabase-admin.ts`
- Modify: handlers que criam clientes diretamente
- Test: `tests/architecture-validator.js`

**Interfaces:**
- Produces: `getSupabasePublicConfig(): { url: string; publishableKey: string }`
- Produces: `getSupabaseSecretConfig(): { url: string; secretKey: string }`
- Produces: `createRequestSupabase(req, response?)`
- Produces: `createServerSupabase(unitId?)`

- [x] Criar teste que rejeite `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `createClient` direto em handlers e imports de `supabase-admin`.
- [x] Implementar configuração fail-closed para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`.
- [x] Centralizar clientes browser, SSR por request e privilegiado; desabilitar persistência, refresh e detecção de URL no cliente secreto.
- [x] Migrar `requireAdmin`, proxy, diagnóstico e APIs de usuários às fábricas.
- [x] Remover `@supabase/auth-helpers-nextjs` se permanecer sem consumidor.
- [x] Rodar `node tests/architecture-validator.js` e `tsc --noEmit`.

### Task 2: Fonte SQL única

**Files:**
- Create: `supabase/README.md`
- Modify: `database/README.md`
- Modify: guias que instruem SQL manual
- Test: `tests/architecture-validator.js`

- [x] Declarar `supabase/migrations` como única fonte executável e ordenar por timestamp.
- [x] Marcar `database/migrations`, `database/drafts` e SQLs soltos como históricos, nunca como rollout.
- [x] Remover instruções que apontam para `database/schema.sql` ou migrações inexistentes.
- [x] Validar que nenhuma documentação ativa manda executar SQL legado.

### Task 3: Documentação canônica

**Files:**
- Modify: `README.md`, `PROJECT.md`, documentos históricos de autenticação/setup e `plans/*.md`
- Test: `tests/architecture-validator.js`

- [x] Substituir versões obsoletas por Next.js 16.2.10 e React 19.2.7.
- [x] Substituir a linha de base antiga de RLS pelo estado atual: 56 tabelas com RLS, 50 tabelas de negócio isoladas por unidade.
- [x] Atualizar setup para chaves publicável/secreta novas e remover nomes legados.
- [x] Rotular relatórios históricos para que contagens passadas não pareçam estado atual.

### Task 4: Rotação de SEC-06

**Files:**
- Modify: `.env.example`, `plans/SECURITY_OPERATIONS.md`, `plans/AUDITORIA_VIVA.md`
- Test: `tests/secret-scan-validator.js`, `tests/architecture-validator.js`

- [ ] Preparar a aplicação exclusivamente para `sb_publishable_` e `sb_secret_`.
- [ ] Em sessão autenticada, criar uma nova secret key por backend e trocar secrets fora do repositório.
- [ ] Verificar a nova chave por chamada server-side e confirmar ausência de dependentes da chave legada.
- [ ] Desativar chaves legadas e habilitar proteção contra senhas vazadas no teste; repetir no projeto de produção somente com autorização/sessão próprias.
- [x] Reexecutar advisors e scanner sem expor valores.

### Task 5: Verificação e Auditoria Viva

- [x] Rodar TypeScript, ESLint, validadores de segurança/arquitetura/banco/cache/segredos e build.
- [x] Rodar `git diff --check`.
- [x] Atualizar o Resumo executivo apenas para itens comprovados pela evidência fresca.
- [x] Registrar qualquer passo externo bloqueado como pendente, sem declarar correção.
