# Project: Otimiza Beauty - Corrections and Enhancements

## Architecture
- **Frontend Framework**: Next.js 16.2.10 (App Router) with React 19.2.7.
- **UI Components**: TailwindCSS, custom UI components in `src/components/ui/`, modals, and layouts.
- **Database/Backend**: clientes Supabase canônicos separam browser, sessão SSR e backend privilegiado. No teste, 56/56 tabelas têm RLS e as 50 tabelas de negócio são isoladas por unidade.
- **State Management**: Zustand and React Hook Form.

### Key Data Models
1. **Comandas (`comandas`)**:
   - `id`: BIGINT (PK)
   - `cliente_id`: BIGINT (FK)
   - `status`: VARCHAR ('aberta', 'paga', 'cancelada')
   - `total`: NUMERIC
   - `desconto`: NUMERIC
2. **Comanda Itens (`comanda_itens`)**:
   - `id`: UUID (PK)
   - `comanda_id`: BIGINT (FK)
   - `tipo`: VARCHAR ('servico', 'produto', 'pacote')
   - `item_id`: UUID
   - `valor_unitario`: NUMERIC
   - `quantidade`: INT
   - `valor_total`: NUMERIC
3. **Pacotes Cliente (`pacotes_cliente`)**:
   - `id`: UUID (PK)
   - `cliente_id`: BIGINT (FK)
   - `servico_id`: UUID (FK)
   - `sessoes_total`: INT
   - `sessoes_consumidas`: INT
   - `data_validade`: DATE
4. **Estoque Movimentações (`estoque_movimentacoes`)**:
   - `id`: UUID (PK)
   - `produto_id`: UUID (FK)
   - `quantidade`: INT
   - `tipo`: VARCHAR ('entrada', 'saida', 'uso_interno')
5. **Transações (`transacoes`)**:
   - `id`: UUID (PK)
   - `cliente_id`: BIGINT (FK)
   - `valor`: NUMERIC
   - `tipo`: VARCHAR ('receita', 'despesa')

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Track Setup | Setup E2E test framework, write Tiers 1-4 tests, and publish `TEST_READY.md` | None | IN_PROGRESS (Conv: 254d86ae-7e5e-45ec-999c-54c14328b710) |
| 2 | Comanda Drawer Fixes (R1 & R2) | Fix discount calculation (R1) and Comanda deletion calendar sync (R2) in `ComandaViewDrawer.tsx` and `agenda/page.tsx` | None | IN_PROGRESS (Conv: e18578cd-536f-475d-9e02-b2df21b3577b) |
| 3 | Pacote & Venda Rápida (R3 & R4) | Modal/interface for package sales (R3) and fast counter sales (R4) via QuickActions | M2 | PLANNED |
| 4 | Consumo Interno (R5) | Add option to FAB, show only `uso_interno` products, log movement in `estoque_movimentacoes` | M2 | PLANNED |
| 5 | Comanda Dinâmica (R6) | Support adding Services, Products, and Pacotes to active comandas in `ComandaViewDrawer.tsx` | M3, M4 | PLANNED |
| 6 | Histórico Consolidado (R7) | Complete customer profile showing purchases, active packages, and future appointments | M5 | PLANNED |
| 7 | Verification & Hardening | Ensure 100% of E2E tests pass, then run Tier 5 adversarial coverage hardening | M1, M6 | PLANNED |

---

## Interface Contracts

### 1. `pacotes.ts` functions:
- `verificarPacoteAtivo(cliente_id: number, servico_id?: string): Promise<PacoteAtivo[]>`
- `debitarSessaoPacote(pacoteId: string): Promise<boolean>`
- `registrarCompraPacote(params: { comandaId: number | null; clienteId: number; clienteCpf: string | null; itensPacote: Array<{ item_id: string; quantidade: number }>; unitId: string; }): Promise<void>`

### 2. Comanda Deletion:
- Action inside `ComandaViewDrawer.tsx` must either cancel or delete comanda depending on selection and call the proper reload handler in `agenda/page.tsx`.

---

## Code Layout
- `src/app/admin/agenda/page.tsx` - Calendar view page
- `src/app/admin/clientes/page.tsx` - Clients list page
- `src/components/modals/ComandaViewDrawer.tsx` - Comanda details drawer
- `src/components/layout/QuickActions.tsx` - FAB quick action list
- `src/services/pacotes.ts` - Package logic service helper
- `src/app/admin/clientes/[id]/page.tsx` - Client profile consolidated history (to be created)
