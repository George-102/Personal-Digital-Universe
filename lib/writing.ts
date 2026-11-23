import type { LocaleText, WritingStatus, WritingWork } from '../content/types.ts';

/** PRD US-014：作品状态严格三值（独立枚举，不与 Product/Project/Publication 混用） */
export const WRITING_STATUS = ['Writing', 'In Progress', 'Completed'] as const satisfies readonly WritingStatus[];

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const LOCAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9/_.\-]*$/;

export function isValidWritingSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** 阅读入口/封面/外链白名单：站内路径或 https 外链；拒绝 javascript:/http:/协议相对 */
export function isValidWritingUrl(value: unknown): value is string {
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

function isStatus(value: unknown): value is WritingStatus {
  return typeof value === 'string' && (WRITING_STATUS as readonly string[]).includes(value);
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateWriting(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['writing: 条目必须是对象'];
  }
  const record = item as Partial<WritingWork>;

  if (!isValidWritingSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (!isLocaleText(record.title)) {
    errors.push('title: 必须是含非空 zh/en 的双语字段');
  }
  if (record.type !== 'novel' && record.type !== 'article') {
    errors.push(`type: 非法值 "${String(record.type)}"，允许: novel | article`);
  }
  if (!isStatus(record.status)) {
    errors.push(`status: 非法值 "${String(record.status)}"，允许: ${WRITING_STATUS.join(' | ')}`);
  }
  if (!isLocaleText(record.description)) {
    errors.push('description: 必须是含非空 zh/en 的双语字段');
  }
  if (typeof record.featured !== 'boolean') {
    errors.push('featured: 必须是布尔值');
  }
  if (typeof record.public !== 'boolean') {
    errors.push('public: 必须是布尔值');
  }

  if (record.writtenAt !== undefined && record.writtenAt !== null && typeof record.writtenAt !== 'string') {
    errors.push(`writtenAt: 必须是字符串，实际 "${String(record.writtenAt)}"`);
  }
  for (const field of ['worldview', 'concept'] as const) {
    const value = record[field];
    if (value !== undefined && value !== null && !isLocaleText(value)) {
      errors.push(`${field}: 必须是含非空 zh/en 的双语字段`);
    }
  }
  for (const field of ['background', 'characters', 'detail'] as const) {
    const value = record[field];
    if (value !== undefined && value !== null && !isLocaleTextList(value)) {
      errors.push(`${field}: 必须是非空且每项含 zh/en 的双语数组`);
    }
  }
  for (const field of ['cover', 'externalUrl', 'readingUrl'] as const) {
    const value = record[field];
    if (value !== undefined && value !== null && value !== '' && !isValidWritingUrl(value)) {
      errors.push(`${field}: 只允许站内路径或 https 外链，非法值 "${String(value)}"`);
    }
  }
  return errors;
}

/**
 * 整表校验：空列表合法（无内容时不渲染空入口，同 US-013 products）；
 * 非空时逐条合法、slug 唯一、至少一条 public、featured 必须 public。
 */
export function validateWritingList(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return ['writing: 必须是数组'];
  }
  if (items.length === 0) return [];

  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateWriting(item)) {
      errors.push(`writing[${index}]: ${message}`);
    }
    const record = item as Partial<WritingWork> | null;
    if (record && typeof record === 'object') {
      if (isValidWritingSlug(record.slug)) {
        if (seenSlugs.has(record.slug)) {
          errors.push(`writing[${index}]: slug 重复 "${record.slug}"`);
        } else {
          seenSlugs.add(record.slug);
        }
      }
      if (record.public === true) hasPublic = true;
      if (record.featured === true && record.public !== true) {
        errors.push(`writing[${index}]: featured 条目必须 public`);
      }
    }
  });

  if (!hasPublic) {
    errors.push('writing: 至少需要一条 public 作品');
  }
  return errors;
}

export function publicWriting(items: readonly WritingWork[]): WritingWork[] {
  return items.filter((item) => item.public);
}

export function findWritingBySlug(
  items: readonly WritingWork[],
  slug: string | null | undefined,
): WritingWork | undefined {
  if (!slug) return undefined;
  return items.find((item) => item.slug === slug);
}

/** PRD 三态 → data 属性安全 kebab 值 */
export function writingStatusKey(status: WritingStatus): string {
  const map: Record<WritingStatus, string> = {
    Writing: 'writing',
    'In Progress': 'in-progress',
    Completed: 'completed',
  };
  return map[status];
}

export type WritingLang = 'zh' | 'en';

/** 列表页路径（带尾斜杠，静态导出目录形式） */
export function writingHref(lang: WritingLang): string {
  return lang === 'en' ? '/en/writing/' : '/writing/';
}

/** 详情页路径 */
export function writingDetailHref(slug: string, lang: WritingLang): string {
  return lang === 'en' ? `/en/writing/${slug}/` : `/writing/${slug}/`;
}
