import { test, expect } from 'vitest';
import { validateEntry } from '../content/validate.ts';
import { projects as rawProjects } from '../content/projects.ts';
import { products as rawProducts } from '../content/products.ts';
import * as content from '../content/index.ts';

test('content 统一出口只暴露 public:true 的条目', () => {
  const rawProjects = [
    {
      repo: 'a/open',
      name: 'OpenProject',
      description: { zh: '公开', en: 'Open' },
      stack: [],
      featured: false,
      public: true,
    },
    {
      repo: 'a/hidden',
      name: 'HiddenProject',
      description: { zh: '隐藏', en: 'Hidden' },
      stack: [],
      featured: false,
      public: false,
    },
  ];
  const visible = content.publicOnly('projects', rawProjects);
  expect(visible.map((p) => p.name)).toEqual(['OpenProject']);
});

test('缺少可选字段的项目条目仍通过校验', () => {
  const minimal = {
    slug: 'minimal',
    repo: 'a/minimal',
    name: 'Minimal',
    description: { zh: '最小', en: 'Minimal' },
    stack: [],
    category: 'other',
    status: 'archived',
    featured: false,
    public: true,
  };
  expect(() => validateEntry('projects', minimal)).not.toThrow();
});

test('缺少可选图片/链接字段的产品与作品条目仍通过校验', () => {
  const product = {
    slug: 'p',
    name: 'P',
    description: { zh: '产品', en: 'Product' },
    features: [{ zh: '功能', en: 'Feature' }],
    status: 'Beta',
    featured: false,
    public: true,
  };
  const work = {
    slug: 'w',
    title: { zh: '作品', en: 'Work' },
    type: 'novel',
    status: 'Writing',
    description: { zh: '简介', en: 'Intro' },
    featured: true,
    public: true,
  };
  expect(() => validateEntry('products', product)).not.toThrow();
  expect(() => validateEntry('writing', work)).not.toThrow();
});

test('统一出口的集合与原始数据一致（US-012 项目为 9 条真实数据，均公开）', () => {
  // US-012：projects 已有真实数据；出口通过 publicOnly 过滤后与原始公开数据一致
  expect(content.projects.length).toBe(9);
  expect(content.projects.every((item) => item.public)).toBeTruthy();
  expect(content.projects.map((item) => item.slug)).toEqual(rawProjects.filter((item) => item.public).map((item) => item.slug));
  // US-013：products 4 条真实数据（起草稿）经 public 过滤后与原始公开数据一致
  expect(content.products.length).toBe(4);
  expect(content.products.every((item) => item.public)).toBeTruthy();
  expect(content.products.map((item) => item.slug)).toEqual(rawProducts.filter((item) => item.public).map((item) => item.slug));
  expect(content.publications).toEqual([]);
  expect(content.profile.public).toBe(true);
});