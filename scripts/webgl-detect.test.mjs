import { test, expect } from 'vitest';
import { detectWebGL } from '../lib/webgl.ts';

test('canvas 返回 webgl2 上下文时判定 WebGL 可用', () => {
  const fakeCanvas = { getContext: (type) => (type === 'webgl2' ? {} : null) };
  expect(detectWebGL(fakeCanvas)).toBe(true);
});

test('canvas 返回 webgl 上下文时判定 WebGL 可用', () => {
  const fakeCanvas = { getContext: (type) => (type === 'webgl' ? {} : null) };
  expect(detectWebGL(fakeCanvas)).toBe(true);
});

test('所有上下文都不可用时判定 WebGL 不可用', () => {
  const fakeCanvas = { getContext: () => null };
  expect(detectWebGL(fakeCanvas)).toBe(false);
});

test('getContext 抛异常时判定 WebGL 不可用', () => {
  const fakeCanvas = {
    getContext: () => {
      throw new Error('blocked');
    },
  };
  expect(detectWebGL(fakeCanvas)).toBe(false);
});