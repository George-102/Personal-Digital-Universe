import { test, expect } from 'vitest';
import {
  HOVER_FEEDBACKS,
  heroInteractiveObjects,
  validateInteractiveObjects,
  findInteractiveObject,
} from '../lib/interactive.ts';

test('默认 Hero 注册表通过校验且含可拖拽核心物体', () => {
  expect(validateInteractiveObjects(heroInteractiveObjects)).toEqual([]);
  const core = findInteractiveObject(heroInteractiveObjects, 'core');
  expect(core).toBeTruthy();
  expect(core.draggable).toBe(true);
  expect(core.clickTarget).toBe('#about');
  expect(core.hoverFeedback.includes('tooltip')).toBeTruthy();
});

test('未知 id 返回 undefined，null 安全', () => {
  expect(findInteractiveObject(heroInteractiveObjects, 'missing')).toBe(undefined);
  expect(findInteractiveObject(heroInteractiveObjects, null)).toBe(undefined);
});

test('clickTarget 非法值在构建期被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], clickTarget: '/about' }];
  const errors = validateInteractiveObjects(bad);
  expect(errors.some((e) => e.includes('clickTarget'))).toBeTruthy();
});

test('labelKey 缺失被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], labelKey: '' }];
  expect(validateInteractiveObjects(bad).some((e) => e.includes('labelKey'))).toBeTruthy();
});

test('id 重复被拒绝', () => {
  const errors = validateInteractiveObjects([heroInteractiveObjects[0], heroInteractiveObjects[0]]);
  expect(errors.some((e) => e.includes('id'))).toBeTruthy();
});

test('非法 hoverFeedback 被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], hoverFeedback: ['glow', 'explode'] }];
  expect(validateInteractiveObjects(bad).some((e) => e.includes('hoverFeedback'))).toBeTruthy();
});

test('draggable 必须为 boolean', () => {
  const bad = [{ ...heroInteractiveObjects[0], draggable: 'yes' }];
  expect(validateInteractiveObjects(bad).some((e) => e.includes('draggable'))).toBeTruthy();
});

test('允许的反馈类型是固定集合', () => {
  expect([...HOVER_FEEDBACKS]).toEqual(['glow', 'scale', 'spin', 'tooltip']);
  for (const obj of heroInteractiveObjects) {
    for (const feedback of obj.hoverFeedback) {
      expect(HOVER_FEEDBACKS.includes(feedback)).toBeTruthy();
    }
  }
});
