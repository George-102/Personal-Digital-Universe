import { test, expect, type Page } from '@playwright/test';
import { settle, waitForSceneReady } from './helpers';

async function readProgress(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const indicator = document.querySelector<HTMLElement>('[data-scroll-progress-indicator]');
    return {
      root: root.dataset.pageProgress === undefined ? null : Number(root.dataset.pageProgress),
      aria: indicator ? Number(indicator.getAttribute('aria-valuenow')) : null,
      scale: indicator
        ? new DOMMatrixReadOnly(
            getComputedStyle(indicator.querySelector('.scroll-progress-fill')!).transform,
          ).a
        : null,
      active: root.dataset.activeSection ?? null,
      indicatorActive: indicator?.dataset.activeSection ?? null,
    };
  });
}

async function jumpTo(page: Page, ratio: number) {
  await page.evaluate((value) => {
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    window.scrollTo({ top: max * value, behavior: 'auto' });
  }, ratio);
}

async function jumpToSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    const section = document.getElementById(sectionId);
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'auto' });
  }, id);
}

test.describe('US-005 动态滚动反馈', () => {
  test('AC1 整页进度条与原生滚动同步，不劫持滚轮', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readProgress(page)).root !== null, { timeout: 10_000 })
      .toBe(true);

    const initial = await readProgress(page);
    expect(initial.root!).toBeGreaterThanOrEqual(0);
    expect(initial.root!).toBeLessThan(0.05);
    expect(initial.aria).toBe(0);
    await expect(page.getByRole('progressbar', { name: /滚动进度|scroll progress/i })).toHaveCount(1);

    await jumpTo(page, 0.5);
    await expect.poll(async () => (await readProgress(page)).root ?? -1, { timeout: 5_000 })
      .toBeGreaterThan(0.4);
    const middle = await readProgress(page);
    expect(middle.root!).toBeLessThan(0.6);
    expect(Math.abs(middle.aria! - middle.root! * 100)).toBeLessThan(6);
    expect(Math.abs(middle.scale! - middle.root!)).toBeLessThan(0.05);

    await jumpTo(page, 1);
    await expect.poll(async () => (await readProgress(page)).root ?? -1, { timeout: 5_000 })
      .toBeGreaterThan(0.99);
    const end = await readProgress(page);
    expect(end.root!).toBeLessThanOrEqual(1);
    expect(end.aria).toBe(100);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    await expect.poll(async () => (await readProgress(page)).root ?? 1, { timeout: 5_000 })
      .toBeLessThan(0.05);
    expect(errors).toEqual([]);
  });

  test('AC2 进入不同模块时根状态、导航与 section 标识同步切换', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readProgress(page)).root !== null, { timeout: 10_000 })
      .toBe(true);

    for (const id of ['about', 'journey', 'contact']) {
      await jumpToSection(page, id);
      await expect
        .poll(async () => (await readProgress(page)).active, { timeout: 5_000 })
        .toBe(id);
      const snapshot = await readProgress(page);
      expect(snapshot.indicatorActive).toBe(id);
      await expect(page.locator(`section#${id}[data-section-active="true"]`)).toHaveCount(1);
      await expect(page.locator('section[data-section-active="true"]')).toHaveCount(1);
      const navId = await page.locator('[data-site-nav]').getAttribute('data-nav-active');
      expect(navId).toBe(id);
    }

    await jumpTo(page, 0);
    await expect.poll(async () => (await readProgress(page)).active, { timeout: 5_000 })
      .toBe('home');
  });

  test('AC3 快速来回跳变进度即时收敛，无延迟或错位', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readProgress(page)).root !== null, { timeout: 10_000 })
      .toBe(true);

    for (const ratio of [0.95, 0.05, 0.8, 0.2, 1, 0]) {
      await jumpTo(page, ratio);
      // 原生 scroll 事件异步派发；用 poll 等一帧内同步，而不是放宽阈值
      await expect
        .poll(async () => {
          const snapshot = await readProgress(page);
          const actual = await page.evaluate(() => {
            const root = document.documentElement;
            return window.scrollY / Math.max(1, root.scrollHeight - window.innerHeight);
          });
          return Math.max(
            Math.abs(snapshot.root! - actual),
            Math.abs(snapshot.aria! / 100 - actual),
          );
        }, { timeout: 5_000 })
        .toBeLessThan(0.05);
    }
    expect(errors).toEqual([]);
  });

  test('reduced-motion 仍同步进度并切换模块，动画降级不影响信息', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readProgress(page)).root !== null, { timeout: 10_000 })
      .toBe(true);

    await jumpTo(page, 0.7);
    await expect.poll(async () => (await readProgress(page)).root ?? -1, { timeout: 5_000 })
      .toBeGreaterThan(0.6);
    expect(await page.locator('.scroll-progress-fill').evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    await jumpToSection(page, 'about');
    await expect.poll(async () => (await readProgress(page)).active, { timeout: 5_000 })
      .toBe('about');
    await expect(page.locator('#about h2')).toBeVisible();
  });

  test('无 JS 时指示器静态可读，正文与滚动不受影响', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('progressbar', { name: /滚动进度|scroll progress/i })).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#about h2')).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    // mobile WebKit 不支持注入滚轮，改用等价的程序化滚动验证原生行为未被 JS 阻断
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 400, behavior: 'auto' });
    });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
    await context.close();
  });

  test('WebGL 场景复用当前模块色调，不新增 Canvas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);
    const canvas = page.locator('canvas[data-ready="1"]').first();
    await expect(canvas).toHaveAttribute('data-section-tint', '#8f9bff');
    await expect(page.locator('canvas')).toHaveCount(1);
    await jumpToSection(page, 'about');
    await expect(canvas).toHaveAttribute('data-section-tint', '#c4b5fd', { timeout: 5_000 });
    // 进入 #about 后只多出该模块既有的头像 Canvas；US-005 未新增专用 WebGL 层
    await expect(page.locator('canvas')).toHaveCount(2);
  });
});
