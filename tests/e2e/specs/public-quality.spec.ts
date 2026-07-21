import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`páginas públicas sem overflow em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/login', '/agendar']) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} não deve ter overflow horizontal`).toBeLessThanOrEqual(1);
    }
  });
}

test('login possui nome acessível e navegação por teclado', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByRole('textbox', { name: /e-mail|email/i });
  const password = page.getByRole('textbox', { name: 'Senha', exact: true });
  const submit = page.getByRole('button', { name: /entrar/i });
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await expect(submit).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
