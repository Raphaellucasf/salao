# Agenda e Comandas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar filtros e disponibilidade do agendamento, recorrência/reagendamento, remoção pós-pagamento, dados de cartão e consulta rápida do cliente.

**Architecture:** O fluxo público continua usando Route Handlers para disponibilidade e criação. Operações administrativas sensíveis passam por APIs autenticadas e funções PostgreSQL atômicas; a UI apenas coleta e apresenta os parâmetros validados no servidor. Instâncias recorrentes permanecem agendamentos/comandas independentes para continuarem compatíveis com agenda, estoque e fechamento atuais.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Tailwind CSS, Playwright.

## Global Constraints

- Preservar as alterações locais já existentes nas mesmas telas e APIs.
- Limitar recorrências a 52 ocorrências e rejeitar a série inteira quando alguma data conflitar.
- Nunca apagar comanda fechada nem transação ao remover um compromisso concluído da agenda.
- Derivar bandeira e limite de parcelas de `formas_pagamento`; não confiar em valores arbitrários do cliente.
- Manter validação de conflito no banco como última barreira contra concorrência.

---

### Task 1: Catálogo e disponibilidade pública

**Files:**
- Modify: `src/app/agendar/page.tsx`
- Modify: `src/lib/appointment-availability.ts`
- Modify: `src/app/api/appointments/route.ts`
- Test: `tests/e2e/specs/agenda-comandas.spec.ts`

**Interfaces:**
- Produces: busca textual/categoria de serviços, catálogo limitado à unidade, `getAvailableSlots` sem horários passados e resposta HTTP 409 para exclusão de sobreposição.

- [ ] Adicionar estado `serviceQuery` e `serviceCategory`, normalizar texto com `normalize('NFD')` e renderizar somente `filteredServices`.
- [ ] Filtrar profissionais e serviços por `selectedUnit.id`, limpando seleções dependentes ao trocar unidade.
- [ ] Em `getAvailableSlots`, quando `date` for hoje em `America/Sao_Paulo`, excluir inícios anteriores ao horário atual arredondado ao próximo bloco de 30 minutos.
- [ ] Mapear erro PostgreSQL `23P01` do insert público para HTTP 409.
- [ ] Verificar: selecionar unidade/profissional, buscar “escova”, selecionar uma data e confirmar que apenas horários livres e futuros aparecem.

### Task 2: Recorrência e movimentação entre datas

**Files:**
- Create: `src/lib/appointment-recurrence.ts`
- Create: `src/components/modals/MoverAgendamentoModal.tsx`
- Modify: `src/components/modals/NovoAgendamentoModal.tsx`
- Modify: `src/app/admin/agenda/page.tsx`
- Modify: `src/app/api/admin/comandas/route.ts`
- Modify: `src/app/api/admin/agendamentos/route.ts`
- Test: `tests/appointment-recurrence-validator.js`

**Interfaces:**
- Produces: `buildRecurrenceDates(startDate, { frequency, occurrences })`, payload `recorrencia: { frequencia: 'semanal' | 'mensal'; ocorrencias: number }` e `PATCH /api/admin/agendamentos` com `{ agendamento_id, data_agendamento, hora_inicio, profissional_id }`.

- [ ] Criar gerador determinístico que mantenha o dia semanal ou o dia mensal (limitando ao último dia do mês) e no máximo 52 ocorrências.
- [ ] Adicionar “Não repetir / Semanal / Mensal” e quantidade ao modal de novo agendamento.
- [ ] No POST administrativo, gerar as datas no servidor, salvar cada instância pela RPC existente e compensar qualquer falha cancelando as instâncias já criadas.
- [ ] Implementar PATCH autenticado que valide UUID/data/hora, atualize agendamento e campos de agenda da comanda vinculada, deixando a constraint de sobreposição rejeitar conflitos.
- [ ] Adicionar ação “Mover” em cada cartão e modal com nova data, horário e profissional; recarregar a data de destino após sucesso.
- [ ] Verificar recorrência semanal/mensal e tentativa de reagendamento para horário ocupado.

### Task 3: Remover compromisso concluído da agenda

**Files:**
- Create: `supabase/migrations/<timestamp>_agenda_payment_details.sql`
- Modify: `src/app/api/admin/agendamentos/route.ts`
- Modify: `src/app/admin/agenda/page.tsx`

**Interfaces:**
- Produces: `remove_appointment_from_calendar_atomic(uuid, uuid)` e DELETE com `remove_from_calendar=true`.

- [ ] Criar função `SECURITY INVOKER` que bloqueie unidades divergentes, permita apagar agendamento sem comanda e permita apagar o vínculo somente se a comanda estiver fechada; comanda/transação permanecem.
- [ ] Trocar a lixeira da agenda para cancelar comanda apenas quando aberta e remover da agenda quando fechada/concluída.
- [ ] Verificar que a venda fechada continua na aba de comandas/financeiro e o horário desaparece da agenda.

### Task 4: Formas de pagamento configuráveis

**Files:**
- Modify: `supabase/migrations/<timestamp>_agenda_payment_details.sql`
- Modify: `src/app/api/admin/fechar-comanda/route.ts`
- Modify: `src/components/modals/ComandaViewDrawer.tsx`
- Modify: `src/types/supabase.ts`

**Interfaces:**
- Produces: colunas `transacoes.forma_pagamento_id`, `transacoes.parcelas`, `transacoes.bandeira` e RPC `close_comanda_with_payment_atomic(bigint, uuid, integer, numeric, uuid, uuid)`.

- [ ] Adicionar colunas, FK e checks (`parcelas >= 1`) em migração.
- [ ] Criar wrapper transacional que valida forma ativa/unidade, `permite_parcelamento`, `max_parcelas` e `min_valor_parcela`, chama o fechamento existente e persiste metadados na transação.
- [ ] Carregar `formas_pagamento` ativas no drawer e exibir nomes/bandeiras configurados.
- [ ] Exibir seletor de parcelas somente quando permitido, com opções que respeitem máximo e valor mínimo.
- [ ] Enviar apenas ID da forma e parcelas; a API/RPC derivam tipo e bandeira do banco.
- [ ] Verificar crédito parcelável, débito sem parcelas e rejeição de parcela fora da regra.

### Task 5: Consulta rápida do cliente

**Files:**
- Create: `src/components/modals/ClienteQuickViewModal.tsx`
- Modify: `src/app/admin/comandas/page.tsx`
- Modify: `src/components/modals/ComandaViewDrawer.tsx`

**Interfaces:**
- Produces: `ClienteQuickViewModal({ clienteId, isOpen, onClose })` com contato, cadastro, resumo financeiro, pacotes e próximos agendamentos.

- [ ] Criar modal grande e acessível, fechar por Escape/overlay, restaurar foco e carregar os dados somente quando aberto.
- [ ] Adicionar botão de olho ao nome do cliente nos cartões de comandas.
- [ ] Adicionar o mesmo botão no bloco Cliente do drawer.
- [ ] Incluir link explícito para o perfil completo sem substituir o popup.
- [ ] Verificar abertura, dados, fechamento e ausência do botão em comandas sem cliente.

### Task 6: Verificação final

**Files:**
- Test: `tests/e2e/specs/agenda-comandas.spec.ts`

**Interfaces:**
- Consumes: todos os contratos acima.

- [ ] Executar `node tests/appointment-recurrence-validator.js` e esperar `PASS`.
- [ ] Executar `npx tsc --noEmit --incremental false` e esperar código 0.
- [ ] Executar ESLint nos arquivos alterados e esperar código 0.
- [ ] Aplicar a migração em ambiente de desenvolvimento, consultar colunas/funções e testar as rotas autenticadas.
- [ ] Recarregar `localhost:3100` e realizar os fluxos completos no navegador.
