import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry } from '../content/validate.ts';
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
    repo: 'a/minimal',
    name: 'Minimal',
    description: { zh: '最小', en: 'Minimal' },
    stack: [],
    featured: false,
    public: true,
  };
  assert.doesNotThrow(() => validateEntry('projects', minimal));
});

test('缺少可选字段的产品与作品条目仍通过校验', () => {
  const product = {
    name: 'P',
    description: { zh: '产品', en: 'Product' },
    status: 'Beta',
    public: true,
  };
  const work = {
    slug: 'w',
    title: { zh: '作品', en: 'Work' },
    type: 'novel',
    status: 'Writing',
    description: { zh: '简介', en: 'Intro' },
    public: true,
  };
  assert.doesNotThrow(() => validateEntry('products', product));
  assert.doesNotThrow(() => validateEntry('writing', work));
});

test('统一出口的集合与原始数据一致（当前均为公开数据）', () => {
  assert.deepEqual(content.projects, []);
  assert.deepEqual(content.publications, []);
  assert.equal(content.profile.public, true);
});