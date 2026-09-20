import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { 
  Card, GameStage, HandEvaluation, HandHistoryRecord, 
  PlayerAction, PokerPlayer, PokerRoomPublicState 
} from '../src/types/poker';
import { 
  createDeck, shuffleDeck, evaluateHoldemHand 
} from '../src/utils/pokerEvaluator';
import { getRallyCoins, saveRallyCoins, getParticipants } from '../db';
import { getParticipantAvatar } from '../src/utils/avatar';

interface ConnectedClient {
  ws: WebSocket;
  participantId?: string;
  name?: string;
  nickname?: string;
  avatar?: string;
}

class PokerRoomServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<ConnectedClient> = new Set();

  // Authoritative Server State
  private seats: (PokerPlayer | null)[] = [null, null, null, null, null, null];
  private privateHoleCards: Record<number, Card[]> = {}; // seatIndex -> private cards
  private deck: Card[] = [];
  private communityCards: Card[] = [];
  private gameStage: GameStage = 'waiting';
  private pot: number = 0;
  private currentBetToCall: number = 0;
  private activeTurnSeat: number = -1;
  private dealerSeat: number = 0;
  private handCount: number = 1;
  private handWinners: { player: PokerPlayer; evaluation: HandEvaluation; wonAmount: number }[] = [];
  private handHistory: HandHistoryRecord[] = [];
  private statusMessage: string = 'Добро пожаловать за онлайн-стол Негодяев! Займите свободное место.';

  public init(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/poker' });

    this.wss.on('connection', (ws: WebSocket) => {
      const client: ConnectedClient = { ws };
      this.clients.add(client);

      // Send initial state immediately
      this.sendStateToClient(client);

      ws.on('message', (raw: string) => {
        try {
          const data = JSON.parse(raw.toString());
          this.handleClientMessage(client, data);
        } catch (err) {
          console.error('[Poker WS] Error parsing message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(client);
        this.broadcastState();
      });

      ws.on('error', (err) => {
        console.error('[Poker WS] Client error:', err);
        this.clients.delete(client);
      });
    });

    console.log('[Poker WS] Multiplayer Poker Room initialized on /ws/poker');
  }

  // Handle incoming actions from connected players
  private handleClientMessage(client: ConnectedClient, msg: any) {
    switch (msg.type) {
      case 'auth': {
        if (msg.participant) {
          client.participantId = msg.participant.id;
          client.name = msg.participant.name;
          client.nickname = msg.participant.nickname || msg.participant.name;
          client.avatar = msg.participant.avatar || getParticipantAvatar(msg.participant);

          // Update seat chips if already seated
          this.syncSeatedPlayerCoins(client.participantId);
        }
        this.sendStateToClient(client);
        break;
      }

      case 'sit_down': {
        const { seatIndex, participant } = msg;
        if (typeof seatIndex !== 'number' || seatIndex < 0 || seatIndex >= 6) return;
        if (this.seats[seatIndex] !== null) return;

        const partId = participant?.id || client.participantId;
        if (!partId) return;

        // Check if player is already seated in another seat
        const existingIdx = this.seats.findIndex(s => s?.participantId === partId);
        if (existingIdx !== -1) return;

        // Fetch real coins count
        const allCoins = getRallyCoins();
        const userCoinCount = allCoins.filter(c => c.participantId === partId).length;

        const name = participant?.name || client.name || 'Соратник';
        const nickname = participant?.nickname || client.nickname || name;
        const avatar = participant?.avatar || client.avatar || getParticipantAvatar(participant || { id: partId, name });

        this.seats[seatIndex] = {
          id: partId,
          participantId: partId,
          name,
          nickname,
          avatar,
          isUser: true,
          seatIndex,
          chips: userCoinCount,
          currentRoundBet: 0,
          totalHandBet: 0,
          cards: [],
          folded: false,
          isAllIn: false,
          isSittingOut: false
        };

        this.statusMessage = `${name} сел(а) за место №${seatIndex + 1} (${userCoinCount} 🪙)`;
        this.broadcastState();
        break;
      }

      case 'stand_up': {
        const { seatIndex } = msg;
        if (typeof seatIndex !== 'number' || seatIndex < 0 || seatIndex >= 6) return;
        if (this.gameStage !== 'waiting' && this.gameStage !== 'showdown') return;

        const player = this.seats[seatIndex];
        if (!player) return;

        this.seats[seatIndex] = null;
        delete this.privateHoleCards[seatIndex];
        this.statusMessage = `${player.name} встал(а) из-за стола`;
        this.broadcastState();
        break;
      }

      case 'start_hand': {
        this.startNewHand();
        break;
      }

      case 'player_action': {
        const { action, raiseAmount } = msg;
        this.handlePlayerAction(client, action, raiseAmount);
        break;
      }

      case 'bluff': {
        const { text, seatIndex } = msg;
        if (typeof seatIndex === 'number' && this.seats[seatIndex]) {
          this.seats[seatIndex]!.speechBubble = text;
          this.broadcast({
            type: 'chat_bluff',
            seatIndex,
            text
          });
          this.broadcastState();

          setTimeout(() => {
            if (this.seats[seatIndex]) {
              this.seats[seatIndex]!.speechBubble = undefined;
              this.broadcastState();
            }
          }, 3500);
        }
        break;
      }
    }
  }

  // Synchronize seat chips with real DB coins
  private syncSeatedPlayerCoins(participantId?: string) {
    const allCoins = getRallyCoins();
    this.seats = this.seats.map(p => {
      if (!p) return null;
      if (!participantId || p.participantId === participantId) {
        const realCount = allCoins.filter(c => c.participantId === p.participantId).length;
        return { ...p, chips: realCount };
      }
      return p;
    });
  }

  // START NEW HAND
  public startNewHand() {
    if (this.gameStage !== 'waiting' && this.gameStage !== 'showdown') return;

    // Refresh coin balances for all seated players
    this.syncSeatedPlayerCoins();

    const activePlayers = this.seats.filter((s): s is PokerPlayer => s !== null && s.chips > 0);
    if (activePlayers.length < 2) {
      this.statusMessage = 'Для раздачи нужно минимум 2 соратника с монетами за столом!';
      this.broadcastState();
      return;
    }

    // Shuffle fresh deck
    const newDeck = shuffleDeck(createDeck());
    this.privateHoleCards = {};

    // Advance dealer button
    let nextDealer = (this.dealerSeat + 1) % 6;
    let guard = 0;
    while ((this.seats[nextDealer] === null || this.seats[nextDealer]?.chips === 0) && guard < 12) {
      nextDealer = (nextDealer + 1) % 6;
      guard++;
    }
    this.dealerSeat = nextDealer;

    // Blinds
    const smallBlindAmount = 1;
    const bigBlindAmount = 2;

    let sbSeat = (nextDealer + 1) % 6;
    guard = 0;
    while ((this.seats[sbSeat] === null || this.seats[sbSeat]?.chips === 0) && guard < 12) {
      sbSeat = (sbSeat + 1) % 6;
      guard++;
    }

    let bbSeat = (sbSeat + 1) % 6;
    guard = 0;
    while ((this.seats[bbSeat] === null || this.seats[bbSeat]?.chips === 0) && guard < 12) {
      bbSeat = (bbSeat + 1) % 6;
      guard++;
    }

    let deckIdx = 0;
    let initialPot = 0;

    this.seats = this.seats.map((player, idx) => {
      if (!player || player.chips <= 0) return player;

      const card1 = newDeck[deckIdx++];
      const card2 = newDeck[deckIdx++];
      this.privateHoleCards[idx] = [card1, card2];

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

    this.deck = newDeck.slice(deckIdx);
    this.communityCards = [];
    this.pot = initialPot;
    this.currentBetToCall = bigBlindAmount;
    this.gameStage = 'preflop';
    this.handWinners = [];

    // First turn after BB
    let firstTurn = (bbSeat + 1) % 6;
    guard = 0;
    while ((this.seats[firstTurn] === null || this.seats[firstTurn]?.folded || this.seats[firstTurn]?.isAllIn) && guard < 12) {
      firstTurn = (firstTurn + 1) % 6;
      guard++;
    }
    this.activeTurnSeat = firstTurn;

    const activePlayer = this.seats[firstTurn];
    this.statusMessage = `Раздача #${this.handCount}! Префлоп. Банк: ${initialPot} 🪙. Ход: ${activePlayer?.name}`;

    this.broadcastSound('deal');
    this.broadcastState();
  }

  // PLAYER ACTION HANDLER
  private handlePlayerAction(client: ConnectedClient, action: PlayerAction, customRaiseAmount?: number) {
    if (this.gameStage === 'waiting' || this.gameStage === 'showdown') return;
    if (this.activeTurnSeat === -1) return;

    const player = this.seats[this.activeTurnSeat];
    if (!player) return;

    // Verify caller is the active seat player (or allow captain override if requested)
    if (client.participantId && client.participantId !== player.participantId) {
      return;
    }

    let newChips = player.chips;
    let newBet = player.currentRoundBet;
    let actionText = '';
    let addedToPot = 0;

    const callDiff = this.currentBetToCall - player.currentRoundBet;

    switch (action) {
      case 'fold':
        actionText = 'Пас';
        this.broadcastSound('fold');
        break;

      case 'check':
        actionText = 'Чек';
        this.broadcastSound('check');
        break;

      case 'call': {
        const pay = Math.min(callDiff, player.chips);
        newChips -= pay;
        newBet += pay;
        addedToPot = pay;
        actionText = pay === player.chips ? `Колл Ва-банк (${pay} 🪙)` : `Колл (${pay} 🪙)`;
        this.broadcastSound('chip');
        break;
      }

      case 'raise':
      case 'bet': {
        const totalTarget = customRaiseAmount || (this.currentBetToCall + 2);
        const toAdd = totalTarget - player.currentRoundBet;
        const actualAdd = Math.min(toAdd, player.chips);
        newChips -= actualAdd;
        newBet += actualAdd;
        addedToPot = actualAdd;
        this.currentBetToCall = newBet;
        actionText = actualAdd === player.chips ? `Ва-банк (${newBet} 🪙)` : `Рейз (${newBet} 🪙)`;
        this.broadcastSound('chip');
        break;
      }

      case 'all_in': {
        const allInAdd = player.chips;
        newChips = 0;
        newBet += allInAdd;
        addedToPot = allInAdd;
        if (newBet > this.currentBetToCall) {
          this.currentBetToCall = newBet;
        }
        actionText = `Ва-банк (${newBet} 🪙)!`;
        this.broadcastSound('chip');
        break;
      }
    }

    this.seats[this.activeTurnSeat] = {
      ...player,
      chips: newChips,
      currentRoundBet: newBet,
      totalHandBet: player.totalHandBet + addedToPot,
      folded: action === 'fold' ? true : player.folded,
      isAllIn: newChips === 0,
      lastAction: {
        type: action,
        amount: newBet,
        text: actionText
      }
    };

    this.pot += addedToPot;
    this.advanceTurn();
  }

  // ADVANCE TURN OR DEAL NEXT STREET
  private advanceTurn() {
    const activeRemaining = this.seats.filter((p): p is PokerPlayer => p !== null && !p.folded);

    // If only 1 player remains, they win immediately!
    if (activeRemaining.length === 1) {
      const winner = activeRemaining[0];
      const winAmount = this.pot;

      this.seats = this.seats.map(p => {
        if (!p) return null;
        return p.id === winner.id ? { ...p, chips: p.chips + winAmount, currentRoundBet: 0 } : p;
      });

      this.gameStage = 'showdown';
      this.activeTurnSeat = -1;
      this.broadcastSound('win');

      const fakeEval: HandEvaluation = {
        score: 1,
        rank: 'high_card',
        rankName: 'Все спасовали',
        description: 'Все остальные спасовали',
        bestCards: this.privateHoleCards[winner.seatIndex] || []
      };

      this.handWinners = [{ player: winner, evaluation: fakeEval, wonAmount: winAmount }];

      const record: HandHistoryRecord = {
        id: 'hand_' + Date.now(),
        handNumber: this.handCount,
        winnerNames: [winner.name],
        potAmount: winAmount,
        winningHandDescription: 'Все соперники сбросили карты (пас)',
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isCoinHand: true
      };
      this.handHistory.unshift(record);
      this.handCount++;

      this.statusMessage = `🏆 ${winner.name} забирает банк ${winAmount} 🪙 (все соперники спасовали)!`;

      // Transfer coins in database
      this.settleCoins(winner, 'Все спасовали');
      this.broadcastState();
      return;
    }

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      this.advanceToNextStreet();
      return;
    }

    // Move to next player
    let nextSeat = (this.activeTurnSeat + 1) % 6;
    let guard = 0;
    while (
      (this.seats[nextSeat] === null || this.seats[nextSeat]?.folded || this.seats[nextSeat]?.isAllIn) &&
      guard < 12
    ) {
      nextSeat = (nextSeat + 1) % 6;
      guard++;
    }

    this.activeTurnSeat = nextSeat;
    const nextPlayer = this.seats[nextSeat];
    if (nextPlayer) {
      this.statusMessage = `Ход соратника: ${nextPlayer.name}. Ставка для уравнивания: ${this.currentBetToCall} 🪙`;
    }
    this.broadcastState();
  }

  private isBettingRoundComplete(): boolean {
    const activeNonAllIn = this.seats.filter((p): p is PokerPlayer => p !== null && !p.folded && !p.isAllIn);
    if (activeNonAllIn.length <= 1) return true;

    const highestBet = Math.max(...this.seats.map(p => p?.currentRoundBet || 0));
    return activeNonAllIn.every(p => p.currentRoundBet === highestBet && p.lastAction !== undefined);
  }

  private advanceToNextStreet() {
    this.seats = this.seats.map(p => p ? { ...p, currentRoundBet: 0 } : null);
    this.currentBetToCall = 0;
    this.broadcastSound('deal');

    if (this.gameStage === 'preflop') {
      const flop = this.deck.slice(0, 3);
      this.deck = this.deck.slice(3);
      this.communityCards = flop;
      this.gameStage = 'flop';
      this.statusMessage = 'Флоп открыт! Раунд торговли.';
    } else if (this.gameStage === 'flop') {
      const turn = this.deck.slice(0, 1);
      this.deck = this.deck.slice(1);
      this.communityCards = [...this.communityCards, ...turn];
      this.gameStage = 'turn';
      this.statusMessage = 'Тёрн открыт!';
    } else if (this.gameStage === 'turn') {
      const river = this.deck.slice(0, 1);
      this.deck = this.deck.slice(1);
      this.communityCards = [...this.communityCards, ...river];
      this.gameStage = 'river';
      this.statusMessage = 'Ривер открыт! Финальный раунд ставок.';
    } else if (this.gameStage === 'river') {
      this.handleShowdown();
      return;
    }

    // Active turn starts after dealer
    let nextSeat = (this.dealerSeat + 1) % 6;
    let guard = 0;
    while (
      (this.seats[nextSeat] === null || this.seats[nextSeat]?.folded || this.seats[nextSeat]?.isAllIn) &&
      guard < 12
    ) {
      nextSeat = (nextSeat + 1) % 6;
      guard++;
    }

    this.activeTurnSeat = nextSeat;
    this.broadcastState();
  }

  private handleShowdown() {
    this.gameStage = 'showdown';
    this.activeTurnSeat = -1;

    const activePlayers = this.seats.filter((p): p is PokerPlayer => p !== null && !p.folded);
    if (activePlayers.length === 0) {
      this.statusMessage = 'Все сбросили карты.';
      this.broadcastState();
      return;
    }

    // Evaluate hands with private cards
    const evaluated = activePlayers.map(p => {
      const holeCards = this.privateHoleCards[p.seatIndex] || p.cards;
      return {
        player: { ...p, cards: holeCards },
        evaluation: evaluateHoldemHand(holeCards, this.communityCards)
      };
    });

    evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score);
    const bestScore = evaluated[0].evaluation.score;
    const winners = evaluated.filter(e => e.evaluation.score === bestScore);

    const winPotEach = Math.floor(this.pot / winners.length);
    this.handWinners = winners.map(w => ({
      ...w,
      wonAmount: winPotEach
    }));

    this.seats = this.seats.map(p => {
      if (!p) return null;
      const isWinner = winners.some(w => w.player.id === p.id);
      const holeCards = this.privateHoleCards[p.seatIndex] || p.cards;
      return {
        ...p,
        cards: holeCards,
        chips: isWinner ? p.chips + winPotEach : p.chips,
        currentRoundBet: 0
      };
    });

    this.broadcastSound('win');

    const primaryWinner = winners[0];
    const record: HandHistoryRecord = {
      id: 'hand_' + Date.now(),
      handNumber: this.handCount,
      winnerNames: winners.map(w => w.player.name),
      potAmount: this.pot,
      winningHandDescription: primaryWinner.evaluation.description,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isCoinHand: true
    };
    this.handHistory.unshift(record);
    this.handCount++;

    const winnerNames = winners.map(w => w.player.name).join(', ');
    this.statusMessage = `🏆 Победитель: ${winnerNames}! Выигрыш: ${this.pot} 🪙 (${primaryWinner.evaluation.description})`;

    // Settle in Database
    this.settleCoins(primaryWinner.player, primaryWinner.evaluation.description);
    this.broadcastState();
  }

  // Settle coins in database
  private settleCoins(winner: PokerPlayer, handDesc: string) {
    const losers = this.seats.filter(
      (p): p is PokerPlayer => p !== null && p.participantId !== winner.participantId && p.totalHandBet > 0
    );

    if (losers.length === 0) return;

    let allCoins = [...getRallyCoins()];

    for (const l of losers) {
      const amount = l.totalHandBet;
      if (amount <= 0) continue;

      let transferred = 0;
      for (let i = 0; i < allCoins.length && transferred < amount; i++) {
        if (allCoins[i].participantId === l.participantId) {
          allCoins[i] = {
            ...allCoins[i],
            participantId: winner.participantId,
            participantName: winner.name,
            participantNickname: winner.nickname || winner.name,
            taskTitle: `Выигрыш в покер у ${l.name}`,
            category: 'poker',
            comment: `Выиграно за покерным столом Негодяев (${handDesc})`,
            awardedAt: new Date().toISOString(),
            awardedBy: 'Покерный стол Негодяев'
          };
          transferred++;
        }
      }

      // If loser has fewer recorded coins, create difference for winner
      if (transferred < amount) {
        const diff = amount - transferred;
        for (let k = 0; k < diff; k++) {
          allCoins.unshift({
            id: "coin_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            participantId: winner.participantId,
            participantName: winner.name,
            participantNickname: winner.nickname || winner.name,
            taskTitle: `Выигрыш в покер у ${l.name}`,
            category: 'poker',
            comment: `Выиграно за покерным столом Негодяев (${handDesc})`,
            awardedAt: new Date().toISOString(),
            awardedBy: 'Покерный стол Негодяев',
            year: 2026
          });
        }
      }
    }

    saveRallyCoins(allCoins);
  }

  // Broadcast state to all connected clients
  private broadcastState() {
    for (const client of this.clients) {
      this.sendStateToClient(client);
    }
  }

  // Send state to single client with hole cards masked appropriately
  public sendStateToClient(client: ConnectedClient) {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    // Mask cards: each player sees only their own cards unless showdown
    const sanitizedSeats = this.seats.map((p, idx) => {
      if (!p) return null;
      const isOwner = client.participantId && p.participantId === client.participantId;
      const isShowdown = this.gameStage === 'showdown';

      if (isOwner || isShowdown) {
        return {
          ...p,
          cards: this.privateHoleCards[idx] || p.cards
        };
      } else {
        // Mask as face-down cards
        const hasCards = (this.privateHoleCards[idx]?.length || 0) === 2 && !p.folded;
        return {
          ...p,
          cards: hasCards ? [{ suit: 'spades' as const, value: 0 }, { suit: 'spades' as const, value: 0 }] : []
        };
      }
    });

    const payload: PokerRoomPublicState = {
      gameStage: this.gameStage,
      pot: this.pot,
      currentBetToCall: this.currentBetToCall,
      activeTurnSeat: this.activeTurnSeat,
      dealerSeat: this.dealerSeat,
      handCount: this.handCount,
      communityCards: this.communityCards,
      seats: sanitizedSeats,
      handWinners: this.handWinners,
      handHistory: this.handHistory,
      statusMessage: this.statusMessage,
      onlineCount: this.clients.size
    };

    client.ws.send(JSON.stringify({
      type: 'sync_state',
      state: payload
    }));
  }

  public getPublicState(participantId?: string): PokerRoomPublicState {
    const sanitizedSeats = this.seats.map((p, idx) => {
      if (!p) return null;
      const isOwner = participantId && p.participantId === participantId;
      const isShowdown = this.gameStage === 'showdown';
      if (isOwner || isShowdown) {
        return { ...p, cards: this.privateHoleCards[idx] || p.cards };
      } else {
        const hasCards = (this.privateHoleCards[idx]?.length || 0) === 2 && !p.folded;
        return {
          ...p,
          cards: hasCards ? [{ suit: 'spades' as const, value: 0 }, { suit: 'spades' as const, value: 0 }] : []
        };
      }
    });

    return {
      gameStage: this.gameStage,
      pot: this.pot,
      currentBetToCall: this.currentBetToCall,
      activeTurnSeat: this.activeTurnSeat,
      dealerSeat: this.dealerSeat,
      handCount: this.handCount,
      communityCards: this.communityCards,
      seats: sanitizedSeats,
      handWinners: this.handWinners,
      handHistory: this.handHistory,
      statusMessage: this.statusMessage,
      onlineCount: this.clients.size
    };
  }

  private broadcast(data: any) {
    const raw = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(raw);
      }
    }
  }

  private broadcastSound(sound: 'deal' | 'chip' | 'fold' | 'check' | 'win' | 'bluff') {
    this.broadcast({
      type: 'sound',
      sound
    });
  }
}

export const pokerRoomServer = new PokerRoomServer();
