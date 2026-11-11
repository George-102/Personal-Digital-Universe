import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual(toNDC(500, 250, rect), { x: 0, y: 0 });
  assert.deepEqual(toNDC(100, 50, rect), { x: -1, y: 1 });
  assert.deepEqual(toNDC(900, 450, rect), { x: 1, y: -1 });
});

test('toNDC 超出视口时 clamp，零尺寸不产生 NaN', () => {
  assert.deepEqual(toNDC(-999, -999, rect), { x: -1, y: 1 });
  assert.deepEqual(toNDC(500, 250, { left: 0, top: 0, width: 0, height: 0 }), { x: 0, y: 0 });
  assert.equal(Number.isFinite(toNDC(200, 100, rect).x), true);
});

test('clamp 边界与非有限值防护', () => {
  assert.equal(clamp(5, -1, 1), 1);
  assert.equal(clamp(-5, -1, 1), -1);
  assert.equal(clamp(0.5, -1, 1), 0.5);
  assert.equal(clamp(Number.NaN, -1, 1), 0);
});

test('damp 与帧率无关：不同 delta 分割收敛到同一结果', () => {
  const oneStep = damp(0, 1, 6, 0.5);
  let split = 0;
  for (let i = 0; i < 5; i++) split = damp(split, 1, 6, 0.1);
  assert.ok(Math.abs(oneStep - split) < 1e-9, `oneStep=${oneStep} split=${split}`);
  assert.ok(oneStep > 0 && oneStep < 1);
});

test('damp 收敛且非有限输入不污染状态', () => {
  let v = 0;
  for (let i = 0; i < 300; i++) v = damp(v, 1, 4, 1 / 60);
  assert.ok(Math.abs(v - 1) < 1e-6);
  assert.equal(damp(0.4, Number.NaN, 4, 1 / 60), 0.4);
});

test('limitDelta 对快速移动做限幅', () => {
  assert.deepEqual(limitDelta(3, 4, 10), { x: 3, y: 4 });
  const limited = limitDelta(300, 400, 10);
  assert.ok(Math.hypot(limited.x, limited.y) <= 10 + 1e-9);
  assert.deepEqual(limitDelta(Number.NaN, 0, 10), { x: 0, y: 0 });
});

test('repelFactor 随距离衰减且有上限', () => {
  assert.equal(repelFactor(10, 5, 0.5), 0);
  assert.ok(repelFactor(0, 5, 0.5) > 0);
  assert.ok(repelFactor(0, 5, 0.5) <= 0.5);
  assert.ok(repelFactor(2.5, 5, 0.5) < repelFactor(0, 5, 0.5));
});

test('isClickGesture 用位移与时长区分点击与拖拽', () => {
  assert.equal(isClickGesture(0, 100), true);
  assert.equal(isClickGesture(6, 100), true);
  assert.equal(isClickGesture(7, 100), false);
  assert.equal(isClickGesture(2, 900), false);
});

test('PointerState 只跟踪主指针，忽略第二根手指', () => {
  const s = new PointerState(() => rect);
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 0 });
  s.handle('pointermove', { clientX: 600, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 16 });
  assert.equal(s.getSnapshot().ndc.x, 0.25);
  s.handle('pointermove', { clientX: 100, clientY: 50, pointerId: 2, isPrimary: false, timeStamp: 20 });
  assert.equal(s.getSnapshot().ndc.x, 0.25, '第二根手指不应改变主指针快照');
});

test('PointerState pointercancel / pointerleave / blur 复位且不残留状态', () => {
  const s = new PointerState(() => rect);
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 0 });
  assert.equal(s.getSnapshot().dragging, true);
  s.handle('pointercancel', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 30 });
  assert.equal(s.getSnapshot().dragging, false);
  assert.equal(s.getSnapshot().pointerId, null);

  s.handle('pointermove', { clientX: 700, clientY: 100, pointerId: 1, isPrimary: true, timeStamp: 40 });
  s.handle('pointerleave', { clientX: 700, clientY: 100, pointerId: 1, isPrimary: true, timeStamp: 50 });
  assert.deepEqual(s.getSnapshot().ndc, { x: 0, y: 0 });
  assert.equal(s.getSnapshot().active, false);

  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 3, isPrimary: true, timeStamp: 60 });
  s.handle('blur', { clientX: 500, clientY: 250, pointerId: 3, isPrimary: true, timeStamp: 70 });
  assert.equal(s.getSnapshot().dragging, false);
  assert.equal(s.getSnapshot().active, false);
});

test('PointerState 上报手势位移与时长，供点击/拖拽判定', () => {
  const gestures = [];
  const s = new PointerState(() => rect, { onGesture: (g) => gestures.push(g) });
  s.handle('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 100 });
  s.handle('pointermove', { clientX: 530, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 250 });
  s.handle('pointerup', { clientX: 530, clientY: 250, pointerId: 1, isPrimary: true, timeStamp: 300 });
  const up = gestures.find((g) => g.type === 'up');
  assert.ok(up);
  assert.equal(up.travel, 30);
  assert.equal(up.durationMs, 200);
  assert.equal(isClickGesture(up.travel, up.durationMs), false);
});
