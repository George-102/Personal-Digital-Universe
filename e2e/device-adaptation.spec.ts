import { test, expect, type Page } from '@playwright/test';

type QualityProbe = {
  particles: number;
  pixelRatio: number;
  deviceClass: string;
  reduced: boolean;
};

async function readQuality(page: Page): Promise<QualityProbe | undefined> {
  return page.evaluate(() => Reflect.get(window, '__qualityTier') as QualityProbe | undefined);
}

async function setHardware(page: Page, concurrency: number, memory: number) {
  await page.addInitScript(
    ({ concurrency, memory }) => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        get: () => concurrency,
      });
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => memory });
    },
    { concurrency, memory },
  );
}

test.describe('US-021 设备档位探针与低性能模拟', () => {
  test('桌面默认使用 700 粒子完整档位', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 模拟硬件信号');
    await setHardware(page, 8, 16);
    await page.goto('/');
    await expect.poll(() => readQuality(page)).toMatchObject({
      deviceClass: 'desktop',
      particles: 700,
      reduced: false,
    });
    expect(await page.evaluate(() => Reflect.get(window, '__deviceTier'))).toBe('desktop');
  });

  test('平板视口按视口档位使用 500 粒子', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 模拟硬件信号');
    await setHardware(page, 8, 16);
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/');
    await expect.poll(() => readQuality(page)).toMatchObject({
      deviceClass: 'tablet',
      particles: 500,
      reduced: false,
    });
  });

  test('低并发与低内存设备自动降档（首页 Hero）', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 模拟硬件信号');
    await setHardware(page, 2, 2);
    await page.goto('/');
    await expect.poll(() => readQuality(page)).toMatchObject({
      deviceClass: 'desktop',
      reduced: true,
    });
    const quality = await readQuality(page);
    expect(quality?.particles).toBeLessThan(700);
    expect(quality?.pixelRatio).toBeLessThanOrEqual(1);
  });

  test('低性能信号在列表页 3D 同样生效', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 模拟硬件信号');
    await setHardware(page, 2, 2);
    await page.goto('/projects');
    await page.locator('.projects-3d').scrollIntoViewIfNeeded();
    await expect
      .poll(() => readQuality(page), { timeout: 15_000 })
      .toMatchObject({ reduced: true, deviceClass: 'desktop' });
    const quality = await readQuality(page);
    expect(quality?.particles).toBeLessThan(700);
  });
});

test.describe('US-021 三档 3D 行为差异与挂载门槛', () => {
  test('桌面/平板/移动画质与 3D 挂载形态依次简化，内容始终不被 Canvas 遮挡', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 切换视口');
    await setHardware(page, 8, 16);

    const cases = [
      { width: 1440, height: 900, deviceClass: 'desktop', particles: 700 },
      { width: 820, height: 1180, deviceClass: 'tablet', particles: 500 },
      { width: 390, height: 844, deviceClass: 'mobile', particles: 350 },
    ];

    for (const device of cases) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await expect.poll(() => readQuality(page)).toMatchObject({
        deviceClass: device.deviceClass,
        particles: device.particles,
        reduced: false,
      });
      await expect(page.locator('h1')).toBeVisible();
      const covered = await page.evaluate(() => {
        const cta = document.querySelector<HTMLElement>('a[href="#about"]');
        if (!cta) return true;
        const box = cta.getBoundingClientRect();
        const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return !top?.closest('a[href="#about"]');
      });
      expect(covered, `${device.deviceClass} 下 CTA 不应被 Canvas 遮挡`).toBe(false);
    }

    // 非首屏 3D 在窄屏/平板上不挂载（≥1024px 门槛）
    expect(await page.locator('#journey canvas').count()).toBe(0);
    await expect(page.locator('[data-journey-mode]')).toHaveAttribute('data-journey-mode', 'off');
  });

  test('低性能降档不改变非首屏 3D 的挂载门槛', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '仅在 chromium 模拟硬件信号');
    await setHardware(page, 2, 2);
    await page.goto('/research');
    await page.locator('[data-research-3d]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', '3d');
    await expect.poll(() => readQuality(page)).toMatchObject({ reduced: true });

    // reduced-motion 仍强制关闭 3D，降档不能覆盖该门槛
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    expect(await page.locator('canvas').count()).toBe(0);
    await expect(page.locator('[data-research-3d]')).toHaveAttribute('data-research-mode', 'off');
  });
});

test.describe('US-021 移动端触摸与非缩放布局', () => {
  test('卡片单列且核心触摸目标不小于 44px', async ({ page }, testInfo) => {
    test.skip(!['mobile-chrome', 'mobile-safari'].includes(testInfo.project.name), '仅移动端项目');
    await page.goto('/');

    const columns = await page.evaluate(() => {
      const list = document.querySelector<HTMLElement>('#projects .project-list');
      return list
        ? getComputedStyle(list)
            .gridTemplateColumns.split(/\s+/)
            .filter(Boolean).length
        : 0;
    });
    expect(columns, '移动端项目卡应为单列').toBe(1);

    for (const selector of ['[data-nav-toggle]', '#journey details summary']) {
      const height = await page.locator(selector).first().evaluate((el) => el.getBoundingClientRect().height);
      expect(height, `${selector} 触摸高度`).toBeGreaterThanOrEqual(44);
    }
  });

  test('折叠菜单可用触摸展开并导航关闭', async ({ page }, testInfo) => {
    test.skip(!['mobile-chrome', 'mobile-safari'].includes(testInfo.project.name), '仅移动端项目');
    await page.goto('/');
    const toggle = page.locator('[data-nav-toggle]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('#mobile-nav');
    await expect(panel).toBeVisible();

    await panel.locator('a[data-nav-id="about"]').tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(page.url()).toContain('#about');
  });

  test('触摸可展开时间线详情', async ({ page }, testInfo) => {
    test.skip(!['mobile-chrome', 'mobile-safari'].includes(testInfo.project.name), '仅移动端项目');
    await page.goto('/');
    const summary = page.locator('#journey details summary').first();
    await summary.scrollIntoViewIfNeeded();
    await summary.tap();
    await expect(page.locator('#journey details').first()).toHaveAttribute('open', '');
  });

  test('移动端不是桌面缩放：导航形态与卡片列数有实质差异', async ({ page }, testInfo) => {
    test.skip(!['mobile-chrome', 'mobile-safari'].includes(testInfo.project.name), '仅移动端项目');
    const readShape = async () =>
      page.evaluate(() => {
        const toggle = document.querySelector<HTMLElement>('[data-nav-toggle]');
        const list = document.querySelector<HTMLElement>('#projects .project-list');
        return {
          // 父级 nav 在 md 以上 display:none；按钮自身样式仍在，需按实际渲染盒判断
          menuVisible: Boolean(toggle && toggle.getClientRects().length > 0),
          columns: list
            ? getComputedStyle(list).gridTemplateColumns.split(/\s+/).filter(Boolean).length
            : 0,
        };
      });

    await page.goto('/');
    const mobile = await readShape();
    expect(mobile.menuVisible, '移动导航使用折叠菜单').toBe(true);
    expect(mobile.columns, '移动卡片单列').toBe(1);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    const desktop = await readShape();
    expect(desktop.menuVisible, '桌面导航不使用折叠按钮').toBe(false);
    expect(desktop.columns, '桌面卡片多列').toBeGreaterThan(1);
  });
});
