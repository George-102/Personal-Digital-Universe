import { test, expect } from 'vitest';
import { validateEntry, filterPublic } from '../content/validate.ts';

const validProject = {
  // US-012a：Project 新增 slug / category / status 必填字段
  slug: 'example-project',
  repo: 'example/repo',
  name: 'Example',
  description: { zh: '示例项目', en: 'Example project' },
  stack: ['TypeScript'],
  category: 'web',
  status: 'active',
  featured: false,
  public: true,
};

test('合法项目数据通过校验', () => {
  expect(() => validateEntry('projects', validProject)).not.toThrow();
});

test('缺少必填字段时校验失败并指明字段', () => {
  const missing = { ...validProject };
  delete missing.repo;
  expect(() => validateEntry('projects', missing)).toThrow();
});

test('双语字段缺少 en 时校验失败', () => {
  const bad = { ...validProject, description: { zh: '只有中文' } };
  expect(() => validateEntry('projects', bad)).toThrow();
});

test('论文状态只允许 Published / Preprint / In Progress', () => {
  const base = {
    title: 'A Paper',
    authors: ['Author'],
    year: 2026,
    public: true,
  };
  for (const status of ['Published', 'Preprint', 'In Progress']) {
    expect(() => validateEntry('publications', { ...base, status })).not.toThrow();
  }
  expect(() => validateEntry('publications', { ...base, status: 'Accepted' })).toThrow();
});

test('产品状态只允许四值枚举', () => {
  const base = {
    slug: 'a-product',
    name: 'A Product',
    description: { zh: '产品', en: 'Product' },
    features: [{ zh: '功能', en: 'Feature' }],
    featured: false,
    public: true,
  };
  for (const status of ['Released', 'Beta', 'In Development', 'Discontinued']) {
    expect(() => validateEntry('products', { ...base, status })).not.toThrow();
  }
  expect(() => validateEntry('products', { ...base, status: 'Coming Soon' })).toThrow();
});

test('public 必须是布尔值', () => {
  expect(() => validateEntry('projects', { ...validProject, public: 'yes' })).toThrow();
});

test('filterPublic 过滤 public:false 条目且不改原数组', () => {
  const items = [
    { ...validProject, name: 'open' },
    { ...validProject, name: 'hidden', public: false },
  ];
  const result = filterPublic(items);
  expect(result.map((i) => i.name)).toEqual(['open']);
  expect(items.length).toBe(2);
});