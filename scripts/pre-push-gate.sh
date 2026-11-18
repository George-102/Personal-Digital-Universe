#!/bin/sh
# T-008 本地 pre-push 门禁：本地验证全绿才允许 push，避免推上去等云端 CI 才发现失败。
# 门禁范围 = npm run verify:local（lint → typecheck → build → 单测 → 质量指标，零浏览器）。
# Playwright 四项目与 Lighthouse 重验证仍由云端 CI 执行（T-007 分工不变）。
# 激活方式（一次性，由用户在终端执行）：
#   printf '%s\n' 'exec sh scripts/pre-push-gate.sh' > githooks/pre-push
#   git config core.hooksPath githooks
# 紧急豁免：git push --no-verify（显式跳过本 hook，请在提交说明中记录原因）。

# 清掉 IDE 注入的 NODE_OPTIONS（safe-delete shim 会干扰 npm）
unset NODE_OPTIONS

if ! command -v npm >/dev/null 2>&1; then
  echo "pre-push 门禁：未找到 npm，无法执行本地验证。请先安装 Node 26（见 .nvmrc）再 push。" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "pre-push 门禁：node_modules 缺失，请先运行 ./init.ps1（或 bash init.sh）再 push。" >&2
  exit 1
fi

echo "pre-push 门禁：运行 npm run verify:local（lint → typecheck → build → test → metrics）..."
if npm run verify:local; then
  echo "pre-push 门禁通过。云端 CI 仍会全量重验证（Playwright 四项目 + Lighthouse）。"
  exit 0
fi

echo "" >&2
echo "pre-push 门禁失败：本地验证未通过，已阻止 push。" >&2
echo "修复后重新 push；确需紧急推送请显式使用 git push --no-verify 并在提交说明中记录原因。" >&2
exit 1
