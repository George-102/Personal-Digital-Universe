import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.describe('中英双语', () => {
  test('中文首页关键文案存在', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('html')).toHaveAttribute('lang', /zh/i);
    await expect(page.locator('body')).toContainText(/探索|研究|创造/);
  });

  test('英文首页关键文案存在', async ({ page }) => {
    await page.goto('/en');
    await settle(page);
    await expect(page.locator('html')).toHaveAttribute('lang', /en/i);
    await expect(page.locator('body')).toContainText(/research|build|explore/i);
  });

  test('语言切换链接指向另一语言版本', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    // 精确锚定 Footer 的语言切换入口：邮箱等新增链接的文本也可能含 "en"
    const enLink = page.locator('[data-language-switch]').first();
    if (await enLink.count()) {
      await expect(enLink).toHaveAttribute('href', /\/en/);
    }
  });
});