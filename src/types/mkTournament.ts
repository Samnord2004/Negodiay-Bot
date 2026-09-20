export type MKConsoleCore = 'segaMD' | 'psx' | 'snes' | 'arcade';

export interface MKFighter {
  id: string;
  name: string;
  alias: string;
  title: string;
  avatarUrl: string;
  realm: string;
  specialMoves: { name: string; combo: string }[];
  fatality: { name: string; distance: string; combo: string };
  color: string;
}

export interface MKBoutBet {
  id: string;
  participantId: string;
  participantName: string;
  betOnParticipantId: string;
  amount: number;
}

export type FinishType = 'normal' | 'fatality' | 'brutality' | 'friendship' | 'babality';

export interface MKBout {
  id: string;
  roundName: string; // '1/4 финала', 'Полуфинал', 'Финал'
  player1: {
    participantId: string;
    name: string;
    nickname: string;
    avatar: string;
    fighterId: string;
    score: number;
  };
  player2: {
    participantId: string;
    name: string;
    nickname: string;
    avatar: string;
    fighterId: string;
    score: number;
  };
  status: 'pending' | 'active' | 'completed';
  winnerParticipantId?: string;
  finishType?: FinishType;
  coinPrize: number;
  bets: MKBoutBet[];
}

export interface MKTournamentState {
  id: string;
  title: string;
  date: string;
  status: 'registration' | 'in_progress' | 'completed';
  bouts: MKBout[];
  championId?: string;
  totalPrizePool: number;
}
