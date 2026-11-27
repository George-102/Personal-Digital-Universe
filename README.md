# Personal Digital Universe

[![CI/CD](https://github.com/George-102/Personal-Digital-Universe/actions/workflows/verify.yml/badge.svg)](https://github.com/George-102/Personal-Digital-Universe/actions/workflows/verify.yml)

3D 沉浸式个人数字空间 —— 融合科研、开源项目、软件产品与文学创作的个人作品集网站。

需求见 [docs/PRD.md](docs/PRD.md)，技术决策见 [docs/Tech.md](docs/Tech.md) 与 [docs/Development.md](docs/Development.md)，完成定义见 [docs/DoD.md](docs/DoD.md)。功能状态唯一事实来源是 `feature_list.json`，会话进度见 `claude-progress.md`。

## 本地启动

要求 Node.js 26.13.1（`mise.toml` / `.nvmrc` / CI 的 `setup-node` 对齐；`package.json` 的 `engines` 保持 26.x；`scripts/*.mjs` 直接 import `.ts`，需 Node 22.18+ 原生类型剥离，Node 20 会在 `prebuild` 报 `ERR_UNKNOWN_FILE_EXTENSION`）。

本地推荐用 mise 管理工具链与自动化任务：`mise.toml` 固定 Node 26.13.1（自带 npm 11.20.0）并在 `[tasks]` 中提供全部脚本的统一入口；进入仓库后 `mise install` 即准备好工具链。`init.sh` / `init.ps1` 检测到 mise 会自动执行 `mise install` 并通过 `mise exec` 调用 `node` / `npm` / `npx`；未安装 mise 时回退到系统 Node。CI 仍用 `.nvmrc` + `setup-node`，无需 mise。

```bash
mise install              # 安装 mise.toml 固定的 Node
mise run init             # 统一入口：环境检查 + npm ci + 配置冒烟验证
mise run dev              # 开发服务器 http://localhost:3000
mise tasks ls             # 列出全部 mise 任务
```

`mise run <task>` 与 `npm run <script>` 等价（薄封装，逻辑不重复），任务清单见 `mise.toml`：`init` / `smoke` / `gate` / `dev` / `build` / `start` / `lint` / `typecheck` / `test` / `audit` / `check:i18n` / `size` / `verify` / `verify:*` / `github:cache` / `licenses:sync` / `content:validate`。`mise run init` 在 Windows 上委托 `init.ps1`、其它平台委托 `init.sh`；WSL 中若未安装 Linux 版 Node 且未装 mise，`bash init.sh` 会自动委托 Windows PowerShell 执行同一流程。也可继续直接用 `bash init.sh` / `./init.ps1`。

构建与预览静态产物：

```bash
npm run build             # 产出 out/（纯静态导出）
npx serve out -l 4173     # 本地预览，http://localhost:4173
```

路由：`/` 中文（默认），`/en/` 英文。文案在 `messages/zh.json` 与 `messages/en.json`，两边键必须一一对应。

## 内容维护方式

内容与展示逻辑分离：个人数据在 `content/` 下以 TypeScript 数据文件维护（profile / education / journey / research / publications / projects / products / writing / skills / reading / interests，随 T-002 落地）。约定：

- 简介类字段双语 `{ zh, en }`；论文与项目名称保留原文。
- 每条数据含 `public: boolean`，`false` 的条目构建时被过滤。
- 论文状态严格 `Published | Preprint | In Progress`；产品状态严格 `Released | Beta | In Development | Discontinued`；作品状态严格 `Writing | In Progress | Completed`；学历阶段严格 `Completed | In Progress | Planned`，备考研究生只能是 `In Progress | Planned` 且必须写 `statusNote`。
- 教育背景在 `content/education.ts`：`degreeLevel` 为 undergraduate / graduate，研究生条目禁止标 Completed（构建期拒绝），可选字段缺省不渲染空字段；首页 `#education` 纯 DOM 时间轴。
- 新增一条数据后重新构建，页面自动展示；可选字段缺失有默认值或条件渲染，不崩。
- 个人介绍正文在 `content/profile.ts` 的 `about` 字段：`bio` 为叙事段落数组、`highlights` 为要点数组（均双语）；`cvUrl` 省略时不渲染下载入口，`portrait` 省略时使用 3D 抽象头像。
- 成长时间线在 `content/journey.ts`：`date` 用 `YYYY` 或 `YYYY-MM`，区间加 `endDate`；`detail` 为可选的双语段落数组（省略则该条只展示摘要，不出现空面板）；`link` 只允许站内路径或 `https://` 外链；`category` 限 `education / research / opensource / product / competition / work / writing`。**当前为模板清单，`title` 均带「示例 ·」前缀，替换真实经历后删除前缀即可。** 排序在 `content/index.ts` 统一完成（最新在前），组件不再各自排序。
- 联系方式在 `content/profile.ts` 的 `contact` 字段：`email` 为公开邮箱，`links` 为公开外链数组（`id` / `kind` / 双语 `label` / `url` / `public`），`collaborations` 为双语合作方向。`links` 为空时不渲染任何外链入口；填入一条真实 `https://` 链接重新构建即可上线（站内路径也允许，构建期拒绝 `javascript:` / `http:` / 协议相对 URL）。首页 `#contact` 与独立 `/contact`、`/en/contact` 页面共用同一份数据。
- 研究方向在 `content/research.ts`：`slug` 为小写 kebab-case（生成 `/research/[slug]` 详情页路径），`title` / `overview` / `problems` / `detail`（可选）为双语字段，`methods` 与 `keywords` 为字符串数组，`link` 只允许站内路径或 `https://` 外链，`status` 严格 `In Progress | Completed`（未完成不得写 Completed）。首页 `#research`、`/research` 与 `/en/research` 列表页、详情页共用同一份数据；新增条目后重新构建即出现在列表与 sitemap 中。首页为纯文字概览（方向 + 核心问题），3D 空域概念示意与方法/关键词只在列表页与详情页渲染（US-010k TBT 优化）。
- 开源项目在 `content/projects.ts`（US-012）：`slug` 小写 kebab-case，`repo` 为 `owner/name`，`description` / `detail` 双语，`category` 限 `ai-ml / web / dev-tools / research / other`，`status` 限 `active / maintained / archived / completed`，`featured` 决定首页精选；私有科研仓库设 `repoPrivate: true` 不渲染 GitHub 按钮。首页 `#projects` 只展示 2 张精选卡（纯 CSS 占位），`/projects` 与 `/en/projects` 列表页展示全量 9 条、五分类分组与 3D 悬浮卡片概念视觉。GitHub 仓库的 star / 语言 / 归档态由 CI 构建期 `node scripts/fetch-github.mjs` 抓取写入 `content/github-cache.json`，Token 只存在于 Actions secrets（`GITHUB_TOKEN`）且不进前端 bundle；API 失败或限流时沿用上次缓存或 `content/projects.ts` 的手写 `stars`。当前清单与文案为 agent 起草稿（`content/projects.ts` 注释标【待用户确认】）。
- 独立软件产品在 `content/products.ts`（US-013）：`slug` 小写 kebab-case，`name` / `description` / `features`（双语数组）/ `detail`（可选双语）为核心字段，`status` 严格 `Released | Beta | In Development | Discontinued` 四值，`featured` 决定首页精选；`url` 与 `repo`（`owner/name`）省略时不渲染对应按钮（不显示无效入口），`logo` / `cover` 省略时用统一 CSS 渐变占位。首页 `#products` 只展示 2 张精选卡（纯文字），`/products` 与 `/en/products` 列表页展示全量 4 条、内联展开详情与 3D 产品展台概念视觉（仅列表页挂载，首页不加载 3D）。当前 4 款清单与文案为 agent 起草稿（`content/products.ts` 注释标【待用户确认】），替换真实产品后重新构建即出现在列表与 sitemap 中。
- 文学作品在 `content/writing.ts`（US-014）：`slug` 小写 kebab-case，`title` / `description` / `worldview` / `concept` 双语，`background` / `characters` / `detail` 双语数组，`status` 严格 `Writing | In Progress | Completed` 三值，`featured` 决定首页精选；`cover` / `readingUrl` / `externalUrl` 省略时不渲染无效入口，缺封面用统一 CSS 渐变占位。首页 `#writing` 只展示 2 张精选卡（名称 + 简介 + 状态），`/writing` 与 `/en/writing` 列表页展示全量与 3D 悬浮书架概念视觉（仅列表页挂载），作品详情为独立路由 `/writing/[slug]` 与 `/en/writing/[slug]`（世界观/背景/人物/创作理念静态可读）。当前 3 部清单与文案为 agent 起草稿（`content/writing.ts` 注释标【待用户确认】），替换真实作品后重新构建即出现在列表、详情与 sitemap 中。

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

所有命令均可通过 `mise run <task>` 调用（去掉 `npm run` 前缀；`npm test` → `mise run test`）。例如 `mise run verify:local`。

| 命令 | 用途 |
| --- | --- |
| `npm run verify:local` | **本地默认**：lint + typecheck + build + 单测 + 质量指标，零浏览器（与 CI 前 5 步等价） |
| `npm run verify` | 完整门禁的本地等价入口：build + Playwright 全项目 + Lighthouse CI + 质量指标；**实际门禁由云端 CI 逐条执行，勿在本地运行** |
| `npm run verify:quick` | 可选的单项目浏览器抽查：build + 无 WebGL 降级项目（会启动 Chromium + serve，非本地默认） |
| `npm run verify:build` | 仅构建（next build） |
| `npm run verify:e2e` | Playwright 四项目：桌面 / 无 WebGL / 移动 Chrome / 移动 Safari |
| `npm run verify:lighthouse` | Lighthouse CI（性能 ≥0.85、a11y ≥0.95、SEO ≥0.95、最佳实践 ≥0.90） |
| `npm run verify:metrics` | audit + check:i18n + size 三个质量指标 |
| `npm run verify:content` | 内容维护四条验收：临时工作区注入内容夹具并构建，验证文案更新、新增项目、缺字段容错与资源降级；不修改真实 `content/`，已纳入 `verify:local` |
| `npm run audit` | 0 高危及以上漏洞（指定官方 registry） |
| `npm run check:i18n` | zh/en 键覆盖率 100% |
| `npm run size` | JS 总量 ≤1MB（size-limit） |
| `npm test` | Vitest 单元/集成测试 + v8 覆盖率门禁（24 文件 / 186 用例；产物级用例需先 `npm run build`） |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript 检查 |

本地默认零浏览器：无需 `npx playwright install`、不跑 `lhci`（本地跑 Lighthouse 会生成公开报告链接，见 `lighthouserc.js`）。仅按需做浏览器抽查时才安装浏览器：`npx playwright install`。门禁断言与阈值不得为通过验收而改弱（AGENTS.md）。

**push 前本地门禁（T-008）**：`scripts/pre-push-gate.sh` 在 `git push` 前自动执行 `npm run verify:local`，本地失败即拒绝 push，避免推上去等云端 CI 才拿到失败反馈。一次性激活（Git Bash，仓库根目录）：

```bash
printf '%s\n' 'exec sh scripts/pre-push-gate.sh' > githooks/pre-push
git config core.hooksPath githooks
```

紧急推送可用 `git push --no-verify` 显式豁免本门禁，请在提交说明中记录原因。`init.ps1` / `init.sh` 会打印门禁激活状态与安装指引。

CI 中 `.github/workflows/verify.yml` 依次执行：`npm ci` → `lint` / `typecheck` → `build` → `npm test` → `verify:metrics` → Playwright 四项目 → Lighthouse CI；`build` 必须早于 `npm test`（产物级单测读 `out/*.html`）。重验证固定在云端，push main / PR 自动触发，CI run URL 是完成定义的证据；全绿且为 `push main` 时才执行 `deploy`。未实现的用户故事对应断言用 `test.fixme()` 显式标注并绑定 roadmap，不删除、不用 grep 过滤。

## 降级说明

3D 遵循三层降级契约（US-001b/d 落地，验收见 `e2e/degradation.spec.ts`）：

1. **WebGL 不可用**：不渲染 Canvas，显示 CSS 动态/静态背景，文字与导航完整可见。
2. **3D 资源加载失败**：Suspense fallback 使用 CSS/图片占位，不白屏、不阻塞阅读。
3. **运行中上下文丢失**：尝试恢复一次，失败转静态模式，无未捕获异常。

核心原则：文字先于 3D —— 任何路由的静态 HTML 必须含核心文案，Canvas 不得成为 LCP 元素；组件卸载显式 dispose GPU 资源，离开视口暂停渲染；移动端 pixelRatio ≤1.5、降粒子、关实时阴影与高成本后处理。

US-021 多设备画质分档（`lib/quality.ts` / `components/useAdaptiveTier.ts`）：Desktop ≥1280px 与 Laptop 1024~1279px 均 700 粒子 / dpr≤1.5，Tablet 640~1023px 500 粒子，Mobile <640px 350 粒子；`navigator.hardwareConcurrency ≤4` 或 `deviceMemory ≤4` 时再降一档（粒子×0.7、dpr≤1）。场景进入视口后才采样 rAF 帧间隔，连续两个慢窗口（平均 >24ms）自动降档一次，不自动升回；采样只读时间戳、不写 DOM。设备档位可通过只读探针 `window.__deviceTier` / `window.__qualityTier` 查看（E2E 用，不进入产物文案）。

## 许可证

代码与内容许可证分层：代码 [LICENSE](LICENSE)（PolyForm Noncommercial 1.0.0），内容 [LICENSE-CONTENT](LICENSE-CONTENT)（CC BY-NC-ND 4.0）。两者均仅允许非商业使用，内容另禁止演绎。站点 Footer 有版权声明与许可证链接；构建时由 `scripts/sync-licenses.mjs` 把根目录文件同步到 `public/`，使线上 `/LICENSE` 与 `/LICENSE-CONTENT` 可访问（副本已加入 `.gitignore`）。