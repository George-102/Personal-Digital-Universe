import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CONTACT_KINDS,
  isValidEmail,
  isValidContactUrl,
  validateContactLinks,
  validateContact,
  publicContactLinks,
  mailtoHref,
} from '../lib/contact.ts';
import { profile } from '../content/profile.ts';
import { contact } from '../content/index.ts';

const messagesDir = path.join(process.cwd(), 'messages');
const loadMessages = (locale) =>
  JSON.parse(readFileSync(path.join(messagesDir, `${locale}.json`), 'utf8'));

const link = (overrides = {}) => ({
  id: 'github',
  kind: 'github',
  label: { zh: 'GitHub', en: 'GitHub' },
  url: 'https://github.com/example',
  public: true,
  ...overrides,
});

test('CONTACT_KINDS 覆盖 PRD 详述 2 的联系方式类别', () => {
  expect([...CONTACT_KINDS]).toEqual(['github', 'blog', 'social', 'other']);
});

test('isValidEmail 只接受常规邮箱格式', () => {
  expect(isValidEmail('zhangchaowen@stu.scu.edu.cn')).toBe(true);
  expect(isValidEmail('a@b.co')).toBe(true);
  for (const bad of ['', 'no-at', 'a@', '@b.com', 'a b@c.com', 'a@b', null, 42, 'a@b.com<script>']) {
    expect(isValidEmail(bad), `${String(bad)} 应被拒绝`).toBe(false);
  }
});

test('isValidContactUrl 只允许 https 外链与站内安全路径', () => {
  expect(isValidContactUrl('https://github.com/example')).toBe(true);
  expect(isValidContactUrl('https://example.com/blog?a=1#x')).toBe(true);
  expect(isValidContactUrl('/blog')).toBe(true);
  for (const bad of [
    'javascript:alert(1)',
    'data:text/html,x',
    'http://example.com',
    '//example.com',
    'example.com',
    'https://user:pass@example.com',
    'https:///nohost',
    '/../private',
    '/\\evil',
    '',
    null,
    42,
  ]) {
    expect(isValidContactUrl(bad), `${String(bad)} 应被拒绝`).toBe(false);
  }
});

test('validateContactLinks 拒绝重复 id / 单语 label / 非法 kind / 非法 URL / 非布尔 public', () => {
  expect(validateContactLinks([link()])).toEqual([]);
  expect(validateContactLinks([])).toEqual([]);
  expect(validateContactLinks([link(), link()]).some((e) => e.includes('id'))).toBeTruthy();
  expect(validateContactLinks([link({ label: { zh: '只中文' } })]).some((e) => e.includes('label'))).toBeTruthy();
  expect(validateContactLinks([link({ kind: 'unknown' })]).some((e) => e.includes('kind'))).toBeTruthy();
  expect(validateContactLinks([link({ url: 'javascript:alert(1)' })]).some((e) => e.includes('url'))).toBeTruthy();
  expect(validateContactLinks([link({ public: 'yes' })]).some((e) => e.includes('public'))).toBeTruthy();
  expect(validateContactLinks('not-an-array').length > 0).toBeTruthy();
});

test('validateContact 校验 email / links / collaborations，且缺字段可容错', () => {
  expect(validateContact({})).toEqual([]);
  expect(validateContact({ email: 'a@b.com', links: [link()], collaborations: [{ zh: '研究', en: 'Research' }] })).toEqual([]);
  expect(validateContact({ email: 'bad-email' }).some((e) => e.includes('email'))).toBeTruthy();
  expect(validateContact({ links: [link({ id: '' })] }).some((e) => e.includes('links'))).toBeTruthy();
  expect(validateContact({ collaborations: [] }).some((e) => e.includes('collaborations'))).toBeTruthy();
  expect(validateContact({ collaborations: [{ zh: '只中文' }] }).some((e) => e.includes('collaborations'))).toBeTruthy();
  expect(validateContact(null).length > 0).toBeTruthy();
});

test('publicContactLinks 过滤非公开条目且不修改原数组', () => {
  const links = [link(), link({ id: 'hidden', public: false })];
  expect(publicContactLinks(links).map((item) => item.id)).toEqual(['github']);
  expect(links.length).toBe(2);
});

test('mailtoHref 生成 mailto 链接', () => {
  expect(mailtoHref('a@b.com')).toBe('mailto:a@b.com');
});

test('默认 profile.contact 通过校验：真实 email + 空 links + 五项双语合作方向', () => {
  expect(profile.contact).toBeTruthy();
  expect(validateContact(profile.contact)).toEqual([]);
  expect(isValidEmail(profile.contact.email)).toBe(true);
  expect(publicContactLinks(profile.contact.links).length).toBe(0);
  expect(profile.contact.collaborations.length).toBe(5);
  expect(contact).toBe(profile.contact);
});

test('Contact / Nav.contact 文案键在 zh / en 中一致且非空', () => {
  const zh = loadMessages('zh');
  const en = loadMessages('en');
  const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([key, value]) =>
      value && typeof value === 'object'
        ? flatten(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    );
  expect(flatten(zh.Contact).sort()).toEqual(flatten(en.Contact).sort());
  expect(zh.Nav.contact && en.Nav.contact).toBeTruthy();
  for (const key of [
    'eyebrow',
    'title',
    'intro',
    'emailLabel',
    'mailtoLabel',
    'copy',
    'copied',
    'copyFailed',
    'copyUnavailable',
    'linksLabel',
    'collaborationsLabel',
    'footerEmailLabel',
    'routeTitle',
    'routeDescription',
  ]) {
    expect(zh.Contact[key]).toBeTruthy();
    expect(en.Contact[key]).toBeTruthy();
  }
  for (const item of profile.contact.collaborations) {
    expect(item.zh && item.en).toBeTruthy();
  }
});
