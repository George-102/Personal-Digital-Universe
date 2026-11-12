import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, filterPublic } from '../content/validate.ts';
import {
  resolveAbout,
  hasCv,
  hasPortrait,
  PORTRAIT_PATH,
  CV_PATH,
} from '../lib/about.ts';

const baseProfile = {
  name: { zh: '测试', en: 'Test' },
  tagline: { zh: '身份', en: 'Identity' },
  status: { zh: '状态', en: 'Status' },
  links: [],
  public: true,
};

const validAbout = {
  bio: [
    { zh: '第一段', en: 'First paragraph' },
    { zh: '第二段', en: 'Second paragraph' },
  ],
  highlights: [{ zh: '要点一', en: 'Highlight one' }],
  portrait: '/portrait.webp',
  cvUrl: '/cv.pdf',
};

test('resolveAbout 按语言返回双语正文与要点', () => {
  const zh = resolveAbout(validAbout, 'zh');
  const en = resolveAbout(validAbout, 'en');
  assert.deepEqual(zh.bio, ['第一段', '第二段']);
  assert.deepEqual(en.bio, ['First paragraph', 'Second paragraph']);
  assert.deepEqual(zh.highlights, ['要点一']);
  assert.deepEqual(en.highlights, ['Highlight one']);
  assert.equal(zh.portrait, '/portrait.webp');
  assert.equal(zh.cvUrl, '/cv.pdf');
});

test('about 缺失或字段非法时安全降级为空值，不抛异常', () => {
  for (const value of [null, undefined, {}, { bio: 'not-an-array' }, { bio: [null] }]) {
    const resolved = resolveAbout(value, 'zh');
    assert.deepEqual(resolved.bio, []);
    assert.deepEqual(resolved.highlights, []);
    assert.equal(resolved.portrait, null);
    assert.equal(resolved.cvUrl, null);
  }
});

test('hasCv / hasPortrait 只接受站内安全路径', () => {
  assert.equal(hasCv(validAbout), true);
  assert.equal(hasPortrait(validAbout), true);
  assert.equal(hasCv({ cvUrl: 'https://example.com/cv.pdf' }), false);
  assert.equal(hasCv({ cvUrl: '../cv.pdf' }), false);
  assert.equal(hasCv({ cvUrl: '/cv.exe' }), false);
  assert.equal(hasCv({}), false);
  assert.equal(hasPortrait({ portrait: '/cv.pdf' }), false);
  assert.match('/assets/me.avif', PORTRAIT_PATH);
  assert.match('/docs/cv-2026.pdf', CV_PATH);
  assert.doesNotMatch('//evil.com/cv.pdf', CV_PATH);
});

test('合法 about 通过 profile 构建期校验', () => {
  assert.doesNotThrow(() => validateEntry('profile', { ...baseProfile, about: validAbout }));
  assert.doesNotThrow(() => validateEntry('profile', baseProfile));
});

test('缺可选字段（portrait / cvUrl 省略）仍通过校验', () => {
  const minimal = { bio: validAbout.bio, highlights: validAbout.highlights };
  assert.doesNotThrow(() => validateEntry('profile', { ...baseProfile, about: minimal }));
});

test('单语 bio / highlights 被构建期拒绝', () => {
  for (const broken of [
    { bio: [{ zh: '只有中文' }], highlights: validAbout.highlights },
    { bio: validAbout.bio, highlights: [{ en: 'Only English' }] },
    { bio: [], highlights: validAbout.highlights },
  ]) {
    assert.throws(
      () => validateEntry('profile', { ...baseProfile, about: broken }),
      /about\.(bio|highlights)/,
    );
  }
});

test('非法资源路径被构建期拒绝', () => {
  for (const field of ['portrait', 'cvUrl']) {
    for (const bad of ['https://example.com/x', 'x.pdf', '../x.pdf', '/x.exe', 42]) {
      assert.throws(
        () => validateEntry('profile', { ...baseProfile, about: { ...validAbout, [field]: bad } }),
        new RegExp(`about\\.${field}`),
        `${field}=${String(bad)} 应被拒绝`,
      );
    }
  }
});

test('public:false 的 profile 仍被统一出口过滤规则排除', () => {
  assert.deepEqual(filterPublic([{ ...baseProfile, public: false }]), []);
});
