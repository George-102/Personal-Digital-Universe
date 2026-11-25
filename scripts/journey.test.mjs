import { test, expect } from 'vitest';
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
  expect(normalizeJourneyDate('2024')).toBe('2024-00');
  expect(normalizeJourneyDate('2024-09')).toBe('2024-09');
  expect(normalizeJourneyDate('2024-9')).toBe(null);
  expect(normalizeJourneyDate('2024-13')).toBe(null);
  expect(normalizeJourneyDate('24-09')).toBe(null);
  expect(normalizeJourneyDate('')).toBe(null);
});

test('sortJourney 按时间倒序返回新数组，同年份无月份排在有月份之前', () => {
  const entries = [
    { ...base, date: '2023' },
    { ...base, date: '2025-03' },
    { ...base, date: '2024-09' },
    { ...base, date: '2024' },
  ];
  const sorted = sortJourney(entries);
  expect(sorted.map((e) => e.date)).toEqual(['2025-03', '2024-09', '2024', '2023']);
  // 不改原数组
  expect(entries.map((e) => e.date)).toEqual(['2023', '2025-03', '2024-09', '2024']);
});

test('journeyPeriod 返回起止点，缺失时 end 为 null', () => {
  expect(journeyPeriod({ date: '2024-09' })).toEqual({ start: '2024-09', end: null });
  expect(journeyPeriod({ date: '2023', endDate: '2024-06' })).toEqual({
    start: '2023',
    end: '2024-06',
  });
});

test('journeyCategoryMessageKey 直接映射到 messages 键后缀', () => {
  for (const category of JOURNEY_CATEGORIES) {
    expect(journeyCategoryMessageKey(category)).toBe(`categories.${category}`);
  }
});

test('isValidJourneyLink 只接受站内路径与 https 外链', () => {
  expect(isValidJourneyLink('/writing/fayuan')).toBe(true);
  expect(isValidJourneyLink('/')).toBe(true);
  expect(isValidJourneyLink('https://github.com/George-102')).toBe(true);
  expect(isValidJourneyLink('http://example.com')).toBe(false);
  expect(isValidJourneyLink('//evil.example.com/x')).toBe(false);
  expect(isValidJourneyLink('javascript:alert(1)')).toBe(false);
  expect(isValidJourneyLink('example.com')).toBe(false);
});

test('合法经历通过单条校验与整表校验', () => {
  expect(() => validateEntry('journey', base)).not.toThrow();
  expect(validateJourneyEntries([base])).toEqual([]);
  expect(validateJourneyEntries([
      {
        ...base,
        detail: [
          { zh: '第一段详情', en: 'First detail' },
          { zh: '第二段详情', en: 'Second detail' },
        ],
        link: '/about',
        endDate: '2026-06',
      },
    ])).toEqual([]);
  // detail 缺省是允许的（验收：无详情节点仍展示基本内容）
  expect(validateJourneyEntries([{ ...base, detail: undefined }])).toEqual([]);
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
    expect(errors.length > 0).toBeTruthy();
    expect(errors.some((message) => pattern.test(message))).toBeTruthy();
  }
});

test('date + title 组合重复与全部隐藏都会被拒绝', () => {
  const dup = validateJourneyEntries([base, { ...base }]);
  expect(dup.some((message) => /重复/.test(message))).toBeTruthy();

  const hidden = validateJourneyEntries([{ ...base, public: false }]);
  expect(hidden.some((message) => /public/.test(message))).toBeTruthy();
});

test('validateEntry 对 journey 复用同一套规则（构建期入口一致）', () => {
  for (const [entry, pattern] of [
    [{ ...base, link: 'http://example.com' }, /link/],
    [{ ...base, endDate: '2023-01' }, /endDate/],
    [{ ...base, detail: [{ en: 'x' }] }, /detail/],
  ]) {
    expect(() => validateEntry('journey', entry)).toThrow();
  }
});

test('formatJourneyPeriod 渲染区间与单点', () => {
  expect(formatJourneyPeriod('2023-09', '2027-06')).toBe('2023-09 — 2027-06');
  expect(formatJourneyPeriod('2025-06')).toBe('2025-06');
  expect(formatJourneyPeriod('2025', null)).toBe('2025');
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

  expect(zh[0].title).toBe('入学');
  expect(en[0].title).toBe('Enrolled');
  expect(zh[0].period).toBe('2025-09 — 2026-06');
  expect(zh[0].detail).toEqual(['详情一', '详情二']);
  expect(zh[0].link).toBe('https://github.com/George-102');
  expect(zh[0].category).toBe('education');
  expect(zh[0].categoryMessageKey).toBe('categories.education');
  expect(zh[1].detail).toEqual([]);
  expect(zh[1].link).toBe(null);
  // id 唯一且不依赖数组下标
  const ids = [...zh, ...en].map((item) => item.id);
  expect(new Set(ids).size).toBe(4);
});

