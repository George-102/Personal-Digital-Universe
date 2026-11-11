import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.describe('主题切换', () => {
  test('切换主题后属性变化，刷新后保持', async ({ page }) => {
    test.fixme(true, 'US-019 明暗主题切换（roadmap）未实现：落地后移除本行');
    await page.goto('/');
    await settle(page);

    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    const toggle = page.getByRole('button', { name: /theme|主题|dark|light/i }).first();
    await toggle.click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);

    await page.reload();
    await settle(page);
    await expect(html).toHaveAttribute('data-theme', after!);
  });
});