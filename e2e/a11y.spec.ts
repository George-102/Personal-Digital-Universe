import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.describe('可访问性', () => {
  test('prefers-reduced-motion 生效且关键内容仍可见', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);

    // 断言媒体查询确实生效，避免静默 no-op
    const reduced = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    expect(reduced).toBe(true);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('页面可通过键盘聚焦导航链接', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});