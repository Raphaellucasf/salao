# 🎨 Otimiza Beauty Manager

> Fonte canônica: consulte [docs/README.md](docs/README.md) para desenvolvimento, operação, segurança e auditoria. Documentos antigos na raiz são históricos.

**Sistema SaaS Completo para Gestão de Salões de Beleza**

Desenvolvido com Next.js 16.2.10, React 19.2.7, TypeScript, Tailwind CSS e Supabase.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [🔐 Autenticação e RBAC](#-autenticação-e-rbac)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Banco de Dados](#-banco-de-dados)
- [API Routes](#-api-routes)
- [Deploy](#-deploy)

---

## 🎯 Visão Geral

O **Otimiza Beauty Manager** é uma solução completa para gestão de salões de beleza, oferecendo:

1. **Web App** - Painel administrativo completo
2. **Landing Page** - Agendamento público online
3. **App Mobile (PWA)** - Interface dedicada para profissionais
4. **Integração n8n** - Automação de mensagens via WhatsApp

---

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 16.2.10** - Framework React com App Router
- **React 19** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização responsiva mobile-first
- **Lucide React** - Ícones modernos

### Backend & Database
- **Supabase** - PostgreSQL + Autenticação + Storage
- **Next.js API Routes** - Endpoints serverless

### Automação
- **n8n** - Webhooks para disparo de mensagens
- **WhatsApp/SMS** - Notificações automáticas

---

## ✨ Funcionalidades

### 1️⃣ Módulo de Agendamento
**Fluxo do Cliente:**
1. Seleção de Unidade/Salão
2. Escolha do Profissional (com foto e avaliação)
3. Seleção de Serviço (preço e duração)
4. Escolha de Data/Hora (slots em tempo real)
5. Confirmação e dados do cliente

**Recursos:**
- ✅ Verificação de disponibilidade em tempo real
- ✅ Prevenção de conflitos de horário
- ✅ Horários bloqueados por profissionais
- ✅ Notificações automáticas via webhook

### 2️⃣ Gestão Financeira
- 💰 Caixa em tempo real
- 📊 Split automático de pagamentos (comissão profissional/salão)
- 🧾 Geração de recibos
- 📈 Relatórios financeiros
- 💳 Múltiplas formas de pagamento

### 3️⃣ Dashboard Administrativo
- 📊 KPIs em tempo real
- 📅 Visão geral de agendamentos
- 👥 Gestão de clientes e profissionais
- 📦 Controle de estoque
- ⚙️ Configurações do sistema

### 4️⃣ App para Profissionais (PWA)
- 📱 Interface mobile-first
- 📅 Visualização da própria agenda
- 🔒 Bloqueio de horários
- 💵 Acompanhamento de comissões
- ✅ Confirmação de atendimentos

### 5️⃣ Gestão de Estoque
- 📦 Controle de entrada/saída
- 🛒 Venda de produtos
- 📊 Alertas de estoque mínimo
- 🎁 Pacotes promocionais

---

## 🔐 Autenticação e RBAC

### Modelo implementado e riscos atuais

O sistema combina autenticação e controle de acesso em três camadas. O estado verificável e as ressalvas de produção estão em `plans/AUDITORIA_VIVA.md`.

#### 🛡️ Camada 1: Banco de Dados (RLS)
- 56/56 tabelas públicas estão com RLS no teste.
- As 50 tabelas de negócio têm unidade obrigatória, policy restritiva e proteção de relações entre tenants.
- As seis tabelas globais de identidade/autorização são deliberadamente separadas do ownership de negócio.

#### 🛡️ Camada 2: Servidor (Middleware)
- Proteção de rotas antes da renderização
- Redirecionamento automático baseado em role
- Validação de sessão em cada requisição

#### 🛡️ Camada 3: Cliente (UI)
- Menus filtrados por permissão
- Componentes protegidos
- Estado global de autenticação

### 👥 Roles Disponíveis

| Role | Acesso | Dashboard |
|------|--------|-----------|
| **Admin** | Total | `/admin` - Vê tudo |
| **Professional** | Limitado | `/profissionais` - Só agenda e comissões |
| **Client** | Público | `/agendar` - Apenas agendamento |

### 🚪 Rotas Protegidas

```typescript
// Admin apenas
/admin/financeiro
/admin/relatorios
/admin/estoque
/admin/configuracoes

// Professional + Admin
/admin/agendamentos
/admin/clientes
/profissionais/*

// Público
/
/agendar
/login
```

### 📚 Documentação Completa

- **[QUICK_START.md](QUICK_START.md)** - Setup em 5 minutos
- **[TESTE_AUTENTICACAO.md](TESTE_AUTENTICACAO.md)** - Guia de testes detalhado
- **[AUTENTICACAO_CONCLUIDA.md](AUTENTICACAO_CONCLUIDA.md)** - Documentação técnica

---

## 📁 Estrutura do Projeto

```
otimiza-beauty/
├── src/
│   ├── app/                      # App Router (Next.js 16.2.10)
│   │   ├── page.tsx              # Landing Page
│   │   ├── agendar/              # Fluxo de agendamento
│   │   ├── admin/                # Dashboard administrativo
│   │   ├── profissionais/        # App mobile PWA
│   │   └── api/                  # API Routes
│   │       ├── appointments/     # CRUD agendamentos
│   │       └── transactions/     # Gestão financeira
│   ├── components/
│   │   └── ui/                   # Design System
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Badge.tsx
│   ├── lib/
│   │   └── supabase.ts           # Cliente Supabase
│   └── types/
│       └── supabase.ts           # Tipagens do banco
├── supabase/
│   ├── README.md                 # Procedimento canônico
│   └── migrations/               # Única cadeia SQL executável
├── public/
│   └── manifest.json             # PWA manifest
├── .env.local                    # Variáveis de ambiente
└── tailwind.config.ts            # Design tokens
```

---

## 🚀 Instalação e Configuração

### 1. Clone e Instale Dependências

```bash
cd otimiza-beauty
npm install
```

### 2. Configure o Supabase

1. Use um projeto Supabase de teste autorizado.
2. Consulte `supabase/README.md`; `supabase/migrations/` é a única cadeia SQL executável.
3. Obtenha URL, publishable key e uma secret key exclusiva para o backend em Settings > API Keys.

### 3. Configure as Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/agendamento
```

> Nunca grave a `SUPABASE_SECRET_KEY` em código, documentação, logs ou
> arquivos versionados. Ela deve existir apenas no ambiente servidor. Execute
> `npm run test:secrets` antes de publicar alterações e rotacione imediatamente
> qualquer chave que tenha sido exposta.

### 4. Inicie o Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5. Faça Login

Use as credenciais de teste (criadas pelo `seed_users.sql`):

**Admin:**
- Email: `dimas@salaodimas.com`
- Senha: variável local `E2E_ADMIN_PASSWORD`

**Profissional:**
- Email: `joao@salaodimas.com`
- Senha: variável local `E2E_PROFESSIONAL_PASSWORD`

> 💡 **Guia Rápido:** Veja [QUICK_START.md](QUICK_START.md) para setup em 5 minutos!
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Execute o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `units` | Unidades/Salões |
| `users` | Usuários (Admin, Profissionais, Clientes) |
| `professionals` | Profissionais vinculados a unidades |
| `services` | Serviços oferecidos |
| `appointments` | Agendamentos |
| `transactions` | Transações financeiras |
| `inventory` | Estoque de produtos |
| `packages` | Pacotes promocionais |
| `blocked_times` | Horários bloqueados |

### Políticas RLS (Row Level Security)

⚠️ Estado confirmado no Supabase de testes:

- 56/56 tabelas públicas estão com RLS.
- 50 tabelas de negócio têm fronteira restritiva por unidade, FK, índice e `unit_id` imutável.
- Testes negativos entre unidades passaram no ambiente de teste.
- Produção não foi comparada nem alterada; não se presume paridade.

---

## 🔌 API Routes

### Agendamentos

**GET** `/api/appointments`
- Query params: `unit_id`, `status`, `date`
- Retorna lista de agendamentos

**POST** `/api/appointments`
- Body: dados do agendamento
- Valida disponibilidade
- Dispara webhook n8n

**GET** `/api/appointments/availability`
- Params: `professional_id`, `date`, `service_id`
- Retorna slots disponíveis

**POST** `/api/appointments/close`
- Body: `appointment_id`, `payment_method`
- Fecha agendamento e calcula comissões automaticamente

### Transações

**GET** `/api/transactions`
- Query params: `unit_id`, `type`, `start_date`, `end_date`

**POST** `/api/transactions`
- Body: dados da transação

---

## 🎨 Design System

### Paleta de Cores

- **Primary (Azul Royal):** `#2563eb` - Ações principais
- **Accent (Laranja):** `#f97316` - CTAs e destaques
- **Neutral (Cinza Frio):** `#6b7280` - Textos e bordas
- **White:** `#ffffff` - Background

### Componentes UI

- ✅ Button (5 variantes)
- ✅ Card (modular)
- ✅ Input (com validação)
- ✅ Badge (status)

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel.

### Configuração PWA

O arquivo `manifest.json` já está configurado. Para habilitar service workers:

1. Instale `next-pwa`:
   ```bash
   npm install next-pwa
   ```

2. Configure no `next.config.js`

---

## 📱 Integração n8n

### Webhook de Novo Agendamento

**Endpoint:** `POST N8N_WEBHOOK_URL`

**Payload:**
```json
{
  "type": "appointment.created",
  "data": {
    "appointment_id": "uuid",
    "client_name": "Maria Silva",
    "client_phone": "(11) 98765-4321",
    "appointment_date": "2026-01-20",
    "start_time": "14:00",
    "service_id": "uuid"
  }
}
```

**Automação n8n sugerida:**
1. Webhook Trigger
2. HTTP Request → Buscar detalhes do serviço
3. WhatsApp Node → Enviar confirmação
4. Delay → 1 dia antes
5. WhatsApp Node → Enviar lembrete

---

## 🔐 Segurança

- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de dados no servidor
- ✅ Autenticação via Supabase Auth
- ✅ HTTPS obrigatório em produção

---

## 📞 Suporte

Para dúvidas ou sugestões:
- 📧 Email: suporte@otimizabeauty.com
- 📱 WhatsApp: (11) 98765-4321

---

## 📄 Licença

Este projeto é proprietário. © 2026 Otimiza Beauty Manager.

---

**Desenvolvido com ❤️ por Engenheiros de Software Sênior**
