#!/usr/bin/env bash
# =============================================================================
# Сборка универсального установщика .dmg для macOS (Apple Silicon M1-M4 + Intel)
# Использование: ./build-mac-dmg.sh
# =============================================================================

set -e

echo "============================================================="
echo "   🍏 Сборка установщика Негодяи.dmg (Apple Silicon + Intel)   "
echo "============================================================="

if [ "$(uname)" != "Darwin" ]; then
    echo "❌ Ошибка: Нативный образ .dmg для macOS должен собираться на Mac."
    echo "💡 Используйте GitHub Actions (.github/workflows/desktop-build.yml) для сборки в облаке."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 20 LTS с https://nodejs.org"
    exit 1
fi

echo "1/4 Установка зависимостей проекта..."
npm install

echo "2/4 Проверка Electron и Electron-Builder..."
if [ ! -d "node_modules/electron" ] || [ ! -d "node_modules/electron-builder" ]; then
    npm install --save-dev electron electron-builder
fi

echo "3/4 Сборка веб-интерфейса и сервера..."
npm run build

echo "4/4 Упаковка универсального .dmg (arm64 + x64)..."
export CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --mac --universal

echo ""
echo "✅ Готово! Установщик .dmg создан в папке dist-electron/:"
ls -lh dist-electron/*.dmg
open dist-electron/
