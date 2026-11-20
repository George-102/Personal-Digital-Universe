import type { LocaleText, Product, ProductStatus } from '../content/types.ts';

/** PRD US-013：产品发布状态严格四值（与 ProjectStatus 两套枚举不混用） */
export const PRODUCT_STATUS = [
  'Released',
  'Beta',
  'In Development',
  'Discontinued',
] as const satisfies readonly ProductStatus[];

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const LOCAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9/_.\-]*$/;

export function isValidProductSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** GitHub 仓库全名 owner/name；拒绝协议与协议相对 URL */
export function isValidProductRepo(value: unknown): value is string {
  return typeof value === 'string' && REPO_PATTERN.test(value) && !value.includes('//');
}

/** 访问/仓库/图片链接白名单：站内路径或 https 外链；拒绝 javascript:/http:/协议相对 */
export function isValidProductUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return (
    LOCAL_PATH_PATTERN.test(value) ||
    (/^https:\/\//.test(value) && !/^https:\/\//.test(value.slice(8)))
  );
}

function isLocaleText(value: unknown): value is LocaleText {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.zh === 'string' &&
    record.zh.trim().length > 0 &&
    typeof record.en === 'string' &&
    record.en.trim().length > 0
  );
}

function isLocaleTextList(value: unknown): value is LocaleText[] {
  return Array.isArray(value) && value.length > 0 && value.every(isLocaleText);
}

function isStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && (PRODUCT_STATUS as readonly string[]).includes(value);
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateProduct(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['products: 条目必须是对象'];
  }
  const record = item as Partial<Product>;

  if (!isValidProductSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (typeof record.name !== 'string' || record.name.trim().length === 0) {
    errors.push(`name: 必须是非空字符串，实际 "${String(record.name)}"`);
  }
  if (!isLocaleText(record.description)) {
    errors.push('description: 必须是含非空 zh/en 的双语字段');
  }
  if (!isLocaleTextList(record.features)) {
    errors.push('features: 必须是非空且每项含 zh/en 的双语数组');
  }
  if (record.detail !== undefined && record.detail !== null && !isLocaleText(record.detail)) {
    errors.push('detail: 必须是含非空 zh/en 的双语字段');
  }
  if (!isStatus(record.status)) {
    errors.push(`status: 非法值 "${String(record.status)}"，允许: ${PRODUCT_STATUS.join(' | ')}`);
  }
  if (typeof record.featured !== 'boolean') {
    errors.push('featured: 必须是布尔值');
  }
  if (typeof record.public !== 'boolean') {
    errors.push('public: 必须是布尔值');
  }
  for (const field of ['logo', 'cover', 'url'] as const) {
    const value = record[field];
    if (value !== undefined && value !== null && value !== '' && !isValidProductUrl(value)) {
      errors.push(`${field}: 只允许站内路径或 https 外链，非法值 "${String(value)}"`);
    }
  }
  if (record.repo !== undefined && record.repo !== null && record.repo !== '' && !isValidProductRepo(record.repo)) {
    errors.push(`repo: 只允许 owner/name 格式，非法值 "${String(record.repo)}"`);
  }
  return errors;
}

/**
 * 整表校验：空列表合法（无内容时不渲染空入口，同 US-018 contact）；
 * 非空时逐条合法、slug 唯一、至少一条 public、featured 必须 public。
 */
export function validateProductList(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return ['products: 必须是数组'];
  }
  if (items.length === 0) return [];

  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateProduct(item)) {
      errors.push(`products[${index}]: ${message}`);
    }
    const record = item as Partial<Product> | null;
    if (record && typeof record === 'object') {
      if (isValidProductSlug(record.slug)) {
        if (seenSlugs.has(record.slug)) {
          errors.push(`products[${index}]: slug 重复 "${record.slug}"`);
        } else {
          seenSlugs.add(record.slug);
        }
      }
      if (record.public === true) hasPublic = true;
      if (record.featured === true && record.public !== true) {
        errors.push(`products[${index}]: featured 条目必须 public`);
      }
    }
  });

  if (!hasPublic) {
    errors.push('products: 至少需要一条 public 产品');
  }
  return errors;
}

export function publicProducts(items: readonly Product[]): Product[] {
  return items.filter((item) => item.public);
}

export function findProductBySlug(
  items: readonly Product[],
  slug: string | null | undefined,
): Product | undefined {
  if (!slug) return undefined;
  return items.find((item) => item.slug === slug);
}

/** PRD 四态 → data 属性安全 kebab 值 */
export function productStatusKey(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    Released: 'released',
    Beta: 'beta',
    'In Development': 'in-development',
    Discontinued: 'discontinued',
  };
  return map[status];
}

export type ProductLang = 'zh' | 'en';

/** 列表页路径（带尾斜杠，静态导出目录形式） */
export function productHref(lang: ProductLang): string {
  return lang === 'en' ? '/en/products/' : '/products/';
}
