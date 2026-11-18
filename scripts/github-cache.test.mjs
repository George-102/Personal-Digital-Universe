import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual(parseGithubCache(null), { fetchedAt: null, repos: {} });
  assert.deepEqual(parseGithubCache({}), { fetchedAt: null, repos: {} });
  const parsed = parseGithubCache({
    fetchedAt: '2026-11-18T00:00:00.000Z',
    repos: { 'Owner/Example': { stars: 12, language: 'TypeScript', archived: false } },
  });
  assert.equal(parsed.repos['Owner/Example'].stars, 12);
  assert.equal(parsed.fetchedAt, '2026-11-18T00:00:00.000Z');
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
  assert.equal(parsed.fetchedAt, null);
  assert.deepEqual(Object.keys(parsed.repos).sort(), ['evil', 'good']);
  assert.equal(parsed.repos.bad, undefined);
  assert.equal(parsed.repos.evil.token, undefined);
});

test('mergeGithubCache 仅覆盖动态字段，静态内容以 content 为准', () => {
  const list = [project({ name: '静态名', stars: 1 })];
  const merged = mergeGithubCache(list, {
    fetchedAt: 'now',
    repos: {
      'Owner/Example': { stars: 99, language: 'TypeScript', archived: true },
    },
  });
  assert.equal(merged[0].name, '静态名');
  assert.equal(merged[0].stars, 99);
  assert.equal(merged[0].language, 'TypeScript');
  assert.equal(merged[0].archived, true);
  assert.equal(list[0].stars, 1, '不修改原始 content 数据');
});

test('mergeGithubCache 对无缓存/私有条目保留手写 fallback', () => {
  const list = [
    project({ stars: 4 }),
    project({ slug: 'private', repo: 'Owner/Secret', stars: 0, repoPrivate: true }),
  ];
  const merged = mergeGithubCache(list, { fetchedAt: 'now', repos: {} });
  assert.equal(merged[0].stars, 4);
  assert.equal(merged[1].stars, 0);
  assert.equal(githubStars(merged[0]), 4);
  assert.equal(githubStars({ ...merged[0], stars: undefined }), 0);
});

test('mergeGithubCache 忽略未知 repo 与非法缓存字段', () => {
  const list = [project({ stars: 2 })];
  const merged = mergeGithubCache(list, {
    fetchedAt: 'now',
    repos: { 'Owner/Other': { stars: 500 }, 'Owner/Example': { stars: 'NaN' } },
  });
  assert.equal(merged[0].stars, 2);
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
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.github.com/repos/Owner/Example');
  assert.equal(calls[0].headers.Authorization, 'Bearer FAKE-TOKEN');
  assert.deepEqual(result.repos['Owner/Example'], {
    stars: 7,
    language: 'TypeScript',
    archived: false,
    updatedAt: '2026-11-18T00:00:00Z',
  });
  assert.equal(result.repos['Owner/Secret'], undefined, '私有仓库不抓取');
  assert.ok(!JSON.stringify(result).includes('SECRET-VALUE'));
  assert.ok(!JSON.stringify(result).includes('FAKE-TOKEN'));
  assert.ok(typeof result.fetchedAt === 'string');
});

test('collectGithubCache API 失败时沿用旧缓存，不抛错、构建可继续', async () => {
  const previous = { fetchedAt: 'old', repos: { 'Owner/Example': { stars: 3 } } };
  const result = await collectGithubCache(
    [project()],
    previous,
    { token: '', fetchImpl: async () => ({ ok: false, status: 403 }) },
  );
  assert.deepEqual(result.repos['Owner/Example'], { stars: 3 });
  assert.equal(result.fetchedAt, 'old', '失败时不刷新时间戳');
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
  assert.deepEqual(result, { fetchedAt: null, repos: {} });
});
