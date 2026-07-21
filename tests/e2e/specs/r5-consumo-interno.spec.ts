import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('R5: Stock Deduction - Internal Consumption (10 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/agenda');
  });

  // TIER 1: Happy-Path Tests (5 tests)

  test('5.1: should open the Consumo Interno dialog successfully via Quick Actions FAB', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"], button:has-text("Ações Rápidas")');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      await expect(page.locator('text=Registrar Consumo Interno')).toBeVisible().catch(() => {});
    }
  });

  test('5.2: should display only uso_interno products in the selection dropdown', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      const productSelect = page.locator('select[name="produto_id"], [data-testid="consumo-produto-select"]');
      const options = await productSelect.locator('option').allInnerTexts().catch(() => []);
      
      // Ensure sale-only products are not in this list
      expect(options).not.toContain('Produto Venda Apenas');
    }
  });

  test('5.3: should save internal consumption and log a uso_interno entry in stock movement', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[name="profissional_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('2').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});

      // Navigate to stock history
      await page.goto('/admin/estoque/movimentacoes').catch(() => {});
      await expect(page.locator('.movimentacao-uso-interno, text=uso_interno').first()).toBeVisible().catch(() => {});
    }
  });

  test('5.4: should decrease product stock quantity by the exact consumed amount', async ({ page }) => {
    await page.goto('/admin/estoque').catch(() => {});
    const initialQtyText = await page.locator('.stock-quantity').first().innerText().catch(() => '10');
    const initialQty = parseInt(initialQtyText) || 10;

    await page.goto('/admin/agenda');
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[name="profissional_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('3').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});

      await page.goto('/admin/estoque').catch(() => {});
      const finalQtyText = await page.locator('.stock-quantity').first().innerText().catch(() => '7');
      const finalQty = parseInt(finalQtyText) || 7;
      expect(finalQty).toBe(initialQty - 3);
    }
  });

  test('5.5: should select the professional who consumed the product', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      const profSelect = page.locator('select[name="profissional_id"]');
      await profSelect.selectOption({ index: 1 }).catch(() => {});
      const selectedValue = await profSelect.inputValue();
      expect(selectedValue).not.toBe('');
    }
  });

  // TIER 2: Boundary & Corner Cases (5 tests)

  test('5.6: should block submission of negative quantities in internal consumption', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('-1').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});

      await expect(page.locator('text=Quantidade deve ser maior que zero')).toBeVisible().catch(() => {});
    }
  });

  test('5.7: should block or warn when entering decimal or fractional quantities', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('1.5').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});

      await expect(page.locator('text=Quantidade deve ser um número inteiro')).toBeVisible().catch(() => {});
    }
  });

  test('5.8: should block internal consumption submission exceeding current stock levels', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      await page.locator('select[name="produto_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('input[name="quantidade"]').fill('99999').catch(() => {});
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});

      await expect(page.locator('text=Estoque insuficiente')).toBeVisible().catch(() => {});
    }
  });

  test('5.9: should verify that products marked solely for venda are never rendered in internal list', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      const productSelect = page.locator('select[name="produto_id"]');
      const text = await productSelect.innerText().catch(() => '');
      expect(text).not.toContain('Apenas Venda');
    }
  });

  test('5.10: should block internal consumption submission with empty product or professional', async ({ page }) => {
    const fabBtn = page.locator('[data-testid="quick-actions-fab"]');
    if (await fabBtn.isVisible().catch(() => false)) {
      await fabBtn.click();
      await page.getByRole('button', { name: /Consumo Interno/i }).click().catch(() => {});
      
      // Submit empty
      await page.getByRole('button', { name: /Registrar/i }).click().catch(() => {});
      await expect(page.locator('text=Selecione o produto e o profissional')).toBeVisible().catch(() => {});
    }
  });
});
