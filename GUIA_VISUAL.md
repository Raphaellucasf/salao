# 📱 Guia Visual de Telas - Otimiza Beauty Manager

Este documento descreve todas as telas implementadas e suas funcionalidades.

---

## 🏠 Landing Page (/)

**Arquivo:** `src/app/page.tsx`

### Elementos:
1. **Header**
   - Logo Otimiza Beauty (gradiente azul)
   - Botão "Entrar" (ghost)

2. **Hero Section** (Gradiente azul royal)
   - Título: "Beleza que se Agenda Online"
   - Subtítulo explicativo
   - CTA: "Agendar Agora" (botão laranja com ícone)

3. **Como Funciona** (4 cards)
   - Card 1: Escolha a Unidade (ícone MapPin)
   - Card 2: Selecione o Profissional (ícone Star)
   - Card 3: Escolha Data e Hora (ícone Calendar)
   - Card 4: Confirmação Instantânea (ícone Clock)

4. **CTA Section** (fundo cinza claro)
   - "Pronto para sua Transformação?"
   - Botão "Fazer Agendamento"

5. **Footer** (fundo escuro)
   - Informações da empresa
   - Contato
   - Links rápidos

### Navegação:
- "Agendar Agora" → `/agendar`
- "Entrar" → `/login`
- "Área do Profissional" → `/profissionais`

---

## 📅 Página de Agendamento (/agendar)

**Arquivo:** `src/app/agendar/page.tsx`

### Fluxo em 5 Etapas:

#### **STEP 1: Escolha a Unidade**
- Grid 2 colunas (responsive)
- Cards grandes com:
  - Imagem placeholder (gradiente azul)
  - Nome da unidade
  - Endereço com ícone MapPin
- Card selecionado: borda azul (ring-2)

#### **STEP 2: Escolha o Profissional**
- Grid 3 colunas
- Cards com:
  - Avatar circular (gradiente laranja)
  - Nome do profissional
  - Especialidade
  - Rating com estrela amarela
- Hover effect

#### **STEP 3: Escolha o Serviço**
- Lista vertical de cards
- Cada card mostra:
  - Nome do serviço + badge de categoria
  - Duração (ícone Clock)
  - Preço destacado (grande, azul)

#### **STEP 4: Escolha Data e Horário**
- Input de data (tipo date)
- Grid de horários disponíveis (6 colunas)
- Botões de horário:
  - Não selecionado: cinza claro
  - Selecionado: azul royal
  - Hover: cinza médio

#### **STEP 5: Confirmação**
- **Resumo do Agendamento:**
  - Unidade
  - Profissional
  - Serviço
  - Data e hora formatada
  - Valor total (grande, azul)
  
- **Formulário de Dados:**
  - Nome completo (required)
  - WhatsApp (required)
  - Helper text: "Receberá confirmação por WhatsApp"

### Navegação:
- Barra de progresso no topo (5 círculos)
- Botão "Voltar" (outline)
- Botão "Continuar" / "Confirmar Agendamento"

---

## 🎛️ Dashboard Administrativo (/admin)

**Arquivo:** `src/app/admin/page.tsx`

### Layout:
**Sidebar** (264px, colapsável):
- Logo + nome
- Menu de navegação:
  - Dashboard (ativo - azul)
  - Agendamentos
  - Clientes
  - Financeiro
  - Estoque
  - Configurações

**Top Bar:**
- Menu toggle
- Título "Dashboard" + saudação
- Sino de notificações (badge vermelho)
- Avatar do admin

**Conteúdo Principal:**

1. **Cards de Estatísticas (Grid 4 colunas):**
   - Agendamentos Hoje (ícone Calendar, azul)
   - Receita do Mês (ícone DollarSign, verde)
   - Clientes Ativos (ícone Users, laranja)
   - Pendentes (ícone Clock, amarelo)
   - Cada card mostra número grande + variação percentual

2. **Grid 2 Colunas:**
   
   **Col 1: Agendamentos Recentes**
   - Lista de agendamentos
   - Nome do cliente
   - Serviço
   - Horário
   - Badge de status (cores diferentes)
   
   **Col 2: Top Profissionais do Mês**
   - Ranking (números grandes em círculos)
   - Nome + quantidade de agendamentos
   - Receita em verde

3. **Ações Rápidas:**
   - Botões para:
     - Novo Agendamento
     - Cadastrar Cliente
     - Lançamento Financeiro
     - Entrada de Estoque

---

## 📱 App do Profissional (/profissionais)

**Arquivo:** `src/app/profissionais/page.tsx`

### Layout Mobile-First:

**Header** (Gradiente azul):
- Saudação personalizada + emoji
- Especialidade
- Avatar circular (fundo branco/20)
- **Stats Cards (Grid 2 colunas):**
  - Agendamentos hoje
  - Receita do dia

**Seletor de Data:**
- Card com input de data
- Botão "Bloquear" (laranja)

**Lista de Agendamentos:**
- Cards por agendamento:
  - Avatar do horário (círculo azul)
  - Nome do cliente
  - Badge de status
  - Serviço
  - Horário + duração
  - Botão check (se confirmado)

**Modal de Bloqueio:**
- Fundo escuro translúcido
- Card branco centralizado:
  - Data
  - Horário início
  - Horário fim
  - Motivo (opcional)
  - Botões: Cancelar / Confirmar

**Bottom Navigation** (fixo):
- 4 ícones:
  - Agenda (ativo - azul)
  - Financeiro
  - Clientes
  - Perfil

---

## 🎨 Sistema de Cores Usado

### Backgrounds:
- Branco puro: `bg-white`
- Cinza claro: `bg-neutral-50`, `bg-neutral-100`
- Gradientes:
  - Azul: `from-primary-600 to-primary-800`
  - Laranja: `from-accent-400 to-accent-600`

### Textos:
- Títulos: `text-neutral-900` (quase preto)
- Corpo: `text-neutral-600` (cinza médio)
- Secundário: `text-neutral-500`, `text-neutral-400`

### Botões:
- Primary: Fundo azul `bg-primary-600`
- Accent: Fundo laranja `bg-accent-500`
- Outline: Borda azul, fundo transparente
- Ghost: Fundo hover cinza

### Status Badges:
- Success (Confirmado): Verde
- Warning (Pendente): Amarelo
- Error (Cancelado): Vermelho
- Info: Azul
- Default (Concluído): Cinza

---

## 📐 Espaçamentos e Tamanhos

### Containers:
- Max width: `max-w-4xl` (agendamento), `max-w-6xl` (admin)
- Padding: `px-4` (mobile), `px-6` (desktop)

### Cards:
- Padding: `p-4` (sm), `p-6` (md), `p-8` (lg)
- Rounded: `rounded-2xl` (padrão), `rounded-xl` (botões)
- Shadow: `shadow-card` (leve), `shadow-soft` (hover)

### Grids:
- 2 colunas: `grid-cols-2` (mobile), `md:grid-cols-2`
- 3 colunas: `md:grid-cols-3`
- 4 colunas: `md:grid-cols-4`
- Gap padrão: `gap-6` (24px)

### Tipografia:
- H1: `text-4xl md:text-5xl font-bold`
- H2: `text-3xl font-bold`
- H3: `text-xl font-semibold`
- Body: `text-base`
- Small: `text-sm`, `text-xs`

---

## 🔄 Estados Interativos

### Hover:
- Cards: `hover:shadow-soft cursor-pointer`
- Botões: `hover:bg-primary-700`
- Links: `hover:text-white`

### Focus:
- Inputs: `focus:ring-2 focus:ring-primary-500`
- Botões: `focus:ring-2 focus:ring-offset-2`

### Disabled:
- Opacidade reduzida: `disabled:opacity-50`
- Cursor: `disabled:cursor-not-allowed`

### Selecionado:
- Borda destaque: `ring-2 ring-primary-600`
- Background: `bg-primary-600 text-white`

---

## 📊 Ícones Usados (Lucide React)

| Contexto | Ícone | Uso |
|----------|-------|-----|
| Navegação | ChevronLeft, ChevronRight, Menu | Voltar, Avançar, Menu |
| Agendamento | Calendar, Clock, Check | Data, Hora, Confirmação |
| Localização | MapPin | Endereço da unidade |
| Avaliação | Star | Rating de profissionais |
| Usuários | Users | Clientes |
| Financeiro | DollarSign, TrendingUp | Receita, Crescimento |
| Estoque | Package | Produtos |
| Notificação | Bell | Alertas |
| Ações | Plus, X | Adicionar, Fechar |
| Status | CheckCircle, XCircle | Sucesso, Erro |
| Configurações | Settings | Preferências |
| Sair | LogOut | Logout |
| Casa | Home | Página inicial |

---

## 🎯 Responsividade

### Breakpoints (Tailwind):
- `sm`: 640px
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)

### Padrões aplicados:
- Grid: 1 coluna mobile → 2-4 colunas desktop
- Sidebar: Oculta em mobile, fixa em desktop
- Padding: `px-4` mobile → `px-6` desktop
- Font size: Aumenta em telas maiores

---

**Este guia serve como referência para manter consistência visual em todo o sistema.**
