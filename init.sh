#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
pwd

# 项目工具链优先由 mise 提供（.mise.toml）；未安装 mise 时保持系统 Node 回退路径。
if command -v mise >/dev/null 2>&1; then
  echo "== mise 工具链 =="
  mise install node
  run_tool() { mise exec -- "$@"; }
elif ! command -v node >/dev/null 2>&1; then
  # WSL 通常没有独立的 Linux Node；委托给 Windows 侧 init.ps1，
  # 保证 bash init.sh 与 ./init.ps1 使用同一套工具链并等价退出。
  if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
    echo "== WSL 未检测到 node，委托 Windows PowerShell 执行等价启动流程 =="
    WIN_PS1="$(wslpath -w "$(pwd)/init.ps1")"
    exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WIN_PS1"
  fi
  echo "错误：未找到 node，请安装 mise 或 Node.js 26（见 .nvmrc）" >&2
  exit 1
else
  run_tool() { "$@"; }
fi

echo "== 环境检查 =="
run_tool node --version
run_tool npm --version

echo "== 依赖安装 =="
if [ -f package-lock.json ]; then
  run_tool npm ci
else
  run_tool npm install
fi

echo "== 配置冒烟验证 =="
run_tool node scripts/smoke-config.mjs
run_tool npx playwright test --list

echo "== pre-push 门禁状态 =="
if [ "$(git config core.hooksPath || true)" = "githooks" ] && [ -f githooks/pre-push ]; then
  echo "pre-push 门禁已激活：git push 前自动执行 npm run verify:local。"
else
  echo "pre-push 门禁未激活。一次性安装（Git Bash，仓库根目录）："
  echo "  printf '%s\\n' 'exec sh scripts/pre-push-gate.sh' > githooks/pre-push"
  echo "  git config core.hooksPath githooks"
fi

echo "== 完成 =="
echo "本地轻验证请运行 npm run verify:local（不启动浏览器）；浏览器端到端与 Lighthouse 重验证由云端 CI 执行，勿在本地运行 npm run verify。"
