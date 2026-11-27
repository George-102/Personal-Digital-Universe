import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  navItems,
  validateNavItems,
  findNavItem,
  sortNavItems,
  navTargetId,
  resolveNavHref,
} from '../lib/nav.ts';

const messagesDir = path.join(process.cwd(), 'messages');
const loadMessages = (locale) => JSON.parse(readFileSync(path.join(messagesDir, `${locale}.json`), 'utf8'));

test('默认注册表通过校验且只收录真实存在的模块（Home + About + Journey + Research + Projects + Products + Writing + Contact）', () => {
  expect(validateNavItems(navItems)).toEqual([]);
  expect(navItems.map((item) => item.id)).toEqual(['home', 'about', 'education', 'skills', 'journey', 'research', 'projects', 'products', 'writing', 'contact']);
  for (const item of navItems) {
    expect(item.href).toMatch(/^#[A-Za-z][A-Za-z0-9_-]*$/);
  }
});

test('按 order 升序排序且不修改原数组', () => {
  const original = [...navItems];
  const shuffled = [...navItems].reverse();
  expect(sortNavItems(shuffled).map((item) => item.id)).toEqual(['home', 'about', 'education', 'skills', 'journey', 'research', 'projects', 'products', 'writing', 'contact']);
  expect(navItems).toEqual(original);
});

test('未知 id 返回 undefined，null 安全；Products、Writing 与 Contact 已注册', () => {
  expect(findNavItem(navItems, 'ghost-story')).toBe(undefined);
  expect(findNavItem(navItems, null)).toBe(undefined);
  expect(findNavItem(navItems, 'products')?.href).toBe('#products');
  expect(findNavItem(navItems, 'writing')?.href).toBe('#writing');
  expect(findNavItem(navItems, 'contact')?.href).toBe('#contact');
});

test('锚点解析：#about → about，根路径无锚点', () => {
  expect(navTargetId({ href: '#about' })).toBe('about');
  expect(navTargetId({ href: '/' })).toBe(null);
  expect(navTargetId({ href: '#bad anchor' })).toBe(null);
});

test('按语言解析目标：中文根路径 /，英文 /en/ 前缀', () => {
  expect(resolveNavHref({ href: '#about' }, 'zh')).toBe('/#about');
  expect(resolveNavHref({ href: '#about' }, 'en')).toBe('/en/#about');
  expect(resolveNavHref({ href: '/' }, 'zh')).toBe('/');
  expect(resolveNavHref({ href: '/' }, 'en')).toBe('/en/');
});

test('每个 labelKey 在 zh / en messages 中都存在', () => {
  const zh = loadMessages('zh');
  const en = loadMessages('en');
  for (const item of navItems) {
    const [namespace, key] = item.labelKey.split('.');
    expect(zh[namespace]?.[key]).toBeTruthy();
    expect(en[namespace]?.[key]).toBeTruthy();
  }
});

test('id 重复被拒绝', () => {
  const errors = validateNavItems([navItems[0], navItems[0]]);
  expect(errors.some((e) => e.includes('id'))).toBeTruthy();
});

test('labelKey 缺失或格式非法被拒绝', () => {
  expect(validateNavItems([{ ...navItems[0], labelKey: '' }]).some((e) => e.includes('labelKey'))).toBeTruthy();
  expect(validateNavItems([{ ...navItems[0], labelKey: 'home' }]).some((e) => e.includes('labelKey'))).toBeTruthy();
});

test('href 非法值被拒绝', () => {
  for (const href of ['/about', 'about', '#', '#bad anchor', 'https://example.com']) {
    const errors = validateNavItems([{ ...navItems[0], href }]);
    expect(errors.some((e) => e.includes('href'))).toBeTruthy();
  }
});

test('order 非法或重复被拒绝', () => {
  for (const order of [-1, Number.NaN, 'first']) {
    const errors = validateNavItems([{ ...navItems[0], order }]);
    expect(errors.some((e) => e.includes('order'))).toBeTruthy();
  }
  const duplicate = validateNavItems([
    { ...navItems[0], order: 10 },
    { ...navItems[1], order: 10 },
  ]);
  expect(duplicate.some((e) => e.includes('order'))).toBeTruthy();
});

test('空注册表被拒绝', () => {
  expect(validateNavItems([]).length > 0).toBeTruthy();
});
