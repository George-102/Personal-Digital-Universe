import { test, expect } from 'vitest';
import {
  parseGithubCache,
  mergeGithubCache,
  githubStars,
} from '../lib/github-cache.ts';
import { collectGithubCache } from '../lib/github-fetch.mjs';

const project = (overrides = {}) => ({
  slug: 'example',
  repo: 'Owner/Example',
  name: 'Example',
  description: { zh: '介绍', en: 'Intro' },
  stack: ['TS'],
  category: 'web',
  status: 'active',
  featured: false,
  public: true,
  ...overrides,
});

test('parseGithubCache 接受合法缓存与空对象', () => {
  expect(parseGithubCache(null)).toEqual({ fetchedAt: null, repos: {} });
  expect(parseGithubCache({})).toEqual({ fetchedAt: null, repos: {} });
  const parsed = parseGithubCache({
    fetchedAt: '2026-11-18T00:00:00.000Z',
    repos: { 'Owner/Example': { stars: 12, language: 'TypeScript', archived: false } },
  });
  expect(parsed.repos['Owner/Example'].stars).toBe(12);
  expect(parsed.fetchedAt).toBe('2026-11-18T00:00:00.000Z');
});

test('parseGithubCache 拒绝畸形 repo 条目（不污染合并）', () => {
  const parsed = parseGithubCache({
    fetchedAt: 123,
    repos: {
      good: { stars: 3 },
      bad: { stars: -1 },
      evil: { stars: 5, token: 'secret' },
      nullEntry: null,
    },
  });
  expect(parsed.fetchedAt).toBe(null);
  expect(Object.keys(parsed.repos).sort()).toEqual(['evil', 'good']);
  expect(parsed.repos.bad).toBe(undefined);
  expect(parsed.repos.evil.token).toBe(undefined);
});

test('mergeGithubCache 仅覆盖动态字段，静态内容以 content 为准', () => {
  const list = [project({ name: '静态名', stars: 1 })];
  const merged = mergeGithubCache(list, {
    fetchedAt: 'now',
    repos: {
      'Owner/Example': { stars: 99, language: 'TypeScript', archived: true },
    },
  });
  expect(merged[0].name).toBe('静态名');
  expect(merged[0].stars).toBe(99);
  expect(merged[0].language).toBe('TypeScript');
  expect(merged[0].archived).toBe(true);
  expect(list[0].stars, '不修改原始 content 数据').toBe(1);
});

test('mergeGithubCache 对无缓存/私有条目保留手写 fallback', () => {
  const list = [
    project({ stars: 4 }),
    project({ slug: 'private', repo: 'Owner/Secret', stars: 0, repoPrivate: true }),
  ];
  const merged = mergeGithubCache(list, { fetchedAt: 'now', repos: {} });
  expect(merged[0].stars).toBe(4);
  expect(merged[1].stars).toBe(0);
  expect(githubStars(merged[0])).toBe(4);
  expect(githubStars({ ...merged[0], stars: undefined })).toBe(0);
});

test('mergeGithubCache 忽略未知 repo 与非法缓存字段', () => {
  const list = [project({ stars: 2 })];
  const merged = mergeGithubCache(list, {
    fetchedAt: 'now',
    repos: { 'Owner/Other': { stars: 500 }, 'Owner/Example': { stars: 'NaN' } },
  });
  expect(merged[0].stars).toBe(2);
});

// ---------- 构建期抓取（US-012c） ----------

test('collectGithubCache 调用 GitHub API 并只取白名单字段（Token 不落盘）', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, headers: options.headers });
    return {
      ok: true,
      json: async () => ({
        stargazers_count: 7,
        language: 'TypeScript',
        archived: false,
        updated_at: '2026-11-18T00:00:00Z',
        // 下面字段不应进入缓存
        private: true,
        owner: { login: 'Owner', token: 'SECRET-VALUE' },
        description: 'API description',
      }),
    };
  };
  const result = await collectGithubCache(
    [project(), project({ slug: 'private', repo: 'Owner/Secret', repoPrivate: true })],
    { fetchedAt: 'old', repos: {} },
    { token: 'FAKE-TOKEN', fetchImpl },
  );
  expect(calls.length).toBe(1);
  expect(calls[0].url).toBe('https://api.github.com/repos/Owner/Example');
  expect(calls[0].headers.Authorization).toBe('Bearer FAKE-TOKEN');
  expect(result.repos['Owner/Example']).toEqual({
    stars: 7,
    language: 'TypeScript',
    archived: false,
    updatedAt: '2026-11-18T00:00:00Z',
  });
  expect(result.repos['Owner/Secret'], '私有仓库不抓取').toBe(undefined);
  expect(!JSON.stringify(result).includes('SECRET-VALUE')).toBeTruthy();
  expect(!JSON.stringify(result).includes('FAKE-TOKEN')).toBeTruthy();
  expect(typeof result.fetchedAt === 'string').toBeTruthy();
});

test('collectGithubCache API 失败时沿用旧缓存，不抛错、构建可继续', async () => {
  const previous = { fetchedAt: 'old', repos: { 'Owner/Example': { stars: 3 } } };
  const result = await collectGithubCache(
    [project()],
    previous,
    { token: '', fetchImpl: async () => ({ ok: false, status: 403 }) },
  );
  expect(result.repos['Owner/Example']).toEqual({ stars: 3 });
  expect(result.fetchedAt, '失败时不刷新时间戳').toBe('old');
});

test('collectGithubCache 网络异常时回退 content 手写 stars（无缓存条目）', async () => {
  const result = await collectGithubCache(
    [project({ stars: 2 })],
    { fetchedAt: null, repos: {} },
    {
      token: '',
      fetchImpl: async () => {
        throw new Error('ECONNRESET');
      },
    },
  );
  expect(result).toEqual({ fetchedAt: null, repos: {} });
});
