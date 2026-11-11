import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectWebGL } from '../lib/webgl.ts';

test('canvas 返回 webgl2 上下文时判定 WebGL 可用', () => {
  const fakeCanvas = { getContext: (type) => (type === 'webgl2' ? {} : null) };
  assert.equal(detectWebGL(fakeCanvas), true);
});

test('canvas 返回 webgl 上下文时判定 WebGL 可用', () => {
  const fakeCanvas = { getContext: (type) => (type === 'webgl' ? {} : null) };
  assert.equal(detectWebGL(fakeCanvas), true);
});

test('所有上下文都不可用时判定 WebGL 不可用', () => {
  const fakeCanvas = { getContext: () => null };
  assert.equal(detectWebGL(fakeCanvas), false);
});

test('getContext 抛异常时判定 WebGL 不可用', () => {
  const fakeCanvas = {
    getContext: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(detectWebGL(fakeCanvas), false);
});