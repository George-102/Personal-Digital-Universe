import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOVER_FEEDBACKS,
  heroInteractiveObjects,
  validateInteractiveObjects,
  findInteractiveObject,
} from '../lib/interactive.ts';

test('默认 Hero 注册表通过校验且含可拖拽核心物体', () => {
  assert.deepEqual(validateInteractiveObjects(heroInteractiveObjects), []);
  const core = findInteractiveObject(heroInteractiveObjects, 'core');
  assert.ok(core);
  assert.equal(core.draggable, true);
  assert.equal(core.clickTarget, '#about');
  assert.ok(core.hoverFeedback.includes('tooltip'));
});

test('未知 id 返回 undefined，null 安全', () => {
  assert.equal(findInteractiveObject(heroInteractiveObjects, 'missing'), undefined);
  assert.equal(findInteractiveObject(heroInteractiveObjects, null), undefined);
});

test('clickTarget 非法值在构建期被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], clickTarget: '/about' }];
  const errors = validateInteractiveObjects(bad);
  assert.ok(errors.some((e) => e.includes('clickTarget')), errors.join('\n'));
});

test('labelKey 缺失被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], labelKey: '' }];
  assert.ok(validateInteractiveObjects(bad).some((e) => e.includes('labelKey')));
});

test('id 重复被拒绝', () => {
  const errors = validateInteractiveObjects([heroInteractiveObjects[0], heroInteractiveObjects[0]]);
  assert.ok(errors.some((e) => e.includes('id')), errors.join('\n'));
});

test('非法 hoverFeedback 被拒绝', () => {
  const bad = [{ ...heroInteractiveObjects[0], hoverFeedback: ['glow', 'explode'] }];
  assert.ok(validateInteractiveObjects(bad).some((e) => e.includes('hoverFeedback')));
});

test('draggable 必须为 boolean', () => {
  const bad = [{ ...heroInteractiveObjects[0], draggable: 'yes' }];
  assert.ok(validateInteractiveObjects(bad).some((e) => e.includes('draggable')));
});

test('允许的反馈类型是固定集合', () => {
  assert.deepEqual([...HOVER_FEEDBACKS], ['glow', 'scale', 'spin', 'tooltip']);
  for (const obj of heroInteractiveObjects) {
    for (const feedback of obj.hoverFeedback) {
      assert.ok(HOVER_FEEDBACKS.includes(feedback));
    }
  }
});
