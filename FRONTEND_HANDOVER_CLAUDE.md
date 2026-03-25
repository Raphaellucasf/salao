# 🐾 Pegadas na Neve - Handover Frontend -> Backend (Claude Code)

Olá Claude! Aqui é o Desenvolvedor Frontend / Designer Chefe. 
Concluí a análise e a estruturação da interface do **Otimiza Beauty** (Sistema de Gestão para o Salão Dimas Dona). 

O frontend está sólido, com um Design System implementado e fluxos de usuário criados. Abaixo detalho a estrutura visual atual e, o mais importante, **os pontos de integração** onde você precisará atuar para conectar a lógica de backend e o banco de dados (Supabase).

---

## 🎨 1. Estrutura Visual e Design System

O projeto utiliza o **Next.js 15** com **Tailwind CSS**. A identidade visual está configurada em `tailwind.config.ts`, focada em uma estética "Clean Luxury":
- **Cores Principais:** Bege Principal (`primary-500: #a89b86`), Dourado Elegante (`accent-500: #d4af37`) e contrastes com Preto Suave (`neutral-900: #171717`).
- **Layout System:** Trabalhamos com componentes modulares localizados em `src/components/ui/`, como `Card`, `Button`, `Input` e `Badge`.
- **Estilo:** Bordas arredondadas suaves (`rounded-2xl`, `rounded-xl`), sombras elegantes (`shadow-luxury`, `shadow-soft`). Toda nova UI deve continuar utilizando esses componentes base.

---

## 🔌 2. Pontos Prontos para Conexão (Backend / Banco de Dados)

Aqui estão os formulários, botões e telas que já estão com a interface montada esperando sua lógica e injeção de dados reais:

### 📱 A. Fluxo de Agendamento Público (`src/app/agendar/page.tsx`)
O fluxo é composto por 5 etapas, todas atualmente utilizando **Mock Data** (`mockUnits`, `mockProfessionals`, `mockServices`, `timeSlots`). **Sua Tarefa:** Substituir os mocks por chamadas ao banco.

* **Etapa 1: Escolha a Unidade**
  * *UI Atual:* Renderiza `mockUnits`.
  * *O que fazer:* Buscar unidades reais da tabela `units`.

* **Etapa 2: Escolha o Profissional**
  * *UI Atual:* Renderiza `mockProfessionals`.
  * *O que fazer:* Buscar profissionais reais da tabela `professionals` que atendem na unidade selecionada.

* **Etapa 3: Escolha o Serviço**
  * *UI Atual:* Renderiza `mockServices`.
  * *O que fazer:* Buscar serviços da tabela `services`.

* **Etapa 4: Data e Horário**
  * *UI Atual:* Calendário nativo + lista estática de `timeSlots`.
  * *O que fazer:* Lógica complexa de disponibilidade. Consultar as tabelas `appointments` e `blocked_times` para o profissional selecionado e gerar os horários reais disponíveis na data.

* **Etapa 5: Confirmação e Dados do Cliente**
  * *UI Atual:* Captura `clientName` e `clientPhone`. Botão chama `handleConfirm()`, que hoje apenas faz um `alert()`.
  * *O que fazer:* No `handleConfirm()`, fazer o `INSERT` na tabela `appointments` ou chamar a API Route (`POST /api/appointments`). Além disso, disparar o webhook do **n8n** para envio automático de WhatsApp.

### 🔐 B. Tela de Autenticação (`src/app/login/page.tsx`)
* *UI Atual:* Formulário de Email e Senha configurado. Ele já invoca a função `signIn(email, password)` vinda de `useAuth()`. Trata respostas de erro do Supabase visivelmente.
* *O que fazer:* A estrutura já deve funcionar em parte caso o Supabase esteja populado com usuários de teste (ex: script `seed_users.sql`). Você precisará garantir que o middleware (`middleware.ts` ou roteamento) esteja validando corretamente as roles (Admin, Professional) e redirecionando para os Dashboards após o login.

### 📊 C. Área Administrativa (`src/app/admin/*`)
* *UI Atual:* Existe uma hierarquia complexa de pastas de layout e páginas (ex: `/dashboard`, `/clientes`, `/financeiro`, etc.).
* *O que fazer:* Identifique as páginas que necessitam de listagens (CRUDs). Será preciso injetar as buscas ao Supabase diretamente nos componentes ou utilizando `fetch` para API Routes internamente nessas páginas, de acordo com o padrão arquitetural definido para os RSC (React Server Components) ou Client components.

### 🛠️ D. Etapas de Serviço Opcionais (NOVO)
* *Frontend:* Adicionei um novo campo visual (toggle) `exige_profissional` no momento de criar/editar etapas de um serviço (`ServicoModal` / `EtapasServicoEditor`). Quando falso, o frontend permite adicionar o serviço na comanda sem selecionar nenhum profissional para essa etapa (útil para "Tempo de Pausa").
* *O que fazer:* 
  1. Adicionar a coluna `exige_profissional` (BOOLEAN, default true) na tabela `servico_etapas`.
  2. Garantir que a tabela e as constraints de `comanda_item_etapas` aceitem a inserção de `profissional_id = NULL` e `auxiliar_id = NULL` especificamente para essas etapas.

---

## 🤝 Regras do Jogo
Como focado na UI/UX, não mexi na estrutura do banco. Deixo contigo a responsabilidade da lógica pesada, consultas (queries) ao Supabase e triggers RLS / n8n. Qualquer tela nova ou componente visual necessário que venha a surgir durante sua integração de backend, me avise que eu crio com a fidelidade do nosso figma/Design System!

Sucesso no backend! 🚀
