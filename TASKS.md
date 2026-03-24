# Tarefas Pendentes — Otimiza Beauty

## 🗄️ Banco de Dados — manual no Supabase SQL Editor
- [ ] **1.** Executar `database/VIEWS_HORARIOS_VAGOS.sql`
- [ ] **2.** Executar DROP tabelas legadas (appointments, services, professionals, transactions, users, blocked_times, inventory, products, inventory_logs)

## 📦 Estoque / Produtos
- [ ] **3.** Separar páginas: `/admin/estoque` filtra `uso_interno`, `/admin/produtos` filtra `revenda`
- [ ] **4.** ProdutoModal — adicionar campo `tipo` (revenda / uso_interno) visível no formulário

## 🧾 Comandas
- [ ] **5.** ComandaModal — implementar baixa automática de `quantidade` ao adicionar produto vendido
- [ ] **6.** ComandaModal — registrar consumo de estoque interno (colorações usadas no serviço)

## 📊 Dashboard / Relatórios
- [ ] **7.** Dashboard — validar cards de faturamento e agendamentos com tabelas novas
- [ ] **8.** Relatórios — testar todas as funções de `relatorios.ts` com dados reais

## 🗓️ Agenda
- [ ] **9.** Testar `fn_horarios_vagos` após executar as views (depende da task 1)
- [ ] **10.** Testar drag-drop com etapas + auxiliar nas duas colunas

## ⚙️ Outros
- [ ] **11.** Verificar/desativar do menu: contas-receber, cheques, debitos, saldos, orcamentos
- [ ] **12.** Testar `horarios_por_dia` — criação e edição de profissional
