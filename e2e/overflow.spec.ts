import { test } from '@playwright/test';
import { settle, expectNoHorizontalOverflow } from './helpers';

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

const ROUTES = ['/', '/en', '/research', '/projects', '/writing'];

test.describe('响应式无横向溢出', () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${viewport.width}px ${route}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route);
        await settle(page);
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});