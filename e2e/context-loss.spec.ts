import { test, expect } from '@playwright/test';
import { settle, waitForSceneReady } from './helpers';

test.describe('3D 容错', () => {
  test('上下文丢失一次后自动恢复，无未捕获异常', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);

    await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext;
      gl.getExtension('WEBGL_lose_context')!.loseContext();
    });
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (!canvas) return false;
        const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext;
        return !gl.isContextLost();
      },
      undefined,
      { timeout: 10_000 },
    );

    const stillLost = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return false;
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext;
      return gl.isContextLost();
    });
    expect(stillLost, '上下文应已恢复').toBe(false);
    await expect(page.locator('canvas[data-ready="1"]')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    expect(errors, `未捕获异常: ${errors.join('; ')}`).toEqual([]);
  });

  test('恢复失败时转静态模式，文字仍可见且无未捕获异常', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-no-webgl', '仅在支持 WebGL 的项目运行');
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await settle(page);
    await waitForSceneReady(page);

    await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext;
      const ext = gl.getExtension('WEBGL_lose_context')!;
      ext.restoreContext = () => {};
      ext.loseContext();
    });
    await page.waitForFunction(() => document.querySelectorAll('canvas').length === 0, undefined, {
      timeout: 10_000,
    });

    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /explore/i })).toBeVisible();
    expect(errors, `未捕获异常: ${errors.join('; ')}`).toEqual([]);
  });
});