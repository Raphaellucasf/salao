# CONVENTIONS — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## Nomenclatura de Arquivos / Pastas
- **Pages**: kebab-case — `admin/agenda/page.tsx`, `admin/servicos-new/page.tsx`
- **Components**: PascalCase — `ComandaModal.tsx`, `AdminSidebarNew.tsx`
- **Hooks**: camelCase com prefixo `use` — `useAdminOnly.ts`, `useFormCache.ts`
- **Lib/Utils**: camelCase — `supabase.ts`, `supabase-server.ts`
- **API Routes**: kebab-case — `api/whatsapp/horarios/route.ts`

## Banco de Dados
- snake_case em tudo: `user_id`, `professional_id`, `appointment_date`
- Tabelas no plural: `units`, `profissionais`, `servicos`
- UUID como primary key (`uuid_generate_v4()`)
- Timestamps: `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)
- Soft timestamps (sem soft delete padrão)

## Estrutura de Componentes
- UI base reutilizável em `src/components/ui/` (Button, Card, Input, Badge, Modal)
- Barrel export via `src/components/ui/index.ts`
- Feature-specific em subpastas por domínio
- 30+ modais CRUD em `src/components/modals/`

## Imports
- Path alias `@/*` → `./src/*` (tsconfig)
- Usar sempre `@/` para imports internos
- Sem dynamic imports (exceto `MensagemAvisoModal` com `dynamic({ ssr: false })`)

## TypeScript
- `"strict": true` no tsconfig
- Types do banco em `src/types/supabase.ts`
- **Evitar `// @ts-nocheck`** (presente em alguns API routes — tech debt a resolver)

## CSS / Styling
- **Tailwind 4** exclusivamente — sem CSS Modules, sem inline styles
- Paleta customizada:
  - Primary: azul (`primary-50` a `primary-800`)
  - Accent: laranja (`accent-50`, `accent-500`)
  - Neutral: cinzas (`neutral-50` a `neutral-900`)
- Design responsivo com breakpoints Tailwind

## Estado
- React Context para estado global (`AuthContext`)
- `useState` para estado local de componentes
- React Hook Form + Zod para todos os formulários
- **NÃO usar Zustand** (instalado mas sem uso — aguardar decisão de remover ou adotar)

## Padrões de API
- Sempre verificar autenticação antes de processar a requisição
- Usar `supabase-server.ts` (service_role) em API routes
- Retornar `NextResponse.json({ error: ... }, { status: 4xx/5xx })` em erros
- Logs via `console.error` (sem logger estruturado — tech debt)
