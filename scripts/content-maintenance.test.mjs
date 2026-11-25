import { test, expect } from 'vitest';
import {
  appendProject,
  assertHtmlContains,
  removeFirstEntryFields,
  replaceFirstUrl,
  replaceProfileName,
} from './verify-content-maintenance.mjs';

test('replaceProfileName 只替换姓名双语字段', () => {
  const source = `export const profile = {
  name: { zh: '苏子豪', en: 'Christopher Chang' },
  tagline: { zh: '保持', en: 'Keep' },
};`;
  const next = replaceProfileName(source, '张三', 'Zhang San');
  expect(next).toContain("name: { zh: '张三', en: 'Zhang San' }");
  expect(next).toContain("tagline: { zh: '保持', en: 'Keep' }");
});

test('appendProject 在数组末尾插入合法项目字面量', () => {
  const source = 'export const projects = [\n  { slug: "old" },\n];\n';
  const next = appendProject(source, {
    slug: 'acceptance-project',
    name: 'Acceptance Project',
    public: true,
  });
  expect(next).toContain('"slug": "acceptance-project"');
  expect(next.trimEnd().endsWith('];')).toBe(true);
});

test('removeFirstEntryFields 移除首条目的单行与多行可选字段', () => {
  const source = `export const products = [
  {
    slug: 'airspace-lab',
    detail: {
      zh: '旧详情',
      en: 'Old detail',
    },
    repo: 'George-102/airspace-lab',
    status: 'In Development',
  },
  {
    slug: 'second',
    detail: { zh: '保留', en: 'Keep' },
  },
];`;
  const next = removeFirstEntryFields(source, ['detail', 'repo']);
  expect(next).not.toContain('旧详情');
  expect(next).not.toContain("repo: 'George-102/airspace-lab'");
  expect(next).toContain("slug: 'second'");
  expect(next).toContain("zh: '保留'");
});

test('replaceFirstUrl 只替换首个 url 值', () => {
  const source = `[
  { slug: 'a', url: 'https://example.com/a' },
  { slug: 'b', url: 'https://example.com/b' },
]`;
  expect(replaceFirstUrl(source, 'javascript:alert(1)')).toContain("url: 'javascript:alert(1)'");
  expect(replaceFirstUrl(source, 'javascript:alert(1)')).toContain("url: 'https://example.com/b'");
});

test('assertHtmlContains 缺失标记时列出具体标记', () => {
  expect(() => assertHtmlContains('<h1>Hello</h1>', ['Hello'])).not.toThrow();
  expect(() => assertHtmlContains('<h1>Hello</h1>', ['Hello', 'Goodbye'])).toThrow(/Goodbye/);
});
