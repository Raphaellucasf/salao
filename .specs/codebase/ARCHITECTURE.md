# ARCHITECTURE — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## Router Strategy
- **App Router** (Next.js 16) — file-based routing com nested layouts
- Sem Pages Router legado

## Rendering
- Pesadamente **client-side** (`'use client'` em quase todos os componentes)
- `layout.tsx` root = Server Component (envolve `AuthProvider`)
- Admin pages = Client Components (estado, hooks, suspense)
- API Routes = totalmente server-side via service_role

## Autenticação & RBAC
- **Supabase Auth** — JWT + sessão via cookies
- Roles: `admin` | `professional` | `client`
- Verificação de role: `AuthContext` → metadata do Supabase → tabela `public.users`
- Guard hook: `useAdminOnly()` redireciona para `/admin/agenda` se não admin
- **Problema atual**: validação de role apenas no client (flash de conteúdo proibido)
- **Sem `middleware.ts`** — rotas de API e pages não protegidas server-side

## Multi-Tenancy
- Tabela `units` representa cada salão/filial
- RLS policies habilitadas mas **não isolam por tenant** (todos admins vêem todos os dados)
- Decisão confirmada: **SaaS multi-tenant** → requer RLS por `unit_id`

## Clientes Supabase (3 variantes)
| Arquivo | Uso | Escopo |
|---------|-----|--------|
| `src/lib/supabase.ts` | Browser client (SSR singleton) | Client components |
| `src/lib/supabase-server.ts` | Server API routes (service_role) | API Routes |
| `src/lib/supabase-admin.ts` | Admin actions (lazy proxy) | Casos especiais |

## Padrão de API Routes
- RESTful sob `src/app/api/`
- `NextRequest` / `NextResponse`
- Error handling básico, sem logging estruturado
- **Sem verificação de role** na maioria das rotas admin
- `n8n/whatsapp` protegido apenas por `x-api-key` header

## Estado & Dados
- React Context primário (`AuthContext`)
- `useState` local na maioria dos componentes
- Zustand instalado mas não utilizado
- React Hook Form + Zod para forms
- Sem cache de dados (sem React Query / SWR)

## Schemas Duplicados (Migração em Andamento)
O projeto passou por refatoração e tem **tabelas duplicadas**:
- `appointments` ↔ `agendamentos`
- `professionals` ↔ `profissionais`
- `services` ↔ `servicos`
- `users` ↔ `usuarios`

As tabelas em português são o **schema novo/ativo**. As em inglês são legados a serem dropados (ver TASKS.md).
