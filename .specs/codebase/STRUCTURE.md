# STRUCTURE — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## Estrutura src/ (2-3 níveis)

```
src/
├── app/
│   ├── layout.tsx                   # Root layout com AuthProvider (Server Component)
│   ├── page.tsx                     # Landing page pública
│   ├── globals.css                  # Tailwind imports
│   ├── login/page.tsx               # Login
│   ├── agendar/page.tsx             # Agendamento público (cliente final)
│   ├── profissionais/layout.tsx     # Dashboard do profissional (PWA)
│   └── admin/
│       ├── layout.tsx               # Admin layout (sidebar + auth guard)
│       ├── page.tsx                 # Redirect → /admin/dashboard
│       ├── dashboard/page.tsx       # KPI dashboard principal
│       ├── dashboard-new.tsx        # [DUPLICADO — remover]
│       ├── agenda/                  # Calendário de agendamentos
│       ├── agendamentos-futuros/    # Lista agendamentos futuros
│       ├── anamnese/                # Fichas de anamnese clientes
│       ├── aniversariantes/         # Relatório de aniversariantes
│       ├── cadastros-excluidos/     # Arquivo de registros deletados
│       ├── cheques/                 # Gestão de cheques
│       ├── clientes/                # CRUD clientes
│       ├── comandas/                # POS / comandas
│       ├── configuracoes/           # Configurações do sistema
│       ├── contas-receber/          # Contas a receber
│       ├── debitos/                 # Débitos / cobranças
│       ├── estoque/                 # Estoque (uso interno)
│       ├── financeiro/              # Relatórios financeiros
│       ├── orcamentos/              # Orçamentos
│       ├── pacotes/                 # Pacotes de serviços
│       ├── produtos/                # Produtos (revenda)
│       ├── profissionais/           # CRUD profissionais
│       ├── relatorios/              # Relatórios gerais
│       ├── saldos/                  # Saldos de contas
│       ├── servicos/                # CRUD serviços (legado)
│       ├── servicos-new/            # CRUD serviços (novo)
│       ├── templates/               # Templates de mensagens
│       └── usuarios/                # CRUD usuários
│
├── app/api/
│   ├── admin/
│   │   ├── create-user/route.ts
│   │   └── update-user-role/route.ts
│   ├── appointments/
│   │   ├── route.ts                 # GET/POST
│   │   ├── availability/route.ts    # Verificação de slots
│   │   └── close/route.ts          # Fechar + comissão
│   ├── sales/route.ts
│   ├── search/route.ts
│   ├── transactions/route.ts
│   └── whatsapp/
│       └── horarios/route.ts        # Slots para n8n/WhatsApp
│
├── components/
│   ├── ui/                          # Button, Card, Input, Badge, Modal + index.ts
│   ├── auth/                        # ProtectedRoute, withAdminOnly
│   ├── layout/                      # AdminSidebar, AdminSidebarNew, BottomNav, etc.
│   ├── modals/                      # 30+ modais CRUD (ComandaModal, ClienteModal, etc.)
│   └── profissionais/               # Dashboard.tsx (PWA)
│
├── contexts/
│   └── AuthContext.tsx              # Auth state + role management
│
├── hooks/
│   ├── useAdminOnly.ts              # Guard hook admin
│   ├── useFormCache.ts
│   └── useKeyboardShortcuts.ts      # Atalhos F2, F3, etc.
│
├── lib/
│   ├── supabase.ts                  # Browser SSR client (singleton)
│   ├── supabase-server.ts           # Server API client (service_role)
│   └── supabase-admin.ts            # Admin lazy proxy
│
├── services/
│   └── relatorios.ts                # Funções de relatório + data fetching
│
└── types/
    ├── supabase.ts                  # Types DB (manual + gerados)
    └── jspdf-autotable.d.ts         # Type extensions
```

## Rotas Admin Ativas

| Rota | Módulo | Status |
|------|--------|--------|
| `/admin/dashboard` | Dashboard KPI | ✅ Ativo |
| `/admin/agenda` | Agenda | ✅ Ativo (prioridade) |
| `/admin/clientes` | Clientes | ✅ Ativo |
| `/admin/profissionais` | Profissionais | ✅ Ativo |
| `/admin/servicos-new` | Serviços | ✅ Ativo |
| `/admin/produtos` | Produtos (revenda) | ✅ Ativo |
| `/admin/estoque` | Estoque (interno) | ✅ Ativo |
| `/admin/comandas` | Comandas / POS | ✅ Ativo |
| `/admin/financeiro` | Financeiro | ✅ Ativo |
| `/admin/relatorios` | Relatórios | ✅ Ativo |
| `/admin/usuarios` | Usuários | ✅ Ativo |
| `/admin/configuracoes` | Config | ✅ Ativo |
| `/admin/contas-receber` | Contas a receber | ⚠️ Verificar se ativo |
| `/admin/cheques` | Cheques | ⚠️ Verificar se ativo |
| `/admin/debitos` | Débitos | ⚠️ Verificar se ativo |
| `/admin/saldos` | Saldos | ⚠️ Verificar se ativo |
| `/admin/orcamentos` | Orçamentos | ⚠️ Verificar se ativo |
| `/admin/servicos` | Serviços (legado) | ❓ Duplicado de servicos-new |
