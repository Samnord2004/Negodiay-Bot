import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, VolumeX, History, HelpCircle, RefreshCw, 
  Flame, UserPlus, Eye, EyeOff, Search, Trophy, Shield, Sparkles,
  Wifi, Users, Bot, Zap, ArrowRight, Play, CheckCircle2,
  Maximize2, Minimize2, RotateCw, X, ArrowLeft
} from 'lucide-react';
import { Participant, RallyCoin } from '../../../types';
import { 
  Card, GameStage, HandEvaluation, HandHistoryRecord, 
  PlayerAction, PokerPlayer, PokerPlayMode, PokerRoomPublicState 
} from '../../../types/poker';
import { 
  createDeck, shuffleDeck, evaluateHoldemHand 
} from '../../../utils/pokerEvaluator';
import { 
  playCardDealSound, playChipSound, playFoldSound, 
  playCheckSound, playWinSound, playBluffSound 
} from '../../../utils/pokerSounds';
import PokerCard from './PokerCard';
import PokerSeat from './PokerSeat';
import { getParticipantAvatar } from '../../../utils/avatar';

interface PokerTableProps {
  participants: Participant[];
  coins: RallyCoin[];
  currentUser: Participant | null;
  isCaptain: boolean;
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune' | 'poker';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
  onDeleteCoin?: (coinId: string) => Promise<void> | void;
  onUpdateCoins?: (coins: RallyCoin[]) => void;
  isDedicatedWindow?: boolean;
  onCloseDedicatedWindow?: () => void;
}

const BLUFF_REPLIES = [
  'У меня готовый натс! 🔥',
  'Слабо ответить на мой рейз? 😏',
  'Чистый блеф, клянусь костром! ⛺',
  'Я иду до конца! 🚀',
  'Проверяй, если не боишься! 🤠',
  'Карты сами идут в руки! ✨',
  'Капитан никогда не сбрасывает! 👑',
  'Покерная интуиция не подводит! ♠️',
  'Мои монеты останутся со мной! 🪙'
];

// Predefined fun bots for Training Mode
const TRAINING_BOTS = [
  { id: 'bot_horek', name: 'Хорёк', nickname: 'Алко-турист', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', personality: 'bluffer' },
  { id: 'bot_cowboy', name: 'Ковбой', nickname: 'Анархист', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', personality: 'aggressive' },
  { id: 'bot_maximka', name: 'Максимка', nickname: 'Душнила', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80', personality: 'tight' },
  { id: 'bot_chef', name: 'Шеф-Повар', nickname: 'Пловмейкер', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80', personality: 'balanced' },
  { id: 'bot_guitarist', name: 'Гитарист', nickname: 'КиШ-Фан', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', personality: 'loose' },
];

export default function PokerTable({
  participants,
  coins,
  currentUser,
  isCaptain,
  onAwardCoin,
  onDeleteCoin,
  onUpdateCoins,
  isDedicatedWindow = false,
  onCloseDedicatedWindow
}: PokerTableProps) {
  // Game Mode: 'multiplayer' (online via WebSockets) or 'training' (singleplayer vs bots)
  const [mode, setMode] = useState<PokerPlayMode>('multiplayer');

  // Dedicated Window & Mobile Landscape State
  const [isWindowExpanded, setIsWindowExpanded] = useState<boolean>(false);
  const [forceMobileLandscape, setForceMobileLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 850 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      return isMobile && isPortrait;
    }
    return false;
  });
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.innerWidth > window.innerHeight;
    return false;
  });
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 850 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }
    return false;
  });

  const isDedicatedActive = isDedicatedWindow || isWindowExpanded;

  useEffect(() => {
    try {
      (screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
    } catch (e) {}

    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      setIsMobileDevice(window.innerWidth < 850 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      if (landscape) {
        setForceMobileLandscape(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleCloseDedicatedWindow = () => {
    if (onCloseDedicatedWindow) {
      onCloseDedicatedWindow();
    }
    setIsWindowExpanded(false);
    setForceMobileLandscape(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleToggleDedicatedWindow = () => {
    setIsWindowExpanded(prev => !prev);
  };

  const handleToggleMobileLandscape = async () => {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (e) {}
    setForceMobileLandscape(prev => !prev);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      try {
        (screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
      } catch (e) {}
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Audio & Modals
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBluffPicker, setShowBluffPicker] = useState(false);
  const [showAllCardsOpen, setShowAllCardsOpen] = useState(false);
  const [seatTargetIndex, setSeatTargetIndex] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Multiplayer Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);

  // Common Table State
  const [seats, setSeats] = useState<(PokerPlayer | null)[]>([null, null, null, null, null, null]);
  const [peekedSeats, setPeekedSeats] = useState<Record<number, boolean>>({});
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const deckRef = useRef<Card[]>([]);
  const [gameStage, setGameStage] = useState<GameStage>('waiting');
  const [pot, setPot] = useState<number>(0);
  const [currentBetToCall, setCurrentBetToCall] = useState<number>(0);
  const [activeTurnSeat, setActiveTurnSeat] = useState<number>(-1);
  const [dealerSeat, setDealerSeat] = useState<number>(0);
  const [handCount, setHandCount] = useState<number>(1);
  const [handWinners, setHandWinners] = useState<{ player: PokerPlayer; evaluation: HandEvaluation; wonAmount: number }[]>([]);
  const [handHistory, setHandHistory] = useState<HandHistoryRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Подключение к покерному столу...');
  const [raiseAmount, setRaiseAmount] = useState<number>(2);

  // Training Mode Virtual Chips
  const [trainingChips, setTrainingChips] = useState<Record<string, number>>({});

  const activeUser = currentUser || participants[0];

  const triggerSound = useCallback((fn: () => void) => {
    if (soundEnabled) {
      fn();
    }
  }, [soundEnabled]);

  // =========================================================================
  // MULTIPLAYER WEBSOCKET INTEGRATION
  // =========================================================================
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/poker`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Authenticate with current user profile
        if (activeUser) {
          ws.send(JSON.stringify({
            type: 'auth',
            participant: activeUser
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync_state' && data.state) {
            const state: PokerRoomPublicState = data.state;
            setSeats(state.seats);
            setCommunityCards(state.communityCards || []);
            setGameStage(state.gameStage);
            setPot(state.pot);
            setCurrentBetToCall(state.currentBetToCall);
            setActiveTurnSeat(state.activeTurnSeat);
            setDealerSeat(state.dealerSeat);
            setHandCount(state.handCount);
            setHandWinners(state.handWinners || []);
            setHandHistory(state.handHistory || []);
            setStatusMessage(state.statusMessage || '');
            if (typeof state.onlineCount === 'number') {
              setOnlineCount(state.onlineCount);
            }
          } else if (data.type === 'sound') {
            if (data.sound === 'deal') triggerSound(playCardDealSound);
            else if (data.sound === 'chip') triggerSound(playChipSound);
            else if (data.sound === 'fold') triggerSound(playFoldSound);
            else if (data.sound === 'check') triggerSound(playCheckSound);
            else if (data.sound === 'win') triggerSound(playWinSound);
            else if (data.sound === 'bluff') triggerSound(playBluffSound);
          } else if (data.type === 'chat_bluff') {
            triggerSound(playBluffSound);
          }
        } catch (err) {
          console.error('[Poker WS Client] Error reading message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        console.warn('[Poker WS Client] Connection error:', err);
        setIsConnected(false);
      };
    } catch (e) {
      console.error('[Poker WS Client] Init error:', e);
    }
  }, [activeUser, triggerSound]);

  // Connect or disconnect when switching mode
  useEffect(() => {
    if (mode === 'multiplayer') {
      connectWebSocket();
      const interval = setInterval(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }, 5000);
      return () => {
        clearInterval(interval);
        wsRef.current?.close();
      };
    } else {
      // Training mode: close socket
      wsRef.current?.close();
      setIsConnected(false);
      initTrainingMode();
    }
  }, [mode, connectWebSocket]);

  // Send message to server in Multiplayer Mode
  const sendWsMessage = (msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  // =========================================================================
  // TRAINING MODE: OFFLINE BOT ENGINE
  // =========================================================================
  const initTrainingMode = () => {
    const defaultChips: Record<string, number> = {
      [activeUser?.id || 'me']: 100
    };
    TRAINING_BOTS.forEach(b => {
      defaultChips[b.id] = 100;
    });
    setTrainingChips(defaultChips);

    // Setup 4 seats: user at seat 0, 3 bots
    const newSeats: (PokerPlayer | null)[] = [
      {
        id: activeUser?.id || 'me',
        participantId: activeUser?.id || 'me',
        name: activeUser?.name || 'Вы (Капитан)',
        nickname: activeUser?.nickname || 'Вы',
        avatar: activeUser ? getParticipantAvatar(activeUser) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        isUser: true,
        seatIndex: 0,
        chips: 100,
        currentRoundBet: 0,
        totalHandBet: 0,
        cards: [],
        folded: false,
        isAllIn: false,
        isSittingOut: false
      },
      ...TRAINING_BOTS.slice(0, 3).map((bot, i) => ({
        id: bot.id,
        participantId: bot.id,
        name: bot.name,
        nickname: bot.nickname,
        avatar: bot.avatar,
        isUser: false,
        seatIndex: i + 1,
        chips: 100,
        currentRoundBet: 0,
        totalHandBet: 0,
        cards: [],
        folded: false,
        isAllIn: false,
        isSittingOut: false,
        personality: bot.personality as any
      })),
      null,
      null
    ];

    setSeats(newSeats);
    setCommunityCards([]);
    setPot(0);
    setCurrentBetToCall(0);
    setActiveTurnSeat(-1);
    setGameStage('waiting');
    setStatusMessage('Режим одиночной тренировки! Нажмите «Начать раздачу» для игры с ботами.');
  };

  // Start hand in Training Mode
  const startTrainingHand = () => {
    const active = seats.filter((s): s is PokerPlayer => s !== null && s.chips > 0);
    if (active.length < 2) {
      initTrainingMode();
      return;
    }

    const newDeck = shuffleDeck(createDeck());
    let deckIdx = 0;
    const sb = 1;
    const bb = 2;

    const nextDealer = (dealerSeat + 1) % 6;
    setDealerSeat(nextDealer);

    let initialPot = 0;
    const updatedSeats = seats.map((p, idx) => {
      if (!p || p.chips <= 0) return p;
      const c1 = newDeck[deckIdx++];
      const c2 = newDeck[deckIdx++];
      let blind = 0;
      let text = '';
      if (idx === 1) {
        blind = Math.min(sb, p.chips);
        text = `Мал. блайнд (${blind} 🎯)`;
      } else if (idx === 2) {
        blind = Math.min(bb, p.chips);
        text = `Бол. блайнд (${blind} 🎯)`;
      }
      initialPot += blind;
      return {
        ...p,
        cards: [c1, c2],
        folded: false,
        isAllIn: p.chips - blind === 0,
        chips: p.chips - blind,
        currentRoundBet: blind,
        totalHandBet: blind,
        lastAction: text ? { type: 'bet' as PlayerAction, amount: blind, text } : undefined,
        speechBubble: undefined
      };
    });

    const remainingDeck = newDeck.slice(deckIdx);
    deckRef.current = remainingDeck;
    setDeck(remainingDeck);
    setCommunityCards([]);
    setSeats(updatedSeats);
    setPot(initialPot);
    setCurrentBetToCall(bb);
    setGameStage('preflop');
    setHandWinners([]);
    setActiveTurnSeat(0); // User starts preflop action
    setStatusMessage(`Раздача #${handCount}! Тренировочный банк: ${initialPot} 🎯. Ваш ход!`);
    triggerSound(playCardDealSound);
  };

  // Fast forward remaining hand in Training Mode straight to Showdown
  const handleFastForwardHand = useCallback(() => {
    if (mode !== 'training') return;
    if (gameStage === 'waiting' || gameStage === 'showdown') return;

    const active = seats.filter((p): p is PokerPlayer => p !== null && !p.folded);
    if (active.length === 0) return;

    if (active.length === 1) {
      const winner = active[0];
      setSeats(prev => prev.map(p => p?.id === winner.id ? { ...p, chips: p.chips + pot, currentRoundBet: 0 } : p));
      setGameStage('showdown');
      setActiveTurnSeat(-1);
      triggerSound(playWinSound);
      setStatusMessage(`🏆 ${winner.name} побеждает (все остальные спасовали)! Банк: ${pot} 🎯`);
      return;
    }

    const currentDeck = [...deckRef.current];
    let finalCards = [...communityCards];
    while (finalCards.length < 5 && currentDeck.length > 0) {
      finalCards.push(currentDeck.shift()!);
    }
    deckRef.current = currentDeck;
    setDeck(currentDeck);
    setCommunityCards(finalCards);
    setGameStage('showdown');
    setActiveTurnSeat(-1);

    const evaluated = active.map(p => ({
      player: p,
      evaluation: evaluateHoldemHand(p.cards, finalCards)
    }));
    evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score);
    const winner = evaluated[0];
    setSeats(prev => prev.map(p => p?.id === winner.player.id ? { ...p, chips: p.chips + pot, currentRoundBet: 0 } : p));
    triggerSound(playWinSound);
    setStatusMessage(`🏆 Победитель: ${winner.player.name} (${winner.evaluation.description})! Банк: ${pot} 🎯`);
    setHandHistory(prev => [{
      id: 'train_' + Date.now(),
      handNumber: handCount,
      winnerNames: [winner.player.name],
      potAmount: pot,
      winningHandDescription: winner.evaluation.description,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isCoinHand: false
    }, ...prev]);
    setHandCount(c => c + 1);
  }, [mode, gameStage, seats, pot, communityCards, handCount, triggerSound]);

  // Bot logic runner in Training Mode
  useEffect(() => {
    if (mode !== 'training') return;
    if (gameStage === 'waiting' || gameStage === 'showdown') return;
    if (activeTurnSeat === -1) return;

    const currentPlayer = seats[activeTurnSeat];
    if (!currentPlayer || currentPlayer.folded || currentPlayer.isAllIn) {
      // Current active seat cannot act (is folded, all-in or empty) - auto advance to next seat!
      advanceTrainingTurn(seats, activeTurnSeat);
      return;
    }

    if (currentPlayer.isUser || (activeUser && currentPlayer.participantId === activeUser.id)) {
      // User turn, wait for user
      return;
    }

    // It is a bot's turn!
    // If user has folded, make bot turns faster (280ms) so user is never blocked or waiting long!
    const userIsFolded = seats.some(p => p && (p.isUser || (activeUser && p.participantId === activeUser.id)) && p.folded);
    const delay = userIsFolded ? 280 : 750;

    const timer = setTimeout(() => {
      executeBotTurn(currentPlayer);
    }, delay);

    return () => clearTimeout(timer);
  }, [mode, activeTurnSeat, gameStage, seats, activeUser]);

  const executeBotTurn = (bot: PokerPlayer) => {
    const callDiff = currentBetToCall - bot.currentRoundBet;
    const rand = Math.random();

    // Occasional fun remark without in-place mutation
    if (rand < 0.25) {
      const phrase = BLUFF_REPLIES[Math.floor(Math.random() * BLUFF_REPLIES.length)];
      setSeats(prev => prev.map((p, idx) => idx === bot.seatIndex && p ? { ...p, speechBubble: phrase } : p));
      triggerSound(playBluffSound);
      setTimeout(() => {
        setSeats(prev => prev.map((p, idx) => idx === bot.seatIndex && p ? { ...p, speechBubble: undefined } : p));
      }, 2500);
    }

    if (callDiff === 0) {
      // Free check or small bet
      if (rand < 0.2 && bot.chips >= 2) {
        handlePlayerActionInternal(bot.seatIndex, 'raise', currentBetToCall + 2);
      } else {
        handlePlayerActionInternal(bot.seatIndex, 'check');
      }
    } else {
      // Facing a bet
      if (rand < 0.15 && callDiff > 4) {
        handlePlayerActionInternal(bot.seatIndex, 'fold');
      } else if (rand < 0.25 && bot.chips > callDiff + 2) {
        handlePlayerActionInternal(bot.seatIndex, 'raise', currentBetToCall + 2);
      } else {
        handlePlayerActionInternal(bot.seatIndex, 'call');
      }
    }
  };

  // Internal Action Handler for Training Mode
  const handlePlayerActionInternal = (seatIdx: number, action: PlayerAction, customRaiseAmount?: number) => {
    const player = seats[seatIdx];
    if (!player || player.folded) return;

    let newChips = player.chips;
    let newBet = player.currentRoundBet;
    let actionText = '';
    let addedToPot = 0;
    const callDiff = currentBetToCall - player.currentRoundBet;

    switch (action) {
      case 'fold':
        actionText = 'Пас';
        triggerSound(playFoldSound);
        break;
      case 'check':
        actionText = 'Чек';
        triggerSound(playCheckSound);
        break;
      case 'call': {
        const pay = Math.min(callDiff, player.chips);
        newChips -= pay;
        newBet += pay;
        addedToPot = pay;
        actionText = pay === player.chips ? `Колл Ва-банк (${pay} 🎯)` : `Колл (${pay} 🎯)`;
        triggerSound(playChipSound);
        break;
      }
      case 'raise':
      case 'bet': {
        const target = customRaiseAmount || (currentBetToCall + raiseAmount);
        const toAdd = target - player.currentRoundBet;
        const actualAdd = Math.min(toAdd, player.chips);
        newChips -= actualAdd;
        newBet += actualAdd;
        addedToPot = actualAdd;
        setCurrentBetToCall(newBet);
        actionText = actualAdd === player.chips ? `Ва-банк (${newBet} 🎯)` : `Рейз (${newBet} 🎯)`;
        triggerSound(playChipSound);
        break;
      }
      case 'all_in': {
        const allInAdd = player.chips;
        newChips = 0;
        newBet += allInAdd;
        addedToPot = allInAdd;
        if (newBet > currentBetToCall) {
          setCurrentBetToCall(newBet);
        }
        actionText = `Ва-банк (${newBet} 🎯)!`;
        triggerSound(playChipSound);
        break;
      }
    }

    const updated = seats.map((p, idx) => {
      if (idx !== seatIdx || !p) return p;
      return {
        ...p,
        chips: newChips,
        currentRoundBet: newBet,
        totalHandBet: p.totalHandBet + addedToPot,
        folded: action === 'fold' ? true : p.folded,
        isAllIn: newChips === 0,
        lastAction: { type: action, amount: newBet, text: actionText }
      };
    });

    const newPot = pot + addedToPot;
    setSeats(updated);
    setPot(newPot);
    advanceTrainingTurn(updated, seatIdx, newPot);
  };

  const advanceTrainingTurn = (currentSeats: (PokerPlayer | null)[], actingSeatIdx?: number, currentPotAmount?: number) => {
    const livePot = currentPotAmount !== undefined ? currentPotAmount : pot;
    const active = currentSeats.filter((p): p is PokerPlayer => p !== null && !p.folded);

    // If only 1 player remains unfolded -> immediate win!
    if (active.length <= 1) {
      if (active.length === 1) {
        const winner = active[0];
        setSeats(currentSeats.map(p => p?.id === winner.id ? { ...p, chips: p.chips + livePot, currentRoundBet: 0 } : p));
        setGameStage('showdown');
        setActiveTurnSeat(-1);
        triggerSound(playWinSound);
        setStatusMessage(`🏆 ${winner.name} побеждает (все остальные спасовали)! Банк: ${livePot} 🎯`);
        setHandHistory(prev => [{
          id: 'train_' + Date.now(),
          handNumber: handCount,
          winnerNames: [winner.name],
          potAmount: livePot,
          winningHandDescription: 'Все спасовали',
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          isCoinHand: false
        }, ...prev]);
        setHandCount(c => c + 1);
      }
      return;
    }

    // Check if betting round on the current street is complete
    const nonAllIn = currentSeats.filter((p): p is PokerPlayer => p !== null && !p.folded && !p.isAllIn);
    const highestBet = nonAllIn.length > 0 ? Math.max(...nonAllIn.map(p => p.currentRoundBet)) : 0;
    const isRoundDone = nonAllIn.length <= 1 || nonAllIn.every(p => p.currentRoundBet === highestBet && p.lastAction !== undefined);

    if (isRoundDone) {
      // Clear round bets and reset lastAction for the next street
      const freshSeats: (PokerPlayer | null)[] = currentSeats.map(p => p ? { ...p, currentRoundBet: 0, lastAction: undefined } : null);
      setSeats(freshSeats);
      setCurrentBetToCall(0);
      triggerSound(playCardDealSound);

      // Check if active non-all-in players can still make bets
      const remainingNonAllIn = freshSeats.filter((p): p is PokerPlayer => p !== null && !p.folded && !p.isAllIn);

      // If all remaining active players are all-in (or only 1 non-all-in player is left), deal remaining cards straight to showdown
      if (remainingNonAllIn.length <= 1 && active.length > 1) {
        let finalCommunityCards = [...communityCards];
        const currentDeck = [...deckRef.current];
        while (finalCommunityCards.length < 5 && currentDeck.length > 0) {
          finalCommunityCards.push(currentDeck.shift()!);
        }
        deckRef.current = currentDeck;
        setDeck(currentDeck);
        setCommunityCards(finalCommunityCards);
        setGameStage('showdown');
        setActiveTurnSeat(-1);

        const evaluated = active.map(p => ({
          player: p,
          evaluation: evaluateHoldemHand(p.cards, finalCommunityCards)
        }));
        evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score);
        const winner = evaluated[0];
        setSeats(freshSeats.map(p => p?.id === winner.player.id ? { ...p, chips: p.chips + livePot } : p));
        triggerSound(playWinSound);
        setStatusMessage(`🏆 Победитель: ${winner.player.name} (${winner.evaluation.description})! Выигрыш: ${livePot} 🎯`);
        setHandHistory(prev => [{
          id: 'train_' + Date.now(),
          handNumber: handCount,
          winnerNames: [winner.player.name],
          potAmount: livePot,
          winningHandDescription: winner.evaluation.description,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          isCoinHand: false
        }, ...prev]);
        setHandCount(c => c + 1);
        return;
      }

      // Helper to find the first active player who is not folded and not all-in
      const getFirstActiveSeat = (list: (PokerPlayer | null)[]) => {
        for (let i = 0; i < 6; i++) {
          const p = list[i];
          if (p && !p.folded && !p.isAllIn) {
            return i;
          }
        }
        return -1;
      };

      const currentDeck = [...deckRef.current];

      if (gameStage === 'preflop') {
        const flopCards = currentDeck.splice(0, 3);
        deckRef.current = currentDeck;
        setDeck(currentDeck);
        setCommunityCards(flopCards);
        setGameStage('flop');
        const nextSeat = getFirstActiveSeat(freshSeats);
        if (nextSeat === -1) {
          handleFastForwardHand();
          return;
        }
        setActiveTurnSeat(nextSeat);
        const actor = freshSeats[nextSeat];
        setStatusMessage(actor?.isUser ? 'Флоп открыт! Ваш ход.' : `Флоп открыт! Ход за: ${actor?.name || 'соратником'}...`);
      } else if (gameStage === 'flop') {
        const turnCard = currentDeck.splice(0, 1)[0];
        deckRef.current = currentDeck;
        setDeck(currentDeck);
        setCommunityCards(prev => turnCard ? [...prev, turnCard] : prev);
        setGameStage('turn');
        const nextSeat = getFirstActiveSeat(freshSeats);
        if (nextSeat === -1) {
          handleFastForwardHand();
          return;
        }
        setActiveTurnSeat(nextSeat);
        const actor = freshSeats[nextSeat];
        setStatusMessage(actor?.isUser ? 'Тёрн открыт! Ваш ход.' : `Тёрн открыт! Ход за: ${actor?.name || 'соратником'}...`);
      } else if (gameStage === 'turn') {
        const riverCard = currentDeck.splice(0, 1)[0];
        deckRef.current = currentDeck;
        setDeck(currentDeck);
        setCommunityCards(prev => riverCard ? [...prev, riverCard] : prev);
        setGameStage('river');
        const nextSeat = getFirstActiveSeat(freshSeats);
        if (nextSeat === -1) {
          handleFastForwardHand();
          return;
        }
        setActiveTurnSeat(nextSeat);
        const actor = freshSeats[nextSeat];
        setStatusMessage(actor?.isUser ? 'Ривер открыт! Финальный раунд ставок.' : `Ривер открыт! Ход за: ${actor?.name || 'соратником'}...`);
      } else if (gameStage === 'river') {
        // Showdown
        setGameStage('showdown');
        setActiveTurnSeat(-1);
        const evaluated = active.map(p => ({
          player: p,
          evaluation: evaluateHoldemHand(p.cards, communityCards)
        }));
        evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score);
        const winner = evaluated[0];
        setSeats(freshSeats.map(p => p?.id === winner.player.id ? { ...p, chips: p.chips + livePot } : p));
        triggerSound(playWinSound);
        setStatusMessage(`🏆 Победитель: ${winner.player.name} (${winner.evaluation.description})! Выигрыш: ${livePot} 🎯`);
        setHandHistory(prev => [{
          id: 'train_' + Date.now(),
          handNumber: handCount,
          winnerNames: [winner.player.name],
          potAmount: livePot,
          winningHandDescription: winner.evaluation.description,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          isCoinHand: false
        }, ...prev]);
        setHandCount(c => c + 1);
      }
      return;
    }

    // Round is NOT done yet -> advance turn to the next player who is NOT folded and NOT all-in
    const baseSeat = actingSeatIdx !== undefined ? actingSeatIdx : activeTurnSeat;
    let nextSeat = (baseSeat + 1) % 6;
    let guard = 0;
    while ((currentSeats[nextSeat] === null || currentSeats[nextSeat]?.folded || currentSeats[nextSeat]?.isAllIn) && guard < 12) {
      nextSeat = (nextSeat + 1) % 6;
      guard++;
    }
    if (guard >= 12 || currentSeats[nextSeat] === null || currentSeats[nextSeat]?.folded || currentSeats[nextSeat]?.isAllIn) {
      handleFastForwardHand();
      return;
    }
    setActiveTurnSeat(nextSeat);
    const nextPlayer = currentSeats[nextSeat];
    const isCurrentUserFolded = currentSeats.some(p => p && (p.isUser || (activeUser && p.participantId === activeUser.id)) && p.folded);
    if (nextPlayer?.isUser) {
      setStatusMessage('Ваш ход! Выберите действие.');
    } else {
      setStatusMessage(isCurrentUserFolded ? `Вы спасовали. Ход за: ${nextPlayer?.name || 'соратником'}...` : `Ход за: ${nextPlayer?.name || 'соратником'}...`);
    }
  };

  // User Actions wrapper (chooses WS or Local based on mode)
  const handleUserAction = (action: PlayerAction, customRaiseAmount?: number) => {
    if (mode === 'multiplayer') {
      sendWsMessage({
        type: 'player_action',
        action,
        raiseAmount: customRaiseAmount
      });
    } else {
      if (activeTurnSeat !== -1) {
        handlePlayerActionInternal(activeTurnSeat, action, customRaiseAmount);
      }
    }
  };

  const handleStartHand = () => {
    if (mode === 'multiplayer') {
      sendWsMessage({ type: 'start_hand' });
    } else {
      startTrainingHand();
    }
  };

  const handleSitDown = (seatIndex: number, participant?: Participant) => {
    if (mode === 'multiplayer') {
      sendWsMessage({
        type: 'sit_down',
        seatIndex,
        participant: participant || activeUser
      });
    } else {
      // In training, assign chosen member or bot
      const p = participant || activeUser;
      if (!p) return;
      setSeats(prev => {
        const next = [...prev];
        next[seatIndex] = {
          id: p.id,
          participantId: p.id,
          name: p.name,
          nickname: p.nickname || p.name,
          avatar: getParticipantAvatar(p),
          isUser: p.id === activeUser?.id,
          seatIndex,
          chips: 100,
          currentRoundBet: 0,
          totalHandBet: 0,
          cards: [],
          folded: false,
          isAllIn: false,
          isSittingOut: false
        };
        return next;
      });
    }
    setSeatTargetIndex(null);
  };

  const handleStandUp = (seatIndex: number) => {
    if (mode === 'multiplayer') {
      sendWsMessage({ type: 'stand_up', seatIndex });
    } else {
      setSeats(prev => {
        const next = [...prev];
        next[seatIndex] = null;
        return next;
      });
    }
  };

  const handleSendBluff = (text: string) => {
    const userSeat = seats.findIndex(p => p?.isUser || (activeUser && p?.participantId === activeUser.id));
    if (userSeat === -1) return;

    if (mode === 'multiplayer') {
      sendWsMessage({
        type: 'bluff',
        seatIndex: userSeat,
        text
      });
    } else {
      setSeats(prev => prev.map((p, idx) => idx === userSeat && p ? { ...p, speechBubble: text } : p));
      triggerSound(playBluffSound);
      setTimeout(() => {
        setSeats(prev => prev.map((p, idx) => idx === userSeat && p ? { ...p, speechBubble: undefined } : p));
      }, 3500);
    }
    setShowBluffPicker(false);
  };

  const handleTogglePeek = (seatIndex: number) => {
    setPeekedSeats(prev => ({
      ...prev,
      [seatIndex]: !prev[seatIndex]
    }));
  };

  // Active Player and Current User Seat
  const activeTurnPlayer = activeTurnSeat !== -1 ? seats[activeTurnSeat] : null;
  const isMyTurn = activeTurnPlayer && !activeTurnPlayer.folded && (activeTurnPlayer.isUser || (activeUser && activeTurnPlayer.participantId === activeUser.id));
  const userSeatIdx = seats.findIndex(p => p?.isUser || (activeUser && p?.participantId === activeUser.id));
  const userPlayer = userSeatIdx !== -1 ? seats[userSeatIdx] : null;

  // Active turn combination helper
  const activeTurnEval = userPlayer && userPlayer.cards.length === 2
    ? evaluateHoldemHand(userPlayer.cards, communityCards)
    : null;

  // Sizing helpers
  const callDiff = activeTurnPlayer ? Math.max(0, currentBetToCall - activeTurnPlayer.currentRoundBet) : 0;
  const canCheck = callDiff === 0;

  // Main Felt Table Content
  const tableContent = (
    <div className="relative w-full rounded-2xl sm:rounded-[36px] bg-gradient-to-b from-[#3a1a0d] via-[#281108] to-[#170a04] p-1.5 sm:p-3 border-4 sm:border-8 border-[#522410] shadow-2xl overflow-hidden ring-2 ring-amber-500/40">
      
      {/* ========================================================================= */}
      {/* 1. TOP RAIL: MODE SWITCHER & QUICK CONTROLS (DOCKED ON TABLE) */}
      {/* ========================================================================= */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-1.5 px-2 py-1.5 mb-1.5 rounded-xl bg-stone-950/80 border border-amber-400/40 backdrop-blur-xs text-xs">
        
        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-stone-900/90 p-0.5 rounded-lg border border-stone-800">
          <button
            type="button"
            onClick={() => setMode('multiplayer')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'multiplayer'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wifi size={12} className={isConnected ? 'text-emerald-950' : 'text-stone-500'} />
            <span>Сетевой онлайн</span>
            {mode === 'multiplayer' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode('training')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'training'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bot size={12} />
            <span>Тренировка</span>
          </button>
        </div>

        {/* Quick Helper Toggles & Deal Button */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Online / Bot badge */}
          <span className="text-[10px] font-bold text-stone-400 hidden sm:inline-flex items-center gap-1 mr-1">
            {mode === 'multiplayer' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Онлайн: {onlineCount}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Боты Негодяев (без риска)</span>
              </>
            )}
          </span>

          {/* Separate Window Toggle Button */}
          {!isDedicatedActive && (
            <button
              type="button"
              onClick={handleToggleDedicatedWindow}
              className="p-1 sm:px-2 sm:py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-black uppercase flex items-center gap-1 border border-emerald-500 shadow-sm cursor-pointer"
              title="Открыть покерный стол в отдельном окне во весь экран"
            >
              <Maximize2 size={12} />
              <span className="hidden sm:inline">В отдельном окне</span>
            </button>
          )}

          {/* Mobile Landscape Rotate Button */}
          <button
            type="button"
            onClick={handleToggleMobileLandscape}
            className={`p-1 sm:px-2 sm:py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer ${
              forceMobileLandscape
                ? 'bg-amber-500 text-stone-950 border-yellow-300 shadow-xs'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title="Горизонтальный экран для мобильного (Альбомная ориентация)"
          >
            <RotateCw size={12} className={forceMobileLandscape ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Альбомный</span>
          </button>

          {/* Hand Combinations */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-1 border border-stone-700 cursor-pointer"
            title="Комбинации карт"
          >
            <HelpCircle size={13} className="text-amber-400" />
            <span className="hidden md:inline">Комбинации</span>
          </button>

          {/* Hand History */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-1 border border-stone-700 cursor-pointer"
            title="История раздач"
          >
            <History size={13} className="text-amber-400" />
            <span className="hidden md:inline">История</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 cursor-pointer"
            title={soundEnabled ? "Выключить звук" : "Включить звук"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-stone-500" />}
          </button>

          {/* Peeking / Open Cards Toggle */}
          <button
            type="button"
            onClick={() => setShowAllCardsOpen(!showAllCardsOpen)}
            className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
              showAllCardsOpen
                ? 'bg-amber-500 text-stone-950 border-yellow-300'
                : 'bg-stone-800 border-stone-700 text-stone-300'
            }`}
            title="Режим открытых карт для общего ТВ"
          >
            {showAllCardsOpen ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Start / Next Hand Button directly on table! */}
          <button
            type="button"
            onClick={handleStartHand}
            disabled={gameStage !== 'waiting' && gameStage !== 'showdown' && !(mode === 'training' && userPlayer?.folded)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              gameStage === 'waiting' || gameStage === 'showdown' || (mode === 'training' && userPlayer?.folded)
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 shadow-md ring-1 ring-yellow-300'
                : 'bg-stone-800/80 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Play size={12} className={gameStage !== 'waiting' && gameStage !== 'showdown' && !(mode === 'training' && userPlayer?.folded) ? 'opacity-40' : 'fill-stone-950'} />
            <span>{gameStage === 'showdown' ? 'Ещё' : mode === 'training' && userPlayer?.folded ? 'Новая' : 'Раздать'}</span>
          </button>
        </div>
      </div>

        {/* ========================================================================= */}
        {/* 2. GREEN FELT PLAYING SURFACE */}
        {/* ========================================================================= */}
        <div className="relative w-full rounded-xl sm:rounded-[28px] bg-radial from-[#1e6f48] via-[#155a39] to-[#0d3f27] border-2 sm:border-4 border-[#092c1b] shadow-inner p-1.5 sm:p-3 flex flex-col justify-between overflow-hidden min-h-[420px] sm:min-h-[460px]">
          
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="text-center">
              <span className="text-6xl sm:text-8xl">⛺</span>
              <div className="text-xl sm:text-3xl font-black uppercase tracking-widest text-emerald-300 mt-1">
                НЕГОДЯИ
              </div>
            </div>
          </div>

          {/* Golden Oval Racetrack Marker */}
          <div className="absolute inset-3 sm:inset-6 rounded-[20px] sm:rounded-[24px] border border-amber-300/20 pointer-events-none" />

          {/* ===================================================================== */}
          {/* TOP ROW SEATS (2, 3, 4) */}
          {/* ===================================================================== */}
          <div className="relative z-10 flex justify-around items-start w-full px-1 sm:px-4 pt-0.5">
            {[2, 3, 4].map(idx => (
              <PokerSeat
                key={idx}
                seatIndex={idx}
                player={seats[idx]}
                isCurrentTurn={activeTurnSeat === idx}
                isDealer={dealerSeat === idx}
                gameStage={gameStage}
                onSitDown={(s) => setSeatTargetIndex(s)}
                onStandUp={handleStandUp}
                isPeeked={!!peekedSeats[idx]}
                onTogglePeek={handleTogglePeek}
                showAllCardsOpen={showAllCardsOpen}
                isCurrentUser={seats[idx]?.isUser || (activeUser && seats[idx]?.participantId === activeUser.id)}
              />
            ))}
          </div>

          {/* ===================================================================== */}
          {/* CENTER TABLE: STATUS, POT & COMMUNITY CARDS + ON-FELT ACTION HUD */}
          {/* ===================================================================== */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-1 sm:py-1.5 w-full max-w-xl mx-auto">
            
            {/* Status Announcement Banner */}
            <div className="mb-1 px-3 py-0.5 rounded-full bg-stone-950/85 border border-amber-400/80 shadow-md text-center max-w-md">
              <span className="text-[10px] sm:text-xs font-black text-amber-300 truncate block">
                {statusMessage}
              </span>
            </div>

            {/* Pot Badge & Board Cards in One Tight Unit */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center mb-1">
              {/* Pot Chip Badge */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 px-2.5 py-1 rounded-xl border border-amber-400 shadow-xl">
                <span className="text-base sm:text-lg animate-bounce">🪙</span>
                <div>
                  <div className="text-[7px] uppercase font-black text-amber-300/80 leading-none">БАНК</div>
                  <div className="text-sm sm:text-lg font-black text-white leading-tight">
                    {pot} <span className="text-[9px] text-amber-400 font-bold">{mode === 'multiplayer' ? 'монет' : 'фишек'}</span>
                  </div>
                </div>
              </div>

              {/* Community Cards */}
              <div className="flex items-center gap-1 sm:gap-1.5 min-h-[50px] sm:min-h-[58px]">
                {communityCards.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-300/50 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-1 border border-dashed border-emerald-400/30 rounded-lg">
                    <span>Флоп</span> • <span>Тёрн</span> • <span>Ривер</span>
                  </div>
                ) : (
                  communityCards.map((card, i) => (
                    <PokerCard
                      key={`${card.suit}_${card.value}_${i}`}
                      card={card}
                      size="md"
                      className="animate-fade-in"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Active Combination Helper for Current User */}
            {activeTurnEval && gameStage !== 'waiting' && gameStage !== 'showdown' && (
              <div className="mb-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-400/80 text-emerald-200 text-[10px] sm:text-xs font-black shadow-xs flex items-center gap-1 animate-fade-in">
                <span>🎯 Ваша комбинация:</span>
                <span className="text-amber-300">{activeTurnEval.description}</span>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ON-FELT ACTION HUD (MOVED DIRECTLY ONTO THE PLAYING FIELD!) */}
            {/* ===================================================================== */}
            <div className="w-full px-1">
              {isMyTurn && gameStage !== 'waiting' && gameStage !== 'showdown' ? (
                <div className="bg-stone-950/95 border border-amber-400/80 rounded-xl p-1.5 sm:p-2 shadow-2xl backdrop-blur-md space-y-1 sm:space-y-1.5 animate-fade-in">
                  
                  {/* Row 1: Quick Sizing Pills + Bluff Button */}
                  <div className="flex items-center justify-between gap-1 flex-wrap text-[9px] sm:text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-stone-400 font-bold hidden sm:inline">Рейз:</span>
                      {[1, 2, 5].map(add => (
                        <button
                          key={add}
                          type="button"
                          onClick={() => setRaiseAmount(add)}
                          className={`px-1.5 py-0.5 rounded font-black cursor-pointer ${
                            raiseAmount === add
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          +{add}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setRaiseAmount(Math.max(2, Math.floor(pot / 2)))}
                        className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-black cursor-pointer"
                      >
                        1/2 Банка
                      </button>
                      <button
                        type="button"
                        onClick={() => setRaiseAmount(Math.max(2, pot))}
                        className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-black cursor-pointer"
                      >
                        Банк
                      </button>
                    </div>

                    {/* Bluff Picker Toggle */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowBluffPicker(!showBluffPicker)}
                        className="px-2 py-0.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-400/50 rounded font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Flame size={11} className="text-yellow-400" />
                        <span>Реплика</span>
                      </button>

                      {/* Bluff popup menu */}
                      {showBluffPicker && (
                        <div className="absolute right-0 bottom-7 z-50 w-56 bg-stone-900 border-2 border-purple-400 rounded-xl shadow-2xl p-1.5 space-y-1">
                          <p className="text-[10px] font-black uppercase text-purple-300 px-1">Сказать соратникам:</p>
                          {BLUFF_REPLIES.map((reply, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendBluff(reply)}
                              className="w-full text-left px-2 py-1 rounded text-[11px] font-bold text-stone-200 hover:bg-purple-900/60 transition-colors cursor-pointer truncate"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Touch Action Buttons Grid directly on table */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                    {/* 1. FOLD */}
                    <button
                      type="button"
                      onClick={() => handleUserAction('fold')}
                      className="py-1.5 sm:py-2 px-1 sm:px-2 bg-stone-800 hover:bg-rose-950/80 text-stone-300 hover:text-rose-200 border border-stone-700 hover:border-rose-500 font-black text-[11px] sm:text-xs uppercase rounded-lg transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                    >
                      Пас
                    </button>

                    {/* 2. CHECK / CALL */}
                    {canCheck ? (
                      <button
                        type="button"
                        onClick={() => handleUserAction('check')}
                        className="py-1.5 sm:py-2 px-1 sm:px-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] sm:text-xs uppercase rounded-lg transition-all cursor-pointer shadow-md ring-1 ring-blue-300 active:scale-95 text-center"
                      >
                        Чек
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUserAction('call')}
                        disabled={activeTurnPlayer.chips <= 0}
                        className="py-1.5 sm:py-2 px-1 sm:px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] sm:text-xs uppercase rounded-lg transition-all cursor-pointer shadow-md ring-1 ring-emerald-300 active:scale-95 text-center"
                      >
                        Колл ({callDiff})
                      </button>
                    )}

                    {/* 3. RAISE */}
                    <button
                      type="button"
                      onClick={() => handleUserAction('raise', currentBetToCall + raiseAmount)}
                      disabled={activeTurnPlayer.chips <= callDiff}
                      className="py-1.5 sm:py-2 px-1 sm:px-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] sm:text-xs uppercase rounded-lg transition-all cursor-pointer shadow-md ring-1 ring-yellow-300 active:scale-95 disabled:opacity-40 text-center truncate"
                    >
                      Рейз (+{raiseAmount})
                    </button>

                    {/* 4. ALL-IN */}
                    <button
                      type="button"
                      onClick={() => handleUserAction('all_in')}
                      disabled={activeTurnPlayer.chips <= 0}
                      className="py-1.5 sm:py-2 px-1 sm:px-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] sm:text-xs uppercase rounded-lg transition-all cursor-pointer shadow-md ring-1 ring-rose-300 active:scale-95 disabled:opacity-40 text-center"
                    >
                      Ва-банк
                    </button>
                  </div>
                </div>
              ) : mode === 'training' && userPlayer?.folded && gameStage !== 'waiting' && gameStage !== 'showdown' ? (
                /* Fast-Forward / Next Hand HUD when user folded in Training Mode */
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-amber-950/90 border border-amber-400/80 text-[10px] sm:text-xs shadow-md animate-fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/60 font-black uppercase text-[9px] shrink-0">
                      Пас
                    </span>
                    <span className="font-bold text-amber-200 truncate">
                      {activeTurnPlayer ? `Ход: ${activeTurnPlayer.name}...` : 'Боты доигрывают...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleFastForwardHand}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Моментально раскрыть все карты и показать итог раздачи"
                    >
                      <Zap size={11} className="fill-stone-950" />
                      <span>Быстрый исход</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStartHand}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Начать следующую раздачу"
                    >
                      <Play size={10} className="fill-white" />
                      <span>Новая раздача</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* On-Field Status / Deal Banner when not user turn */
                <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-xl bg-stone-950/75 border border-amber-400/40 text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeTurnPlayer ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                        <span className="font-black text-stone-200 truncate">
                          Ход: <span className="text-amber-300">{activeTurnPlayer.name}</span>
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-stone-300 truncate">
                        {gameStage === 'showdown' ? 'Раздача завершена' : 'Стол готов к раздаче'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {userSeatIdx === -1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const freeIdx = seats.findIndex(s => s === null);
                          if (freeIdx !== -1) handleSitDown(freeIdx);
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-md shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={11} />
                        <span>Сесть</span>
                      </button>
                    )}

                    {(gameStage === 'waiting' || gameStage === 'showdown' || (mode === 'training' && userPlayer?.folded)) && (
                      <button
                        type="button"
                        onClick={handleStartHand}
                        className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase rounded-md shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Play size={10} className="fill-stone-950" />
                        <span>{gameStage === 'showdown' ? 'Дальше' : mode === 'training' && userPlayer?.folded ? 'Новая' : 'Раздать'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM ROW SEATS (1, 0, 5) */}
          {/* ===================================================================== */}
          <div className="relative z-10 flex justify-around items-end w-full px-1 sm:px-4 pb-0.5">
            {[1, 0, 5].map(idx => (
              <PokerSeat
                key={idx}
                seatIndex={idx}
                player={seats[idx]}
                isCurrentTurn={activeTurnSeat === idx}
                isDealer={dealerSeat === idx}
                gameStage={gameStage}
                onSitDown={(s) => setSeatTargetIndex(s)}
                onStandUp={handleStandUp}
                isPeeked={!!peekedSeats[idx]}
                onTogglePeek={handleTogglePeek}
                showAllCardsOpen={showAllCardsOpen}
                isCurrentUser={seats[idx]?.isUser || (activeUser && seats[idx]?.participantId === activeUser.id)}
              />
            ))}
          </div>

        </div>

      </div>
  );

  return (
    <>
      {/* If Dedicated Active: Render Full-Screen Dedicated Window */}
      {isDedicatedActive ? (
        <div 
          className="fixed inset-0 z-50 bg-[#071a10] text-white flex flex-col w-screen h-screen overflow-hidden animate-fade-in"
          style={forceMobileLandscape ? {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vh',
            height: '100vw',
            transform: 'translate(-50%, -50%) rotate(90deg)',
            transformOrigin: 'center center',
            zIndex: 9999,
            overflow: 'hidden'
          } : undefined}
        >
          {/* Dedicated Window Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-stone-950/95 border-b border-amber-500/40 shadow-lg shrink-0 z-30">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseDedicatedWindow}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700 shadow-sm"
                title="Выйти из-за стола в хаб лагеря"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">В хаб лагеря</span>
                <span className="sm:hidden">В лагерь</span>
              </button>

              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-base sm:text-lg">♠️</span>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase text-amber-300 leading-none">
                    Покерный Стол «Негодяи»
                  </h2>
                  <div className="text-[10px] text-stone-400 leading-none mt-0.5">
                    {mode === 'multiplayer' ? 'Сетевой стол онлайн' : 'Одиночная тренировка с ботами'}
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Window Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Landscape Orientation Button */}
              <button
                type="button"
                onClick={handleToggleMobileLandscape}
                className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-black uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                  forceMobileLandscape
                    ? 'bg-amber-500 text-stone-950 border-yellow-300 shadow-md ring-2 ring-yellow-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
                title="Повернуть экран горизонтально (Альбомный режим)"
              >
                <RotateCw size={12} className={forceMobileLandscape ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Альбомный экран</span>
                <span className="sm:hidden">Экран 🔄</span>
              </button>

              {/* Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Развернуть во весь экран устройства"
              >
                <Maximize2 size={12} />
                <span className="hidden md:inline">Полный экран</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseDedicatedWindow}
                className="px-2.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-black uppercase flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                title="Закрыть отдельное окно стола"
              >
                <X size={14} />
                <span className="hidden sm:inline">Закрыть</span>
              </button>
            </div>
          </div>

          {/* Dedicated Window Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-1 sm:p-3 flex flex-col justify-center items-center">
            {/* Mobile portrait hint */}
            {isMobileDevice && !isLandscape && !forceMobileLandscape && (
              <div className="w-full max-w-4xl mb-1.5 px-3 py-1.5 rounded-xl bg-amber-950/90 border border-amber-400/60 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-base animate-bounce">📱</span>
                  <span className="text-[11px] font-bold">
                    Поверните телефон горизонтально для комфортного обзора стола
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMobileLandscape}
                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <RotateCw size={11} />
                  <span>Повернуть 🔄</span>
                </button>
              </div>
            )}

            <div className="w-full max-w-4xl mx-auto">
              {tableContent}
            </div>
          </div>
        </div>
      ) : (
        /* Normal In-Tab View */
        <div className="select-none animate-fade-in w-full max-w-4xl mx-auto space-y-2">
          {/* Mobile Landscape Recommendation Banner */}
          {isMobileDevice && !isLandscape && !forceMobileLandscape && (
            <div className="px-3 py-2 rounded-2xl bg-amber-950/80 border border-amber-400/60 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-base animate-bounce">📱</span>
                <div>
                  <div className="font-black text-white text-[11px]">Покерный турнир лучше смотрится в альбомной ориентации!</div>
                  <div className="text-[10px] text-amber-300">Поверните смартфон или откройте в отдельном окне</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleMobileLandscape}
                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <RotateCw size={11} />
                  <span>Повернуть</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleDedicatedWindow}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Maximize2 size={11} />
                  <span>В окно</span>
                </button>
              </div>
            </div>
          )}

          {tableContent}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEATING PARTICIPANT */}
      {/* ========================================================================= */}
      {seatTargetIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <UserPlus size={16} className="text-amber-400" />
                <span>Посадить на место №{seatTargetIndex + 1}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSeatTargetIndex(null)}
                className="text-stone-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Поиск соратника..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white placeholder-stone-400 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {participants
                .filter(p => !seats.some(s => s?.participantId === p.id))
                .filter(p => !memberSearch || p.name.toLowerCase().includes(memberSearch.toLowerCase()))
                .map(p => {
                  const userCoins = coins.filter(c => c.participantId === p.id).length;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSitDown(seatTargetIndex, p)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getParticipantAvatar(p)}
                          alt={p.name}
                          className="w-7 h-7 rounded-full object-cover border border-stone-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-stone-400">@{p.nickname || p.name}</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-300 flex items-center gap-0.5">
                        <span>🪙</span>
                        <span>{userCoins}</span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMBINATIONS HIERARCHY */}
      {/* ========================================================================= */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <HelpCircle size={16} className="text-amber-400" />
                <span>Иерархия комбинаций покера</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="text-stone-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
              {[
                { name: '1. Роял-флеш', desc: 'A, K, Q, J, 10 одной масти', example: 'A♠ K♠ Q♠ J♠ 10♠' },
                { name: '2. Стрит-флеш', desc: 'Пять карт подряд одной масти', example: '9♥ 8♥ 7♥ 6♥ 5♥' },
                { name: '3. Каре', desc: 'Четыре карты одного достоинства', example: 'K♦ K♣ K♥ K♠' },
                { name: '4. Фулл-хаус', desc: 'Тройка + Пара', example: 'Q♥ Q♦ Q♠ 10♣ 10♦' },
                { name: '5. Флеш', desc: 'Пять карт любой величины одной масти', example: 'Любые 5 карт ♠' },
                { name: '6. Стрит', desc: 'Пять карт подряд разных мастей', example: '8♣ 7♥ 6♦ 5♠ 4♥' },
                { name: '7. Тройка (Сет)', desc: 'Три карты одного достоинства', example: 'J♠ J♦ J♣' },
                { name: '8. Две пары', desc: 'Две разные пары', example: '9♦ 9♠ 4♣ 4♥' },
                { name: '9. Одна пара', desc: 'Две карты одного достоинства', example: 'A♣ A♦' },
                { name: '10. Старшая карта', desc: 'Никакой комбинации, решает старшинство', example: 'A♠ K♦ 9♣' }
              ].map((comb, i) => (
                <div key={i} className="p-2 rounded-xl bg-stone-800/90 border border-stone-700/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-amber-300">{comb.name}</div>
                    <div className="text-[11px] text-stone-300">{comb.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                    {comb.example}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HAND HISTORY */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <History size={16} className="text-amber-400" />
                <span>История раздач стола</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-stone-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
              {handHistory.length === 0 ? (
                <p className="text-center text-stone-500 py-6">История раздач пока пуста.</p>
              ) : (
                handHistory.map((rec) => (
                  <div key={rec.id} className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white">Раздача #{rec.handNumber}</span>
                      <span className="text-[10px] text-stone-400">{rec.timestamp}</span>
                    </div>
                    <div className="text-amber-300 font-bold flex items-center gap-1">
                      <span>🏆 {rec.winnerNames.join(', ')}</span>
                      <span>(+{rec.potAmount} {rec.isCoinHand ? '🪙' : '🎯'})</span>
                    </div>
                    <div className="text-[11px] text-stone-400">{rec.winningHandDescription}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
