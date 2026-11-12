import { test, expect, type Page } from '@playwright/test';
import { settle, expectNoHorizontalOverflow } from './helpers';

const scrollToAbout = (page: Page) =>
  page.evaluate(() =>
    document.querySelector('#about')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
  );

/** 运行时是否真的能创建 WebGL 上下文（与既有 3D 用例同一条件跳过口径） */
const webglAvailable = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement('canvas');
    try {
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  });

/** 正文与页面背景的有效对比度（半透明文字先与背景合成） */
const aboutContrast = (page: Page) =>
  page.evaluate(() => {
    type Rgba = [number, number, number, number];
    const parse = (value: string): Rgba => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      const parts = (match?.[1] ?? '0,0,0,1').split(',').map((p) => Number(p.trim()));
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
    };
    const composite = (fg: Rgba, bg: number[]) => [
      fg[0] * fg[3] + bg[0] * (1 - fg[3]),
      fg[1] * fg[3] + bg[1] * (1 - fg[3]),
      fg[2] * fg[3] + bg[2] * (1 - fg[3]),
    ];
    const luminance = (rgb: number[]) => {
      const channel = (value: number) => {
        const s = value / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    };
    const bg = parse(getComputedStyle(document.body).backgroundColor);
    const text = parse(getComputedStyle(document.querySelector('[data-about-bio]')!).color);
    const effective = composite(text, [bg[0], bg[1], bg[2]]);
    const l1 = luminance(effective);
    const l2 = luminance([bg[0], bg[1], bg[2]]);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });

const frames = async (page: Page) =>
  Number(
    await page.evaluate(() => (window as unknown as { __avatarFrames?: number }).__avatarFrames ?? 0),
  );

test.describe('US-006 个人介绍', () => {
  test('正文与要点在无 JS 的静态 HTML 中完整可读', async ({ page }) => {
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');

    await expect(page.locator('#about h2')).toBeVisible();
    await expect(page.locator('[data-about-bio]')).toHaveCount(3);
    await expect(page.locator('[data-about-highlight]')).toHaveCount(7);
    await expect(page.locator('#about')).not.toContainText('个人介绍即将上线');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#about h3')).toBeVisible();
  });

  test('中文与英文页面分别显示对应文案，标题层级不跳级', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('#about h2')).toHaveText('关于我');
    await expect(page.locator('[data-about-bio]').first()).toContainText('计算机科学专业本科大三学生');
    await expect(page.locator('[data-about-highlight]').first()).toContainText('本科大三');

    await page.goto('/en');
    await settle(page);
    await expect(page.locator('#about h2')).toHaveText('About Me');
    await expect(page.locator('[data-about-bio]').first()).toContainText('third-year undergraduate');
    await expect(page.locator('[data-about-highlight]').first()).toContainText('3rd-year');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h2')).toHaveCount(1);
    await expect(page.locator('h3')).toHaveCount(1);
  });

  test('3D 头像有文本替代；无 WebGL 时静态形象与正文完整', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await settle(page);

    const avatar = page.locator('[data-about-avatar]');
    await expect(avatar).toHaveAttribute('role', 'img');
    await expect(avatar).toHaveAttribute('aria-describedby', 'about-avatar-alt');
    await expect(page.locator('#about-avatar-alt')).toContainText('抽象 3D 头像');
    await expect(page.locator('.about-avatar-fallback svg')).toBeVisible();

    await scrollToAbout(page);
    const webgl = await webglAvailable(page);
    if (!webgl) {
      await expect(avatar).toHaveAttribute('data-avatar-mode', 'fallback');
      await expect(avatar).toHaveAttribute('data-avatar-reason', 'no-webgl');
      await expect(page.locator('canvas')).toHaveCount(0);
    } else {
      await expect
        .poll(async () => avatar.getAttribute('data-avatar-mode'), { timeout: 15_000 })
        .toBe('3d');
      await expect(avatar).toHaveAttribute('data-avatar-reason', '3d');
    }

    await expect(page.locator('[data-about-bio]').first()).toBeVisible();
    await expect(page.locator('#about h2')).toBeVisible();
    expect(errors, `未捕获异常: ${errors.join('; ')}`).toEqual([]);
  });

  test('头像进入视口渲染、离开视口暂停（WebGL 环境）', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    await page.goto('/');
    await settle(page);
    test.skip(!(await webglAvailable(page)), '当前环境无法创建 WebGL 上下文（降级路径另有覆盖）');

    await scrollToAbout(page);
    await expect
      .poll(async () => page.locator('[data-about-avatar]').getAttribute('data-avatar-mode'), {
        timeout: 15_000,
      })
      .toBe('3d');

    const before = await frames(page);
    // WebKit 软件渲染帧率可能很低，用轮询等待首个新增帧（逐帧写 dataset）
    await expect
      .poll(async () => frames(page), { timeout: 8_000, message: '视口内应持续渲染' })
      .toBeGreaterThan(before);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const pausedStart = await frames(page);
    await page.waitForTimeout(700);
    const pausedEnd = await frames(page);
    expect(pausedEnd - pausedStart, '离屏后应暂停渲染').toBeLessThanOrEqual(2);
  });

  test('头像上下文丢失且恢复失败后回退静态形象，文字不消失', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await settle(page);
    test.skip(!(await webglAvailable(page)), '当前环境无法创建 WebGL 上下文');

    await scrollToAbout(page);
    const avatar = page.locator('[data-about-avatar]');
    await expect
      .poll(async () => avatar.getAttribute('data-avatar-mode'), { timeout: 15_000 })
      .toBe('3d');

    // 与 context-loss.spec.ts 同一注入方式：把 restoreContext 置空模拟恢复失败，
    // 应用应「尝试恢复一次 → 失败转静态」（US-001d 既有容错模式）。
    const injected = await page.evaluate(() => {
      const list = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      const canvas = list[list.length - 1];
      const gl = (canvas?.getContext('webgl2') || canvas?.getContext('webgl')) as
        | WebGLRenderingContext
        | undefined;
      const ext = gl?.getExtension('WEBGL_lose_context');
      if (!ext) return false;
      ext.restoreContext = () => {};
      ext.loseContext();
      return true;
    });
    test.skip(!injected, '当前环境不支持 WEBGL_lose_context');

    await expect
      .poll(async () => avatar.getAttribute('data-avatar-mode'), { timeout: 10_000 })
      .toBe('fallback');
    await expect(avatar).toHaveAttribute('data-avatar-reason', 'context-lost');
    await expect(page.locator('.about-avatar-fallback svg')).toBeVisible();
    await expect(page.locator('[data-about-bio]').first()).toBeVisible();
    expect(errors, `未捕获异常: ${errors.join('; ')}`).toEqual([]);
  });

  test('3D 资源加载失败时正文与标题完整、无未捕获异常', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*.{glb,gltf,ktx2,hdr,png,webp,avif,jpg}', (route) => route.abort());
    await page.goto('/');
    await settle(page);
    await scrollToAbout(page);

    await expect(page.locator('#about h2')).toBeVisible();
    await expect(page.locator('[data-about-bio]')).toHaveCount(3);
    await expect(page.locator('[data-about-highlight]')).toHaveCount(7);
    expect(errors, `未捕获异常: ${errors.join('; ')}`).toEqual([]);
  });

  test('未配置简历时不显示任何无效下载入口', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-cv]')).toHaveCount(0);
    await expect(page.locator('a[download]')).toHaveCount(0);
    await expect(page.locator('#about')).not.toContainText('下载简历');
  });

  test('各视口无横向溢出且正文对比度达标', async ({ page }) => {
    // 单次加载 + 5 次 resize（避免 5 次导航与 WebGL 上下文销毁拖满 30s 预算）
    test.setTimeout(60_000);
    await page.goto('/');
    await settle(page);
    for (const width of [1440, 1024, 768, 390, 375]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(150);
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('[data-about-bio]').first()).toBeVisible();
      expect(await aboutContrast(page), `${width}px 正文对比度`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('reduced-motion 下简化展示，正文完整可读', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await scrollToAbout(page);
    await expect(page.locator('[data-about-bio]').first()).toBeVisible();
    const transform = await page
      .locator('.about-panel')
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe('none');
  });
});
