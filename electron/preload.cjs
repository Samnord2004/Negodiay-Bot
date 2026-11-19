const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  selectDirectory: (defaultPath) => ipcRenderer.invoke('dialog:select-folder', defaultPath),
  openPathInOS: (targetPath) => ipcRenderer.invoke('shell:open-path', targetPath)
});
