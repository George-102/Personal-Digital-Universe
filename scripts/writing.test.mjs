import { test, expect } from 'vitest';
import {
  WRITING_STATUS,
  isValidWritingSlug,
  isValidWritingUrl,
  validateWriting,
  validateWritingList,
  publicWriting,
  findWritingBySlug,
  writingStatusKey,
  writingHref,
  writingDetailHref,
} from '../lib/writing.ts';

const entry = (overrides = {}) => ({
  slug: 'fayuan',
  title: { zh: '法渊', en: 'Fayuan' },
  type: 'novel',
  status: 'In Progress',
  description: { zh: '一部玄幻小说。', en: 'A fantasy novel.' },
  featured: true,
  public: true,
  ...overrides,
});

test('WRITING_STATUS 严格限定 PRD 三态', () => {
  expect([...WRITING_STATUS].sort()).toEqual(['Completed', 'In Progress', 'Writing']);
});

test('isValidWritingSlug 只允许小写 kebab-case', () => {
  expect(isValidWritingSlug('fayuan')).toBe(true);
  expect(isValidWritingSlug('star-tales-2')).toBe(true);
  expect(isValidWritingSlug('Bad Slug')).toBe(false);
  expect(isValidWritingSlug('UPPER')).toBe(false);
  expect(isValidWritingSlug('-lead')).toBe(false);
  expect(isValidWritingSlug('trail-')).toBe(false);
  expect(isValidWritingSlug('')).toBe(false);
});

test('isValidWritingUrl 只接受 https 或站内路径，拒绝 javascript/协议相对', () => {
  expect(isValidWritingUrl('https://example.com/read')).toBe(true);
  expect(isValidWritingUrl('/writing/fayuan')).toBe(true);
  expect(isValidWritingUrl('http://example.com')).toBe(false);
  expect(isValidWritingUrl('javascript:alert(1)')).toBe(false);
  expect(isValidWritingUrl('//example.com')).toBe(false);
});

test('validateWriting 通过合法条目（含可选详情字段与链接）', () => {
  expect(validateWriting(
      entry({
        writtenAt: '2023—至今',
        worldview: { zh: '世界观。', en: 'World.' },
        background: [{ zh: '背景。', en: 'Background.' }],
        characters: [{ zh: '人物。', en: 'Character.' }],
        concept: { zh: '理念。', en: 'Concept.' },
        detail: [{ zh: '补充。', en: 'Extra.' }],
        cover: '/images/fayuan.png',
        readingUrl: 'https://example.com/read',
        externalUrl: 'https://example.com/info',
      }),
    )).toEqual([]);
});

test('validateWriting 拒绝非法状态、类型、单语详情与非法链接', () => {
  expect(validateWriting(entry({ status: 'Done' })).some((e) => e.includes('status'))).toBeTruthy();
  expect(validateWriting(entry({ type: 'poem' })).some((e) => e.includes('type'))).toBeTruthy();
  expect(validateWriting(entry({ description: { zh: '只有中文' } })).some((e) => e.includes('description'))).toBeTruthy();
  expect(validateWriting(entry({ worldview: { zh: '单语' } })).some((e) => e.includes('worldview'))).toBeTruthy();
  expect(validateWriting(entry({ cover: 'javascript:alert(1)' })).some((e) => e.includes('cover'))).toBeTruthy();
  expect(validateWriting(entry({ readingUrl: 'javascript:alert(1)' })).some((e) => e.includes('readingUrl'))).toBeTruthy();
  expect(validateWriting(entry({ featured: 'yes' })).some((e) => e.includes('featured'))).toBeTruthy();
  expect(validateWriting(entry({ public: 1 })).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateWritingList 空列表合法，拒绝重复 slug、全隐藏与 featured 非 public', () => {
  expect(validateWritingList([])).toEqual([]);
  expect(validateWritingList([entry()])).toEqual([]);
  expect(validateWritingList([entry(), entry({ slug: 'fayuan', title: { zh: '另一部', en: 'Other' } })])
      .some((e) => e.includes('slug 重复'))).toBeTruthy();
  expect(validateWritingList([entry({ public: false })]).some((e) => e.includes('至少需要一条 public'))).toBeTruthy();
  expect(validateWritingList([entry({ featured: true, public: false }), entry({ slug: 'b', featured: false })])
      .some((e) => e.includes('featured 条目必须 public'))).toBeTruthy();
});

test('publicWriting / findWritingBySlug 过滤与查找', () => {
  const publicItem = entry();
  const hidden = entry({ slug: 'hidden', public: false, featured: false });
  expect(publicWriting([publicItem, hidden])).toEqual([publicItem]);
  expect(findWritingBySlug([publicItem, hidden], 'fayuan')).toBe(publicItem);
  expect(findWritingBySlug([publicItem], 'nope')).toBe(undefined);
  expect(findWritingBySlug([publicItem], null)).toBe(undefined);
});

test('writingStatusKey 映射 PRD 三态到 data 属性安全值', () => {
  expect(writingStatusKey('Writing')).toBe('writing');
  expect(writingStatusKey('In Progress')).toBe('in-progress');
  expect(writingStatusKey('Completed')).toBe('completed');
});

test('writingHref / writingDetailHref 双语路径', () => {
  expect(writingHref('zh')).toBe('/writing/');
  expect(writingHref('en')).toBe('/en/writing/');
  expect(writingDetailHref('fayuan', 'zh')).toBe('/writing/fayuan/');
  expect(writingDetailHref('fayuan', 'en')).toBe('/en/writing/fayuan/');
});
