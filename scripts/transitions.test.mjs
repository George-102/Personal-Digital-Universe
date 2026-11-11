import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  transitionSegments,
  findTransitionSegment,
  validateTransitionSegments,
  cameraTargets,
  shellFactor,
} from '../lib/transitions.ts';

const validSegment = () => ({
  id: 'hero-about',
  range: { targetSelector: '#about', from: 0, to: 1 },
  camera: { zOffset: -1.4, coreSpin: Math.PI / 2, coreYOffset: -0.3 },
  background: { from: '#0b1020', to: '#151d3a' },
  particles: { shellScale: 0.75 },
  panel: { risePx: 24, tiltDeg: 2.5, minOpacity: 0.9 },
});

test('默认注册表通过校验且含 hero→about 段', () => {
  assert.deepEqual(validateTransitionSegments(transitionSegments), []);
  const segment = findTransitionSegment(transitionSegments, 'hero-about');
  assert.ok(segment);
  assert.equal(segment.range.targetSelector, '#about');
  assert.equal(findTransitionSegment(transitionSegments, 'nope'), undefined);
  assert.equal(findTransitionSegment(transitionSegments, null), undefined);
});

test('id 重复被拒绝', () => {
  const errors = validateTransitionSegments([validSegment(), validSegment()]);
  assert.ok(errors.some((e) => e.includes('id') && e.includes('重复')));
});

test('非法触发区间被拒绝', () => {
  const reversed = { ...validSegment(), range: { targetSelector: '#about', from: 0.8, to: 0.2 } };
  const outOfRange = { ...validSegment(), range: { targetSelector: '#about', from: -0.1, to: 1.2 } };
  const nonFinite = { ...validSegment(), range: { targetSelector: '#about', from: 0, to: Number.NaN } };
  const badSelector = { ...validSegment(), range: { targetSelector: 'about', from: 0, to: 1 } };
  for (const bad of [reversed, outOfRange, nonFinite, badSelector]) {
    const errors = validateTransitionSegments([bad]);
    assert.ok(errors.length > 0, `应拒绝：${JSON.stringify(bad.range)}`);
  }
});

test('非法背景颜色被拒绝', () => {
  const errors = validateTransitionSegments([
    { ...validSegment(), background: { from: 'red', to: '#151d3a' } },
  ]);
  assert.ok(errors.some((e) => e.includes('background.from') && e.includes('非法颜色')));
  assert.ok(
    validateTransitionSegments([
      { ...validSegment(), background: { from: '#0b1020', to: '#12345' } },
    ]).length > 0,
  );
});

test('越界系数被拒绝（相机/粒子/面板位移）', () => {
  const bigZ = { ...validSegment(), camera: { zOffset: -9, coreSpin: 1, coreYOffset: 0 } };
  const bigSpin = { ...validSegment(), camera: { zOffset: -1, coreSpin: 99, coreYOffset: 0 } };
  const bigShell = { ...validSegment(), particles: { shellScale: 12 } };
  const bigRise = { ...validSegment(), panel: { risePx: 999, tiltDeg: 2, minOpacity: 0.9 } };
  const bigTilt = { ...validSegment(), panel: { risePx: 20, tiltDeg: 90, minOpacity: 0.9 } };
  for (const bad of [bigZ, bigSpin, bigShell, bigRise, bigTilt]) {
    assert.ok(validateTransitionSegments([bad]).length > 0);
  }
  // 非有限值同样拒绝
  assert.ok(
    validateTransitionSegments([
      { ...validSegment(), particles: { shellScale: Number.NaN } },
    ]).length > 0,
  );
});

test('panel.minOpacity 低于 0.85 被拒（立即阅读红线）', () => {
  const errors = validateTransitionSegments([
    { ...validSegment(), panel: { risePx: 20, tiltDeg: 2, minOpacity: 0.5 } },
  ]);
  assert.ok(errors.some((e) => e.includes('minOpacity')));
  assert.ok(
    validateTransitionSegments([
      { ...validSegment(), panel: { risePx: 20, tiltDeg: 2, minOpacity: 0.85 } },
    ]).length === 0,
  );
});

test('注册表为空被拒绝', () => {
  assert.ok(validateTransitionSegments([]).length > 0);
});

test('cameraTargets 按进度线性映射相机与物体目标', () => {
  const camera = { zOffset: -1.4, coreSpin: Math.PI / 2, coreYOffset: -0.3 };
  assert.deepEqual(cameraTargets(0, camera), { z: 0, y: 0, spin: 0 });
  const full = cameraTargets(1, camera);
  assert.equal(full.z, -1.4);
  assert.equal(full.y, -0.3);
  assert.equal(full.spin, Math.PI / 2);
  const half = cameraTargets(0.5, camera);
  assert.ok(Math.abs(half.z - -0.7) < 1e-9);
  assert.ok(Math.abs(half.y - -0.15) < 1e-9);
});

test('cameraTargets 进度越界 clamp、非法输入归零', () => {
  const camera = { zOffset: -1.4, coreSpin: 1, coreYOffset: -0.3 };
  assert.deepEqual(cameraTargets(2, camera), cameraTargets(1, camera));
  assert.deepEqual(cameraTargets(-1, camera), cameraTargets(0, camera));
  assert.deepEqual(cameraTargets(Number.NaN, camera), { z: 0, y: 0, spin: 0 });
});

test('shellFactor 随进度插值壳层系数：起点 1、终点 shellScale', () => {
  const particles = { shellScale: 0.75 };
  assert.equal(shellFactor(0, particles), 1);
  assert.equal(shellFactor(1, particles), 0.75);
  assert.ok(Math.abs(shellFactor(0.5, particles) - 0.875) < 1e-9);
  // 扩散（>1）同样线性
  assert.ok(Math.abs(shellFactor(0.5, { shellScale: 1.4 }) - 1.2) < 1e-9);
});

test('shellFactor 进度越界 clamp、非法输入回 1（不变形）', () => {
  const particles = { shellScale: 0.75 };
  assert.equal(shellFactor(2, particles), shellFactor(1, particles));
  assert.equal(shellFactor(-1, particles), 1);
  assert.equal(shellFactor(Number.NaN, particles), 1);
  assert.equal(shellFactor(0.5, { shellScale: Number.NaN }), 1);
});
