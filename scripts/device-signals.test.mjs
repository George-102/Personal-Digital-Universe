import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDeviceSignals } from '../lib/quality.ts';

test('无来源时读取当前 navigator；显式 null 返回空信号', () => {
  assert.deepEqual(readDeviceSignals(null), {});
  const fromEnvironment = readDeviceSignals();
  assert.ok(
    Object.keys(fromEnvironment).every(
      (key) => key === 'hardwareConcurrency' || key === 'deviceMemory',
    ),
    '只允许白名单字段',
  );
});

test('读取有效硬件信号', () => {
  assert.deepEqual(readDeviceSignals({ hardwareConcurrency: 8, deviceMemory: 16 }), {
    hardwareConcurrency: 8,
    deviceMemory: 16,
  });
});

test('低性能信号原样传递，供 getQualityTier 降档', () => {
  assert.deepEqual(readDeviceSignals({ hardwareConcurrency: 2, deviceMemory: 2 }), {
    hardwareConcurrency: 2,
    deviceMemory: 2,
  });
});

test('非数字、NaN 与 0 之外的异常值被忽略', () => {
  assert.deepEqual(
    readDeviceSignals({ hardwareConcurrency: '2', deviceMemory: Number.NaN }),
    {},
  );
  assert.deepEqual(readDeviceSignals({ hardwareConcurrency: 4 }), { hardwareConcurrency: 4 });
  assert.deepEqual(readDeviceSignals({ deviceMemory: 0.5 }), { deviceMemory: 0.5 });
});
