import React, { useState } from 'react';
import { Gamepad2, Trophy, BookOpen, Flame, HelpCircle } from 'lucide-react';
import { Participant, RallyCoin } from '../../../types';
import MKEmulatorView from './MKEmulatorView';
import MKTournamentBracket from './MKTournamentBracket';
import MKFatalityGuide from './MKFatalityGuide';

interface MKTournamentHubProps {
  participants: Participant[];
  coins: RallyCoin[];
  currentUser: Participant | null;
  isCaptain: boolean;
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune' | 'poker' | 'mortal_kombat';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
}

export default function MKTournamentHub({
  participants,
  coins,
  currentUser,
  isCaptain,
  onAwardCoin
}: MKTournamentHubProps) {
  const [subTab, setSubTab] = useState<'emulator' | 'bracket' | 'guide'>('emulator');

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-5xl mx-auto">
      
      {/* MK HUB TOP HEADER */}
      <div className="bg-gradient-to-r from-[#200705] via-[#350d09] to-[#200705] border-2 border-red-900/60 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/60 border-2 border-amber-500/80 flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
            🐉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-amber-400">
                Mortal Kombat Турнир
              </h2>
              <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                MK Арена
              </span>
            </div>
            <p className="text-xs text-stone-300">
              Эмулятор ретро-консолей (Sega / PS1), загрузка любых ROM-файлов и турнир на монеты Негодяев!
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-red-950">
          <button
            type="button"
            onClick={() => setSubTab('emulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'emulator'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={14} />
            <span>Эмулятор</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('bracket')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'bracket'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Trophy size={14} />
            <span>Сетка боёв</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'guide'
                ? 'bg-stone-800 text-amber-400 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Комбо & Фаталити</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SUBTAB CONTENT */}
      {subTab === 'emulator' && (
        <MKEmulatorView
          currentUser={currentUser}
          participants={participants}
        />
      )}

      {subTab === 'bracket' && (
        <MKTournamentBracket
          participants={participants}
          coins={coins}
          currentUser={currentUser}
          isCaptain={isCaptain}
          onAwardCoin={onAwardCoin}
        />
      )}

      {subTab === 'guide' && (
        <MKFatalityGuide />
      )}

    </div>
  );
}
