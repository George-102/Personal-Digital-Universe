import { test, expect } from 'vitest';
import {
  SKILL_CATEGORIES,
  FORBIDDEN_PROFICIENCY_FIELDS,
  isValidSkillSlug,
  isValidSkillLink,
  validateSkill,
  validateSkillList,
  publicSkills,
  skillsByCategory,
  skillCategoryKey,
  skillHref,
  findSkillBySlug,
} from '../lib/skills.ts';

const entry = (overrides = {}) => ({
  slug: 'typescript',
  name: 'TypeScript',
  category: 'software-engineering',
  description: { zh: '为 JavaScript 增加静态类型。', en: 'Adds static types to JavaScript.' },
  detail: {
    zh: '用于本站前端类型约束与接口定义。',
    en: 'Used for front-end typing and interface definitions on this site.',
  },
  tags: ['JavaScript', 'Next.js'],
  related: [
    {
      label: { zh: '开源项目', en: 'Projects' },
      href: '/projects/',
    },
  ],
  featured: true,
  public: true,
  ...overrides,
});

test('SKILL_CATEGORIES 严格对应 PRD 六领域', () => {
  expect([...SKILL_CATEGORIES]).toEqual([
    'computer-science',
    'software-engineering',
    'full-stack',
    'artificial-intelligence',
    'research-computing',
    'tools-technologies',
  ]);
});

test('isValidSkillSlug 只允许小写 kebab-case', () => {
  expect(isValidSkillSlug('typescript')).toBe(true);
  expect(isValidSkillSlug('multi-agent-rl-2')).toBe(true);
  expect(isValidSkillSlug('TypeScript')).toBe(false);
  expect(isValidSkillSlug('-lead')).toBe(false);
  expect(isValidSkillSlug('trail-')).toBe(false);
  expect(isValidSkillSlug('has space')).toBe(false);
  expect(isValidSkillSlug('')).toBe(false);
});

test('isValidSkillLink 只接受站内路径或 https 外链', () => {
  expect(isValidSkillLink('/projects/')).toBe(true);
  expect(isValidSkillLink('/en/research/')).toBe(true);
  expect(isValidSkillLink('https://github.com/George-102')).toBe(true);
  expect(isValidSkillLink('javascript:alert(1)')).toBe(false);
  expect(isValidSkillLink('http://example.com')).toBe(false);
  expect(isValidSkillLink('//example.com')).toBe(false);
  expect(isValidSkillLink('projects/')).toBe(false);
});

test('validateSkill 接受合法条目（related 可缺省）', () => {
  expect(validateSkill(entry())).toEqual([]);
  expect(validateSkill(entry({ related: undefined }))).toEqual([]);
  expect(validateSkill(entry({ tags: [] }))).toEqual([]);
});

test('validateSkill 拒绝缺失必填字段', () => {
  expect(validateSkill(entry({ slug: undefined })).join()).toContain('slug');
  expect(validateSkill(entry({ name: '' })).join()).toContain('name');
  expect(validateSkill(entry({ public: undefined })).join()).toContain('public');
});

test('validateSkill 拒绝单语或空双语字段', () => {
  expect(validateSkill(entry({ description: { zh: '只有中文' } })).join()).toContain('description');
  expect(validateSkill(entry({ detail: { zh: '', en: 'ok' } })).join()).toContain('detail');
});

test('validateSkill 拒绝非法领域分类', () => {
  const errors = validateSkill(entry({ category: 'design' }));
  expect(errors.join()).toContain('category');
});

test('validateSkill 从类型与构建期双重拒绝熟练度百分比字段', () => {
  expect(FORBIDDEN_PROFICIENCY_FIELDS.length).toBeGreaterThan(0);
  for (const field of FORBIDDEN_PROFICIENCY_FIELDS) {
    const errors = validateSkill(entry({ [field]: 95 }));
    expect(errors.join(), field).toContain('熟练度');
  }
});

test('validateSkill 拒绝非法关联链接与关联标签', () => {
  expect(validateSkill(entry({ related: [{ label: { zh: '项目', en: 'Projects' }, href: 'javascript:alert(1)' }] })).join()).toContain('href');
  expect(validateSkill(entry({ related: [{ label: { zh: '', en: 'Projects' }, href: '/projects/' }] })).join()).toContain('label');
  expect(validateSkill(entry({ related: 'not-an-array' })).join()).toContain('related');
});

test('validateSkillList 接受空表，拒绝非数组', () => {
  expect(validateSkillList([])).toEqual([]);
  expect(validateSkillList('nope').join()).toContain('数组');
});

test('validateSkillList 拒绝重复 slug 与全部隐藏', () => {
  expect(validateSkillList([entry(), entry()]).join()).toContain('slug 重复');
  expect(validateSkillList([entry({ public: false })]).join()).toContain('public');
});

test('validateSkillList 拒绝 featured 但非 public', () => {
  expect(validateSkillList([entry({ featured: true, public: false })]).join()).toContain('featured');
});

test('publicSkills 与 findSkillBySlug 只消费公开数据', () => {
  const items = [entry(), entry({ slug: 'python', public: false })];
  expect(publicSkills(items).map((item) => item.slug)).toEqual(['typescript']);
  expect(findSkillBySlug(items, 'typescript')?.name).toBe('TypeScript');
  expect(findSkillBySlug(items, 'python')).toBeUndefined();
  expect(findSkillBySlug(items, null)).toBeUndefined();
});

test('skillsByCategory 固定六个领域分组，空领域保留空数组', () => {
  const groups = skillsByCategory([entry()]);
  expect(Object.keys(groups)).toEqual([...SKILL_CATEGORIES]);
  expect(groups['software-engineering'].map((item) => item.slug)).toEqual(['typescript']);
  expect(groups['computer-science']).toEqual([]);
});

test('skillCategoryKey 与 skillHref 输出稳定 kebab / 双语路径', () => {
  expect(skillCategoryKey('research-computing')).toBe('research-computing');
  expect(skillHref('zh')).toBe('/skills/');
  expect(skillHref('en')).toBe('/en/skills/');
});
