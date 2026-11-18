# picomatch 4.0.8-security.1（vendor 安全补丁包）

> 实际文件名版本号为 `4.0.8`，说明见下文「版本号」一节。

## 这是什么

这是 `picomatch@4.0.7`（registry 官方 tarball）+ **CVE-2026-112366 安全补丁**的 vendor 副本，
用于本仓库 `package.json` 的 npm `overrides`，在官方修复版发布前消除 ReDoS 漏洞。

- **基线来源**：`https://registry.npmmirror.com/picomatch/-/picomatch-4.0.7.tgz`（内容即 npm 官方 4.0.7）
- **补丁来源**：micromatch/picomatch PR [#238](https://github.com/micromatch/picomatch/pull/238)
  （`fix/redos-leading-extglob-quantifier-cve-2026-112366`，针对本 CVE 的修复，2000+ 测试通过，**未合并**）
- **漏洞**：GHSA-fc5q-39xc-vjpf / CVE-2026-112366 —— 单分支重复 extglob（如 `+(*a)`）编译为嵌套量词正则
  （如 `(?:[^/]*?a)+`）导致灾难性回溯。官方 advisory `Patched versions: None`（≤4.0.7 全受影响）。
- **补丁内容**：`lib/parse.js` 中 `analyzeRepeatedExtglob` 增加 `hasUnsafeLeadingQuantifier` 检测——
  分支以裸 `*`/`?` 量词开头且后面还有内容时，判为 risky 并按字面量兜底（不再编译为可回溯正则）。

## 版本号

package.json 版本声明为 **4.0.8**（而非 4.0.7-security.x），原因有二：

1. npm audit 的 advisory 匹配范围是 `<=4.0.7`，版本必须 **> 4.0.7** 才能脱离漏洞标记；
2. `fdir` 的 `peerOptional picomatch@"^3 || ^4"` 按 semver 规则**不匹配 prerelease**（如 `4.0.8-security.1`），
   会触发 npm 11 的 Arborist 解析崩溃（`Link.matches` null）。

**注意：这不是官方 picomatch 4.0.8。** 官方 4.0.8 尚未发布；此版本号仅用于安全补丁语义。
官方发布后请对比差异并移除本 vendor 目录与 overrides（见下）。

## 移除条件

满足任一条件后删除 `vendor/picomatch/`、移除 `package.json` 中的 `devDependencies.picomatch`
与 `overrides` 相关条目，再 `npm install` 复验 `npm audit --audit-level=high`：

1. 官方 picomatch 发布 ≥4.0.8 且 advisory 标注 patched；
2. micromatch/picomatch PR #238 或等效修复被合并并发布。

## 校验

- 补丁应用后 `lib/parse.js` 仅两处变化（helper 函数 + 一处调用），与 PR #238 diff 一致。
- `npm audit --audit-level=high` 不再出现 picomatch 及其依赖链条目。
