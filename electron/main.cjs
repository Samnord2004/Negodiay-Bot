const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let connectModal = null;
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
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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

// Fetch active storage dir from running backend
function fetchActiveStorageDir(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/storage/info`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.dataDir || path.join(app.getPath('userData'), 'data'));
        } catch (e) {
          resolve(path.join(app.getPath('userData'), 'data'));
        }
      });
    });
    req.on('error', () => resolve(path.join(app.getPath('userData'), 'data')));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(path.join(app.getPath('userData'), 'data'));
    });
  });
}

// Start embedded Node.js backend using Electron's embedded Node runtime (ELECTRON_RUN_AS_NODE=1)
async function startBackend() {
  const isHealthy = await checkServerHealthy(PORT);
  if (isHealthy) {
    console.log(`[Electron] Backend is already running on port ${PORT}`);
    return;
  }

  const userDataDir = app.getPath('userData');
  const defaultDataDir = path.join(userDataDir, 'data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const serverScript = path.join(__dirname, '..', 'dist', 'server.cjs');
  console.log(`[Electron] Starting embedded server: ${serverScript} on port ${PORT}`);

  serverProcess = spawn(process.execPath, [serverScript, '--port', String(PORT)], {
    cwd: userDataDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(PORT),
      APP_CONFIG_DIR: userDataDir,
      DEFAULT_DATA_DIR: defaultDataDir
    },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start server process:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Server exited with code ${code}, signal ${signal}`);
  });

  // Wait for server to become healthy (up to 20 seconds)
  const maxAttempts = 40;
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

// Interactive modal window for connecting to an external Cloudflare / Team domain
function openDomainConnectDialog() {
  if (connectModal) {
    connectModal.focus();
    return;
  }

  const currentConfig = loadConfig();
  const currentUrl = currentConfig.serverUrl || '';

  connectModal = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow || undefined,
    modal: Boolean(mainWindow),
    title: 'Подключение к внешнему домену / туннелю',
    backgroundColor: '#fef3c7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fffbeb;
      color: #451a03;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    h2 { margin: 0 0 6px; font-size: 17px; color: #991b1b; }
    p { margin: 0 0 14px; font-size: 12.5px; line-height: 1.45; color: #78350f; }
    label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      font-size: 13.5px;
      border: 2px solid #d97706;
      border-radius: 10px;
      outline: none;
      font-family: monospace;
    }
    input:focus { border-color: #dc2626; }
    .hint { font-size: 11px; color: #92400e; margin-top: 6px; }
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    button {
      padding: 9px 14px;
      border-radius: 10px;
      border: none;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-local { background: #fde68a; color: #78350f; }
    .btn-cancel { background: #e7e5e4; color: #44403c; }
    .btn-save { background: #dc2626; color: #fde047; }
  </style>
</head>
<body>
  <h2>Подключение к внешнему домену команды</h2>
  <p>Если на главном сервере запущен Cloudflare-туннель, введите его HTTPS-адрес. Приложение подключится к общей базе команды, чату и покеру.</p>
  <label for="url">Адрес сервера (HTTPS или домен):</label>
  <input id="url" type="text" placeholder="https://portal.negodyai.ru или https://xxxx.trycloudflare.com" value="${currentUrl.replace(/"/g, '&quot;')}" />
  <div class="hint">Оставьте пустым или нажмите «Локальный сервер», чтобы работать со своей автономной базой на этом ПК/Mac.</div>
  <div class="actions">
    <button class="btn-local" onclick="useLocal()">Локальный сервер</button>
    <button class="btn-cancel" onclick="window.close()">Отмена</button>
    <button class="btn-save" onclick="connectDomain()">Подключиться</button>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    function connectDomain() {
      const val = document.getElementById('url').value.trim();
      ipcRenderer.send('electron:set-server-url', val || null);
    }
    function useLocal() {
      ipcRenderer.send('electron:set-server-url', null);
    }
  </script>
</body>
</html>`;

  connectModal.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  connectModal.on('closed', () => {
    connectModal = null;
  });
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
              detail: `Режим: ${isCustomDomain ? 'Подключение к удалённому домену' : 'Локальный автономный сервер'}\nАктивный адрес: ${targetUrl}\nАрхитектура: ${process.arch} (${process.platform})\n\nБаза данных, медиатека на диске, Cloudflare туннель, чат, взносы фонда и игры.`
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
          label: 'Указать внешний домен / Cloudflare туннель...',
          click: () => {
            openDomainConnectDialog();
          }
        },
        {
          label: 'Переключиться на локальный сервер (Этот ПК / Mac)',
          click: () => {
            saveConfig({ serverUrl: null });
            app.relaunch();
            app.exit(0);
          }
        },
        { type: 'separator' },
        {
          label: 'Открыть папку с данными на диске',
          click: async () => {
            const activeDir = await fetchActiveStorageDir(PORT);
            if (fs.existsSync(activeDir)) {
              shell.openPath(activeDir);
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'Папка данных:',
                detail: activeDir
              });
            }
          }
        }
      ]
    },
    {
      label: 'Редактирование',
      submenu: [
        { label: 'Отменить', role: 'undo' },
        { label: 'Повторить', role: 'redo' },
        { type: 'separator' },
        { label: 'Вырезать', role: 'cut' },
        { label: 'Копировать', role: 'copy' },
        { label: 'Вставить', role: 'paste' },
        { label: 'Выделить всё', role: 'selectAll' }
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

// Native OS Folder Picker IPC handler for Admin Storage Settings
ipcMain.handle('dialog:select-folder', async (_event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите диск или папку для хранения данных портала',
    defaultPath: defaultPath && fs.existsSync(defaultPath) ? defaultPath : app.getPath('documents'),
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('shell:open-path', async (_event, targetPath) => {
  if (targetPath && fs.existsSync(targetPath)) {
    await shell.openPath(targetPath);
    return true;
  }
  return false;
});

ipcMain.on('electron:set-server-url', (_event, rawUrl) => {
  let cleanUrl = null;
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
    cleanUrl = rawUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
  }
  saveConfig({ serverUrl: cleanUrl });
  if (connectModal) {
    connectModal.close();
  }
  app.relaunch();
  app.exit(0);
});

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
        serverProcess.kill('SIGTERM');
      } catch (e) {
        try {
          serverProcess.kill();
        } catch (e2) {}
      }
    }
  });
}
