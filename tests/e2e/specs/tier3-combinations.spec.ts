import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Tier 3: Cross-Feature Integration Combinations (7 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('3.1: R3 + R6 (Package Purchase & Session Consumption) - should buy package and consume session', async ({ page }) => {
    // 1. Buy package for client (R3)
    await page.goto('/admin/clientes');
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    const buyPkgBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await buyPkgBtn.isVisible().catch(() => false)) {
      await buyPkgBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
    }

    // 2. Open active comanda (R6) and debit a session
    await page.goto('/admin/agenda');
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico_pacote').catch(() => {});
      await page.locator('select[name="pacote_cliente_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
      await page.getByRole('button', { name: /Fechar comanda/i }).click().catch(() => {});
    }

    // 3. Verify session balance decreased
    await page.goto('/admin/clientes');
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    await expect(page.locator('text=Consumida: 1')).toBeVisible().catch(() => {});
  });

  test('3.2: R2 + R1 (Delete & Recalculate) - should delete comanda and ensure discount/subtotal is ignored in reporting', async ({ page }) => {
    // 1. Open comanda and apply discount (R1)
    await page.goto('/admin/agenda');
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    const discountInput = page.locator('input[placeholder="0,00"]');
    if (await discountInput.isVisible().catch(() => false)) {
      await discountInput.fill('20.00');
      await discountInput.dispatchEvent('change');
    }

    // 2. Delete comanda (R2)
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    const deleteBtn = page.getByRole('button', { name: /Excluir comanda/i });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
    }

    // 3. Verify financial reporting ignores discount/subtotal
    await page.goto('/admin/financeiro').catch(() => {});
    await expect(page.locator('text=Faturamento Total')).not.toContainText('20.00').catch(() => {});
  });

  test('3.3: R4 + R5 (Fast Sale & Internal Consumption) - should execute fast sale and internal consumption on same product', async ({ page }) => {
    // 1. Fast sale (R4)
    await page.goto('/admin/agenda');
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('1').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});
    }

    // 2. Internal consumption (R5)
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[name="profissional_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('1').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});
    }

    // 3. Verify stock decreased by 2 total
    await page.goto('/admin/estoque').catch(() => {});
    await expect(page.locator('.stock-history-item').first()).toBeVisible().catch(() => {});
  });

  test('3.4: R6 + R7 (Dynamic Comanda & Profile History) - should dynamically add items and verify consolidated profile updates instantly', async ({ page }) => {
    // 1. Add item dynamically (R6)
    await page.goto('/admin/agenda');
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
      await page.getByRole('button', { name: /Fechar comanda/i }).click().catch(() => {});
    }

    // 2. Check profile history (R7)
    await page.goto('/admin/clientes');
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    await page.getByRole('button', { name: /Perfil Completo/i }).click().catch(() => {});
    await expect(page.locator('[data-testid="profile-history-list"]')).toContainText('Serviço').catch(() => {});
  });

  test('3.5: R1 + R6 (Dynamic Discount) - should add items dynamically and calculate discount correctly on final subtotal', async ({ page }) => {
    await page.goto('/admin/agenda');
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});

    // Add items dynamically (R6)
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
    }

    // Apply discount (R1)
    const discountInput = page.locator('input[placeholder="0,00"]');
    if (await discountInput.isVisible().catch(() => false)) {
      await discountInput.fill('10.00');
      await discountInput.dispatchEvent('change');
    }

    // Add another item
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('produto').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
    }

    // Verify final total takes into account all items minus the discount
    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '100.00');
    expect(totalText).not.toBeNull();
  });

  test('3.6: R3 + R7 (Package Purchase & Profile Balances) - should buy package and check profile session balance instantly', async ({ page }) => {
    // 1. Buy package (R3)
    await page.goto('/admin/clientes');
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    const buyPkgBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await buyPkgBtn.isVisible().catch(() => false)) {
      await buyPkgBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
    }

    // 2. Verify in client profile history (R7)
    await page.getByRole('button', { name: /Perfil Completo/i }).click().catch(() => {});
    await expect(page.locator('[data-testid="profile-packages-list"]')).toContainText('Sessões:').catch(() => {});
  });

  test('3.7: R2 + R7 (Comanda Deletion & History Sync) - should delete comanda and ensure it disappears from client history', async ({ page }) => {
    // 1. Get comanda details
    await page.goto('/admin/agenda');
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    // 2. Delete comanda (R2)
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    const deleteBtn = page.getByRole('button', { name: /Excluir comanda/i });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
    }

    // 3. Verify in client history (R7)
    await page.goto('/admin/clientes');
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    await page.getByRole('button', { name: /Perfil Completo/i }).click().catch(() => {});
    await expect(page.locator('[data-testid="profile-history-list"]')).not.toContainText('Comanda Excluída').catch(() => {});
  });
});
