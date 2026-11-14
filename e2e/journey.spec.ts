import { test, expect, type Page } from '@playwright/test';

const items = (page: Page) => page.locator('[data-journey-item]');
const withDetail = (page: Page) => page.locator('[data-journey-item][data-has-detail="true"]');
const withoutDetail = (page: Page) => page.locator('[data-journey-item][data-has-detail="false"]');

async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(120);
}

async function scrollToJourney(page: Page) {
  await page.evaluate(() => {
    const section = document.getElementById('journey');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - 80, behavior: 'instant' });
  });
  await page.waitForTimeout(300);
}

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

const journeyFrames = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __journeyFrames?: number }).__journeyFrames ?? 0,
    ),
  );

test.describe('US-008 成长时间线', () => {
  test('正文、时间与分类在无 JS 的静态 HTML 中完整可读', async ({ page }) => {
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#journey')).toBeVisible();
    await expect(page.locator('#journey h2')).toBeVisible();
    await expect(items(page)).toHaveCount(7);
    await expect(page.locator('[data-journey-summary]').first()).toBeVisible();
    await expect(page.locator('[data-journey-period]').first()).toBeVisible();
    await expect(page.locator('[data-journey-category]').first()).toBeVisible();
    // 无 JS 时原生 details 仍可展开，详情文本已在 HTML 内
    await expect(withDetail(page).first().locator('summary')).toBeVisible();
    await expect(withDetail(page).first().locator('[data-journey-panel]')).toHaveCount(1);
  });

  test('中英页面分别显示对应文案，标题层级不跳级', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('#journey h2')).toHaveText('成长时间线');
    // 时间线按时间倒序：最新（2026-06 实习）在最前，入学在最后
    await expect(items(page).first().locator('[data-journey-title]')).toHaveText(
      '示例 · 实习经历（进行中）',
    );
    await expect(page.locator('[data-journey-category]').first()).toHaveText('实习与工作');
    await expect(items(page).last().locator('[data-journey-title]')).toHaveText('示例 · 本科入学');

    await page.goto('/en/');
    await settle(page);
    await expect(page.locator('#journey h2')).toHaveText('Journey');
    await expect(items(page).first().locator('[data-journey-title]')).toHaveText(
      'Template · Internship (ongoing)',
    );
    await expect(page.locator('[data-journey-category]').first()).toHaveText('Work');
    await expect(items(page).last().locator('[data-journey-title]')).toHaveText(
      'Template · Undergraduate enrollment',
    );

    // h1 → h2 → h3，不出现跳级
    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#journey h2, #journey h3')).map((el) =>
        Number(el.tagName.slice(1)),
      ),
    );
    expect(levels.length).toBeGreaterThan(1);
    expect(levels[0]).toBe(2);
    expect(levels.slice(1).every((level) => level === 3)).toBe(true);
  });

  test('点击展开详情、再次点击收起，焦点留在触发项上', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const first = withDetail(page).first();
    const summary = first.locator('summary');
    const details = first.locator('details');
    const panel = first.locator('[data-journey-panel]');

    await expect(first).toHaveAttribute('data-open', 'false');
    await summary.click();
    await expect(first).toHaveAttribute('data-open', 'true');
    await expect(details).toHaveAttribute('open', '');
    await expect(panel).toBeVisible();
    await expect(panel.locator('p').first()).toBeVisible();
    await expect(summary).toBeFocused();

    await summary.click();
    await expect(first).toHaveAttribute('data-open', 'false');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(panel).toBeHidden();
    await expect(summary).toBeFocused();
  });

  test('Esc 收起已展开的条目', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const first = withDetail(page).first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('data-open', 'true');

    await page.keyboard.press('Escape');
    await expect(first).toHaveAttribute('data-open', 'false');
    await expect(first.locator('[data-journey-panel]')).toBeHidden();
  });

  test('多个条目互斥展开：打开后一条时前一条自动收起', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    expect(await withDetail(page).count()).toBeGreaterThan(1);
    const first = withDetail(page).nth(0);
    const second = withDetail(page).nth(1);

    await first.locator('summary').click();
    await expect(first).toHaveAttribute('data-open', 'true');

    await second.locator('summary').click();
    await expect(second).toHaveAttribute('data-open', 'true');
    await expect(first).toHaveAttribute('data-open', 'false');
    await expect(first.locator('[data-journey-panel]')).toBeHidden();
  });

  test('没有详细信息的节点仍展示时间、标题与摘要', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const count = await withoutDetail(page).count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const item = withoutDetail(page).nth(index);
      await expect(item.locator('[data-journey-period]')).not.toBeEmpty();
      await expect(item.locator('[data-journey-title]')).not.toBeEmpty();
      await expect(item.locator('[data-journey-summary]')).not.toBeEmpty();
      await expect(item.locator('[data-journey-nodetail]')).toBeVisible();
      // 不渲染空的折叠控件
      await expect(item.locator('details')).toHaveCount(0);
      await expect(item.locator('[data-journey-panel]')).toHaveCount(0);
    }
  });

  test('时间线列表有可访问名称，展开控件是可聚焦的原生控件', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const list = page.locator('ol.journey-list');
    await expect(list).toHaveAttribute('aria-label', '个人经历时间线');

    const summary = withDetail(page).first().locator('summary');
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(withDetail(page).first()).toHaveAttribute('data-open', 'true');
  });

  test('3D 轨道进入视口后挂载，离屏暂停渲染', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 0;
    test.skip(viewportWidth < 1024, '3D 轨道只在桌面挂载（窄屏行为另有单列用例）');
    await page.goto('/');
    await settle(page);
    test.skip(!(await webglAvailable(page)), '当前环境无法创建 WebGL 上下文（降级路径另有覆盖）');

    const canvasLayer = page.locator('[data-journey-canvas]');
    await scrollToJourney(page);
    await expect
      .poll(async () => canvasLayer.getAttribute('data-journey-mode'), { timeout: 15_000 })
      .toBe('3d');
    await expect(page.locator('[data-journey-canvas] canvas')).toHaveCount(1);

    const before = await journeyFrames(page);
    await expect
      .poll(async () => journeyFrames(page), { timeout: 8_000, message: '视口内应持续渲染' })
      .toBeGreaterThan(before);

    // 滚回顶部：轨道离屏后应停止渲染
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const pausedStart = await journeyFrames(page);
    await page.waitForTimeout(800);
    const pausedEnd = await journeyFrames(page);
    expect(pausedEnd - pausedStart, '离屏后应暂停渲染').toBeLessThanOrEqual(2);
  });

  test('无 WebGL 时不挂载 3D，时间线内容与展开仍完整', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await scrollToJourney(page);
    await expect(page.locator('[data-journey-canvas]')).toHaveAttribute(
      'data-journey-mode',
      'no-webgl',
    );
    await expect(page.locator('[data-journey-canvas] canvas')).toHaveCount(0);
    await expect(items(page)).toHaveCount(7);

    const first = withDetail(page).first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('data-open', 'true');
  });

  test('移动端不挂载 3D 轨道，单列时间线可触摸展开', async ({ page }, testInfo) => {
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width >= 1024, '该用例只在窄视口执行');

    await page.goto('/');
    await settle(page);
    await scrollToJourney(page);
    await expect(page.locator('[data-journey-canvas]')).toHaveAttribute('data-journey-mode', 'off');
    await expect(page.locator('[data-journey-canvas] canvas')).toHaveCount(0);

    const first = withDetail(page).first();
    await first.locator('summary').tap();
    await expect(first).toHaveAttribute('data-open', 'true');
    await expect(first.locator('[data-journey-panel]')).toBeVisible();
    void testInfo;
  });

  test('hover 或聚焦条目时 3D 层记录对应的激活索引', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    test.skip(!(await webglAvailable(page)), '无 WebGL 时该联动不适用');

    const width = page.viewportSize()?.width ?? 0;
    test.skip(width < 1024, '3D 轨道只在桌面挂载');

    await scrollToJourney(page);
    const canvasLayer = page.locator('[data-journey-canvas]');
    await expect
      .poll(async () => canvasLayer.getAttribute('data-journey-mode'), { timeout: 15_000 })
      .toBe('3d');

    const first = items(page).first();
    await first.hover();
    await expect(first).toHaveAttribute('data-active', 'true');
    await expect(canvasLayer).toHaveAttribute('data-journey-active', '0');

    await page.mouse.move(5, 5);
    await expect(canvasLayer).toHaveAttribute('data-journey-active', '');

    // 键盘聚焦同样驱动联动（第一个带详情的条目就是列表首条）
    await withDetail(page).first().locator('summary').focus();
    await expect(canvasLayer).toHaveAttribute('data-journey-active', '0');
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await scrollToJourney(page);

    const canvasLayer = page.locator('[data-journey-canvas]');
    await expect(canvasLayer).toHaveAttribute('aria-hidden', 'true');
    expect((await canvasLayer.innerText()).trim()).toBe('');
  });

  test('五档视口无横向溢出，正文对比度 ≥4.5', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    for (const width of [1440, 1024, 768, 390, 375]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow, `${width}px 出现横向溢出：${overflow}px`).toBeLessThanOrEqual(1);

      const ratio = await page.evaluate(() => {
        const parse = (value: string) => {
          const nums = value.match(/[\d.]+/g)?.map(Number) ?? [];
          return nums.length >= 3 ? nums : null;
        };
        const luminance = ([r, g, b]: number[]) => {
          const channel = (c: number) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const summary = document.querySelector('[data-journey-summary]') as HTMLElement | null;
        const card = summary?.closest('.journey-card') as HTMLElement | null;
        if (!summary || !card) return null;
        const fg = parse(getComputedStyle(summary).color);
        const cardBg = parse(getComputedStyle(card).backgroundColor);
        const pageBg = parse(getComputedStyle(document.body).backgroundColor);
        if (!fg || !cardBg || !pageBg) return null;
        const alpha = cardBg.length === 4 ? cardBg[3] : 1;
        const bg = [0, 1, 2].map((i) => cardBg[i] * alpha + pageBg[i] * (1 - alpha));
        const l1 = luminance(fg.slice(0, 3));
        const l2 = luminance(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      });
      expect(ratio, `${width}px 正文对比度不足`).not.toBeNull();
      expect(ratio as number).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('移动端展开控件的触摸目标不小于 44px', async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width >= 1024, '该用例只在窄视口执行');

    await page.goto('/');
    await settle(page);
    await scrollToJourney(page);

    const summary = withDetail(page).first().locator('summary');
    const box = await summary.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height, '展开控件高度应 ≥44px').toBeGreaterThanOrEqual(44);
    expect(box!.width, '展开控件宽度应 ≥44px').toBeGreaterThanOrEqual(44);
  });

  test('reduced-motion 下不挂载 3D，内容完整且可展开', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await scrollToJourney(page);

    await expect(page.locator('[data-journey-canvas] canvas')).toHaveCount(0);
    await expect(items(page)).toHaveCount(7);
    // 动画被关闭：条目保持完全不透明
    const opacity = await items(page).first().evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);

    const first = withDetail(page).first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('data-open', 'true');
    await expect(first.locator('[data-journey-panel]')).toBeVisible();
  });
});
