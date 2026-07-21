# E2E Testing Infrastructure Document

This document defines the E2E testing framework, database mappings, authentication strategies, test suite structures, and command reference for the **Otimiza Beauty Manager** system.

---

## 1. Test Philosophy

We believe in a tiered testing strategy that ensures high quality and reliability. Our tests are organized into four tiers:
1. **Tier 1: Feature Coverage (Happy-Path Tests)** - Verifying basic correctness and standard workflows.
2. **Tier 2: Boundary & Corner Cases** - Verifying behavior under extreme input, invalid fields, and unexpected actions.
3. **Tier 3: Cross-Feature Combinations (Integration)** - Checking how multiple system capabilities function when combined.
4. **Tier 4: Real-World Scenarios** - Verifying longer stateful flows that mimic actual operational journeys.

Tests must be robust, repeatable, and run sequentially to avoid state pollution on the shared database. Selectors should target standard form elements, button text, labels, and roles, ensuring resilience to minor UI refactoring.

---

## 2. Feature Inventory

The suite consists of **82 test cases** distributed across 9 files:

### R1: Bug - Cálculo de desconto (10 tests in `r1-desconto.spec.ts`)
* **Happy-Path (Tier 1)**:
  1. Test valid percentage discount calculation.
  2. Test valid value discount calculation.
  3. Test total remains positive and doesn't reset to 0 on discount modification.
  4. Test total equals subtotal when discount is 0.
  5. Test discount field updates visually in UI and persists.
* **Boundary & Corner Cases (Tier 2)**:
  6. Test negative discount value is blocked or clamped to 0.
  7. Test discount greater than subtotal is capped/prevented from producing negative total.
  8. Test non-numeric characters inside discount input.
  9. Test discount formatting behavior (e.g. entering decimals, currency symbols).
  10. Test applying discount to an empty comanda with subtotal 0.

### R2: Comanda Deletion & Calendar Sync (10 tests in `r2-exclusao.spec.ts`)
* **Happy-Path (Tier 1)**:
  11. Test deleting an open comanda.
  12. Test calendar reload is triggered automatically on deletion.
  13. Test deletion details modal closes successfully.
  14. Test related appointment UI state updates immediately.
  15. Test deletion removes comanda from list.
* **Boundary & Corner Cases (Tier 2)**:
  16. Test deleting a paid/closed comanda is blocked or shows error.
  17. Test deleting a comanda when offline or DB error occurs (graceful handling).
  18. Test deleting a comanda with associated active services (foreign key/relations checks).
  19. Test concurrent attempts to delete the same comanda.
  20. Test delete button visibility based on user roles (Admin vs. Professional).

### R3: Pacotes (10 tests in `r3-pacotes.spec.ts`)
* **Happy-Path (Tier 1)**:
  21. Test selecting a client and service package.
  22. Test buy package registers package with correct total sessions.
  23. Test package price and details display correctly in purchase view.
  24. Test packages link to the client ID correctly.
  25. Test package status updates to active upon purchase.
* **Boundary & Corner Cases (Tier 2)**:
  26. Test purchasing a package with a past/invalid expiration date.
  27. Test purchasing a package for a client with no CPF/invalid CPF.
  28. Test purchasing a package with 0 or negative sessions.
  29. Test purchasing duplicate packages for the same client (should allow multiple distinct active instances).
  30. Test purchasing a package with empty/invalid inputs.

### R4: Venda Rápida (10 tests in `r4-venda-rapida.spec.ts`)
* **Happy-Path (Tier 1)**:
  31. Test recording a fast counter product sale.
  32. Test fast sale generates a paid comanda automatically.
  33. Test transaction registry creates a 'receita' entry with correct amount.
  34. Test fast sale updates product stock quantity correctly.
  35. Test default payment method selection in fast sale interface.
* **Boundary & Corner Cases (Tier 2)**:
  36. Test fast sale with 0 items (should be blocked).
  37. Test fast sale with negative quantity (should be blocked or clamped).
  38. Test fast sale with missing payment method.
  39. Test fast sale when product is out of stock (should show warning/error).
  40. Test fast sale with exceeding stock quantity.

### R5: Consumo Interno (10 tests in `r5-consumo-interno.spec.ts`)
* **Happy-Path (Tier 1)**:
  41. Test opening the "Consumo Interno" dialog.
  42. Test only `uso_interno` products appear in the selection list.
  43. Test saving an internal consumption entry logs a 'uso_interno' stock movement.
  44. Test product stock quantity decreases by the consumed amount.
  45. Test professional selector registers who consumed the product.
* **Boundary & Corner Cases (Tier 2)**:
  46. Test entering negative quantity in internal consumption.
  47. Test entering decimal/fractional quantity in internal consumption.
  48. Test entering quantity exceeding current stock.
  49. Test that products with `tipo = 'venda'` are never displayed in the list.
  50. Test submitting with empty product or professional selection.

### R6: Comanda Dinâmica (10 tests in `r6-comanda-dinamica.spec.ts`)
* **Happy-Path (Tier 1)**:
  51. Test dynamically adding a service to an active comanda.
  52. Test dynamically adding a product to an active comanda.
  53. Test dynamically adding a package to an active comanda.
  54. Test dynamic item additions recalculate subtotal and total correctly.
  55. Test removing an item from the active comanda recalculates total correctly.
* **Boundary & Corner Cases (Tier 2)**:
  56. Test debiting a package session from a client who has 0 sessions left.
  57. Test adding an out of stock product to the comanda (displays warning/error).
  58. Test adding negative quantity of items.
  59. Test updating item quantity to 0 (should prompt removal or remove automatically).
  60. Test adding a package session from an expired package.

### R7: Histórico Cliente (10 tests in `r7-historico-cliente.spec.ts`)
* **Happy-Path (Tier 1)**:
  61. Test clicking "Perfil Completo" navigates to the consolidated profile page.
  62. Test profile displays the correct client identification details.
  63. Test profile lists correct purchase history with accurate totals.
  64. Test profile shows active package session balances.
  65. Test profile lists upcoming appointments.
* **Boundary & Corner Cases (Tier 2)**:
  66. Test client with no transaction/purchase history shows empty state message.
  67. Test client with no active packages shows empty state message.
  68. Test client with no upcoming appointments shows empty state message.
  69. Test profile behavior for a newly registered client with no history at all.
  70. Test profile loader showing fallback/skeleton state when query takes long.

### Tier 3 Cross-Feature Integration (7 tests in `tier3-combinations.spec.ts`)
* **Happy-Path & Boundary Combination Flows**:
  71. **R3 + R6 (Package Purchase & Session Consumption)**: Purchase a package (R3), open an active comanda (R6), consume a session of that package, and verify that the session balance decreases.
  72. **R2 + R1 (Delete & Recalculate)**: Open a comanda, apply a discount (R1), delete it (R2), and verify that reports ignore both the subtotal and discount.
  73. **R4 + R5 (Fast Sale & Internal Consumption)**: Sell a product via fast sale (R4), verify stock, then perform internal consumption (R5) of the same product and verify final stock.
  74. **R6 + R7 (Dynamic Comanda & Profile Update)**: Dynamically modify items, close the comanda, and check that the client profile history updates immediately.
  75. **R1 + R6 (Dynamic Discount)**: Add items to a comanda dynamically, apply a discount, add more items, and verify that the discount is correctly computed and applied to the final subtotal.
  76. **R3 + R7 (Package Purchase & Profile Balances)**: Purchase a package and immediately verify that the client profile reflects the new package balance and valid date.
  77. **R2 + R7 (Comanda Deletion & History Sync)**: Delete a comanda and verify that it disappears instantly from the client's history.

### Tier 4 Real-World Scenarios (5 tests in `tier4-scenarios.spec.ts`)
* **Real-world Operational Scenarios**:
  78. **Scenario 1: Client Onboarding and Session Journey**: Register new client, buy a package, schedule two appointments, complete the first and consume a session, check that remaining balance is 4 and profile history is updated.
  79. **Scenario 2: Professional Commission and Comanda Deletion**: Professional performs service, comanda created with discount, professional checks dashboard for commission, comanda is later deleted, commission is verified to be retracted.
  80. **Scenario 3: Stock Alert and Direct Counter Sale**: Fast sale is performed on low-stock item triggering alert, internal consumption is done, stock level becomes zero, system blocks further sales of that item.
  81. **Scenario 4: Multi-Service Appointment Checkout**: Client receives multiple services and purchases a product, discount is applied, package session is debited, transaction is finalized, verify financial entries.
  82. **Scenario 5: End of Day Reconciliation**: Professional records fast sales, internal consumption of supplies, closes open comandas. Admin reconciles total transactions, verifies stock decreases and cash drawer totals.

---

## 3. Test Architecture

The E2E test suite leverages Playwright (`@playwright/test`) for browser-based automation.

- **Configuration File**: `playwright.config.ts`
- **Application URL**: `http://localhost:3000`
- **Test Specs Location**: `tests/e2e/specs/`
- **Test Helpers Location**: `tests/e2e/helpers/`
- **Concurrency Mode**: Sequential (`workers: 1`) to prevent concurrent test database pollution on the shared Supabase backend.
- **Video & Screenshots**: Captures screenshots and video recordings on failure for troubleshooting.
- **Authentication**: credenciais nunca são versionadas. A suíte exige `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_PROFESSIONAL_EMAIL` e `E2E_PROFESSIONAL_PASSWORD`, configuradas localmente para contas descartáveis e exclusivas do Supabase de teste. A ausência de qualquer variável interrompe o teste antes do login.

### Database Schema Mappings
| Requirement ID | Description | Primary Database Tables | Crucial Columns / Actions |
|----------------|-------------|-------------------------|--------------------------|
| **R1** | Discount calculation bug fix | `comandas`, `comanda_itens` | `comandas.total`, `comandas.desconto`, `comanda_itens.valor_total` |
| **R2** | Comanda deletion calendar sync | `comandas`, `agendamentos` | `comandas.status`, `agendamentos.comanda_id`, `excluir_comanda()` RPC |
| **R3** | Client-Package link & balance | `pacotes_cliente`, `clientes`, `pacotes_servicos` | `pacotes_cliente.cliente_id`, `pacotes_cliente.sessoes_total`, `pacotes_cliente.sessoes_consumidas`, `pacotes_cliente.data_validade` |
| **R4** | Fast Counter Sales (direct sale) | `comandas`, `comanda_itens`, `transacoes` | `comandas.status = 'paga'`, `transacoes.tipo = 'receita'`, `transacoes.valor` |
| **R5** | Stock deduction (internal use) | `produtos`, `estoque_movimentacoes` | `produtos.tipo = 'uso_interno'`, `estoque_movimentacoes.tipo = 'uso_interno'` |
| **R6** | Dynamic Comanda (agenda items) | `comandas`, `comanda_itens`, `pacotes_cliente` | `comanda_itens.tipo` ('servico', 'produto', 'pacote'), `debitarSessaoPacote` |
| **R7** | Customer Consolidated Profile | `clientes`, `comandas`, `pacotes_cliente`, `agendamentos` | Aggregates user transactions, active package balances, and future schedules |

---

## 4. Real-World Application Scenarios (Tier 4)

Tier 4 tests execute long, stateful flows that model actual beauty salon operations:

### 1. Client Onboarding and Session Journey
This scenario models a new client's complete journey from registry to package consumption:
- Admin registers a new client (providing CPF and Birthdate).
- Client purchases a 5-session Massage Package (R3).
- Admin schedules 2 appointments for the client.
- Client completes the first appointment; admin opens comanda, consumes 1 package session (R6), closes comanda.
- Verify remaining package balance is exactly 4 sessions.
- Check client profile history (R7) for accurate consolidated status.

### 2. Professional Commission and Comanda Deletion
This scenario ensures that professional commission calculations are correctly synced with comanda deletions:
- A professional performs a service.
- Admin opens a comanda, applies a discount (R1), and saves it.
- Professional opens the dashboard/agenda and checks that their commission was registered based on the discounted subtotal.
- Admin deletes/cancels the comanda (R2).
- Verify that the professional's commission is instantly revoked or updated, and the calendar reloads to show the updated status.

### 3. Stock Alert and Direct Counter Sale
This scenario validates the real-time stock alert system and sales blocks:
- A direct counter sale (R4) is initiated for a product that is near its minimum stock warning threshold.
- The system shows a visual alert.
- Professional executes an internal consumption (R5) for the same product, reducing the stock to zero.
- Professional attempts another fast sale for the product, and the system blocks the action due to zero stock.

### 4. Multi-Service Appointment Checkout
This scenario models a complex checkout process involving multiple service types:
- Client completes an appointment containing multiple services and buys a retail product.
- Admin applies a discount, consumes one session from an active package (R6), and pays the rest with credit card.
- Verify that all records are saved correctly: the package session is debited, the transaction table records the retail revenue, and the final comanda amount is recalculated.

### 5. End of Day Reconciliation
This scenario models the closing process of the salon:
- Professional records fast sales (R4), registers internal consumption of supplies (R5), and completes open comandas.
- Admin opens the financial dashboard, reconciles total cash/card transactions, verifies stock level decreases, and asserts that no orphaned open comandas remain.

---

## 5. Coverage Thresholds

- **E2E Test Case Coverage**: 100% of defined 82 test cases must be implemented in the specs.
- **Build Quality**: 0 TypeScript compilation or syntax errors are allowed within the E2E directory.
- **Flakiness Tolerance**: Default retry of 1 is configured to account for minor UI load fluctuations.
- **Failures Allowed**: Assertions in the E2E tests are allowed to fail if the underlying application feature is not yet fully implemented by the development track.

---

## 6. Execution and Reporting Commands

Use the following commands to run and inspect E2E tests:

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run E2E tests with the Playwright UI Runner
npm run test:e2e:ui

# Show the HTML report of the last run
npx playwright show-report
```
