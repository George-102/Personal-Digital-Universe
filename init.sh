#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
pwd

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
node -e "JSON.parse(require('fs').readFileSync('feature_list.json','utf8')); console.log('feature_list.json OK')"
node -e "require('./lighthouserc.js'); console.log('lighthouserc.js OK')"
npx playwright test --list

echo "== 完成 =="
echo "应用骨架（T-001）完成后，本脚本扩展为 npm run verify 完整门禁。"