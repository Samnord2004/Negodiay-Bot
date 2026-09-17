import React, { useState } from 'react';
import { 
  Trophy, Medal, Crown, Filter, Search, Award, 
  Sparkles, ChevronRight, UserCheck, Flame
} from 'lucide-react';
import { Participant, RallyCoin, GAME_LEVELS } from '../../types';
import { getParticipantAvatar } from '../../utils/avatar';
import RallyCoinVisual from './RallyCoinVisual';

interface CoinLeaderboardProps {
  participants: Participant[];
  coins: RallyCoin[];
  onSelectParticipant?: (p: Participant) => void;
}

export type LeaderboardPeriod = 'all' | 'year' | 'month';

export default function CoinLeaderboard({
  participants,
  coins,
  onSelectParticipant
}: CoinLeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [search, setSearch] = useState('');

  const now = new Date();
  const currentYear = 2026;
  const currentMonth = now.getMonth();

  // Filter coins by period
  const filteredCoins = coins.filter(c => {
    const coinDate = new Date(c.awardedAt);
    if (period === 'year') {
      return (c.year === currentYear) || (coinDate.getFullYear() === currentYear);
    }
    if (period === 'month') {
      return coinDate.getMonth() === currentMonth && coinDate.getFullYear() === currentYear;
    }
    return true;
  });

  // Calculate coins count per participant
  const activeParticipants = participants.filter(p => p.accountStatus !== 'rejected');
  
  const coinCounts = new Map<string, number>();
  activeParticipants.forEach(p => coinCounts.set(p.id, 0));
  filteredCoins.forEach(c => {
    coinCounts.set(c.participantId, (coinCounts.get(c.participantId) || 0) + 1);
  });

  // Sort by coins descending, then by name
  const sortedList = [...activeParticipants].sort((a, b) => {
    const countA = coinCounts.get(a.id) || 0;
    const countB = coinCounts.get(b.id) || 0;
    if (countB !== countA) return countB - countA;
    return (a.nickname || a.name).localeCompare(b.nickname || b.name);
  });

  // Filter search
  const visibleList = sortedList.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q);
  });

  // Top 3
  const top1 = sortedList[0];
  const top2 = sortedList[1];
  const top3 = sortedList[2];

  const top1Count = top1 ? coinCounts.get(top1.id) || 0 : 0;
  const top2Count = top2 ? coinCounts.get(top2.id) || 0 : 0;
  const top3Count = top3 ? coinCounts.get(top3.id) || 0 : 0;

  return (
    <div className="space-y-8">
      
      {/* HEADER WITH FILTERS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            <span>Таблица лидеров игры «Скидка на слёт»</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Рейтинг активности Негодяев. Лидер освобождается от вступительного взноса!
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'month'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Текущий месяц
          </button>
          <button
            type="button"
            onClick={() => setPeriod('year')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'year'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Слёт 2026
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'all'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Всё время
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {sortedList.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          
          {/* SILVER - 2ND PLACE */}
          {top2 ? (
            <div 
              onClick={() => onSelectParticipant?.(top2)}
              className="bg-gradient-to-b from-stone-100 to-stone-200/80 border-2 border-slate-300 rounded-3xl p-5 text-center shadow-sm order-2 md:order-1 transition-transform hover:scale-102 cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center mx-auto mb-2 border border-white shadow-xs">
                🥈 2
              </div>
              <img 
                src={getParticipantAvatar(top2)} 
                alt={top2.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-400 shadow-sm"
              />
              <div className="font-black text-stone-900 text-sm mt-2 truncate">
                {top2.name}
              </div>
              <div className="text-xs text-stone-600 font-bold">
                «{top2.nickname || top2.name}»
              </div>
              <div className="mt-3 bg-white/90 py-1.5 px-3 rounded-xl border border-slate-300 inline-block font-black text-slate-800 text-xs">
                🪙 {top2Count} {top2Count === 1 ? 'монета' : 'монет'}
              </div>
            </div>
          ) : (
            <div className="order-2 md:order-1" />
          )}

          {/* GOLD - 1ST PLACE (BIGGEST & GLOWING) */}
          {top1 && (
            <div 
              onClick={() => onSelectParticipant?.(top1)}
              className="bg-gradient-to-b from-amber-100 via-yellow-100 to-amber-200 border-2 border-amber-400 rounded-3xl p-6 text-center shadow-lg order-1 md:order-2 transition-transform hover:scale-102 cursor-pointer relative ring-4 ring-amber-300/40"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-stone-950 font-black text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full border border-yellow-200 shadow-xs flex items-center gap-1">
                <Crown size={13} />
                <span>Претендент на приз!</span>
              </div>

              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-stone-950 font-black text-base flex items-center justify-center mx-auto mb-2 border-2 border-white shadow-md">
                🥇 1
              </div>

              <img 
                src={getParticipantAvatar(top1)} 
                alt={top1.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover mx-auto border-3 border-yellow-400 shadow-md"
              />

              <div className="font-black text-stone-950 text-base mt-2 truncate">
                {top1.name}
              </div>
              <div className="text-xs text-amber-900 font-bold">
                «{top1.nickname || top1.name}»
              </div>

              <div className="mt-3 bg-yellow-400/90 py-2 px-4 rounded-2xl border border-yellow-300 inline-block font-black text-stone-950 text-sm shadow-xs">
                🪙 {top1Count} {top1Count === 1 ? 'монета' : 'монет'}
              </div>

              <div className="text-[10px] text-amber-900 font-bold mt-2 bg-amber-50/80 py-1 px-2 rounded-lg">
                🏕️ Вступительный взнос 0 ₽ (Оплата из Фонда)
              </div>
            </div>
          )}

          {/* BRONZE - 3RD PLACE */}
          {top3 ? (
            <div 
              onClick={() => onSelectParticipant?.(top3)}
              className="bg-gradient-to-b from-amber-50 to-orange-100/70 border-2 border-amber-600/40 rounded-3xl p-5 text-center shadow-sm order-3 md:order-3 transition-transform hover:scale-102 cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-full bg-amber-600/70 text-white font-black text-sm flex items-center justify-center mx-auto mb-2 border border-white shadow-xs">
                🥉 3
              </div>
              <img 
                src={getParticipantAvatar(top3)} 
                alt={top3.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-amber-600/50 shadow-sm"
              />
              <div className="font-black text-stone-900 text-sm mt-2 truncate">
                {top3.name}
              </div>
              <div className="text-xs text-stone-600 font-bold">
                «{top3.nickname || top3.name}»
              </div>
              <div className="mt-3 bg-white/90 py-1.5 px-3 rounded-xl border border-amber-300 inline-block font-black text-amber-900 text-xs">
                🪙 {top3Count} {top3Count === 1 ? 'монета' : 'монет'}
              </div>
            </div>
          ) : (
            <div className="order-3 md:order-3" />
          )}

        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-black text-stone-900 text-base">
              Полный список участников ({visibleList.length})
            </h3>
            <span className="text-xs text-stone-400">
              Нажмите на участника, чтобы открыть его личный кабинет монеток
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени / позывному..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="divide-y divide-stone-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-stone-400 border-b border-stone-200 pb-2">
                <th className="py-3 px-2 font-bold w-12 text-center">Место</th>
                <th className="py-3 px-3 font-bold">Участник</th>
                <th className="py-3 px-3 font-bold">Роль в лагере</th>
                <th className="py-3 px-3 font-bold">Ранг</th>
                <th className="py-3 px-3 font-bold text-center">Монетки</th>
                <th className="py-3 px-2 font-bold text-right">Кабинет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visibleList.map((p, idx) => {
                const count = coinCounts.get(p.id) || 0;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                
                const level = GAME_LEVELS.slice().reverse().find(l => count >= l.minCoins) || GAME_LEVELS[0];

                return (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectParticipant?.(p)}
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-2 text-center font-black text-sm text-stone-700">
                      {medal}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getParticipantAvatar(p)} 
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <div className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            «{p.nickname || p.name}»
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-stone-600">
                      {p.roleTitle || (p.role === 'admin' ? 'Капитан' : 'Негодяй')}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${level.color} ${level.textColor}`}>
                        {level.title}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-amber-800 text-sm bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                        <span>🪙</span>
                        <span>{count}</span>
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right text-stone-400 group-hover:text-amber-700">
                      <ChevronRight size={16} className="inline group-hover:translate-x-1 transition-transform" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
