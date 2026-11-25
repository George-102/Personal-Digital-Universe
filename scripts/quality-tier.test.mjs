import { test, expect } from 'vitest';
import { getDeviceClass, getQualityTier } from '../lib/quality.ts';

test('移动端降低粒子数量', () => {
  const mobile = getQualityTier(390, 3);
  const desktop = getQualityTier(1440, 1);
  expect(mobile.particles < desktop.particles).toBeTruthy();
});

test('移动端 pixelRatio 上限 1.5', () => {
  const tier = getQualityTier(390, 3);
  expect(tier.pixelRatio <= 1.5).toBeTruthy();
});

test('桌面端 pixelRatio 不超过设备值且上限 1.5（US-010k 绿灯基线）', () => {
  expect(getQualityTier(1440, 1).pixelRatio).toBe(1);
  expect(getQualityTier(1440, 3).pixelRatio).toBe(1.5);
});

test('四档设备边界分类', () => {
  expect(getDeviceClass(375)).toBe('mobile');
  expect(getDeviceClass(639)).toBe('mobile');
  expect(getDeviceClass(640)).toBe('tablet');
  expect(getDeviceClass(1023)).toBe('tablet');
  expect(getDeviceClass(1024)).toBe('laptop');
  expect(getDeviceClass(1279)).toBe('laptop');
  expect(getDeviceClass(1280)).toBe('desktop');
  expect(getDeviceClass(1920)).toBe('desktop');
});

test('平板画质介于移动与桌面之间且低于笔记本', () => {
  const mobile = getQualityTier(390, 3);
  const tablet = getQualityTier(820, 2);
  const laptop = getQualityTier(1100, 2);
  const desktop = getQualityTier(1440, 1);
  expect(tablet.particles).toBe(500);
  expect(tablet.particles > mobile.particles).toBeTruthy();
  expect(tablet.particles < laptop.particles).toBeTruthy();
  expect(tablet.particles < desktop.particles).toBeTruthy();
  expect(tablet.pixelRatio <= 1.5).toBeTruthy();
});

test('桌面与笔记本保持 700 粒子不提高首屏成本', () => {
  expect(getQualityTier(1440, 1).particles).toBe(700);
  expect(getQualityTier(1100, 1).particles).toBe(700);
  expect(getQualityTier(1440, 1).deviceClass).toBe('desktop');
  expect(getQualityTier(1100, 1).deviceClass).toBe('laptop');
});

test('低并发设备自动降档', () => {
  const base = getQualityTier(1440, 2);
  const low = getQualityTier(1440, 2, { hardwareConcurrency: 2 });
  expect(low.particles < base.particles).toBeTruthy();
  expect(low.pixelRatio <= 1).toBeTruthy();
  expect(low.reduced).toBe(true);
});

test('低内存设备自动降档', () => {
  const base = getQualityTier(820, 2);
  const low = getQualityTier(820, 2, { deviceMemory: 2 });
  expect(low.particles < base.particles).toBeTruthy();
  expect(low.deviceClass, '降档不改变设备分类').toBe('tablet');
  expect(low.reduced).toBe(true);
});

test('信号缺失或充足时按视口档位，不误降档', () => {
  const noSignals = getQualityTier(1440, 2);
  const emptySignals = getQualityTier(1440, 2, { hardwareConcurrency: 8, deviceMemory: 16 });
  expect(noSignals).toEqual(emptySignals);
  expect(noSignals.reduced).toBe(false);
  expect(noSignals.particles).toBe(700);
});

test('低性能降档不把移动端粒子降到 0', () => {
  const low = getQualityTier(390, 3, { hardwareConcurrency: 1, deviceMemory: 0.5 });
  expect(low.particles >= 150).toBeTruthy();
  expect(low.particles < 350).toBeTruthy();
});
