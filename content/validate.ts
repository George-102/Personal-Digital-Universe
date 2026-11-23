import type { ContentCategory } from './types.ts';
import { PORTRAIT_PATH, CV_PATH } from '../lib/about.ts';
import { isValidJourneyLink, normalizeJourneyDate } from '../lib/journey.ts';
import { validateContact } from '../lib/contact.ts';

type Rule = {
  required: string[];
  localeText: string[];
  enums?: Record<string, readonly string[]>;
  /** 可选双语数组路径（如 about.bio）：存在时必须是非空 LocaleText[] */
  optionalLocaleLists?: string[];
  /** 可选站内资源路径 → 允许的格式 */
  optionalAssets?: Record<string, RegExp>;
  /** 可选链接字段：站内路径或 https 外链 */
  optionalLinks?: string[];
  /** 可选时间区间：结束时间不得早于开始时间 */
  dateRange?: { start: string; end: string };
  /** US-018a：可选 Contact 对象路径，交给 lib/contact.ts 校验 */
  optionalContactObjects?: string[];
};

const RULES: Record<ContentCategory, Rule> = {
  profile: {
    required: ['name', 'tagline', 'status', 'links', 'public'],
    localeText: ['name', 'tagline', 'status'],
    optionalLocaleLists: ['about.bio', 'about.highlights'],
    optionalAssets: { 'about.portrait': PORTRAIT_PATH, 'about.cvUrl': CV_PATH },
    optionalContactObjects: ['contact'],
  },
  journey: {
    required: ['date', 'title', 'summary', 'category', 'public'],
    localeText: ['title', 'summary'],
    enums: {
      category: ['education', 'research', 'opensource', 'product', 'competition', 'work', 'writing'],
    },
    optionalLocaleLists: ['detail'],
    optionalLinks: ['link'],
    dateRange: { start: 'date', end: 'endDate' },
  },
  research: {
    required: ['slug', 'title', 'overview', 'problems', 'methods', 'keywords', 'status', 'public'],
    localeText: ['title', 'overview', 'problems'],
    enums: { status: ['In Progress', 'Completed'] },
    optionalLocaleLists: ['detail'],
    optionalLinks: ['link'],
  },
  publications: {
    required: ['title', 'authors', 'year', 'status', 'public'],
    localeText: [],
    enums: { status: ['Published', 'Preprint', 'In Progress'] },
  },
  projects: {
    required: ['slug', 'repo', 'name', 'description', 'stack', 'category', 'status', 'featured', 'public'],
    localeText: ['description'],
    enums: {
      category: ['ai-ml', 'web', 'dev-tools', 'research', 'other'],
      status: ['active', 'maintained', 'archived', 'completed'],
    },
  },
  products: {
    // US-013a：slug/featured 必填；features（必填双语数组）、detail（可选双语）与
    // 链接白名单由 lib/products.ts 的 validateProduct 在 prebuild 强校验。
    required: ['slug', 'name', 'description', 'status', 'featured', 'public'],
    localeText: ['description'],
    enums: { status: ['Released', 'Beta', 'In Development', 'Discontinued'] },
    // features 必填由 lib/products.ts 强校验；此处双重校验其双语结构。
    // repo 是 owner/name 格式（非 URL），只由 lib/products.ts 校验，不放 optionalLinks。
    optionalLocaleLists: ['features'],
    optionalLinks: ['url', 'logo', 'cover'],
  },
  writing: {
    // US-014a：featured 必填；可选双语字段/数组/链接白名单由 lib/writing.ts 强校验
    required: ['slug', 'title', 'type', 'status', 'description', 'featured', 'public'],
    localeText: ['title', 'description'],
    enums: { type: ['novel', 'article'], status: ['Writing', 'In Progress', 'Completed'] },
    optionalLocaleLists: ['background', 'characters', 'detail'],
    optionalLinks: ['cover', 'externalUrl', 'readingUrl'],
  },
  reading: {
    required: ['title', 'author', 'public'],
    localeText: [],
  },
  interests: {
    required: ['field', 'public'],
    localeText: [],
  },
};

function isLocaleText(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.zh === 'string' && v.zh.length > 0 && typeof v.en === 'string' && v.en.length > 0;
}

/** 支持嵌套路径：about.bio → record.about?.bio */
function readField(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, record);
}

export function validateEntry(category: ContentCategory, entry: unknown): void {
  const rule = RULES[category];
  if (!rule) throw new Error(`未知内容类别: ${category}`);
  if (entry === null || typeof entry !== 'object') {
    throw new Error(`${category}: 条目必须是对象`);
  }
  const record = entry as Record<string, unknown>;

  for (const field of rule.required) {
    const value = readField(record, field);
    if (value === undefined || value === null || value === '') {
      throw new Error(`${category}: 缺少必填字段 ${field}`);
    }
  }
  if (typeof record.public !== 'boolean') {
    throw new Error(`${category}: public 必须是布尔值`);
  }
  for (const field of rule.localeText) {
    const value = readField(record, field);
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (!isLocaleText(item)) {
        throw new Error(`${category}: ${field} 必须是含 zh/en 的双语字段`);
      }
    }
  }
  for (const [field, allowed] of Object.entries(rule.enums ?? {})) {
    const value = readField(record, field);
    if (!allowed.includes(value as string)) {
      throw new Error(`${category}: ${field} 非法值 "${String(value)}"，允许: ${allowed.join(' | ')}`);
    }
  }
  // US-006a：可选双语数组一旦配置就必须是非空且每条含 zh/en
  for (const field of rule.optionalLocaleLists ?? []) {
    const value = readField(record, field);
    if (value === undefined || value === null) continue;
    if (!Array.isArray(value) || value.length === 0 || !value.every(isLocaleText)) {
      throw new Error(`${category}: ${field} 必须是非空的含 zh/en 双语数组`);
    }
  }
  // US-006a：可选资源路径只允许站内安全静态资源
  for (const [field, pattern] of Object.entries(rule.optionalAssets ?? {})) {
    const value = readField(record, field);
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' || !pattern.test(value)) {
      throw new Error(`${category}: ${field} 必须是站内安全路径，非法值 "${String(value)}"`);
    }
  }
  // US-008a：可选链接只允许站内路径或 https 外链
  for (const field of rule.optionalLinks ?? []) {
    const value = readField(record, field);
    if (value === undefined || value === null || value === '') continue;
    if (!isValidJourneyLink(value)) {
      throw new Error(`${category}: ${field} 只允许站内路径或 https 外链，非法值 "${String(value)}"`);
    }
  }
  // US-018a：Contact 对象一旦配置就必须是合法的联系方式（空 links 合法）
  for (const field of rule.optionalContactObjects ?? []) {
    const value = readField(record, field);
    if (value === undefined || value === null) continue;
    const errors = validateContact(value);
    if (errors.length > 0) {
      throw new Error(`${category}: ${field} 配置校验失败：${errors.join('；')}`);
    }
  }
  // US-008a：可选时间区间，结束不得早于开始
  if (rule.dateRange) {
    const { start, end } = rule.dateRange;
    const startValue = readField(record, start);
    const normalizedStart = normalizeJourneyDate(startValue);
    if (!normalizedStart) {
      throw new Error(`${category}: ${start} 非法或缺失 "${String(startValue)}"`);
    }
    const endValue = readField(record, end);
    if (endValue !== undefined && endValue !== null && endValue !== '') {
      const normalizedEnd = normalizeJourneyDate(endValue);
      if (!normalizedEnd) {
        throw new Error(`${category}: ${end} 非法 "${String(endValue)}"`);
      }
      if (normalizedEnd < normalizedStart) {
        throw new Error(`${category}: ${end} 不能早于 ${start}`);
      }
    }
  }
}

export function filterPublic<T extends { public: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.public);
}