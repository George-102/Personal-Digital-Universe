import { test, expect } from 'vitest';
import { clamp, damp, limitDelta, repelFactor, isClickGesture, PointerState } from '../lib/pointer.ts';

const rect = { left: 0, top: 0, width: 1000, height: 500 };

/** 模拟 HeroScene 的每帧视差：常量与组件实现保持一致 */
const PARALLAX_X = 0.22;
const PARALLAX_MAX_STEP = 0.08;

function simulateParallax(targets, maxStep = PARALLAX_MAX_STEP, lambda = 6) {
  let current = 0;
  const frames = [];
  for (const target of targets) {
    const step = clamp(target - current, -maxStep, maxStep);
    current = damp(current, current + step, lambda, 1 / 60);
    frames.push(current);
  }
  return frames;
}

test('惯性视差收敛到目标且不越过幅度上限', () => {
  const frames = simulateParallax(Array(180).fill(PARALLAX_X));
  expect(frames.at(-1) > 0.2 && frames.at(-1) <= PARALLAX_X).toBeTruthy();
  expect(frames.every((v) => Math.abs(v) <= PARALLAX_X)).toBeTruthy();
});

test('快速来回横跳时相邻帧差值受限幅约束，不产生突跳', () => {
  const targets = [PARALLAX_X, -PARALLAX_X, PARALLAX_X, -PARALLAX_X, PARALLAX_X, -PARALLAX_X];
  const frames = simulateParallax(targets);
  for (let i = 1; i < frames.length; i++) {
    expect(Math.abs(frames[i] - frames[i - 1]) <= 0.02).toBeTruthy();
  }
  expect(frames.every(Number.isFinite)).toBeTruthy();
});

test('指针增量限幅后不会把大跳变直接传给场景', () => {
  const limited = limitDelta(10000, -10000, 8);
  expect(Math.hypot(limited.x, limited.y) <= 8 + 1e-9).toBeTruthy();
  const frames = simulateParallax([0.05, 0.1, 0.15, 0.1, 0.05]);
  expect(frames.every((v) => Math.abs(v) <= PARALLAX_X)).toBeTruthy();
});

test('粒子排斥力在半径外为 0、半径内受限且有上限', () => {
  for (const d of [0, 1, 2.5, 4.9, 5, 100]) {
    const f = repelFactor(d, 5, 0.35);
    expect(f >= 0 && f <= 0.35).toBeTruthy();
  }
  expect(repelFactor(5, 5, 0.35)).toBe(0);
});

test('点击/拖拽判定：小幅误拖仍是点击，明显拖拽不触发跳转', () => {
  expect(isClickGesture(3, 120)).toBe(true);
  expect(isClickGesture(6, 120)).toBe(true);
  expect(isClickGesture(7, 120)).toBe(false);
  expect(isClickGesture(1, 1200)).toBe(false);
});

test('拖拽后 pointerleave 复位，下一次按下从干净状态开始', () => {
  const gestures = [];
  const s = new PointerState(() => rect, { onGesture: (g) => gestures.push(g) });
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 0 });
  s.handle('pointermove', { clientX: 620, clientY: 300, pointerId: 1, isPrimary: true, timeStamp: 100 });
  s.handle('pointerleave', { clientX: 620, clientY: 300, pointerId: 1, isPrimary: true, timeStamp: 120 });
  expect(s.getSnapshot().dragging).toBe(false);
  expect(s.getSnapshot().ndc).toEqual({ x: 0, y: 0 });

  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 2, isPrimary: true, timeStamp: 200 });
  s.handle('pointerup', { clientX: 501, clientY: 250, pointerId: 2, isPrimary: true, timeStamp: 260 });
  const up = gestures.filter((g) => g.type === 'up').at(-1);
  expect(isClickGesture(up.travel, up.durationMs), '新一次按下不应继承上一段拖拽位移').toBe(true);
});
