import React, { useState, useEffect } from 'react';
import { 
  Volume2, VolumeX, History, HelpCircle, RefreshCw, 
  Flame, UserPlus, Eye, EyeOff, Search, Trophy, Shield, Sparkles
} from 'lucide-react';
import { Participant, RallyCoin } from '../../../types';
import { 
  Card, GameStage, HandEvaluation, HandHistoryRecord, 
  PlayerAction, PokerPlayer 
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

export default function PokerTable({
  participants,
  coins,
  currentUser,
  isCaptain,
  onAwardCoin,
  onDeleteCoin,
  onUpdateCoins
}: PokerTableProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBluffPicker, setShowBluffPicker] = useState(false);
  const [showAllCardsOpen, setShowAllCardsOpen] = useState(false);

  // Seating Modal
  const [seatTargetIndex, setSeatTargetIndex] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Table Setup
  const [seats, setSeats] = useState<(PokerPlayer | null)[]>([null, null, null, null, null, null]);
  const [peekedSeats, setPeekedSeats] = useState<Record<number, boolean>>({});
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [gameStage, setGameStage] = useState<GameStage>('waiting');
  const [pot, setPot] = useState<number>(0);
  const [currentBetToCall, setCurrentBetToCall] = useState<number>(0);
  const [activeTurnSeat, setActiveTurnSeat] = useState<number>(-1);
  const [dealerSeat, setDealerSeat] = useState<number>(0);
  const [handCount, setHandCount] = useState<number>(1);
  const [handWinners, setHandWinners] = useState<{ player: PokerPlayer; evaluation: HandEvaluation; wonAmount: number }[]>([]);
  const [handHistory, setHandHistory] = useState<HandHistoryRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Посадите соратников за стол и начните раздачу');
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Betting Controls
  const [raiseAmount, setRaiseAmount] = useState<number>(2);

  // Active user identification
  const activeUser = currentUser || participants[0];

  // Sound wrapper
  const triggerSound = (fn: () => void) => {
    if (soundEnabled) {
      fn();
    }
  };

  // Synchronize seat chips with real coin balance when in waiting state
  useEffect(() => {
    if (gameStage === 'waiting') {
      setSeats(prev => prev.map(p => {
        if (!p) return null;
        const realCoins = coins.filter(c => c.participantId === p.participantId).length;
        return {
          ...p,
          chips: realCoins
        };
      }));
    }
  }, [coins, gameStage]);

  // Initial seating: seat real team members who have coins (NO BOTS)
  useEffect(() => {
    // Only auto-seed if all seats are empty
    if (seats.every(s => s === null) && participants.length > 0) {
      const initialSeats: (PokerPlayer | null)[] = [null, null, null, null, null, null];
      
      // Find participants who have earned coins
      const membersWithCoins = participants.filter(p => {
        const count = coins.filter(c => c.participantId === p.id).length;
        return count > 0;
      });

      // If activeUser has coins, seat activeUser at seat 0
      const activeUserCoinCount = activeUser ? coins.filter(c => c.participantId === activeUser.id).length : 0;
      let seatIdx = 0;

      if (activeUser && activeUserCoinCount > 0) {
        initialSeats[0] = {
          id: activeUser.id,
          participantId: activeUser.id,
          name: activeUser.name,
          nickname: activeUser.nickname || activeUser.name,
          avatar: getParticipantAvatar(activeUser),
          isUser: true,
          seatIndex: 0,
          chips: activeUserCoinCount,
          currentRoundBet: 0,
          totalHandBet: 0,
          cards: [],
          folded: false,
          isAllIn: false,
          isSittingOut: false
        };
        seatIdx = 1;
      }

      // Seat other members with coins up to available seats
      membersWithCoins.forEach(member => {
        if (activeUser && member.id === activeUser.id) return;
        if (seatIdx >= 6) return;

        const memberCoinCount = coins.filter(c => c.participantId === member.id).length;
        initialSeats[seatIdx] = {
          id: member.id,
          participantId: member.id,
          name: member.name,
          nickname: member.nickname || member.name,
          avatar: getParticipantAvatar(member),
          isUser: false,
          seatIndex: seatIdx,
          chips: memberCoinCount,
          currentRoundBet: 0,
          totalHandBet: 0,
          cards: [],
          folded: false,
          isAllIn: false,
          isSittingOut: false
        };
        seatIdx++;
      });

      setSeats(initialSeats);

      const seatedCount = initialSeats.filter(s => s !== null).length;
      if (seatedCount >= 2) {
        setStatusMessage(`За столом ${seatedCount} соратников с монетами. Нажмите «Начать раздачу»!`);
      } else {
        setStatusMessage('Посадите минимум 2 участников с монетами, чтобы начать турнир');
      }
    }
  }, [participants]);

  // Handle seating a specific team member
  const handleSeatParticipant = (seatIndex: number, participant: Participant, coinCount: number) => {
    const isUser = activeUser?.id === participant.id;
    const newPlayer: PokerPlayer = {
      id: participant.id,
      participantId: participant.id,
      name: participant.name,
      nickname: participant.nickname || participant.name,
      avatar: getParticipantAvatar(participant),
      isUser,
      seatIndex,
      chips: coinCount,
      currentRoundBet: 0,
      totalHandBet: 0,
      cards: [],
      folded: false,
      isAllIn: false,
      isSittingOut: false
    };

    const newSeats = [...seats];
    newSeats[seatIndex] = newPlayer;
    setSeats(newSeats);
    setSeatTargetIndex(null);
    setMemberSearch('');

    const seatedCount = newSeats.filter(s => s !== null && s.chips > 0).length;
    setStatusMessage(`${participant.name} сел(а) за место №${seatIndex + 1} (${coinCount} 🪙). Игроков готово: ${seatedCount}`);
  };

  // Stand up from seat
  const handleStandUp = (seatIndex: number) => {
    if (gameStage !== 'waiting' && gameStage !== 'showdown') return;
    const player = seats[seatIndex];
    if (!player) return;

    const newSeats = [...seats];
    newSeats[seatIndex] = null;
    setSeats(newSeats);
    setStatusMessage(`${player.name} встал(а) из-за стола`);
  };

  // Toggle card peeking for a seat
  const handleTogglePeek = (seatIndex: number) => {
    setPeekedSeats(prev => ({
      ...prev,
      [seatIndex]: !prev[seatIndex]
    }));
  };

  // Send a banter speech bubble
  const handleSendBluff = (seatIndex: number, text: string) => {
    const player = seats[seatIndex];
    if (!player) return;

    setSeats(prev => prev.map((p, idx) => idx === seatIndex ? { ...p, speechBubble: text } : p));
    setShowBluffPicker(false);
    triggerSound(playBluffSound);

    setTimeout(() => {
      setSeats(prev => prev.map((p, idx) => idx === seatIndex ? { ...p, speechBubble: undefined } : p));
    }, 3500);
  };

  // START NEW HAND
  const startNewHand = () => {
    const seatedPlayers = seats.filter((s): s is PokerPlayer => s !== null && s.chips > 0);
    if (seatedPlayers.length < 2) {
      setStatusMessage('Для раздачи нужно минимум 2 соратника с монетами за столом!');
      return;
    }

    triggerSound(playCardDealSound);

    // Shuffle fresh deck
    const newDeck = shuffleDeck(createDeck());

    // Advance dealer button
    let nextDealer = (dealerSeat + 1) % 6;
    let guard = 0;
    while ((seats[nextDealer] === null || seats[nextDealer]?.chips === 0) && guard < 12) {
      nextDealer = (nextDealer + 1) % 6;
      guard++;
    }
    setDealerSeat(nextDealer);

    // Blinds
    const smallBlindAmount = 1;
    const bigBlindAmount = 2;

    // Small blind seat
    let sbSeat = (nextDealer + 1) % 6;
    guard = 0;
    while ((seats[sbSeat] === null || seats[sbSeat]?.chips === 0) && guard < 12) {
      sbSeat = (sbSeat + 1) % 6;
      guard++;
    }

    // Big blind seat
    let bbSeat = (sbSeat + 1) % 6;
    guard = 0;
    while ((seats[bbSeat] === null || seats[bbSeat]?.chips === 0) && guard < 12) {
      bbSeat = (bbSeat + 1) % 6;
      guard++;
    }

    let deckIdx = 0;
    let initialPot = 0;

    const newSeats = seats.map((player, idx) => {
      if (!player || player.chips <= 0) return player;

      const card1 = newDeck[deckIdx++];
      const card2 = newDeck[deckIdx++];

      let blindBet = 0;
      let lastActionText = '';
      if (idx === sbSeat) {
        blindBet = Math.min(smallBlindAmount, player.chips);
        lastActionText = `Мал. блайнд (${blindBet} 🪙)`;
      } else if (idx === bbSeat) {
        blindBet = Math.min(bigBlindAmount, player.chips);
        lastActionText = `Бол. блайнд (${blindBet} 🪙)`;
      }

      initialPot += blindBet;

      return {
        ...player,
        cards: [card1, card2],
        folded: false,
        isAllIn: player.chips - blindBet === 0,
        chips: player.chips - blindBet,
        currentRoundBet: blindBet,
        totalHandBet: blindBet,
        lastAction: lastActionText ? { type: 'bet' as PlayerAction, amount: blindBet, text: lastActionText } : undefined,
        speechBubble: undefined
      };
    });

    setDeck(newDeck.slice(deckIdx));
    setCommunityCards([]);
    setSeats(newSeats);
    setPot(initialPot);
    setCurrentBetToCall(bigBlindAmount);
    setGameStage('preflop');
    setHandWinners([]);
    setRaiseAmount(bigBlindAmount * 2);
    setPeekedSeats({});

    // First turn after Big Blind
    let firstTurn = (bbSeat + 1) % 6;
    guard = 0;
    while ((newSeats[firstTurn] === null || newSeats[firstTurn]?.folded || newSeats[firstTurn]?.isAllIn) && guard < 12) {
      firstTurn = (firstTurn + 1) % 6;
      guard++;
    }
    setActiveTurnSeat(firstTurn);

    const activePlayer = newSeats[firstTurn];
    setStatusMessage(`Раздача #${handCount}! Префлоп. Банк: ${initialPot} 🪙. Ход: ${activePlayer?.name}`);
  };

  // DEAL NEXT STREET
  const advanceToNextStreet = (currentStage: GameStage, currentSeats: (PokerPlayer | null)[]) => {
    const resetSeats = currentSeats.map(p => p ? { ...p, currentRoundBet: 0 } : null);
    setCurrentBetToCall(0);

    triggerSound(playCardDealSound);

    let nextStage: GameStage = currentStage;
    let nextBoard = [...communityCards];

    if (currentStage === 'preflop') {
      const flop = deck.slice(0, 3);
      setDeck(prev => prev.slice(3));
      nextBoard = flop;
      setCommunityCards(flop);
      nextStage = 'flop';
      setStatusMessage('Флоп открыт! Раунд торговли.');
    } else if (currentStage === 'flop') {
      const turn = deck.slice(0, 1);
      setDeck(prev => prev.slice(1));
      nextBoard = [...communityCards, ...turn];
      setCommunityCards(nextBoard);
      nextStage = 'turn';
      setStatusMessage('Тёрн открыт!');
    } else if (currentStage === 'turn') {
      const river = deck.slice(0, 1);
      setDeck(prev => prev.slice(1));
      nextBoard = [...communityCards, ...river];
      setCommunityCards(nextBoard);
      nextStage = 'river';
      setStatusMessage('Ривер открыт! Финальный раунд ставок.');
    } else if (currentStage === 'river') {
      handleShowdown(resetSeats, communityCards);
      return;
    }

    setGameStage(nextStage);

    // Turn after dealer
    let nextSeat = (dealerSeat + 1) % 6;
    let guard = 0;
    while ((resetSeats[nextSeat] === null || resetSeats[nextSeat]?.folded || resetSeats[nextSeat]?.isAllIn) && guard < 12) {
      nextSeat = (nextSeat + 1) % 6;
      guard++;
    }
    setSeats(resetSeats);
    setActiveTurnSeat(nextSeat);
  };

  // PEER-TO-PEER COIN SETTLEMENT VIA BACKEND
  const settleHandCoins = async (
    winner: PokerPlayer, 
    handDescription: string, 
    allSeats: (PokerPlayer | null)[]
  ) => {
    setIsSettling(true);
    const losers = allSeats.filter(
      (p): p is PokerPlayer => p !== null && p.participantId !== winner.participantId && p.totalHandBet > 0
    );

    if (losers.length === 0) {
      setIsSettling(false);
      return;
    }

    const settlements = losers.map(l => ({
      loserId: l.participantId,
      loserName: l.name,
      amount: l.totalHandBet
    }));

    try {
      const res = await fetch('/api/coins/poker-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlements,
          winnerId: winner.participantId,
          winnerName: winner.name,
          winnerNickname: winner.nickname,
          handDescription
        })
      });

      const data = await res.json();
      if (data.success && data.coins) {
        if (onUpdateCoins) {
          onUpdateCoins(data.coins);
        }
      }
    } catch (err) {
      console.error('Failed to settle poker hand coins:', err);
    } finally {
      setIsSettling(false);
    }
  };

  // SHOWDOWN & WINNER EVALUATION
  const handleShowdown = async (finalSeats: (PokerPlayer | null)[], board: Card[]) => {
    setGameStage('showdown');
    setActiveTurnSeat(-1);

    const activePlayers = finalSeats.filter((p): p is PokerPlayer => p !== null && !p.folded);

    if (activePlayers.length === 0) {
      setStatusMessage('Все игроки сбросили карты.');
      return;
    }

    // Evaluate hands
    const evaluated = activePlayers.map(p => ({
      player: p,
      evaluation: evaluateHoldemHand(p.cards, board)
    }));

    // Sort descending by score
    evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score);

    const bestScore = evaluated[0].evaluation.score;
    const winners = evaluated.filter(e => e.evaluation.score === bestScore);

    const winPotEach = Math.floor(pot / winners.length);
    const winSummary = winners.map(w => ({
      ...w,
      wonAmount: winPotEach
    }));

    setHandWinners(winSummary);

    // Update chips
    const updatedSeats = finalSeats.map(p => {
      if (!p) return null;
      const isWinner = winners.some(w => w.player.id === p.id);
      return {
        ...p,
        chips: isWinner ? p.chips + winPotEach : p.chips,
        currentRoundBet: 0
      };
    });

    setSeats(updatedSeats);
    triggerSound(playWinSound);

    // Record history
    const primaryWinner = winners[0];
    const record: HandHistoryRecord = {
      id: 'hand_' + Date.now(),
      handNumber: handCount,
      winnerNames: winners.map(w => w.player.name),
      potAmount: pot,
      winningHandDescription: primaryWinner.evaluation.description,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isCoinHand: true
    };
    setHandHistory(prev => [record, ...prev]);
    setHandCount(prev => prev + 1);

    const winnerNamesText = winners.map(w => w.player.name).join(', ');
    setStatusMessage(`🏆 Победитель: ${winnerNamesText}! Выигрыш: ${pot} 🪙 (${primaryWinner.evaluation.description})`);

    // Settle peer-to-peer coins in the real database
    await settleHandCoins(primaryWinner.player, primaryWinner.evaluation.description, finalSeats);
  };

  // CHECK IF BETTING ROUND COMPLETE
  const isBettingRoundComplete = (currentSeats: (PokerPlayer | null)[]) => {
    const activeNonAllIn = currentSeats.filter((p): p is PokerPlayer => p !== null && !p.folded && !p.isAllIn);
    if (activeNonAllIn.length <= 1) return true;

    const highestBet = Math.max(...currentSeats.map(p => p?.currentRoundBet || 0));
    return activeNonAllIn.every(p => p.currentRoundBet === highestBet && p.lastAction !== undefined);
  };

  // ADVANCE TURN
  const advanceTurn = (currentSeats: (PokerPlayer | null)[]) => {
    const activeRemaining = currentSeats.filter((p): p is PokerPlayer => p !== null && !p.folded);

    // If only 1 player remains, they win immediately without showdown
    if (activeRemaining.length === 1) {
      const winner = activeRemaining[0];
      const winAmount = pot;
      const updatedSeats = currentSeats.map(p => {
        if (!p) return null;
        return p.id === winner.id ? { ...p, chips: p.chips + winAmount, currentRoundBet: 0 } : p;
      });

      setSeats(updatedSeats);
      setGameStage('showdown');
      setActiveTurnSeat(-1);
      triggerSound(playWinSound);

      const fakeEval: HandEvaluation = {
        score: 1,
        rank: 'high_card',
        rankName: 'Все остальные спасовали',
        description: 'Все остальные спасовали',
        bestCards: winner.cards
      };

      setHandWinners([{ player: winner, evaluation: fakeEval, wonAmount: winAmount }]);

      const record: HandHistoryRecord = {
        id: 'hand_' + Date.now(),
        handNumber: handCount,
        winnerNames: [winner.name],
        potAmount: winAmount,
        winningHandDescription: 'Все остальные игроки сбросили карты (пас)',
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isCoinHand: true
      };
      setHandHistory(prev => [record, ...prev]);
      setHandCount(prev => prev + 1);

      setStatusMessage(`🏆 ${winner.name} забирает банк ${winAmount} 🪙 (все соперники спасовали)!`);

      // Settle coins
      settleHandCoins(winner, 'Все спасовали', currentSeats);
      return;
    }

    // Check if round of betting complete
    if (isBettingRoundComplete(currentSeats)) {
      advanceToNextStreet(gameStage, currentSeats);
      return;
    }

    // Next active player
    let nextSeat = (activeTurnSeat + 1) % 6;
    let guard = 0;
    while (
      (currentSeats[nextSeat] === null || currentSeats[nextSeat]?.folded || currentSeats[nextSeat]?.isAllIn) &&
      guard < 12
    ) {
      nextSeat = (nextSeat + 1) % 6;
      guard++;
    }

    setActiveTurnSeat(nextSeat);
    const nextPlayer = currentSeats[nextSeat];
    if (nextPlayer) {
      setStatusMessage(`Ход соратника: ${nextPlayer.name} (${nextPlayer.nickname}). Ставка для уравнивания: ${currentBetToCall} 🪙`);
    }
  };

  // PLAYER ACTION HANDLER
  const handlePlayerAction = (
    seatIdx: number, 
    action: PlayerAction, 
    customRaiseAmount?: number
  ) => {
    const player = seats[seatIdx];
    if (!player || player.folded) return;

    let newChips = player.chips;
    let newBet = player.currentRoundBet;
    let actionText = '';
    let addedToPot = 0;

    const callDifference = currentBetToCall - player.currentRoundBet;

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
        const pay = Math.min(callDifference, player.chips);
        newChips -= pay;
        newBet += pay;
        addedToPot = pay;
        actionText = pay === player.chips ? `Колл Ва-банк (${pay} 🪙)` : `Колл (${pay} 🪙)`;
        triggerSound(playChipSound);
        break;
      }

      case 'raise':
      case 'bet': {
        const totalTargetBet = customRaiseAmount || (currentBetToCall + raiseAmount);
        const toAdd = totalTargetBet - player.currentRoundBet;
        const actualAdd = Math.min(toAdd, player.chips);
        newChips -= actualAdd;
        newBet += actualAdd;
        addedToPot = actualAdd;
        setCurrentBetToCall(newBet);
        actionText = actualAdd === player.chips ? `Ва-банк (${newBet} 🪙)` : `Рейз (${newBet} 🪙)`;
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
        actionText = `Ва-банк (${newBet} 🪙)!`;
        triggerSound(playChipSound);
        break;
      }
    }

    const updatedSeats = seats.map((p, idx) => {
      if (idx !== seatIdx || !p) return p;
      return {
        ...p,
        chips: newChips,
        currentRoundBet: newBet,
        totalHandBet: p.totalHandBet + addedToPot,
        folded: action === 'fold' ? true : p.folded,
        isAllIn: newChips === 0,
        lastAction: {
          type: action,
          amount: newBet,
          text: actionText
        }
      };
    });

    setSeats(updatedSeats);
    setPot(prev => prev + addedToPot);

    advanceTurn(updatedSeats);
  };

  // Seated players count
  const seatedPlayersCount = seats.filter(s => s !== null && s.chips > 0).length;

  // Active turn player
  const activeTurnPlayer = activeTurnSeat !== -1 ? seats[activeTurnSeat] : null;

  // Current user's seated seat
  const userSeatIdx = seats.findIndex(p => p?.isUser);
  const userPlayer = userSeatIdx !== -1 ? seats[userSeatIdx] : null;

  // Active turn combination evaluation
  const activeTurnEval = activeTurnPlayer && activeTurnPlayer.cards.length === 2
    ? evaluateHoldemHand(activeTurnPlayer.cards, communityCards)
    : null;

  // Filter participants for Seating Modal
  const filteredParticipants = participants.filter(p => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* HEADER & TOURNAMENT CONTROLS */}
      <div className="bg-stone-900 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 text-stone-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-yellow-300">
            ♠️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                Покерный турнир команды
              </span>
              <span className="text-xs font-bold text-amber-300">
                Без ботов • Исключительно на монеты Негодяев
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight flex items-center gap-2">
              Техасский Холдем Негодяев
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Только реальные члены команды. Ставки на заработанные монеты или выигрыш с Колеса Фортуны.
            </p>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Card visibility toggle (for playing on shared TV/screen or personal peeking) */}
          <button
            type="button"
            onClick={() => setShowAllCardsOpen(!showAllCardsOpen)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showAllCardsOpen
                ? 'bg-amber-500 text-stone-950 border-yellow-300 shadow-md'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
            title="Режим открытых карт для совместного экрана"
          >
            {showAllCardsOpen ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{showAllCardsOpen ? 'Карты открыты' : 'Скрывать карты'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-stone-800 border-stone-700 text-amber-300 hover:bg-stone-700'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
            title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Hand History Button */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <History size={15} className="text-amber-400" />
            <span>История ({handHistory.length})</span>
          </button>

          {/* Rules / Hand Hierarchy Button */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <HelpCircle size={15} className="text-amber-400" />
            <span>Комбинации</span>
          </button>

          {/* Start New Hand Button */}
          <button
            type="button"
            onClick={startNewHand}
            disabled={gameStage !== 'waiting' && gameStage !== 'showdown'}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              gameStage === 'waiting' || gameStage === 'showdown'
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 ring-2 ring-yellow-400'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <RefreshCw size={14} className={gameStage !== 'waiting' && gameStage !== 'showdown' ? 'animate-spin' : ''} />
            <span>{gameStage === 'showdown' ? 'Следующая раздача' : 'Начать раздачу'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE POKER TABLE (AUTHENTIC GREEN FELT WITH WOOD RIM) */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-5xl mx-auto rounded-[50px] p-4 sm:p-7 shadow-2xl bg-gradient-to-b from-[#4a2211] via-[#35180c] to-[#241008] border-8 border-[#5e2b15] ring-4 ring-amber-500/40">
        
        {/* Brass studs / decorative ring on wood rim */}
        <div className="absolute inset-2 sm:inset-3 rounded-[42px] border border-amber-500/30 pointer-events-none" />

        {/* GREEN FELT SURFACE */}
        <div className="relative w-full min-h-[500px] sm:min-h-[540px] rounded-[36px] bg-radial from-[#1e6f48] via-[#155a39] to-[#0d3f27] border-4 border-[#092c1b] shadow-inner p-4 flex flex-col justify-between overflow-hidden">
          
          {/* Felt Watermark / Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="text-center">
              <span className="text-8xl sm:text-9xl">⛺</span>
              <div className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-emerald-300 mt-2">
                НЕГОДЯИ
              </div>
            </div>
          </div>

          {/* Inner Golden Felt Line (Oval racetrack marker) */}
          <div className="absolute inset-6 sm:inset-10 rounded-[28px] border border-amber-300/20 pointer-events-none" />

          {/* TOP ROW SEATS (Seats 2, 3, 4) */}
          <div className="relative z-10 flex justify-around items-start w-full px-2 sm:px-8 pt-1">
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
                isCurrentUser={seats[idx]?.participantId === activeUser?.id}
              />
            ))}
          </div>

          {/* CENTER TABLE AREA: POT & COMMUNITY CARDS */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
            
            {/* Status & Round Announcement Pill */}
            <div className="mb-2.5 px-4 py-1.5 rounded-full bg-stone-950/85 border border-amber-400/80 shadow-lg text-center max-w-lg">
              <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center justify-center gap-2">
                {isSettling && <RefreshCw size={12} className="animate-spin text-amber-400" />}
                <span>{statusMessage}</span>
              </span>
            </div>

            {/* POT PILL WITH REAL COIN ICON */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 px-6 py-2.5 rounded-2xl border-2 border-amber-400 shadow-2xl mb-3">
              <span className="text-2xl animate-bounce">🪙</span>
              <div className="text-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-300">БАНК ТУРНИРА</span>
                <div className="text-xl sm:text-3xl font-black text-white leading-none">
                  {pot} <span className="text-xs text-amber-400 font-bold">монет</span>
                </div>
              </div>
            </div>

            {/* COMMUNITY CARDS (BOARD) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-h-[80px]">
              {communityCards.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-300/40 text-xs font-bold uppercase tracking-widest py-4">
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

            {/* Turn combination badge */}
            {activeTurnEval && gameStage !== 'waiting' && gameStage !== 'showdown' && (
              <div className="mt-2 px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-400/80 text-emerald-200 text-xs font-black shadow-md flex items-center gap-1.5 animate-fade-in">
                <span>🎯 Комбинация текущего игрока:</span>
                <span className="text-amber-300">{activeTurnEval.description}</span>
              </div>
            )}
          </div>

          {/* BOTTOM ROW SEATS (Seats 1, 0, 5) */}
          <div className="relative z-10 flex justify-around items-end w-full px-2 sm:px-8 pb-1">
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
                isCurrentUser={seats[idx]?.participantId === activeUser?.id}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE PLAYER ACTION PANEL */}
      {/* ========================================================================= */}
      {activeTurnPlayer && gameStage !== 'waiting' && gameStage !== 'showdown' ? (
        <div className="bg-white border-2 border-amber-400 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <img
                src={activeTurnPlayer.avatar}
                alt={activeTurnPlayer.name}
                className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover ring-2 ring-yellow-400 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm uppercase text-stone-900">
                    Ход соратника: {activeTurnPlayer.name} {activeTurnPlayer.nickname ? `(${activeTurnPlayer.nickname})` : ''}
                  </span>
                  <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-0.5 rounded-lg border border-amber-300">
                    В стеке: {activeTurnPlayer.chips} 🪙
                  </span>
                  {activeTurnPlayer.participantId === activeUser?.id && (
                    <span className="bg-emerald-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full">
                      Ваш ход
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ставка в раунде: {activeTurnPlayer.currentRoundBet} 🪙 • Для уравнивания нужно: {Math.max(0, currentBetToCall - activeTurnPlayer.currentRoundBet)} 🪙
                </p>
              </div>
            </div>

            {/* Bluff / Emote Banter Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBluffPicker(!showBluffPicker)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Flame size={14} className="text-yellow-300" />
                <span>Реплика / Блеф</span>
              </button>

              {/* Bluff popup picker */}
              {showBluffPicker && (
                <div className="absolute right-0 top-11 z-40 w-64 bg-white border-2 border-purple-300 rounded-2xl shadow-2xl p-2 space-y-1 animate-fade-in">
                  <p className="text-[11px] font-black uppercase text-purple-900 px-2 py-1">
                    Сказать за столом:
                  </p>
                  {BLUFF_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendBluff(activeTurnPlayer.seatIndex, reply)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-800 hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer truncate"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Fold */}
              <button
                type="button"
                onClick={() => handlePlayerAction(activeTurnPlayer.seatIndex, 'fold')}
                className="py-3 px-3 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border-2 border-stone-200 hover:border-rose-300 font-black text-xs sm:text-sm uppercase rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
              >
                Пас (Сбросить)
              </button>

              {/* Check or Call */}
              {currentBetToCall === activeTurnPlayer.currentRoundBet ? (
                <button
                  type="button"
                  onClick={() => handlePlayerAction(activeTurnPlayer.seatIndex, 'check')}
                  className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                >
                  Чек (Пропустить)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePlayerAction(activeTurnPlayer.seatIndex, 'call')}
                  disabled={activeTurnPlayer.chips <= 0}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                >
                  Колл ({Math.min(currentBetToCall - activeTurnPlayer.currentRoundBet, activeTurnPlayer.chips)} 🪙)
                </button>
              )}

              {/* Raise / Bet */}
              <button
                type="button"
                onClick={() => handlePlayerAction(activeTurnPlayer.seatIndex, 'raise', currentBetToCall + raiseAmount)}
                disabled={activeTurnPlayer.chips <= currentBetToCall - activeTurnPlayer.currentRoundBet}
                className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs sm:text-sm uppercase rounded-xl transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
              >
                Рейз (+{raiseAmount} 🪙)
              </button>

              {/* All-in */}
              <button
                type="button"
                onClick={() => handlePlayerAction(activeTurnPlayer.seatIndex, 'all_in')}
                disabled={activeTurnPlayer.chips <= 0}
                className="py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm uppercase rounded-xl transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
              >
                Ва-банк ({activeTurnPlayer.chips} 🪙)!
              </button>
            </div>

            {/* Sizing Controls for Raise */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-600">Размер надбавки к рейзу:</span>
                <span className="font-black text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                  +{raiseAmount} 🪙
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setRaiseAmount(1)}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setRaiseAmount(2)}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800"
                >
                  +2
                </button>
                <button
                  type="button"
                  onClick={() => setRaiseAmount(5)}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => setRaiseAmount(Math.max(1, Math.floor(pot / 2)))}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800"
                >
                  1/2 Банка
                </button>
                <button
                  type="button"
                  onClick={() => setRaiseAmount(Math.max(1, pot))}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800"
                >
                  Банк ({pot})
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm uppercase">
            <Sparkles size={16} />
            <span>Статус стола</span>
          </div>
          <p className="text-xs text-stone-300 mt-1 max-w-lg mx-auto">
            {seatedPlayersCount < 2
              ? 'Для начала раздачи посадите минимум 2 участников команды с монетами, нажав «+ Посадить» на свободных местах.'
              : gameStage === 'showdown'
              ? 'Раздача завершена! Монеты переведены победителю. Нажмите «Следующая раздача» для продолжения.'
              : 'Все соратники готовы. Нажмите «Начать раздачу» в правом верхнем углу для раздачи карт.'}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEATING MODAL (ONLY TEAM MEMBERS FROM PARTICIPANTS) */}
      {/* ========================================================================= */}
      {seatTargetIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-black text-stone-900 uppercase flex items-center gap-2">
                  <UserPlus className="text-amber-500" size={20} />
                  <span>Посадить соратника на Место №{seatTargetIndex + 1}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Только реальные члены команды Негодяев с заработанными монетами
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSeatTargetIndex(null);
                  setMemberSearch('');
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Поиск соратника по имени или никнейму..."
                className="w-full px-3.5 py-2 pl-9 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            </div>

            {/* List of team members */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  Соратники не найдены
                </div>
              ) : (
                filteredParticipants.map(participant => {
                  const participantCoins = coins.filter(c => c.participantId === participant.id);
                  const coinCount = participantCoins.length;
                  const isAlreadySeated = seats.some(s => s?.participantId === participant.id);
                  const cannotPlay = coinCount <= 0;

                  return (
                    <div
                      key={participant.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isAlreadySeated
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : cannotPlay
                          ? 'bg-rose-50/40 border-rose-200/80'
                          : 'bg-white border-stone-200 hover:border-amber-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getParticipantAvatar(participant)}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full object-cover border border-stone-300 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-stone-900 truncate">
                              {participant.name}
                            </span>
                            {participant.nickname && (
                              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                                «{participant.nickname}»
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-black flex items-center gap-0.5 ${
                              cannotPlay ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              <span>🪙</span>
                              <span>{coinCount} {cannotPlay ? 'монет (пусто)' : 'монет'}</span>
                            </span>
                            <span className="text-[10px] text-stone-400">
                              • {participant.role === 'admin' ? 'Капитан' : 'Соратник'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAlreadySeated ? (
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-200/70 px-2 py-1 rounded-lg">
                            Уже за столом
                          </span>
                        ) : cannotPlay ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">
                            0 монет
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSeatParticipant(seatTargetIndex, participant, coinCount)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase rounded-xl transition-transform active:scale-95 shadow-xs cursor-pointer"
                          >
                            Посадить ({coinCount} 🪙)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HAND HISTORY MODAL */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900 uppercase flex items-center gap-2">
                <History className="text-amber-500" size={18} />
                <span>История покерных раздач</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {handHistory.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Пока не сыграно ни одной раздачи в этой сессии.
                </div>
              ) : (
                handHistory.map(record => (
                  <div key={record.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">Раздача #{record.handNumber}</span>
                        <span className="text-[10px] text-stone-400">{record.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        Победитель: {record.winnerNames.join(', ')}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {record.winningHandDescription}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-amber-600 text-sm">+{record.potAmount} 🪙</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RULES / POKER COMBINATIONS MODAL */}
      {/* ========================================================================= */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900 uppercase flex items-center gap-2">
                <HelpCircle className="text-amber-500" size={18} />
                <span>Иерархия комбинаций покера</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { rank: 'Роял-флеш', desc: '10, J, Q, K, A одной масти', example: 'A♠ K♠ Q♠ J♠ 10♠' },
                { rank: 'Стрит-флеш', desc: '5 последовательных карт одной масти', example: '9♥ 8♥ 7♥ 6♥ 5♥' },
                { rank: 'Каре', desc: '4 карты одного достоинства', example: 'K♠ K♥ K♦ K♣' },
                { rank: 'Фулл-хаус', desc: 'Тройка + Пара', example: 'Q♠ Q♥ Q♦ 10♣ 10♦' },
                { rank: 'Флеш', desc: '5 карт одной масти', example: 'Любые 5 червей ♥' },
                { rank: 'Стрит', desc: '5 последовательных карт любой масти', example: '8♠ 7♥ 6♦ 5♣ 4♠' },
                { rank: 'Сет / Тройка', desc: '3 карты одного достоинства', example: '7♠ 7♥ 7♦' },
                { rank: 'Две пары', desc: 'Две различные пары', example: 'J♠ J♥ 4♦ 4♣' },
                { rank: 'Пара', desc: '2 карты одного достоинства', example: 'A♠ A♥' },
                { rank: 'Старшая карта', desc: 'При отсутствии комбинаций побеждает старшая карта', example: 'Туз старший' }
              ].map((item, idx) => (
                <div key={idx} className="p-2 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-black text-stone-900">{idx + 1}. {item.rank}</span>
                    <p className="text-[11px] text-stone-500">{item.desc}</p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {item.example}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
