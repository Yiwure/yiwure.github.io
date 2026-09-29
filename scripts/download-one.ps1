# 单一职责：下载一张图片。由 Node 逐张调用，避免 Runspace 传参问题。
# 走系统代理（Invoke-WebRequest 特性）。
param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$Dest,
  [int]$Retries = 3
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$dir = Split-Path -Parent $Dest
if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

$ua = 'travel-plan/2.0 (personal travel itinerary page)'
$lastErr = ''

for ($i = 1; $i -le $Retries; $i++) {
  try {
    Invoke-WebRequest -Uri $Url -OutFile $Dest -UserAgent $ua -TimeoutSec 60 -UseBasicParsing
    $len = (Get-Item -LiteralPath $Dest).Length
    if ($len -lt 1024) { throw "too small ($len B)" }
    Write-Output "OK $len"
    exit 0
  }
  catch {
    $lastErr = ($_.Exception.Message -replace "`r?`n", ' ')
    if ($i -lt $Retries) { Start-Sleep -Milliseconds (600 * $i) }
  }
}

Write-Output "FAIL $lastErr"
exit 1
