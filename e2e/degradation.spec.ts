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

  test('首页四处 3D 在无 WebGL 下全部降级且正文完整', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-no-webgl', '仅在无 WebGL 项目运行');
    await page.goto('/');
    await settle(page);

    // 全页无 Canvas：Hero / About 头像 / Journey / Contact 都不创建 WebGL 上下文
    expect(await page.locator('canvas').count()).toBe(0);
    await expect(page.locator('h1')).toBeVisible();

    for (const id of ['about', 'journey', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page.locator(`#${id} h2`).first()).toBeVisible();
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await expect(page.locator('[data-about-avatar]')).toHaveAttribute('data-avatar-reason', 'no-webgl');
    await expect(page.locator('[data-journey-canvas]')).toHaveAttribute('data-journey-mode', 'no-webgl');
    await expect(page.locator('[data-contact-3d]')).toHaveAttribute('data-contact-mode', 'no-webgl');

    // 降级视觉是静态/CSS 占位，不靠 Canvas 呈现信息
    await expect(page.locator('[data-avatar-fallback-caption]')).toBeVisible();
    await expect(page.locator('[data-about-bio]').first()).toBeVisible();
  });

  const LIST_ROUTES = [
    { route: '/research', visual: '[data-research-3d]', mode: 'data-research-mode', items: '[data-research-item]' },
    { route: '/en/research', visual: '[data-research-3d]', mode: 'data-research-mode', items: '[data-research-item]' },
    { route: '/projects', visual: '[data-projects-3d]', mode: 'data-projects-mode', items: '[data-project-item]' },
    { route: '/en/projects', visual: '[data-projects-3d]', mode: 'data-projects-mode', items: '[data-project-item]' },
    { route: '/products', visual: '[data-products-3d]', mode: 'data-products-mode', items: '[data-product-item]' },
    { route: '/en/products', visual: '[data-products-3d]', mode: 'data-products-mode', items: '[data-product-item]' },
    { route: '/writing', visual: '[data-writing-3d]', mode: 'data-writing-mode', items: '[data-writing-item]' },
    { route: '/en/writing', visual: '[data-writing-3d]', mode: 'data-writing-mode', items: '[data-writing-item]' },
  ];

  for (const target of LIST_ROUTES) {
    test(`${target.route} 列表 3D 降级但卡片可读`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-no-webgl', '仅在无 WebGL 项目运行');
      await page.goto(target.route);
      await settle(page);

      expect(await page.locator('canvas').count()).toBe(0);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.locator(target.items).count()).toBeGreaterThan(0);
      await expect(page.locator(target.items).first()).toBeVisible();

      // /writing 有「已离开首屏」门槛（scrollY>0），需真实滚动页面而非仅滚动元素
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.locator(target.visual).scrollIntoViewIfNeeded();
      await expect(page.locator(target.visual)).toHaveAttribute(target.mode, 'no-webgl');
    });
  }

  for (const route of ['/contact', '/en/contact']) {
    test(`${route} 独立路由无 WebGL 仍可联系`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-no-webgl', '仅在无 WebGL 项目运行');
      await page.goto(route);
      await settle(page);
      expect(await page.locator('canvas').count()).toBe(0);
      await expect(page.locator('[data-contact-email]')).toBeVisible();
      await expect(page.locator('[data-contact-mailto]')).toBeVisible();
    });
  }
});