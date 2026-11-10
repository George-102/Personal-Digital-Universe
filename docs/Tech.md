以下技术文档基于你确认的约束：**零费用（免费子域名 + 免费托管 + 免费第三方服务）、支持 3D 与动态特效、中英双语、GitHub 公开仓库、内容可公开但不含隐私、论文只展示名称、使用笔名和英文名、不允许商用**。文档按“开发 → 构建 → 部署 → 监控 → 许可证”的顺序组织，每个环节标注具体技术选择和理由，并在最后给出可直接落地的许可证方案。

---

# Personal Digital Universe 技术文档

## 1. 技术栈总览

| 层面            | 选择                                              | 用途                                            |
| --------------- | ------------------------------------------------- | ----------------------------------------------- |
| 前端框架        | **Next.js 15+（App Router）**                     | SSG/SSR、路由、SEO、结构化数据                  |
| 语言            | **TypeScript**                                    | 类型安全，内容数据结构可约束                    |
| 3D 渲染         | **Three.js + React Three Fiber（R3F）+ Drei**     | 3D 场景、粒子、几何体、相机控制                 |
| 复杂时间线/滚动 | **GSAP（ScrollTrigger）**                         | 滚动驱动动画、相机运动、场景转场                |
| UI 动画         | **Framer Motion / Motion**                        | 卡片悬停、渐入、按钮反馈、主题切换过渡          |
| 样式            | **Tailwind CSS**                                  | 快速响应式布局，配合 CSS 变量做主题             |
| 图标            | **Lucide**                                        | 轻量统一图标                                    |
| 国际化          | **next-intl**                                     | App Router 原生 i18n，中英双语路由与文案管理    |
| 内容维护        | **TypeScript/JSON 数据文件 + Markdown**           | 项目、论文、作品、文章结构化维护，零数据库费用  |
| 托管            | **Cloudflare Pages（静态导出）+ Workers（按需）** | 免费、无限带宽、全球 CDN、适合 3D 静态资源      |
| 部署适配        | **@opennextjs/cloudflare（如使用 SSR/API）**      | Cloudflare 官方推荐的 Next.js 部署路径          |
| CI/CD           | **GitHub Actions（公开仓库免费）**                | 构建、Playwright 验收、Lighthouse CI            |
| 统计            | **Cloudflare Web Analytics**                      | 免费、隐私优先、无 Cookie、包含 Core Web Vitals |
| 可用性监控      | **UptimeRobot 免费计划**                          | 5 分钟间隔 HTTP 检查，邮件告警                  |
| 错误追踪        | **Sentry 免费层（5K 错误/月）或 GlitchTip**       | 前端异常捕获，可选                              |

**不需要的东西（零费用关键）：** 数据库、CMS、联系表单后端、评论系统、用户系统、付费 CDN、付费监控。

---

## 2. 为什么托管选 Cloudflare Pages，而不是 Vercel

你的网站核心是**静态内容 + 3D 资源 + 少量 API（GitHub 数据 fallback、可能的联系逻辑）**，不需要持续运行的服务端进程。在这个场景下，Cloudflare Pages 的免费层对 3D 作品集明显更合适：

|              | Cloudflare Pages                  | Vercel Hobby       | Netlify Free       |
| ------------ | --------------------------------- | ------------------ | ------------------ |
| **免费带宽** | **无限**                          | 100 GB/月          | 约 100 GB/月       |
| **免费构建** | 500 次/月                         | 6,000 分钟/月      | 300 credits/月     |
| **免费分析** | **Cloudflare Web Analytics 免费** | 付费               | 付费               |
| **商业使用** | 允许                              | **仅限非商业**     | 允许（额度内）     |
| **超额行为** | 构建排队，不扣费                  | 警告后可能产生费用 | credits 耗尽后暂停 |

Cloudflare Pages 的**无限带宽**是决定性优势：3D 网站的 GLB 模型、纹理、粒子贴图、封面图片加起来容易达到数十 MB 级别，作品集如果被分享到社交媒体或 Hacker News，100 GB 月流量可能快速耗尽。Cloudflare 的 300+ 边缘节点还能让静态资源就近分发，降低 3D 首屏加载时间。Vercel 虽然对 Next.js 支持最好，但 **Hobby 计划仅限非商业使用**，而你的长期规划包含创业和软件产品，现在就把“非商业”作为托管前提是不安全的。

**部署方式的选择：**
- 如果最终采用**纯静态导出**（`output: 'export'`）：直接部署到 Cloudflare Pages，构建命令 `next build`，输出目录 `out`，零 Worker 调用，最简单、最省额度。
- 如果某些路由需要**SSR/API**（例如动态 OG 图片、服务端 GitHub 代理）：使用 `@opennextjs/cloudflare` 构建到 Cloudflare Workers，而不是已经 deprecated 的 `next-on-pages`。Workers 免费层每天 10 万请求，对个人作品集绰绰有余。

**建议第一版走纯静态导出**，把所有“动态”放在客户端（3D、动画、i18n 切换、Copy Email），仅保留 GitHub 数据在构建时抓取生成本地 JSON。这样可以完全避开 SSR 的复杂度和 Worker 额度。

---

## 3. 3D 与动效的技术落地要点

你的 PRD 对 3D 的要求是“沉浸感但不能牺牲信息可读性”，技术上有几个关键约束必须在开发阶段就写进代码规范。

### 3.1 加载策略
- **文字优先**：页面 HTML 中先渲染姓名、身份、导航和核心文案，3D Canvas 异步加载。LCP 不应等待 3D 资源。
- 3D 场景使用 `React.lazy` + `Suspense`，首屏 Canvas 挂载后延迟初始化粒子系统。
- GLB 模型使用 **Draco 压缩**，纹理使用 **KTX2**，控制单场景资源总量。
- 非首屏 3D 场景（Research、Writing）按需加载，离开视口时暂停渲染循环。

### 3.2 性能与资源释放
Three.js **不会自动回收 GPU 资源**。移除对象时必须显式 `geometry.dispose()`，遍历材质的所有纹理逐个 `dispose()`，再 `material.dispose()`；GLTF 的 ImageBitmap 还要 `texture.source.data.close()`。R3F 中如果对象放在声明式树里，由 R3F 管理生命周期；但如果手动 `add`/`remove`，必须自己清理。否则来回切换模块后 GPU 内存会持续增长，低端设备最终崩溃。

其他关键优化：
- 约束 `pixelRatio`（移动端不超过 1.5）。
- 重复几何体使用 **InstancedMesh** 减少 draw call。
- 使用 **LOD**，远处物体降面数。
- 移动端降低粒子数量、关闭实时阴影和高成本后处理（Bloom、SSAO 等）。

### 3.3 降级路径
代码中必须实现三层降级，并与 PRD 的验收标准对应：

1. **WebGL 不可用**：Canvas 组件不渲染，显示静态背景图或 CSS 渐变 + 动态噪点，文字和导航完全正常。
2. **3D 资源加载失败**：`Suspense` 的 `fallback` 使用封面图或 CSS 占位，不阻塞内容。
3. **运行中上下文丢失**：监听 `webglcontextlost`，尝试恢复一次；失败则切换到静态模式。

同时监听 `prefers-reduced-motion`：命中时关闭持续粒子运动、滚动驱动相机、复杂转场，保留必要导航和按钮反馈。

---

## 4. 中英双语方案

使用 **next-intl**。它是 Next.js App Router 的原生 i18n 方案，支持 React Server Components 和静态渲染，是 2026 年新 App Router 项目的默认推荐。

**路由结构：**
```
/          → 中文（默认）
/en        → 英文
```
或反过来（英文默认），取决于你希望搜索引擎首先抓取哪种语言。建议中文默认，因为你的读者和潜在导师/招聘方可能中文为主，英文作为可切换选项。

**静态导出时的关键配置：**
- `output: 'export'`
- `trailingSlash: true`（Cloudflare Pages 兼容）
- 使用 `generateStaticParams` 预生成所有语言的所有页面路由
- 静态导出模式下 **Next.js middleware 不可用**，语言重定向需要通过 Cloudflare 的 redirect 规则或根页面跳转实现。

**内容数据同时包含 `zh` 和 `en` 字段**，在构建时分别渲染。论文名称只保留原文（通常是英文），不必翻译；项目名称保持英文原名，简介双语。作品《法渊》保留中文名，英文简介可以写 *Fayuan (working title)*。

---

## 5. 内容维护架构（零 CMS 费用）

所有内容放在 `content/` 目录，TypeScript 类型定义约束字段，页面在构建时读取。**新增一条数据，页面自动出现；字段缺失时不崩**，用默认值或条件渲染处理。

```
content/
├── profile.ts          # 姓名/笔名/英文名、身份描述、社交链接
├── journey.ts          # 经历时间线（教育、科研、开源、产品、文学）
├── research.ts         # 研究方向（DAC、LLM、MARL、Agentic AI）
├── publications.ts     # 论文（仅名称 + 状态 + 可选链接）
├── projects.ts         # 开源项目（GitHub 仓库 + 本地 fallback 数据）
├── products.ts         # 软件产品（状态、链接、截图）
├── writing.ts          # 《法渊》等作品 + 文章
├── reading.ts          # 阅读书单
└── interests.ts        # 跨领域兴趣
```

**GitHub 数据的策略**：构建时在 CI 中调用公开 GitHub API 抓取仓库 star、描述、语言，写入 `content/github-cache.json`。**Token 只存在于 GitHub Actions secrets 中，不进入前端 bundle**。如果 API 失败或超限，构建继续，使用上一次缓存或手写 fallback 数据。这样既满足“GitHub API 失败不崩”，又不需要运行时 Worker 代理。

**公开状态控制**：每个对象包含 `public: boolean`，设为 `false` 的条目在构建时过滤掉。论文状态严格用 `Published | Preprint | In Progress`，未发表论文只出现在 Research 描述中，不进入 Publications 列表。

---

## 6. CI/CD 与验收自动化

GitHub 公开仓库的 Actions **完全免费**，不限分钟数。验收脚本在此运行，不产生费用。

**建议的 GitHub Actions 工作流：**

```yaml
# .github/workflows/verify.yml
name: Verify
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - run: npx lighthouse-ci autorun
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

**Playwright 验收脚本覆盖的自动化检查：**

| 类别           | 检查项                                                       |
| -------------- | ------------------------------------------------------------ |
| 核心可用性     | 首页标题/姓名可见；导航点击到达对应 section；移动菜单展开关闭 |
| WebGL 降级     | 用 `--disable-webgl` 启动 Chromium，断言文字和导航仍可见     |
| 3D 失败降级    | 拦截 GLB/纹理请求返回 404，断言 fallback 出现且不白屏        |
| i18n           | `/` 中文关键文案存在；`/en` 英文关键文案存在；语言切换后 URL 和文案正确 |
| 主题           | 切换 dark/light 后 `data-theme` 或 class 变化；localStorage 写入；刷新后保持 |
| Copy Email     | 点击后剪贴板内容正确（Playwright 可读 clipboard）            |
| 横向溢出       | 每个断点断言 `document.documentElement.scrollWidth <= clientWidth` |
| reduced motion | 模拟 `prefers-reduced-motion: reduce`，断言持续动画元素被隐藏或暂停 |
| SEO            | 每个主要路由有非空 `<title>`、`meta[name=description]`、`og:title` |
| Sitemap/Robots | `/sitemap.xml` 和 `/robots.txt` 返回 200 且包含预期 URL      |

**Lighthouse CI 阈值建议**（在 `.lighthouserc.js` 中配置）：
- Accessibility ≥ 95
- SEO ≥ 95
- Best Practices ≥ 90
- Performance ≥ 85（3D 首页可单独放宽到 80，但 LCP 文案元素必须优先出现）

**不放入自动化、留人工验收的：** 内容真实性（论文状态、产品状态、经历时间）、视觉质量（3D 是否遮挡文字、动效是否克制）、笔名和英文名的展示一致性、版权页准确性。

---

## 7. 监控与统计（全部免费）

| 服务                            | 用途                                      | 免费额度                       | 集成方式                                              |
| ------------------------------- | ----------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| **Cloudflare Web Analytics**    | 访问量、来源、Core Web Vitals             | 免费，无 Cookie，无限 pageview | Cloudflare Dashboard 开启，自动注入脚本，不需要改代码 |
| **UptimeRobot**                 | 可用性监控，宕机邮件告警                  | 50 个 monitor，5 分钟检查间隔  | 添加 HTTPS monitor 指向你的 `*.pages.dev` 域名        |
| **Sentry（免费层）**            | 前端 JS 异常、3D 上下文丢失、资源加载失败 | 5K 错误/月，1 用户             | `@sentry/nextjs` SDK，在 `error.tsx` 和 3D 边界中上报 |
| **GitHub Actions 构建失败通知** | 部署失败告警                              | 免费                           | GitHub 默认邮件通知                                   |

**错误监控的取舍**：如果不想引入 Sentry SDK 增加 bundle 体积，可以先用 **GlitchTip 免费层（1K 事件/月）** 或**仅依赖 Cloudflare 的构建日志 + UptimeRobot 可用性告警**。对于个人作品集，UptimeRobot + Playwright CI 已经能覆盖“网站挂了”和“关键路径坏了”两大类问题；Sentry 是加分项，不是必需项。

**隐私合规**：Cloudflare Web Analytics 不使用 Cookie 或 localStorage，不采集 PII，因此不需要 Cookie 同意横幅。如果未来加入 Sentry 或其他采集工具，再评估是否需要隐私政策更新。

---

## 8. 许可证与版权（“不允许商用”的落地方案）

你提到“不允许商用，其他都可以”。这个表述需要拆成**代码**和**内容**两部分，因为它们适用不同的许可证逻辑。

### 代码：建议 MIT + 附加说明，或直接使用非商业源码许可证

MIT 允许商用、修改、分发，只要求保留版权声明。如果你**坚决不允许任何人商用你的代码**，MIT 不是最匹配的。更直接的选择是 **PolyForm Noncommercial License 1.0.0** 或 **CC BY-NC-SA 4.0**（后者不推荐用于软件，因为 Creative Commons 官方不建议将其用于代码）。

**推荐方案：**
- 在 `LICENSE` 中放入 **PolyForm Noncommercial License 1.0.0**，明确“仅限非商业目的使用”。
- 在 README 中单独写一段中文说明：“本仓库代码仅供学习、研究和非商业用途。未经作者书面许可，不得用于商业产品、商业服务或产生收入的活动。”
- 如果你未来希望代码被更多人使用、但保留内容版权，也可以代码用 MIT、内容用 CC BY-NC-ND 4.0。**两者分开是最清晰的。**

### 内容（文章、小说、图片、3D 场景设计）：CC BY-NC-ND 4.0

CC BY-NC-ND 4.0 的含义是：**署名 + 非商业性使用 + 禁止演绎**。任何人可以分享你的原文/原图，但必须注明作者，不能用于商业目的，不能修改后发布。这完全匹配你“不允许商用，其他都可以”的意愿，同时保留了你对作品完整性的控制。

**具体落地：**
1. 仓库根目录 `LICENSE` 放代码许可证（PolyForm Noncommercial 或 MIT）。
2. `content/LICENSE` 或 `LICENSE-CONTENT` 放 CC BY-NC-ND 4.0 的链接和中文摘要。
3. 每篇作品/文章页面底部显示：**© [年份] [笔名]. 本文采用 CC BY-NC-ND 4.0 许可，禁止商业使用和演绎。**
4. 网站 Footer 统一写版权声明，并链接到两个许可证文件。
5. 字体使用开源可商用字体（如 Inter、Noto Sans SC、JetBrains Mono），自托管或通过 Cloudflare 字体服务，避免字体版权风险。

**软件著作权（软著）**：如果你担心国内有人照搬你的网站代码或产品，软著登记在中国是**免费**的（官方登记费自 2017 年起已取消，个人自行申请零成本）。但这通常是针对你发布的软件产品，而不是个人作品集网站本身。作品集代码公开在 GitHub 上，软著的意义有限；如果你的独立软件产品需要上架应用商店或融资，再单独考虑软著登记。

---

## 9. 零费用架构一览

```
用户浏览器
    │
    ▼
Cloudflare Pages（免费子域名 *.pages.dev）
    ├── 静态 HTML / CSS / JS（Next.js 导出）
    ├── 3D 资源（GLB、KTX2、纹理）— 无限带宽
    └── Cloudflare CDN（300+ 边缘节点）
    │
    ├── Cloudflare Web Analytics（免费，隐私优先）
    ├── UptimeRobot 免费监控（5 分钟检查，邮件告警）
    └── Sentry 免费层（可选，5K 错误/月）

构建与验收：
GitHub（公开仓库，免费）
    └── GitHub Actions（免费）
          ├── npm run build
          ├── Playwright（E2E 验收）
          ├── Lighthouse CI（性能/可访问性/SEO 门禁）
          └── 构建时 GitHub API 抓取 → content/github-cache.json
```

**总费用：0 元 / 月**，前提是：使用 `*.pages.dev` 免费子域名、不购买独立域名、不升级任何付费计划、不接入付费数据库/CMS/表单服务。如果未来需要独立域名，那是唯一现实的年度费用（约 50–100 元/年，不属于本项目当前零费用范围）。

---

## 10. 需要在开发前就写进 README 的技术约束

1. **文字先于 3D 渲染**：任何路由的 HTML 必须包含核心文案，3D Canvas 不得成为 LCP 元素。
2. **每个 3D 组件必须有 fallback**：`Suspense fallback` + WebGL 检测 + 资源失败降级。
3. **显式 dispose GPU 资源**：移除 Three.js 对象时同步清理 geometry、material、texture。
4. **GitHub Token 不进前端**：只在 CI 构建时使用，前端只读缓存 JSON。
5. **i18n 路由静态预生成**：`generateStaticParams` 覆盖 `zh` 和 `en` 的所有页面。
6. **论文状态三值约束**：`Published | Preprint | In Progress`，未发表不得进入 Publications。
7. **不允许商用的许可证分层**：代码用 PolyForm Noncommercial（或 MIT + README 声明），内容用 CC BY-NC-ND 4.0。
8. **验收脚本在公开仓库 CI 中免费运行**：Playwright + Lighthouse CI 作为合并门禁。
