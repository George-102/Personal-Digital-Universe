import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { profile } from '../content/profile.ts';
import { validateEntry } from '../content/validate.ts';

test('profile 数据通过校验且姓名非占位符', () => {
  expect(() => validateEntry('profile', profile)).not.toThrow();
  expect(!profile.name.zh.includes('待确认')).toBeTruthy();
  expect(!profile.name.en.includes('TBD')).toBeTruthy();
});

test('构建产物首页渲染 profile 配置的姓名（需先 npm run build）', () => {
  const file = 'out/index.html';
  expect(existsSync(file)).toBeTruthy();
  const html = readFileSync(file, 'utf8');
  expect(html.includes(profile.name.zh)).toBeTruthy();
});

test('英文构建产物渲染 profile 英文名（需先 npm run build）', () => {
  const file = 'out/en/index.html';
  expect(existsSync(file)).toBeTruthy();
  const html = readFileSync(file, 'utf8');
  expect(html.includes(profile.name.en)).toBeTruthy();
});