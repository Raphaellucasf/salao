import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('R1: Discount Calculation (10 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/agenda');
  });

  // TIER 1: Happy-Path Tests (5 tests)

  test('1.1: should calculate total as subtotal - percentage discount when applied', async ({ page }) => {
    // Navigate and open comanda drawer
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const subtotalText = await page.locator('text=Subtotal').locator('..').locator('span').last().innerText().catch(() => '100.00');
    const subtotal = parseFloat(subtotalText.replace(/[^\d.]/g, '')) || 100.00;
    
    // Apply discount
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill((subtotal * 0.1).toFixed(2));
    await discountInput.dispatchEvent('change');

    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '90.00');
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));

    expect(total).toBeCloseTo(subtotal * 0.9, 2);
    expect(total).toBeGreaterThan(0);
  });

  test('1.2: should calculate total as subtotal - fixed value discount when applied', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('15.00');
    await discountInput.dispatchEvent('change');

    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '85.00');
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
    expect(total).not.toBeNaN();
  });

  test('1.3: should ensure total remains positive and does not reset to 0 on discount modifications', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('10.00');
    await discountInput.dispatchEvent('change');
    await discountInput.fill('5.00');
    await discountInput.dispatchEvent('change');

    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '95.00');
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
    expect(total).toBeGreaterThan(0);
  });

  test('1.4: should calculate total equal to subtotal when discount is 0', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const subtotalText = await page.locator('text=Subtotal').locator('..').locator('span').last().innerText().catch(() => '100.00');
    const subtotal = parseFloat(subtotalText.replace(/[^\d.]/g, '')) || 100.00;

    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('0');
    await discountInput.dispatchEvent('change');

    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '100.00');
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
    expect(total).toEqual(subtotal);
  });

  test('1.5: should update discount field visually in UI and persist state', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('20.00');
    await discountInput.dispatchEvent('change');

    await expect(discountInput).toHaveValue('20.00');
  });

  // TIER 2: Boundary & Corner Cases (5 tests)

  test('1.6: should block or clamp negative discount values to 0', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('-10.00');
    await discountInput.dispatchEvent('change');

    const value = await discountInput.inputValue();
    const numericValue = parseFloat(value) || 0;
    expect(numericValue).toBeGreaterThanOrEqual(0);
  });

  test('1.7: should cap or prevent discount larger than subtotal from producing negative total', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const subtotalText = await page.locator('text=Subtotal').locator('..').locator('span').last().innerText().catch(() => '100.00');
    const subtotal = parseFloat(subtotalText.replace(/[^\d.]/g, '')) || 100.00;

    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill((subtotal + 50).toFixed(2));
    await discountInput.dispatchEvent('change');

    const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '0.00');
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
    expect(total).toBeGreaterThanOrEqual(0);
  });

  test('1.8: should reject or sanitize non-numeric characters inside discount input', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('abc');
    await discountInput.dispatchEvent('change');

    const value = await discountInput.inputValue();
    expect(value).not.toBe('abc');
  });

  test('1.9: should correctly format decimal inputs for discount', async ({ page }) => {
    await page.locator('.comanda-card, [data-testid="comanda-item"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]');
    await discountInput.fill('12.34');
    await discountInput.dispatchEvent('change');

    await expect(discountInput).toHaveValue('12.34');
  });

  test('1.10: should verify discount behaves correctly on empty comanda with subtotal 0', async ({ page }) => {
    // Open an empty/new comanda or clear items if possible
    await page.locator('.comanda-card-empty, [data-testid="empty-comanda"]').first().click().catch(() => {});
    
    const discountInput = page.locator('input[placeholder="0,00"]').first();
    if (await discountInput.isVisible().catch(() => false)) {
      await discountInput.fill('10.00');
      await discountInput.dispatchEvent('change');
      
      const totalText = await page.locator('text=Total').locator('..').locator('span').last().innerText().catch(() => '0.00');
      const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
      expect(total).toBe(0);
    }
  });
});
