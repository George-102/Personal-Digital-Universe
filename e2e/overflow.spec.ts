import { test, expect } from '@playwright/test';
import { settle, expectNoHorizontalOverflow } from './helpers';

/** US-021d：四档设备（Desktop / Laptop / Tablet / Mobile）视口矩阵 */
const VIEWPORTS = [
  { width: 1920, height: 1080, tier: 'desktop', representative: true },
  { width: 1440, height: 900, tier: 'desktop', representative: false },
  { width: 1280, height: 800, tier: 'laptop', representative: true },
  { width: 1024, height: 768, tier: 'laptop', representative: false },
  { width: 820, height: 1180, tier: 'tablet', representative: true },
  { width: 768, height: 1024, tier: 'tablet', representative: false },
  { width: 390, height: 844, tier: 'mobile', representative: true },
  { width: 375, height: 667, tier: 'mobile', representative: false },
];

/** 全部已实现路由的双语版本；代表视口逐个跑 */
const ALL_ROUTES = [
  '/',
  '/en',
  '/research',
  '/en/research',
  '/research/llm-marl',
  '/en/research/llm-marl',
  '/projects',
  '/en/projects',
  '/products',
  '/en/products',
  '/writing',
  '/en/writing',
  '/skills',
  '/en/skills',
  '/writing/fayuan',
  '/en/writing/fayuan',
  '/contact',
  '/en/contact',
];

/** 边界视口跑核心路由，控制用例数量同时覆盖档位边界 */
const CORE_ROUTES = ['/', '/en', '/research', '/projects', '/writing', '/skills', '/contact'];

test.describe('响应式无横向溢出', () => {
  for (const viewport of VIEWPORTS) {
    const routes = viewport.representative ? ALL_ROUTES : CORE_ROUTES;
    for (const route of routes) {
      test(`${viewport.tier} ${viewport.width}px ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(route);
        // 防 404 空过：路由必须真实存在（溢出断言对错误页也会通过）
        expect(response?.status(), `${route} 应返回 200`).toBe(200);
        await settle(page);
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});
