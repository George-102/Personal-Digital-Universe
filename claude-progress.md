# Claude Progress — Personal Digital Universe

## 当前阶段（2026-11-11）

**迭代1 首个需求 US-001（3D 首页）已完成**：feature_list.json 中 11 个拆分任务（T-001a/b/c、T-002a/b/c、US-001a~e）全部 passing，证据逐条记录。应用骨架、中英双语静态导出、content/ 数据架构、3D 首页与三层降级均已落地并验证。

**本轮（用户要求尽早集成）：CI/CD 方案定稿 + 文档同步，未实现流水线代码。** 用户确认四项：①方案 A（GitHub Actions + Wrangler Direct Upload，关闭 Cloudflare Pages Git 自动构建）；②T-004/T-005 提前到 US-004 之前；③公开仓库 `https://github.com/George-102/Personal-Digital-Universe.git`；④28 个未实现故事的 E2E 失败项用 `test.fixme()` 绑定 roadmap，不删断言、不降阈值。方案已写入 `docs/Development.md` §1/§3/§5、`docs/Tech.md` §2/§6/§9、`README.md`、`docs/DoD.md`；任务拆为 T-004a/b、T-005a/b（priority 13-16）写入 `feature_list.json`，roadmap 中原 T-004/T-005 已移除，T-003 保持原位不提前。下一步：**T-004a CI 前置基础修复**。

**本轮（用户授权推进 CI/CD）：T-004a 已完成并验证。** 前提已齐：用户确认 Cloudflare Pages 为 **Direct Upload** 项目（`personal-digital-universe`，生产域名 `personal-digital-universe.pages.dev`，无自定义域名），GitHub secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 已配置（`gh secret list` 核对名称），`gh` 登录账号 George-102 且对公开仓库有 admin 权限，远端仍为空仓库、本地未关联 remote。T-004a 修复 Node 版本、双启动入口、Lighthouse 报告、28 项 roadmap fixme，证据见 `feature_list.json` T-004a。**T-004b 已完成并验证**（首次推送、run 42976363844 全绿、徽章 passing、分支保护 verify）。**T-005a 已通过**：用户移除 API Token 的 Client IP Address Filtering 后 `gh run rerun 42978098873 --failed` 的 deploy 成功（38s），生产 URL 实测 HTTP 200。**T-005b 代码部分已完成**（许可证 / Footer / SITE_URL / DoD），监控两项仍需用户操作。

## 已验证（有真实运行证据）

- `bash init.sh` 成功（2026-11-10 与 2026-11-11 多次，npm ci 路径与 CI 一致）：Node v26.10.0 / npm 11.19.1，feature_list.json 解析通过，lighthouserc.js 加载通过，Playwright 测试可列出。
- **T-006 质量指标门禁**（2026-11-10）：audit / check-i18n（TDD 4 测试）/ size-limit 落地；2026-11-11 首次实测 check:i18n（5 键 100%）与 size（≈430kB brotli ≤1MB）通过。
- **T-001a/b/c**（2026-11-11）：Next.js 15.5.29 骨架 build/dev 验证；output:'export' + next-intl（/ 中文、/en/ 英文，[locale] 仅预生成 en 避免重复）；README 五节与脚本逐一核对。
- **T-002a/b/c**（2026-11-11）：content/ 九类类型 + prebuild 校验（实测拒绝非法论文状态）；profile 真实数据（苏子豪/Christopher Chang，用户确认）驱动首页，改数据→产物跟随变化实测；public 过滤统一出口 content/index.ts，隐藏条目不泄漏实测。
- **US-001a~e**（2026-11-11）：首页文字层静态可见 + SEO/OG/Person JSON-LD/sitemap/robots；深色视觉 + CSS 降级背景；R3F Hero 场景异步加载（LCP 实测为文字 <p> 136ms 非 Canvas）；上下文丢失恢复/转静态 E2E、视口外 RAF 109→0 暂停实测、显式 dispose；Explore 平滑滚动 + 滚动提示（reduced-motion 回退）。
- **整体验收**（2026-11-11）：core/degradation/overflow 四项目 117 通过 0 失败（移动菜单断言属 US-004 保留）；全套 E2E 182 通过，其余 28 失败均属后续故事（US-004 菜单×4、未来路由 SEO×20、US-019 主题×4）；Lighthouse 首页 perf 1.0 / a11y 1.0 / seo 1.0 / bp 0.96，LCP≈215ms、CLS 0、TBT<200；单元测试 29/29；lint/typecheck 干净。
- 依赖漏洞：@lhci/cli 0.16；overrides 固定 basic-ftp ^6.2.6、compression ^1.8.2、**postcss ^8.5.32**（2026-11-11 消除 three 引入链上的 high）。
- **CI/CD 方案核查**（2026-11-11）：`npm test` 29/29 通过（Node v26.10.0 / npm 11.19.1，PowerShell 下）；`git ls-remote https://github.com/George-102/Personal-Digital-Universe.git` 成功但无任何 refs（远端为空仓库），`git remote -v` 为空（本地未关联）；现有 `.github/workflows/verify.yml` 的 Node 20、仅装 Chromium、全套 E2E 红灯、缺 lint/typecheck/test、lighthouse 公开上传五处必红项已定位；`bash init.sh` 在本轮 WSL 路径下报 `node: command not found`，`./init.ps1` 中文编码损坏导致 PowerShell 解析错误（均为 T-004a 前置 blocker）。

- **T-004a CI 前置基础修复**（2026-11-11）：Node 26 固定（.nvmrc / engines 26.x / setup-node node-version-file / README）；`init.ps1` 重写加 UTF-8 BOM 与共用 `scripts/smoke-config.mjs`，`init.sh` WSL 无 node 时委托 Windows PowerShell，两入口均 exit 0；`lighthouserc.js` CI 下 filesystem（`CI=1 lhci autorun` 全绿、6 报告落盘 `lhci-report/`）；28 项 `test.fixme()` 绑定 US-004 / US-019 / US-010 / 012 / 014 / 018。实测 `npm test` 29/29、lint、typecheck、build、verify:metrics（audit 0 high / i18n 100% / size 430.66kB）通过，Playwright 四项目 183 passed / 37 skipped / 0 failed。

- **T-004b CI 验收流水线**（2026-11-11）：workflow 全量门禁 + concurrency/permissions/timeout；首次推送 main；run 42976080859 暴露「产物级单测需 out/」缺陷，把 build 提前到 npm test 后 run 42976363844 全绿（6m28s，183 passed / 37 skipped）；branch protection 要求 `verify`，README 徽章实测 passing。

## 已落盘文件

- 需求：`docs/PRD.md`；技术论证：`docs/Tech.md`；完成定义：`docs/DoD.md`；开发决策：`docs/Development.md`
- 功能追踪：`feature_list.json`（11 个 US-001 任务 + T-006 全 passing；新增 T-004a/b、T-005a/b 四个 CI/CD 任务；23 条 roadmap）
- 应用：`app/`（根路由中文 + [locale] 英文 + sitemap/robots）、`components/`（HomeSections/SiteNav/HeroBackground/PersonJsonLd/three/*）、`content/`（九类数据 + validate + index 公开出口）、`i18n/`、`messages/`、`lib/`（webgl/quality/site）
- 验收：`e2e/`（11 个 spec，含新增 hero-scene/context-loss/hero-entry）、`lighthouserc.js`（审计范围限真实路由）、`.github/workflows/verify.yml`（待 T-004b 重构）
- 质量：`scripts/`（check-i18n、validate-content、5 个 node:test 测试文件）、`.size-limit.json`、package.json（含 prebuild 校验钩子与 overrides）
- 工作流：`AGENTS.md`、`init.sh`、`init.ps1`、`README.md`、本文件
- CI/CD 方案（2026-11-11 定稿）：`docs/Development.md` §1 架构图 / §3 持续集成 / §5 发布、`docs/Tech.md` §2 / §6 / §9、`README.md`（徽章 + 部署 + CI 门禁）、`docs/DoD.md` D 组

## 下一步（按序）

1. ~~**T-004a** CI 前置基础修复~~（2026-11-11 passing）
2. ~~**T-004b** CI 验收流水线跑通~~（2026-11-11 passing，run 42976363844 全绿、徽章 passing、分支保护 verify）
3. ~~**T-005a** CD 发布流水线~~（2026-11-11 passing：rerun deploy 成功、生产 URL HTTP 200、产物即 verify 的 out/）
4. **T-005b** 监控与许可证 —— **blocked**：LICENSE / LICENSE-CONTENT / 双语 Footer / SITE_URL 注释 / sitemap-robots 核对 / DoD 打勾均已完成并验证；仅剩 UptimeRobot 与 Cloudflare Web Analytics 需用户在第三方面板开启
5. **T-003** Vitest 单元/集成测试基础设施（未提前；迁移时同步改 CI 的 `npm test`）
6. **US-004** 全局导航（8 项 + 激活态 + 移动折叠菜单——core.spec『移动端菜单』断言在此执行，同时移除对应 fixme）
7. 之后按 roadmap：US-002 → US-003 → US-006 → US-008 → US-010 → US-012 → US-013 → US-014 → US-018 → US-021 → US-023 → P1 故事

## 风险与注意事项

- **T-005a 已解决（2026-11-11）**：首次 deploy 报 `Authentication error [code: 10000]` 与 `Cannot use the access token from location: 172.174.165.4 [code: 9109]`，根因是 API Token 设置了 Client IP Address Filtering。用户移除后 `gh run rerun 42978098873 --failed` 的 deploy 成功。**避坑**：Cloudflare API Token 不要设置 Client IP Address Filtering（Actions 出口 IP 动态），已写入 README。
- **并行会话**：本轮工作区存在另一路并行开发（US-002 相关）对 `AGENTS.md`、`docs/PRD.md`、`feature_list.json` 的未提交改动。`feature_list.json` 曾被覆盖导致 T-004a 状态回退、US-002a..h 任务移除，本轮已恢复 T-004a 状态与证据。提交时始终显式列文件，排除 `AGENTS.md`、`docs/PRD.md` 与并行队友的临时文件（`test-out.txt` 等）。
- 6 个 moderate 漏洞在 @typescript-eslint（eslint-config-next 传递依赖），官方尚未发布修复版；仅 dev 依赖不进前端 bundle，门禁卡 high 不受影响。
- `lib/site.ts` 的 SITE_URL 值已为 `https://personal-digital-universe.pages.dev`（用户确认无自定义域名），仅注释仍写"占位"；T-005b 更新注释并核对 sitemap/robots。
- overflow/SEO spec 中 /research、/projects、/writing、/contact 路由当前为 404 占位（测试空过），实质验收随 US-010/012/014/018 落地。
- 28 个未实现故事的 E2E 断言已用 `test.fixme()` 绑定 roadmap（US-004×4 / US-019×4 / 未来路由 SEO×20），实现对应故事时移除 fixme 并恢复断言，不得删断言、降阈值或 grep 过滤。
- 本机 IDE 注入 `NODE_OPTIONS` safe-delete shim，会使 `npm ci` 删除 node_modules 失败；仅在本机验证命令中移除该注入，脚本保持标准 `npm ci`，CI 环境无此问题。
- `docs/PRD.md` 有一处用户未提交改动，本轮未触碰，提交时须排除。
- 页面当前仅 hero + about 占位，hero 无法完全滚出视口；视口暂停逻辑已用加长页面实测验证，About 正文（US-006）落地后自然生效。
- 未决：Cloudflare token IP 过滤（T-005a）、UptimeRobot / Web Analytics 账号（T-005b）需用户操作；fork PR 不部署需第二个 GitHub 账号才能实测，当前由 `if` 条件 + GitHub 默认不注入 secrets 保证。
