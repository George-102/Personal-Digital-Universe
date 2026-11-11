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

Write-Host "== 环境检查 =="
Invoke-Checked @('node', '--version')
Invoke-Checked @('npm', '--version')

Write-Host "== 依赖安装 =="
if (Test-Path -LiteralPath 'package-lock.json') {
    Invoke-Checked @('npm', 'ci')
} else {
    Invoke-Checked @('npm', 'install')
}

Write-Host "== 配置冒烟验证 =="
Invoke-Checked @('node', 'scripts/smoke-config.mjs')
Invoke-Checked @('npx', 'playwright', 'test', '--list')

Write-Host "== 完成 =="
Write-Host "本地轻验证请运行 npm run verify:local（lint/typecheck/build/单测/质量指标，不启动浏览器）；Playwright 与 Lighthouse 重验证由云端 CI 在 push/PR 时执行，勿在本地运行 npm run verify（见 README 验收命令）。"
