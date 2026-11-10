# Personal Digital Universe

3D 沉浸式个人数字空间 —— 融合科研、开源项目、软件产品与文学创作的个人作品集网站。

需求见 [docs/PRD.md](docs/PRD.md)，技术决策见 [docs/Tech.md](docs/Tech.md) 与 [docs/Development.md](docs/Development.md)，完成定义见 [docs/DoD.md](docs/DoD.md)。功能状态唯一事实来源是 `feature_list.json`，会话进度见 `claude-progress.md`。

## 本地启动

要求 Node.js 20+（CI 使用 20，本地 24/26 已验证）。

```bash
bash init.sh      # 统一入口：环境检查 + npm ci + 配置冒烟验证
npm run dev       # 开发服务器 http://localhost:3000
```

Windows PowerShell 下可用 `./init.ps1` 代替 `init.sh`。

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
- GitHub 仓库数据在 CI 构建时抓取为 `content/github-cache.json`，Token 只存在于 Actions secrets，不进前端 bundle。

修改 `messages/*.json` 后运行 `npm run check:i18n` 确认键覆盖率 100%。

## 部署方式

纯静态导出（`output: 'export'` + `trailingSlash: true`），目标平台 Cloudflare Pages（随 T-005 配置）：

- main 分支合并 → 自动构建（`next build`）→ 部署 `out/` 目录。
- 免费子域名 `*.pages.dev`，无限带宽，0 元/月。
- 发布流程：PR → CI `npm run verify` 全绿 → 合并 main → 自动部署 → DoD 人工验收打勾 → 对外分享。

## 验收命令

| 命令 | 用途 |
| --- | --- |
| `npm run verify` | 完整门禁：build + Playwright 全项目 + Lighthouse CI + 质量指标 |
| `npm run verify:quick` | 日常快速检查：build + 无 WebGL 降级项目 |
| `npm run verify:build` | 仅构建（next build） |
| `npm run verify:e2e` | Playwright 四项目：桌面 / 无 WebGL / 移动 Chrome / 移动 Safari |
| `npm run verify:lighthouse` | Lighthouse CI（性能 ≥0.85、a11y ≥0.95、SEO ≥0.95、最佳实践 ≥0.90） |
| `npm run verify:metrics` | audit + check:i18n + size 三个质量指标 |
| `npm run audit` | 0 高危及以上漏洞（指定官方 registry） |
| `npm run check:i18n` | zh/en 键覆盖率 100% |
| `npm run size` | JS 总量 ≤1MB（size-limit） |
| `npm test` | 单元测试（当前 node:test，T-003 迁移 Vitest） |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript 检查 |

首次运行 E2E 前需安装浏览器：`npx playwright install`。门禁断言与阈值不得为通过验收而改弱（AGENTS.md）。

## 降级说明

3D 遵循三层降级契约（US-001b/d 落地，验收见 `e2e/degradation.spec.ts`）：

1. **WebGL 不可用**：不渲染 Canvas，显示 CSS 动态/静态背景，文字与导航完整可见。
2. **3D 资源加载失败**：Suspense fallback 使用 CSS/图片占位，不白屏、不阻塞阅读。
3. **运行中上下文丢失**：尝试恢复一次，失败转静态模式，无未捕获异常。

核心原则：文字先于 3D —— 任何路由的静态 HTML 必须含核心文案，Canvas 不得成为 LCP 元素；组件卸载显式 dispose GPU 资源，离开视口暂停渲染；移动端 pixelRatio ≤1.5、降粒子、关实时阴影与高成本后处理。

## 许可证

代码与内容许可证分层（随 T-005 落地）：代码 PolyForm Noncommercial 1.0.0，内容 CC BY-NC-ND 4.0。当前仓库仅供学习、研究和非商业用途。