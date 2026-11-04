const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const PORT = process.env.PORT || 8092;

// Persistent connection config (saved in user data directory)
function getConfigPath() {
  return path.join(app.getPath('userData'), 'connection_config.json');
}

function loadConfig() {
  try {
    const file = getConfigPath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error('[Electron] Error loading config:', e);
  }
  return { serverUrl: null };
}

function saveConfig(config) {
  try {
    const file = getConfigPath();
    fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Electron] Error saving config:', e);
  }
}

// Check if server is already responding
function checkServerHealthy(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start embedded Node.js backend
async function startBackend() {
  const isHealthy = await checkServerHealthy(PORT);
  if (isHealthy) {
    console.log(`[Electron] Backend is already running on port ${PORT}`);
    return;
  }

  const serverScript = path.join(__dirname, '..', 'dist', 'server.cjs');
  console.log(`[Electron] Starting embedded server: ${serverScript} on port ${PORT}`);

  serverProcess = spawn(process.execPath || 'node', [serverScript, '--port', String(PORT)], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT)
    },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start server process:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Server exited with code ${code}, signal ${signal}`);
  });

  // Wait for server to become healthy (up to 15 seconds)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const healthy = await checkServerHealthy(PORT);
    if (healthy) {
      console.log(`[Electron] Backend successfully started on port ${PORT}`);
      return;
    }
  }
  console.warn('[Electron] Backend startup timeout, attempting to open window anyway');
}

function createApplicationMenu(targetUrl, isCustomDomain) {
  const template = [
    {
      label: 'Портал Негодяев',
      submenu: [
        {
          label: 'О программе',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'О портале Негодяев',
              message: 'Портал туристической команды Негодяи (v1.0.0)',
              detail: `Режим: ${isCustomDomain ? 'Подключение к удалённому домену' : 'Локальный автономный сервер'}\nАктивный адрес: ${targetUrl}\n\nБаза данных, чат, взносы фонда, история, квесты и игры.`
            });
          }
        },
        { type: 'separator' },
        { label: 'Скрыть', role: 'hide' },
        { label: 'Скрыть остальные', role: 'hideOthers' },
        { label: 'Показать все', role: 'unhide' },
        { type: 'separator' },
        { label: 'Выход', role: 'quit' }
      ]
    },
    {
      label: 'Сервер и Домен',
      submenu: [
        {
          label: 'Указать домен / туннель сервера...',
          click: async () => {
            const currentConfig = loadConfig();
            const { response, checkboxChecked } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Оставить текущий', 'Сбросить на локальный сервер'],
              title: 'Настройка подключения к серверу команды',
              message: 'Подключение к общему серверу Негодяев',
              detail: currentConfig.serverUrl
                ? `Текущий активный домен: ${currentConfig.serverUrl}\n\nЧтобы сменить домен, выберите сброс на локальный сервер или укажите флаг --server-url при запуске.`
                : `Приложение сейчас работает в режиме автономного локального сервера на порту ${PORT}.\n\nЕсли капитан команды поднял туннель Cloudflare или домен, запустите приложение с параметром:\n--server-url=https://ваш-домен.ru`
            });
            if (response === 1) {
              saveConfig({ serverUrl: null });
              app.relaunch();
              app.exit(0);
            }
          }
        },
        {
          label: 'Переключиться на локальный сервер (Офлайн)',
          click: () => {
            saveConfig({ serverUrl: null });
            app.relaunch();
            app.exit(0);
          }
        },
        { type: 'separator' },
        {
          label: 'Открыть папку с данными на диске',
          click: () => {
            const dataDir = path.join(process.cwd(), 'data');
            if (fs.existsSync(dataDir)) {
              shell.openPath(dataDir);
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'Папка данных:',
                detail: dataDir
              });
            }
          }
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Перезагрузить', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Принудительная перезагрузка', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Масштаб 100%', role: 'resetZoom' },
        { label: 'Увеличить', role: 'zoomIn' },
        { label: 'Уменьшить', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Полноэкранный режим', role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(targetUrl, isCustomDomain) {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Портал команды Негодяи',
    backgroundColor: '#181410',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: false
  });

  createApplicationMenu(targetUrl, isCustomDomain);

  mainWindow.loadURL(targetUrl);

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Check CLI argument for remote server URL
    let customServerUrl = null;
    const args = process.argv.slice(1);
    for (const arg of args) {
      if (arg.startsWith('--server-url=')) {
        customServerUrl = arg.split('=')[1].trim();
      }
    }

    const config = loadConfig();
    const finalServerUrl = customServerUrl || config.serverUrl;

    if (finalServerUrl) {
      console.log(`[Electron] Client mode: connecting to remote domain: ${finalServerUrl}`);
      createWindow(finalServerUrl, true);
    } else {
      console.log(`[Electron] Server mode: running local server on port ${PORT}`);
      await startBackend();
      createWindow(`http://127.0.0.1:${PORT}`, false);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const url = finalServerUrl || `http://127.0.0.1:${PORT}`;
        createWindow(url, Boolean(finalServerUrl));
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (e) {
        // ignore
      }
    }
  });
}
