#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
pwd

# WSL 通常没有独立的 Linux Node；委托给 Windows 侧 init.ps1，
# 保证 bash init.sh 与 ./init.ps1 使用同一套工具链并等价退出。
if ! command -v node >/dev/null 2>&1; then
  if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
    echo "== WSL 未检测到 node，委托 Windows PowerShell 执行等价启动流程 =="
    WIN_PS1="$(wslpath -w "$(pwd)/init.ps1")"
    exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WIN_PS1"
  fi
  echo "错误：未找到 node，请安装 Node.js 26（见 .nvmrc）" >&2
  exit 1
fi

echo "== 环境检查 =="
node --version
npm --version

echo "== 依赖安装 =="
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "== 配置冒烟验证 =="
node scripts/smoke-config.mjs
npx playwright test --list

echo "== 完成 =="
echo "应用骨架（T-001）完成后，本脚本扩展为 npm run verify 完整门禁。"
