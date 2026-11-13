import { test, expect, type Page } from '@playwright/test';

/** Tiny valid 64×48 PNG generated in the page (no fixture file needed) */
async function makePng(page: Page): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#3d5afe';
    ctx.fillRect(0, 0, 64, 48);
    return c.toDataURL('image/png').split(',')[1]!;
  });
  return { name: 'photo-test.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

test.describe('WhatMedia PWA App Flow & Privacy', () => {
  test.use({ locale: 'fr-FR' });

  test('strictly prohibits outgoing network calls to third-party domains', async ({ page }) => {
    const thirdPartyRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol.startsWith('http')) {
        thirdPartyRequests.push(request.url());
      }
    });

    await page.goto('/app/');
    await expect(page).toHaveTitle(/WhatMedia/i);

    // Process a photo end to end: still nothing may leave the origin.
    await page.locator('input[type=file]').setInputFiles(await makePng(page));
    await page.getByRole('button', { name: 'Optimiser maintenant' }).click();
    await expect(page.getByRole('heading', { name: /Prêt pour ton statut/ })).toBeVisible({ timeout: 20_000 });

    expect(thirdPartyRequests).toHaveLength(0);
  });

  test('renders home screen elements properly in French by default', async ({ page }) => {
    await page.goto('/app/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prépare ton statut/i);
    await expect(page.getByText(/Sur ton téléphone$/)).toBeVisible();
    await expect(page.getByText(/Gratuit$/)).toBeVisible();
    await expect(page.getByText(/Open source$/)).toBeVisible();

    // Mandatory disclaimer
    await expect(page.getByText(/WhatMedia n’est pas affilié à WhatsApp/i)).toBeVisible();
  });

  test('switches language between FR and EN', async ({ page }) => {
    await page.goto('/app/');

    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prepare your status/i);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: 'Passer en français' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prépare ton statut/i);
  });

  test('rejects unsupported files with a clear message', async ({ page }) => {
    await page.goto('/app/');
    await page.locator('input[type=file]').setInputFiles({
      name: 'notes.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 not media'),
    });
    await expect(page.getByRole('alert')).toContainText('notes.pdf');
  });

  test('optimizes a photo and offers it for sharing or saving', async ({ page }) => {
    await page.goto('/app/');
    await page.locator('input[type=file]').setInputFiles(await makePng(page));

    await expect(page.getByRole('heading', { name: 'photo-test.png' })).toBeVisible();
    await page.getByRole('button', { name: 'Optimiser maintenant' }).click();

    await expect(page.getByRole('heading', { name: /Prêt pour ton statut/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('whatmedia-photo-test.jpg')).toBeVisible();
    await expect(page.getByRole('button', { name: /(Partager|Enregistrer), whatmedia-photo-test\.jpg/ }).first()).toBeVisible();
  });
});

test.describe('Anonymous usage counter', () => {
  test.use({ locale: 'fr-FR' });

  test('sends only the kind and number of parts, and nothing after opting out', async ({ page }) => {
    const bodies: string[] = [];
    await page.route('**/api/v1/stats/event', async (route) => {
      bodies.push(route.request().postData() ?? '');
      await route.fulfill({ status: 204 });
    });
    await page.goto('/app/');
    await page.locator('input[type=file]').setInputFiles(await makePng(page));
    await page.getByRole('button', { name: 'Optimiser maintenant' }).click();
    await expect(page.getByRole('heading', { name: /Prêt pour ton statut/ })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => bodies.length).toBe(1);
    expect(JSON.parse(bodies[0]!)).toEqual({ kind: 'photo', parts: 1 });

    // Opt out, process again: nothing is sent
    await page.getByRole('checkbox', { name: /Compter anonymement/ }).uncheck();
    await page.getByRole('button', { name: 'Optimiser un autre média' }).click();
    await page.locator('input[type=file]').setInputFiles(await makePng(page));
    await page.getByRole('button', { name: 'Optimiser maintenant' }).click();
    await expect(page.getByRole('heading', { name: /Prêt pour ton statut/ })).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(500);
    expect(bodies).toHaveLength(1);
  });
});

test.describe('Installation', () => {
  test.use({ locale: 'fr-FR' });

  test('offers an Install button that explains how to install on this device', async ({ page }) => {
    await page.goto('/app/');
    await page.getByRole('banner').getByRole('button', { name: 'Installer' }).click();
    const dialog = page.getByRole('dialog', { name: 'Installer WhatMedia' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Fermer' }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe('Multiple selection', () => {
  test.use({ locale: 'fr-FR' });

  test('processes every selected file automatically and lists all results', async ({ page }) => {
    await page.goto('/app/');
    const png = await makePng(page);
    await page.locator('input[type=file]').setInputFiles([
      { ...png, name: 'photo-a.png' },
      { ...png, name: 'photo-b.png' },
      { ...png, name: 'photo-c.png' },
    ]);

    await expect(page.getByRole('heading', { name: '3 fichiers sélectionnés' })).toBeVisible();
    // Remove one file from the selection
    await page.getByRole('button', { name: 'Retirer photo-c.png' }).click();
    await page.getByRole('button', { name: 'Tout optimiser (2)' }).click();

    await expect(page.getByText('Fichiers prêts : 2 sur 2 (2 à partager).')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('whatmedia-photo-a.jpg')).toBeVisible();
    await expect(page.getByText('whatmedia-photo-b.jpg')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tout enregistrer' })).toBeVisible();
  });
});

test.describe('English browser', () => {
  test.use({ locale: 'en-US' });

  test('defaults to English when the browser prefers it', async ({ page }) => {
    await page.goto('/app/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Prepare your status/i);
  });
});
