# Claude Progress — Personal Digital Universe

## 当前阶段（2026-11-11）

**迭代1 首个需求 US-001（3D 首页）已完成**：feature_list.json 中 11 个拆分任务（T-001a/b/c、T-002a/b/c、US-001a~e）全部 passing，证据逐条记录。应用骨架、中英双语静态导出、content/ 数据架构、3D 首页与三层降级均已落地并验证。下一步按 roadmap：**T-003 Vitest 单元测试基础设施**。

## 已验证（有真实运行证据）

- `bash init.sh` 成功（2026-11-10 与 2026-11-11 多次，npm ci 路径与 CI 一致）：Node v26.10.0 / npm 11.19.1，feature_list.json 解析通过，lighthouserc.js 加载通过，Playwright 测试可列出。
- **T-006 质量指标门禁**（2026-11-10）：audit / check-i18n（TDD 4 测试）/ size-limit 落地；2026-11-11 首次实测 check:i18n（5 键 100%）与 size（≈430kB brotli ≤1MB）通过。
- **T-001a/b/c**（2026-11-11）：Next.js 15.5.29 骨架 build/dev 验证；output:'export' + next-intl（/ 中文、/en/ 英文，[locale] 仅预生成 en 避免重复）；README 五节与脚本逐一核对。
- **T-002a/b/c**（2026-11-11）：content/ 九类类型 + prebuild 校验（实测拒绝非法论文状态）；profile 真实数据（苏子豪/Christopher Chang，用户确认）驱动首页，改数据→产物跟随变化实测；public 过滤统一出口 content/index.ts，隐藏条目不泄漏实测。
- **US-001a~e**（2026-11-11）：首页文字层静态可见 + SEO/OG/Person JSON-LD/sitemap/robots；深色视觉 + CSS 降级背景；R3F Hero 场景异步加载（LCP 实测为文字 <p> 136ms 非 Canvas）；上下文丢失恢复/转静态 E2E、视口外 RAF 109→0 暂停实测、显式 dispose；Explore 平滑滚动 + 滚动提示（reduced-motion 回退）。
- **整体验收**（2026-11-11）：core/degradation/overflow 四项目 117 通过 0 失败（移动菜单断言属 US-004 保留）；全套 E2E 182 通过，其余 28 失败均属后续故事（US-004 菜单×4、未来路由 SEO×20、US-019 主题×4）；Lighthouse 首页 perf 1.0 / a11y 1.0 / seo 1.0 / bp 0.96，LCP≈215ms、CLS 0、TBT<200；单元测试 29/29；lint/typecheck 干净。
- 依赖漏洞：@lhci/cli 0.16；overrides 固定 basic-ftp ^6.2.6、compression ^1.8.2、**postcss ^8.5.32**（2026-11-11 消除 three 引入链上的 high）。

## 已落盘文件

- 需求：`docs/PRD.md`；技术论证：`docs/Tech.md`；完成定义：`docs/DoD.md`；开发决策：`docs/Development.md`
- 功能追踪：`feature_list.json`（11 任务全 passing + T-006 passing + 25 条 roadmap）
- 应用：`app/`（根路由中文 + [locale] 英文 + sitemap/robots）、`components/`（HomeSections/SiteNav/HeroBackground/PersonJsonLd/three/*）、`content/`（九类数据 + validate + index 公开出口）、`i18n/`、`messages/`、`lib/`（webgl/quality/site）
- 验收：`e2e/`（11 个 spec，含新增 hero-scene/context-loss/hero-entry）、`lighthouserc.js`（审计范围限真实路由）、`.github/workflows/verify.yml`
- 质量：`scripts/`（check-i18n、validate-content、5 个 node:test 测试文件）、`.size-limit.json`、package.json（含 prebuild 校验钩子与 overrides）
- 工作流：`AGENTS.md`、`init.sh`、`README.md`、本文件

## 下一步（按序）

1. **T-003** Vitest 单元/集成测试基础设施（npm test 从 node:test 迁移，接入 verify 与 CI）
2. **T-004** CI 验收流水线跑通（公开仓库建立后触发；README 徽章）
3. **US-004** 全局导航（8 项 + 激活态 + 移动折叠菜单——core.spec『移动端菜单』断言在此执行）
4. 之后按 roadmap：US-002 → US-003 → US-006 → US-008 → US-010 → US-012 → US-013 → US-014 → US-018 → US-021 → US-023 → T-005 → P1 故事

## 风险与注意事项

- 6 个 moderate 漏洞在 @typescript-eslint（eslint-config-next 传递依赖），官方尚未发布修复版（最新 8.72.2 仍在漏洞范围）；仅 dev 依赖不进前端 bundle，门禁卡 high 不受影响。发布修复版后升级。
- `lib/site.ts` 的 SITE_URL 为占位域名，T-005 部署时替换；sitemap/robots 已生成但 URL 待替换。
- overflow/SEO  spec 中 /research、/projects、/writing、/contact 路由当前为 404 占位（测试空过），实质验收随 US-010/012/014/018 落地。
- CI 尚未首次运行（需 GitHub 公开仓库，T-004）；lighthouserc 的 upload 目标在 CI 仍为 temporary-public-storage（会公开报告），本地验证用 filesystem 覆盖。
- 页面当前仅 hero + about 占位，hero 无法完全滚出视口；视口暂停逻辑已用加长页面实测验证，About 正文（US-006）落地后自然生效。
- 未决：无。