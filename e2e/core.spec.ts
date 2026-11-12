import { test, expect } from '@playwright/test';
import {
  settle,
  expectNoHorizontalOverflow,
  expectCtaNotCovered,
} from './helpers';

test.describe('核心可用性', () => {
  test('首页显示姓名、身份和 Explore 入口', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /explore/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('导航点击到达对应 section', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    // 移动端导航收在折叠菜单里（US-004e）：先展开再点击，桌面端直接点击横排项
    const menuButton = page.getByRole('button', { name: /menu|导航|菜单/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
    await page.getByRole('link', { name: /about|关于/i }).first().click();
    await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
  });

  test('移动端菜单可展开和关闭', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await settle(page);
    const menuButton = page.getByRole('button', { name: /menu|导航|菜单/i });
    await menuButton.click();
    await expect(page.getByRole('navigation').last()).toBeVisible();
    await menuButton.click();
    await expectNoHorizontalOverflow(page);
  });

  test('CTA 不被 3D Canvas 遮挡', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expectCtaNotCovered(page, 'a[href="#about"], a[href="/en#about"]');
  });
});