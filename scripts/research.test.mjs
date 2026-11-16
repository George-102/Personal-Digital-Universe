import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual([...RESEARCH_STATUS].sort(), ['Completed', 'In Progress']);
});

test('isValidResearchSlug 只允许小写 kebab-case', () => {
  assert.equal(isValidResearchSlug('dynamic-airspace-configuration'), true);
  assert.equal(isValidResearchSlug('llm-marl'), true);
  assert.equal(isValidResearchSlug('Bad Slug'), false);
  assert.equal(isValidResearchSlug('UPPER'), false);
  assert.equal(isValidResearchSlug('-lead'), false);
  assert.equal(isValidResearchSlug('trail-'), false);
  assert.equal(isValidResearchSlug(''), false);
  assert.equal(isValidResearchSlug('中文slug'), false);
});

test('isValidResearchLink 只允许站内路径或 https 外链', () => {
  assert.equal(isValidResearchLink('/research/dac'), true);
  assert.equal(isValidResearchLink('https://example.com/paper'), true);
  assert.equal(isValidResearchLink('javascript:alert(1)'), false);
  assert.equal(isValidResearchLink('http://example.com'), false);
  assert.equal(isValidResearchLink('//evil.com'), false);
  assert.equal(isValidResearchLink(''), false);
});

test('validateResearch 通过合法条目', () => {
  assert.deepEqual(validateResearch(entry()), []);
});

test('validateResearch 拒绝非法 slug、非法 status、非法 link', () => {
  assert.ok(validateResearch(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug')));
  assert.ok(validateResearch(entry({ status: 'Done' })).some((e) => e.includes('status')));
  assert.ok(
    validateResearch(entry({ link: 'javascript:alert(1)' })).some((e) => e.includes('link')),
  );
});

test('validateResearch 拒绝单语字段与空数组', () => {
  assert.ok(validateResearch(entry({ overview: { zh: '只有中文' } })).some((e) => e.includes('overview')));
  assert.ok(validateResearch(entry({ title: { zh: '只有中文' } })).some((e) => e.includes('title')));
  assert.ok(validateResearch(entry({ problems: [] })).some((e) => e.includes('problems')));
  assert.ok(validateResearch(entry({ methods: [] })).some((e) => e.includes('methods')));
  assert.ok(validateResearch(entry({ keywords: [] })).some((e) => e.includes('keywords')));
  assert.ok(validateResearch(entry({ problems: [{ zh: '仅中文' }] })).some((e) => e.includes('problems')));
});

test('validateResearch 拒绝缺 overview 或 public 非布尔', () => {
  const withoutOverview = { ...entry() };
  delete withoutOverview.overview;
  assert.ok(validateResearch(withoutOverview).some((e) => e.includes('overview')));
  assert.ok(validateResearch(entry({ public: 'yes' })).some((e) => e.includes('public')));
});

test('validateResearchList 拒绝重复 slug、空列表、全非公开', () => {
  assert.deepEqual(validateResearchList([entry()]), []);
  const dup = validateResearchList([entry(), entry({ title: { zh: '另一个', en: 'Another' } })]);
  assert.ok(dup.some((e) => e.includes('slug') && e.includes('重复')));
  assert.ok(validateResearchList([]).length > 0);
  assert.ok(
    validateResearchList([entry({ public: false })]).some((e) => e.includes('public')),
  );
});

test('findResearchBySlug 按 slug 查找，未知返回 undefined', () => {
  const list = [entry(), entry({ slug: 'llm-marl', title: { zh: 'LLM+MARL', en: 'LLM+MARL' } })];
  assert.equal(findResearchBySlug(list, 'llm-marl')?.slug, 'llm-marl');
  assert.equal(findResearchBySlug(list, 'nope'), undefined);
  assert.equal(findResearchBySlug(list, ''), undefined);
});

test('researchHref / researchDetailHref 构造双语路径', () => {
  assert.equal(researchHref('zh'), '/research/');
  assert.equal(researchHref('en'), '/en/research/');
  assert.equal(researchDetailHref('llm-marl', 'zh'), '/research/llm-marl/');
  assert.equal(researchDetailHref('llm-marl', 'en'), '/en/research/llm-marl/');
});

test('content/research.ts 数据通过 validateResearchList 且公开项已过滤', () => {
  assert.deepEqual(validateResearchList(research), []);
  assert.ok(research.length > 0);
  assert.ok(publicResearch.every((item) => item.public));
  assert.ok(publicResearch.length > 0);
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
    assert.ok(keywords.includes(area), `缺少研究领域关键词: ${area}`);
  }
  // PRD：未完成项目正确标记为 In Progress
  assert.ok(research.some((item) => item.status === 'In Progress'));
});

