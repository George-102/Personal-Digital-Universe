import { test, expect } from 'vitest';
import { normalizeProgress, ScrollState } from '../lib/scroll.ts';

test('normalizeProgress 把区间映射到 0~1 且两端 clamp', () => {
  expect(normalizeProgress(0, 0, 100)).toBe(0);
  expect(normalizeProgress(50, 0, 100)).toBe(0.5);
  expect(normalizeProgress(100, 0, 100)).toBe(1);
  expect(normalizeProgress(-20, 0, 100)).toBe(0);
  expect(normalizeProgress(200, 0, 100)).toBe(1);
});

test('normalizeProgress 非法输入不产生 NaN', () => {
  expect(normalizeProgress(Number.NaN, 0, 100)).toBe(0);
  expect(normalizeProgress(50, Number.NaN, 100)).toBe(0);
  expect(normalizeProgress(50, 0, Number.NaN)).toBe(0);
  expect(Number.isFinite(normalizeProgress(50, 100, 100))).toBe(true);
  // 退化区间（end <= start）不除零：未到达为 0，到达为 1
  expect(normalizeProgress(99, 100, 100)).toBe(0);
  expect(normalizeProgress(100, 100, 100)).toBe(1);
});

test('ScrollState setRaw 收敛到 0~1 且非有限输入不污染状态', () => {
  const state = new ScrollState();
  state.setRaw(0.4);
  expect(state.getSnapshot().raw).toBe(0.4);
  state.setRaw(2);
  expect(state.getSnapshot().raw).toBe(1);
  state.setRaw(-1);
  expect(state.getSnapshot().raw).toBe(0);
  state.setRaw(0.6);
  state.setRaw(Number.NaN);
  expect(state.getSnapshot().raw).toBe(0.6);
});

test('ScrollState advance 平滑趋向 raw 且与帧率无关', () => {
  const oneStep = new ScrollState({ lambda: 6 });
  oneStep.setRaw(1);
  oneStep.advance(0.5);
  const split = new ScrollState({ lambda: 6 });
  split.setRaw(1);
  for (let i = 0; i < 5; i++) split.advance(0.1);
  expect(Math.abs(oneStep.getSnapshot().progress - split.getSnapshot().progress) < 1e-9).toBeTruthy();
  expect(oneStep.getSnapshot().progress > 0 && oneStep.getSnapshot().progress < 1).toBeTruthy();

  let converged = new ScrollState({ lambda: 6 });
  converged.setRaw(1);
  for (let i = 0; i < 300; i++) converged.advance(1 / 60);
  expect(Math.abs(converged.getSnapshot().progress - 1) < 1e-6).toBeTruthy();
});

test('快速滚动来回跳时状态唯一收敛，无 NaN 且始终在 0~1', () => {
  const state = new ScrollState({ lambda: 6 });
  const sequence = [1, 0, 1, 0, 0.5, 1, 0.2];
  for (let round = 0; round < 20; round++) {
    for (const raw of sequence) {
      state.setRaw(raw);
      state.advance(1 / 60);
      const { progress, raw: r } = state.getSnapshot();
      expect(Number.isFinite(progress)).toBe(true);
      expect(Number.isFinite(r)).toBe(true);
      expect(progress >= 0 && progress <= 1).toBeTruthy();
    }
  }
  state.setRaw(0.3);
  for (let i = 0; i < 300; i++) state.advance(1 / 60);
  expect(Math.abs(state.getSnapshot().progress - 0.3) < 1e-6).toBeTruthy();
});

test('reduced-motion 简化转场：进度瞬时跟随滚动，不做平滑', () => {
  const state = new ScrollState({ reducedMotion: true });
  state.setRaw(0.7);
  expect(state.getSnapshot().progress).toBe(0.7);
  state.setRaw(0.2);
  expect(state.getSnapshot().progress).toBe(0.2);
  // 中途切换到 reduced-motion 后立刻贴合目标
  const mid = new ScrollState({ lambda: 6 });
  mid.setRaw(1);
  mid.advance(1 / 60);
  expect(mid.getSnapshot().progress < 1).toBeTruthy();
  mid.setReducedMotion(true);
  expect(mid.getSnapshot().progress).toBe(mid.getSnapshot().raw);
});

test('subscribe / unsubscribe 通知与快照一致', () => {
  const state = new ScrollState({ reducedMotion: true });
  const seen = [];
  const off = state.subscribe((snapshot) => seen.push(snapshot.progress));
  state.setRaw(0.5);
  state.setRaw(0.5); // 无变化不重复通知
  state.setRaw(0.8);
  off();
  state.setRaw(0.1);
  expect(seen).toEqual([0.5, 0.8]);
});

test('destroy 后停止更新与通知，快照冻结', () => {
  const state = new ScrollState({ reducedMotion: true });
  let calls = 0;
  state.subscribe(() => {
    calls += 1;
  });
  state.setRaw(0.5);
  state.destroy();
  state.setRaw(0.9);
  state.advance(1 / 60);
  expect(state.getSnapshot().raw).toBe(0.5);
  expect(calls).toBe(1);
  // destroy 幂等
  state.destroy();
});
