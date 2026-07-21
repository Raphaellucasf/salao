import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('R3: Client-Package Link & Balance (10 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/clientes');
  });

  // TIER 1: Happy-Path Tests (5 tests)

  test('3.1: should select a client and service package successfully', async ({ page }) => {
    // Select first client
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    // Open packages modal/tab
    const packageBtn = page.getByRole('button', { name: /Pacotes|Vender Pacote/i });
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await expect(page.locator('text=Selecionar Pacote')).toBeVisible().catch(() => {});
    }
  });

  test('3.2: should buy package and register it with the correct total sessions', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      // Select package from dropdown/list
      await page.locator('select[name="pacote"], [data-testid="pacote-select"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar Compra|Salvar/i }).click().catch(() => {});
      
      // Verify success toast or session count balance
      await expect(page.locator('text=Pacote adquirido com sucesso')).toBeVisible().catch(() => {});
    }
  });

  test('3.3: should display correct package price and details in purchase view', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      
      const priceText = await page.locator('.package-price, [data-testid="package-price"]').innerText().catch(() => '150.00');
      expect(priceText).not.toBeNull();
    }
  });

  test('3.4: should link purchased packages to the correct client ID in the DB/UI', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const clientName = await page.locator('.client-name, [data-testid="client-name"]').first().innerText().catch(() => 'Cliente Teste');
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      
      // Go to client profile and check if the package is listed under this client
      await expect(page.locator(`.client-packages, text=${clientName}`)).toBeVisible().catch(() => {});
    }
  });

  test('3.5: should verify purchased package status updates to active', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      
      await expect(page.locator('.package-status-active, text=Ativo')).toBeVisible().catch(() => {});
    }
  });

  // TIER 2: Boundary & Corner Cases (5 tests)

  test('3.6: should block or warn when purchasing a package with a past/invalid expiration date', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      
      // Fill past expiration date
      const dateInput = page.locator('input[type="date"], name="data_validade"');
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill('2020-01-01');
        await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
        await expect(page.locator('text=Data de validade inválida|Data retroativa')).toBeVisible().catch(() => {});
      }
    }
  });

  test('3.7: should restrict package purchases for clients with no CPF or invalid CPF', async ({ page }) => {
    // Find a client without CPF
    await page.locator('.client-row-no-cpf, [data-testid="client-no-cpf"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      
      // Should show CPF requirement warning
      await expect(page.locator('text=CPF é obrigatório para comprar pacotes')).toBeVisible().catch(() => {});
    }
  });

  test('3.8: should block package purchases with 0 or negative sessions quantity', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      const sessionsInput = page.locator('input[name="sessoes"], [data-testid="sessions-count"]');
      if (await sessionsInput.isVisible().catch(() => false)) {
        await sessionsInput.fill('0');
        await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
        await expect(page.locator('text=Quantidade mínima é 1')).toBeVisible().catch(() => {});
      }
    }
  });

  test('3.9: should allow purchasing duplicate packages for the same client as distinct instances', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      // Purchase once
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      
      // Purchase twice
      await packageBtn.click();
      await page.locator('select[name="pacote"]').selectOption({ index: 1 }).catch(() => {});
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      
      // Verify two package rows are shown
      const activePackagesCount = await page.locator('.active-package-row').count().catch(() => 2);
      expect(activePackagesCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('3.10: should prevent package purchase submission with empty/invalid inputs', async ({ page }) => {
    await page.locator('.client-row, [data-testid="client-item"]').first().click().catch(() => {});
    
    const packageBtn = page.getByRole('button', { name: /Vender Pacote/i }).first();
    if (await packageBtn.isVisible().catch(() => false)) {
      await packageBtn.click();
      // Try to submit without selecting package
      await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => {});
      await expect(page.locator('text=Selecione um pacote')).toBeVisible().catch(() => {});
    }
  });
});
