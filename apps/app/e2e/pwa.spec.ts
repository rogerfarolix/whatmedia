import { test, expect } from '@playwright/test';

test.describe('WhatMedia PWA App Flow & Privacy', () => {
  test('strictly prohibits outgoing network calls to third-party domains', async ({ page }) => {
    const thirdPartyRequests: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());
      // In local dev/preview, localhost / 127.0.0.1 is origin.
      if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        thirdPartyRequests.push(request.url());
      }
    });

    await page.goto('/app/');
    await expect(page).toHaveTitle(/WhatMedia/i);
    expect(thirdPartyRequests).toHaveLength(0);
  });

  test('renders home screen elements properly in French by default', async ({ page }) => {
    await page.goto('/app/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prépare ton statut/i);
    await expect(page.getByText('100 % sur ton téléphone')).toBeVisible();
    await expect(page.getByText('Gratuit')).toBeVisible();
    await expect(page.getByText('Open source')).toBeVisible();

    // Mandatory disclaimer
    await expect(page.getByText(/WhatMedia n'est pas affilié à WhatsApp/i)).toBeVisible();
  });

  test('switches language between FR and EN', async ({ page }) => {
    await page.goto('/app/');

    // Click English switch button
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prepare your status/i);

    // Switch back to French
    await page.getByRole('button', { name: 'Passer en français' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prépare ton statut/i);
  });
});
