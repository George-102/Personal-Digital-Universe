import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDeviceClass, getQualityTier } from '../lib/quality.ts';

test('移动端降低粒子数量', () => {
  const mobile = getQualityTier(390, 3);
  const desktop = getQualityTier(1440, 1);
  assert.ok(mobile.particles < desktop.particles, '移动端粒子应少于桌面');
});

test('移动端 pixelRatio 上限 1.5', () => {
  const tier = getQualityTier(390, 3);
  assert.ok(tier.pixelRatio <= 1.5, `移动端 pixelRatio ${tier.pixelRatio} 超过 1.5`);
});

test('桌面端 pixelRatio 不超过设备值且上限 1.5（US-010k 绿灯基线）', () => {
  assert.equal(getQualityTier(1440, 1).pixelRatio, 1);
  assert.equal(getQualityTier(1440, 3).pixelRatio, 1.5);
});

test('四档设备边界分类', () => {
  assert.equal(getDeviceClass(375), 'mobile');
  assert.equal(getDeviceClass(639), 'mobile');
  assert.equal(getDeviceClass(640), 'tablet');
  assert.equal(getDeviceClass(1023), 'tablet');
  assert.equal(getDeviceClass(1024), 'laptop');
  assert.equal(getDeviceClass(1279), 'laptop');
  assert.equal(getDeviceClass(1280), 'desktop');
  assert.equal(getDeviceClass(1920), 'desktop');
});

test('平板画质介于移动与桌面之间且低于笔记本', () => {
  const mobile = getQualityTier(390, 3);
  const tablet = getQualityTier(820, 2);
  const laptop = getQualityTier(1100, 2);
  const desktop = getQualityTier(1440, 1);
  assert.equal(tablet.particles, 500);
  assert.ok(tablet.particles > mobile.particles);
  assert.ok(tablet.particles < laptop.particles);
  assert.ok(tablet.particles < desktop.particles);
  assert.ok(tablet.pixelRatio <= 1.5);
});

test('桌面与笔记本保持 700 粒子不提高首屏成本', () => {
  assert.equal(getQualityTier(1440, 1).particles, 700);
  assert.equal(getQualityTier(1100, 1).particles, 700);
  assert.equal(getQualityTier(1440, 1).deviceClass, 'desktop');
  assert.equal(getQualityTier(1100, 1).deviceClass, 'laptop');
});

test('低并发设备自动降档', () => {
  const base = getQualityTier(1440, 2);
  const low = getQualityTier(1440, 2, { hardwareConcurrency: 2 });
  assert.ok(low.particles < base.particles, '低并发应降粒子');
  assert.ok(low.pixelRatio <= 1, '低并发 pixelRatio 上限 1');
  assert.equal(low.reduced, true);
});

test('低内存设备自动降档', () => {
  const base = getQualityTier(820, 2);
  const low = getQualityTier(820, 2, { deviceMemory: 2 });
  assert.ok(low.particles < base.particles, '低内存应降粒子');
  assert.equal(low.deviceClass, 'tablet', '降档不改变设备分类');
  assert.equal(low.reduced, true);
});

test('信号缺失或充足时按视口档位，不误降档', () => {
  const noSignals = getQualityTier(1440, 2);
  const emptySignals = getQualityTier(1440, 2, { hardwareConcurrency: 8, deviceMemory: 16 });
  assert.deepEqual(noSignals, emptySignals);
  assert.equal(noSignals.reduced, false);
  assert.equal(noSignals.particles, 700);
});

test('低性能降档不把移动端粒子降到 0', () => {
  const low = getQualityTier(390, 3, { hardwareConcurrency: 1, deviceMemory: 0.5 });
  assert.ok(low.particles >= 150, `移动端低性能粒子 ${low.particles} 过低`);
  assert.ok(low.particles < 350);
});
