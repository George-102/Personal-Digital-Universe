import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.describe('首页探索入口', () => {
  test('Explore 点击后平滑滚动到 #about', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const behavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(behavior).toBe('smooth');

    await page.getByRole('link', { name: /explore/i }).click();
    await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
  });

  test('首页提供滚动提示', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-scroll-hint]')).toBeVisible();
  });

  test('reduced-motion 时滚动提示停止动画且平滑滚动关闭', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);

    const hint = page.locator('[data-scroll-hint]');
    await expect(hint).toBeVisible();
    const animation = await hint.evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
    const behavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(behavior).toBe('auto');
  });
});