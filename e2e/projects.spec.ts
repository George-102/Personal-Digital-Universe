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

const projectFrames = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __projectsFrames?: number }).__projectsFrames ?? 0,
    ),
  );

const hoverIndex = async (page: Page) =>
  Number(
    await page.evaluate(
      () => (window as unknown as { __projectsHover?: number }).__projectsHover ?? -1,
    ),
  );

/** US-012：GitHub 开源项目。首页精选与 /projects 列表的信息主体均为静态 HTML。 */
test.describe('US-012 GitHub 开源项目', () => {
  test('首页 #projects 展示精选项目，卡片静态可读', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#projects')).toBeVisible();
    await expect(page.locator('#projects h2')).toHaveText('开源项目');
    await expect(page.locator('#projects [data-project-item]')).toHaveCount(2);
    await expect(page.locator('#projects [data-project-featured="true"]')).toHaveCount(2);
    await expect(page.locator('#projects [data-project-name]').first()).toContainText(
      'AICS Learning Guide',
    );
    await expect(page.locator('#projects [data-project-description]').first()).toContainText(
      '开源学习路线',
    );
    await expect(page.locator('#projects [data-project-stars]').first()).toContainText('★ 1');
    await expect(page.locator('#projects [data-projects-all]')).toHaveAttribute(
      'href',
      '/projects/',
    );
    // 首页精简：不渲染详情面板与 GitHub 按钮（US-010k TBT 教训）
    await expect(page.locator('#projects [data-project-details]')).toHaveCount(0);
    await expect(page.locator('#projects [data-project-github]')).toHaveCount(0);
  });

  test('英文首页显示英文文案与英文列表入口', async ({ page }) => {
    await page.goto('/en');
    await settle(page);

    await expect(page.locator('#projects h2')).toHaveText('Open Source Projects');
    await expect(page.locator('#projects [data-project-item]')).toHaveCount(2);
    await expect(page.locator('#projects [data-projects-all]')).toHaveAttribute(
      'href',
      '/en/projects/',
    );
  });

  test('无 JS 时首页精选内容完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#projects [data-project-item]')).toHaveCount(2);
    await expect(page.locator('#projects [data-project-name]').first()).toBeVisible();
    await expect(page.locator('#projects [data-project-description]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('非公开项目不泄漏到首页产物（T-002c 初验）', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).not.toContain('Hidden-Project');
    expect(html).not.toContain('TEMP-HIDDEN');
  });

  test('/projects 列表页按五分类展示全部公开项目且 SEO 元数据独立', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/projects\/$/,
    );
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('开源项目');
    await expect(page.locator('[data-projects-group]')).toHaveCount(5);
    await expect(page.locator('[data-project-item]')).toHaveCount(9);
    await expect(page.locator('[data-project-status="active"]').first()).toBeVisible();
  });

  test('/en/projects 显示英文分类与独立 canonical', async ({ page }) => {
    await page.goto('/en/projects');
    await settle(page);

    await expect(page.locator('h1')).toHaveText('Open Source Projects');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/projects\/$/,
    );
    await expect(page.locator('[data-projects-group]')).toHaveCount(5);
    await expect(page.locator('[data-projects-group][data-category="ai-ml"] h2')).toHaveText(
      'AI & Machine Learning',
    );
    await expect(page.locator('a[href="/projects/"]')).toHaveCount(1);
  });

  test('列表页无 JS 时项目详情与 GitHub 入口完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/projects');
    await settle(page);

    await expect(page.locator('[data-project-item]')).toHaveCount(9);
    await expect(page.locator('[data-project-detail]')).toHaveCount(9);
    await expect(page.locator('[data-project-github]')).toHaveCount(7);
    await expect(page.locator('[data-project-github]').first()).toHaveAttribute(
      'href',
      'https://github.com/George-102/AICS_Learning_Guide',
    );
    await expect(page.locator('[data-project-private-note]')).toHaveCount(2);
    expect(errors).toEqual([]);
  });

  test('sitemap 收录双语 /projects', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text();
    expect(text).toContain('/projects/');
    expect(text).toContain('/en/projects/');
  });

  // ---------- US-012f：内联展开面板 ----------

  test('点击卡片展开完整介绍，再次点击收起，焦点留在触发项', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    const first = page.locator('[data-project-item]').first();
    const summary = first.locator('summary');
    await summary.click();
    await expect(first.locator('details')).toHaveAttribute('open', '');
    await expect(first.locator('[data-project-detail]')).toContainText('完整介绍');
    await expect(first.locator('[data-project-github]')).toHaveAttribute(
      'href',
      'https://github.com/George-102/AICS_Learning_Guide',
    );
    expect(
      await page.evaluate(() => document.activeElement?.hasAttribute('data-project-expand')),
    ).toBe(true);

    await summary.click();
    await expect(first.locator('details')).not.toHaveAttribute('open', '');
  });

  test('多卡片互斥展开，Esc 收起已展开项', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    const cards = page.locator('[data-project-item]');
    await cards.nth(0).locator('summary').click();
    await cards.nth(1).locator('summary').click();
    await expect(cards.nth(0).locator('details')).not.toHaveAttribute('open', '');
    await expect(cards.nth(1).locator('details')).toHaveAttribute('open', '');

    await page.keyboard.press('Escape');
    await expect(cards.nth(1).locator('details')).not.toHaveAttribute('open', '');
  });

  test('GitHub 按钮为安全外链，私有仓库不渲染按钮', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    const githubLinks = page.locator('[data-project-github]');
    await expect(githubLinks).toHaveCount(7);
    for (const link of await githubLinks.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect((await link.getAttribute('href'))?.startsWith('https://github.com/')).toBe(true);
    }
    await expect(page.locator('[data-project-private="true"] [data-project-github]')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-project-private-note]')).toHaveCount(2);
  });

  test('键盘 Tab 可达展开控件与 GitHub 按钮，触摸目标不小于 44px', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    const summary = page.locator('[data-project-expand]').first();
    const box = await summary.boundingBox();
    expect(box && box.height >= 44).toBeTruthy();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-project-item]').first().locator('details')).toHaveAttribute(
      'open',
      '',
    );
    const linkBox = await page.locator('[data-project-github]').first().boundingBox();
    expect(linkBox && linkBox.height >= 44).toBeTruthy();
  });
});

// ---------- US-012g：3D 悬浮卡片概念视觉层 ----------

test.describe('US-012g 3D 视觉层', () => {
  test('列表页 3D 进入视口后挂载并渲染，概念标注在 DOM', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    await expect(page.locator('[data-projects-concept-note]')).toHaveText(
      '卡片 3D 悬浮效果为概念性视觉呈现，不影响项目信息阅读',
    );
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await expect(page.locator('[data-projects-3d] canvas')).toHaveCount(0);
      await expect(page.locator('[data-project-item]')).toHaveCount(9);
      return;
    }

    await expect(page.locator('[data-projects-3d]')).toHaveAttribute('data-projects-mode', '3d', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-projects-3d] canvas')).toHaveCount(1);
    const before = await projectFrames(page);
    await expect
      .poll(async () => projectFrames(page), { timeout: 8_000 })
      .toBeGreaterThan(before);
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);
    const visual = page.locator('[data-projects-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');
    await expect(page.locator('[data-project-item]')).toHaveCount(9);
  });

  test('首页不加载 3D 视觉层（US-010k TBT 红线）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-projects-3d]')).toHaveCount(0);
    await expect(page.locator('#projects [data-project-item]')).toHaveCount(2);
  });

  test('无 WebGL 时不挂载 3D，项目文字与展开交互完整', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await expect(page.locator('[data-projects-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-project-item]')).toHaveCount(9);
    await expect(page.locator('[data-project-expand]').first()).toBeVisible();
  });

  test('reduced-motion 下不挂载 3D，内容完整可读', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
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
    await page.goto('/projects');
    await settle(page);

    await expect(page.locator('[data-projects-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-project-item]')).toHaveCount(9);
    await expect(page.locator('[data-project-expand]').first()).toBeVisible();
  });

  test('3D chunk 加载失败时 DOM 信息完整、无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => {
      const url = route.request().url();
      if (/projects|cards/i.test(url)) return route.abort();
      return route.continue();
    });
    await page.goto('/projects');
    await settle(page);

    await expect(page.locator('[data-project-item]')).toHaveCount(9);
    await expect(page.locator('[data-project-description]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// ---------- US-012h：hover 联动与动画冲突 ----------

test.describe('US-012h 交互专项', () => {
  test('悬停 DOM 卡片驱动 3D 激活索引，移出后复位', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '悬停联动只在桌面 WebGL 环境验证');

    await expect(page.locator('[data-projects-3d]')).toHaveAttribute('data-projects-mode', '3d', {
      timeout: 15_000,
    });
    const card = page.locator('[data-project-item]').first();
    await card.hover();
    await expect.poll(async () => hoverIndex(page), { timeout: 5_000 }).toBe(0);
    await page.mouse.move(5, 5);
    await expect.poll(async () => hoverIndex(page), { timeout: 5_000 }).toBe(-1);
  });

  test('鼠标快速经过多个卡片后状态唯一收敛，无未捕获异常', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/projects');
    await settle(page);

    const cards = page.locator('[data-project-item]');
    for (const index of [0, 1, 2, 4, 3, 6, 8, 5]) {
      const box = await cards.nth(index).boundingBox();
      if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(400);

    const activeCount = await page.locator('[data-project-item][data-active="true"]').count();
    expect(activeCount).toBeLessThanOrEqual(1);
    const openCount = await page.locator('[data-project-item][data-open="true"]').count();
    expect(openCount).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('快速划过后立即点击仍命中正确卡片且外链正确', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);

    const cards = page.locator('[data-project-item]');
    for (const index of [0, 3, 1]) {
      await cards.nth(index).hover();
    }
    const target = cards.nth(1);
    await target.locator('summary').click();
    await expect(target.locator('details')).toHaveAttribute('open', '');
    const href = await target.locator('[data-project-github]').getAttribute('href');
    expect(href).toMatch(/^https:\/\/github\.com\/George-102\//);
  });

  test('离屏后 3D 暂停渲染', async ({ page }) => {
    await page.goto('/projects');
    await settle(page);
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    test.skip(!canMount, '暂停行为只在桌面 WebGL 环境验证');

    await expect(page.locator('[data-projects-3d]')).toHaveAttribute('data-projects-mode', '3d', {
      timeout: 15_000,
    });
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    await page.waitForTimeout(500);
    const pausedStart = await projectFrames(page);
    await page.waitForTimeout(800);
    expect((await projectFrames(page)) - pausedStart).toBeLessThanOrEqual(2);
  });
});
