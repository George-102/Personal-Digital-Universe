import { test, expect } from 'vitest';
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
  expect(zh.bio).toEqual(['第一段', '第二段']);
  expect(en.bio).toEqual(['First paragraph', 'Second paragraph']);
  expect(zh.highlights).toEqual(['要点一']);
  expect(en.highlights).toEqual(['Highlight one']);
  expect(zh.portrait).toBe('/portrait.webp');
  expect(zh.cvUrl).toBe('/cv.pdf');
});

test('about 缺失或字段非法时安全降级为空值，不抛异常', () => {
  for (const value of [null, undefined, {}, { bio: 'not-an-array' }, { bio: [null] }]) {
    const resolved = resolveAbout(value, 'zh');
    expect(resolved.bio).toEqual([]);
    expect(resolved.highlights).toEqual([]);
    expect(resolved.portrait).toBe(null);
    expect(resolved.cvUrl).toBe(null);
  }
});

test('hasCv / hasPortrait 只接受站内安全路径', () => {
  expect(hasCv(validAbout)).toBe(true);
  expect(hasPortrait(validAbout)).toBe(true);
  expect(hasCv({ cvUrl: 'https://example.com/cv.pdf' })).toBe(false);
  expect(hasCv({ cvUrl: '../cv.pdf' })).toBe(false);
  expect(hasCv({ cvUrl: '/cv.exe' })).toBe(false);
  expect(hasCv({})).toBe(false);
  expect(hasPortrait({ portrait: '/cv.pdf' })).toBe(false);
  expect('/assets/me.avif').toMatch(PORTRAIT_PATH);
  expect('/docs/cv-2026.pdf').toMatch(CV_PATH);
  expect('//evil.com/cv.pdf').not.toMatch(CV_PATH);
});

test('合法 about 通过 profile 构建期校验', () => {
  expect(() => validateEntry('profile', { ...baseProfile, about: validAbout })).not.toThrow();
  expect(() => validateEntry('profile', baseProfile)).not.toThrow();
});

test('缺可选字段（portrait / cvUrl 省略）仍通过校验', () => {
  const minimal = { bio: validAbout.bio, highlights: validAbout.highlights };
  expect(() => validateEntry('profile', { ...baseProfile, about: minimal })).not.toThrow();
});

test('单语 bio / highlights 被构建期拒绝', () => {
  for (const broken of [
    { bio: [{ zh: '只有中文' }], highlights: validAbout.highlights },
    { bio: validAbout.bio, highlights: [{ en: 'Only English' }] },
    { bio: [], highlights: validAbout.highlights },
  ]) {
    expect(() => validateEntry('profile', { ...baseProfile, about: broken })).toThrow();
  }
});

test('非法资源路径被构建期拒绝', () => {
  for (const field of ['portrait', 'cvUrl']) {
    for (const bad of ['https://example.com/x', 'x.pdf', '../x.pdf', '/x.exe', 42]) {
      expect(() => validateEntry('profile', { ...baseProfile, about: { ...validAbout, [field]: bad } }), `${field}=${String(bad)} 应被拒绝`).toThrow();
    }
  }
});

test('public:false 的 profile 仍被统一出口过滤规则排除', () => {
  expect(filterPublic([{ ...baseProfile, public: false }])).toEqual([]);
});
