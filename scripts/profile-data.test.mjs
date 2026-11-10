import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { profile } from '../content/profile.ts';
import { validateEntry } from '../content/validate.ts';

test('profile 数据通过校验且姓名非占位符', () => {
  assert.doesNotThrow(() => validateEntry('profile', profile));
  assert.ok(!profile.name.zh.includes('待确认'), '中文姓名仍是占位符');
  assert.ok(!profile.name.en.includes('TBD'), '英文姓名仍是占位符');
});

test('构建产物首页渲染 profile 配置的姓名（需先 npm run build）', () => {
  const file = 'out/index.html';
  assert.ok(existsSync(file), '缺少 out/index.html，请先 npm run build');
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes(profile.name.zh), `首页未渲染 profile 姓名 ${profile.name.zh}`);
});

test('英文构建产物渲染 profile 英文名（需先 npm run build）', () => {
  const file = 'out/en/index.html';
  assert.ok(existsSync(file), '缺少 out/en/index.html，请先 npm run build');
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes(profile.name.en), `英文首页未渲染 profile 姓名 ${profile.name.en}`);
});