# Claude Progress — Personal Digital Universe

## 当前阶段（2026-11-11）

开发前准备完成，**尚无应用代码**。2026-11-11 经用户确认：工作区 feature_list.json 曾被模板样例覆盖，按用户决定**以模板 schema 重建**（旧版 23 故事 + 6 任务清单保留在 git 提交 5a8d051 中可查）。首个开发需求确定为 **US-001（3D 首页）**，连同前置 T-001/T-002 拆分为 11 个小任务（T-001a/b/c → T-002a/b/c → US-001a/b/c/d/e），其余故事保留在 roadmap 字段。T-006 质量门禁维持 passing（证据见下）。下一步是 T-001a 初始化 Next.js 骨架。

## 已验证（有真实运行证据）

- `bash init.sh` 成功（2026-11-10，npm ci 路径与 CI 一致）：Node v26.10.0 / npm 11.19.1，`feature_list.json` 解析通过，`lighthouserc.js` 加载通过，`playwright test --list` 列出 **192 个测试 / 8 个 spec / 4 个项目**。
- **T-006 质量指标门禁**（2026-11-10）：`npm run audit` 通过（found 0 vulnerabilities）；i18n 检查脚本 TDD 落地（先观察到 4 个测试 MODULE_NOT_FOUND 失败，实现后 4/4 通过）；serve 14.2.7 / lhci 0.16.0 / size-limit CLI 冒烟正常；`.size-limit.json` 语法校验通过。
- 依赖漏洞修复：@lhci/cli 0.14→0.16；overrides 固定 basic-ftp ^6.2.6、compression ^1.8.2（serve 精确锁定 1.8.1、get-uri 范围不含 basic-ftp 6.x，故用 overrides）。audit 脚本指定官方 registry（用户全局 npmmirror 不支持 audit 端点）。

## 已落盘文件

- 需求：`PRD.md`；技术论证：`Tech.md`；完成定义：`docs/DoD.md`
- 功能追踪：`feature_list.json`（模板 schema 重建：11 个拆分小任务 + T-006 passing + 25 条 roadmap；首个需求 US-001）
- 技术准备决策：`docs/Development.md`（含准备状态总览、构建脚本表、四层测试 + 质量指标门禁）
- 验收：`playwright.config.ts`、`e2e/`（9 文件）、`lighthouserc.js`、`.github/workflows/verify.yml`（含 metrics 步骤）
- 质量指标：`scripts/check-i18n.mjs` + `check-i18n.test.mjs`（node:test）、`.size-limit.json`、package.json（audit/check:i18n/size/verify:metrics/test 脚本 + overrides）
- 工作流：`AGENTS.md`、`init.sh`、`.gitignore`、本文件

## 下一步（按序）

1. **T-001a** 初始化 Next.js 应用骨架（最高优先级，见 feature_list.json features）
2. **T-001b** 静态导出 + next-intl 双语路由（messages/ 建立后 check:i18n 开始实测）
3. **T-001c** README 初版
4. **T-002a/b/c** content/ 类型、profile 真实数据、public 过滤与容错
5. **US-001a→e** 3D 首页五个小任务，US-001e 通过即 US-001 完成
6. 之后按 roadmap 顺序（T-003 → T-004 → US-004 → …），轮到每个故事时先拆分为小任务写入 features

## 风险与注意事项

- `npm run verify` 目前不可运行：依赖 T-001 产出 `out/`。`npm run size` 同理。这是预期状态，不是 blocker。
- T-001 注意：create-next-app 会与现有 package.json 冲突，需手动初始化或合并模板；合并时保留 overrides 与 verify 系列脚本。
- 仓库已 git init 并完成首次提交（5a8d051）；工作区尚有 AGENTS.md（用户新增目录说明）与本次重建的 feature_list.json / claude-progress.md 未提交，等用户指示再提交。
- CI 尚未首次运行：需 GitHub 公开仓库建立后触发。
- 未决：无。