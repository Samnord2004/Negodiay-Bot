import React, { useState, useEffect } from 'react';
import { HardDrive, Folder, Server, Globe, RefreshCw, CheckCircle, AlertTriangle, Download, ArrowRight, Shield } from 'lucide-react';
import { Participant } from '../types';

interface StorageStats {
  dataDir: string;
  mediaDir: string;
  databaseFile: string;
  databaseSizeBytes: number;
  databaseSizeFormatted: string;
  mediaFilesCount: number;
  mediaSizeBytes: number;
  mediaSizeFormatted: string;
  totalStorageFormatted: string;
}

interface StorageSettingsPanelProps {
  currentUser: Participant | null;
}

export default function StorageSettingsPanel({ currentUser }: StorageSettingsPanelProps) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPath, setNewPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStorageInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/storage/info');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (!newPath) {
          setNewPath(data.dataDir);
        }
      }
    } catch (err) {
      console.error('Error fetching storage info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    setIsSaving(true);
    setStatusMessage(null);
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
        setStatusMessage({ type: 'success', text: data.message || 'Путь к хранилищу успешно изменён!' });
        await fetchStorageInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error || data.message || 'Не удалось изменить путь' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/export-database', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-amber-300">
        <div>
          <h3 className="font-black text-lg uppercase text-amber-950 flex items-center gap-2">
            <HardDrive className="text-red-600" size={22} />
            Дисковое хранилище сервера & Туннелирование
          </h3>
          <p className="text-xs text-amber-800">
            Управление физическим диском для сохранения данных (текстов, архивов фото и видео) и сетевым доступом
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStorageInfo}
          disabled={isLoading}
          className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Обновить статус
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Server size={16} className="text-red-600" />
              База данных (Тексты/Чат)
            </div>
            <div className="text-2xl font-black text-amber-950">
              {stats?.databaseSizeFormatted || '...'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 truncate font-mono">
            app_storage.json
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Folder size={16} className="text-amber-600" />
              Медиатека (Фото & Видео)
            </div>
            <div className="text-2xl font-black text-amber-950">
              {stats?.mediaSizeFormatted || '0 MB'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2">
            Файлов на диске: <strong>{stats?.mediaFilesCount ?? 0}</strong>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <HardDrive size={16} className="text-green-700" />
              Общий объем на диске
            </div>
            <div className="text-2xl font-black text-green-900">
              {stats?.totalStorageFormatted || '...'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2">
            Локальный сервер активен
          </div>
        </div>
      </div>

      {/* Storage Disk Path Config Form */}
      <div className="bg-amber-100/70 p-5 rounded-2xl border-2 border-amber-400 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-600 text-yellow-300 rounded-xl shrink-0">
            <Folder size={20} />
          </div>
          <div>
            <h4 className="font-black text-amber-950 text-sm uppercase">
              Выбор места сохранения данных на сервере
            </h4>
            <p className="text-xs text-amber-900 mt-0.5">
              Вы можете указать любой диск сервера (например, внешний жесткий диск <strong>D:\</strong> или <strong>E:\</strong> на Windows, либо том <strong>/Volumes/...</strong> на Mac). При изменении существующая база будет автоматически скопирована в новую папку.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePath} className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-amber-950 mb-1">
              Текущий путь к каталогу хранения:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="Например: D:\Negodyai_Data или /Volumes/T7_Shield/Negodyai_Data"
                className="flex-1 bg-white text-stone-900 border-2 border-amber-400 focus:border-red-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono outline-none shadow-inner"
              />
              <button
                type="submit"
                disabled={isSaving || !newPath.trim() || newPath === stats?.dataDir}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black text-xs uppercase px-5 py-2.5 rounded-xl border-2 border-amber-950 shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Применить диск
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-amber-800 bg-white/70 p-2.5 rounded-xl border border-amber-300">
            <span className="font-bold">Примеры для дисков:</span>
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono">D:\Negodyai_Storage</code>
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono">E:\Server\Data</code>
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono">/Volumes/USB_DRIVE/Negodyai</code>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                statusMessage.type === 'success'
                  ? 'bg-green-100 text-green-900 border-green-400'
                  : 'bg-red-100 text-red-900 border-red-400'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </form>
      </div>

      {/* Tunneling & Remote Access Architecture Guide */}
      <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 space-y-4">
        <h4 className="font-black text-amber-950 text-sm uppercase flex items-center gap-2">
          <Globe className="text-blue-600" size={18} />
          Как работает туннелирование и домен для клиентов (.exe / .dmg / Web)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-amber-900">
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
            <div className="font-black text-red-700 uppercase flex items-center gap-1.5">
              <span>1. Серверный компьютер</span>
            </div>
            <p>
              На компьютере, где хранятся файлы и база (Windows PC или Mac), запускается приложение в режиме сервера (порт 8090/8092). В соседнем окне запускается туннель:
            </p>
            <div className="bg-stone-900 text-yellow-300 font-mono p-2 rounded-lg text-[11px] overflow-x-auto">
              npx cloudflared tunnel --url http://localhost:8090
            </div>
            <p className="text-[11px] text-amber-800">
              Вы получаете публичный домен, например: <code className="text-red-700 font-bold">https://xxx.trycloudflare.com</code> (или привязываете свой постоянный домен).
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
            <div className="font-black text-blue-700 uppercase flex items-center gap-1.5">
              <span>2. Компьютеры участников</span>
            </div>
            <p>
              Участники команды, установившие приложение через <strong>.exe</strong> или <strong>.dmg</strong>, либо открывшие сайт через браузер:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>В меню программы выбирают <strong>«Сервер и Домен» ➔ «Указать домен»</strong>.</li>
              <li>Либо вводят публичный домен вашего сервера.</li>
              <li>Все данные, чат, взносы фонда и покер работают с единой базой вашего сервера!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
