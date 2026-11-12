import { test, expect, type Page } from '@playwright/test';
import { settle, waitForSceneReady } from './helpers';

/** 移动端折叠菜单（US-004e）落地后从菜单进入；落地前导航项直接可见，保持最小可点路径 */
async function openNavIfCollapsed(page: Page) {
  const menuButton = page.getByRole('button', { name: /menu|导航|菜单/i });
  if ((await menuButton.count()) === 0) return;
  if (!(await menuButton.first().isVisible())) return;
  if ((await menuButton.first().getAttribute('aria-expanded')) === 'true') return;
  await menuButton.first().click();
}

const visibleNavLink = (page: Page, id: string) =>
  page.locator(`a[data-nav-id="${id}"]:visible`).first();

/** 当前激活的导航项 id（桌面与移动菜单可能各有一份 DOM，按 id 去重） */
const activeIds = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      new Set(
        Array.from(
          document.querySelectorAll<HTMLAnchorElement>('a[data-nav-id][data-active="true"]'),
        ).map((link) => link.dataset.navId),
      ),
    ),
  );

async function clickNav(page: Page, id: string) {
  await openNavIfCollapsed(page);
  await visibleNavLink(page, id).click();
}

/** 导航背景与文字的有效对比度（半透明玻璃栏先与页面背景合成再计算） */
const navContrast = (page: Page) =>
  page.evaluate(() => {
    type Rgba = [number, number, number, number];
    const parse = (value: string): Rgba => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      const parts = (match?.[1] ?? '0,0,0,1').split(',').map((part) => Number(part.trim()));
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
    };
    const composite = (fg: Rgba, bg: number[]): number[] => [
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

    const header = document.querySelector<HTMLElement>('[data-site-nav]')!;
    const link = header.querySelector<HTMLElement>('a[data-nav-id="home"]')!;
    const pageBg = parse(getComputedStyle(document.body).backgroundColor);
    const headerBg = parse(getComputedStyle(header).backgroundColor);
    const effectiveBg = composite(headerBg, [pageBg[0], pageBg[1], pageBg[2]]);
    const text = parse(getComputedStyle(link).color);
    const effectiveText = composite(text, effectiveBg);
    const l1 = luminance(effectiveText);
    const l2 = luminance(effectiveBg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });

test.describe('空间化导航', () => {
  test('点击 About 准确到达 #about 并同步 URL hash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);

    await clickNav(page, 'about');
    await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
    await expect.poll(() => new URL(page.url()).hash).toBe('#about');
    expect(errors).toEqual([]);
  });

  test('点击 Home 返回 hero 顶部', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

    await clickNav(page, 'home');
    await expect(page.locator('#home')).toBeInViewport({ timeout: 10_000 });
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
      .toBeLessThan(50);
    await expect.poll(() => new URL(page.url()).hash).toBe('#home');
  });

  test('目标模块不存在时不产生无效跳转、不报错', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);
    await openNavIfCollapsed(page);
    const before = page.url();

    // 模拟注入一条指向不存在模块的导航项
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll<HTMLElement>('[data-site-nav] nav'));
      const visible = navs.find((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      });
      visible?.insertAdjacentHTML(
        'beforeend',
        '<a id="nav-ghost" data-nav-item data-nav-id="ghost" href="#ghost-target">Ghost</a>',
      );
    });
    await page.locator('#nav-ghost').click();
    await page.waitForTimeout(200);

    expect(page.url()).toBe(before);
    expect(errors).toEqual([]);
  });

  test('英文页导航同样到达对应模块', async ({ page }) => {
    await page.goto('/en');
    await settle(page);
    await clickNav(page, 'about');
    await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
    await expect.poll(() => new URL(page.url()).hash).toBe('#about');
    expect(page.url()).toContain('/en');
    // 中英页面激活态行为一致（US-004d）
    await expect.poll(() => activeIds(page)).toEqual(['about']);
  });

  test('滚动时激活态同步，同一时刻仅一项激活', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);

    const homeLinks = page.locator('a[data-nav-id="home"]');
    const aboutLinks = page.locator('a[data-nav-id="about"]');

    // 初始：Home 激活，且带 aria-current
    await expect.poll(() => activeIds(page)).toEqual(['home']);
    await expect(homeLinks.first()).toHaveAttribute('aria-current', 'true');
    await expect(aboutLinks.first()).toHaveAttribute('data-active', 'false');

    // 滚动到 About：激活态跟随
    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await expect.poll(() => activeIds(page)).toEqual(['about']);
    await expect(aboutLinks.first()).toHaveAttribute('aria-current', 'true');
    await expect(homeLinks.first()).toHaveAttribute('data-active', 'false');

    // 快速上下滚动：无并发冲突状态，最终停在唯一激活项
    for (const ratio of [0, 1, 0, 1, 0]) {
      await page.evaluate((r) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * r, behavior: 'instant' });
      }, ratio);
    }
    await page.waitForTimeout(300);
    await expect.poll(() => activeIds(page)).toEqual(['home']);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => activeIds(page)).toEqual(['home']);
    expect(errors).toEqual([]);
  });

  test('移动端折叠菜单：触摸展开、Esc/遮罩关闭与焦点管理', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await settle(page);

    const button = page.getByRole('button', { name: /menu|导航|菜单/i });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('#mobile-nav');
    await expect(panel).toBeVisible();

    // reduced-motion：菜单无过渡动画，直接开合
    const motion = await panel.evaluate((el) => {
      const style = getComputedStyle(el);
      return { transition: style.transitionDuration, animation: style.animationName };
    });
    expect(motion.transition).toBe('0s');
    expect(motion.animation).toBe('none');

    // 菜单内全部导航项可触摸可达（核心入口不被隐藏）
    for (const id of ['home', 'about']) {
      await expect(panel.locator(`a[data-nav-id="${id}"]`)).toBeVisible();
    }
    // 打开后焦点进入菜单（WebKit 的 Tab 不遍历链接，键序列可达性由桌面用例覆盖）
    await expect(panel.locator('a').first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    // 遮罩点击关闭
    await button.click();
    await expect(panel).toBeVisible();
    await page.locator('[data-nav-overlay]').click();
    await expect(panel).toHaveCount(0);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  test('导航点击驱动 3D 相机过渡并收敛（无 WebGL 时导航仍正常）', async ({ page }, testInfo) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/');
    await settle(page);

    if (testInfo.project.name === 'chromium-no-webgl') {
      await clickNav(page, 'about');
      await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
      await expect(page.locator('canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
      return;
    }

    await waitForSceneReady(page);
    const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
    await canvas.waitFor({ timeout: 15_000 });
    const transition = async () => Number(await canvas.getAttribute('data-transition'));
    const cameraZ = async () => Number(await canvas.getAttribute('data-camera-z'));

    // 复用 US-003 转场机制：导航点击 → 原生滚动 → 同一进度源驱动相机，组件内无第二份相机配置
    expect(await transition()).toBeLessThan(0.05);
    await clickNav(page, 'about');
    await expect.poll(transition, { timeout: 10_000 }).toBeGreaterThan(0.9);
    const endZ = await cameraZ();
    expect(endZ).toBeLessThan(-0.5);
    expect(endZ).toBeGreaterThanOrEqual(-1.41);

    // 停止滚动后状态收敛到唯一终值，无冲突动画
    await expect
      .poll(
        async () => {
          const a = await transition();
          await page.waitForTimeout(250);
          const b = await transition();
          return Math.abs(b - a);
        },
        { timeout: 10_000 },
      )
      .toBeLessThan(0.01);
    expect(await transition()).toBeGreaterThan(0.99);
    expect(errors).toEqual([]);
  });

  test('reduced-motion 下导航点击不驱动相机运动，内容仍到达', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '无 WebGL 项目没有相机状态');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);
    const canvas = page.locator('[data-interaction-canvas][data-transition]').first();
    await canvas.waitFor({ timeout: 15_000 });

    await clickNav(page, 'about');
    await expect(page.locator('#about')).toBeInViewport({ timeout: 10_000 });
    await page.waitForTimeout(600);
    await expect(canvas).toHaveAttribute('data-transition', '0.000');
    await expect(canvas).toHaveAttribute('data-camera-z', '0.000');
  });

  test('导航在 hero / 转场中 / about 背景下保持可读（对比度 ≥4.5）', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    expect(await navContrast(page)).toBeGreaterThanOrEqual(4.5);

    // 转场中段：按 hero→#about 段区间取中点（US-006 起页面变长，scrollHeight*0.5 会越过终点）
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (!about) return;
      const top = about.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top * 0.5, behavior: 'instant' });
    });
    await page.waitForTimeout(300);
    expect(await navContrast(page)).toBeGreaterThanOrEqual(4.5);

    await page.evaluate(() =>
      document.querySelector('#about')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );
    await page.waitForTimeout(300);
    expect(await navContrast(page)).toBeGreaterThanOrEqual(4.5);
  });

  test('键盘 Tab 可达桌面全部导航项且 focus 可见', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile-'), '移动端经折叠菜单路径，已在菜单用例覆盖');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await settle(page);

    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const style = el ? getComputedStyle(el) : null;
        return {
          navId: el?.getAttribute('data-nav-id') ?? null,
          outlineStyle: style?.outlineStyle ?? '',
          outlineWidth: style?.outlineWidth ?? '',
        };
      });

    await page.keyboard.press('Tab');
    const home = await focused();
    expect(home.navId).toBe('home');
    expect(home.outlineStyle).not.toBe('none');
    expect(parseFloat(home.outlineWidth)).toBeGreaterThan(0);

    await page.keyboard.press('Tab');
    expect((await focused()).navId).toBe('about');

    // hover 态可见（非激活项颜色切换为强调色）
    const aboutLink = page.locator('a[data-nav-id="about"]').first();
    await aboutLink.hover();
    await expect
      .poll(() => aboutLink.evaluate((el) => getComputedStyle(el).color))
      .toBe('rgb(34, 211, 238)');
  });
});
