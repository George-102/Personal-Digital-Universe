import { test, expect } from '@playwright/test';
import { settle } from './helpers';

async function webglAvailable(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  });
}

async function isDesktop(page: import('@playwright/test').Page) {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

const skillFrames = async (page: import('@playwright/test').Page) =>
  Number(
    await page.evaluate(() => (window as unknown as { __skillsFrames?: number }).__skillsFrames ?? 0),
  );

const hoverIndex = async (page: import('@playwright/test').Page) =>
  Number(
    await page.evaluate(() => (window as unknown as { __skillsHover?: number }).__skillsHover ?? -1),
  );

/** US-007：技术能力——DOM 为信息主体，3D 星图只做概念视觉层。 */
test.describe('US-007 技术能力', () => {
  test('AC1 首页 #skills 按六领域展示精选技能，静态可读', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#skills')).toBeVisible();
    await expect(page.locator('#skills h2')).toHaveText('技术能力');
    await expect(page.locator('#skills [data-skill-group]')).toHaveCount(6);
    await expect(page.locator('#skills [data-skill-item]')).toHaveCount(6);
    await expect(page.locator('#skills [data-skill-name]').first()).toContainText(
      'Data Structures & Algorithms',
    );
    await expect(page.locator('#skills [data-skill-description]').first()).toContainText(
      '数据结构与算法',
    );
    // 首页精简：详情/标签/关联链接全量只在 /skills（TBT 瘦身）
    await expect(page.locator('#skills [data-skill-details]')).toHaveCount(0);
    await expect(page.locator('#skills [data-skill-tags]')).toHaveCount(0);
    await expect(page.locator('#skills [data-skill-related]')).toHaveCount(0);
    await expect(page.locator('#skills [data-skills-all]')).toHaveAttribute('href', '/skills/');
  });

  test('英文首页显示英文文案与英文列表入口', async ({ page }) => {
    await page.goto('/en');
    await settle(page);

    await expect(page.locator('#skills h2')).toHaveText('Skills & Expertise');
    await expect(page.locator('#skills [data-skill-group]')).toHaveCount(6);
    await expect(page.locator('#skills [data-skills-all]')).toHaveAttribute(
      'href',
      '/en/skills/',
    );
  });

  test('无 JS 时首页精选内容完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#skills [data-skill-item]')).toHaveCount(6);
    await expect(page.locator('#skills [data-skill-name]').first()).toBeVisible();
    await expect(page.locator('#skills [data-skill-description]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('AC1 /skills 列表页展示六领域全部技能且 SEO 独立', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    expect((await page.title()).length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/skills\/$/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('技术能力');
    await expect(page.locator('[data-skill-group]')).toHaveCount(6);
    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
  });

  test('/en/skills 显示英文文案与独立 canonical', async ({ page }) => {
    await page.goto('/en/skills');
    await settle(page);

    await expect(page.locator('h1')).toHaveText('Skills & Expertise');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/skills\/$/,
    );
    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
    await expect(page.locator('a[href="/skills/"]')).toHaveCount(1);
  });

  test('无 JS 时列表页详情面板与关联链接完整可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/skills');
    await settle(page);

    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
    await expect(page.locator('[data-skill-detail]')).toHaveCount(18);
    // details 默认收起，关联链接在静态 HTML 中可读但不可见
    expect(await page.locator('[data-skill-related-link]').count()).toBeGreaterThan(0);
    expect(
      (await page.locator('[data-skill-related-link]').first().textContent())?.trim(),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('sitemap 收录双语 /skills', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text();
    expect(text).toContain('/skills/');
    expect(text).toContain('/en/skills/');
  });

  test('AC2 悬停技能写入 3D 探针并高亮 DOM 卡片', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    const card = page.locator('[data-skill-item]').first();
    await card.hover();
    await expect(page.locator('[data-skill-item][data-active="true"]')).toHaveCount(1);
    await expect(card).toHaveAttribute('data-skill-category', 'computer-science');
    await expect
      .poll(async () => hoverIndex(page), { timeout: 5_000 })
      .toBe(0);
    const category = await page.evaluate(
      () => (window as unknown as { __skillsCategory?: string }).__skillsCategory,
    );
    expect(category).toBe('computer-science');
  });

  test('AC2 点击展开说明、互斥展开、Esc 收起并回焦', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    const cards = page.locator('[data-skill-item]');
    const first = cards.first();
    await first.locator('summary').click();
    await expect(first.locator('details')).toHaveAttribute('open', '');
    await expect(first.locator('[data-skill-detail]')).toContainText('使用场景');
    expect(
      await page.evaluate(() => document.activeElement?.hasAttribute('data-skill-expand')),
    ).toBe(true);

    await cards.nth(1).locator('summary').click();
    await expect(first.locator('details')).not.toHaveAttribute('open', '');
    await expect(cards.nth(1).locator('details')).toHaveAttribute('open', '');

    await page.keyboard.press('Escape');
    await expect(cards.nth(1).locator('details')).not.toHaveAttribute('open', '');
  });

  test('AC3 关联链接指向已有页面，未配置关联的技能仍完整展示', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    const links = page.locator('[data-skill-related-link]');
    expect(await links.count()).toBeGreaterThan(0);
    const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    for (const href of hrefs) {
      expect(['/projects/', '/research/']).toContain(href);
    }

    // data-structures-algorithms 未配置 related：仍展示说明与缺省提示
    const noRelated = page.locator('[data-skill-slug="data-structures-algorithms"]');
    await expect(noRelated.locator('[data-skill-description]')).toContainText('数据结构与算法');
    await expect(noRelated.locator('[data-skill-detail]')).toContainText('计算机科学本科核心训练');
    await expect(noRelated.locator('[data-skill-no-related]')).toHaveText('暂未配置关联内容。');
  });

  test('DoD 页面不出现熟练度百分比或熟练度字段', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/\d+\s*%/);
    const forbidden = await page.evaluate(() => {
      const keys = ['proficiency', 'level', 'percent', 'percentage', 'rating', 'score', 'mastery'];
      return Array.from(document.querySelectorAll('[data-skill-item]')).flatMap((item) =>
        Array.from(item.attributes)
          .map((attr) => attr.name.toLowerCase())
          .filter((name) => keys.some((key) => name.includes(key))),
      );
    });
    expect(forbidden).toEqual([]);
  });

  test('键盘可达展开控件（触摸目标 ≥36px）', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    const summary = page.locator('[data-skill-expand]').first();
    const box = await summary.boundingBox();
    expect(box && box.height >= 36).toBeTruthy();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-skill-item]').first().locator('details')).toHaveAttribute(
      'open',
      '',
    );
  });
});

// ---------- US-007f：3D 技能星图概念视觉层 ----------

test.describe('US-007f 3D 技能星图', () => {
  test('列表页 3D 进入视口后挂载并渲染，概念标注在 DOM', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);

    await expect(page.locator('[data-skills-concept-note]')).toHaveText(
      '技能星图为概念性可视化，不代表熟练度评级。',
    );
    const canMount = (await webglAvailable(page)) && (await isDesktop(page));
    if (!canMount) {
      await expect(page.locator('[data-skills-3d] canvas')).toHaveCount(0);
      await expect(page.locator('[data-skill-item]')).toHaveCount(18);
      return;
    }

    await expect(page.locator('[data-skills-3d]')).toHaveAttribute('data-skills-mode', '3d', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-skills-3d] canvas')).toHaveCount(1);
    const before = await skillFrames(page);
    await expect.poll(async () => skillFrames(page), { timeout: 8_000 }).toBeGreaterThan(before);
  });

  test('3D 层是纯装饰：aria-hidden 且不含可读文本', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);
    const visual = page.locator('[data-skills-visual]');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect((await visual.textContent())?.trim() ?? '').toBe('');
    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
  });

  test('首页不加载 3D 视觉层（TBT 红线）', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('[data-skills-3d]')).toHaveCount(0);
    await expect(page.locator('#skills [data-skill-item]')).toHaveCount(6);
  });

  test('无 WebGL 时不挂载 3D，技能文字与展开交互完整', async ({ page }) => {
    await page.goto('/skills');
    await settle(page);
    test.skip(await webglAvailable(page), '该用例只在无 WebGL 环境执行');

    await expect(page.locator('[data-skills-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
    await expect(page.locator('[data-skill-expand]').first()).toBeVisible();
  });

  test('reduced-motion 下不挂载 3D，内容完整可读', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: /prefers-reduced-motion/.test(query),
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
    await page.goto('/skills');
    await settle(page);

    await expect(page.locator('[data-skills-3d] canvas')).toHaveCount(0);
    await expect(page.locator('[data-skill-item]')).toHaveCount(18);
    await expect(page.locator('[data-skill-name]').first()).toBeVisible();
  });
});
