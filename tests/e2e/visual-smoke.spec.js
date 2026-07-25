import { expect, test } from '@playwright/test';
import { loginDemoUser, resetBrowserState } from '../helpers/e2e.js';

const protectedViews = [
  { name: 'dashboard', heading: 'Dashboard', open: async () => {} },
  { name: 'clients', heading: 'Klienci', open: async (page) => page.getByRole('link', { name: /Klienci/ }).click() },
  { name: 'client-detail', heading: 'Nova Studio', open: async (page) => page.goto('/#/clients/c1') },
  { name: 'projects', heading: 'Zlecenia', open: async (page) => page.getByRole('link', { name: /Zlecenia/ }).click() },
  { name: 'project-detail', heading: 'Wdrożenie panelu klienta', open: async (page) => page.goto('/#/projects/p1') },
  { name: 'calendar', heading: 'Kalendarz', open: async (page) => page.getByRole('link', { name: /Kalendarz/ }).click() },
  { name: 'settings', heading: 'Ustawienia', open: async (page) => page.getByRole('link', { name: /Ustawienia/ }).click() }
];

test('login theme toggle synchronizes persisted preference with dashboard', async ({ page }, testInfo) => {
  const moonPath =
    'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z';
  const sunPath =
    'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z';

  await resetBrowserState(page);
  await expect(page.getByRole('heading', { name: 'Zaloguj się do FlowDesk' })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/theme-light/);

  const darkThemeToggle = page.getByRole('button', { name: 'Włącz ciemny motyw' });
  await expect(darkThemeToggle.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(darkThemeToggle.locator('svg')).toHaveAttribute('focusable', 'false');
  await expect(darkThemeToggle.locator('path')).toHaveAttribute('d', moonPath);
  await darkThemeToggle.click();

  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await expect(page.getByRole('button', { name: 'Włącz jasny motyw' }).locator('path')).toHaveAttribute('d', sunPath);

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await expect(page.getByRole('button', { name: 'Włącz jasny motyw' })).toBeVisible();

  await loginDemoUser(page);
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await page.getByRole('button', { name: 'Włącz jasny motyw' }).click();
  await expect(page.locator('body')).toHaveClass(/theme-light/);

  await page.goto('/#/login');
  await expect(page.getByRole('button', { name: 'Włącz ciemny motyw' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await testInfo.attach('visual-smoke-login-theme', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
});
test('dashboard badges keep shared visual treatment across themes and viewport sizes', async ({ page }) => {
  await resetBrowserState(page);
  await loginDemoUser(page);

  const badges = page.locator('.dashboard-list .badge');
  await expect(badges.first()).toBeVisible();
  await expect(page.locator('.dashboard-list .badge--danger').first()).toBeVisible();
  await expect(page.locator('.dashboard-list .badge--info').first()).toBeVisible();
  await expect(page.locator('.dashboard-list .badge--warning').first()).toBeVisible();
  await expect(badges.first()).toHaveCSS('border-top-width', '0px');
  await expect(badges.first()).toHaveCSS('gap', '4px');

  await page.getByRole('button', { name: 'Włącz ciemny motyw' }).click();
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await expect(badges.first()).toHaveCSS('border-top-width', '0px');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
for (const view of protectedViews) {
  test(`${view.name} layout renders core landmarks`, async ({ page }, testInfo) => {
    await resetBrowserState(page);
    await loginDemoUser(page);
    await view.open(page);

    await expect(page.getByRole('heading', { name: view.heading })).toBeVisible();
    await expect(page.locator('.app__shell')).toBeVisible();
    await expect(page.locator('.topbar')).toBeVisible();
    await testInfo.attach(`visual-smoke-${view.name}`, {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  });
}
test('public legal pages share theme preference with dashboard', async ({ page }) => {
  await resetBrowserState(page);

  const moonPath =
    'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z';
  const sunPath =
    'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z';
  const legalPages = [
    { href: '/polityka-prywatnosci.html', link: 'Polityka prywatności', heading: 'Polityka prywatności' },
    { href: '/regulamin.html', link: 'Regulamin', heading: 'Regulamin Serwisu' },
    { href: '/cookies.html', link: 'Polityka cookies', heading: 'Polityka cookies' }
  ];

  for (const legalPage of legalPages) {
    await expect(page.getByRole('link', { name: legalPage.link, exact: true })).toHaveAttribute('href', legalPage.href);
  }

  await page.goto(legalPages[0].href);
  await expect(page.getByRole('heading', { name: legalPages[0].heading, exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/theme-light/);

  const darkThemeToggle = page.getByRole('button', { name: 'Włącz ciemny motyw' });
  await expect(darkThemeToggle.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(darkThemeToggle.locator('svg')).toHaveAttribute('focusable', 'false');
  await expect(darkThemeToggle.locator('path')).toHaveAttribute('d', moonPath);
  await darkThemeToggle.click();

  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await expect(page.getByRole('button', { name: 'Włącz jasny motyw' }).locator('path')).toHaveAttribute('d', sunPath);
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('flowdesk_state_v1')).ui.theme)).toBe('dark');

  for (const legalPage of legalPages.slice(1)) {
    await page.goto(legalPage.href);
    await expect(page.getByRole('heading', { name: legalPage.heading, exact: true })).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await expect(page.getByRole('button', { name: 'Włącz jasny motyw' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Otwórz demo', exact: true })).toHaveAttribute('href', '/#/login');
  }

  await page.goto('/#/login');
  await loginDemoUser(page);
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
  await page.getByRole('button', { name: 'Włącz jasny motyw' }).click();

  await page.goto('/cookies.html');
  await expect(page.locator('body')).toHaveClass(/theme-light/);
  await expect(page.getByRole('button', { name: 'Włącz ciemny motyw' })).toBeVisible();
});
