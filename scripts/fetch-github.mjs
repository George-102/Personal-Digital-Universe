/**
 * US-012c：构建期 GitHub 公开仓库数据抓取入口。
 *
 * - CI：在 build 之前运行，GITHUB_TOKEN 由 Actions secrets 注入环境变量；
 * - 本地：无 token 时对公开仓库匿名抓取（限额 60 次/小时），失败则沿用已提交缓存；
 * - token 只进请求头，不写入缓存文件、不打印日志、不进入前端 bundle。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { projects } from '../content/projects.ts';
import { parseGithubCache } from '../lib/github-cache.ts';
import { collectGithubCache } from '../lib/github-fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cachePath = resolve(here, '../content/github-cache.json');

const previous = parseGithubCache(
  JSON.parse(await readFile(cachePath, 'utf8').catch(() => '{}')),
);
const token = process.env.GITHUB_TOKEN ?? '';
const updated = await collectGithubCache(projects, previous, { token });

await writeFile(cachePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
console.log(
  `github-cache 已更新：${Object.keys(updated.repos).length} 个仓库，抓取时间 ${updated.fetchedAt ?? '沿用上次'}`,
);
