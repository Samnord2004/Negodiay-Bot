import React, { useState } from 'react';
import { 
  Award, Trophy, Sparkles, Crown, HelpCircle, User, 
  ArrowLeft, Flame, Tent, Shield
} from 'lucide-react';
import { Participant, RallyCoin } from '../../types';
import ParticipantCoinCabinet from './ParticipantCoinCabinet';
import CaptainCoinPanel from './CaptainCoinPanel';
import WheelOfFortune from './WheelOfFortune';
import CoinLeaderboard from './CoinLeaderboard';
import GameRulesBlock from './GameRulesBlock';

interface RallyGameHubProps {
  participants: Participant[];
  coins: RallyCoin[];
  currentUser: Participant | null;
  isCaptain: boolean;
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
  onDeleteCoin: (coinId: string) => Promise<void> | void;
  onOpenProfileEdit?: () => void;
}

export type GameSubTab = 'cabinet' | 'leaderboard' | 'wheel' | 'captain' | 'rules';

export default function RallyGameHub({
  participants,
  coins,
  currentUser,
  isCaptain,
  onAwardCoin,
  onDeleteCoin,
  onOpenProfileEdit
}: RallyGameHubProps) {
  const [activeTab, setActiveTab] = useState<GameSubTab>('cabinet');
  const [inspectedParticipant, setInspectedParticipant] = useState<Participant | null>(null);

  // Participant to display in Cabinet: inspected participant if set, else currentUser, else first participant
  const displayParticipant = inspectedParticipant || currentUser || participants[0];

  // User's coins count
  const myCoinCount = coins.filter(c => c.participantId === (currentUser?.id || displayParticipant?.id)).length;

  const handleSelectOtherParticipant = (p: Participant) => {
    setInspectedParticipant(p);
    setActiveTab('cabinet');
  };

  const handleBackToMyCabinet = () => {
    setInspectedParticipant(null);
    setActiveTab('cabinet');
  };

  return (
    <div className="space-y-6">
      
      {/* GAME NAVIGATION SUB-BAR */}
      <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setInspectedParticipant(null);
              setActiveTab('cabinet');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cabinet' && !inspectedParticipant
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>🪙 Мой кабинет</span>
            <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {myCoinCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Trophy size={14} />
            <span>Таблица лидеров</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wheel')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'wheel'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Sparkles size={14} />
            <span>Колесо Фортуны</span>
          </button>

          {/* Captain Tab ONLY visible to Captain */}
          {isCaptain && (
            <button
              type="button"
              onClick={() => setActiveTab('captain')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'captain'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Crown size={14} className="text-yellow-300" />
              <span>Панель капитана</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <HelpCircle size={14} />
            <span>Правила игры</span>
          </button>
        </div>

        {/* Inspected participant indicator */}
        {inspectedParticipant && activeTab === 'cabinet' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs">
            <span className="text-amber-800 font-medium">
              Кабинет соратника: <strong>{inspectedParticipant.nickname || inspectedParticipant.name}</strong>
            </span>
            <button
              type="button"
              onClick={handleBackToMyCabinet}
              className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-0.5 ml-1"
            >
              <ArrowLeft size={12} />
              <span>К моему кабинету</span>
            </button>
          </div>
        )}

      </div>

      {/* SUBTAB CONTENT */}
      {activeTab === 'cabinet' && displayParticipant && (
        <ParticipantCoinCabinet
          participant={displayParticipant}
          coins={coins}
          allParticipants={participants}
          allCoins={coins}
          onOpenProfileEdit={onOpenProfileEdit}
          onSelectOtherParticipant={handleSelectOtherParticipant}
        />
      )}

      {activeTab === 'leaderboard' && (
        <CoinLeaderboard
          participants={participants}
          coins={coins}
          onSelectParticipant={handleSelectOtherParticipant}
        />
      )}

      {activeTab === 'wheel' && (
        <WheelOfFortune
          participants={participants}
          coins={coins}
          currentUser={currentUser}
          isAdmin={isCaptain}
          onAwardCoin={onAwardCoin}
        />
      )}

      {activeTab === 'captain' && isCaptain && (
        <CaptainCoinPanel
          participants={participants}
          coins={coins}
          onAwardCoin={onAwardCoin}
          onDeleteCoin={onDeleteCoin}
          captainUser={currentUser}
        />
      )}

      {activeTab === 'rules' && (
        <GameRulesBlock />
      )}

    </div>
  );
}
