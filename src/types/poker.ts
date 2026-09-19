export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  suit: CardSuit;
  value: number; // 2 - 14 (11=J, 12=Q, 13=K, 14=A)
}

export type HandRankType = 
  | 'high_card'
  | 'one_pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

export interface HandEvaluation {
  score: number; // For comparison
  rank: HandRankType;
  rankName: string; // e.g. "Фулл-хаус", "Две пары"
  description: string;
  bestCards: Card[];
}

export type GameStage = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';

export interface PokerPlayer {
  id: string;
  participantId: string;
  name: string;
  nickname: string;
  avatar: string;
  isUser: boolean;
  seatIndex: number; // 0 to 5
  chips: number; // Coin chips
  currentRoundBet: number;
  totalHandBet: number;
  cards: Card[];
  folded: boolean;
  isAllIn: boolean;
  isSittingOut: boolean;
  speechBubble?: string;
  speechTimeout?: any;
  lastAction?: {
    type: PlayerAction;
    amount?: number;
    text: string;
  };
  personality?: 'aggressive' | 'tight' | 'bluffer' | 'loose' | 'balanced';
}

export interface HandHistoryRecord {
  id: string;
  handNumber: number;
  winnerNames: string[];
  potAmount: number;
  winningHandDescription: string;
  timestamp: string;
  isCoinHand: boolean;
}

export type PokerGameMode = 'coins' | 'chips'; // На реальные монеты Негодяев или на тренировочные фишки
