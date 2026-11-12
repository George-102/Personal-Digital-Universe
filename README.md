# Personal Digital Universe

[![CI/CD](https://github.com/George-102/Personal-Digital-Universe/actions/workflows/verify.yml/badge.svg)](https://github.com/George-102/Personal-Digital-Universe/actions/workflows/verify.yml)

3D 沉浸式个人数字空间 —— 融合科研、开源项目、软件产品与文学创作的个人作品集网站。

需求见 [docs/PRD.md](docs/PRD.md)，技术决策见 [docs/Tech.md](docs/Tech.md) 与 [docs/Development.md](docs/Development.md)，完成定义见 [docs/DoD.md](docs/DoD.md)。功能状态唯一事实来源是 `feature_list.json`，会话进度见 `claude-progress.md`。

## 本地启动

要求 Node.js 26（`.nvmrc`、`package.json` 的 `engines` 与 CI 的 `setup-node` 统一固定为 26.x；`scripts/*.mjs` 直接 import `.ts`，需 Node 22.18+ 原生类型剥离，Node 20 会在 `prebuild` 报 `ERR_UNKNOWN_FILE_EXTENSION`）。

```bash
bash init.sh      # 统一入口：环境检查 + npm ci + 配置冒烟验证
npm run dev       # 开发服务器 http://localhost:3000
```

Windows PowerShell 下用 `./init.ps1`，与 `init.sh` 等价（环境检查 → `npm ci` → 配置冒烟验证）。WSL 中若未安装 Linux 版 Node，`bash init.sh` 会自动委托 Windows PowerShell 执行同一流程。

构建与预览静态产物：

```bash
npm run build             # 产出 out/（纯静态导出）
npx serve out -l 4173     # 本地预览，http://localhost:4173
```

路由：`/` 中文（默认），`/en/` 英文。文案在 `messages/zh.json` 与 `messages/en.json`，两边键必须一一对应。

## 内容维护方式

内容与展示逻辑分离：个人数据在 `content/` 下以 TypeScript 数据文件维护（profile / journey / research / publications / projects / products / writing / reading / interests，随 T-002 落地）。约定：

- 简介类字段双语 `{ zh, en }`；论文与项目名称保留原文。
- 每条数据含 `public: boolean`，`false` 的条目构建时被过滤。
- 论文状态严格 `Published | Preprint | In Progress`；产品状态严格 `Released | Beta | In Development | Discontinued`。
- 新增一条数据后重新构建，页面自动展示；可选字段缺失有默认值或条件渲染，不崩。
- 个人介绍正文在 `content/profile.ts` 的 `about` 字段：`bio` 为叙事段落数组、`highlights` 为要点数组（均双语）；`cvUrl` 省略时不渲染下载入口，`portrait` 省略时使用 3D 抽象头像。
- GitHub 仓库数据在 CI 构建时抓取为 `content/github-cache.json`，Token 只存在于 Actions secrets，不进前端 bundle。

修改 `messages/*.json` 后运行 `npm run check:i18n` 确认键覆盖率 100%。

## 部署方式

纯静态导出（`output: 'export'` + `trailingSlash: true`），生产站点 `https://personal-digital-universe.pages.dev`，仓库 `https://github.com/George-102/Personal-Digital-Universe`。采用 **GitHub Actions + Wrangler Direct Upload**（方案 A，已由 T-004b / T-005a 落地）：

- `.github/workflows/verify.yml` 一条流水线三个 job：`verify` 全绿后，`deploy` 仅在 `push main` 时把**同一份 `out/` artifact** 上传到 Pages；`preview` 仅为同仓库 PR 生成预览 URL。
- Pages 项目为 **Direct Upload**（无 Git 自动构建），避免双构建与「CI 未过就上线」。
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 仅存 GitHub Actions secrets；fork PR 不注入 secrets、不部署。注意 token **不要设置 Client IP Address Filtering**，否则 Actions 动态出口 IP 会被 Cloudflare 以 `9109` 拒绝。
- `wrangler` 以精确版本固定在 devDependencies，CI 用 `npm ci` 复现部署工具链。
- 免费子域名 `*.pages.dev`，无限带宽，0 元/月。
- 发布流程：PR → `verify` 全绿 → 合并 main → 自动上线 → 站点 HTTP 200 检查 → DoD 人工验收打勾 → 对外分享。
- 顶部 CI 徽章实时显示 Verify 状态；`main` 分支保护要求 `verify` 状态检查通过。

流水线与门禁细节见 [docs/Development.md](docs/Development.md) §3 / §5 与 [docs/Tech.md](docs/Tech.md) §6。

## 监控与统计（免费）

- **可用性**：UptimeRobot 免费层，HTTPS monitor `Personal-Digital-Universe-prod` 指向 `https://personal-digital-universe.pages.dev`，检查间隔 300 秒（5 分钟），宕机邮件告警（告警联系人 `9024699_0_0`）。
- **访问统计**：Cloudflare Web Analytics（免费、无 Cookie、含 Core Web Vitals）。在 Pages 项目 → **Metrics** → Web Analytics 一键 **Enable**，Cloudflare 在下次部署自动注入 beacon 脚本，不需要改代码，也不需要 Cookie 同意横幅。
- 两者都在第三方账号侧配置，仓库内不保存任何账号密钥；实时状态以各自控制台为准。
- 验证：run `42999448346` 部署后 `/` 与 `/en/` 均返回含 beacon 的 HTML；UptimeRobot monitor `804633325` 回查 `status=2`（Up）。

## 验收命令

| 命令 | 用途 |
| --- | --- |
| `npm run verify:local` | **本地默认**：lint + typecheck + build + 单测 + 质量指标，零浏览器（与 CI 前 5 步等价） |
| `npm run verify` | 完整门禁的本地等价入口：build + Playwright 全项目 + Lighthouse CI + 质量指标；**实际门禁由云端 CI 逐条执行，勿在本地运行** |
| `npm run verify:quick` | 可选的单项目浏览器抽查：build + 无 WebGL 降级项目（会启动 Chromium + serve，非本地默认） |
| `npm run verify:build` | 仅构建（next build） |
| `npm run verify:e2e` | Playwright 四项目：桌面 / 无 WebGL / 移动 Chrome / 移动 Safari |
| `npm run verify:lighthouse` | Lighthouse CI（性能 ≥0.85、a11y ≥0.95、SEO ≥0.95、最佳实践 ≥0.90） |
| `npm run verify:metrics` | audit + check:i18n + size 三个质量指标 |
| `npm run audit` | 0 高危及以上漏洞（指定官方 registry） |
| `npm run check:i18n` | zh/en 键覆盖率 100% |
| `npm run size` | JS 总量 ≤1MB（size-limit） |
| `npm test` | 单元测试（当前 node:test，T-003 迁移 Vitest；产物级用例需先 `npm run build`） |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript 检查 |

本地默认零浏览器：无需 `npx playwright install`、不跑 `lhci`（本地跑 Lighthouse 会生成公开报告链接，见 `lighthouserc.js`）。仅按需做浏览器抽查时才安装浏览器：`npx playwright install`。门禁断言与阈值不得为通过验收而改弱（AGENTS.md）。

CI 中 `.github/workflows/verify.yml` 依次执行：`npm ci` → `lint` / `typecheck` → `build` → `npm test` → `verify:metrics` → Playwright 四项目 → Lighthouse CI；`build` 必须早于 `npm test`（产物级单测读 `out/*.html`）。重验证固定在云端，push main / PR 自动触发，CI run URL 是完成定义的证据；全绿且为 `push main` 时才执行 `deploy`。未实现的用户故事对应断言用 `test.fixme()` 显式标注并绑定 roadmap，不删除、不用 grep 过滤。

## 降级说明

3D 遵循三层降级契约（US-001b/d 落地，验收见 `e2e/degradation.spec.ts`）：

1. **WebGL 不可用**：不渲染 Canvas，显示 CSS 动态/静态背景，文字与导航完整可见。
2. **3D 资源加载失败**：Suspense fallback 使用 CSS/图片占位，不白屏、不阻塞阅读。
3. **运行中上下文丢失**：尝试恢复一次，失败转静态模式，无未捕获异常。

核心原则：文字先于 3D —— 任何路由的静态 HTML 必须含核心文案，Canvas 不得成为 LCP 元素；组件卸载显式 dispose GPU 资源，离开视口暂停渲染；移动端 pixelRatio ≤1.5、降粒子、关实时阴影与高成本后处理。

## 许可证

代码与内容许可证分层：代码 [LICENSE](LICENSE)（PolyForm Noncommercial 1.0.0），内容 [LICENSE-CONTENT](LICENSE-CONTENT)（CC BY-NC-ND 4.0）。两者均仅允许非商业使用，内容另禁止演绎。站点 Footer 有版权声明与许可证链接；构建时由 `scripts/sync-licenses.mjs` 把根目录文件同步到 `public/`，使线上 `/LICENSE` 与 `/LICENSE-CONTENT` 可访问（副本已加入 `.gitignore`）。