import { test, expect } from 'vitest';
import {
  RESEARCH_STATUS,
  isValidResearchSlug,
  isValidResearchLink,
  validateResearch,
  validateResearchList,
  findResearchBySlug,
  researchHref,
  researchDetailHref,
} from '../lib/research.ts';
import { research } from '../content/research.ts';
import { research as publicResearch } from '../content/index.ts';

const entry = (overrides = {}) => ({
  slug: 'dynamic-airspace-configuration',
  title: { zh: '动态空域配置', en: 'Dynamic Airspace Configuration' },
  overview: {
    zh: '研究动态交通需求下的空域结构重构问题。',
    en: 'Studying airspace structure reconfiguration under dynamic traffic demand.',
  },
  problems: [{ zh: '动态交通需求', en: 'Dynamic traffic demand' }],
  methods: ['Multi-Agent Reinforcement Learning', 'Simulation'],
  keywords: ['DAC', 'MARL'],
  status: 'In Progress',
  public: true,
  ...overrides,
});

test('RESEARCH_STATUS 严格限定 In Progress | Completed', () => {
  expect([...RESEARCH_STATUS].sort()).toEqual(['Completed', 'In Progress']);
});

test('isValidResearchSlug 只允许小写 kebab-case', () => {
  expect(isValidResearchSlug('dynamic-airspace-configuration')).toBe(true);
  expect(isValidResearchSlug('llm-marl')).toBe(true);
  expect(isValidResearchSlug('Bad Slug')).toBe(false);
  expect(isValidResearchSlug('UPPER')).toBe(false);
  expect(isValidResearchSlug('-lead')).toBe(false);
  expect(isValidResearchSlug('trail-')).toBe(false);
  expect(isValidResearchSlug('')).toBe(false);
  expect(isValidResearchSlug('中文slug')).toBe(false);
});

test('isValidResearchLink 只允许站内路径或 https 外链', () => {
  expect(isValidResearchLink('/research/dac')).toBe(true);
  expect(isValidResearchLink('https://example.com/paper')).toBe(true);
  expect(isValidResearchLink('javascript:alert(1)')).toBe(false);
  expect(isValidResearchLink('http://example.com')).toBe(false);
  expect(isValidResearchLink('//evil.com')).toBe(false);
  expect(isValidResearchLink('')).toBe(false);
});

test('validateResearch 通过合法条目', () => {
  expect(validateResearch(entry())).toEqual([]);
});

test('validateResearch 拒绝非法 slug、非法 status、非法 link', () => {
  expect(validateResearch(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug'))).toBeTruthy();
  expect(validateResearch(entry({ status: 'Done' })).some((e) => e.includes('status'))).toBeTruthy();
  expect(validateResearch(entry({ link: 'javascript:alert(1)' })).some((e) => e.includes('link'))).toBeTruthy();
});

test('validateResearch 拒绝单语字段与空数组', () => {
  expect(validateResearch(entry({ overview: { zh: '只有中文' } })).some((e) => e.includes('overview'))).toBeTruthy();
  expect(validateResearch(entry({ title: { zh: '只有中文' } })).some((e) => e.includes('title'))).toBeTruthy();
  expect(validateResearch(entry({ problems: [] })).some((e) => e.includes('problems'))).toBeTruthy();
  expect(validateResearch(entry({ methods: [] })).some((e) => e.includes('methods'))).toBeTruthy();
  expect(validateResearch(entry({ keywords: [] })).some((e) => e.includes('keywords'))).toBeTruthy();
  expect(validateResearch(entry({ problems: [{ zh: '仅中文' }] })).some((e) => e.includes('problems'))).toBeTruthy();
});

test('validateResearch 拒绝缺 overview 或 public 非布尔', () => {
  const withoutOverview = { ...entry() };
  delete withoutOverview.overview;
  expect(validateResearch(withoutOverview).some((e) => e.includes('overview'))).toBeTruthy();
  expect(validateResearch(entry({ public: 'yes' })).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateResearchList 拒绝重复 slug、空列表、全非公开', () => {
  expect(validateResearchList([entry()])).toEqual([]);
  const dup = validateResearchList([entry(), entry({ title: { zh: '另一个', en: 'Another' } })]);
  expect(dup.some((e) => e.includes('slug') && e.includes('重复'))).toBeTruthy();
  expect(validateResearchList([]).length > 0).toBeTruthy();
  expect(validateResearchList([entry({ public: false })]).some((e) => e.includes('public'))).toBeTruthy();
});

test('findResearchBySlug 按 slug 查找，未知返回 undefined', () => {
  const list = [entry(), entry({ slug: 'llm-marl', title: { zh: 'LLM+MARL', en: 'LLM+MARL' } })];
  expect(findResearchBySlug(list, 'llm-marl')?.slug).toBe('llm-marl');
  expect(findResearchBySlug(list, 'nope')).toBe(undefined);
  expect(findResearchBySlug(list, '')).toBe(undefined);
});

test('researchHref / researchDetailHref 构造双语路径', () => {
  expect(researchHref('zh')).toBe('/research/');
  expect(researchHref('en')).toBe('/en/research/');
  expect(researchDetailHref('llm-marl', 'zh')).toBe('/research/llm-marl/');
  expect(researchDetailHref('llm-marl', 'en')).toBe('/en/research/llm-marl/');
});

test('content/research.ts 数据通过 validateResearchList 且公开项已过滤', () => {
  expect(validateResearchList(research)).toEqual([]);
  expect(research.length > 0).toBeTruthy();
  expect(publicResearch.every((item) => item.public)).toBeTruthy();
  expect(publicResearch.length > 0).toBeTruthy();
  // PRD 六个研究领域关键词在数据中有落点
  const keywords = research.flatMap((item) => item.keywords).join(' | ');
  for (const area of [
    'Dynamic Airspace Configuration',
    'Dynamic Airspace Sectorization',
    'Large Language Models',
    'Multi-Agent Reinforcement Learning',
    'Agentic AI',
    'AI for Air Traffic Management',
  ]) {
    expect(keywords.includes(area)).toBeTruthy();
  }
  // PRD：未完成项目正确标记为 In Progress
  expect(research.some((item) => item.status === 'In Progress')).toBeTruthy();
});

