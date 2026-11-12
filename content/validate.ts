import type { ContentCategory } from './types.ts';
import { PORTRAIT_PATH, CV_PATH } from '../lib/about.ts';

type Rule = {
  required: string[];
  localeText: string[];
  enums?: Record<string, readonly string[]>;
  /** 可选双语数组路径（如 about.bio）：存在时必须是非空 LocaleText[] */
  optionalLocaleLists?: string[];
  /** 可选站内资源路径 → 允许的格式 */
  optionalAssets?: Record<string, RegExp>;
};

const RULES: Record<ContentCategory, Rule> = {
  profile: {
    required: ['name', 'tagline', 'status', 'links', 'public'],
    localeText: ['name', 'tagline', 'status'],
    optionalLocaleLists: ['about.bio', 'about.highlights'],
    optionalAssets: { 'about.portrait': PORTRAIT_PATH, 'about.cvUrl': CV_PATH },
  },
  journey: {
    required: ['date', 'title', 'summary', 'category', 'public'],
    localeText: ['title', 'summary'],
    enums: {
      category: ['education', 'research', 'opensource', 'product', 'competition', 'work', 'writing'],
    },
  },
  research: {
    required: ['slug', 'title', 'problems', 'methods', 'status', 'public'],
    localeText: ['title'],
    enums: { status: ['In Progress', 'Completed'] },
  },
  publications: {
    required: ['title', 'authors', 'year', 'status', 'public'],
    localeText: [],
    enums: { status: ['Published', 'Preprint', 'In Progress'] },
  },
  projects: {
    required: ['repo', 'name', 'description', 'stack', 'featured', 'public'],
    localeText: ['description'],
  },
  products: {
    required: ['name', 'description', 'status', 'public'],
    localeText: ['description'],
    enums: { status: ['Released', 'Beta', 'In Development', 'Discontinued'] },
  },
  writing: {
    required: ['slug', 'title', 'type', 'status', 'description', 'public'],
    localeText: ['title', 'description'],
    enums: { type: ['novel', 'article'], status: ['Writing', 'In Progress', 'Completed'] },
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
}

export function filterPublic<T extends { public: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.public);
}