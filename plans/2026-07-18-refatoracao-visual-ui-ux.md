# Refatoracao visual UI/UX — plano de implementacao

> Escopo: modernizar a experiencia visual do Dimas sem alterar regras de negocio, banco ou a auditoria viva. Nao realizar deploy, migracao, commit ou push.

## Objetivo

Criar uma interface premium, coerente e acessivel para o site publico, agendamento e painel administrativo. A direcao visual combina fundo marfim, texto espresso, superficies claras e um acento terracota/cobre contido, com hierarquia tipografica forte e menos ruido cromatico.

## Tarefa 1 — Fundacao visual e acessibilidade global

**Arquivos:**
- Modificar: `src/app/globals.css`
- Modificar: `src/app/layout.tsx`

- [x] Definir no tema Tailwind as escalas `primary` e `accent`, sombras e tokens de superficie ja usados pelo projeto.
- [x] Adicionar estilos globais de foco, selecao, scrollbar, movimento reduzido e fundo da aplicacao.
- [x] Atualizar metadados e acabamento base do documento sem introduzir fontes ou dependencias externas.
- [x] Conferir contraste e evitar que animacoes sejam obrigatorias.

## Tarefa 2 — Componentes reutilizaveis

**Arquivos:**
- Criar: `src/components/ui/BrandMark.tsx`
- Criar: `src/components/ui/PageHeader.tsx`
- Criar: `src/components/ui/StatCard.tsx`
- Modificar: `src/components/ui/Button.tsx`
- Modificar: `src/components/ui/Card.tsx`
- Modificar: `src/components/ui/Input.tsx`
- Modificar: `src/components/ui/Badge.tsx`
- Modificar: `src/components/ui/Modal.tsx`
- Modificar: `src/components/ui/index.ts`

- [x] Uniformizar estados normal, hover, active, focus, disabled e loading.
- [x] Corrigir associacao de labels, mensagens de erro e semantica dos campos.
- [x] Implementar dialogo com Escape, foco inicial, restauracao de foco e atributos ARIA.
- [x] Criar cabecalho de pagina e cards de metrica para reduzir repeticao e consolidar hierarquia.

## Tarefa 3 — Shell e navegacao administrativa

**Arquivos:**
- Modificar: `src/app/admin/layout.tsx`
- Modificar: `src/components/layout/AdminSidebarNew.tsx`
- Modificar: `src/components/layout/MobileBottomNav.tsx`
- Modificar: `src/components/layout/QuickActions.tsx`

- [x] Fazer o conteudo acompanhar corretamente o estado expandido/recolhido da barra lateral.
- [x] Agrupar e hierarquizar destinos, melhorar rotulos ativos e preservar acesso a todas as areas no celular.
- [x] Substituir o arco-iris de acoes rapidas por uma linguagem coerente de marca.
- [x] Evitar sobreposicao com a navegacao movel e remover acoes aparentes sem resposta.
- [x] Exibir feedback visual de carregamento durante a validacao da sessao.

## Tarefa 4 — Jornadas publicas

**Arquivos:**
- Modificar: `src/app/page.tsx`
- Modificar: `src/app/login/page.tsx`
- Modificar: `src/app/agendar/page.tsx`

- [x] Refazer a pagina inicial com proposta de valor, servicos e CTA mais claros, sem inventar dados comerciais.
- [x] Refazer login com melhor composicao, acessibilidade do campo de senha e mensagens mais claras.
- [x] Melhorar o fluxo de agendamento com indicador de progresso responsivo, selecoes evidentes, resumo persistente e estados vazios/carregando coerentes.

## Tarefa 5 — Telas administrativas prioritarias

**Arquivos:**
- Modificar: `src/app/admin/dashboard/page.tsx`
- Modificar: `src/app/admin/clientes/page.tsx`

- [x] Aplicar o novo cabecalho e cards de metrica ao dashboard.
- [x] Reduzir ruido cromatico, melhorar densidade e tornar listas mais legiveis.
- [x] Tornar clientes utilizavel em telas menores sem alterar consultas ou regras.
- [x] Padronizar acoes primarias e estados vazios.

## Tarefa 6 — Verificacao

- [x] Rodar lint e verificacao TypeScript disponiveis no projeto.
- [x] Abrir pagina inicial, login, agendamento e telas publicamente acessiveis no navegador local.
- [x] Verificar visualmente desktop e mobile, foco por teclado, overflow e console.
- [x] Corrigir regressao encontrada e repetir as verificacoes relevantes.
