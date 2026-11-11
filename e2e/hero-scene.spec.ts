import { test, expect } from '@playwright/test';
import { settle, waitForSceneReady, expectCtaNotCovered } from './helpers';

test.describe('Hero 3D 场景', () => {
  test('支持 WebGL 时渲染 3D 场景且文字不被遮挡', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');

    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);

    await expect(page.locator('canvas[data-ready="1"]')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expectCtaNotCovered(page, 'a[href="#about"]');
  });

  test('无 WebGL 时不渲染 Canvas，CSS 背景兜底', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-no-webgl', '仅在无 WebGL 项目运行');

    await page.goto('/');
    await settle(page);

    await expect(page.locator('canvas')).toHaveCount(0);
    const bg = page.locator('.hero-bg');
    await expect(bg).toHaveCount(1);
    const box = await bg.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);
    await expect(page.locator('h1')).toBeVisible();
  });
});