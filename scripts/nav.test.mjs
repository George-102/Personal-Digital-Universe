import { test } from 'node:test';
import assert from 'node:assert/strict';
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

test('默认注册表通过校验且只收录真实存在的模块（Home + About）', () => {
  assert.deepEqual(validateNavItems(navItems), []);
  assert.deepEqual(
    navItems.map((item) => item.id),
    ['home', 'about'],
  );
  for (const item of navItems) {
    assert.match(item.href, /^#[A-Za-z][A-Za-z0-9_-]*$/);
  }
});

test('按 order 升序排序且不修改原数组', () => {
  const original = [...navItems];
  const shuffled = [navItems[1], navItems[0]];
  assert.deepEqual(
    sortNavItems(shuffled).map((item) => item.id),
    ['home', 'about'],
  );
  assert.deepEqual(navItems, original);
});

test('未知 id 返回 undefined，null 安全', () => {
  assert.equal(findNavItem(navItems, 'contact'), undefined);
  assert.equal(findNavItem(navItems, null), undefined);
});

test('锚点解析：#about → about，根路径无锚点', () => {
  assert.equal(navTargetId({ href: '#about' }), 'about');
  assert.equal(navTargetId({ href: '/' }), null);
  assert.equal(navTargetId({ href: '#bad anchor' }), null);
});

test('按语言解析目标：中文根路径 /，英文 /en/ 前缀', () => {
  assert.equal(resolveNavHref({ href: '#about' }, 'zh'), '/#about');
  assert.equal(resolveNavHref({ href: '#about' }, 'en'), '/en/#about');
  assert.equal(resolveNavHref({ href: '/' }, 'zh'), '/');
  assert.equal(resolveNavHref({ href: '/' }, 'en'), '/en/');
});

test('每个 labelKey 在 zh / en messages 中都存在', () => {
  const zh = loadMessages('zh');
  const en = loadMessages('en');
  for (const item of navItems) {
    const [namespace, key] = item.labelKey.split('.');
    assert.ok(zh[namespace]?.[key], `zh 缺少 ${item.labelKey}`);
    assert.ok(en[namespace]?.[key], `en 缺少 ${item.labelKey}`);
  }
});

test('id 重复被拒绝', () => {
  const errors = validateNavItems([navItems[0], navItems[0]]);
  assert.ok(errors.some((e) => e.includes('id')), errors.join('\n'));
});

test('labelKey 缺失或格式非法被拒绝', () => {
  assert.ok(
    validateNavItems([{ ...navItems[0], labelKey: '' }]).some((e) => e.includes('labelKey')),
  );
  assert.ok(
    validateNavItems([{ ...navItems[0], labelKey: 'home' }]).some((e) => e.includes('labelKey')),
  );
});

test('href 非法值被拒绝', () => {
  for (const href of ['/about', 'about', '#', '#bad anchor', 'https://example.com']) {
    const errors = validateNavItems([{ ...navItems[0], href }]);
    assert.ok(errors.some((e) => e.includes('href')), `${href}: ${errors.join('\n')}`);
  }
});

test('order 非法或重复被拒绝', () => {
  for (const order of [-1, Number.NaN, 'first']) {
    const errors = validateNavItems([{ ...navItems[0], order }]);
    assert.ok(errors.some((e) => e.includes('order')), `${String(order)}: ${errors.join('\n')}`);
  }
  const duplicate = validateNavItems([
    { ...navItems[0], order: 10 },
    { ...navItems[1], order: 10 },
  ]);
  assert.ok(duplicate.some((e) => e.includes('order')), duplicate.join('\n'));
});

test('空注册表被拒绝', () => {
  assert.ok(validateNavItems([]).length > 0);
});
