import { test, expect } from '@playwright/test';
import { settle } from './helpers';

async function webglAvailable(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  });
}

async function isDesktop(page: import('@playwright/test').Page) {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

const productFrames = async (page: import('@playwright/test').Page) =>
  Number(
    await page.evaluate(() => (window as unknown as { __productsFrames?: number }).__productsFrames ?? 0),
  );

const hoverIndex = async (page: import('@playwright/test').Page) =>
  Number(
    await page.evaluate(() => (window as unknown as { __productsHover?: number }).__productsHover ?? -1),
  );

/** US-013：独立开发的软件产品。首页精选与 /products 列表的信息主体均为静态 HTML。 */
test.describe('US-013 独立软件产品', () => {
  test('首页 #products 展示精选产品，卡片静态可读', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#products')).toBeVisible();
    await expect(page.locator('#products h2')).toHaveText('独立软件产品');
    await expect(page.locator('#products [data-product-item]')).toHaveCount(2);
    await expect(page.locator('#products [data-product-featured="true"]')).toHaveCount(2);
    await expect(page.locator('#products [data-product-name]').first()).toContainText(
      'Airspace Lab',
    );
    await expect(page.locator('#products [data-product-description]').first()).toContainText(
      '动态空域配置',
    );
    // 首页精简：不渲染功能 chip / 详情面板 / 封面图（TBT 瘦身），全量在 /products
    await expect(page.locator('#products [data-product-features]')).toHaveCount(0);
    await expect(page.locator('#products [data-product-details]')).toHaveCount(0);
    await expect(page.locator('#products [data-product-image]')).toHaveCount(0);
    await expect(page.locator('#products [data-products-all]')).toHaveAttribute(
      'href',
      '/products/',
    );
  });

  test('英文首页显示英文文案与英文列表入口', async ({ page }) => {
    await page.goto('/en');
    await settle(page);

    await expect(page.locator('#products h2')).toHaveText('Independent Software Products');
    await expect(page.locator('#products [data-product-item]')).toHaveCount(2);
    await expect(page.locator('#products [data-products-all]')).toHaveAttribute(
      'href',
      '/en/products/',
    );
  });

  test('无 JS 时首页精选内容完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#products [data-product-item]')).toHaveCount(2);
    await expect(page.locator('#products [data-product-name]').first()).toBeVisible();
    await expect(page.locator('#products [data-product-description]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('/products 列表页展示全部公开产品且 SEO 元数据独立', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/products\/$/,
    );
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('独立软件产品');
    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('[data-product-status-label="released"]').first()).toBeVisible();
  });

  test('/en/products 显示英文文案与独立 canonical', async ({ page }) => {
    await page.goto('/en/products');
    await settle(page);

    await expect(page.locator('h1')).toHaveText('Independent Software Products');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/products\/$/,
    );
    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('a[href="/products/"]')).toHaveCount(1);
  });

  test('列表页无 JS 时产品详情面板完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/products');
    await settle(page);

    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('[data-product-detail]')).toHaveCount(4);
    await expect(page.locator('[data-product-features]')).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test('sitemap 收录双语 /products', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text();
    expect(text).toContain('/products/');
    expect(text).toContain('/en/products/');
  });

  // ---------- US-013e：内联展开面板与降级 ----------

  test('点击卡片展开完整介绍，再次点击收起，焦点留在触发项', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    const first = page.locator('[data-product-item]').first();
    const summary = first.locator('summary');
    await summary.click();
    await expect(first.locator('details')).toHaveAttribute('open', '');
    await expect(first.locator('[data-product-detail]')).toContainText('完整介绍');
    expect(
      await page.evaluate(() => document.activeElement?.hasAttribute('data-product-expand')),
    ).toBe(true);

    await summary.click();
    await expect(first.locator('details')).not.toHaveAttribute('open', '');
  });

  test('访问入口与仓库按钮是安全外链，未配置链接的产品不渲染按钮', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    const visits = page.locator('[data-product-visit]');
    const repos = page.locator('[data-product-repo]');
    await expect(visits).toHaveCount(2);
    await expect(repos).toHaveCount(2);
    for (const link of [...(await visits.all()), ...(await repos.all())]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect((await link.getAttribute('href'))?.startsWith('https://')).toBe(true);
    }
    // Daily Brief 未配置 url/repo：不渲染任何访问/仓库按钮（AC4）
    const dailyBrief = page.locator('[data-product-slug="daily-brief"]');
    await expect(dailyBrief.locator('[data-product-visit]')).toHaveCount(0);
    await expect(dailyBrief.locator('[data-product-repo]')).toHaveCount(0);
  });

  test('多卡片互斥展开，Esc 收起已展开项', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    const cards = page.locator('[data-product-item]');
    await cards.nth(0).locator('summary').click();
    await cards.nth(1).locator('summary').click();
    await expect(cards.nth(0).locator('details')).not.toHaveAttribute('open', '');
    await expect(cards.nth(1).locator('details')).toHaveAttribute('open', '');

    await page.keyboard.press('Escape');
    await expect(cards.nth(1).locator('details')).not.toHaveAttribute('open', '');
  });

  test('未配置图片的产品使用统一占位，键盘可达展开控件（触摸目标 ≥44px）', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    // 4 款产品均未配置 logo/cover → 全部走 CSS 渐变占位（AC5）
    await expect(page.locator('[data-product-has-cover="false"]')).toHaveCount(4);
    await expect(page.locator('.product-cover--placeholder')).toHaveCount(4);
    const summary = page.locator('[data-product-expand]').first();
    const box = await summary.boundingBox();
    expect(box && box.height >= 44).toBeTruthy();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-product-item]').first().locator('details')).toHaveAttribute(
      'open',
      '',
    );
  });
});

// ---------- US-013f：3D 产品展台概念视觉层 ----------

test.describe('US-013f 3D 产品展台', () => {
  test('列表页 3D 进入视口后挂载并渲染，概念标注在 DOM', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    await expect(page.locator('[data-products-concept-note]')).toHaveText(
      '产品展台 3D 效果为概念性视觉呈现，不影响产品信息阅读',
    );
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await expect(page.locator('[data-products-3d] canvas')).toHaveCount(0);
      await expect(page.locator('[data-product-item]')).toHaveCount(4);
      return;
    }

    await expect(page.locator('[data-products-3d]')).toHaveAttribute('data-products-mode', '3d', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-products-3d] canvas')).toHaveCount(1);
    const before = await productFrames(page);
    await expect
      .poll(async () => productFrames(page), { timeout: 8_000 })
      .toBeGreaterThan(before);
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/products');
    await settle(page);
    const visual = page.locator('[data-products-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');
    await expect(page.locator('[data-product-item]')).toHaveCount(4);
  });

  test('首页不加载 3D 视觉层（US-010k TBT 红线）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-products-3d]')).toHaveCount(0);
    await expect(page.locator('#products [data-product-item]')).toHaveCount(2);
  });

  test('无 WebGL 时不挂载 3D，产品文字与展开交互完整', async ({ page }) => {
    await page.goto('/products');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await expect(page.locator('[data-products-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('[data-product-expand]').first()).toBeVisible();
  });

  test('reduced-motion 下不挂载 3D，内容完整可读', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: /prefers-reduced-motion/.test(query),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          onchange: null,
          dispatchEvent: () => false,
        }),
      });
    });
    await page.goto('/products');
    await settle(page);

    await expect(page.locator('[data-products-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('[data-product-expand]').first()).toBeVisible();
  });

  test('3D chunk 加载失败时 DOM 信息完整、无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => {
      const url = route.request().url();
      if (/products|showcase/i.test(url)) return route.abort();
      return route.continue();
    });
    await page.goto('/products');
    await settle(page);

    await expect(page.locator('[data-product-item]')).toHaveCount(4);
    await expect(page.locator('[data-product-description]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// ---------- US-013g：hover 联动与动画冲突 ----------

test.describe('US-013g 交互专项', () => {
  test('悬停 DOM 卡片驱动 3D 激活索引，移出后复位', async ({ page }) => {
    await page.goto('/products');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '悬停联动只在桌面 WebGL 环境验证');

    await expect(page.locator('[data-products-3d]')).toHaveAttribute('data-products-mode', '3d', {
      timeout: 15_000,
    });
    const card = page.locator('[data-product-item]').first();
    await card.hover();
    await expect.poll(async () => hoverIndex(page), { timeout: 5_000 }).toBe(0);
    await page.mouse.move(5, 5);
    await expect.poll(async () => hoverIndex(page), { timeout: 5_000 }).toBe(-1);
  });

  test('鼠标快速经过多个卡片后状态唯一收敛，无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/products');
    await settle(page);

    const cards = page.locator('[data-product-item]');
    for (const index of [0, 2, 1, 3, 0, 2]) {
      const box = await cards.nth(index).boundingBox();
      if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(400);

    const activeCount = await page.locator('[data-product-item][data-active="true"]').count();
    expect(activeCount).toBeLessThanOrEqual(1);
    const openCount = await page.locator('[data-product-item][data-open="true"]').count();
    expect(openCount).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('快速划过后立即点击仍命中正确卡片且外链正确', async ({ page }) => {
    await page.goto('/products');
    await settle(page);

    const cards = page.locator('[data-product-item]');
    for (const index of [0, 2, 1]) {
      await cards.nth(index).hover();
    }
    const target = cards.nth(1);
    await target.locator('summary').click();
    await expect(target.locator('details')).toHaveAttribute('open', '');
    const href = await target.locator('[data-product-visit]').getAttribute('href');
    expect(href).toBe('https://example.com/focus-flow');
  });

  test('离屏后 3D 暂停渲染', async ({ page }) => {
    await page.goto('/products');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '暂停行为只在桌面 WebGL 环境验证');

    await expect(page.locator('[data-products-3d]')).toHaveAttribute('data-products-mode', '3d', {
      timeout: 15_000,
    });
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    await page.waitForTimeout(500);
    const pausedStart = await productFrames(page);
    await page.waitForTimeout(800);
    expect((await productFrames(page)) - pausedStart).toBeLessThanOrEqual(2);
  });
});
