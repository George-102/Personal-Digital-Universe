import { expect, Page } from '@playwright/test';

/** 等待页面 hydration / 首屏稳定，避免动画未完成时断言 */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(300);
}

/** 断言无横向溢出，允许 1px 亚像素误差 */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, '页面出现横向溢出').toBeLessThanOrEqual(1);
}

/** 断言 3D Canvas 没有遮挡关键文字：用 elementFromPoint 检查 CTA 中心 */
export async function expectCtaNotCovered(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`未找到 CTA: ${selector}`);
  const covered = await page.evaluate(
    ({ x, y, selector }) => {
      const el = document.elementFromPoint(x, y);
      return !el?.closest(selector);
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2, selector }
  );
  expect(covered, `CTA 被其他元素遮挡: ${selector}`).toBe(false);
}

/** 等待 3D 场景初始化完成（应用需在 canvas 上设置 data-ready="1"） */
export async function waitForSceneReady(page: Page) {
  const canvas = page.locator('canvas[data-ready="1"]');
  if (await canvas.count()) {
    await canvas.first().waitFor({ timeout: 15_000 });
  }
}

/**
 * 固定测试环境为完整桌面画质：CI runner 的 hardwareConcurrency 可能 ≤4，
 * 会被 US-021 的低性能降档判为低画质，关闭粒子排斥与壳层计算。
 * 这两类高画质交互断言需明确注入充足信号；低性能分支由 device-adaptation.spec.ts 单独覆盖。
 * 不修改产品阈值，不降低断言。
 */
export async function useFullQuality(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 16 });
  });
}