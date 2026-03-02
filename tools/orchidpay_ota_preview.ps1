# orchidpay_ota_preview.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Enforce: must be run from repo root
if (-not (Test-Path ".\package.json")) { throw "Not in project root. Please run from repo root where package.json exists." }

# Require EXPO_TOKEN for non-interactive auth
if (-not $env:EXPO_TOKEN) { throw "EXPO_TOKEN is not set. In PowerShell: `$env:EXPO_TOKEN='YOUR_TOKEN' " }

Write-Host "== OrchidPay OTA Preview =="

Write-Host "[1/3] Whoami"
npx eas-cli whoami

Write-Host "[2/3] Ensure preview channel exists (ignore if already exists)"
try { npx eas-cli channel:create preview | Out-Host } catch { Write-Host "Channel preview already exists or cannot be created: continuing..." }

Write-Host "[3/3] Publish OTA update (SDK55+ requires --environment)"
$msg = "orchidpay mobile: ota preview " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
npx eas-cli update --channel preview --environment preview --message "$msg"

Write-Host "DONE. Kill & relaunch the app on iPhone to fetch the update."
