import { test, expect } from 'vitest';
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
  expect([...PRODUCT_STATUS].sort()).toEqual([
    'Beta',
    'Discontinued',
    'In Development',
    'Released',
  ]);
});

test('isValidProductSlug 只允许小写 kebab-case', () => {
  expect(isValidProductSlug('smart-scheduler')).toBe(true);
  expect(isValidProductSlug('note-keeper-2')).toBe(true);
  expect(isValidProductSlug('Bad Slug')).toBe(false);
  expect(isValidProductSlug('UPPER')).toBe(false);
  expect(isValidProductSlug('-lead')).toBe(false);
  expect(isValidProductSlug('trail-')).toBe(false);
  expect(isValidProductSlug('')).toBe(false);
});

test('isValidProductUrl 只接受 https 或站内路径，拒绝 javascript/协议相对', () => {
  expect(isValidProductUrl('https://example.com/app')).toBe(true);
  expect(isValidProductUrl('/products/demo')).toBe(true);
  expect(isValidProductUrl('http://example.com')).toBe(false);
  expect(isValidProductUrl('javascript:alert(1)')).toBe(false);
  expect(isValidProductUrl('//example.com')).toBe(false);
  expect(isValidProductUrl('ftp://example.com')).toBe(false);
});

test('isValidProductRepo 只接受 owner/name 形式', () => {
  expect(isValidProductRepo('George-102/smart-scheduler')).toBe(true);
  expect(isValidProductRepo('George-102')).toBe(false);
  expect(isValidProductRepo('/repo')).toBe(false);
  expect(isValidProductRepo('own er/repo')).toBe(false);
  expect(isValidProductRepo('javascript:alert(1)')).toBe(false);
});

test('validateProduct 通过合法条目（含可选 detail/logo/cover/url/repo）', () => {
  expect(validateProduct(
      entry({
        logo: '/images/product-logo.svg',
        cover: 'https://example.com/cover.png',
        url: 'https://example.com/app',
        repo: 'George-102/smart-scheduler',
      }),
    )).toEqual([]);
  expect(validateProduct(entry({ detail: undefined, url: undefined }))).toEqual([]);
});

test('validateProduct 拒绝非法 slug、status', () => {
  expect(validateProduct(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug'))).toBeTruthy();
  expect(validateProduct(entry({ status: 'Done' })).some((e) => e.includes('status'))).toBeTruthy();
  expect(validateProduct(entry({ status: 'In progress' })).some((e) => e.includes('status'))).toBeTruthy();
});

test('validateProduct 拒绝单语字段、空功能列表与非法可选字段', () => {
  expect(validateProduct(entry({ description: { zh: '只有中文' } })).some((e) =>
      e.includes('description'),
    )).toBeTruthy();
  expect(validateProduct(entry({ features: [] })).some((e) => e.includes('features'))).toBeTruthy();
  expect(validateProduct(entry({ features: [{ zh: '只有中文' }] })).some((e) =>
      e.includes('features'),
    )).toBeTruthy();
  expect(validateProduct(entry({ detail: { zh: '只有中文' } })).some((e) => e.includes('detail'))).toBeTruthy();
  expect(validateProduct(entry({ url: 'javascript:alert(1)' })).some((e) => e.includes('url'))).toBeTruthy();
  expect(validateProduct(entry({ repo: 'javascript:alert(1)' })).some((e) => e.includes('repo'))).toBeTruthy();
  expect(validateProduct(entry({ logo: 'javascript:alert(1)' })).some((e) => e.includes('logo'))).toBeTruthy();
  expect(validateProduct(entry({ featured: 'yes' })).some((e) => e.includes('featured'))).toBeTruthy();
  expect(validateProduct(entry({ public: 'yes' })).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateProduct 缺必填字段时报错', () => {
  const missing = entry();
  delete missing.slug;
  expect(validateProduct(missing).some((e) => e.includes('slug'))).toBeTruthy();
  const missingFeatures = entry();
  delete missingFeatures.features;
  expect(validateProduct(missingFeatures).some((e) => e.includes('features'))).toBeTruthy();
});

test('validateProductList 空列表合法，重复 slug 与全非公开被拒绝', () => {
  expect(validateProductList([])).toEqual([]);
  expect(validateProductList([entry()])).toEqual([]);
  const dup = validateProductList([entry(), entry({ name: 'Another' })]);
  expect(dup.some((e) => e.includes('slug') && e.includes('重复'))).toBeTruthy();
  expect(validateProductList([entry({ public: false })]).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateProductList featured 条目必须 public', () => {
  const errors = validateProductList([entry({ public: false, featured: true })]);
  expect(errors.some((e) => e.includes('featured'))).toBeTruthy();
});

test('publicProducts 过滤非公开条目，findProductBySlug 按 slug 查找', () => {
  const list = [
    entry(),
    entry({ slug: 'hidden-product', name: 'Hidden', public: false, featured: false }),
  ];
  expect(publicProducts(list).map((item) => item.slug)).toEqual(['smart-scheduler']);
  expect(findProductBySlug(list, 'smart-scheduler')?.name).toBe('Smart Scheduler');
  expect(findProductBySlug(list, 'nope')).toBe(undefined);
  expect(findProductBySlug(list, '')).toBe(undefined);
});

test('productStatusKey 将四态映射为 data 属性安全的 kebab 值', () => {
  expect(productStatusKey('Released')).toBe('released');
  expect(productStatusKey('Beta')).toBe('beta');
  expect(productStatusKey('In Development')).toBe('in-development');
  expect(productStatusKey('Discontinued')).toBe('discontinued');
});

test('productHref 构造双语列表页地址', () => {
  expect(productHref('zh')).toBe('/products/');
  expect(productHref('en')).toBe('/en/products/');
});
