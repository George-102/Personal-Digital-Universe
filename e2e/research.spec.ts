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

async function scrollToResearch(page: Page) {
  await page.evaluate(() => {
    const section = document.getElementById('research');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(300);
}

const researchFrames = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __researchFrames?: number }).__researchFrames ?? 0,
    ),
  );

const hoverSector = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __researchHoverSector?: number }).__researchHoverSector ?? -1,
    ),
  );

/**
 * US-010 科研方向：列表/详情路由与 #research section 的验收。
 * 3D 空域示意相关用例在 US-010f/g/h 追加。
 */
test.describe('US-010 科研方向', () => {
  test('列表页 h1、方向卡片、状态徽标与 SEO 元数据独立', async ({ page }) => {
    await page.goto('/research');
    await settle(page);

    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/research\/$/,
    );
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('科研方向');

    await expect(page.locator('[data-research-item]')).toHaveCount(3);
    await expect(page.locator('[data-research-status="in-progress"]').first()).toBeVisible();
    await expect(page.locator('[data-research-problems]').first()).toBeVisible();
    await expect(page.locator('[data-research-methods]').first()).toBeVisible();
    await expect(page.locator('[data-research-keywords]').first()).toBeVisible();
  });

  test('en 列表页显示英文文案与独立 canonical', async ({ page }) => {
    await page.goto('/en/research');
    await settle(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Research');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/research\/$/,
    );
    await expect(page.locator('[data-research-item]')).toHaveCount(3);
    await expect(page.locator('[data-research-item]').first()).toContainText(
      'Dynamic Airspace Configuration',
    );
  });

  test('列表页在无 JS 时完整可读，语言切换指向对应语言页面', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/research');
    await settle(page);

    await expect(page.locator('[data-research-item]')).toHaveCount(3);
    await expect(page.locator('[data-research-detail-link]').first()).toBeVisible();
    await expect(page.locator('a[href="/en/research/"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('首页 #research 的 viewAll 进入列表页，卡片链接指向详情', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#research')).toBeVisible();
    await expect(page.locator('#research [data-research-item]')).toHaveCount(3);
    await expect(page.locator('#research [data-research-all]')).toHaveAttribute(
      'href',
      '/research/',
    );
    await expect(
      page.locator('#research [data-research-detail-link]').first(),
    ).toHaveAttribute('href', '/research/dynamic-airspace-configuration/');
  });

  test('详情页展示概述、核心问题、方法、关键词与状态', async ({ page }) => {
    await page.goto('/research/llm-marl');
    await settle(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('LLM + 多智能体强化学习');
    await expect(page.locator('[data-research-status="in-progress"]')).toBeVisible();
    await expect(page.locator('[data-research-overview]')).toContainText('大语言模型');
    await expect(page.locator('[data-research-problems] li')).not.toHaveCount(0);
    await expect(page.locator('[data-research-methods] li')).not.toHaveCount(0);
    await expect(page.locator('[data-research-keywords] li')).not.toHaveCount(0);
    await expect(page.locator('[data-research-copy] p').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/research\/llm-marl\/$/,
    );
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('en 详情页显示英文文案并可返回列表', async ({ page }) => {
    await page.goto('/en/research/dynamic-airspace-configuration');
    await settle(page);

    await expect(page.locator('h1')).toHaveText(
      'Dynamic Airspace Configuration & Sectorization',
    );
    await expect(page.locator('[data-research-overview]')).toContainText('airspace');
    await expect(page.locator('[data-research-back]')).toHaveAttribute(
      'href',
      '/en/research/',
    );
  });

  test('未知 slug 返回 404', async ({ request }) => {
    const res = await request.get('/research/nonexistent-direction/');
    expect(res.status()).toBe(404);
  });

  test('列表→详情→返回 链路可达（含移动端触摸目标）', async ({ page }) => {
    await page.goto('/research');
    await settle(page);
    await page.locator('[data-research-detail-link]').first().click();
    await settle(page);
    await expect(page.locator('[data-research-detail]')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('动态空域配置与扇区化');

    const back = page.locator('[data-research-back]');
    await expect(back).toHaveAttribute('href', '/research/');
    const box = await back.boundingBox();
    // 触摸目标 ≥44px（US-010h）
    expect(box && box.height >= 44).toBeTruthy();
    await back.click();
    await settle(page);
    await expect(page.locator('h1')).toHaveText('科研方向');
  });

  test('详情页无 JS 时全文可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/research/ai-for-air-traffic-management');
    await settle(page);
    await expect(page.locator('[data-research-overview]')).toBeVisible();
    await expect(page.locator('[data-research-copy]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  // ---------- US-010f：3D 空域概念示意 ----------

  test('3D 空域示意离开首屏进入视口后挂载并渲染，概念标注在 DOM', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    // 首页：未离开首屏时不得挂载（US-008k TBT 门槛）
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', 'off');
    await expect(page.locator('[data-research-concept-note]')).toHaveText(
      '概念性示意图，非真实仿真数据',
    );

    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await scrollToResearch(page);
      await expect(page.locator('#research [data-research-item]')).toHaveCount(3);
      await expect(page.locator('[data-research-3d] canvas')).toHaveCount(0);
      return;
    }

    await scrollToResearch(page);
    const layer = page.locator('[data-research-3d]');
    await expect(layer).toHaveAttribute('data-research-mode', '3d', { timeout: 15_000 });
    await expect(layer.locator('canvas')).toHaveCount(1);
    const before = await researchFrames(page);
    await expect
      .poll(async () => researchFrames(page), { timeout: 8_000, message: '视口内应持续渲染' })
      .toBeGreaterThan(before);
  });

  test('悬停扇区产生交互反馈（探针翻转）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '悬停交互只在桌面 WebGL 环境验证（降级路径另有覆盖）');

    await scrollToResearch(page);
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', '3d', {
      timeout: 15_000,
    });
    const box = await page.locator('[data-research-visual]').boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect
      .poll(async () => hoverSector(page), { timeout: 5_000, message: '悬停应命中扇区' })
      .toBeGreaterThanOrEqual(0);
    // 移出后探针复位
    await page.mouse.move(box.x - 30, box.y - 30);
    await expect.poll(async () => hoverSector(page), { timeout: 5_000 }).toBe(-1);
  });

  test('独立列表页 3D 无 hero 门槛可挂载；3D 层 aria-hidden 纯装饰', async ({ page }) => {
    await page.goto('/research');
    await settle(page);
    const visual = page.locator('[data-research-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');

    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await expect(page.locator('[data-research-3d] canvas')).toHaveCount(0);
      await expect(page.locator('[data-research-item]')).toHaveCount(3);
      return;
    }
    // standalone：无需滚动即挂载
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', '3d', {
      timeout: 15_000,
    });
  });

  test('离屏后暂停渲染', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '暂停行为只在桌面 WebGL 环境验证');

    await scrollToResearch(page);
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', '3d', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const pausedStart = await researchFrames(page);
    await page.waitForTimeout(800);
    expect((await researchFrames(page)) - pausedStart, '离屏后应暂停渲染').toBeLessThanOrEqual(2);
  });

  // ---------- US-010g：降级与容错 ----------

  test('无 WebGL 时不挂载 3D，研究文字与概念标注完整', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await scrollToResearch(page);
    await expect(page.locator('[data-research-3d]')).toHaveAttribute(
      'data-research-mode',
      'no-webgl',
    );
    await expect(page.locator('[data-research-3d] canvas')).toHaveCount(0);
    await expect(page.locator('#research [data-research-item]')).toHaveCount(3);
    await expect(page.locator('[data-research-concept-note]')).toBeVisible();
  });

  test('3D chunk 加载失败时 DOM 信息完整、无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => {
      const url = route.request().url();
      if (/research|airspace/i.test(url)) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await settle(page);
    await scrollToResearch(page);

    await expect(page.locator('#research [data-research-item]')).toHaveCount(3);
    await expect(page.locator('#research [data-research-overview]').first()).toBeVisible();
    await expect(page.locator('[data-research-concept-note]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('reduced-motion 下不挂载 3D，内容完整可读', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          // 同时模拟桌面宽度 + reduced-motion：验证挂载门槛确实尊重系统减弱动效
          matches: /prefers-reduced-motion|min-width: 1024px/.test(query),
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
    await page.goto('/research');
    await settle(page);
    await expect(page.locator('[data-research-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-research-item]')).toHaveCount(3);
    await expect(page.locator('[data-research-detail-link]').first()).toBeVisible();
  });
});
