# 开发文档 — Personal Digital Universe

> 本文档记录开发代码前的技术准备决策，对应准备清单中的「基础 / 数据库 / 持续集成 / 测试 / 发布」五类。每节按 **决策 → 现状 → 待办** 组织。需求侧的用户故事见 `feature_list.json`，产品需求见 `PRD.md`，技术选型详细论证见 `Tech.md`，完成定义见 `docs/DoD.md`。

## 准备状态总览

| 大类 | 小类 | 检查项 | 状态 | 对应文件 / 任务 |
| --- | --- | --- | --- | --- |
| 技术 | 基础 | 技术选型 | ✅ 已决策 | Tech.md、本文 §1 |
| 技术 | 基础 | 技术架构 | ✅ 已决策 | Tech.md、本文 §1 |
| 技术 | 数据库 | 数据库表结构 | ✅ 无数据库决策 + content/ schema | 本文 §2、T-002 |
| 技术 | 数据库 | 数据库迁移 | ✅ 不适用（见决策） | 本文 §2 |
| 技术 | 持续集成 | 持续集成服务器 | ✅ 已跑通（Verify 全量门禁全绿） | .github/workflows/verify.yml、T-004a/b |
| 技术 | 持续集成 | 持续集成监视器 | ✅ 已落地 | T-004b（CI 徽章）、T-005b（UptimeRobot 5 分钟监控 + Cloudflare Web Analytics） |
| 技术 | 持续集成 | 构建脚本 | ✅ 已建 | package.json（verify 系列 + dev/build/start）；Node 26 固定随 T-004a |
| 技术 | 测试 | 单元测试和集成测试 | ⏳ 待落地 | T-003（Vitest，未提前） |
| 技术 | 测试 | 端到端测试 | ✅ 已建并运行 | playwright.config.ts、e2e/（12 个 spec） |
| 技术 | 发布 | 发布脚本 | ✅ 已落地 | T-005a（deploy + preview job，Wrangler 直传） |

---

## 1. 基础（技术选型与技术架构）

### 决策

| 层面 | 选择 | 理由 |
| --- | --- | --- |
| 前端框架 | Next.js 15+（App Router） | SSG、路由、SEO、结构化数据 |
| 语言 | TypeScript | 类型安全，content/ 数据结构可约束 |
| 3D 渲染 | Three.js + React Three Fiber + Drei | React 声明式管理 3D 生命周期 |
| 滚动/时间线动画 | GSAP（ScrollTrigger） | 滚动驱动相机与场景转场统一交由 GSAP |
| UI 动画 | Framer Motion / Motion | 卡片悬停、渐入、按钮反馈 |
| 样式 | Tailwind CSS + CSS 变量 | 响应式布局与主题切换 |
| 图标 | Lucide | 轻量统一 |
| 国际化 | next-intl | App Router 原生 i18n，/ 中文、/en 英文 |
| 内容维护 | content/ 下 TS/JSON + Markdown | 零数据库费用，构建时读取 |
| 托管 | Cloudflare Pages（静态导出） | 免费无限带宽、允许商用、全球 CDN |
| 单元/集成测试 | Vitest | 与 Vite/TS 生态契合，快（T-003 落地） |
| E2E 测试 | Playwright | 多设备项目、WebGL 降级可模拟 |
| 性能门禁 | Lighthouse CI | 免费、阈值即代码 |

**架构：纯静态导出。** `output: 'export'` + `trailingSlash: true`，所有"动态"在客户端（3D、动画、i18n、Copy Email）；GitHub 数据在 CI 构建时抓取为本地 JSON。不使用 SSR、Worker、数据库、CMS、表单后端。

```
浏览器 ── Cloudflare Pages（*.pages.dev，免费 CDN）
              ├── 静态 HTML/CSS/JS（Next.js 导出 out/）
              └── 3D 资源（GLB/纹理，无限带宽）
构建与发布：GitHub Actions（公开仓库免费，单条可信流水线）
              ├── next build → out/
              ├── GitHub API → content/github-cache.json（Token 仅在 secrets，随 US-012）
              ├── lint / typecheck / npm test / 质量指标 / Playwright 四项目 / Lighthouse CI
              └── 门禁全绿 → deploy job 用 wrangler 上传同一份 out/ artifact → Pages
```

### 开发红线（写进代码规范）

1. 文字先于 3D：任何路由的 HTML 必须含核心文案，Canvas 不得成为 LCP 元素。
2. 每个 3D 组件必须有 fallback：Suspense fallback + WebGL 检测 + 资源失败降级 + 上下文丢失恢复一次后转静态。
3. 显式 dispose GPU 资源（geometry / material / texture）；离开视口暂停渲染循环。
4. GitHub Token 不进前端 bundle。
5. i18n 路由用 generateStaticParams 全量预生成；静态导出无 middleware。
6. 论文状态三值约束：Published | Preprint | In Progress。
7. 移动端 pixelRatio ≤ 1.5，降粒子、关实时阴影与高成本后处理。

### 现状与待办

- 现状：选型与架构已论证（Tech.md），无应用代码。
- 待办：**T-001** 初始化应用骨架（注意 create-next-app 与现有 package.json 冲突，手动初始化或合并模板）。

---

## 2. 数据库

### 决策：本项目无数据库（2026-11-10）

依据 Tech.md 确认的零费用约束：无数据库、无 CMS、无表单后端。准备清单中的"数据库表结构 / 数据库迁移"两项按以下方式等价落地：

| 清单检查项 | 本项目等价物 |
| --- | --- |
| 数据库表结构 | `content/` 结构化数据 + TypeScript 类型约束（schema 即类型） |
| 数据库迁移 | 不适用。schema 变更 = 修改 TS 类型 + 构建期校验；无运行时数据，无需迁移脚本 |

### content/ schema 约定（T-002 落地）

| 文件 | 内容 | 关键字段 |
| --- | --- | --- |
| profile.ts | 姓名/笔名/英文名、身份、社交链接 | name{zh,en}, tagline{zh,en}, links[], email |
| journey.ts | 经历时间线 | date, title{zh,en}, summary{zh,en}, category, detail?, public |
| research.ts | 研究方向 | slug, title{zh,en}, problems[], methods[], status, public |
| publications.ts | 论文 | title（原文）, authors, year, status（三值）, links?, public |
| projects.ts | 开源项目 | repo, description{zh,en}, stack[], featured, fallback 数据, public |
| products.ts | 软件产品 | name, logo?, cover?, status（四值）, url?, public |
| writing.ts | 文学作品与文章 | title{zh,en}, type, status, cover?, externalUrl?, public |
| reading.ts | 书单 | title, author, rating?, note{zh,en}?, public |
| interests.ts | 跨领域兴趣 | field, description{zh,en}?, related[]?, public |

通用规则：每条数据含 `public: boolean`（false 构建时过滤）；可选字段缺失时默认值或条件渲染，不崩；简介双语，论文/项目名称保留原文。

### 未来迁移路径

若未来需要 CMS，content/ 类型即迁移契约：保持字段不变，把数据源从文件换成 CMS API，页面组件无需重写。届时再评估数据库与费用，当前不做。

---

## 3. 持续集成

### 决策（2026-11-11 用户确认方案 A）

| 检查项 | 选择 | 说明 |
| --- | --- | --- |
| 仓库 | `https://github.com/George-102/Personal-Digital-Universe`（公开） | 当前远端为空仓库、本地尚未关联 remote；T-004b 关联并首次推送 |
| CI 服务器 | GitHub Actions（公开仓库免费） | `PR` + `push main` 触发；单工作流 `.github/workflows/verify.yml` 两个 job：`verify` → `deploy`；`concurrency` 取消同分支旧运行；超时 25 分钟 |
| CI 监视器 | GitHub 通知 + README 状态徽章 + UptimeRobot | 徽章 `https://github.com/George-102/Personal-Digital-Universe/actions/workflows/verify.yml/badge.svg`（T-004b）；部署后 UptimeRobot 5 分钟 HTTP 检查（T-005b） |
| 构建脚本 | package.json scripts | 见下表 |
| 运行时 | Node.js 26（本地与 CI 统一） | `scripts/*.mjs` 直接 import `.ts`，依赖 Node 22.18+ 原生类型剥离；现有 CI 的 Node 20 必失败，随 T-004a 用 `.nvmrc` + `engines` + `setup-node` 统一 |
| CD | Actions + Wrangler Direct Upload | 关闭 Pages Git 自动构建，门禁全绿后上传被验证的同一份 `out/`；见 §5 |

### 构建脚本现状

| 脚本 | 状态 | 用途 |
| --- | --- | --- |
| `npm run verify:local` | ✅ 已建 | **本地默认**：lint + typecheck + build + 单测 + 质量指标，零浏览器；与 CI `verify` job 前 5 步逐命令等价 |
| `npm run verify` | ✅ 已建 | 完整门禁的本地等价入口：build + Playwright 全项目 + Lighthouse CI + 质量指标；实际门禁由云端 CI 执行，本地勿跑 |
| `npm run verify:quick` | ✅ 已建 | 可选的单项目浏览器抽查：build + 无 WebGL 降级项目（会启动 Chromium + serve，非本地默认） |
| `npm run verify:build` / `verify:e2e` / `verify:lighthouse` | ✅ 已建 | 门禁的三个组成 |
| `npm run verify:metrics` | ✅ 已建 | 质量指标门禁：audit + check:i18n + size |
| `npm run audit` | ✅ 已建 | 0 高危及以上漏洞（脚本指定官方 registry，npmmirror 不支持 audit 端点） |
| `npm run check:i18n` | ✅ 已建 | zh/en 键覆盖率 100%（messages/ 建立后实测） |
| `npm run size` | ✅ 已建 | JS 总量 ≤1MB gzip（T-001 产出 out/ 后实测） |
| `npm test` | ✅ 已建 | node:test 运行 scripts/ 测试；T-003 迁移 Vitest（未提前，CI 暂用 node:test） |
| `npm run dev` / `build` / `start` | ✅ 已建 | 本地开发与静态导出 |

### CI/CD 流水线（.github/workflows/verify.yml，定稿待落地）

`verify` job：`npm ci` → `lint` / `typecheck` → `npm run build`（prebuild 校验 content/，产物级单测依赖 `out/` 故 build 必须早于 `npm test`）→ `npm test` → `verify:metrics` → 安装 `chromium webkit` → `playwright test` 四项目 → `lhci autorun`（CI 下 upload 改 filesystem）→ 上传 `out/` artifact 与报告。前 5 步即本地 `npm run verify:local`；**浏览器 E2E 与 Lighthouse 重验证只在云端执行**，本地不跑（本地 `retries: 0` + 30s 超时易 flake，且非 CI 的 lhci 会生成公开报告链接）。

`deploy` job：`needs: verify`，仅 `push main` 触发，下载同一份 artifact → `wrangler pages deploy out --project-name=... --branch=main`。密钥仅 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 存 Actions secrets；fork PR 不注入 secrets、不部署；同仓库 PR 可选 `--branch=<分支名>` 预览。

**前置必修（T-004a）**：现有配置有五处必红 —— Node 20 与 TS 类型剥离不兼容；只装 Chromium 而缺 WebKit；28 个未实现故事的 E2E 断言失败（须显式 `test.fixme()` 绑定 US-004 / US-019 / 未来路由，保留全部断言，不得降阈值或用 grep 过滤）；缺 `lint` / `typecheck` / `npm test`；`lighthouserc.js` 的 `temporary-public-storage` 会把报告公开。另 `init.sh` 在 WSL 下无 node、`init.ps1` 中文编码损坏，需先修好标准启动路径。

现状：方案与文档已定稿，流水线尚未跑通。待办：**T-004a → T-004b → T-005a → T-005b**。

---

## 4. 测试

### 决策：四层测试体系

| 层 | 工具 | 覆盖 | 执行主体 | 状态 |
| --- | --- | --- | --- | --- |
| 单元 / 集成 | Vitest（+ Testing Library） | content/ 数据校验（缺字段、public 过滤、论文状态枚举）、工具函数、组件渲染 | 本地 `verify:local` + 云端 CI | ⏳ T-003 |
| E2E | Playwright（4 项目：桌面 / 无 WebGL / 移动 Chrome / 移动 Safari） | 核心可用性、WebGL 与资源降级、i18n、主题、a11y/reduced-motion、SEO、横向溢出、外链 | **仅云端 CI**（本地不跑） | ✅ e2e/ 9 个 spec 已建 |
| 性能 / SEO 门禁 | Lighthouse CI | 性能 ≥0.85、可访问性 ≥0.95、SEO ≥0.95、最佳实践 ≥0.90；LCP ≤2.5s、CLS ≤0.1、TBT ≤200ms | **仅云端 CI**（本地不跑） | ✅ lighthouserc.js 已建 |
| 质量指标门禁 | npm audit / check-i18n.mjs / size-limit | 0 高危漏洞；zh/en 键覆盖率 100%；JS 总量 ≤1MB gzip | 本地 `verify:local` + 云端 CI | ✅ T-006 已建（size 实测待 T-001） |
| 人工验收 | docs/DoD.md 末尾清单 | 视觉质量、内容真实性、笔名一致性、版权 | 人工（每次发布前） | 每次发布前逐项打勾 |

注：audit 脚本指定官方 registry（npmmirror 无 audit 端点）；basic-ftp / compression / postcss 经 package.json overrides 固定至修复版（^6.2.6 / ^1.8.2 / ^8.5.32），均为工具链间接依赖，不进前端 bundle。postcss override 于 2026-11-11 加入（three 依赖链引入 high 漏洞 GHSA-qx2v-qp2m-jg93 等）。@typescript-eslint 的 6 个 moderate 暂无修复版，仅 dev 依赖，门禁卡 high 不受影响。

**TDD 原则（AGENTS.md）：每个功能先写失败测试，再实现。** 单元测试随 T-003 基础设施落地后成为默认流程；E2E 验收标准已先行存在，功能实现以通过对应 spec 为准。

门禁逻辑：`npm run verify` 全部通过才可合并/发布——由云端 `.github/workflows/verify.yml` 的 `verify` job 逐条执行等价全链（push main / PR 自动触发），CI run URL 为证据；本地默认只跑 `npm run verify:local`，不替代云端门禁。不得为通过验收而悄悄改弱断言或阈值（AGENTS.md）。

---

## 5. 发布

### 决策（2026-11-11 定稿）

- **平台**：Cloudflare Pages（静态导出 `out/`），免费子域名 `*.pages.dev`，无限带宽，允许商用，0 元/月。
- **部署方式**：**GitHub Actions + Wrangler Direct Upload**（方案 A）。关闭 Pages 的 Git 自动构建，改由 Actions 的 `deploy` job 在 `verify` 全绿后上传同一份 `out/` artifact。理由：避免 Git 集成与 CI 双构建，避免「CI 还没跑完就已上线」，且部署产物就是被验证的那份。
- **发布流程**：PR → `verify` 全绿 → 合并 main → 同一条流水线 `deploy` 自动上线 → UptimeRobot 外部可用性检查 → DoD 人工验收打勾 → 对外分享链接。
- **预览部署**：同仓库 PR 可用 `--branch=<分支名>` 得到预览 URL；fork PR 只跑门禁，不部署（secrets 不注入）。
- **密钥**：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 仅存 GitHub Actions secrets；Token 不进前端 bundle。Pages 项目需先在 Cloudflare 创建一次。
- **监控统计**：Cloudflare Web Analytics（免费、无 Cookie、含 Core Web Vitals）+ UptimeRobot 免费层（5 分钟间隔邮件告警）。Sentry 免费层可选，非必需。
- **许可证分层**：代码 `LICENSE` = PolyForm Noncommercial 1.0.0；内容 `LICENSE-CONTENT` = CC BY-NC-ND 4.0；作品页与 Footer 版权声明。字体用开源可商用（Inter / Noto Sans SC / JetBrains Mono）。
- **费用**：0 元/月。前提：免费子域名、不升级付费计划、不接付费服务。独立域名（约 50–100 元/年）是唯一可能的未来费用，不在当前范围。

### 现状（2026-11-11）

- **T-004a / T-004b / T-005a 均已 passing**：Node 26 前置修复；`verify` 全量门禁（lint / typecheck / build / 单测 / 质量指标 / Playwright / Lighthouse）；首次推送与分支保护、README 徽章实测 passing；`deploy` + `preview` job 用 Wrangler Direct Upload 上传被验证的同一份 `out/`。生产 `https://personal-digital-universe.pages.dev` 实测 HTTP 200。
- **T-005b 代码部分已落地**：`LICENSE`（PolyForm Noncommercial 1.0.0）、`LICENSE-CONTENT`（CC BY-NC-ND 4.0）、双语 Footer 版权、`lib/site.ts` 真实域名与 sitemap/robots、`scripts/sync-licenses.mjs`、`docs/DoD.md` D 组已验证项打勾。
- **监控（已验证）**：Cloudflare Web Analytics 在 Pages 项目 → Metrics 一键开启；run 42999448346 部署后实测 `/` 与 `/en/` 的 HTML 均含 `cloudflareinsights.com/beacon.min.js` + `data-cf-beacon`，无需改代码。UptimeRobot HTTPS monitor `804633325`（type=1、interval=300、告警联系人 `9024699_0_0`）回查 `status=2`（Up）。两项均由用户在控制台/本机终端配置，agent 未接触第三方账号密钥；证据见 `feature_list.json` T-005b。
- **后续**：T-003（Vitest 基础设施）→ US-004 → 其余 roadmap。

---

## 变更记录

- 2026-11-10：初版。记录五类技术准备决策；无数据库决策；测试四层体系；发布流程。
- 2026-11-10：T-006 质量指标门禁落地（audit / i18n 覆盖率 / size-limit），修复依赖漏洞（@lhci/cli 0.16 + overrides）。
- 2026-11-11：用户确认 CI/CD 方案 A（Actions + Wrangler 直传）及 T-004/T-005 提前到 US-004 之前；同步 §1 架构图、§3 持续集成、§5 发布决策；记录五处 CI 必红前置、公开仓库地址与 Node 26 要求。
- 2026-11-11：修正准备状态总览与 §5「现状与待办」的滞后描述——T-004a/b、T-005a 已 passing、T-005b 代码部分已落地；记录 Cloudflare Web Analytics 的 Pages 一键开启（下次部署自动注入 beacon）与 UptimeRobot 账号侧配置方式。