#Requires -Version 5.1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# 脚本所在目录（等价于 bash 的 $(dirname "${BASH_SOURCE[0]}")）
$RootDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location -LiteralPath $RootDir

# 按你的项目实际情况替换这些命令。
$InstallCmd = @('npm', 'install')
$VerifyCmd  = @('npm', 'test')
$StartCmd   = @('npm', 'run', 'dev')

# 等价于 set -e：外部命令返回非 0 时抛出异常终止脚本
function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string[]]$Command
    )

    $exe = $Command[0]
    $cmdArgs = if ($Command.Count -gt 1) { $Command[1..($Command.Count - 1)] } else { @() }

    & $exe @cmdArgs

    $code = $LASTEXITCODE
    if ($null -eq $code) { $code = 0 }
    if ($code -ne 0) {
        throw "命令执行失败（退出码 $code）：$($Command -join ' ')"
    }
    return $code
}

Write-Host "==> 当前目录: $PWD"
Write-Host "==> 同步依赖"
Invoke-External $InstallCmd | Out-Null

Write-Host "==> 运行基础验证"
Invoke-External $VerifyCmd | Out-Null

Write-Host "==> 启动命令"
Write-Host ("    " + ($StartCmd -join ' '))

if ($env:RUN_START_COMMAND -eq '1') {
    Write-Host "==> 启动应用"
    Invoke-External $StartCmd | Out-Null
    exit $LASTEXITCODE   # 对应 bash 的 exec 语义：以启动命令的退出码结束脚本
}

Write-Host "如果希望 init.ps1 直接启动应用，请设置 RUN_START_COMMAND=1。"