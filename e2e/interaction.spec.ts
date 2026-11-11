import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { settle, waitForSceneReady } from './helpers';

const wrapper = (page: Page) => page.locator('[data-interaction-canvas]');
const tooltip = (page: Page) => page.locator('[data-interaction-tooltip]');

/** 重交互断言集中在桌面 Chromium；触摸/降级由对应项目覆盖，避免四项目同时争抢 WebGL */
function onlyOn(testInfo: TestInfo, projects: string[]) {
  test.skip(
    !projects.includes(testInfo.project.name),
    `仅 ${projects.join(' / ')} 项目执行该交互断言`,
  );
}

async function waitForFrameData(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-interaction-canvas]');
      return (
        el instanceof HTMLElement &&
        el.dataset.parallaxX !== undefined &&
        el.dataset.hitCore !== undefined
      );
    },
    null,
    { timeout: 20_000 },
  );
}

async function hitPoint(page: Page, key: 'data-hit-core' | 'data-hit-orbit-node') {
  const raw = await wrapper(page).getAttribute(key);
  expect(raw, `${key} 应有坐标`).toBeTruthy();
  const [x, y] = (raw as string).split(',').map(Number);
  expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
  return { x, y };
}

async function openWithScene(page: Page, path = '/') {
  await page.goto(path);
  await settle(page);
  const canvas = page.locator('canvas');
  await canvas.first().waitFor({ state: 'attached', timeout: 12_000 }).catch(() => {});
  // WebKit 软件渲染偶发拿不到 WebGL 上下文：此时交互本就不应存在，降级路径由 US-002p 覆盖
  test.skip(
    (await canvas.count()) === 0,
    '当前环境未创建 WebGL 上下文，3D 交互不适用（降级路径由 US-002p 用例覆盖）',
  );
  await waitForSceneReady(page);
  await waitForFrameData(page);
}

test.describe('US-002 3D 场景交互', () => {
  // 每个用例都会创建 WebGL 上下文，串行避免并行 worker 争抢 GPU 导致场景初始化超时
  test.describe.configure({ mode: 'serial' });
  // WebKit 软件渲染下场景初始化较慢，给足上限（不影响断言与阈值）
  test.beforeEach(() => test.setTimeout(60_000));

  test('US-002a/c 移动鼠标产生平滑视差，幅度受 clamp 限制', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const box = await wrapper(page).boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box!.x + box!.width * 0.08, box!.y + box!.height * 0.5);
    await page.waitForTimeout(500);
    const left = Number(await wrapper(page).getAttribute('data-parallax-x'));
    await page.mouse.move(box!.x + box!.width * 0.92, box!.y + box!.height * 0.5);
    await page.waitForTimeout(500);
    const right = Number(await wrapper(page).getAttribute('data-parallax-x'));

    expect(right).toBeGreaterThan(left);
    expect(Math.abs(left)).toBeLessThanOrEqual(0.22);
    expect(Math.abs(right)).toBeLessThanOrEqual(0.22);
    await expect.poll(async () => Number(await wrapper(page).getAttribute('data-ndc-x'))).toBeGreaterThan(0.5);
  });

  test('US-002d 快速来回移动不出现突跳或 NaN', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const box = await wrapper(page).boundingBox();
    const samples: number[] = [];
    for (let i = 0; i < 6; i++) {
      const ratio = i % 2 === 0 ? 0.05 : 0.95;
      await page.mouse.move(box!.x + box!.width * ratio, box!.y + box!.height * 0.35);
      await page.waitForTimeout(25);
      samples.push(Number(await wrapper(page).getAttribute('data-parallax-x')));
    }
    expect(samples.every(Number.isFinite)).toBe(true);
    for (let i = 1; i < samples.length; i++) {
      expect(Math.abs(samples[i] - samples[i - 1]), `帧 ${i} 抖动过大`).toBeLessThanOrEqual(0.2);
    }
    expect(samples.every((v) => Math.abs(v) <= 0.22)).toBe(true);
  });

  test('US-002e 指针驱动粒子产生排斥响应', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const box = await wrapper(page).boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.85, box!.y + box!.height * 0.5);
    await expect.poll(async () => Math.abs(Number(await wrapper(page).getAttribute('data-particle-x')))).toBeGreaterThan(0);
  });

  test('US-002f~j 悬停核心物体触发四种反馈与中文辅助文字', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const { x, y } = await hitPoint(page, 'data-hit-core');
    await page.mouse.move(x, y);

    await expect(wrapper(page)).toHaveAttribute('data-hover', 'core', { timeout: 8_000 });
    await expect(tooltip(page)).toHaveAttribute('data-visible', 'true');
    await expect(tooltip(page)).toContainText('核心星体');
    await expect.poll(async () => Number(await wrapper(page).getAttribute('data-hover-glow'))).toBeGreaterThan(0.3);
    await expect.poll(async () => Number(await wrapper(page).getAttribute('data-hover-scale'))).toBeGreaterThan(1.02);
    await expect.poll(async () => Number(await wrapper(page).getAttribute('data-spin-speed'))).toBeGreaterThan(1.2);

    await page.mouse.move(10, 10);
    await expect(wrapper(page)).toHaveAttribute('data-hover', '', { timeout: 8_000 });
    await expect(tooltip(page)).toHaveAttribute('data-visible', 'false');
  });

  test('US-002f/j 悬停轨道节点显示对应文字', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const { x, y } = await hitPoint(page, 'data-hit-orbit-node');
    await page.mouse.move(x, y);
    await expect(wrapper(page)).toHaveAttribute('data-hover', 'orbit-node', { timeout: 8_000 });
    await expect(tooltip(page)).toContainText('轨道节点');
  });

  test('US-002j 英文页面悬停显示英文辅助文字', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page, '/en/');
    const { x, y } = await hitPoint(page, 'data-hit-core');
    await page.mouse.move(x, y);
    await expect(tooltip(page)).toHaveAttribute('data-visible', 'true', { timeout: 8_000 });
    await expect(tooltip(page)).toContainText('Core');
  });

  test('US-002k/l 拖拽旋转物体且不误触发跳转', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const { x, y } = await hitPoint(page, 'data-hit-core');
    await page.mouse.move(x, y);
    await expect(wrapper(page)).toHaveAttribute('data-hover', 'core', { timeout: 8_000 });

    await page.mouse.down();
    await page.mouse.move(x + 90, y + 20, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => Math.abs(Number(await wrapper(page).getAttribute('data-drag-x')))).toBeGreaterThan(0.01);
    await expect(wrapper(page)).toHaveAttribute('data-click-count', '0');
    expect(page.url()).not.toContain('#about');
  });

  test('US-002m 点击核心物体平滑进入 #about', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await openWithScene(page);
    const { x, y } = await hitPoint(page, 'data-hit-core');
    await page.mouse.move(x, y);
    await expect(wrapper(page)).toHaveAttribute('data-hover', 'core', { timeout: 8_000 });
    await page.mouse.down();
    await page.mouse.up();

    await expect(wrapper(page)).toHaveAttribute('data-click-count', '1', { timeout: 8_000 });
    await expect(page.locator('#about')).toBeInViewport({ timeout: 8_000 });
    expect(page.url()).toContain('#about');
  });

  test('US-002n 键盘可通过 DOM 等价入口访问内容', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const fallback = page.locator('[data-interaction-fallback]');
    await expect(fallback).toBeVisible();
    await fallback.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#about')).toBeInViewport({ timeout: 8_000 });
  });

  test('US-002o 触摸设备无 hover 也能点击完成对应操作', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['mobile-chrome', 'mobile-safari']);
    await openWithScene(page);
    await expect(wrapper(page)).toHaveAttribute('data-hover-capable', 'false');
    const { x, y } = await hitPoint(page, 'data-hit-core');
    await page.touchscreen.tap(x, y);
    await expect(wrapper(page)).toHaveAttribute('data-click-count', '1', { timeout: 8_000 });
  });

  test('US-002p reduced-motion 关闭视差与惯性，等价入口仍可用', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openWithScene(page);
    await expect(wrapper(page)).toHaveAttribute('data-interaction', 'reduced');
    const box = await wrapper(page).boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.9, box!.y + box!.height * 0.5);
    await page.waitForTimeout(400);
    await expect(wrapper(page)).toHaveAttribute('data-parallax-x', '0.000');
    await expect(page.locator('[data-interaction-fallback]')).toBeVisible();
  });

  test('US-002p 无 WebGL 时不挂载指针交互且不产生未捕获异常', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium-no-webgl']);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await settle(page);
    await expect(wrapper(page)).toHaveAttribute('data-interaction', 'disabled');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('[data-interaction-fallback]')).toBeVisible();
    await page.mouse.move(200, 200);
    expect(errors).toEqual([]);
  });

  test('US-002q 交互全过程无未捕获异常', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openWithScene(page);
    const box = await wrapper(page).boundingBox();
    await page.mouse.move(box!.x + 100, box!.y + 100);
    await page.mouse.move(box!.x + box!.width - 100, box!.y + box!.height - 100, { steps: 12 });
    await page.mouse.down();
    await page.mouse.move(box!.x + 200, box!.y + 200, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('US-002q LCP 元素仍为文字而非 Canvas', async ({ page }, testInfo) => {
    onlyOn(testInfo, ['chromium']);
    await page.addInitScript(() => {
      const w = window as unknown as { __lcpTag: string | null };
      w.__lcpTag = null;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { element?: Element | null };
        w.__lcpTag = last?.element?.tagName ?? 'unknown';
      });
      observer.observe({
        type: 'largest-contentful-paint',
        buffered: true,
      } as unknown as PerformanceObserverInit);
    });
    await page.goto('/');
    await settle(page);
    await page.waitForTimeout(1500);
    const tag = await page.evaluate(
      () => (window as unknown as { __lcpTag: string | null }).__lcpTag,
    );
    expect(tag, 'LCP 元素应被观测到').toBeTruthy();
    expect(tag).not.toBe('CANVAS');
  });
});
