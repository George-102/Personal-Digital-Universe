import { test, expect, type Page } from '@playwright/test';
import { settle } from './helpers';

async function webglAvailable(page: Page) {
  return page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  });
}

async function isDesktop(page: Page) {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

const writingFrames = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __writingFrames?: number }).__writingFrames ?? 0,
    ),
  );

/**
 * US-014 文学作品：首页精选、/writing 列表与详情路由验收。
 * 3D 书架与交互联动用例在 US-014f/g 追加。
 */
test.describe('US-014 文学作品', () => {
  test('首页 #writing 有精选卡，名称与状态静态可读', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#writing h2')).toHaveCount(1);
    await expect(page.locator('#writing [data-writing-item]')).toHaveCount(2);
    await expect(page.locator('#writing [data-writing-name]').first()).toContainText('法渊');
    await expect(page.locator('#writing [data-writing-status="in-progress"]').first()).toBeVisible();
    await expect(page.locator('[data-writing-all]')).toHaveAttribute('href', '/writing/');
  });

  test('列表页 h1、作品卡、状态三态与独立 SEO 元数据', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);

    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/writing\/$/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('文学创作');
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-status="writing"]').first()).toBeVisible();
    await expect(page.locator('[data-writing-status="in-progress"]').first()).toBeVisible();
    await expect(page.locator('[data-writing-status="completed"]').first()).toBeVisible();
  });

  test('en 列表页英文文案与 canonical', async ({ page }) => {
    await page.goto('/en/writing');
    await settle(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Writing');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/writing\/$/,
    );
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-item]').first()).toContainText('Fayuan');
  });

  test('列表与详情在无 JS 时完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());

    await page.goto('/writing');
    await settle(page);
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-name]').first()).toContainText('法渊');

    await page.goto('/writing/fayuan');
    await settle(page);
    await expect(page.locator('[data-writing-detail]')).toHaveCount(1);
    await expect(page.locator('[data-writing-worldview]')).toContainText('成文法典');
    await expect(page.locator('[data-writing-background] li').first()).toBeVisible();
    await expect(page.locator('[data-writing-characters] li').first()).toBeVisible();
    await expect(page.locator('[data-writing-concept]')).toContainText('规则与自由');
    expect(errors).toEqual([]);
  });

  test('列表→详情→返回链路与双语详情 URL', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);
    await page.locator('[data-writing-detail]').first().click();
    await expect(page).toHaveURL(/\/writing\/fayuan\/?$/);
    await expect(page.locator('h1')).toHaveText('法渊');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/writing\/fayuan\/$/,
    );
    await page.locator('[data-writing-back]').click();
    await expect(page).toHaveURL(/\/writing\/?$/);

    await page.goto('/en/writing/fayuan');
    await settle(page);
    await expect(page.locator('h1')).toHaveText('Fayuan');
    await expect(page.locator('[data-writing-worldview]')).toContainText('written law');
  });

  test('未知 slug 返回 404', async ({ page }) => {
    const response = await page.goto('/writing/does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('缺封面作品用统一占位，不渲染空阅读入口', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);

    const cards = page.locator('[data-writing-item]');
    await expect(cards.first()).toHaveAttribute('data-writing-has-cover', 'false');
    await expect(cards.first().locator('[data-writing-image]')).toHaveClass(
      /writing-cover--placeholder/,
    );
    await expect(page.locator('[data-writing-reading]')).toHaveCount(0);
  });
});

// ---------- US-014f：3D 悬浮书架概念视觉层 ----------

test.describe('US-014f 3D 悬浮书架', () => {
  test('列表页 3D 进入视口后挂载并渲染，概念标注在 DOM', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);

    await expect(page.locator('[data-writing-concept-note]')).toHaveText(
      '悬浮书架 3D 效果为概念性视觉呈现，不代表真实书籍模型',
    );
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await expect(page.locator('[data-writing-3d] canvas')).toHaveCount(0);
      await expect(page.locator('[data-writing-item]')).toHaveCount(3);
      return;
    }

    // 本书架位于列表页顶部附近；轻微下滚满足「已离开首屏」门槛且视觉仍在视口内
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    await expect(page.locator('[data-writing-3d]')).toHaveAttribute('data-writing-mode', '3d', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-writing-3d] canvas')).toHaveCount(1);
    const before = await writingFrames(page);
    await expect
      .poll(async () => writingFrames(page), { timeout: 8_000 })
      .toBeGreaterThan(before);
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);
    const visual = page.locator('[data-writing-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
  });

  test('首页不加载 3D 视觉层（TBT 红线）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-writing-3d]')).toHaveCount(0);
    await expect(page.locator('#writing [data-writing-item]')).toHaveCount(2);
  });
});

// ---------- US-014g：交互联动与降级 ----------

const writingHover = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __writingHover?: number }).__writingHover ?? -1,
    ),
  );

test.describe('US-014g 交互与降级', () => {
  test('悬停/聚焦作品卡驱动 3D 激活索引，移出后复位', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      // 无 3D 时 DOM 交互层仍写探针
      await page.locator('[data-writing-item]').first().hover();
      await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(0);
      return;
    }
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    await expect(page.locator('[data-writing-3d]')).toHaveAttribute('data-writing-mode', '3d', {
      timeout: 15_000,
    });

    const card = page.locator('[data-writing-item]').first();
    await card.hover();
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(0);
    await page.mouse.move(5, 5);
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(-1);

    // 键盘可访问：focus 同样触发探针
    await card.locator('a[data-writing-detail]').focus();
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(0);
  });

  test('鼠标快速经过多张卡片后状态唯一收敛，无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/writing');
    await settle(page);
    const cards = page.locator('[data-writing-item]');
    for (const index of [0, 1, 2, 1, 0, 2]) {
      await cards.nth(index).hover();
    }
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(2);
    expect(errors).toEqual([]);
  });

  test('无 WebGL 时不挂载 3D，作品封面与文字完整', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await expect(page.locator('[data-writing-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-image]').first()).toBeVisible();
    await expect(page.locator('[data-writing-detail]').first()).toBeVisible();
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
    await page.goto('/writing');
    await settle(page);

    await expect(page.locator('[data-writing-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-description]').first()).toBeVisible();
  });

  test('3D chunk 加载失败时 DOM 信息完整、无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => {
      const url = route.request().url();
      if (/writing|shelf/i.test(url)) return route.abort();
      return route.continue();
    });
    await page.goto('/writing');
    await settle(page);

    await expect(page.locator('[data-writing-item]')).toHaveCount(3);
    await expect(page.locator('[data-writing-description]').first()).toBeVisible();
    await expect(page.locator('[data-writing-image]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('3D 离屏暂停后 hover 探针复位（事件驱动写入）', async ({ page }) => {
    await page.goto('/writing');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) return;
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    await expect(page.locator('[data-writing-3d]')).toHaveAttribute('data-writing-mode', '3d', {
      timeout: 15_000,
    });
    await page.locator('[data-writing-item]').first().hover();
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(5, 5);
    await expect.poll(async () => writingHover(page), { timeout: 5_000 }).toBe(-1);
  });
});
