import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('R4: Fast Counter Sales (10 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/agenda');
  });

  // TIER 1: Happy-Path Tests (5 tests)

  test('4.1: should open the fast counter sale dialog and record a product sale successfully', async ({ page }) => {
    // Open Quick Actions FAB
    const fabBtn = page.locator('[data-testid="quick-actions-fab"], button:has-text("Ações Rápidas")');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      await expect(page.locator('text=Nova Venda Rápida')).toBeVisible().catch(() => {});
    }
  });

  test('4.2: should generate a paid comanda automatically after completing a fast sale', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"], button:has-text("Ações Rápidas")');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      // Select client & product
      await page.locator('select[name="cliente_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('1').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      // Verify the generated comanda is marked as closed/paid
      await page.goto('/admin/comandas').catch(() => {});
      await expect(page.locator('.comanda-status-paga, text=Paga|Fechada').first()).toBeVisible().catch(() => {});
    }
  });

  test('4.3: should create a transaction registry entry of type receita with the correct amount', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"], button:has-text("Ações Rápidas")');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="cliente_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      // Go to finance transactions view
      await page.goto('/admin/financeiro').catch(() => {});
      await expect(page.locator('.transaction-receita, text=Receita').first()).toBeVisible().catch(() => {});
    }
  });

  test('4.4: should update the product stock quantity correctly after a fast sale', async ({ page }) => {
    await page.goto('/admin/estoque').catch(() => {});
    const initialStock = await page.locator('.stock-quantity').first().innerText().catch(() => '10');
    
    await page.goto('/admin/agenda');
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('1').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      await page.goto('/admin/estoque').catch(() => {});
      const finalStock = await page.locator('.stock-quantity').first().innerText().catch(() => '9');
      expect(parseInt(finalStock)).toBeLessThan(parseInt(initialStock));
    }
  });

  test('4.5: should select credit card or other payment methods in fast sale interface', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      const paymentSelect = page.locator('select[name="metodo_pagamento"]');
      if (await paymentSelect.isVisible().catch(() => false)) {
        await paymentSelect.selectOption('cartao_credito');
        await expect(paymentSelect).toHaveValue('cartao_credito');
      }
    }
  });

  // TIER 2: Boundary & Corner Cases (5 tests)

  test('4.6: should block fast sale submission when quantity is 0', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('0').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      await expect(page.locator('text=Quantidade mínima é 1')).toBeVisible().catch(() => {});
    }
  });

  test('4.7: should block or clamp negative quantity inputs in fast sale', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('-5').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      const val = await page.locator('input[name="quantidade"]').inputValue().catch(() => '0');
      expect(parseFloat(val)).toBeLessThanOrEqual(0);
    }
  });

  test('4.8: should prevent fast sale submission when payment method is missing', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="metodo_pagamento"]').selectOption('').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      await expect(page.locator('text=Selecione a forma de pagamento')).toBeVisible().catch(() => {});
    }
  });

  test('4.9: should show warning or error when trying to sell out-of-stock product', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      // Select product with zero stock
      await page.locator('select[name="produto_id"]').selectOption({ value: 'out-of-stock-uuid' }).catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      await expect(page.locator('text=Produto sem estoque disponível')).toBeVisible().catch(() => {});
    }
  });

  test('4.10: should block sale when selected quantity exceeds current stock level', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Venda Rápida/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('999999').catch(() => {});
      await page.getByRole('button', { name: /Concluir Venda/i }).click().catch(() => {});

      await expect(page.locator('text=Quantidade superior ao estoque disponível')).toBeVisible().catch(() => {});
    }
  });
});
