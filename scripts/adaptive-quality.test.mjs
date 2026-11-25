import { test, expect } from 'vitest';
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
  expect(state.frames).toBe(0);
  expect(state.slowWindows).toBe(0);
  expect(state.degraded).toBe(false);
});

test('单窗口低帧率不立即降级', () => {
  const state = feed(createAdaptiveState(), 40, FRAME_WINDOW);
  expect(state.slowWindows).toBe(1);
  expect(state.degraded, '一次慢窗口不应触发降档，避免抖动').toBe(false);
  expect(state.frames, '窗口结算后帧计数归零').toBe(0);
});

test('连续两个低帧率窗口触发降级', () => {
  const state = feed(createAdaptiveState(), 40, FRAME_WINDOW * 2);
  expect(state.slowWindows).toBe(2);
  expect(state.degraded).toBe(true);
});

test('正常帧率窗口重置慢窗口计数', () => {
  let state = feed(createAdaptiveState(), 40, FRAME_WINDOW);
  state = feed(state, 16, FRAME_WINDOW);
  expect(state.slowWindows).toBe(0);
  expect(state.degraded).toBe(false);
  state = feed(state, 40, FRAME_WINDOW);
  expect(state.degraded, '需要连续两个慢窗口').toBe(false);
});

test('异常帧时长（切后台/断点）忽略，不误降档', () => {
  let state = feed(createAdaptiveState(), 1000, 5);
  state = feed(state, -5, 5);
  expect(state.frames).toBe(0);
  expect(state.degraded).toBe(false);
});

test('降级后状态保持，采样不再翻转', () => {
  const slow = feed(createAdaptiveState(), 40, FRAME_WINDOW * 2);
  const settled = feed(slow, 16, FRAME_WINDOW * 3);
  expect(settled.degraded).toBe(true);
});

test('degradeTier 只降粒子与 dpr，保留设备分类', () => {
  const base = getQualityTier(1440, 2);
  const low = degradeTier(base);
  expect(low.particles).toBe(490);
  expect(low.pixelRatio).toBe(1);
  expect(low.deviceClass).toBe('desktop');
  expect(low.reduced).toBe(true);
  expect(base.particles, '不修改入参').toBe(700);
});

test('degradeTier 移动端粒子有下限', () => {
  const low = degradeTier(getQualityTier(390, 3, { hardwareConcurrency: 1 }));
  expect(low.particles >= 150).toBeTruthy();
});
