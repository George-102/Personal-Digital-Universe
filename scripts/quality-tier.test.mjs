import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getQualityTier } from '../lib/quality.ts';

test('移动端降低粒子数量', () => {
  const mobile = getQualityTier(390, 3);
  const desktop = getQualityTier(1440, 1);
  assert.ok(mobile.particles < desktop.particles, '移动端粒子应少于桌面');
});

test('移动端 pixelRatio 上限 1.5', () => {
  const tier = getQualityTier(390, 3);
  assert.ok(tier.pixelRatio <= 1.5, `移动端 pixelRatio ${tier.pixelRatio} 超过 1.5`);
});

test('桌面端 pixelRatio 不超过设备值且上限 2', () => {
  assert.equal(getQualityTier(1440, 1).pixelRatio, 1);
  assert.ok(getQualityTier(1440, 3).pixelRatio <= 2);
});

test('平板档介于移动与桌面之间', () => {
  const tablet = getQualityTier(820, 2);
  const mobile = getQualityTier(390, 3);
  const desktop = getQualityTier(1440, 1);
  assert.ok(tablet.particles >= mobile.particles);
  assert.ok(tablet.particles <= desktop.particles);
});