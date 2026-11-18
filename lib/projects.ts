import type {
  LocaleText,
  Project,
  ProjectCategory,
  ProjectStatus,
} from '../content/types.ts';

/** PRD US-012：五分类与四状态（严格枚举，构建期校验） */
export const PROJECT_CATEGORIES = [
  'ai-ml',
  'web',
  'dev-tools',
  'research',
  'other',
] as const satisfies readonly ProjectCategory[];

export const PROJECT_STATUS = [
  'active',
  'maintained',
  'archived',
  'completed',
] as const satisfies readonly ProjectStatus[];

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const LOCAL_IMAGE_PATTERN = /^\/(?!\/)[A-Za-z0-9/_.\-]+$/;

export function isValidProjectSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** GitHub 仓库全名 `owner/name`；拒绝协议与协议相对 URL */
export function isValidRepoFullName(value: unknown): value is string {
  return typeof value === 'string' && REPO_PATTERN.test(value) && !value.includes('//');
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

function isNonEmptyStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function isCategory(value: unknown): value is ProjectCategory {
  return typeof value === 'string' && (PROJECT_CATEGORIES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUS as readonly string[]).includes(value);
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateProject(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['projects: 条目必须是对象'];
  }
  const record = item as Partial<Project>;

  if (!isValidProjectSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (!isValidRepoFullName(record.repo)) {
    errors.push(`repo: 非法值 "${String(record.repo)}"（要求 owner/name）`);
  }
  if (typeof record.name !== 'string' || record.name.trim().length === 0) {
    errors.push(`name: 必须是非空字符串，实际 "${String(record.name)}"`);
  }
  if (!isLocaleText(record.description)) {
    errors.push('description: 必须是含非空 zh/en 的双语字段');
  }
  if (record.detail !== undefined && record.detail !== null && !isLocaleText(record.detail)) {
    errors.push('detail: 必须是含非空 zh/en 的双语字段');
  }
  if (!isNonEmptyStringList(record.stack)) {
    errors.push('stack: 必须是非空且每项非空的字符串数组');
  }
  if (!isCategory(record.category)) {
    errors.push(`category: 非法值 "${String(record.category)}"，允许: ${PROJECT_CATEGORIES.join(' | ')}`);
  }
  if (!isStatus(record.status)) {
    errors.push(`status: 非法值 "${String(record.status)}"，允许: ${PROJECT_STATUS.join(' | ')}`);
  }
  if (typeof record.featured !== 'boolean') {
    errors.push('featured: 必须是布尔值');
  }
  if (typeof record.public !== 'boolean') {
    errors.push('public: 必须是布尔值');
  }
  if (record.stars !== undefined && record.stars !== null) {
    if (!Number.isInteger(record.stars) || (record.stars as number) < 0) {
      errors.push(`stars: 必须是非负整数，实际 "${String(record.stars)}"`);
    }
  }
  if (record.image !== undefined && record.image !== null && record.image !== '') {
    const image = record.image;
    const valid =
      typeof image === 'string' &&
      (LOCAL_IMAGE_PATTERN.test(image) ||
        (/^https:\/\//.test(image) && !/^https:\/\//.test(image.slice(8))));
    if (!valid) {
      errors.push(`image: 只允许站内路径或 https 外链，非法值 "${String(image)}"`);
    }
  }
  if (record.repoPrivate !== undefined && typeof record.repoPrivate !== 'boolean') {
    errors.push('repoPrivate: 必须是布尔值');
  }
  return errors;
}

/**
 * 整表校验：空列表合法（无内容时不渲染空入口，同 US-018 contact）；
 * 非空时逐条合法、slug/repo 唯一、至少一条 public、featured 必须 public。
 */
export function validateProjectList(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return ['projects: 必须是数组'];
  }
  if (items.length === 0) return [];

  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  const seenRepos = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateProject(item)) {
      errors.push(`projects[${index}]: ${message}`);
    }
    const record = item as Partial<Project> | null;
    if (record && typeof record === 'object') {
      if (isValidProjectSlug(record.slug)) {
        if (seenSlugs.has(record.slug)) {
          errors.push(`projects[${index}]: slug 重复 "${record.slug}"`);
        } else {
          seenSlugs.add(record.slug);
        }
      }
      if (isValidRepoFullName(record.repo)) {
        if (seenRepos.has(record.repo)) {
          errors.push(`projects[${index}]: repo 重复 "${record.repo}"`);
        } else {
          seenRepos.add(record.repo);
        }
      }
      if (record.public === true) hasPublic = true;
      if (record.featured === true && record.public !== true) {
        errors.push(`projects[${index}]: featured 条目必须 public`);
      }
    }
  });

  if (!hasPublic) {
    errors.push('projects: 至少需要一条 public 项目');
  }
  return errors;
}

export function publicProjects(items: readonly Project[]): Project[] {
  return items.filter((item) => item.public);
}

export function findProjectBySlug(
  items: readonly Project[],
  slug: string | null | undefined,
): Project | undefined {
  if (!slug) return undefined;
  return items.find((item) => item.slug === slug);
}

/** GitHub 仓库页面 URL（repoPrivate 条目不渲染此链接） */
export function githubRepoUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

export type ProjectLang = 'zh' | 'en';

/** 列表页路径（带尾斜杠，静态导出目录形式） */
export function projectHref(lang: ProjectLang): string {
  return lang === 'en' ? '/en/projects/' : '/projects/';
}
