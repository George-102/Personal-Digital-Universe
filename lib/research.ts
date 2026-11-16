import type { LocaleText, ResearchArea, ResearchStatus } from '../content/types.ts';
import { isValidJourneyLink } from './journey.ts';

/** PRD US-010：研究项目状态严格两值；未完成一律 In Progress */
export const RESEARCH_STATUS = ['In Progress', 'Completed'] as const;

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isValidResearchSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** 站内路径或 https 外链（复用 journey 链接规则，拒绝 javascript: / http: / 协议相对 URL） */
export function isValidResearchLink(value: unknown): value is string {
  return isValidJourneyLink(value);
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

function isResearchStatus(value: unknown): value is ResearchStatus {
  return typeof value === 'string' && (RESEARCH_STATUS as readonly string[]).includes(value);
}

function isNonEmptyStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function isLocaleTextList(value: unknown): value is LocaleText[] {
  return Array.isArray(value) && value.length > 0 && value.every(isLocaleText);
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateResearch(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['research: 条目必须是对象'];
  }
  const record = item as Partial<ResearchArea>;

  if (!isValidResearchSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (!isLocaleText(record.title)) {
    errors.push('title: 必须是含非空 zh/en 的双语字段');
  }
  if (!isLocaleText(record.overview)) {
    errors.push('overview: 必须是含非空 zh/en 的双语字段');
  }
  if (!isLocaleTextList(record.problems)) {
    errors.push('problems: 必须是非空且每项含 zh/en 的双语数组');
  }
  if (!isNonEmptyStringList(record.methods)) {
    errors.push('methods: 必须是非空字符串数组');
  }
  if (!isNonEmptyStringList(record.keywords)) {
    errors.push('keywords: 必须是非空字符串数组');
  }
  if (!isResearchStatus(record.status)) {
    errors.push(`status: 非法值 "${String(record.status)}"，允许: ${RESEARCH_STATUS.join(' | ')}`);
  }
  if (typeof record.public !== 'boolean') {
    errors.push('public: 必须是布尔值');
  }
  if (record.detail !== undefined && record.detail !== null) {
    if (!isLocaleTextList(record.detail)) {
      errors.push('detail: 必须是非空且每项含 zh/en 的双语数组');
    }
  }
  if (record.link !== undefined && record.link !== null && record.link !== '') {
    if (!isValidResearchLink(record.link)) {
      errors.push(`link: 只允许站内路径或 https 外链，非法值 "${String(record.link)}"`);
    }
  }
  return errors;
}

/** 整表校验：非空、逐条合法、slug 唯一、至少一条 public。 */
export function validateResearchList(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return ['research: 必须是数组'];
  }
  if (items.length === 0) {
    return ['research: 至少需要一条研究方向'];
  }
  const errors: string[] = [];
  const seen = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateResearch(item)) {
      errors.push(`research[${index}]: ${message}`);
    }
    const slug = (item as Partial<ResearchArea>)?.slug;
    if (typeof slug === 'string' && slug.length > 0) {
      if (seen.has(slug)) {
        errors.push(`research[${index}]: slug 重复 "${slug}"`);
      } else {
        seen.add(slug);
      }
    }
    if ((item as Partial<ResearchArea>)?.public === true) {
      hasPublic = true;
    }
  });

  if (!hasPublic) {
    errors.push('research: 至少需要一条 public 研究方向');
  }
  return errors;
}

export function findResearchBySlug(
  items: readonly ResearchArea[],
  slug: string | null | undefined,
): ResearchArea | undefined {
  if (!slug) return undefined;
  return items.find((item) => item.slug === slug);
}

export type ResearchLang = 'zh' | 'en';

/** 列表页路径（带尾斜杠，静态导出目录形式） */
export function researchHref(lang: ResearchLang): string {
  return lang === 'en' ? '/en/research/' : '/research/';
}

/** 详情页路径 */
export function researchDetailHref(slug: string, lang: ResearchLang): string {
  return `${researchHref(lang)}${slug}/`;
}
