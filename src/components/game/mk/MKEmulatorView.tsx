import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Play, Trash2, Maximize2, Minimize2, RefreshCw, 
  Gamepad2, Volume2, VolumeX, Sparkles, Shield, 
  Flame, HelpCircle, Smartphone, Monitor, Info,
  Users, Globe, Copy, Check, ArrowRight, UserCheck,
  AlertCircle, Radio, PlayCircle, LogOut, RotateCcw
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
  const [isBuiltinRom, setIsBuiltinRom] = useState(false);
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
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orientation tracking for mobile players
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const onFsChange = () => {
      const isDocFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isDocFs && isFullscreen) {
        // Native fullscreen was exited via Esc/gesture; exit CSS mode as well
        const hasNativeFs = !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);
        if (hasNativeFs) {
          setIsFullscreen(false);
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  // Prevent background elastic bounce/scrolling on smartphones while in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const preventBgTouch = (e: TouchEvent) => {
      // Don't scroll parent window when interacting with emulator
      if (e.target && (e.target as HTMLElement).tagName !== 'IFRAME') {
        e.preventDefault();
      }
    };
    window.addEventListener('touchmove', preventBgTouch, { passive: false });
    return () => {
      window.removeEventListener('touchmove', preventBgTouch);
    };
  }, [isFullscreen]);

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

  // Load built-in Mortal Kombat ROM from server
  const loadBuiltinMortalKombatRom = async () => {
    setIsLoadingRom(true);
    try {
      let response = await fetch('/api/mk/default-rom');
      if (!response.ok) {
        response = await fetch('/roms/mortal_kombat_3.bin');
      }
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'Ultimate_Mortal_Kombat_3.bin', { type: 'application/octet-stream' });
        setRomFile(file);
        setRomInfo({ name: 'Ultimate Mortal Kombat 3 (Sega Mega Drive)', size: file.size });
        setCore('segaMD');
        setIsBuiltinRom(true);
        setIsEmulatorRunning(false);
        playMKGongSound();
        return true;
      }
    } catch (err) {
      console.warn('Could not load built-in Mortal Kombat ROM:', err);
    } finally {
      setIsLoadingRom(false);
    }
    return false;
  };

  // Load saved ROM on mount from IndexedDB, or fallback to built-in MK ROM
  useEffect(() => {
    async function checkSavedRom() {
      setIsLoadingRom(true);
      try {
        const saved = await loadRomFromIndexedDB();
        if (saved && saved.file) {
          setRomFile(saved.file);
          setRomInfo({ name: saved.name, size: saved.size });
          setIsBuiltinRom(false);
        } else {
          // Pre-load Mortal Kombat into the system automatically!
          await loadBuiltinMortalKombatRom();
        }
      } catch (e) {
        console.error(e);
        await loadBuiltinMortalKombatRom();
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
      setIsBuiltinRom(false);
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
    setIsBuiltinRom(false);
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>MK Tournament P2P Netplay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background: #000;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      overscroll-behavior: none;
      position: fixed;
      inset: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #game {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .overlay-netplay-bar {
      position: absolute; top: 6px; left: 6px; right: 6px; z-index: 9999;
      background: rgba(10, 10, 12, 0.88); border: 1px solid rgba(220, 38, 38, 0.4);
      color: #fff; padding: 5px 10px; border-radius: 8px;
      display: flex; align-items: center; justify-content: space-between;
      backdrop-filter: blur(8px); pointer-events: none;
      font-size: 11px;
    }
    .overlay-netplay-bar > * { pointer-events: auto; }
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>MK Emulator Single Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background: #000;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      overscroll-behavior: none;
      position: fixed;
      inset: 0;
    }
    #game {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
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

  const requestNativeFullscreen = async (el: HTMLElement) => {
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' });
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Native fullscreen not available or permitted, fallback to CSS fullscreen:', err);
    }
  };

  const exitNativeFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn('Native exit fullscreen note:', err);
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      // If emulator is not running yet, launch it immediately in fullscreen!
      if (!isEmulatorRunning) {
        requestNativeFullscreen(document.documentElement);
        launchEmulator();
        try {
          if ((window.screen as any)?.orientation?.lock) {
            (window.screen as any).orientation.lock('landscape').catch(() => {});
          }
        } catch {}
        return;
      }

      const targetEl = gameContainerRef.current || containerRef.current || document.documentElement;
      if (targetEl) {
        await requestNativeFullscreen(targetEl);
      }

      // Attempt screen orientation lock to landscape on smartphones
      try {
        if ((window.screen as any)?.orientation?.lock) {
          await (window.screen as any).orientation.lock('landscape');
        }
      } catch {
        // Handled silently if not permitted
      }
    } else {
      setIsFullscreen(false);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      await exitNativeFullscreen();
      try {
        (window.screen as any)?.orientation?.unlock?.();
      } catch {}
    }
  };

  const launchEmulatorAndFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Must call requestNativeFullscreen synchronously inside user gesture handler!
    requestNativeFullscreen(document.documentElement);
    launchEmulator();
    try {
      if ((window.screen as any)?.orientation?.lock) {
        (window.screen as any).orientation.lock('landscape').catch(() => {});
      }
    } catch {}
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
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
            title={isFullscreen ? "Свернуть" : "Во весь экран"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">{isFullscreen ? "Свернуть" : "Экран"}</span>
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
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".bin,.gen,.smd,.md,.iso,.cue,.chd,.pbp,.sfc,.smc,.zip" 
            className="hidden" 
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-400 uppercase flex items-center gap-2">
                <span>🎮 Игра Mortal Kombat & Загрузка ROM</span>
                {romFile && (
                  <span className="text-xs bg-green-900/60 text-green-300 border border-green-700/60 font-bold px-2 py-0.5 rounded-full">
                    {isBuiltinRom ? '🔥 Встроенный MK3 готов' : 'Свой ROM готов'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isBuiltinRom 
                  ? 'В систему уже встроен официальный Ultimate Mortal Kombat 3. Вы также можете загрузить любой другой ROM.'
                  : 'Загружен индивидуальный файл ROM. Вы всегда можете вернуться к встроенному Mortal Kombat 3.'}
              </p>
            </div>

            {/* Quick Actions: Restore Built-in or Upload Custom */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadBuiltinMortalKombatRom}
                disabled={isLoadingRom || isBuiltinRom}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isBuiltinRom
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 opacity-70 cursor-default'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-400 border-stone-700'
                }`}
                title="Загрузить встроенный в систему Mortal Kombat 3"
              >
                <span>🔥 Встроенный MK 3</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
                title="Загрузить свой файл ROM с устройства"
              >
                <Upload size={13} />
                <span>Свой ROM файл</span>
              </button>

              {romFile && (
                <button
                  type="button"
                  onClick={handleClearRom}
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-stone-700"
                  title="Очистить память"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
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

              {/* Big Launch Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={launchEmulator}
                  className="flex-1 sm:flex-initial px-5 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PlayCircle size={18} />
                  <span>
                    {playMode === 'netplay' 
                      ? `Старт (${playerRole === 1 ? 'Игрок 1' : 'Игрок 2'})` 
                      : 'Запустить бой'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={launchEmulatorAndFullscreen}
                  className="flex-1 sm:flex-initial px-4 py-3.5 bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md border border-amber-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Запустить сразу во весь экран (рекомендуется для смартфонов)"
                >
                  <Maximize2 size={16} />
                  <span>📱 Во весь экран</span>
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-700 hover:border-amber-400 rounded-2xl p-8 text-center bg-stone-950/60 hover:bg-stone-950 transition-all cursor-pointer space-y-3 group"
            >
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
                  Сенсорный экран: жмите <b>«Во весь экран»</b>, поверните телефон горизонтально — джойстик и кнопки ударов появятся под пальцами.
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
        <div 
          ref={gameContainerRef}
          className={
            isFullscreen
              ? "fixed inset-0 z-[999999] w-full h-[100dvh] bg-black flex flex-col overflow-hidden select-none touch-none overscroll-none"
              : "bg-black border-2 border-red-900/80 rounded-2xl overflow-hidden shadow-2xl relative"
          }
        >
          {/* Top In-Game Bar */}
          <div className={`bg-stone-950/95 border-b border-stone-800 ${isFullscreen ? 'px-3 py-1.5' : 'px-4 py-2.5'} flex items-center justify-between text-xs text-white shrink-0 z-10 backdrop-blur-xs`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
              <span className="font-bold text-amber-400 truncate text-[11px] sm:text-xs">
                🐉 {romInfo?.name || 'Mortal Kombat'}
              </span>

              {playMode === 'netplay' && (
                <span className="bg-red-900/60 border border-red-700/60 text-white font-mono text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                  <span>Комната: {roomCode}</span>
                  <span className="text-amber-300 hidden sm:inline">
                    • {playerRole === 1 ? 'Игрок 1' : 'Игрок 2'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Prominent Fullscreen Toggle (Dual Engine: Native + CSS Viewport) */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-xs transition-all cursor-pointer shadow-md ${
                  isFullscreen
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
                }`}
                title={isFullscreen ? 'Свернуть экран' : 'Развернуть во весь экран (для смартфонов)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 size={15} />
                    <span>Свернуть</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={15} />
                    <span>📱 Во весь экран</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isFullscreen) {
                    toggleFullscreen();
                  }
                  stopEmulator();
                }}
                className="px-2.5 py-1.5 bg-red-900/90 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1 text-xs transition-colors cursor-pointer"
                title="Завершить игру и выйти в меню"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Выйти из боя</span>
              </button>
            </div>
          </div>

          {/* Orientation Recommendation Banner on Mobile */}
          {isFullscreen && isPortrait && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-3 py-1.5 text-[11px] font-black text-center flex items-center justify-center gap-2 shrink-0 shadow-md">
              <RotateCcw size={13} className="animate-spin text-stone-950 shrink-0" />
              <span>Поверните телефон горизонтально для широкого экрана и джойстика!</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if ((window.screen as any)?.orientation?.lock) {
                      await (window.screen as any).orientation.lock('landscape');
                    }
                  } catch {}
                }}
                className="ml-1 px-2 py-0.5 bg-stone-950 text-amber-300 rounded text-[10px] font-black uppercase cursor-pointer"
              >
                Повернуть
              </button>
            </div>
          )}

          {/* Floating Minimize Button for Mobile Quick Exit */}
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="fixed top-2 right-2 z-[9999999] bg-stone-900/85 hover:bg-stone-800 text-amber-400 border border-amber-500/80 rounded-full px-2.5 py-1 shadow-2xl flex items-center gap-1 text-[11px] font-black backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100"
              title="Свернуть экран"
            >
              <Minimize2 size={12} />
              <span>Свернуть</span>
            </button>
          )}

          {/* Iframe Viewport */}
          <div className={`w-full bg-black ${isFullscreen ? 'flex-1 h-full min-h-0' : 'h-[480px] sm:h-[620px]'}`}>
            <iframe
              src={iframeBlobUrl}
              title="Mortal Kombat Emulator"
              className="w-full h-full border-0 touch-none"
              allow="autoplay; gamepad; fullscreen; screen-wake-lock; cross-origin-isolated"
              allowFullScreen={true}
            />
          </div>
        </div>
      )}

    </div>
  );
}
