@echo off
REM =============================================================================
REM Запуск портала Негодяев на Windows CMD (на портах отличных от 3000 и 5000)
REM Использование:
REM   start-local.bat           (по умолчанию порт 8090)
REM   start-local.bat 7777      (любой произвольный порт)
REM =============================================================================

chcp 65001 >nul
setlocal enabledelayedexpansion

set TARGET_PORT=%1
if "%TARGET_PORT%"=="" set TARGET_PORT=8090

echo =============================================================
echo    ПОРТАЛ НЕГОДЯЕВ: ЛОКАЛЬНЫЙ СЕРВЕР (WINDOWS CMD)
echo =============================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден в системе!
    echo Скачайте и установите Node.js (LTS v20 или v22) с https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js обнаружен: !NODE_VER!

if not exist "node_modules\" (
    echo [1/2] Установка npm зависимостей...
    call npm install
)

if not exist "dist\server.cjs" (
    echo [2/2] Сборка проекта в dist...
    call npm run build
)

echo.
echo Запуск приложения на порту: !TARGET_PORT!
echo (Порты 3000 и 5000 остаются свободными)
echo.

node dist\server.cjs --port !TARGET_PORT!
pause
