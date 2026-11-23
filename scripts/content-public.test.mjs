import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual(visible.map((p) => p.name), ['OpenProject']);
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
  assert.doesNotThrow(() => validateEntry('projects', minimal));
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
  assert.doesNotThrow(() => validateEntry('products', product));
  assert.doesNotThrow(() => validateEntry('writing', work));
});

test('统一出口的集合与原始数据一致（US-012 项目为 9 条真实数据，均公开）', () => {
  // US-012：projects 已有真实数据；出口通过 publicOnly 过滤后与原始公开数据一致
  assert.equal(content.projects.length, 9);
  assert.ok(content.projects.every((item) => item.public));
  assert.deepEqual(
    content.projects.map((item) => item.slug),
    rawProjects.filter((item) => item.public).map((item) => item.slug),
  );
  // US-013：products 4 条真实数据（起草稿）经 public 过滤后与原始公开数据一致
  assert.equal(content.products.length, 4);
  assert.ok(content.products.every((item) => item.public));
  assert.deepEqual(
    content.products.map((item) => item.slug),
    rawProducts.filter((item) => item.public).map((item) => item.slug),
  );
  assert.deepEqual(content.publications, []);
  assert.equal(content.profile.public, true);
});