import rawCache from '../content/github-cache.json' with { type: 'json' };
import type { Project } from '../content/types.ts';

export type GithubRepoSnapshot = {
  stars?: number;
  language?: string | null;
  archived?: boolean;
};

export type GithubCache = {
  fetchedAt: string | null;
  repos: Record<string, GithubRepoSnapshot>;
};

/** 合并后的项目视图：动态字段来自构建期缓存，静态文案始终以 content 为准 */
export type ProjectWithCache = Project & {
  language?: string | null;
  archived?: boolean;
};

const EMPTY_CACHE: GithubCache = { fetchedAt: null, repos: {} };

/**
 * 防御式解析：缓存文件损坏或字段非法时回退空缓存并逐条丢弃坏条目，
 * 任何情况下都不让构建失败（PRD US-012 AC5）。
 */
export function parseGithubCache(value: unknown): GithubCache {
  if (value === null || typeof value !== 'object') return EMPTY_CACHE;
  const record = value as Record<string, unknown>;
  const fetchedAt = typeof record.fetchedAt === 'string' ? record.fetchedAt : null;
  const repos: Record<string, GithubRepoSnapshot> = {};
  if (record.repos !== null && typeof record.repos === 'object' && !Array.isArray(record.repos)) {
    for (const [key, entry] of Object.entries(record.repos as Record<string, unknown>)) {
      if (!key || entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
      const snapshot = entry as Record<string, unknown>;
      const clean: GithubRepoSnapshot = {};
      if (Number.isInteger(snapshot.stars) && (snapshot.stars as number) >= 0) {
        clean.stars = snapshot.stars as number;
      }
      if (typeof snapshot.language === 'string' || snapshot.language === null) {
        clean.language = snapshot.language as string | null;
      }
      if (typeof snapshot.archived === 'boolean') clean.archived = snapshot.archived;
      if (Object.keys(clean).length > 0) repos[key] = clean;
    }
  }
  return { fetchedAt, repos };
}

/** 已提交的缓存文件（构建期可空；抓取脚本在 CI 中刷新） */
export const githubCache = parseGithubCache(rawCache);

/**
 * 合并策略：cache 只覆盖动态字段 stars / language / archived；
 * 名称、简介、详情、分类、状态一律以 content/projects.ts 为准。
 * 私有仓库跳过缓存（API 不抓取私有条目，避免信息泄漏）。
 */
export function mergeGithubCache(
  items: readonly Project[],
  cache: GithubCache,
): ProjectWithCache[] {
  return items.map((item) => {
    if (item.repoPrivate) return { ...item };
    const snapshot = cache.repos[item.repo];
    if (!snapshot) return { ...item };
    const merged: ProjectWithCache = { ...item };
    if (Number.isInteger(snapshot.stars) && (snapshot.stars as number) >= 0) {
      merged.stars = snapshot.stars;
    }
    if (typeof snapshot.language === 'string' || snapshot.language === null) {
      merged.language = snapshot.language;
    }
    if (typeof snapshot.archived === 'boolean') merged.archived = snapshot.archived;
    return merged;
  });
}

/** 展示用 star 数：缓存与手写 fallback 都缺失时显示 0（不崩溃） */
export function githubStars(item: ProjectWithCache): number {
  return typeof item.stars === 'number' && item.stars >= 0 ? item.stars : 0;
}
