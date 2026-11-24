import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdaptiveState,
  nextAdaptiveState,
  degradeTier,
  FRAME_WINDOW,
} from '../lib/adaptive-quality.ts';
import { getQualityTier } from '../lib/quality.ts';

function feed(state, frameMs, times) {
  for (let i = 0; i < times; i += 1) state = nextAdaptiveState(state, frameMs);
  return state;
}

test('初始采样状态未降级', () => {
  const state = createAdaptiveState();
  assert.equal(state.frames, 0);
  assert.equal(state.slowWindows, 0);
  assert.equal(state.degraded, false);
});

test('单窗口低帧率不立即降级', () => {
  const state = feed(createAdaptiveState(), 40, FRAME_WINDOW);
  assert.equal(state.slowWindows, 1);
  assert.equal(state.degraded, false, '一次慢窗口不应触发降档，避免抖动');
  assert.equal(state.frames, 0, '窗口结算后帧计数归零');
});

test('连续两个低帧率窗口触发降级', () => {
  const state = feed(createAdaptiveState(), 40, FRAME_WINDOW * 2);
  assert.equal(state.slowWindows, 2);
  assert.equal(state.degraded, true);
});

test('正常帧率窗口重置慢窗口计数', () => {
  let state = feed(createAdaptiveState(), 40, FRAME_WINDOW);
  state = feed(state, 16, FRAME_WINDOW);
  assert.equal(state.slowWindows, 0);
  assert.equal(state.degraded, false);
  state = feed(state, 40, FRAME_WINDOW);
  assert.equal(state.degraded, false, '需要连续两个慢窗口');
});

test('异常帧时长（切后台/断点）忽略，不误降档', () => {
  let state = feed(createAdaptiveState(), 1000, 5);
  state = feed(state, -5, 5);
  assert.equal(state.frames, 0);
  assert.equal(state.degraded, false);
});

test('降级后状态保持，采样不再翻转', () => {
  const slow = feed(createAdaptiveState(), 40, FRAME_WINDOW * 2);
  const settled = feed(slow, 16, FRAME_WINDOW * 3);
  assert.equal(settled.degraded, true);
});

test('degradeTier 只降粒子与 dpr，保留设备分类', () => {
  const base = getQualityTier(1440, 2);
  const low = degradeTier(base);
  assert.equal(low.particles, 490);
  assert.equal(low.pixelRatio, 1);
  assert.equal(low.deviceClass, 'desktop');
  assert.equal(low.reduced, true);
  assert.equal(base.particles, 700, '不修改入参');
});

test('degradeTier 移动端粒子有下限', () => {
  const low = degradeTier(getQualityTier(390, 3, { hardwareConcurrency: 1 }));
  assert.ok(low.particles >= 150);
});
