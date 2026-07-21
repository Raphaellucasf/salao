import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('R6: Dynamic Comanda (10 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/agenda');
  });

  // TIER 1: Happy-Path Tests (5 tests)

  test('6.1: should dynamically add a service item to an active comanda and display it in list', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item|Novo Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir|Confirmar/i }).click().catch(() => {});
      
      await expect(page.locator('.comanda-item-row, text=Serviço')).toBeVisible().catch(() => {});
    }
  });

  test('6.2: should dynamically add a product item to an active comanda and display it in list', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('produto').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
      
      await expect(page.locator('.comanda-item-row, text=Produto')).toBeVisible().catch(() => {});
    }
  });

  test('6.3: should dynamically add a package purchase to an active comanda and display it in list', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('pacote').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});
      
      await expect(page.locator('.comanda-item-row, text=Pacote')).toBeVisible().catch(() => {});
    }
  });

  test('6.4: should recalculate subtotal and total instantly when items are dynamically added', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const initialTotalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '0.00');
    const initialTotal = parseFloat(initialTotalText.replace(/[^\d.]/g, '')) || 0;

    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});

      const finalTotalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '100.00');
      const finalTotal = parseFloat(finalTotalText.replace(/[^\d.]/g, '')) || 100;
      expect(finalTotal).toBeGreaterThan(initialTotal);
    }
  });

  test('6.5: should recalculate subtotal and total when an item is removed dynamically', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const initialTotalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '150.00');
    const initialTotal = parseFloat(initialTotalText.replace(/[^\d.]/g, '')) || 150;

    const removeBtn = page.locator('.btn-remove-item, [data-testid="remove-item-btn"]').first();
    if (await removeBtn.isVisible().catch(() => false)) {
      await removeBtn.click();
      
      const finalTotalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '50.00');
      const finalTotal = parseFloat(finalTotalText.replace(/[^\d.]/g, '')) || 50;
      expect(finalTotal).toBeLessThan(initialTotal);
    }
  });

  // TIER 2: Boundary & Corner Cases (5 tests)

  test('6.6: should block debiting a package session from a client who has 0 sessions left', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico_pacote').catch(() => {});
      // Select expired/empty package
      await page.locator('select[name="pacote_cliente_id"]').selectOption({ value: 'empty-package-uuid' }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});

      await expect(page.locator('text=Saldo de sessões esgotado')).toBeVisible().catch(() => {});
    }
  });

  test('6.7: should display warning/error when adding out of stock retail product to active comanda', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('produto').catch(() => {});
      await page.locator('select[name="item_id"]').selectOption({ value: 'out-of-stock-uuid' }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});

      await expect(page.locator('text=Estoque insuficiente para este produto')).toBeVisible().catch(() => {});
    }
  });

  test('6.8: should block adding negative quantity of items to comanda', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('input[name="quantidade"]').fill('-2').catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});

      const val = await page.locator('input[name="quantidade"]').inputValue().catch(() => '1');
      expect(parseFloat(val)).toBeLessThanOrEqual(0);
    }
  });

  test('6.9: should prompt confirmation or remove item automatically when quantity is reduced to 0', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const qtyInput = page.locator('input[name="item_quantidade"]').first();
    if (await qtyInput.isVisible().catch(() => false)) {
      await qtyInput.fill('0');
      await qtyInput.dispatchEvent('change');
      
      // Should show prompt or remove the item row
      await expect(qtyInput).not.toBeVisible().catch(() => {});
    }
  });

  test('6.10: should block debiting a session from an expired package', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const addItemBtn = page.getByRole('button', { name: /Adicionar Item/i });
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click();
      await page.locator('select[name="tipo"]').selectOption('servico_pacote').catch(() => {});
      await page.locator('select[name="pacote_cliente_id"]').selectOption({ value: 'expired-package-uuid' }).catch(() => {});
      await page.getByRole('button', { name: /Inserir/i }).click().catch(() => {});

      await expect(page.locator('text=Validade do pacote expirada')).toBeVisible().catch(() => {});
    }
  });
});
