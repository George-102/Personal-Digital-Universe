#Requires -Version 5.1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# 脚本所在目录（等价于 bash 的 cd "$(dirname "$0")"）
$RootDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location -LiteralPath $RootDir

# 等价于 set -e：外部命令返回非 0 时抛出异常终止脚本
function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string[]]$Command
    )

    $exe = $Command[0]
    $rest = @($Command | Select-Object -Skip 1)
    & $exe @rest

    $code = $LASTEXITCODE
    if ($null -eq $code) { $code = 0 }
    if ($code -ne 0) {
        throw "命令执行失败（退出码 $code）：$($Command -join ' ')"
    }
}

# 项目工具链优先由 mise 提供（.mise.toml）；未安装 mise 时保持系统 Node 回退路径。
$MiseAvailable = $null -ne (Get-Command mise -ErrorAction SilentlyContinue)
function Invoke-Tool {
    param(
        [Parameter(Mandatory = $true)][string[]]$Command
    )
    if ($script:MiseAvailable) {
        Invoke-Checked (@('mise', 'exec', '--') + $Command)
    } else {
        Invoke-Checked $Command
    }
}

if ($MiseAvailable) {
    Write-Host "== mise 工具链 =="
    Invoke-Checked @('mise', 'install', 'node')
}

Write-Host "== 环境检查 =="
Invoke-Tool -Command @('node', '--version')
Invoke-Tool -Command @('npm', '--version')

Write-Host "== 依赖安装 =="
if (Test-Path -LiteralPath 'package-lock.json') {
    Invoke-Tool -Command @('npm', 'ci')
} else {
    Invoke-Tool -Command @('npm', 'install')
}

Write-Host "== 配置冒烟验证 =="
Invoke-Tool -Command @('node', 'scripts/smoke-config.mjs')
Invoke-Tool -Command @('npx', 'playwright', 'test', '--list')

Write-Host "== pre-push 门禁状态 =="
$hookConfig = git config core.hooksPath
if (($hookConfig -eq 'githooks') -and (Test-Path -LiteralPath (Join-Path $RootDir 'githooks\pre-push'))) {
    Write-Host "pre-push 门禁已激活：git push 前自动执行 npm run verify:local。"
} else {
    Write-Host "pre-push 门禁未激活。一次性安装（Git Bash，仓库根目录）："
    Write-Host "  printf '%s\n' 'exec sh scripts/pre-push-gate.sh' > githooks/pre-push"
    Write-Host "  git config core.hooksPath githooks"
}

Write-Host "== 完成 =="
Write-Host "本地轻验证请运行 npm run verify:local（lint/typecheck/build/单测/质量指标，不启动浏览器）；Playwright 与 Lighthouse 重验证由云端 CI 在 push/PR 时执行，勿在本地运行 npm run verify（见 README 验收命令）。"
# 到达此处即所有检查通过；避免最后一步 git config 查询留下非 0 的 LASTEXITCODE。
$global:LASTEXITCODE = 0
