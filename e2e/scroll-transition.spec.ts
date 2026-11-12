import { test, expect, type Page } from '@playwright/test';
import { settle, waitForSceneReady } from './helpers';

/** 读取 <html> 上的滚动段进度（ScrollDriver 写入，0~1） */
async function readScrollProgress(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const raw = document.documentElement.dataset.scrollProgress;
    return raw === undefined ? null : Number(raw);
  });
}

/** 等待 3D 场景把转场状态写入 wrapper dataset（场景异步挂载，占位 div 无此属性） */
async function waitForTransitionState(page: Page) {
  await page.locator('[data-interaction-canvas][data-transition]').first().waitFor({ timeout: 15_000 });
}

/**
 * 滚到 hero→#about 转场段的中点。
 * US-006 起 #about 变长，scrollHeight*0.5 可能已越过转场终点，
 * 故按段区间（0 ~ #about 顶部）取中点，保证采样的是真正的转场中途。
 */
async function scrollToTransitionMid(page: Page) {
  await page.evaluate(() => {
    const about = document.querySelector('#about');
    if (!about) return;
    const top = about.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top * 0.5, behavior: 'instant' });
  });
}

test.describe('滚动转场', () => {
  test('滚动进度源把 hero→#about 归一化为 0~1', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    // 驱动器异步挂载（GSAP 动态加载），先等进度属性出现
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    const initial = await readScrollProgress(page);
    expect(initial).not.toBeNull();
    expect(initial!).toBeGreaterThanOrEqual(0);
    expect(initial!).toBeLessThan(0.05);

    await page.evaluate(() =>
      document
        .querySelector('#about')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' }),
    );
    await expect
      .poll(async () => (await readScrollProgress(page)) ?? -1, { timeout: 10_000 })
      .toBeGreaterThan(0.95);
  });

  test('快速滚动全程无未捕获异常，进度收敛合法', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);

    for (const ratio of [0.9, 0.1, 1, 0, 0.5]) {
      await page.evaluate((r) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * r, behavior: 'auto' });
      }, ratio);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);

    const progress = await readScrollProgress(page);
    expect(progress).not.toBeNull();
    expect(Number.isFinite(progress!)).toBe(true);
    expect(progress!).toBeGreaterThanOrEqual(0);
    expect(progress!).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('相机推进与核心物体随滚动移动/旋转', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');

    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);
    await waitForTransitionState(page);

    const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
    const readState = async () => ({
      transition: Number(await canvas.getAttribute('data-transition')),
      cameraZ: Number(await canvas.getAttribute('data-camera-z')),
      coreY: Number(await canvas.getAttribute('data-core-offset-y')),
      spin: Number(await canvas.getAttribute('data-core-spin-offset')),
    });

    const initial = await readState();
    await scrollToTransitionMid(page);
    await page.waitForTimeout(500);
    const mid = await readState();
    await page.evaluate(() =>
      document
        .querySelector('#about')
        ?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await page.waitForTimeout(700);
    const end = await readState();

    // 进度随滚动推进
    expect(initial.transition).toBeLessThan(0.05);
    expect(mid.transition).toBeGreaterThan(initial.transition + 0.1);
    expect(end.transition).toBeGreaterThan(0.9);

    // 相机缓慢推进：z 偏移为负且随进度单调减小，幅度不越过注册表上限（zOffset -1.4）
    expect(initial.cameraZ).toBeCloseTo(0, 1);
    expect(mid.cameraZ).toBeLessThan(initial.cameraZ);
    expect(end.cameraZ).toBeLessThan(mid.cameraZ);
    expect(end.cameraZ).toBeGreaterThanOrEqual(-1.41);
    expect(end.cameraZ).toBeLessThan(-0.5);

    // 核心物体下移与附加旋转：方向与配置一致且幅度 clamp（coreYOffset -0.3 / coreSpin π/2）
    expect(end.coreY).toBeLessThan(-0.05);
    expect(end.coreY).toBeGreaterThanOrEqual(-0.31);
    expect(end.spin).toBeGreaterThan(0.3);
    expect(end.spin).toBeLessThanOrEqual(Math.PI / 2 + 0.01);

    // 全程无 NaN
    for (const state of [initial, mid, end]) {
      for (const value of Object.values(state)) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  test('粒子壳层随滚动聚集并回稳（低画质档关闭计算）', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');

    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);
    await waitForTransitionState(page);

    const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
    const shell = async () => Number(await canvas.getAttribute('data-particle-shell'));

    const initial = await shell();
    expect(initial).toBeGreaterThan(0.95);

    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'auto', block: 'start' }),
    );

    // 低画质档（移动端粒子 350 < 700）按设计关闭壳层计算，保持原半径
    const lowQuality = testInfo.project.name.startsWith('mobile-');
    if (lowQuality) {
      await page.waitForTimeout(800);
      expect(await shell()).toBeGreaterThan(0.99);
      return;
    }

    await expect
      .poll(async () => shell(), { timeout: 10_000 })
      .toBeLessThan(0.85);

    // 回稳：停止滚动后壳层系数收敛不再变化，且不越过注册表下限（shellScale 0.75）
    await page.waitForTimeout(600);
    const first = await shell();
    await page.waitForTimeout(400);
    const second = await shell();
    expect(Math.abs(second - first)).toBeLessThan(0.01);
    expect(second).toBeGreaterThanOrEqual(0.74);
  });

  test('背景渐变随滚动推进（无 WebGL 与无 JS 同样完整）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    const tint = page.locator('.hero-bg-tint');
    await expect(tint).toHaveCount(1);
    const opacity = async () => Number(await tint.evaluate((el) => getComputedStyle(el).opacity));

    const initial = await opacity();
    expect(initial).toBeLessThan(0.05);

    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'auto', block: 'start' }),
    );
    await expect
      .poll(async () => opacity(), { timeout: 10_000 })
      .toBeGreaterThan(0.4);

    // 叠加层透明度与根进度联动（opacity = progress × 0.6）；同一次 evaluate 内同步读取，避免时序漂移
    const linked = await page.evaluate(() => ({
      opacity: Number(
        getComputedStyle(document.querySelector('.hero-bg-tint')!).opacity,
      ),
      progress: Number(document.documentElement.dataset.scrollProgress),
    }));
    expect(Math.abs(linked.opacity - linked.progress * 0.6)).toBeLessThan(0.05);

    // 转场后背景与内容完整
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#about')).toBeVisible();

    // 渐变色来自注册表且静态产物即含（无 JS 回退 var 默认 0 → 静态背景）
    const style = await page.locator('.hero-bg').getAttribute('style');
    expect(style).toContain('#151d3a');
  });

  test('内容面板随滚动展开且始终可读', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    const panel = page.locator('.about-panel');
    await expect(panel).toHaveCount(1);
    const readPanel = () =>
      panel.evaluate((el) => {
        const style = getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return { opacity: Number(style.opacity), translateY: matrix.m42 };
      });

    // 起始为折叠态（下移 >10px），且立即可读红线：透明度 ≥0.85
    const initial = await readPanel();
    expect(Math.abs(initial.translateY)).toBeGreaterThan(10);
    expect(initial.opacity).toBeGreaterThanOrEqual(0.85);

    // 中途采样同样不破可读红线（按转场段中点采样，避免长页面越过终点）
    await scrollToTransitionMid(page);
    await page.waitForTimeout(400);
    expect((await readPanel()).opacity).toBeGreaterThanOrEqual(0.85);

    // 展开到位：位移收敛、透明度升满（PRD 验收 2 目标模块清晰呈现）
    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'auto', block: 'start' }),
    );
    await expect
      .poll(async () => (await readPanel()).translateY, { timeout: 10_000 })
      .toBeLessThan(2);
    const end = await readPanel();
    expect(end.opacity).toBeGreaterThan(0.98);
    await expect(page.locator('#about h2')).toBeVisible();
    // US-006c 起 #about 内有多段 <p>（eyebrow / 正文 / 头像替代文本），
    // 用正文标记定位以保持“面板文字可见”的原断言意图（不是放宽）。
    await expect(page.locator('#about [data-about-bio]').first()).toBeVisible();

    // 无 JS 回退：进度变量不存在时 var fallback=1 → 面板默认完整可见；
    // 移除与读取必须同一次 evaluate（进度源每帧可能重写变量）
    const fallback = await page.evaluate(() => {
      document.documentElement.style.removeProperty('--scroll-progress');
      const style = getComputedStyle(document.querySelector('.about-panel')!);
      const matrix = new DOMMatrixReadOnly(style.transform);
      return { opacity: Number(style.opacity), translateY: matrix.m42 };
    });
    expect(Math.abs(fallback.translateY)).toBeLessThan(0.5);
    expect(fallback.opacity).toBeGreaterThan(0.98);
  });

  test('快速上下滚动动画状态唯一收敛，无冲突状态', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    // 高频来回跳（instant 跳变模拟快速滚动，避免平滑动画排队互相干扰）
    for (const ratio of [1, 0, 1, 0, 0.4, 1, 0]) {
      await page.evaluate((r) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * r, behavior: 'instant' });
      }, ratio);
      await page.waitForTimeout(40);
    }

    // 停在终点后状态应收敛到唯一终值（单一进度源，无相互冲突的动画状态）
    await page.evaluate(() =>
      document
        .querySelector('#about')
        ?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await expect
      .poll(
        async () => {
          const a = await readScrollProgress(page);
          await page.waitForTimeout(250);
          const b = await readScrollProgress(page);
          return Math.abs(b! - a!);
        },
        { timeout: 10_000 },
      )
      .toBeLessThan(0.01);
    const final = await readScrollProgress(page);
    expect(final!).toBeGreaterThan(0.9);
    expect(final!).toBeLessThanOrEqual(1);

    // 面板（CSS 变量消费方）同样收敛
    const panel = page.locator('.about-panel');
    const translateY = () =>
      panel.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
    const t1 = await translateY();
    await page.waitForTimeout(300);
    const t2 = await translateY();
    expect(Math.abs(t2 - t1)).toBeLessThan(1);

    expect(errors).toEqual([]);
  });

  test('滚轮与键盘滚动为原生行为，不被劫持', async ({ page }, testInfo) => {
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    // 滚轮：位移与输入同量级（不被吞、不被放大）；
    // 移动 WebKit 不支持注入滚轮，用等价滚动断言（真实触摸滑动超出注入能力，与 WebGL 条件跳过同类）
    const before = await page.evaluate(() => window.scrollY);
    if (testInfo.project.name === 'mobile-safari') {
      await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'instant' }));
    } else {
      await page.mouse.wheel(0, 400);
    }
    await page.waitForTimeout(300);
    const wheelDelta = (await page.evaluate(() => window.scrollY)) - before;
    expect(wheelDelta).toBeGreaterThan(100);
    expect(wheelDelta).toBeLessThan(600);

    // 键盘：PageDown 同样原生滚动
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('转场驱动异常时回退静态，内容仍可读可滚动', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);

    // 模拟转场驱动失效：移除进度变量，CSS var 回退默认值
    await page.evaluate(() => document.documentElement.style.removeProperty('--scroll-progress'));

    // 回退静态：内容完整可读
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#about h2')).toBeVisible();
    await expect(page.locator('.about-panel')).toBeVisible();

    // 原生滚动不受影响
    const before = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'instant' }));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before);

    // 转场静默停用，无未捕获异常（PRD 验收 4）
    expect(errors).toEqual([]);
  });

  test('reduced-motion 自动使用简化转场', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await expect
      .poll(async () => (await readScrollProgress(page)) !== null, { timeout: 10_000 })
      .toBe(true);

    // 简化形式 1：进度瞬时跟随滚动（不做 damp 平滑，200ms 内即到位）
    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await page.waitForTimeout(200);
    expect((await readScrollProgress(page))!).toBeGreaterThan(0.9);

    // 简化形式 2：无相机运动与 3D 转场（WebGL 项目）
    if (testInfo.project.name !== 'chromium-no-webgl') {
      await waitForTransitionState(page);
      const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
      await expect(canvas).toHaveAttribute('data-transition', '0.000');
      await expect(canvas).toHaveAttribute('data-camera-z', '0.000');
    }

    // 简化形式 3：面板不做展开动画，直接完整呈现（CSS 媒体查询）
    const panel = page.locator('.about-panel');
    const computed = await panel.evaluate((el) => {
      const style = getComputedStyle(el);
      return { transform: style.transform, opacity: Number(style.opacity) };
    });
    expect(computed.transform).toBe('none');
    expect(computed.opacity).toBe(1);

    // 内容完整（PRD 验收 5）
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#about h2')).toBeVisible();
  });

  test('US-006h hero 真正滚出视口、转场收敛后暂停渲染', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);
    await waitForTransitionState(page);

    // 页面变长后 hero 应能完全滚出视口（此前受短页限制无法验证）
    const heroOut = await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      const hero = document.getElementById('home');
      return hero ? hero.getBoundingClientRect().bottom <= 0 : false;
    });
    expect(heroOut, 'hero 应能完全滚出视口').toBe(true);

    // 等待 damp 收敛（滚动驱动仍在跑），收敛后 frameloop 应停下
    await page.waitForTimeout(2000);
    const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
    const heroFrames = async () => Number(await canvas.getAttribute('data-hero-frames'));
    const start = await heroFrames();
    await page.waitForTimeout(800);
    const end = await heroFrames();
    expect(end - start, '离屏且收敛后 hero 渲染循环应暂停').toBeLessThanOrEqual(10);

    // 暂停前转场必须已收敛到终点，而不是冻结在中途
    expect(Number(await canvas.getAttribute('data-transition'))).toBeGreaterThan(0.9);
    expect(Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(-0.5);
  });
});
