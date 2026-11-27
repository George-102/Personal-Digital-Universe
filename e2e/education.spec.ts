import { test, expect, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, settle } from './helpers';

/**
 * US-009 教育背景：三条 AC 逐条留证。
 * 纯 DOM section，无 3D、无独立路由；无 JS 时全部文字仍可读。
 */

const items = (page: Page) => page.locator('[data-education-item]');

test.describe('US-009 教育背景', () => {
  test('AC1 首页 #education 完整展示学历阶段、专业与时间（静态可读）', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    await expect(page.locator('#education')).toBeVisible();
    await expect(page.locator('#education h2')).toHaveText('教育背景');
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-degree]')).toContainText('本科');
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-field="major"]')).toContainText('计算机科学与技术');
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-period]')).toContainText('2023-09');
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-period]')).toContainText('2027-06');
    await expect(page.locator('[data-education-field="courses"] li')).toHaveCount(3);
  });

  test('AC1 英文页显示英文文案，标题层级不跳级', async ({ page }) => {
    await page.goto('/en');
    await settle(page);

    await expect(page.locator('#education h2')).toHaveText('Education');
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-field="major"]')).toContainText('Computer Science and Technology');
    await expect(page.locator('[data-education-slug="undergraduate-cs"] [data-education-period]')).toContainText('2027-06');
  });

  test('AC1 无 JS 时全部教育信息在静态 HTML 中可读', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await expect(items(page)).toHaveCount(2);
    await expect(page.locator('[data-education-degree]').first()).toBeVisible();
    await expect(page.locator('[data-education-field="major"]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('AC2 信息未配置时不显示空字段：研究生条目无学校/学院/毕业时间', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const graduate = page.locator('[data-education-slug="graduate-exam-preparation"]');
    await expect(graduate).toHaveCount(1);
    await expect(graduate.locator('[data-education-field="school"]')).toHaveCount(0);
    await expect(graduate.locator('[data-education-field="college"]')).toHaveCount(0);
    await expect(graduate.locator('[data-education-field="courses"]')).toHaveCount(0);
    await expect(graduate.locator('[data-education-field="interests"]')).toHaveCount(0);
    await expect(graduate.locator('[data-education-period]')).not.toContainText('undefined');
    await expect(graduate.locator('[data-education-period]')).not.toContainText('null');
  });

  test('AC3 备考研究生标记为 In Progress 且明确「尚未入学」，不显示已完成学历', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const graduate = page.locator('[data-education-slug="graduate-exam-preparation"]');
    await expect(graduate).toHaveAttribute('data-education-status', 'In Progress');
    await expect(graduate).toHaveAttribute('data-education-degree-level', 'graduate');
    await expect(graduate.locator('[data-education-status-label]')).toHaveText('进行中');
    await expect(graduate.locator('[data-education-field="status-note"]')).toContainText('备考中，尚未入学');
    // 整页不应把研究生备考条目渲染成已完成学历
    await expect(graduate.locator('[data-education-status-label]')).not.toHaveText('已完成');
    const pageText = await page.locator('#education').textContent();
    expect(pageText).not.toContain('研究生学历已获得');
  });

  test('AC3 英文页研究生条目同样显示 In Progress 与 not enrolled', async ({ page }) => {
    await page.goto('/en');
    await settle(page);

    const graduate = page.locator('[data-education-slug="graduate-exam-preparation"]');
    await expect(graduate).toHaveAttribute('data-education-status', 'In Progress');
    await expect(graduate.locator('[data-education-status-label]')).toHaveText('In Progress');
    await expect(graduate.locator('[data-education-field="status-note"]')).toContainText('not enrolled');
    await expect(graduate.locator('[data-education-field="status-note"]')).toContainText('no graduate degree has been awarded');
  });

  test('DoD 页面不加载 3D Canvas（纯 DOM 时间轴）', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    // 首页 Hero 有 3D，但 #education 自身不含 canvas（US-009 无 WebGL）
    await expect(page.locator('#education canvas')).toHaveCount(0);
    await expect(page.locator('#education [data-education-list]')).toHaveCount(1);
  });

  test('移动端单列可读且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await settle(page);

    await expect(items(page)).toHaveCount(2);
    await expect(page.locator('[data-education-degree]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
