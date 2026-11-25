import { test, expect } from 'vitest';
import {
  clamp,
  toNDC,
  damp,
  limitDelta,
  repelFactor,
  isClickGesture,
  PointerState,
} from '../lib/pointer.ts';

const rect = { left: 100, top: 50, width: 800, height: 400 };

test('toNDC 把视口坐标归一化到 -1~1 且 y 轴朝上', () => {
  expect(toNDC(500, 250, rect)).toEqual({ x: 0, y: 0 });
  expect(toNDC(100, 50, rect)).toEqual({ x: -1, y: 1 });
  expect(toNDC(900, 450, rect)).toEqual({ x: 1, y: -1 });
});

test('toNDC 超出视口时 clamp，零尺寸不产生 NaN', () => {
  expect(toNDC(-999, -999, rect)).toEqual({ x: -1, y: 1 });
  expect(toNDC(500, 250, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  expect(Number.isFinite(toNDC(200, 100, rect).x)).toBe(true);
});

test('clamp 边界与非有限值防护', () => {
  expect(clamp(5, -1, 1)).toBe(1);
  expect(clamp(-5, -1, 1)).toBe(-1);
  expect(clamp(0.5, -1, 1)).toBe(0.5);
  expect(clamp(Number.NaN, -1, 1)).toBe(0);
});

test('damp 与帧率无关：不同 delta 分割收敛到同一结果', () => {
  const oneStep = damp(0, 1, 6, 0.5);
  let split = 0;
  for (let i = 0; i < 5; i++) split = damp(split, 1, 6, 0.1);
  expect(Math.abs(oneStep - split) < 1e-9).toBeTruthy();
  expect(oneStep > 0 && oneStep < 1).toBeTruthy();
});

test('damp 收敛且非有限输入不污染状态', () => {
  let v = 0;
  for (let i = 0; i < 300; i++) v = damp(v, 1, 4, 1 / 60);
  expect(Math.abs(v - 1) < 1e-6).toBeTruthy();
  expect(damp(0.4, Number.NaN, 4, 1 / 60)).toBe(0.4);
});

test('limitDelta 对快速移动做限幅', () => {
  expect(limitDelta(3, 4, 10)).toEqual({ x: 3, y: 4 });
  const limited = limitDelta(300, 400, 10);
  expect(Math.hypot(limited.x, limited.y) <= 10 + 1e-9).toBeTruthy();
  expect(limitDelta(Number.NaN, 0, 10)).toEqual({ x: 0, y: 0 });
});

test('repelFactor 随距离衰减且有上限', () => {
  expect(repelFactor(10, 5, 0.5)).toBe(0);
  expect(repelFactor(0, 5, 0.5) > 0).toBeTruthy();
  expect(repelFactor(0, 5, 0.5) <= 0.5).toBeTruthy();
  expect(repelFactor(2.5, 5, 0.5) < repelFactor(0, 5, 0.5)).toBeTruthy();
});

test('isClickGesture 用位移与时长区分点击与拖拽', () => {
  expect(isClickGesture(0, 100)).toBe(true);
  expect(isClickGesture(6, 100)).toBe(true);
  expect(isClickGesture(7, 100)).toBe(false);
  expect(isClickGesture(2, 900)).toBe(false);
});

test('PointerState 只跟踪主指针，忽略第二根手指', () => {
  const s = new PointerState(() => rect);
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 0 });
  s.handle('pointermove', { clientX: 600, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 16 });
  expect(s.getSnapshot().ndc.x).toBe(0.25);
  s.handle('pointermove', { clientX: 100, clientY: 50, pointerId: 2, isPrimary: false, timeStamp: 20 });
  expect(s.getSnapshot().ndc.x, '第二根手指不应改变主指针快照').toBe(0.25);
});

test('PointerState pointercancel / pointerleave / blur 复位且不残留状态', () => {
  const s = new PointerState(() => rect);
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 0 });
  expect(s.getSnapshot().dragging).toBe(true);
  s.handle('pointercancel', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 30 });
  expect(s.getSnapshot().dragging).toBe(false);
  expect(s.getSnapshot().pointerId).toBe(null);

  s.handle('pointermove', { clientX: 700, clientY: 100, pointerId: 1, isPrimary: true, timeStamp: 40 });
  s.handle('pointerleave', { clientX: 700, clientY: 100, pointerId: 1, isPrimary: true, timeStamp: 50 });
  expect(s.getSnapshot().ndc).toEqual({ x: 0, y: 0 });
  expect(s.getSnapshot().active).toBe(false);

  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 3, isPrimary: true, timeStamp: 60 });
  s.handle('blur', { clientX: 500, clientY: 250, pointerId: 3, isPrimary: true, timeStamp: 70 });
  expect(s.getSnapshot().dragging).toBe(false);
  expect(s.getSnapshot().active).toBe(false);
});

test('PointerState 上报手势位移与时长，供点击/拖拽判定', () => {
  const gestures = [];
  const s = new PointerState(() => rect, { onGesture: (g) => gestures.push(g) });
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 100 });
  s.handle('pointermove', { clientX: 530, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 250 });
  s.handle('pointerup', { clientX: 530, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 300 });
  const up = gestures.find((g) => g.type === 'up');
  expect(up).toBeTruthy();
  expect(up.travel).toBe(30);
  expect(up.durationMs).toBe(200);
  expect(isClickGesture(up.travel, up.durationMs)).toBe(false);
});
