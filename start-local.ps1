# =============================================================================
# Запуск портала Негодяев на Windows (PowerShell)
# Использование:
#   .\start-local.ps1
#   .\start-local.ps1 -Port 7777
#   .\start-local.ps1 -Port 8090
# =============================================================================

param (
    [int]$Port = 8090
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=============================================================" -ForegroundColor DarkYellow
Write-Host "   🏴‍☠️ ПОРТАЛ НЕГОДЯЕВ: ЛОКАЛЬНЫЙ СЕРВЕР (WINDOWS POWERSHELL) " -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor DarkYellow

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "❌ Ошибка: Node.js не найден. Установите Node.js с https://nodejs.org" -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
Write-Host "✓ Node.js обнаружен: $nodeVersion" -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка npm зависимостей..." -ForegroundColor Cyan
    npm install
}

if (-not (Test-Path "dist\server.cjs")) {
    Write-Host "🔨 Сборка проекта (npm run build)..." -ForegroundColor Cyan
    npm run build
}

Write-Host ""
Write-Host "🚀 Запуск приложения на порту: $Port" -ForegroundColor Green
Write-Host "ℹ️  Порты 3000 и 5000 свободны!" -ForegroundColor Gray
Write-Host ""

node dist\server.cjs --port $Port
