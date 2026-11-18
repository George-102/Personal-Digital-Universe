/**
 * US-012c：构建期 GitHub API 抓取的纯编排逻辑（可注入 fetchImpl 供单测）。
 * Token 只通过参数传入请求头，不写入缓存、不打印日志；失败一律沿用旧缓存或 content 手写 fallback。
 */

/** 只保留 UI 需要的白名单字段，避免 owner / description / token 等数据落盘 */
function pickSnapshot(data) {
  const snapshot = {};
  if (Number.isInteger(data.stargazers_count) && data.stargazers_count >= 0) {
    snapshot.stars = data.stargazers_count;
  }
  if (typeof data.language === 'string' || data.language === null) {
    snapshot.language = data.language;
  }
  if (typeof data.archived === 'boolean') snapshot.archived = data.archived;
  if (typeof data.updated_at === 'string') snapshot.updatedAt = data.updated_at;
  return Object.keys(snapshot).length > 0 ? snapshot : null;
}

/**
 * @param {readonly {repo:string, repoPrivate?:boolean}[]} items
 * @param {{fetchedAt:string|null, repos:Record<string, object>}} previous
 * @param {{token:string, fetchImpl?:Function, timeoutMs?:number}} options
 */
export async function collectGithubCache(
  items,
  previous,
  { token = '', fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {},
) {
  const repos = { ...previous.repos };
  let fetchedAny = false;

  for (const item of items) {
    if (item.repoPrivate) continue; // 私有仓库不抓取，避免信息泄漏
    const url = `https://api.github.com/repos/${item.repo}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'personal-digital-universe-build',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetchImpl(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) continue; // 403 限流 / 404 仓库不可见：沿用旧值
      const data = await response.json();
      const snapshot = pickSnapshot(data);
      if (snapshot) {
        repos[item.repo] = snapshot;
        fetchedAny = true;
      }
    } catch {
      // 网络异常 / 超时 / JSON 解析失败：保持原缓存，构建不中断
    }
  }

  return {
    fetchedAt: fetchedAny ? new Date().toISOString() : previous.fetchedAt ?? null,
    repos,
  };
}
