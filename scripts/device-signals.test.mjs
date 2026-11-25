import { test, expect } from 'vitest';
import { readDeviceSignals } from '../lib/quality.ts';

test('无来源时读取当前 navigator；显式 null 返回空信号', () => {
  expect(readDeviceSignals(null)).toEqual({});
  const fromEnvironment = readDeviceSignals();
  expect(Object.keys(fromEnvironment).every(
      (key) => key === 'hardwareConcurrency' || key === 'deviceMemory',
    )).toBeTruthy();
});

test('读取有效硬件信号', () => {
  expect(readDeviceSignals({ hardwareConcurrency: 8, deviceMemory: 16 })).toEqual({
    hardwareConcurrency: 8,
    deviceMemory: 16,
  });
});

test('低性能信号原样传递，供 getQualityTier 降档', () => {
  expect(readDeviceSignals({ hardwareConcurrency: 2, deviceMemory: 2 })).toEqual({
    hardwareConcurrency: 2,
    deviceMemory: 2,
  });
});

test('非数字、NaN 与 0 之外的异常值被忽略', () => {
  expect(readDeviceSignals({ hardwareConcurrency: '2', deviceMemory: Number.NaN })).toEqual({});
  expect(readDeviceSignals({ hardwareConcurrency: 4 })).toEqual({ hardwareConcurrency: 4 });
  expect(readDeviceSignals({ deviceMemory: 0.5 })).toEqual({ deviceMemory: 0.5 });
});
