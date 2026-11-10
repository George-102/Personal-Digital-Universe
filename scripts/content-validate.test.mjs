import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, filterPublic } from '../content/validate.ts';

const validProject = {
  repo: 'example/repo',
  name: 'Example',
  description: { zh: '示例项目', en: 'Example project' },
  stack: ['TypeScript'],
  featured: false,
  public: true,
};

test('合法项目数据通过校验', () => {
  assert.doesNotThrow(() => validateEntry('projects', validProject));
});

test('缺少必填字段时校验失败并指明字段', () => {
  const missing = { ...validProject };
  delete missing.repo;
  assert.throws(() => validateEntry('projects', missing), /repo/);
});

test('双语字段缺少 en 时校验失败', () => {
  const bad = { ...validProject, description: { zh: '只有中文' } };
  assert.throws(() => validateEntry('projects', bad), /description/);
});

test('论文状态只允许 Published / Preprint / In Progress', () => {
  const base = {
    title: 'A Paper',
    authors: ['Author'],
    year: 2026,
    public: true,
  };
  for (const status of ['Published', 'Preprint', 'In Progress']) {
    assert.doesNotThrow(() => validateEntry('publications', { ...base, status }));
  }
  assert.throws(
    () => validateEntry('publications', { ...base, status: 'Accepted' }),
    /status/,
  );
});

test('产品状态只允许四值枚举', () => {
  const base = {
    name: 'A Product',
    description: { zh: '产品', en: 'Product' },
    public: true,
  };
  for (const status of ['Released', 'Beta', 'In Development', 'Discontinued']) {
    assert.doesNotThrow(() => validateEntry('products', { ...base, status }));
  }
  assert.throws(
    () => validateEntry('products', { ...base, status: 'Coming Soon' }),
    /status/,
  );
});

test('public 必须是布尔值', () => {
  assert.throws(
    () => validateEntry('projects', { ...validProject, public: 'yes' }),
    /public/,
  );
});

test('filterPublic 过滤 public:false 条目且不改原数组', () => {
  const items = [
    { ...validProject, name: 'open' },
    { ...validProject, name: 'hidden', public: false },
  ];
  const result = filterPublic(items);
  assert.deepEqual(result.map((i) => i.name), ['open']);
  assert.equal(items.length, 2);
});