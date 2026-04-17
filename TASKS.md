# Tarefas Pendentes — Otimiza Beauty

_Última atualização: 13/04/2026_

## 🗄️ Banco de Dados — manual no Supabase SQL Editor
- [x] **1.** Executar `database/VIEWS_HORARIOS_VAGOS.sql` ✅ 13/04/2026
- [x] **2.** Executar DROP tabelas legadas (appointments, services, professionals, transactions, users, blocked_times, inventory, products, inventory_logs) ✅ 13/04/2026
- [x] T-01 Criar `fechamentos_caixa` ✅ 13/04/2026
- [x] T-02 Criar `pacotes_cliente` ✅ 13/04/2026
- [x] T-03 Adicionar campos `cadastro_completo` / `origem_cadastro` em clientes ✅ 13/04/2026
- [x] T-04 Adicionar desconto auditado em comandas + tabela `comissoes` ✅ 13/04/2026
- [x] T-05 Criar `webhook_log` (idempotência n8n) ✅ 13/04/2026
- [x] Aplicar `fix_rls_tenant_isolation.sql` (RLS por unit_id) ✅ 13/04/2026

## 📦 Estoque / Produtos
- [x] **3.** Separar páginas: `/admin/estoque` filtra `uso_interno`, `/admin/produtos` filtra `revenda` ✅
- [x] **4.** ProdutoModal — campo `tipo` (revenda / uso_interno / insumo) ✅

## 🧾 Comandas
- [x] **5.** ComandaModal — baixa automática de `quantidade` ao adicionar produto vendido ✅
- [x] **6.** ComandaModal — consumo de estoque interno (colorações usadas no serviço) ✅

## 🔐 Segurança
- [x] `src/middleware.ts` — proteger rotas server-side ✅ 13/04/2026
- [x] `src/lib/api-auth.ts` — role check em API routes admin ✅

## 📊 Dashboard / Relatórios
- [x] **7.** Dashboard — faturamento/comissões corrigidos para usar `transacoes` e `comissoes` (schema real) ✅ 13/04/2026
- [x] **8.** Relatórios — `relatorios.ts` corrigido (timezone off-by-one, parseFloat em Valor) ✅ 13/04/2026

## 🗓️ Agenda
- [ ] **9.** Testar `fn_horarios_vagos` após executar as views (depende da task 1)
- [ ] **10.** Testar drag-drop com etapas + auxiliar nas duas colunas

## ⚙️ Outros
- [x] **11.** Desativar do menu: contas-receber, cheques, debitos, saldos, orcamentos (redirect) ✅
- [ ] **12.** Testar `horarios_por_dia` — criação e edição de profissional

## 🧹 Limpeza Técnica
- [x] Deletar `src/middleware.ts.bak` ✅ 13/04/2026
- [x] Deletar `src/proxy.ts` ✅ 13/04/2026
- [x] Deletar `src/app/admin/dashboard-new.tsx` ✅ 13/04/2026
- [x] Deletar `src/components/modals/ServicoModal.tsx.bak` ✅ 13/04/2026
- [ ] Avaliar `src/app/admin/servicos-new/page.tsx` — remover ou linkar no sidebar
