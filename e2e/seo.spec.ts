import { test, expect } from '@playwright/test';
import { settle } from './helpers';

const SEO_ROUTES = ['/', '/en', '/research', '/en/research', '/projects', '/writing', '/contact'];

test.describe('SEO', () => {
  for (const route of SEO_ROUTES) {
    test(`${route} 有 title、description、og:title`, async ({ page }) => {
      await page.goto(route);
      await settle(page);

      const title = await page.title();
      expect(title.length, `${route} title 为空`).toBeGreaterThan(0);

      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc?.trim().length ?? 0, `${route} description 为空`).toBeGreaterThan(0);

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle?.trim().length ?? 0, `${route} og:title 为空`).toBeGreaterThan(0);

      // 只有一个 h1
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }

  test('sitemap.xml 返回 200 且包含 URL', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('<urlset');
    expect(text).toMatch(/<loc>https?:\/\//);
  });

  test('robots.txt 返回 200 且引用 sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toContain('user-agent');
    expect(text.toLowerCase()).toContain('sitemap');
  });

  test('首页包含 Person JSON-LD', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasPerson = jsonLd.some((s) => s.includes('"Person"'));
    expect(hasPerson, '首页缺少 Person Schema').toBe(true);
  });
});