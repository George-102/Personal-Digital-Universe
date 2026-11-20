import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_STATUS,
  isValidProductSlug,
  isValidProductUrl,
  isValidProductRepo,
  validateProduct,
  validateProductList,
  publicProducts,
  findProductBySlug,
  productStatusKey,
  productHref,
} from '../lib/products.ts';

const entry = (overrides = {}) => ({
  slug: 'smart-scheduler',
  name: 'Smart Scheduler',
  description: { zh: '一款智能排程工具。', en: 'A smart scheduling tool.' },
  features: [
    { zh: '自动排程', en: 'Auto scheduling' },
    { zh: '冲突检测', en: 'Conflict detection' },
  ],
  detail: { zh: '完整产品介绍。', en: 'Full product introduction.' },
  status: 'Released',
  featured: true,
  public: true,
  ...overrides,
});

test('PRODUCT_STATUS 严格限定 PRD 四态', () => {
  assert.deepEqual([...PRODUCT_STATUS].sort(), [
    'Beta',
    'Discontinued',
    'In Development',
    'Released',
  ]);
});

test('isValidProductSlug 只允许小写 kebab-case', () => {
  assert.equal(isValidProductSlug('smart-scheduler'), true);
  assert.equal(isValidProductSlug('note-keeper-2'), true);
  assert.equal(isValidProductSlug('Bad Slug'), false);
  assert.equal(isValidProductSlug('UPPER'), false);
  assert.equal(isValidProductSlug('-lead'), false);
  assert.equal(isValidProductSlug('trail-'), false);
  assert.equal(isValidProductSlug(''), false);
});

test('isValidProductUrl 只接受 https 或站内路径，拒绝 javascript/协议相对', () => {
  assert.equal(isValidProductUrl('https://example.com/app'), true);
  assert.equal(isValidProductUrl('/products/demo'), true);
  assert.equal(isValidProductUrl('http://example.com'), false);
  assert.equal(isValidProductUrl('javascript:alert(1)'), false);
  assert.equal(isValidProductUrl('//example.com'), false);
  assert.equal(isValidProductUrl('ftp://example.com'), false);
});

test('isValidProductRepo 只接受 owner/name 形式', () => {
  assert.equal(isValidProductRepo('George-102/smart-scheduler'), true);
  assert.equal(isValidProductRepo('George-102'), false);
  assert.equal(isValidProductRepo('/repo'), false);
  assert.equal(isValidProductRepo('own er/repo'), false);
  assert.equal(isValidProductRepo('javascript:alert(1)'), false);
});

test('validateProduct 通过合法条目（含可选 detail/logo/cover/url/repo）', () => {
  assert.deepEqual(
    validateProduct(
      entry({
        logo: '/images/product-logo.svg',
        cover: 'https://example.com/cover.png',
        url: 'https://example.com/app',
        repo: 'George-102/smart-scheduler',
      }),
    ),
    [],
  );
  assert.deepEqual(validateProduct(entry({ detail: undefined, url: undefined })), []);
});

test('validateProduct 拒绝非法 slug、status', () => {
  assert.ok(validateProduct(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug')));
  assert.ok(validateProduct(entry({ status: 'Done' })).some((e) => e.includes('status')));
  assert.ok(
    validateProduct(entry({ status: 'In progress' })).some((e) => e.includes('status')),
  );
});

test('validateProduct 拒绝单语字段、空功能列表与非法可选字段', () => {
  assert.ok(
    validateProduct(entry({ description: { zh: '只有中文' } })).some((e) =>
      e.includes('description'),
    ),
  );
  assert.ok(validateProduct(entry({ features: [] })).some((e) => e.includes('features')));
  assert.ok(
    validateProduct(entry({ features: [{ zh: '只有中文' }] })).some((e) =>
      e.includes('features'),
    ),
  );
  assert.ok(
    validateProduct(entry({ detail: { zh: '只有中文' } })).some((e) => e.includes('detail')),
  );
  assert.ok(
    validateProduct(entry({ url: 'javascript:alert(1)' })).some((e) => e.includes('url')),
  );
  assert.ok(
    validateProduct(entry({ repo: 'javascript:alert(1)' })).some((e) => e.includes('repo')),
  );
  assert.ok(
    validateProduct(entry({ logo: 'javascript:alert(1)' })).some((e) => e.includes('logo')),
  );
  assert.ok(validateProduct(entry({ featured: 'yes' })).some((e) => e.includes('featured')));
  assert.ok(validateProduct(entry({ public: 'yes' })).some((e) => e.includes('public')));
});

test('validateProduct 缺必填字段时报错', () => {
  const missing = entry();
  delete missing.slug;
  assert.ok(validateProduct(missing).some((e) => e.includes('slug')));
  const missingFeatures = entry();
  delete missingFeatures.features;
  assert.ok(validateProduct(missingFeatures).some((e) => e.includes('features')));
});

test('validateProductList 空列表合法，重复 slug 与全非公开被拒绝', () => {
  assert.deepEqual(validateProductList([]), []);
  assert.deepEqual(validateProductList([entry()]), []);
  const dup = validateProductList([entry(), entry({ name: 'Another' })]);
  assert.ok(dup.some((e) => e.includes('slug') && e.includes('重复')));
  assert.ok(
    validateProductList([entry({ public: false })]).some((e) => e.includes('public')),
  );
});

test('validateProductList featured 条目必须 public', () => {
  const errors = validateProductList([entry({ public: false, featured: true })]);
  assert.ok(errors.some((e) => e.includes('featured')));
});

test('publicProducts 过滤非公开条目，findProductBySlug 按 slug 查找', () => {
  const list = [
    entry(),
    entry({ slug: 'hidden-product', name: 'Hidden', public: false, featured: false }),
  ];
  assert.deepEqual(
    publicProducts(list).map((item) => item.slug),
    ['smart-scheduler'],
  );
  assert.equal(findProductBySlug(list, 'smart-scheduler')?.name, 'Smart Scheduler');
  assert.equal(findProductBySlug(list, 'nope'), undefined);
  assert.equal(findProductBySlug(list, ''), undefined);
});

test('productStatusKey 将四态映射为 data 属性安全的 kebab 值', () => {
  assert.equal(productStatusKey('Released'), 'released');
  assert.equal(productStatusKey('Beta'), 'beta');
  assert.equal(productStatusKey('In Development'), 'in-development');
  assert.equal(productStatusKey('Discontinued'), 'discontinued');
});

test('productHref 构造双语列表页地址', () => {
  assert.equal(productHref('zh'), '/products/');
  assert.equal(productHref('en'), '/en/products/');
});
