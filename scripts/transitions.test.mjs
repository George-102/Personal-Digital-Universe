import { test, expect } from 'vitest';
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
  expect(validateTransitionSegments(transitionSegments)).toEqual([]);
  const segment = findTransitionSegment(transitionSegments, 'hero-about');
  expect(segment).toBeTruthy();
  expect(segment.range.targetSelector).toBe('#about');
  expect(findTransitionSegment(transitionSegments, 'nope')).toBe(undefined);
  expect(findTransitionSegment(transitionSegments, null)).toBe(undefined);
});

test('id 重复被拒绝', () => {
  const errors = validateTransitionSegments([validSegment(), validSegment()]);
  expect(errors.some((e) => e.includes('id') && e.includes('重复'))).toBeTruthy();
});

test('非法触发区间被拒绝', () => {
  const reversed = { ...validSegment(), range: { targetSelector: '#about', from: 0.8, to: 0.2 } };
  const outOfRange = { ...validSegment(), range: { targetSelector: '#about', from: -0.1, to: 1.2 } };
  const nonFinite = { ...validSegment(), range: { targetSelector: '#about', from: 0, to: Number.NaN } };
  const badSelector = { ...validSegment(), range: { targetSelector: 'about', from: 0, to: 1 } };
  for (const bad of [reversed, outOfRange, nonFinite, badSelector]) {
    const errors = validateTransitionSegments([bad]);
    expect(errors.length > 0).toBeTruthy();
  }
});

test('非法背景颜色被拒绝', () => {
  const errors = validateTransitionSegments([
    { ...validSegment(), background: { from: 'red', to: '#151d3a' } },
  ]);
  expect(errors.some((e) => e.includes('background.from') && e.includes('非法颜色'))).toBeTruthy();
  expect(validateTransitionSegments([
      { ...validSegment(), background: { from: '#0b1020', to: '#12345' } },
    ]).length > 0).toBeTruthy();
});

test('越界系数被拒绝（相机/粒子/面板位移）', () => {
  const bigZ = { ...validSegment(), camera: { zOffset: -9, coreSpin: 1, coreYOffset: 0 } };
  const bigSpin = { ...validSegment(), camera: { zOffset: -1, coreSpin: 99, coreYOffset: 0 } };
  const bigShell = { ...validSegment(), particles: { shellScale: 12 } };
  const bigRise = { ...validSegment(), panel: { risePx: 999, tiltDeg: 2, minOpacity: 0.9 } };
  const bigTilt = { ...validSegment(), panel: { risePx: 20, tiltDeg: 90, minOpacity: 0.9 } };
  for (const bad of [bigZ, bigSpin, bigShell, bigRise, bigTilt]) {
    expect(validateTransitionSegments([bad]).length > 0).toBeTruthy();
  }
  // 非有限值同样拒绝
  expect(validateTransitionSegments([
      { ...validSegment(), particles: { shellScale: Number.NaN } },
    ]).length > 0).toBeTruthy();
});

test('panel.minOpacity 低于 0.85 被拒（立即阅读红线）', () => {
  const errors = validateTransitionSegments([
    { ...validSegment(), panel: { risePx: 20, tiltDeg: 2, minOpacity: 0.5 } },
  ]);
  expect(errors.some((e) => e.includes('minOpacity'))).toBeTruthy();
  expect(validateTransitionSegments([
      { ...validSegment(), panel: { risePx: 20, tiltDeg: 2, minOpacity: 0.85 } },
    ]).length === 0).toBeTruthy();
});

test('注册表为空被拒绝', () => {
  expect(validateTransitionSegments([]).length > 0).toBeTruthy();
});

test('cameraTargets 按进度线性映射相机与物体目标', () => {
  const camera = { zOffset: -1.4, coreSpin: Math.PI / 2, coreYOffset: -0.3 };
  expect(cameraTargets(0, camera)).toEqual({ z: 0, y: 0, spin: 0 });
  const full = cameraTargets(1, camera);
  expect(full.z).toBe(-1.4);
  expect(full.y).toBe(-0.3);
  expect(full.spin).toBe(Math.PI / 2);
  const half = cameraTargets(0.5, camera);
  expect(Math.abs(half.z - -0.7) < 1e-9).toBeTruthy();
  expect(Math.abs(half.y - -0.15) < 1e-9).toBeTruthy();
});

test('cameraTargets 进度越界 clamp、非法输入归零', () => {
  const camera = { zOffset: -1.4, coreSpin: 1, coreYOffset: -0.3 };
  expect(cameraTargets(2, camera)).toEqual(cameraTargets(1, camera));
  expect(cameraTargets(-1, camera)).toEqual(cameraTargets(0, camera));
  expect(cameraTargets(Number.NaN, camera)).toEqual({ z: 0, y: 0, spin: 0 });
});

test('shellFactor 随进度插值壳层系数：起点 1、终点 shellScale', () => {
  const particles = { shellScale: 0.75 };
  expect(shellFactor(0, particles)).toBe(1);
  expect(shellFactor(1, particles)).toBe(0.75);
  expect(Math.abs(shellFactor(0.5, particles) - 0.875) < 1e-9).toBeTruthy();
  // 扩散（>1）同样线性
  expect(Math.abs(shellFactor(0.5, { shellScale: 1.4 }) - 1.2) < 1e-9).toBeTruthy();
});

test('shellFactor 进度越界 clamp、非法输入回 1（不变形）', () => {
  const particles = { shellScale: 0.75 };
  expect(shellFactor(2, particles)).toBe(shellFactor(1, particles));
  expect(shellFactor(-1, particles)).toBe(1);
  expect(shellFactor(Number.NaN, particles)).toBe(1);
  expect(shellFactor(0.5, { shellScale: Number.NaN })).toBe(1);
});
