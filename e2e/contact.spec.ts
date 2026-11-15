import { test, expect, type Page } from '@playwright/test';

const EMAIL = 'zhangchaowen@stu.scu.edu.cn';

async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(180);
}

async function scrollToContact(page: Page) {
  await page.evaluate(() => {
    const section = document.getElementById('contact');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - 80, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
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

const contactFrames = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __contactFrames?: number }).__contactFrames ?? 0,
  );

const isDesktop = (page: Page) =>
  page.evaluate(() => window.matchMedia('(min-width: 1024px)').matches);

/** 正文与玻璃面板合成背景后的 WCAG 对比度 */
const contactContrast = (page: Page) =>
  page.evaluate(() => {
    const parse = (value: string): number[] => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      const parts = (match?.[1] ?? '0,0,0,1').split(',').map((part) => Number(part.trim()));
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
    };
    const composite = (fg: number[], bg: number[]): number[] => [
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
    const panel = document.querySelector<HTMLElement>('[data-contact-panel]')!;
    const intro = panel.querySelector<HTMLElement>('.contact-intro')!;
    const pageBg = parse(getComputedStyle(document.body).backgroundColor);
    const effectiveBg = composite(parse(getComputedStyle(panel).backgroundColor), pageBg);
    const effectiveText = composite(parse(getComputedStyle(intro).color), effectiveBg);
    const l1 = luminance(effectiveText);
    const l2 = luminance(effectiveBg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });

test.describe('US-018 联系方式', () => {
  test('邮箱、文案与合作方向在无 JS 的静态 HTML 中完整可读', async ({ page }) => {
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#contact')).toBeVisible();
    await expect(page.locator('#contact h2')).toHaveText('联系我');
    await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
    await expect(page.locator('[data-contact-email]')).toHaveAttribute('href', `mailto:${EMAIL}`);
    await expect(page.locator('[data-contact-collaboration]')).toHaveCount(5);
    // 无 JS 时按钮不渲染（不出现点了没反应的无效入口），邮箱仍是可手动选中的真实文本
    await expect(page.locator('[data-contact-copy]')).toHaveCount(0);
    await expect(page.locator('[data-contact-mailto]')).toHaveAttribute('href', `mailto:${EMAIL}`);
  });

  test('中英页面分别显示对应文案，全页标题层级不跳级', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('#contact h2')).toHaveText('联系我');
    await expect(page.locator('[data-contact-collaboration]').first()).toHaveText('科研合作');
    await expect(page.locator('#contact h2')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);

    await page.goto('/en/');
    await settle(page);
    await expect(page.locator('#contact h2')).toHaveText('Get in Touch');
    await expect(page.locator('[data-contact-collaboration]').first()).toHaveText(
      'Research Collaboration',
    );
    await expect(page.locator('#contact h2')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('点击 Copy Email 复制邮箱并播报状态', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');
    await settle(page);

    const button = page.locator('[data-contact-copy]');
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('[data-contact-copy-status]')).toHaveText(/已复制|Copied/);

    // 能读取剪贴板的浏览器直接比对内容；不支持时改验等价的邮箱文本（断言不删除）
    const clipboard = await page
      .evaluate(() => navigator.clipboard.readText())
      .catch(() => null);
    if (clipboard !== null) {
      expect(clipboard).toBe(EMAIL);
    } else {
      await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
    }
  });

  test('剪贴板不可用时仍可手动选中复制邮箱，且无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('denied')) },
      });
      // 连 execCommand 回退也失效，强制走到「仅手动复制」路径
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => false,
      });
    });
    await page.goto('/');
    await settle(page);

    const writeRejects = await page.evaluate(async () => {
      try {
        await navigator.clipboard.writeText('probe');
        return false;
      } catch {
        return true;
      }
    });
    expect(writeRejects, '剪贴板失败模拟未生效').toBe(true);

    await page.locator('[data-contact-copy]').click();
    await expect(page.locator('[data-contact-copy-status]')).toHaveText(/手动|manually|失败|failed/i);
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected).toContain(EMAIL);
    await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
    expect(errors).toEqual([]);
  });

  test('未配置的联系方式不显示无效入口，Footer 邮箱入口可用', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400) failed.push(res.url());
    });
    await page.goto('/');
    await settle(page);

    await expect(page.locator('[data-contact-link]')).toHaveCount(0);
    await expect(page.locator('#contact a[href=""]')).toHaveCount(0);
    await expect(page.locator('#contact a[href="#"]')).toHaveCount(0);
    await expect(page.locator('[data-footer-email]')).toHaveAttribute('href', `mailto:${EMAIL}`);
    expect(failed.filter((url) => !url.includes('favicon'))).toEqual([]);
  });

  test('3D 视觉层只在离开首屏、桌面且进入视口后挂载，离屏暂停', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-contact-3d]')).toHaveAttribute('data-contact-mode', 'off');

    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      // 无 WebGL / 窄屏 / reduced-motion：DOM 信息仍完整，且永不创建 Canvas
      await scrollToContact(page);
      await expect(page.locator('[data-contact-section]')).toBeVisible();
      await expect(page.locator('[data-contact-email]')).toBeVisible();
      await expect(page.locator('[data-contact-3d] canvas')).toHaveCount(0);
      return;
    }

    await scrollToContact(page);
    const layer = page.locator('[data-contact-3d]');
    await expect(layer).toHaveAttribute('data-contact-mode', '3d', { timeout: 15_000 });
    const before = await contactFrames(page);
    await page.waitForTimeout(600);
    expect(await contactFrames(page)).toBeGreaterThan(before);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const offscreen = await contactFrames(page);
    await page.waitForTimeout(800);
    expect((await contactFrames(page)) - offscreen).toBeLessThanOrEqual(2);
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const visual = page.locator('[data-contact-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');
    await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
  });

  test('3D 场景 chunk 加载失败时 DOM 信息完整、无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => {
      const url = route.request().url();
      if (/contact|orbit/i.test(url)) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await settle(page);
    await scrollToContact(page);

    await expect(page.locator('[data-contact-email]')).toBeVisible();
    await expect(page.locator('[data-contact-collaboration]')).toHaveCount(5);
    expect(errors).toEqual([]);
  });

  test('五档视口无横向溢出且正文对比度 ≥4.5', async ({ page }) => {
    for (const width of [1440, 1024, 768, 390, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await settle(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px 出现横向溢出`).toBeLessThanOrEqual(1);
      expect(await contactContrast(page), `${width}px 正文对比度不足`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('移动端不挂载 3D，触摸目标不小于 44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await settle(page);
    await scrollToContact(page);

    await expect(page.locator('[data-contact-3d] canvas')).toHaveCount(0);
    for (const selector of ['[data-contact-copy]', '[data-contact-mailto]', '[data-footer-email]']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} 不存在`).not.toBeNull();
      expect(box!.width, `${selector} 宽度不足`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${selector} 高度不足`).toBeGreaterThanOrEqual(44);
    }
  });

  test('键盘可达全部交互且 focus 可见', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const button = page.locator('[data-contact-copy]');
    await button.focus();
    const outline = await button.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-contact-copy-status]')).toHaveText(/已复制|Copied|手动|manually|失败|failed/i);
    await expect(page.locator('[data-contact-mailto]')).toHaveAttribute('href', `mailto:${EMAIL}`);
  });

  test('reduced-motion 下不挂载 3D，内容完整可读', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await settle(page);
    await scrollToContact(page);

    await expect(page.locator('[data-contact-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-contact-email]')).toBeVisible();
    await expect(page.locator('[data-contact-collaboration]')).toHaveCount(5);
    await expect(page.locator('[data-contact-copy]')).toBeVisible();
  });

  test('/contact 与 /en/contact 独立路由内容完整、SEO 元数据独立', async ({ page }) => {
    await page.goto('/contact');
    await settle(page);
    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('联系我');
    await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
    await expect(page.locator('[data-contact-collaboration]')).toHaveCount(5);

    await page.goto('/en/contact');
    await settle(page);
    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Get in Touch');
    await expect(page.locator('[data-contact-email]')).toHaveText(EMAIL);
  });

  test('独立路由在无 JS 时可读，语言切换指向对应语言页面', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/contact');
    await settle(page);
    await expect(page.locator('[data-contact-email]')).toBeVisible();
    await expect(page.locator('a[href="/en/contact/"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});
