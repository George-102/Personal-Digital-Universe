import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.describe('WebGL / 3D 降级', () => {
  test('无 WebGL 时文字和导航仍可见', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-no-webgl', '仅在无 WebGL 项目运行');

    await page.goto('/');
    await settle(page);

    // 核心文字必须可见
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();

    // 3D Canvas 不应成为白屏/空白全屏遮挡
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount > 0) {
      const box = await page.locator('canvas').first().boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(0);
      expect(box?.height ?? 0).toBeGreaterThan(0);
    }
  });

  test('3D 资源 404 时不白屏', async ({ page }) => {
    // 拦截常见 3D 资源，模拟加载失败
    await page.route('**/*.{glb,gltf,ktx2,hdr}', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /explore/i })).toBeVisible();
  });
});