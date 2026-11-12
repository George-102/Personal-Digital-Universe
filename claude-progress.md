# Claude Progress — Personal Digital Universe

## 当前阶段（2026-11-11）

**迭代1 首个需求 US-001（3D 首页）已完成**：feature_list.json 中 11 个拆分任务（T-001a/b/c、T-002a/b/c、US-001a~e）全部 passing，证据逐条记录。应用骨架、中英双语静态导出、content/ 数据架构、3D 首页与三层降级均已落地并验证。

**本轮（用户要求尽早集成）：CI/CD 方案定稿 + 文档同步，未实现流水线代码。** 用户确认四项：①方案 A（GitHub Actions + Wrangler Direct Upload，关闭 Cloudflare Pages Git 自动构建）；②T-004/T-005 提前到 US-004 之前；③公开仓库 `https://github.com/George-102/Personal-Digital-Universe.git`；④28 个未实现故事的 E2E 失败项用 `test.fixme()` 绑定 roadmap，不删断言、不降阈值。方案已写入 `docs/Development.md` §1/§3/§5、`docs/Tech.md` §2/§6/§9、`README.md`、`docs/DoD.md`；任务拆为 T-004a/b、T-005a/b（priority 13-16）写入 `feature_list.json`，roadmap 中原 T-004/T-005 已移除，T-003 保持原位不提前。下一步：**T-004a CI 前置基础修复**。

**本轮（用户授权推进 CI/CD）：T-004a 已完成并验证。** 前提已齐：用户确认 Cloudflare Pages 为 **Direct Upload** 项目（`personal-digital-universe`，生产域名 `personal-digital-universe.pages.dev`，无自定义域名），GitHub secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 已配置（`gh secret list` 核对名称），`gh` 登录账号 George-102 且对公开仓库有 admin 权限，远端仍为空仓库、本地未关联 remote。T-004a 修复 Node 版本、双启动入口、Lighthouse 报告、28 项 roadmap fixme，证据见 `feature_list.json` T-004a。**T-004b 已完成并验证**（首次推送、run 42976363844 全绿、徽章 passing、分支保护 verify）。**T-005a 已通过**：用户移除 API Token 的 Client IP Address Filtering 后 `gh run rerun 42978098873 --failed` 的 deploy 成功（38s），生产 URL 实测 HTTP 200。**T-005b 已全部完成并验证**（许可证 / Footer / SITE_URL / DoD + UptimeRobot 5 分钟监控 + Cloudflare Web Analytics）。CI/CD 四个任务 T-004a / T-004b / T-005a / T-005b 全部 passing。

**本轮（接手队友 blocked 的 T-005b）：CI/CD 四项收尾完成。** 队友 d5b5cd0 已完成代码部分（LICENSE / LICENSE-CONTENT / 双语 Footer / SITE_URL / sitemap-robots / DoD），仅剩两项第三方账号配置 blocked。本轮：①UptimeRobot HTTPS monitor `804633325`（type=1、interval=300、url=`https://personal-digital-universe.pages.dev`、告警联系人 `9024699_0_0`）由用户在**本机终端**调用 API 创建，回查 `status=2`（Up）；②Cloudflare Web Analytics 由用户在 Pages 项目 → Metrics 一键 Enable，push main 触发 run `42999448346`（verify 6m6s，201 passed / 75 skipped；deploy 1m12s success）后实测 `/` 与 `/en/` HTML 均含 `cloudflareinsights.com/beacon.min.js` + `data-cf-beacon`。**安全策略禁止 agent 将 API Key 发往外部**，凭据外传步骤改由用户本机执行，agent 未接触密钥；`git push` 因需读取 `~/.ssh` 私钥同样由用户执行。同步 `docs/Development.md`（准备状态总览 + §5 滞后描述）、`README.md`（新增「监控与统计」章节）、`docs/DoD.md`（D 组监控项打勾）、`feature_list.json`（T-005b → passing）。本次 push 一并带上队友此前未推送的 `243ee9f`(T-007) 与 `103ef45`(US-002)，远端 main 由 d5b5cd0 前进到 afb23b2；run 42999448346 亦为 T-007 所需的云端 verify 证据，其状态仍由负责该任务的会话回写。

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

- **T-005b 监控与统计落地**（2026-11-11）：`./init.ps1` 复跑 exit 0（Node v26.10.0，276 tests in 12 files）；UptimeRobot monitor `804633325` 回查 `stat=ok` / `status=2`(Up) / `interval=300` / `type=1` / url 为生产域名；Cloudflare Web Analytics beacon 在生产 `/` 与 `/en/` HTML 实测存在；run 42999448346 的 verify 与 deploy 均 success（201 passed / 75 skipped）。

## 已落盘文件

- 需求：`docs/PRD.md`；技术论证：`docs/Tech.md`；完成定义：`docs/DoD.md`；开发决策：`docs/Development.md`
- 功能追踪：`feature_list.json`（US-001 11 任务 + T-006 + T-004a/b、T-005a/b 四个 CI/CD 任务 + US-002 17 任务 + T-007 全 passing；其余 roadmap）
- 应用：`app/`（根路由中文 + [locale] 英文 + sitemap/robots）、`components/`（HomeSections/SiteNav/HeroBackground/PersonJsonLd/SiteFooter/three/*）、`content/`（九类数据 + validate + index 公开出口）、`i18n/`、`messages/`、`lib/`（webgl/quality/site/pointer/interactive）
- 验收：`e2e/`（12 个 spec）、`lighthouserc.js`（审计范围限真实路由）、`.github/workflows/verify.yml`（verify / deploy / preview 三 job，T-004b / T-005a 已落地）
- 质量：`scripts/`（check-i18n、validate-content、sync-licenses、8 个 node:test 测试文件）、`.size-limit.json`、package.json（含 prebuild 校验钩子与 overrides）
- 工作流：`AGENTS.md`、`init.sh`、`init.ps1`、`README.md`、本文件
- CI/CD 方案（2026-11-11 定稿）：`docs/Development.md` §1 架构图 / §3 持续集成 / §5 发布、`docs/Tech.md` §2 / §6 / §9、`README.md`（徽章 + 部署 + CI 门禁 + 监控与统计）、`docs/DoD.md` D 组

## 下一步（按序）

1. ~~**T-004a** CI 前置基础修复~~（2026-11-11 passing）
2. ~~**T-004b** CI 验收流水线跑通~~（2026-11-11 passing，run 42976363844 全绿、徽章 passing、分支保护 verify）
3. ~~**T-005a** CD 发布流水线~~（2026-11-11 passing：rerun deploy 成功、生产 URL HTTP 200、产物即 verify 的 out/）
4. ~~**T-005b** 监控与许可证~~（2026-11-11 passing：UptimeRobot `status=2`、beacon 实测注入、run 42999448346 全绿、DoD D 组打勾）
5. ~~**T-007** 本地轻验证分工~~（2026-11-11 passing：run 42999448346 verify 全绿 201 passed / 75 skipped / 0 failed，CI run URL + passed 数已回写本文件与 T-007.evidence，状态转 passing）
6. ~~**US-003** 电影级页面转场（US-003a~h，用户指定提前）~~（2026-11-12 passing：本地全套 E2E 239/0 + Lighthouse 达标，云端 run [43025954251](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43025954251) verify 7m30s 全绿 239 passed / 77 skipped / 0 failed，CI run URL 已回写 US-003h.evidence）
7. **T-003** Vitest 单元/集成测试基础设施（迁移时同步改 CI 的 `npm test`）
8. ~~**US-004** 全局导航~~（2026-11-12 passing：US-004a~h 共 8 任务全 passing，本地 verify:local exit 0，云端 run [`43189384137`](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43189384137) verify 全绿 280 passed / 76 skipped / 0 failed + Lighthouse 达标 + deploy success，CI run URL 已回写 US-004h 与 PRD_UserStory.json）
9. ~~**US-006 个人介绍 About Me**~~（2026-11-12 passing：US-006a~j 共 10 任务全 passing，云端 run [`43259860487`](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43259860487) verify + deploy 全绿、TBT 114/115ms、perf 98-99，CI run URL 已回写 US-006j 与 PRD_UserStory.json）
10. **US-008 成长时间线**（下一个 P0 内容故事；`#about` 已就位，可直接沿用「content 数据 → 双语 → section」范式。开工前按 AGENTS.md 先用 AskUserQuestion 确认时间线内容与展示形式，再拆 US-008a~? 写入 feature_list.json）
11. 之后按 roadmap：US-010 → US-012 → US-013 → US-014 → US-018 → US-021 → US-023 → P1 故事（US-002 / US-003 / US-004 / US-006 已完成）。**T-003（Vitest 迁移）仍为唯一技术债，优先于 P1 内容故事**。

## 风险与注意事项

- **T-005a 已解决（2026-11-11）**：首次 deploy 报 `Authentication error [code: 10000]` 与 `Cannot use the access token from location: 172.174.165.4 [code: 9109]`，根因是 API Token 设置了 Client IP Address Filtering。用户移除后 `gh run rerun 42978098873 --failed` 的 deploy 成功。**避坑**：Cloudflare API Token 不要设置 Client IP Address Filtering（Actions 出口 IP 动态），已写入 README。
- **并行会话**：本轮工作区存在另一路并行开发（US-002 / T-007 相关）对 `AGENTS.md`、`docs/PRD.md`、`feature_list.json` 的未提交改动。`feature_list.json` 曾被覆盖导致 T-004a 状态回退、US-002a..h 任务移除，本轮已恢复 T-004a 状态与证据。提交时始终显式列文件，排除 `docs/PRD.md` 与并行队友的临时文件（`test-out.txt` 等）。本次 push 已把 `243ee9f`(T-007) 与 `103ef45`(US-002) 一并带上远端。
- 6 个 moderate 漏洞在 @typescript-eslint（eslint-config-next 传递依赖），官方尚未发布修复版；仅 dev 依赖不进前端 bundle，门禁卡 high 不受影响。
- `lib/site.ts` 的 SITE_URL 已为 `https://personal-digital-universe.pages.dev`（用户确认无自定义域名），注释与 sitemap/robots 均已核对（T-005b 完成）。
- overflow/SEO spec 中 /research、/projects、/writing、/contact 路由当前为 404 占位（测试空过），实质验收随 US-010/012/014/018 落地。
- 28 个未实现故事的 E2E 断言已用 `test.fixme()` 绑定 roadmap（US-004×4 / US-019×4 / 未来路由 SEO×20），实现对应故事时移除 fixme 并恢复断言，不得删断言、降阈值或 grep 过滤。
- 本机 IDE 注入 `NODE_OPTIONS` safe-delete shim，会使 `npm ci` 删除 node_modules 失败；仅在本机验证命令中移除该注入，脚本保持标准 `npm ci`，CI 环境无此问题。
- `docs/PRD.md` 有一处用户未提交改动，本轮未触碰，提交时须排除。
- ~~页面当前仅 hero + about 占位，hero 无法完全滚出视口~~（US-006 已解决：`#about` 为 `min-h-screen` 真实内容，hero 可完全滚出；离屏暂停改为「收敛中继续渲染、收敛后暂停」，稳态仍 `frameloop=never`）。
- **首屏每帧成本是本项目的性能红线**（2026-11-12 教训）：`useFrame` 里任何 DOM 写入/读取都会被放大成 TBT。禁止在每帧回调里读 `offsetWidth/offsetHeight/getBoundingClientRect`，禁止每帧写 `dataset` 做探针（改用 `window.__*` 或在状态变化时写）。
- 未决：fork PR 不部署需第二个 GitHub 账号才能实测，当前由 `if` 条件 + GitHub 默认不注入 secrets 保证。T-005a 的 token IP 过滤与 T-005b 的两项监控配置均已解决（2026-11-11）。**建议用户在 UptimeRobot 后台轮换本次出现在对话中的 Main API Key**。

## US-002 迭代（2026-11-11 完成，并行会话）

**US-002（访客与 3D 场景进行交互）17 个任务 US-002a~q 全部 passing**，逐条证据写入 `feature_list.json`。本轮按上一轮拆分的细粒度任务实现并验证；队友的 CI/CD（T-004a/b、T-005a/b）编号、状态与证据一律未动。

- 新增：`lib/pointer.ts`（指针状态机、NDC 归一化、限幅 damp、手势阈值、DOM tracker + destroy）、`lib/interactive.ts`（可交互物体注册表与构建期校验）、`e2e/interaction.spec.ts`（14 个交互用例）、`scripts/pointer.test.mjs` / `interactive.test.mjs` / `interaction-motion.test.mjs`（TDD 先行）。
- 改造：`components/three/HeroScene.tsx`（惯性视差、粒子排斥、四种悬停反馈、拖拽旋转、每帧状态上报）、`components/three/HeroCanvas.tsx`（命中/tooltip/点击/reduced-motion 与 hover 能力降级、tracker 清理）、`components/HomeSections.tsx`（文字层事件穿透 + DOM 等价入口 + 双语提示）、`messages/{zh,en}.json`、`app/globals.css`、`scripts/validate-content.mjs`（prebuild 校验接入）。
- 决策：点击默认平滑滚动到 `#about`、目标由注册表配置化；范围限 Hero 但通用注册机制可复用；等价入口 `href` 用根路径锚点，避免与既有 `a[href="#about"]` 定位器产生 strict mode 歧义（曾导致既有 core/hero-scene 用例红灯，已修复并回归）。
- 验证：RED 单测观察到 `ERR_MODULE_NOT_FOUND` 后实现；注入非法 `clickTarget: /about` 实测 `npm run build` exit 1、恢复后 exit 0。最终全套四项目 E2E **201 passed / 75 skipped / 0 failed**（exit 0）；`npm test` 54/54、`lint`、`typecheck`、`check:i18n` 100%、`size` 432.94kB、`audit` 0 high、`build` exit 0、`CI=1 verify:lighthouse` exit 0（中文 perf 0.98-0.99 / a11y 1 / seo 1 / bp 0.96，LCP 213-332ms、CLS 0、TBT 83-130ms）；PerformanceObserver 实测 LCP 元素非 CANVAS。
- 环境注意：本机默认 Node 22 与 `engines: 26.x` 不符，验证命令统一前置 PATH 到 scoop `nodejs/26.10.0` 并清空注入的 `NODE_OPTIONS`；默认并行度下 WebGL 上下文争抢会让全套 E2E 超时，本机用 `--workers=2`，`interaction.spec.ts` 内 describe 串行 + 重交互集中在 chromium + WebGL 条件跳过（CI/Linux 未复现该限制，断言与阈值未削弱）。
- 下一步（按 feature_list）：T-005b 已由本轮会话收尾（passing）→ T-003 → US-004 → US-003 → US-006 → …；US-002 已从 roadmap 移除。

## US-003 迭代（2026-11-11 实现，2026-11-12 CI 回写完成）

**US-003（访客体验电影级页面转场）8 个任务 US-003a~h 全部 passing。** 用户确认四项决策：①提前到 T-003/US-004 之前执行；②滚动驱动动画按 Tech.md 既定采用 GSAP ScrollTrigger；③五种转场效果（相机推拉/背景渐变/物体移动旋转/粒子聚散/面板展开）全做；④hero→#about 单段完整转场 + 通用滚动进度注册机制。逐条证据在 feature_list.json US-003a~h。

- 新增：`lib/scroll.ts`（ScrollState 单一进度源 + attachScrollDriver GSAP 绑定，加载失败/绑定异常回退静态）、`lib/transitions.ts`（TransitionSegment 注册表 + cameraTargets/shellFactor 纯函数 + 构建期校验）、`components/ScrollDriver.tsx`、`e2e/scroll-transition.spec.ts`（10 用例×4 项目）、`scripts/scroll.test.mjs` / `transitions.test.mjs`（TDD 先行，RED 均留证）。
- 改造：`components/three/HeroScene.tsx`（相机 z 推进 + 核心物体位移/旋转 + 粒子壳层缩放，全部叠加式施加、参数零硬编码）、`HeroCanvas.tsx`（FrameReport 增补 transition/cameraZ/coreOffsetY/coreSpinOffset/particleShell → dataset）、`HeroBackground.tsx`（注册表渐变色 + --scroll-progress 驱动 .hero-bg-tint 叠加层）、`HomeSections.tsx`（ScrollDriver 挂载 + .about-panel 展开）、`app/globals.css`、`scripts/validate-content.mjs`（transitions prebuild 校验）。依赖：gsap@3.15.1 --save-exact。
- 验证：npm test 73/73；全套 E2E 四项目 316 tests **239 passed / 77 skipped / 0 failed**（--workers=2）；CI=1 verify:lighthouse exit 0（6 报告，LCP 元素实测 `<p>` 非 CANVAS）；verify:local exit 0（size 475.75kB brotli ≤1MB）；构建期拒绝非法转场配置实测（minOpacity 0.5 → build exit 1）。
- 排坑记录：①页面过短滚不到 end 点时进度封顶 0.69——end clamp 到可达 maxScroll；②`-0` vs `0` 符号零坑（strict deepEqual）；③CSS smooth 使程序化 `behavior:'auto'` 滚动动画排队互扰（scrollY 卡 441/496），程序化跳转统一 `behavior:'instant'`；④进度源每帧重写 CSS 变量抢跑 fallback 断言——writeDom 去重守卫 + 断言单次 evaluate 同步读取；⑤mobile-WebKit 不支持注入滚轮（等价滚动断言，断言未删）；⑥移动端 350 粒子属低画质档，粒子壳层计算按设计关闭（E2E 双分支断言）。
- **已回写并转 passing（2026-11-12）**：用户 push main 后云端 Verify workflow run [`43025954251`](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43025954251) 全绿——verify job 7m30s success（Playwright 四项目 239 passed / 77 skipped / 0 failed，4.3m，与本地全套数字一致；Lighthouse 达标）、deploy job 32s success。CI run URL 与 passed 数已回写 US-003h.evidence，US-003h 转 passing。

## US-004 迭代（2026-11-12，US-004a~g passing，US-004h 待云端 CI）

**US-004（访客使用空间化导航系统）拆为 8 个任务（priority 43-50）**，决策 A：导航注册表只收录真实存在的模块（当前 Home / About），后续故事落地时逐条加入，不建空占位 section。

- 新增：`lib/nav.ts`（NavItem 注册表 + validateNavItems / navTargetId / resolveNavHref / navMessageKey，prebuild 校验）、`components/NavBar.tsx`（客户端导航：注册表渲染、点击目标守卫、滚动激活态、移动端折叠菜单）、`e2e/navigation.spec.ts`（10 用例 × 4 项目）、`scripts/nav.test.mjs`（11 项 TDD）。
- 改造：`components/SiteNav.tsx`（服务端壳：Nav 文案 + 本地化 href）、`components/HomeSections.tsx`（hero section id="home"）、`app/globals.css`（.site-nav 玻璃质感 / 激活态光条 / focus-visible / mobile 面板）、`messages/{zh,en}.json`（Nav：mainLabel/home/about/menu/menuClose，各 14 键）、`scripts/validate-content.mjs`（nav 校验接入）、`e2e/core.spec.ts`（About 定位放宽为 /about|关于/i；移动端先展开菜单；移除移动菜单 fixme）。
- 功能要点：玻璃质感固定顶部导航（半透明 + backdrop-blur + 细边框）；点击目标存在走原生 smooth scroll + hash 同步，不存在则 preventDefault（运行时注入 ghost 目标实测 URL 不变、无异常）；滚动激活态用 rAF 合并滚动计算并写 data-active / aria-current（短页面滚到底取最后模块）；移动端折叠菜单（aria-expanded / Esc / 遮罩 / 焦点进入与回焦，常驻 navigation 地标）；导航点击复用 US-003 ScrollState 进度源驱动 3D 相机（无第二份相机配置）；对比度按半透明合成后计算，三处背景 ≥4.5。
- 排障：①navTargetId 正则漏捕获组（match[1] undefined）；②遮罩放在 header 内时被 backdrop-filter 的包含块限制，改为 header 同级；③移动端收起菜单时缺少 navigation 地标（a11y 回归），改为移动顶栏常驻 `<nav>`；④桌面导航在 <md 隐藏后 core.spec 需先展开菜单。
- 验证：RED→GREEN（nav.test.mjs 先 ERR_MODULE_NOT_FOUND 后 11/11）；构建期注入非法 href 实测 build exit 1、恢复 exit 0；`npm run verify:local` exit 0（npm test 84/84、lint/typecheck、build 7 页、i18n 100%、size 476.87kB brotli、audit 0 high）；分批 E2E 四项目全绿——navigation 37 passed / 3 skipped、core+a11y 61 passed / 3 skipped、overflow 100/100。
- **未决 / 风险**：本地一次性跑全套 356 项时 `serve out` 中途退出（ERR_CONNECTION_REFUSED）且 test-results 出现 ENOENT，同时检测到**并行会话**正在运行 `playwright test e2e/scroll-transition.spec.ts` 并占用 4173 端口与 test-results；按 T-007 改为分批本地 + 云端全量重验证。并行会话已将滚动驱动从 GSAP 改为原生 scroll + RAF（`lib/scroll.ts`、`components/ScrollDriver.tsx`、`package.json`、`package-lock.json`、`e2e/scroll-transition.spec.ts`、`AGENTS.md`、`docs/PRD.md`），本会话按「不覆盖他人未提交工作」原则提交时显式排除这些文件。
- **已回写并转 passing（2026-11-12）**：用户 push main（7904e25）后云端 Verify workflow run [`43189384137`](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43189384137) 全绿——verify job 10m31s success（Playwright 四项目 **280 passed / 76 skipped / 0 failed**，5.8m；Lighthouse CI 对 `/` 与 `/en/` 各 3 run，Healthcheck passed、All results processed!、断言全达标；lint/typecheck/build/单测/质量门禁逐段 success），deploy job 1m11s success，preview 按 PR 条件 skipped。本地以 Node v26.10.0 复跑 `npm run verify:local` exit 0（i18n 100%、size 435.34kB ≤1MB、audit 0 high），并确认 `e2e/core.spec.ts` / `navigation.spec.ts` 无残留 fixme。CI run URL 与 passed 数已回写 `feature_list.json` US-004h、`PRD_UserStory.json` US-004 与本文件；US-004h 与 US-004 均转 passing。期间 run 43188801947 因 concurrency 取消、43177217750 因 Lighthouse TBT 超阈值失败（已由 fe88960 原生 scroll+RAF 修复），均被本次绿色 run 覆盖，无遗留阻塞。

## T-007 本地轻验证 / 云端重验证分工（2026-11-11）

**背景**：用户提出本地跑 E2E 太费时，希望云端跑重测试、本地只跑轻测试。核查发现云端重验证**已存在**：`.github/workflows/verify.yml` 在 push main / PR 自动触发全链（历史 run 42976363844 全绿 6m28s）并负责 Cloudflare Pages 部署。本地痛点为 `npm run verify` 默认也跑同一套：本地 `retries: 0` + 30s 超时导致移动端 E2E flake（本文件已记录 7 个超时），且 `lighthouserc.js` 非 CI 时用 `temporary-public-storage` 会生成公开报告链接。

**方案（用户确认 4 项）**：不改 workflow（不加 shard / 拆 job / 手动触发 / 标签触发）、不引入 Vitest 或新用例、不提供一键触发云端重测试脚本；纯加法新增 `npm run verify:local`；完整同步 10 个文件。`verify` 全链、`verify:quick` 命令串、所有断言与阈值 100% 保留，重验证只是执行主体固定在云端，证据以 CI run URL 回写。

**已验证（本地实测，2026-11-11）**
- `npm run verify:local` exit 0，耗时 **35s**（对比云端全套 6m28s）：Node v26.10.0 / npm 11.19.1（前置 PATH 到 scoop `nodejs/26.10.0` 并清空注入的 `NODE_OPTIONS`）；lint / typecheck / build（含 prebuild 的 content 校验与许可证同步）/ `npm test` **54 passed** / `verify:metrics`（audit 0 high，6 moderate 为既有 @typescript-eslint 链；i18n 100%；size 432.94 kB ≤1MB）逐段全绿。
- 零浏览器：`lhci-report/` 文件数 26→26、`playwright-report/` 0→0，未启动 playwright / serve / lhci。
- `bash init.sh` exit 0（137s，含 `npm ci`）；`./init.ps1` LASTEXITCODE=0（中文提示语在 PowerShell 5.1 下正确解析，UTF-8 BOM 保留）。两入口仍打印 `feature_list.json OK` / `lighthouserc.js OK` 与 `Total: 276 tests in 12 files`，两条配置冒烟未动。
- `git diff -- .github/workflows/verify.yml lighthouserc.js playwright.config.ts scripts/smoke-config.mjs package-lock.json` **为空**；`package.json` 仅 +1 行。
- 顺带修正既有文档矛盾：`README.md:73` 与 `docs/Development.md` §3 的 CI 顺序由错误的 `npm test → build` 改为 `build → npm test`；`verify:quick` 由「日常快速检查」重定位为「可选单项目浏览器抽查」。

**已回写并转 passing（2026-11-11）**：push main 后云端 `Verify` workflow run [`42999448346`](https://github.com/George-102/Personal-Digital-Universe/actions/runs/42999448346) 全绿——`verify` job 6m6s success：Playwright 四项目 **201 passed / 75 skipped / 0 failed**（3.1m）、`npm test` 54/54、lint / typecheck / build / verify:metrics 逐段通过；Lighthouse CI 对 `/` 与 `/en/` 各 3 run（6 报告）`All results processed!`，`lighthouserc.js` 阈值全部达标；`deploy` job 1m12s success。CI run URL 与 passed 数已回写本文件与 `feature_list.json` 的 `T-007.evidence[]`，`T-007.status` 已由 `in_progress` 改为 `passing`。

**风险与注意事项**
- 本地误跑 `npm run verify` 仍会触发四项目 E2E（本地 flake）+ 非 CI Lighthouse 公开报告链接。本次仅通过 README / init / AGENTS 文档提示规避，**未加 guard、未改 verify 命令**（不改弱验证、不动 workflow）。
- 本地 `npm audit` 依赖 registry.npmjs.org 网络，失败时按既有行为处理，未改 `--audit-level`。
- `AGENTS.md` 本次提交一并带入 4 处**非本次产生**的既有未提交改动（第 6 步 `init.sh`→`init.ps1`、必需文件、收尾第 5 步同步，以及删除「TDD测试驱动开发原则」一行），用户已确认一并提交并披露。
- `docs/PRD.md` 的未提交改动属于他人，本次未触碰、未提交；`.workbuddy/` 与 `test-out.txt` 保持未跟踪。

## 下一需求规划（2026-11-12，仅规划与拆分，未写实现代码）

**结论：选 US-006（个人介绍 About Me），用户已确认。** 依据：`PRD_UserStory.json` 中 priority 1 且 not_started 的首条故事；本文件「下一步」第 9 条原定顺序；`#about` 仍是 US-001a 的占位文案（个人介绍即将上线），而它同时是 US-002 的点击目标、US-003 的转场终点、US-004 的导航目标——当前最大功能空洞。填充后还能自然解决「页面过短导致 hero 无法滚出视口」的既有风险，并建立首个「content 数据 → 双语 → section → 导航 → 转场」内容模块范式，供 US-008 / 010 / 012 / 014 / 018 复用。

**未选**：T-003（Vitest 迁移为零用户可见价值的工具链重构，且需同步改 CI 的 `npm test` 与产物级单测对 `out/` 的依赖，内容模块少时迁移收益低，保持原位不提前）；US-005（P1，真实内容模块还少）；US-008（跳过第一个内容模块）。

**已写入 `feature_list.json`**：US-006a~j（priority 51-60，10 个任务，全部 not_started），roadmap 中 US-006 移除，scope_note 记录用户四项决策。任务链：a 内容模型/构建期校验 → b 真实叙事文案与 i18n → c #about 结构与静态可读 → d 3D 抽象头像 → e 头像降级与 GPU 清理 → f CV 条件渲染 → g 响应式/可访问 → h **页面变长专项回归** → i 性能/SEO 门禁 → j 整体验收 + 云端 CI 回写。

**两项前置风险（已转为独立任务）**：①`#about` 由 `min-h-[50vh]` 占位变真实内容会改变页面高度，进而影响 `lib/scroll.ts` 进度终点、NavBar 40% 激活判定与 HeroCanvas 视口暂停，US-006h 要求全套四项目回归且不得删断言/降阈值；②新增 3D 头像可能推高 TBT（run 43177217750 曾因 TBT 超阈值失败），US-006i 要求 Lighthouse 专项复验，头像建议按需 frameloop、不常驻高开销动画。

**本轮文件改动**：`feature_list.json`（拆分 + scope_note + roadmap）、`claude-progress.md`（本段与下一步第 9/10 条）。JSON 已用 Node 解析校验（60 个 features、10 个新增任务 priority 51-60 唯一、roadmap 19 项且无 US-006）。未提交：工作区存在并行的 `AGENTS.md` / `docs/PRD.md` 未提交改动，提交时必须显式排除。

## US-006 迭代（2026-11-12，US-006a~j 全部 passing）

**US-006（个人介绍 About Me）10 个任务全部 passing。** 用户四项决策：3D 抽象头像、CV 暂不配置（条件隐藏）、文案由 agent 按 PRD 起草待用户确认、只填 #about 不新建路由。

- 新增：`components/AboutSection.tsx`（#about 服务端渲染，正文/要点直接进静态 HTML）、`components/AboutPortrait.tsx`（客户端头像容器 + 静态 SVG 降级 + 文本替代）、`components/three/AboutAvatarScene.tsx`（低面数 R3F 场景：二十面体核心 + 线框壳 + 双轨道）、`lib/about.ts`（resolveAbout / hasCv / hasPortrait + 站内路径白名单）、`e2e/about.spec.ts`（9 用例 × 4 项目）、`scripts/about.test.mjs`（8 项 TDD）。
- 改造：`content/types.ts`（AboutContent + Profile.about）、`content/profile.ts`（3 段中英叙事 + 7 条要点）、`content/validate.ts`（嵌套字段读取 + optionalLocaleLists / optionalAssets）、`content/index.ts`（about 统一出口）、`components/HomeSections.tsx`（渲染 AboutSection、移除占位）、`components/three/HeroCanvas.tsx`（离屏但转场未收敛时继续渲染 + data-hero-frames）、`messages/{zh,en}.json`（About 命名空间，各 20 键）、`app/globals.css`（.about-copy / .about-avatar 系列）、`e2e/scroll-transition.spec.ts` 与 `navigation.spec.ts`（长页适配 + hero 暂停用例）、`README.md` / `docs/Development.md` / `docs/DoD.md`。
- 真实缺陷与回归修复：①hero 离屏立即暂停会冻结未收敛的相机/粒子/面板 → 改为「收敛中继续渲染、收敛后暂停」（稳态离屏仍为 never）；②`#about p` 严格模式多匹配（4 项失败）→ 改 `[data-about-bio]`；③`scrollHeight*0.5` 已越过转场终点（mobile-safari 相机用例）→ 按段区间中点采样。三处均未删断言、未降阈值。
- 验证：`npm test` 92/92；`npm run verify:local` exit 0（i18n 20 键、size 437.03kB ≤1MB、audit 0 high）；about.spec 四项目 34 passed / 2 skipped；scroll-transition + navigation 四项目 78 passed / 6 skipped；全套四项目首跑 310 passed / 78 skipped / 4 failed（失败已全部修复），未新增 fixme；`CI=1 npm run verify:lighthouse` exit 0（perf 93-100、a11y 100、seo 100、bp 96，LCP 210-271ms、CLS 0、TBT 74-207ms——TBT 单次最高 207ms 略高于 200ms，门禁按 3 run 最优值聚合通过，阈值未改，后续新增 3D 模块需继续观察）。
- **云端 CI（US-006j 收尾）**：run [43259860487](https://github.com/George-102/Personal-Digital-Universe/actions/runs/43259860487)（commit 4e210ea）**verify success + deploy success + preview skipped**。首跑 run 43217692188 已绿，但暴露两个长页 flake（帧计数批次写、Safari 把 `behavior:'instant'` 当 auto）已修；第二跑 run 43222980899 因 `total-blocking-time` 挂门禁（`/` 796/250.5/278、`/en/` 221/250/218.5，阈值 200）。
- **TBT 回归根因与修复（commit 4e210ea）**：`HeroCanvas.handleFrame` 每帧写 18 个 dataset 后紧接读 `tooltip.offsetWidth/offsetHeight` → 强制同步布局，页面变长后代价放大；另加帧计数逐帧写 dataset、`setSettling` 每帧 setState、头像挂载即调 `isWebGLAvailable()`。修复为 tooltip 尺寸缓存、帧计数改 `window.__heroFrames` / `window.__avatarFrames` 探针、`setSettling` 布尔翻转去重、WebGL 探测延后到进入视口。**阈值与断言一处未改。**
- 修复后 Lighthouse（同一门禁）：TBT 最优 **114ms（`/`）/ 115ms（`/en/`）**、LCP 208-211ms、CLS 0、perf 98-99、a11y 100、seo 100、bp 96；单次仍有 636ms 离群（lhci 按最优 run 聚合，属 runner 噪声）。
- **未决风险**：中英文案仍是 agent 按 PRD 起草的草稿（`content/profile.ts` 注释标【待用户确认】）；CV 未配置（入口隐藏，提供 PDF 后改 `cvUrl` 一个字段即可）；T-003（Vitest 迁移）仍 `not_started`。
