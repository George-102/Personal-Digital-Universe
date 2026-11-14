import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry } from '../content/validate.ts';
import {
  JOURNEY_CATEGORIES,
  normalizeJourneyDate,
  journeyPeriod,
  formatJourneyPeriod,
  sortJourney,
  journeyCategoryMessageKey,
  validateJourneyEntries,
  isValidJourneyLink,
  buildJourneyItems,
} from '../lib/journey.ts';

const base = {
  date: '2024-09',
  title: { zh: '入学', en: 'Enrolled' },
  summary: { zh: '开始本科学习', en: 'Started undergraduate study' },
  category: 'education',
  public: true,
};

test('normalizeJourneyDate 补零到 YYYY-MM 并拒绝非法值', () => {
  assert.equal(normalizeJourneyDate('2024'), '2024-00');
  assert.equal(normalizeJourneyDate('2024-09'), '2024-09');
  assert.equal(normalizeJourneyDate('2024-9'), null);
  assert.equal(normalizeJourneyDate('2024-13'), null);
  assert.equal(normalizeJourneyDate('24-09'), null);
  assert.equal(normalizeJourneyDate(''), null);
});

test('sortJourney 按时间倒序返回新数组，同年份无月份排在有月份之前', () => {
  const entries = [
    { ...base, date: '2023' },
    { ...base, date: '2025-03' },
    { ...base, date: '2024-09' },
    { ...base, date: '2024' },
  ];
  const sorted = sortJourney(entries);
  assert.deepEqual(
    sorted.map((e) => e.date),
    ['2025-03', '2024-09', '2024', '2023'],
  );
  // 不改原数组
  assert.deepEqual(
    entries.map((e) => e.date),
    ['2023', '2025-03', '2024-09', '2024'],
  );
});

test('journeyPeriod 返回起止点，缺失时 end 为 null', () => {
  assert.deepEqual(journeyPeriod({ date: '2024-09' }), { start: '2024-09', end: null });
  assert.deepEqual(journeyPeriod({ date: '2023', endDate: '2024-06' }), {
    start: '2023',
    end: '2024-06',
  });
});

test('journeyCategoryMessageKey 直接映射到 messages 键后缀', () => {
  for (const category of JOURNEY_CATEGORIES) {
    assert.equal(journeyCategoryMessageKey(category), `categories.${category}`);
  }
});

test('isValidJourneyLink 只接受站内路径与 https 外链', () => {
  assert.equal(isValidJourneyLink('/writing/fayuan'), true);
  assert.equal(isValidJourneyLink('/'), true);
  assert.equal(isValidJourneyLink('https://github.com/George-102'), true);
  assert.equal(isValidJourneyLink('http://example.com'), false);
  assert.equal(isValidJourneyLink('//evil.example.com/x'), false);
  assert.equal(isValidJourneyLink('javascript:alert(1)'), false);
  assert.equal(isValidJourneyLink('example.com'), false);
});

test('合法经历通过单条校验与整表校验', () => {
  assert.doesNotThrow(() => validateEntry('journey', base));
  assert.deepEqual(validateJourneyEntries([base]), []);
  assert.deepEqual(
    validateJourneyEntries([
      {
        ...base,
        detail: [
          { zh: '第一段详情', en: 'First detail' },
          { zh: '第二段详情', en: 'Second detail' },
        ],
        link: '/about',
        endDate: '2026-06',
      },
    ]),
    [],
  );
  // detail 缺省是允许的（验收：无详情节点仍展示基本内容）
  assert.deepEqual(validateJourneyEntries([{ ...base, detail: undefined }]), []);
});

test('validateJourneyEntries 逐项报出非法配置', () => {
  const cases = [
    [{ ...base, category: 'unknown' }, /category/],
    [{ ...base, date: '2024-13' }, /date/],
    [{ ...base, date: '2024-05', endDate: '2024-01' }, /endDate/],
    [{ ...base, summary: { zh: '', en: 'x' } }, /summary/],
    [{ ...base, detail: [{ zh: '只有中文' }] }, /detail/],
    [{ ...base, detail: 'not-an-array' }, /detail/],
    [{ ...base, link: 'javascript:alert(1)' }, /link/],
    [{ ...base, link: '//evil.example.com' }, /link/],
    [{ ...base, public: 'yes' }, /public/],
  ];
  for (const [entry, pattern] of cases) {
    const errors = validateJourneyEntries([entry]);
    assert.ok(errors.length > 0, `${JSON.stringify(entry)} 应报错`);
    assert.ok(
      errors.some((message) => pattern.test(message)),
      `错误信息应匹配 ${pattern}: ${errors.join(' | ')}`,
    );
  }
});

test('date + title 组合重复与全部隐藏都会被拒绝', () => {
  const dup = validateJourneyEntries([base, { ...base }]);
  assert.ok(dup.some((message) => /重复/.test(message)), dup.join(' | '));

  const hidden = validateJourneyEntries([{ ...base, public: false }]);
  assert.ok(hidden.some((message) => /public/.test(message)), hidden.join(' | '));
});

test('validateEntry 对 journey 复用同一套规则（构建期入口一致）', () => {
  for (const [entry, pattern] of [
    [{ ...base, link: 'http://example.com' }, /link/],
    [{ ...base, endDate: '2023-01' }, /endDate/],
    [{ ...base, detail: [{ en: 'x' }] }, /detail/],
  ]) {
    assert.throws(() => validateEntry('journey', entry), pattern);
  }
});

test('formatJourneyPeriod 渲染区间与单点', () => {
  assert.equal(formatJourneyPeriod('2023-09', '2027-06'), '2023-09 — 2027-06');
  assert.equal(formatJourneyPeriod('2025-06'), '2025-06');
  assert.equal(formatJourneyPeriod('2025', null), '2025');
});

test('buildJourneyItems 按语言解出纯字符串、id 唯一、无 detail 时返回空数组', () => {
  const entries = [
    {
      ...base,
      date: '2025-09',
      endDate: '2026-06',
      detail: [
        { zh: '详情一', en: 'Detail one' },
        { zh: '详情二', en: 'Detail two' },
      ],
      link: 'https://github.com/George-102',
    },
    { ...base, date: '2024-01', title: { zh: '第二条', en: 'Second' }, detail: undefined },
  ];
  const zh = buildJourneyItems(entries, 'zh');
  const en = buildJourneyItems(entries, 'en');

  assert.equal(zh[0].title, '入学');
  assert.equal(en[0].title, 'Enrolled');
  assert.equal(zh[0].period, '2025-09 — 2026-06');
  assert.deepEqual(zh[0].detail, ['详情一', '详情二']);
  assert.equal(zh[0].link, 'https://github.com/George-102');
  assert.equal(zh[0].category, 'education');
  assert.equal(zh[0].categoryMessageKey, 'categories.education');
  assert.deepEqual(zh[1].detail, []);
  assert.equal(zh[1].link, null);
  // id 唯一且不依赖数组下标
  const ids = [...zh, ...en].map((item) => item.id);
  assert.equal(new Set(ids).size, 4);
});

