import type { ContentCategory } from './types.ts';

type Rule = {
  required: string[];
  localeText: string[];
  enums?: Record<string, readonly string[]>;
};

const RULES: Record<ContentCategory, Rule> = {
  profile: {
    required: ['name', 'tagline', 'status', 'links', 'public'],
    localeText: ['name', 'tagline', 'status'],
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

export function validateEntry(category: ContentCategory, entry: unknown): void {
  const rule = RULES[category];
  if (!rule) throw new Error(`未知内容类别: ${category}`);
  if (entry === null || typeof entry !== 'object') {
    throw new Error(`${category}: 条目必须是对象`);
  }
  const record = entry as Record<string, unknown>;

  for (const field of rule.required) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      throw new Error(`${category}: 缺少必填字段 ${field}`);
    }
  }
  if (typeof record.public !== 'boolean') {
    throw new Error(`${category}: public 必须是布尔值`);
  }
  for (const field of rule.localeText) {
    const value = record[field];
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (!isLocaleText(item)) {
        throw new Error(`${category}: ${field} 必须是含 zh/en 的双语字段`);
      }
    }
  }
  for (const [field, allowed] of Object.entries(rule.enums ?? {})) {
    if (!allowed.includes(record[field] as string)) {
      throw new Error(`${category}: ${field} 非法值 "${record[field]}"，允许: ${allowed.join(' | ')}`);
    }
  }
}

export function filterPublic<T extends { public: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.public);
}