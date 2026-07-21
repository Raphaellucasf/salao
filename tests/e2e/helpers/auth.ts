import { Page, expect } from '@playwright/test';

function requiredCredential(name: 'E2E_ADMIN_EMAIL' | 'E2E_ADMIN_PASSWORD' | 'E2E_PROFESSIONAL_EMAIL' | 'E2E_PROFESSIONAL_PASSWORD') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} deve ser definida para executar testes E2E autenticados`);
  return value;
}

/**
 * Common E2E authentication helper functions.
 */
export async function loginAsAdmin(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill email and password fields
  await page.fill('input[type="email"]', requiredCredential('E2E_ADMIN_EMAIL'));
  await page.fill('input[type="password"]', requiredCredential('E2E_ADMIN_PASSWORD'));
  
  // Click submit button
  await page.click('button[type="submit"]');
  
  // Verify redirect to admin dashboard
  await expect(page).toHaveURL(/\/admin/);
}

export async function loginAsProfessional(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill email and password fields
  await page.fill('input[type="email"]', requiredCredential('E2E_PROFESSIONAL_EMAIL'));
  await page.fill('input[type="password"]', requiredCredential('E2E_PROFESSIONAL_PASSWORD'));
  
  // Click submit button
  await page.click('button[type="submit"]');
  
  // Verify redirect to professionals/agenda dashboard
  await expect(page).toHaveURL(/\/admin\/agenda/);
}
