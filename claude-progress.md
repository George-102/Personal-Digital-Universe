# Claude Progress — Personal Digital Universe

## 当前阶段（2026-11-10）

开发前准备完成：需求、技术决策、验收体系、质量指标门禁、功能追踪均已落盘。**尚无应用代码**，下一步是 T-001 初始化 Next.js 骨架。

## 已验证（有真实运行证据）

- `bash init.sh` 成功（2026-11-10，npm ci 路径与 CI 一致）：Node v26.10.0 / npm 11.19.1，`feature_list.json` 解析通过，`lighthouserc.js` 加载通过，`playwright test --list` 列出 **192 个测试 / 8 个 spec / 4 个项目**。
- **T-006 质量指标门禁**（2026-11-10）：`npm run audit` 通过（found 0 vulnerabilities）；i18n 检查脚本 TDD 落地（先观察到 4 个测试 MODULE_NOT_FOUND 失败，实现后 4/4 通过）；serve 14.2.7 / lhci 0.16.0 / size-limit CLI 冒烟正常；`.size-limit.json` 语法校验通过。
- 依赖漏洞修复：@lhci/cli 0.14→0.16；overrides 固定 basic-ftp ^6.2.6、compression ^1.8.2（serve 精确锁定 1.8.1、get-uri 范围不含 basic-ftp 6.x，故用 overrides）。audit 脚本指定官方 registry（用户全局 npmmirror 不支持 audit 端点）。

## 已落盘文件

- 需求：`PRD.md`；技术论证：`Tech.md`；完成定义：`docs/DoD.md`
- 功能追踪：`feature_list.json`（23 用户故事 + 6 技术任务；T-006 已完成，其余 pending；迭代1 = P0）
- 技术准备决策：`docs/Development.md`（含准备状态总览、构建脚本表、四层测试 + 质量指标门禁）
- 验收：`playwright.config.ts`、`e2e/`（9 文件）、`lighthouserc.js`、`.github/workflows/verify.yml`（含 metrics 步骤）
- 质量指标：`scripts/check-i18n.mjs` + `check-i18n.test.mjs`（node:test）、`.size-limit.json`、package.json（audit/check:i18n/size/verify:metrics/test 脚本 + overrides）
- 工作流：`AGENTS.md`、`init.sh`、`.gitignore`、本文件

## 下一步（按序）

1. **T-001** 初始化 Next.js 应用骨架（最高优先级，见 feature_list.json tasks）
2. **T-002** content/ 内容数据架构（messages/ 双语文件建立后 check:i18n 开始实测）
3. **T-003** Vitest 单元测试设施（npm test 从 node:test 迁移）
4. 之后按 feature_list.json 顺序实现迭代1故事（US-023 → US-001 → US-004 → …）

## 风险与注意事项

- `npm run verify` 目前不可运行：依赖 T-001 产出 `out/`。`npm run size` 同理。这是预期状态，不是 blocker。
- T-001 注意：create-next-app 会与现有 package.json 冲突，需手动初始化或合并模板；合并时保留 overrides 与 verify 系列脚本。
- 仓库尚未 git init；首次提交前确认 .gitignore 生效。package-lock.json 已生成，CI 的 npm ci 可用。
- CI 尚未首次运行：需 GitHub 公开仓库建立后触发。
- 未决：无。