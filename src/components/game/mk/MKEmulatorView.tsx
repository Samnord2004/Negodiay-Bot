import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Play, Trash2, Maximize2, RefreshCw, 
  Gamepad2, Volume2, VolumeX, Sparkles, Shield, 
  Flame, HelpCircle, Smartphone, Monitor, Info,
  Users, Globe, Copy, Check, ArrowRight, UserCheck,
  AlertCircle, Radio, PlayCircle, LogOut
} from 'lucide-react';
import { Participant } from '../../../types';
import { MKConsoleCore } from '../../../types/mkTournament';
import { 
  loadRomFromIndexedDB, saveRomToIndexedDB, clearRomFromIndexedDB 
} from '../../../utils/mkData';
import { playMKGongSound } from '../../../utils/mkSounds';
import { getParticipantAvatar } from '../../../utils/avatar';

interface MKRoomInfo {
  id: string;
  code: string;
  title: string;
  core: string;
  romName?: string;
  hostParticipantId: string;
  hostName: string;
  hostNickname: string;
  hostAvatar?: string;
  clientParticipantId?: string;
  clientName?: string;
  clientNickname?: string;
  clientAvatar?: string;
  status: 'waiting' | 'in_game' | 'closed';
  createdAt: number;
}

interface MKEmulatorViewProps {
  currentUser?: Participant | null;
  participants?: Participant[];
  onRecordMatchWinner?: (p1Score: number, p2Score: number, finish: string) => void;
}

export default function MKEmulatorView({ 
  currentUser, 
  participants = [],
  onRecordMatchWinner 
}: MKEmulatorViewProps) {
  // Mode: Single Player Training or P2P Netplay
  const [playMode, setPlayMode] = useState<'single' | 'netplay'>('netplay');
  
  // Platform & ROM State
  const [core, setCore] = useState<MKConsoleCore>('segaMD');
  const [romFile, setRomFile] = useState<File | null>(null);
  const [romInfo, setRomInfo] = useState<{ name: string; size: number } | null>(null);
  const [isEmulatorRunning, setIsEmulatorRunning] = useState(false);
  const [isLoadingRom, setIsLoadingRom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeBlobUrl, setIframeBlobUrl] = useState<string | null>(null);

  // Netplay State
  const [roomCode, setRoomCode] = useState<string>(() => {
    // Check URL query parameters for auto-joining
    const params = new URLSearchParams(window.location.search);
    const paramRoom = params.get('mk_room');
    if (paramRoom) return paramRoom.toUpperCase();
    return 'MK-' + Math.floor(100 + Math.random() * 900);
  });
  const [playerRole, setPlayerRole] = useState<1 | 2>(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('mk_role');
    if (paramRole === '2') return 2;
    return 1;
  });
  const [activeRooms, setActiveRooms] = useState<MKRoomInfo[]>([]);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [netplayStatus, setNetplayStatus] = useState<string>('Готов к сетевой игре');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch active Netplay rooms
  const fetchActiveRooms = async () => {
    try {
      const res = await fetch('/api/mk/rooms');
      if (res.ok) {
        const data = await res.json();
        if (data.rooms) {
          setActiveRooms(data.rooms);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch MK rooms:', e);
    }
  };

  // Poll rooms every 4 seconds in netplay mode
  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load saved ROM on mount from IndexedDB
  useEffect(() => {
    async function checkSavedRom() {
      setIsLoadingRom(true);
      try {
        const saved = await loadRomFromIndexedDB();
        if (saved) {
          setRomFile(saved.file);
          setRomInfo({ name: saved.name, size: saved.size });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingRom(false);
      }
    }
    checkSavedRom();
  }, []);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (iframeBlobUrl) {
        URL.revokeObjectURL(iframeBlobUrl);
      }
    };
  }, [iframeBlobUrl]);

  // Handle ROM File Drop / Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setIsLoadingRom(true);
    try {
      // Auto-detect core by extension
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['bin', 'gen', 'smd', 'md'].includes(ext)) {
        setCore('segaMD');
      } else if (['iso', 'cue', 'chd', 'pbp'].includes(ext)) {
        setCore('psx');
      } else if (['sfc', 'smc'].includes(ext)) {
        setCore('snes');
      }

      await saveRomToIndexedDB(file);
      setRomFile(file);
      setRomInfo({ name: file.name, size: file.size });
      setIsEmulatorRunning(false);
      playMKGongSound();
    } catch (err) {
      console.error('Failed to save ROM:', err);
    } finally {
      setIsLoadingRom(false);
    }
  };

  const handleClearRom = async () => {
    await clearRomFromIndexedDB();
    setRomFile(null);
    setRomInfo(null);
    setIsEmulatorRunning(false);
    if (iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
      setIframeBlobUrl(null);
    }
  };

  // Create / Register Netplay Room on Server
  const registerRoomOnServer = async () => {
    if (!currentUser) return;
    try {
      setIsCreatingRoom(true);
      await fetch('/api/mk/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          title: `Турнир: ${currentUser.name} vs Соперник`,
          core,
          romName: romInfo?.name || 'Mortal Kombat',
          hostParticipantId: currentUser.id,
          hostName: currentUser.name,
          hostNickname: currentUser.nickname || currentUser.name,
          hostAvatar: getParticipantAvatar(currentUser)
        })
      });
      fetchActiveRooms();
    } catch (err) {
      console.error('Failed to register room on server:', err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Join existing room
  const handleJoinExistingRoom = async (room: MKRoomInfo) => {
    setRoomCode(room.code);
    setPlayerRole(2);
    setPlayMode('netplay');
    if (room.core && ['segaMD', 'psx', 'snes', 'arcade'].includes(room.core)) {
      setCore(room.core as MKConsoleCore);
    }

    if (currentUser) {
      try {
        await fetch(`/api/mk/rooms/${room.code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentUser.id,
            name: currentUser.name,
            nickname: currentUser.nickname || currentUser.name,
            avatar: getParticipantAvatar(currentUser)
          })
        });
        fetchActiveRooms();
      } catch (err) {
        console.error('Failed to join room on server:', err);
      }
    }

    // If ROM is already loaded, start emulator right away
    if (romFile) {
      launchEmulatorWithNetplay(room.code, 2);
    } else {
      setNetplayStatus(`Подключено к комнате ${room.code}! Загрузите ROM игры для старта.`);
    }
  };

  // Launch Emulator via sandboxed iframe with EmulatorJS + Netplay
  const launchEmulator = () => {
    if (!romFile) return;
    if (playMode === 'netplay') {
      launchEmulatorWithNetplay(roomCode, playerRole);
    } else {
      launchEmulatorSingle();
    }
  };

  const launchEmulatorWithNetplay = (currentRoom: string, role: 1 | 2) => {
    if (!romFile) return;

    if (iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
    }

    // Register room on server if player is host
    if (role === 1) {
      registerRoomOnServer();
    }

    const romBlobUrl = URL.createObjectURL(romFile);

    // Build self-contained HTML payload for EmulatorJS with WebRTC Netplay enabled
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MK Tournament P2P Netplay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #050505; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #game { width: 100%; height: 100%; }
    .overlay-netplay-bar {
      position: absolute; top: 8px; left: 8px; right: 8px; z-index: 9999;
      background: rgba(10, 10, 12, 0.88); border: 1px solid rgba(220, 38, 38, 0.4);
      color: #fff; padding: 6px 12px; border-radius: 10px;
      display: flex; align-items: center; justify-content: space-between;
      backdrop-filter: blur(8px); pointer-events: auto;
      font-size: 11px;
    }
    .badge {
      background: #dc2626; color: #fff; font-weight: 800; font-size: 10px;
      padding: 2px 6px; border-radius: 6px; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .room-tag {
      color: #fbbf24; font-weight: 700; font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="overlay-netplay-bar">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span class="badge">P2P Сеть</span>
      <span>Комната: <span class="room-tag">${currentRoom}</span></span>
      <span style="color: #9ca3af;">•</span>
      <span style="color: ${role === 1 ? '#38bdf8' : '#34d399'}; font-weight: 700;">
        ${role === 1 ? 'Игрок 1 (Хост)' : 'Игрок 2 (Челленджер)'}
      </span>
    </div>
    <div style="font-size: 10px; color: #9ca3af;">
      Netplay синхронизация активна ⚡
    </div>
  </div>
  <div id="game"></div>

  <script>
    window.EJS_player = '#game';
    window.EJS_core = '${core}';
    window.EJS_gameUrl = '${romBlobUrl}';
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    
    // Netplay Configuration (P2P WebRTC input sync)
    window.EJS_netplayUrl = 'wss://netplay.emulatorjs.org';
    window.EJS_netplayRoom = '${currentRoom}';
    window.EJS_defaultOptions = {
      'gamepad-touch': true, // Mobile virtual gamepad
      'netplay-enabled': true, // Enable Netplay UI and protocol
      'netplay-server': 'default',
      'volume': 1,
      'fullscreenOnStart': false
    };
  </script>
  <script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeBlobUrl(url);
    setIsEmulatorRunning(true);
    playMKGongSound();
  };

  const launchEmulatorSingle = () => {
    if (!romFile) return;

    if (iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
    }

    const romBlobUrl = URL.createObjectURL(romFile);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MK Emulator Single Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    #game { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script>
    window.EJS_player = '#game';
    window.EJS_core = '${core}';
    window.EJS_gameUrl = '${romBlobUrl}';
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_defaultOptions = {
      'gamepad-touch': true,
      'volume': 1,
      'fullscreenOnStart': false
    };
  </script>
  <script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeBlobUrl(url);
    setIsEmulatorRunning(true);
    playMKGongSound();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mk_room', roomCode);
    url.searchParams.set('mk_role', '2');
    navigator.clipboard.writeText(url.toString());
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const stopEmulator = () => {
    setIsEmulatorRunning(false);
    if (iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
      setIframeBlobUrl(null);
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      
      {/* HEADER CONTROLS BAR */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Play mode tab selector: Single vs P2P Netplay */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => {
              setPlayMode('netplay');
              if (isEmulatorRunning) stopEmulator();
            }}
            className={`px-3 py-1.5 rounded-lg font-black uppercase text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              playMode === 'netplay'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Globe size={13} className="text-amber-300" />
            <span>Сетевой P2P Netplay (2 экрана)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPlayMode('single');
              if (isEmulatorRunning) stopEmulator();
            }}
            className={`px-3 py-1.5 rounded-lg font-black uppercase text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              playMode === 'single'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={13} />
            <span>Одиночная игра / Тренировка</span>
          </button>
        </div>

        {/* Emulator Options: Platform Core & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Платформа:</span>
            <select
              value={core}
              onChange={(e) => setCore(e.target.value as MKConsoleCore)}
              disabled={isEmulatorRunning}
              className="bg-transparent text-amber-400 font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="segaMD" className="bg-stone-900 text-white">Sega Mega Drive (UMK3)</option>
              <option value="psx" className="bg-stone-900 text-white">PlayStation 1 (MK Trilogy/MK4)</option>
              <option value="snes" className="bg-stone-900 text-white">SNES (MK2/MK3)</option>
              <option value="arcade" className="bg-stone-900 text-white">Arcade MAME (MK Классика)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 transition-colors cursor-pointer"
            title="Во весь экран"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* P2P NETPLAY LOBBY & ROOM CONFIGURATION PANEL */}
      {playMode === 'netplay' && !isEmulatorRunning && (
        <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border-2 border-red-900/60 rounded-2xl p-4 md:p-6 shadow-xl space-y-5 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Radio size={11} className="animate-pulse text-red-400" />
                  P2P WebRTC Netplay
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-400 uppercase">
                  Сетевая дуэль на разных экранах
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                Каждый участник управляет со своего смартфона или ноутбука. Видеопоток не передается по сети — устройства синхронизируют нажатия клавиш на 60 FPS через WebRTC DataChannel.
              </p>
            </div>

            {/* Room Code & Quick Share Buttons */}
            <div className="bg-stone-900 border border-stone-700 p-2.5 rounded-xl flex items-center gap-2">
              <div className="text-right pr-1">
                <div className="text-[10px] text-stone-400 uppercase font-bold">Код комнаты:</div>
                <div className="text-sm font-black font-mono text-amber-400">{roomCode}</div>
              </div>

              <button
                type="button"
                onClick={copyRoomCode}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-stone-700"
                title="Скопировать код"
              >
                {isCopiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{isCopiedCode ? 'Скопировано!' : 'Код'}</span>
              </button>

              <button
                type="button"
                onClick={copyRoomLink}
                className="px-2.5 py-1.5 bg-red-800/60 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-red-700"
                title="Скопировать прямую ссылку для Игрока 2"
              >
                {isCopiedLink ? <Check size={13} className="text-green-400" /> : <Users size={13} />}
                <span>{isCopiedLink ? 'Ссылка скопирована!' : 'Ссылка для Игрока 2'}</span>
              </button>
            </div>
          </div>

          {/* NETPLAY ROLE & SETTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Host or Challenger Choice */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-black uppercase text-stone-300 flex items-center gap-1.5">
                <Users size={14} className="text-amber-400" />
                <span>Выберите вашу роль в матче:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlayerRole(1)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    playerRole === 1
                      ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase text-blue-400">Игрок 1</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">ХОСТ</span>
                  </div>
                  <div className="text-xs text-stone-300 font-medium">Создает комнату</div>
                  <div className="text-[10px] text-stone-500 mt-1">Персонаж слева</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlayerRole(2)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    playerRole === 2
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase text-emerald-400">Игрок 2</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">ГОСТЬ</span>
                  </div>
                  <div className="text-xs text-stone-300 font-medium">Подключается</div>
                  <div className="text-[10px] text-stone-500 mt-1">Персонаж справа</div>
                </button>
              </div>

              <div className="pt-2">
                <label className="text-[11px] text-stone-400 font-medium block mb-1">
                  Название комнаты (можно ввести свой код):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().trim())}
                    placeholder="Например: MK-777"
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-hidden focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRoomCode('MK-' + Math.floor(100 + Math.random() * 900))}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold border border-stone-700 cursor-pointer"
                  >
                    Случайный код
                  </button>
                </div>
              </div>
            </div>

            {/* Active Rooms in Camp */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase text-stone-300 flex items-center gap-1.5">
                  <Radio size={14} className="text-red-400" />
                  <span>Активные комнаты в лагере:</span>
                </div>
                <button
                  type="button"
                  onClick={fetchActiveRooms}
                  className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Обновить</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeRooms.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-900/50 border border-dashed border-stone-800 text-center text-xs text-stone-500">
                    Нет активных комнат. Будьте первым, создав комнату!
                  </div>
                ) : (
                  activeRooms.map((r) => {
                    const isMyRoom = r.code === roomCode;
                    return (
                      <div
                        key={r.code}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          isMyRoom 
                            ? 'bg-red-950/30 border-red-500/50 text-white'
                            : 'bg-stone-900/70 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-black text-[11px] text-amber-400 shrink-0">
                            {r.hostAvatar ? (
                              <img src={r.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              '🐉'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-white flex items-center gap-1.5">
                              <span>{r.hostName}</span>
                              <span className="font-mono text-[11px] text-amber-400 font-black">[{r.code}]</span>
                            </div>
                            <div className="text-[10px] text-stone-400 truncate">
                              {r.status === 'waiting' ? '🟡 Ждёт соперника #2' : '⚔️ Идёт поединок'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJoinExistingRoom(r)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>Войти Игроком 2</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* HOW P2P NETPLAY WORKS INFO */}
          <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-xl flex items-start gap-3 text-xs text-stone-300">
            <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white">Инструкция для проведения сетевого матча:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-stone-400">
                <li>Оба игрока выбирают один и тот же ROM (например, Sega UMK3) на своих устройствах.</li>
                <li>Игрок 1 запускает игру как <b>«Игрок 1 (Хост)»</b> с кодом комнаты (например, <span className="font-mono text-amber-300">{roomCode}</span>).</li>
                <li>Игрок 2 на своём смартфоне жмёт <b>«Войти Игроком 2»</b> или вводит этот же код.</li>
                <li>Эмулятор соединяет устройства напрямую через WebRTC — каждый играет со своего экрана!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ROM UPLOAD / SELECTION CARD */}
      {!isEmulatorRunning && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-400 uppercase flex items-center gap-2">
                <span>🎮 Загрузка ROM Mortal Kombat</span>
                {romFile && (
                  <span className="text-xs bg-green-900/60 text-green-300 border border-green-700/60 font-bold px-2 py-0.5 rounded-full">
                    ROM готов к запуску
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Поддерживаются файлы .bin, .gen, .smd, .iso, .cue, .zip для UMK3, MK Trilogy, MK2
              </p>
            </div>

            {/* Clear Saved ROM Button */}
            {romFile && (
              <button
                type="button"
                onClick={handleClearRom}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
              >
                <Trash2 size={13} />
                <span>Сменить / Удалить ROM</span>
              </button>
            )}
          </div>

          {/* Active ROM info or Drop Zone */}
          {romFile ? (
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-2 border-amber-500/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner">
                  🐉
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Текущая игра в памяти
                  </div>
                  <div className="text-sm sm:text-base font-black text-white">
                    {romInfo?.name}
                  </div>
                  <div className="text-xs text-stone-400">
                    Размер: {(romInfo?.size ? (romInfo.size / (1024 * 1024)).toFixed(2) : 0)} МБ • Платформа: {core}
                  </div>
                </div>
              </div>

              {/* Big Launch Button */}
              <button
                type="button"
                onClick={launchEmulator}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlayCircle size={18} />
                <span>
                  {playMode === 'netplay' 
                    ? `Запустить Netplay (${playerRole === 1 ? 'Игрок 1' : 'Игрок 2'})` 
                    : 'Запустить бой'}
                </span>
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-700 hover:border-amber-400 rounded-2xl p-8 text-center bg-stone-950/60 hover:bg-stone-950 transition-all cursor-pointer space-y-3 group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".bin,.gen,.smd,.md,.iso,.cue,.chd,.pbp,.sfc,.smc,.zip" 
                className="hidden" 
              />
              <div className="w-12 h-12 rounded-full bg-stone-800 group-hover:bg-amber-500 text-stone-300 group-hover:text-stone-950 flex items-center justify-center mx-auto transition-colors">
                <Upload size={22} />
              </div>
              <div>
                <div className="font-bold text-stone-200 text-sm group-hover:text-amber-400 transition-colors">
                  Нажмите для выбора файла ROM игры или перетащите его сюда
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Файл сохранится в вашем браузере (IndexedDB) и не потребует повторной загрузки
                </div>
              </div>
            </div>
          )}

          {/* Quick Controls Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-start gap-2.5">
              <Smartphone size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-stone-300">На смартфонах</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Сенсорный экран: виртуальный джойстик и кнопки ударов появляются автоматически.
                </div>
              </div>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-start gap-2.5">
              <Monitor size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-stone-300">На клавиатуре ПК</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Стрелки — движение. Z, X, C — удары руками. A, S, D — ноги/блок. Enter — Start.
                </div>
              </div>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-start gap-2.5">
              <Gamepad2 size={16} className="text-green-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-stone-300">Геймпады</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Любой Bluetooth или USB геймпад (PS, Xbox, 8BitDo) распознается автоматически!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE EMULATOR DISPLAY */}
      {isEmulatorRunning && iframeBlobUrl && (
        <div className="bg-black border-2 border-red-900/80 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Top In-Game Bar */}
          <div className="bg-stone-950 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <span>🐉 {romInfo?.name || 'Mortal Kombat'}</span>
              </span>

              {playMode === 'netplay' && (
                <span className="bg-red-900/60 border border-red-700/60 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <span>Комната: {roomCode}</span>
                  <span>•</span>
                  <span className="text-amber-300">
                    {playerRole === 1 ? 'Игрок 1 (Хост)' : 'Игрок 2 (Челленджер)'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                <Maximize2 size={12} />
                <span>Во весь экран</span>
              </button>

              <button
                type="button"
                onClick={stopEmulator}
                className="px-2.5 py-1 bg-red-900/80 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                <LogOut size={12} />
                <span>Выйти из боя</span>
              </button>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="w-full h-[540px] sm:h-[620px] bg-black">
            <iframe
              src={iframeBlobUrl}
              title="Mortal Kombat Emulator"
              className="w-full h-full border-0"
              allow="autoplay; gamepad; fullscreen; cross-origin-isolated"
            />
          </div>
        </div>
      )}

    </div>
  );
}
