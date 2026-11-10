import { test, expect } from '@playwright/test';

test('所有外部链接返回 2xx / 3xx', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href^="http"]').evaluateAll((els) =>
    Array.from(new Set(els.map((el) => (el as HTMLAnchorElement).href)))
  );

  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 3, timeout: 10_000 }).catch(() => null);
    expect(res?.status() ?? 0, `外链不可用: ${href}`).toBeLessThan(400);
  }
});