import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual([...CONTACT_KINDS], ['github', 'blog', 'social', 'other']);
});

test('isValidEmail 只接受常规邮箱格式', () => {
  assert.equal(isValidEmail('zhangchaowen@stu.scu.edu.cn'), true);
  assert.equal(isValidEmail('a@b.co'), true);
  for (const bad of ['', 'no-at', 'a@', '@b.com', 'a b@c.com', 'a@b', null, 42, 'a@b.com<script>']) {
    assert.equal(isValidEmail(bad), false, `${String(bad)} 应被拒绝`);
  }
});

test('isValidContactUrl 只允许 https 外链与站内安全路径', () => {
  assert.equal(isValidContactUrl('https://github.com/example'), true);
  assert.equal(isValidContactUrl('https://example.com/blog?a=1#x'), true);
  assert.equal(isValidContactUrl('/blog'), true);
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
    assert.equal(isValidContactUrl(bad), false, `${String(bad)} 应被拒绝`);
  }
});

test('validateContactLinks 拒绝重复 id / 单语 label / 非法 kind / 非法 URL / 非布尔 public', () => {
  assert.deepEqual(validateContactLinks([link()]), []);
  assert.deepEqual(validateContactLinks([]), []);
  assert.ok(validateContactLinks([link(), link()]).some((e) => e.includes('id')));
  assert.ok(validateContactLinks([link({ label: { zh: '只中文' } })]).some((e) => e.includes('label')));
  assert.ok(validateContactLinks([link({ kind: 'unknown' })]).some((e) => e.includes('kind')));
  assert.ok(validateContactLinks([link({ url: 'javascript:alert(1)' })]).some((e) => e.includes('url')));
  assert.ok(validateContactLinks([link({ public: 'yes' })]).some((e) => e.includes('public')));
  assert.ok(validateContactLinks('not-an-array').length > 0);
});

test('validateContact 校验 email / links / collaborations，且缺字段可容错', () => {
  assert.deepEqual(validateContact({}), []);
  assert.deepEqual(
    validateContact({ email: 'a@b.com', links: [link()], collaborations: [{ zh: '研究', en: 'Research' }] }),
    [],
  );
  assert.ok(validateContact({ email: 'bad-email' }).some((e) => e.includes('email')));
  assert.ok(validateContact({ links: [link({ id: '' })] }).some((e) => e.includes('links')));
  assert.ok(validateContact({ collaborations: [] }).some((e) => e.includes('collaborations')));
  assert.ok(validateContact({ collaborations: [{ zh: '只中文' }] }).some((e) => e.includes('collaborations')));
  assert.ok(validateContact(null).length > 0);
});

test('publicContactLinks 过滤非公开条目且不修改原数组', () => {
  const links = [link(), link({ id: 'hidden', public: false })];
  assert.deepEqual(publicContactLinks(links).map((item) => item.id), ['github']);
  assert.equal(links.length, 2);
});

test('mailtoHref 生成 mailto 链接', () => {
  assert.equal(mailtoHref('a@b.com'), 'mailto:a@b.com');
});

test('默认 profile.contact 通过校验：真实 email + 空 links + 五项双语合作方向', () => {
  assert.ok(profile.contact, 'profile.contact 缺失');
  assert.deepEqual(validateContact(profile.contact), []);
  assert.equal(isValidEmail(profile.contact.email), true);
  assert.equal(publicContactLinks(profile.contact.links).length, 0);
  assert.equal(profile.contact.collaborations.length, 5);
  assert.equal(contact, profile.contact);
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
  assert.deepEqual(flatten(zh.Contact).sort(), flatten(en.Contact).sort());
  assert.ok(zh.Nav.contact && en.Nav.contact, 'Nav.contact 缺失');
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
    assert.ok(zh.Contact[key], `zh.Contact 缺少 ${key}`);
    assert.ok(en.Contact[key], `en.Contact 缺少 ${key}`);
  }
  for (const item of profile.contact.collaborations) {
    assert.ok(item.zh && item.en, '合作方向必须是双语');
  }
});
