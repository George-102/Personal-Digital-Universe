import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual([...WRITING_STATUS].sort(), ['Completed', 'In Progress', 'Writing']);
});

test('isValidWritingSlug 只允许小写 kebab-case', () => {
  assert.equal(isValidWritingSlug('fayuan'), true);
  assert.equal(isValidWritingSlug('star-tales-2'), true);
  assert.equal(isValidWritingSlug('Bad Slug'), false);
  assert.equal(isValidWritingSlug('UPPER'), false);
  assert.equal(isValidWritingSlug('-lead'), false);
  assert.equal(isValidWritingSlug('trail-'), false);
  assert.equal(isValidWritingSlug(''), false);
});

test('isValidWritingUrl 只接受 https 或站内路径，拒绝 javascript/协议相对', () => {
  assert.equal(isValidWritingUrl('https://example.com/read'), true);
  assert.equal(isValidWritingUrl('/writing/fayuan'), true);
  assert.equal(isValidWritingUrl('http://example.com'), false);
  assert.equal(isValidWritingUrl('javascript:alert(1)'), false);
  assert.equal(isValidWritingUrl('//example.com'), false);
});

test('validateWriting 通过合法条目（含可选详情字段与链接）', () => {
  assert.deepEqual(
    validateWriting(
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
    ),
    [],
  );
});

test('validateWriting 拒绝非法状态、类型、单语详情与非法链接', () => {
  assert.ok(validateWriting(entry({ status: 'Done' })).some((e) => e.includes('status')));
  assert.ok(validateWriting(entry({ type: 'poem' })).some((e) => e.includes('type')));
  assert.ok(validateWriting(entry({ description: { zh: '只有中文' } })).some((e) => e.includes('description')));
  assert.ok(validateWriting(entry({ worldview: { zh: '单语' } })).some((e) => e.includes('worldview')));
  assert.ok(validateWriting(entry({ cover: 'javascript:alert(1)' })).some((e) => e.includes('cover')));
  assert.ok(validateWriting(entry({ readingUrl: 'javascript:alert(1)' })).some((e) => e.includes('readingUrl')));
  assert.ok(validateWriting(entry({ featured: 'yes' })).some((e) => e.includes('featured')));
  assert.ok(validateWriting(entry({ public: 1 })).some((e) => e.includes('public')));
});

test('validateWritingList 空列表合法，拒绝重复 slug、全隐藏与 featured 非 public', () => {
  assert.deepEqual(validateWritingList([]), []);
  assert.deepEqual(validateWritingList([entry()]), []);
  assert.ok(
    validateWritingList([entry(), entry({ slug: 'fayuan', title: { zh: '另一部', en: 'Other' } })])
      .some((e) => e.includes('slug 重复')),
  );
  assert.ok(
    validateWritingList([entry({ public: false })]).some((e) => e.includes('至少需要一条 public')),
  );
  assert.ok(
    validateWritingList([entry({ featured: true, public: false }), entry({ slug: 'b', featured: false })])
      .some((e) => e.includes('featured 条目必须 public')),
  );
});

test('publicWriting / findWritingBySlug 过滤与查找', () => {
  const publicItem = entry();
  const hidden = entry({ slug: 'hidden', public: false, featured: false });
  assert.deepEqual(publicWriting([publicItem, hidden]), [publicItem]);
  assert.equal(findWritingBySlug([publicItem, hidden], 'fayuan'), publicItem);
  assert.equal(findWritingBySlug([publicItem], 'nope'), undefined);
  assert.equal(findWritingBySlug([publicItem], null), undefined);
});

test('writingStatusKey 映射 PRD 三态到 data 属性安全值', () => {
  assert.equal(writingStatusKey('Writing'), 'writing');
  assert.equal(writingStatusKey('In Progress'), 'in-progress');
  assert.equal(writingStatusKey('Completed'), 'completed');
});

test('writingHref / writingDetailHref 双语路径', () => {
  assert.equal(writingHref('zh'), '/writing/');
  assert.equal(writingHref('en'), '/en/writing/');
  assert.equal(writingDetailHref('fayuan', 'zh'), '/writing/fayuan/');
  assert.equal(writingDetailHref('fayuan', 'en'), '/en/writing/fayuan/');
});
