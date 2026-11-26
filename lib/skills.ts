import type { LocaleText, Skill, SkillCategory, SkillRelated } from '../content/types.ts';

/** PRD US-007：六个技术领域，kebab-case 同时是分组键与 DOM 标识 */
export const SKILL_CATEGORIES = [
  'computer-science',
  'software-engineering',
  'full-stack',
  'artificial-intelligence',
  'research-computing',
  'tools-technologies',
] as const satisfies readonly SkillCategory[];

/**
 * DoD 硬约束：不展示熟练度百分比。
 * 这些键在类型层不存在，构建期校验仍显式拒绝——即使有人用 as any 注入也被 build 拦下。
 */
export const FORBIDDEN_PROFICIENCY_FIELDS = [
  'proficiency',
  'level',
  'percent',
  'percentage',
  'rating',
  'score',
  'mastery',
  'years',
  'yearsOfExperience',
  'experienceYears',
  'confidence',
] as const;

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const LOCAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9/_.\-]*$/;

export function isValidSkillSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** 关联链接白名单：站内路径或 https 外链；拒绝 javascript:/http:/协议相对 */
export function isValidSkillLink(value: unknown): value is string {
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

function isCategory(value: unknown): value is SkillCategory {
  return typeof value === 'string' && (SKILL_CATEGORIES as readonly string[]).includes(value);
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateSkill(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['skills: 条目必须是对象'];
  }
  const record = item as Partial<Skill> & Record<string, unknown>;

  if (!isValidSkillSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (typeof record.name !== 'string' || record.name.trim().length === 0) {
    errors.push(`name: 必须是非空字符串，实际 "${String(record.name)}"`);
  }
  if (!isCategory(record.category)) {
    errors.push(
      `category: 非法值 "${String(record.category)}"，允许: ${SKILL_CATEGORIES.join(' | ')}`,
    );
  }
  if (!isLocaleText(record.description)) {
    errors.push('description: 必须是含非空 zh/en 的双语字段');
  }
  if (!isLocaleText(record.detail)) {
    errors.push('detail: 必须是含非空 zh/en 的双语字段');
  }
  if (!Array.isArray(record.tags) || !record.tags.every((tag) => typeof tag === 'string')) {
    errors.push('tags: 必须是字符串数组');
  }
  if (typeof record.featured !== 'boolean') {
    errors.push('featured: 必须是布尔值');
  }
  if (typeof record.public !== 'boolean') {
    errors.push('public: 必须是布尔值');
  }

  if (record.related !== undefined && record.related !== null) {
    if (!Array.isArray(record.related)) {
      errors.push('related: 必须是数组');
    } else {
      record.related.forEach((raw: unknown, index: number) => {
        const link = raw as Partial<SkillRelated> | null;
        if (link === null || typeof link !== 'object') {
          errors.push(`related[${index}]: 必须是对象`);
          return;
        }
        if (!isLocaleText(link.label)) {
          errors.push(`related[${index}].label: 必须是含非空 zh/en 的双语字段`);
        }
        if (!isValidSkillLink(link.href)) {
          errors.push(`related[${index}].href: 只允许站内路径或 https 外链，非法值 "${String(link.href)}"`);
        }
      });
    }
  }

  for (const field of FORBIDDEN_PROFICIENCY_FIELDS) {
    if (field in record) {
      errors.push(`${field}: 禁止熟练度字段（不展示百分比或自评等级）`);
    }
  }

  return errors;
}

/**
 * 整表校验：空列表合法（无内容时不渲染空入口）；
 * 非空时逐条合法、slug 唯一、至少一条 public、featured 必须 public。
 */
export function validateSkillList(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return ['skills: 必须是数组'];
  }
  if (items.length === 0) return [];

  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateSkill(item)) {
      errors.push(`skills[${index}]: ${message}`);
    }
    const record = item as Partial<Skill> | null;
    if (record && typeof record === 'object') {
      if (isValidSkillSlug(record.slug)) {
        if (seenSlugs.has(record.slug)) {
          errors.push(`skills[${index}]: slug 重复 "${record.slug}"`);
        } else {
          seenSlugs.add(record.slug);
        }
      }
      if (record.public === true) hasPublic = true;
      if (record.featured === true && record.public !== true) {
        errors.push(`skills[${index}]: featured 条目必须 public`);
      }
    }
  });

  if (!hasPublic) {
    errors.push('skills: 至少需要一条 public 技能');
  }
  return errors;
}

export function publicSkills(items: readonly Skill[]): Skill[] {
  return items.filter((item) => item.public);
}

/** 固定返回六个领域分组（空领域为 []），UI 自行决定空组是否渲染 */
export function skillsByCategory(items: readonly Skill[]): Record<SkillCategory, Skill[]> {
  const groups = {} as Record<SkillCategory, Skill[]>;
  for (const category of SKILL_CATEGORIES) groups[category] = [];
  for (const item of items) groups[item.category].push(item);
  return groups;
}

export function findSkillBySlug(
  items: readonly Skill[],
  slug: string | null | undefined,
): Skill | undefined {
  if (!slug) return undefined;
  // T-002c 公开过滤：隐藏技能不能被任何入口命中，即使调用方误传原始清单
  return items.find((item) => item.public && item.slug === slug);
}

/** 已是 kebab 值，独立函数供 UI/测试以同一来源读取 */
export function skillCategoryKey(category: SkillCategory): string {
  return category;
}

/** 列表页路径（带尾斜杠，静态导出目录形式） */
export function skillHref(lang: 'zh' | 'en'): string {
  return lang === 'en' ? '/en/skills/' : '/skills/';
}
