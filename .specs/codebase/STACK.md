# STACK — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## Framework & Runtime
- **Next.js** 16.1.3 — App Router (não Pages Router)
- **React** 19.2.3
- **TypeScript** ^5 — strict mode habilitado
- **Node** target ES2017

## Frontend
- **Tailwind CSS** ^4 (PostCSS ^4) — utility-first, sem CSS Modules
- **Lucide React** ^0.562.0 — ícones
- **React Hook Form** ^7.71.1 — gerenciamento de formulários
- **Hookform Resolvers** ^5.2.2 — adapter Zod ↔ RHF
- **Zod** ^4.3.5 — validação de schemas
- **Sonner** ^2.0.7 — toast notifications

## Backend / Database
- **Supabase** ^2.90.1 — PostgreSQL + Auth + Storage
  - `@supabase/supabase-js` ^2.90.1
  - `@supabase/auth-helpers-nextjs` ^0.15.0 (legacy helper)
  - `@supabase/ssr` ^0.8.0 (atual SSR client)
- **API Routes** Next.js serverless (service_role — bypassa RLS)

## Utilitários
- **date-fns** ^4.1.0 — manipulação de datas
- **XLSX** ^0.18.5 — exportação Excel
- **jsPDF** ^4.2.0 + **jsPDF-autotable** ^5.0.7 — geração de PDF
- **Zustand** ^5.0.10 — instalado mas **não utilizado** (state via React Context)

## Dev
- **ESLint** ^9
- **Playwright** ^1.58.2 — instalado, sem test suites escritas
- **reactStrictMode: false** — desabilitado para evitar double-mount Supabase

## Deploy
- **Vercel** — produção ativa com usuários reais
- `vercel.json` presente
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_URL`, `N8N_API_KEY`
