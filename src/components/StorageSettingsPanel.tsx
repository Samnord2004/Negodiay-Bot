import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  HardDrive,
  Folder,
  FolderPlus,
  FolderOpen,
  Server,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Power,
  Square,
  Smartphone,
  ExternalLink,
  ChevronUp,
  ChevronRight,
  Terminal,
  Key
} from 'lucide-react';
import { Participant } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      selectDirectory?: (defaultPath?: string) => Promise<string | null>;
      openPathInOS?: (targetPath: string) => Promise<boolean>;
    };
  }
}

interface StorageStats {
  platform?: string;
  dataDir: string;
  mediaDir: string;
  databaseFile: string;
  databaseSizeBytes: number;
  databaseSizeFormatted: string;
  mediaFilesCount: number;
  mediaSizeBytes: number;
  mediaSizeFormatted: string;
  totalStorageFormatted: string;
  diskFreeFormatted?: string;
  diskTotalFormatted?: string;
}

interface LocalDiskInfo {
  name: string;
  path: string;
  suggestedDataPath: string;
  kind: 'system' | 'external' | 'home' | 'default';
  freeBytes: number;
  totalBytes: number;
  freeFormatted: string;
  totalFormatted: string;
  usedPercent: number;
  writable: boolean;
}

interface BrowseResult {
  success: boolean;
  currentPath: string;
  parentPath: string | null;
  folders: { name: string; path: string }[];
  error?: string;
}

interface TunnelStatus {
  installed: boolean;
  binaryPath: string | null;
  installing: boolean;
  state: 'stopped' | 'starting' | 'running' | 'error';
  mode: 'quick' | 'token';
  publicUrl: string | null;
  customDomain: string;
  hasToken: boolean;
  tokenPreview: string;
  autoStart: boolean;
  localPort: number | null;
  startedAt: string | null;
  error: string | null;
  logs: string[];
}

interface StorageSettingsPanelProps {
  currentUser: Participant | null;
}

export default function StorageSettingsPanel({ currentUser }: StorageSettingsPanelProps) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [disks, setDisks] = useState<LocalDiskInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Path selection & folder browser state
  const [newPath, setNewPath] = useState('');
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [pathMessage, setPathMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browseData, setBrowseData] = useState<BrowseResult | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Cloudflare Tunnel state
  const [tunnel, setTunnel] = useState<TunnelStatus | null>(null);
  const [tunnelMode, setTunnelMode] = useState<'quick' | 'token'>('quick');
  const [customDomain, setCustomDomain] = useState('');
  const [tunnelToken, setTunnelToken] = useState('');
  const [autoStartTunnel, setAutoStartTunnel] = useState(false);
  const [isTunnelBusy, setIsTunnelBusy] = useState(false);
  const [tunnelFeedback, setTunnelFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showTunnelLogs, setShowTunnelLogs] = useState(false);

  const isElectron = Boolean(typeof window !== 'undefined' && window.electronAPI?.isElectron);

  const fetchAllInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [infoRes, disksRes, tunnelRes] = await Promise.all([
        fetch('/api/storage/info'),
        fetch('/api/storage/disks'),
        fetch('/api/tunnel/status')
      ]);

      const infoData = await infoRes.json();
      if (infoData.success) {
        setStats(infoData);
        setNewPath((prev) => prev || infoData.dataDir);
      }

      const disksData = await disksRes.json();
      if (disksData.success && Array.isArray(disksData.disks)) {
        setDisks(disksData.disks);
      }

      const tunnelData = await tunnelRes.json();
      if (tunnelData.success) {
        setTunnel(tunnelData);
        setTunnelMode(tunnelData.mode || 'quick');
        setCustomDomain((prev) => prev || tunnelData.customDomain || '');
        setAutoStartTunnel(Boolean(tunnelData.autoStart));
      }
    } catch (err) {
      console.error('Error fetching storage/tunnel info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTunnelStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/tunnel/status');
      const data = await res.json();
      if (data.success) {
        setTunnel(data);
      }
    } catch (e) {
      // ignore polling hiccup
    }
  }, []);

  useEffect(() => {
    fetchAllInfo();
  }, [fetchAllInfo]);

  // Poll tunnel status while starting or running
  useEffect(() => {
    if (!tunnel || (tunnel.state !== 'starting' && tunnel.state !== 'running' && !tunnel.installing)) {
      return;
    }
    const timer = setInterval(fetchTunnelStatus, 2500);
    return () => clearInterval(timer);
  }, [tunnel?.state, tunnel?.installing, fetchTunnelStatus]);

  // Generate QR code whenever publicUrl changes
  useEffect(() => {
    const url = tunnel?.publicUrl;
    if (!url) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: {
        dark: '#451a03',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [tunnel?.publicUrl]);

  const browsePath = async (targetPath?: string) => {
    setIsBrowsing(true);
    setShowBrowser(true);
    try {
      const query = targetPath ? `?path=${encodeURIComponent(targetPath)}` : '';
      const res = await fetch(`/api/storage/browse${query}`);
      const data: BrowseResult = await res.json();
      setBrowseData(data);
    } catch (e) {
      console.error('Browse error:', e);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleSelectDiskCard = (disk: LocalDiskInfo) => {
    setNewPath(disk.suggestedDataPath);
    setPathMessage(null);
    browsePath(disk.path);
  };

  const handleNativeSelectFolder = async () => {
    if (!window.electronAPI?.selectDirectory) return;
    const selected = await window.electronAPI.selectDirectory(newPath || stats?.dataDir);
    if (selected) {
      setNewPath(selected);
      setPathMessage(null);
    }
  };

  const handleCreateSubfolder = async () => {
    if (!browseData?.currentPath || !newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch('/api/storage/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: browseData.currentPath,
          folderName: newFolderName.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.path) {
        setNewFolderName('');
        setNewPath(data.path);
        await browsePath(data.path);
      } else {
        setPathMessage({ type: 'error', text: data.error || 'Не удалось создать папку' });
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSavePath = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPath.trim()) return;

    setIsSavingPath(true);
    setPathMessage(null);
    try {
      const res = await fetch('/api/storage/set-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newPath.trim(),
          operatorId: currentUser?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setPathMessage({ type: 'success', text: data.message || 'Диск хранения успешно изменён!' });
        setShowBrowser(false);
        await fetchAllInfo();
      } else {
        setPathMessage({ type: 'error', text: data.error || data.message || 'Не удалось изменить путь' });
      }
    } catch (err) {
      setPathMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setIsSavingPath(false);
    }
  };

  const handleInstallCloudflared = async () => {
    setIsTunnelBusy(true);
    setTunnelFeedback(null);
    try {
      const res = await fetch('/api/tunnel/install', { method: 'POST' });
      const data = await res.json();
      if (data.status) setTunnel(data.status);
      setTunnelFeedback({
        type: data.success ? 'success' : 'error',
        text: data.message || (data.success ? 'Клиент Cloudflare установлен' : 'Ошибка установки')
      });
    } catch (e) {
      setTunnelFeedback({ type: 'error', text: 'Сбой связи с сервером при установке' });
    } finally {
      setIsTunnelBusy(false);
    }
  };

  const handleStartTunnel = async () => {
    setIsTunnelBusy(true);
    setTunnelFeedback(null);
    try {
      const res = await fetch('/api/tunnel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: tunnelMode,
          customDomain: customDomain.trim(),
          tunnelToken: tunnelToken.trim(),
          autoStart: autoStartTunnel
        })
      });
      const data = await res.json();
      if (data.status) setTunnel(data.status);
      setTunnelFeedback({
        type: data.success ? 'success' : 'error',
        text: data.message || (data.success ? 'Туннель запущен' : 'Не удалось запустить туннель')
      });
    } catch (e) {
      setTunnelFeedback({ type: 'error', text: 'Ошибка запуска туннеля' });
    } finally {
      setIsTunnelBusy(false);
    }
  };

  const handleStopTunnel = async () => {
    setIsTunnelBusy(true);
    setTunnelFeedback(null);
    try {
      const res = await fetch('/api/tunnel/stop', { method: 'POST' });
      const data = await res.json();
      if (data.status) setTunnel(data.status);
      setTunnelFeedback({ type: 'success', text: 'Туннель остановлен' });
    } catch (e) {
      setTunnelFeedback({ type: 'error', text: 'Ошибка остановки туннеля' });
    } finally {
      setIsTunnelBusy(false);
    }
  };

  const handleSaveTunnelConfigOnly = async () => {
    setIsTunnelBusy(true);
    setTunnelFeedback(null);
    try {
      const res = await fetch('/api/tunnel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: tunnelMode,
          customDomain: customDomain.trim(),
          tunnelToken: tunnelToken.trim(),
          autoStart: autoStartTunnel
        })
      });
      const data = await res.json();
      if (data.status) setTunnel(data.status);
      setTunnelFeedback({ type: 'success', text: 'Настройки туннеля сохранены' });
    } catch (e) {
      setTunnelFeedback({ type: 'error', text: 'Не удалось сохранить настройки' });
    } finally {
      setIsTunnelBusy(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!tunnel?.publicUrl) return;
    try {
      await navigator.clipboard.writeText(tunnel.publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/export-database', '_blank');
  };

  const handleOpenDataDirInOS = () => {
    if (stats?.dataDir && window.electronAPI?.openPathInOS) {
      window.electronAPI.openPathInOS(stats.dataDir);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-amber-300">
        <div>
          <h3 className="font-black text-lg uppercase text-amber-950 flex items-center gap-2">
            <HardDrive className="text-red-600 shrink-0" size={22} />
            <span>Локальные диски и Внешний HTTPS-туннель</span>
          </h3>
          <p className="text-xs text-amber-800 mt-0.5">
            Выбор физического диска для базы, фото и видео, а также публикация портала на внешний домен через Cloudflare
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-400 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download size={14} />
            <span>Бэкап БД</span>
          </button>
          <button
            type="button"
            onClick={fetchAllInfo}
            disabled={isLoading}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Server size={15} className="text-red-600" />
              <span>База данных (Тексты/Чат)</span>
            </div>
            <div className="text-2xl font-black text-amber-950 tabular-nums font-mono">
              {stats?.databaseSizeFormatted || '...'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 truncate font-mono">
            app_storage.json
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Folder size={15} className="text-amber-600" />
              <span>Медиатека (Фото & Видео)</span>
            </div>
            <div className="text-2xl font-black text-amber-950 tabular-nums font-mono">
              {stats?.mediaSizeFormatted || '0.00 MB'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 tabular-nums">
            Файлов на диске: <strong>{stats?.mediaFilesCount ?? 0}</strong>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <HardDrive size={15} className="text-green-700" />
              <span>Свободно на диске</span>
            </div>
            <div className="text-2xl font-black text-green-900 tabular-nums font-mono">
              {stats?.diskFreeFormatted || '—'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 flex items-center justify-between gap-2">
            <span className="tabular-nums">Всего: {stats?.diskTotalFormatted || '—'}</span>
            {isElectron && stats?.dataDir && (
              <button
                type="button"
                onClick={handleOpenDataDirInOS}
                className="text-red-700 hover:underline font-bold cursor-pointer"
              >
                Открыть папку
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: LOCAL DISK SELECTION & FOLDER BROWSER */}
      <div className="bg-amber-100/60 p-5 rounded-2xl border-2 border-amber-400 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-amber-950 text-sm uppercase flex items-center gap-2">
              <HardDrive size={17} className="text-red-600" />
              <span>1. Выбор локального диска для хранения данных</span>
            </h4>
            <p className="text-xs text-amber-900 mt-0.5">
              Нажмите на нужный локальный или внешний диск (например, SSD, USB или D:\), либо выберите папку вручную. Фото, видео, документы и база перенесутся автоматически.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isElectron && (
              <button
                type="button"
                onClick={handleNativeSelectFolder}
                className="px-3 py-2 bg-white hover:bg-amber-50 border-2 border-amber-500 text-amber-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FolderOpen size={15} className="text-red-600" />
                <span>Обзор в Finder / Проводнике</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => (showBrowser ? setShowBrowser(false) : browsePath(newPath || stats?.dataDir))}
              className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Folder size={15} />
              <span>{showBrowser ? 'Скрыть папки' : 'Обзор папок'}</span>
            </button>
          </div>
        </div>

        {/* Detected OS Drives Grid */}
        {disks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {disks.map((disk) => {
              const isSelected = newPath === disk.suggestedDataPath || stats?.dataDir === disk.suggestedDataPath;
              const isActive = stats?.dataDir === disk.path || stats?.dataDir === disk.suggestedDataPath;
              return (
                <button
                  key={disk.path + disk.kind}
                  type="button"
                  onClick={() => handleSelectDiskCard(disk)}
                  disabled={!disk.writable}
                  className={`text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-white border-red-600 ring-2 ring-red-500/20'
                      : 'bg-white/80 hover:bg-white border-amber-300'
                  } ${!disk.writable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-xs text-amber-950 truncate">{disk.name}</div>
                      <div className="text-[11px] font-mono text-amber-700 truncate">{disk.path}</div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold text-green-800 shrink-0">Активен</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 tabular-nums">
                      <span>Свободно: <strong>{disk.freeFormatted}</strong></span>
                      <span>{disk.totalFormatted}</span>
                    </div>
                    {disk.totalBytes > 0 && (
                      <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${disk.usedPercent > 88 ? 'bg-red-600' : 'bg-amber-600'}`}
                          style={{ width: `${Math.min(100, Math.max(4, disk.usedPercent))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Interactive Folder Browser */}
        {showBrowser && (
          <div className="bg-white rounded-xl border border-amber-300 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {browseData?.parentPath && (
                  <button
                    type="button"
                    onClick={() => browsePath(browseData.parentPath!)}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <ChevronUp size={14} />
                    <span>Вверх</span>
                  </button>
                )}
                <span className="text-xs font-mono text-amber-950 truncate" title={browseData?.currentPath}>
                  {browseData?.currentPath || '...'}
                </span>
              </div>
              {browseData?.currentPath && (
                <button
                  type="button"
                  onClick={() => setNewPath(browseData.currentPath)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-lg text-xs font-black cursor-pointer shrink-0"
                >
                  Выбрать эту папку
                </button>
              )}
            </div>

            {isBrowsing ? (
              <div className="py-4 text-center text-xs text-amber-800 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Чтение папок диска...</span>
              </div>
            ) : browseData?.error ? (
              <div className="text-xs text-red-700 font-bold">{browseData.error}</div>
            ) : (
              <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {browseData?.folders.length === 0 ? (
                  <div className="col-span-full text-xs text-amber-700 py-2">Подпапок нет — вы можете создать новую ниже.</div>
                ) : (
                  browseData?.folders.map((folder) => (
                    <button
                      key={folder.path}
                      type="button"
                      onClick={() => {
                        setNewPath(folder.path);
                        browsePath(folder.path);
                      }}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left text-xs text-amber-950 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Folder size={13} className="text-amber-600 shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </span>
                      <ChevronRight size={13} className="text-amber-500 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Create new folder inside current browsed path */}
            {browseData?.currentPath && (
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Имя новой папки (например: Negodyai_Data)"
                  className="flex-1 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={handleCreateSubfolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 disabled:opacity-50 text-amber-950 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <FolderPlus size={14} />
                  <span>Создать папку</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Path Form */}
        <form onSubmit={handleSavePath} className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-amber-950 mb-1">
              Выбранный каталог хранения на сервере:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="Например: /Volumes/External_SSD/Negodyai_Data или D:\Negodyai_Data"
                className="flex-1 bg-white text-stone-900 border-2 border-amber-400 focus:border-red-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono outline-none"
              />
              <button
                type="submit"
                disabled={isSavingPath || !newPath.trim() || newPath === stats?.dataDir}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black text-xs uppercase px-5 py-2.5 rounded-xl border-2 border-amber-950 shadow flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSavingPath ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                <span>Применить диск</span>
              </button>
            </div>
            <div className="text-[11px] text-amber-800 mt-1 font-mono truncate">
              Сейчас активно: <strong>{stats?.dataDir || '...'}</strong>
            </div>
          </div>

          {pathMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                pathMessage.type === 'success'
                  ? 'bg-green-100 text-green-900 border-green-400'
                  : 'bg-red-100 text-red-900 border-red-400'
              }`}
            >
              {pathMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{pathMessage.text}</span>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: CLOUDFLARE EXTERNAL HTTPS TUNNEL */}
      <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-amber-950 text-sm uppercase flex items-center gap-2">
              <Globe className="text-blue-600 shrink-0" size={18} />
              <span>2. Внешний HTTPS-туннель Cloudflare (для телефона и удалённых ПК)</span>
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Открывает защищённый доступ из интернета к вашему локальному серверу (включая WebSocket для покера) без белого IP и проброса портов.
            </p>
          </div>

          {/* Live Connection State */}
          <div className="flex items-center gap-2 text-xs font-black uppercase shrink-0">
            {tunnel?.state === 'running' && (
              <span className="flex items-center gap-1.5 text-green-800">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse" />
                <span>Туннель активен</span>
              </span>
            )}
            {tunnel?.state === 'starting' && (
              <span className="flex items-center gap-1.5 text-amber-800">
                <RefreshCw size={14} className="animate-spin" />
                <span>Подключение...</span>
              </span>
            )}
            {(!tunnel || tunnel.state === 'stopped') && (
              <span className="text-stone-600">Отключен</span>
            )}
            {tunnel?.state === 'error' && (
              <span className="text-red-700 flex items-center gap-1">
                <AlertTriangle size={14} />
                <span>Ошибка</span>
              </span>
            )}
          </div>
        </div>

        {/* Binary installation notice if missing */}
        {tunnel && !tunnel.installed && (
          <div className="bg-white p-4 rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-950 space-y-1">
              <div className="font-black">Клиент Cloudflare (cloudflared) ещё не установлен на этом сервере</div>
              <p className="text-amber-800">
                Нажмите кнопку справа — сервер автоматически скачает официальный модуль Cloudflare для вашей ОС ({stats?.platform || 'macOS / Windows'}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstallCloudflared}
              disabled={isTunnelBusy || tunnel.installing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {isTunnelBusy || tunnel.installing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Установить cloudflared</span>
            </button>
          </div>
        )}

        {/* Active Public HTTPS URL + QR Code */}
        {tunnel?.state === 'running' && tunnel.publicUrl && (
          <div className="bg-white p-4 rounded-2xl border-2 border-green-500 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-green-800">
                <Smartphone size={16} />
                <span>Внешний HTTPS-домен для входа с телефона или удалённого ПК:</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-green-50 border border-green-300 rounded-xl px-3 py-2 font-mono text-xs sm:text-sm font-bold text-green-950 truncate select-all">
                  {tunnel.publicUrl}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedUrl ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                  <a
                    href={tunnel.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1 whitespace-nowrap"
                  >
                    <ExternalLink size={14} />
                    <span>Открыть</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-amber-800">
                Эту ссылку можно открыть в браузере на телефоне или ввести в меню <strong>«Сервер и Домен»</strong> десктопного приложения <strong>.dmg / .exe</strong> у любого участника команды.
              </p>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-1 shrink-0 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <img src={qrDataUrl} alt="QR-код для входа с телефона" className="w-32 h-32 rounded-lg" />
                <span className="text-[10px] font-bold text-amber-900">Сканируйте камерой телефона</span>
              </div>
            )}
          </div>
        )}

        {/* Mode Segmented Selector */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-amber-200/60 rounded-xl border border-amber-300">
          <button
            type="button"
            onClick={() => setTunnelMode('quick')}
            className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
              tunnelMode === 'quick' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-900 hover:bg-amber-100/70'
            }`}
          >
            Быстрый HTTPS-туннель (без регистрации)
          </button>
          <button
            type="button"
            onClick={() => setTunnelMode('token')}
            className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
              tunnelMode === 'token' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-900 hover:bg-amber-100/70'
            }`}
          >
            Свой внешний домен (Tunnel Token)
          </button>
        </div>

        {/* Mode Options */}
        {tunnelMode === 'quick' ? (
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold text-amber-950">Мгновенный публичный домен *.trycloudflare.com</div>
            <p>
              Cloudflare бесплатно выдаст временный HTTPS-адрес для вашего локального сервера (работает на macOS, Windows и Linux без аккаунта и настройки DNS). При каждом перезапуске выдаётся новый адрес.
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-amber-950 uppercase mb-1">
                  Ваш внешний домен:
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="https://portal.negodyai.ru"
                  className="w-full bg-amber-50/50 border border-amber-300 focus:border-red-600 rounded-xl px-3 py-2 font-mono text-xs text-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-amber-950 uppercase mb-1 flex items-center gap-1.5">
                  <Key size={12} className="text-red-600" />
                  <span>Cloudflare Tunnel Token:</span>
                  {tunnel?.hasToken && !tunnelToken && (
                    <span className="text-[10px] font-mono text-green-700 normal-case">
                      (Сохранён: {tunnel.tokenPreview})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={tunnelToken}
                  onChange={(e) => setTunnelToken(e.target.value)}
                  placeholder={tunnel?.hasToken ? 'Оставьте пустым, чтобы использовать сохранённый токен' : 'eyJhIjoi... (токен из Cloudflare Zero Trust)'}
                  className="w-full bg-amber-50/50 border border-amber-300 focus:border-red-600 rounded-xl px-3 py-2 font-mono text-xs text-stone-900 outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1">
              <div className="font-bold text-amber-950">Как привязать свой постоянный домен через Cloudflare Zero Trust (бесплатно):</div>
              <div>1. В панели <strong>one.dash.cloudflare.com</strong> откройте <em>Networks → Tunnels → Create a tunnel → Cloudflared</em>.</div>
              <div>2. Скопируйте выданный <strong>Token</strong> в поле выше, а во вкладке <em>Public Hostname</em> направьте ваш домен на <code className="font-mono font-bold">http://127.0.0.1:{tunnel?.localPort || 8092}</code>.</div>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoStartTunnel}
              onChange={(e) => setAutoStartTunnel(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded"
            />
            <span>Автозапуск туннеля при включении сервера / программы</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveTunnelConfigOnly}
              disabled={isTunnelBusy}
              className="px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
            >
              Сохранить настройки
            </button>

            {tunnel?.state === 'running' || tunnel?.state === 'starting' ? (
              <button
                type="button"
                onClick={handleStopTunnel}
                disabled={isTunnelBusy}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-black uppercase rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Square size={13} />
                <span>Остановить туннель</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTunnel}
                disabled={isTunnelBusy}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 text-xs font-black uppercase rounded-xl border-2 border-amber-950 shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {isTunnelBusy ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                <span>Запустить HTTPS-туннель</span>
              </button>
            )}
          </div>
        </div>

        {(tunnelFeedback || tunnel?.error) && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              tunnelFeedback?.type === 'success' && !tunnel?.error
                ? 'bg-green-100 text-green-900 border-green-400'
                : 'bg-red-100 text-red-900 border-red-400'
            }`}
          >
            {tunnelFeedback?.type === 'success' && !tunnel?.error ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{tunnel?.error || tunnelFeedback?.text}</span>
          </div>
        )}

        {/* Collapsible Tunnel Logs */}
        {tunnel && tunnel.logs && tunnel.logs.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTunnelLogs(!showTunnelLogs)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <Terminal size={13} />
              <span>{showTunnelLogs ? 'Скрыть журнал туннеля' : `Показать журнал подключения (${tunnel.logs.length})`}</span>
            </button>
            {showTunnelLogs && (
              <div className="mt-2 bg-stone-900 text-amber-100 font-mono text-[11px] p-3 rounded-xl max-h-40 overflow-y-auto space-y-0.5">
                {tunnel.logs.map((line, i) => (
                  <div key={i} className="break-all">{line}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
