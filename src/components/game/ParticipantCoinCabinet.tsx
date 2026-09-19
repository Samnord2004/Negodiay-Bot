import React, { useState } from 'react';
import { 
  Trophy, Award, Sparkles, Calendar, User, Camera, 
  CheckCircle2, ArrowRight, Shield, Flame, Filter, ChevronRight
} from 'lucide-react';
import { Participant, RallyCoin, GAME_LEVELS, GameLevelInfo } from '../../types';
import { getParticipantAvatar } from '../../utils/avatar';
import RallyCoinVisual from './RallyCoinVisual';

interface ParticipantCoinCabinetProps {
  participant: Participant;
  coins: RallyCoin[];
  allParticipants: Participant[];
  allCoins: RallyCoin[];
  onOpenProfileEdit?: () => void;
  onSelectOtherParticipant?: (p: Participant) => void;
}

export default function ParticipantCoinCabinet({
  participant,
  coins,
  allParticipants,
  allCoins,
  onOpenProfileEdit,
  onSelectOtherParticipant
}: ParticipantCoinCabinetProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCoin, setSelectedCoin] = useState<RallyCoin | null>(null);

  // Coins awarded to this specific participant
  const userCoins = coins.filter(c => c.participantId === participant.id);
  const totalCount = userCoins.length;

  // Calculate current level and next milestone
  const currentLevelInfo: GameLevelInfo = 
    GAME_LEVELS.slice().reverse().find(lvl => totalCount >= lvl.minCoins) || GAME_LEVELS[0];

  const nextLevelInfo = GAME_LEVELS.find(lvl => lvl.level === currentLevelInfo.level + 1);

  // Calculate progress percent to next level
  let progressPercent = 100;
  let coinsNeeded = 0;
  if (nextLevelInfo) {
    const min = currentLevelInfo.minCoins;
    const max = nextLevelInfo.minCoins;
    const currentDiff = totalCount - min;
    const targetDiff = max - min;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentDiff / targetDiff) * 100)));
    coinsNeeded = nextLevelInfo.minCoins - totalCount;
  }

  // Calculate leaderboard rank
  const countsByParticipant = new Map<string, number>();
  allParticipants.forEach(p => countsByParticipant.set(p.id, 0));
  allCoins.forEach(c => {
    countsByParticipant.set(c.participantId, (countsByParticipant.get(c.participantId) || 0) + 1);
  });
  
  const sortedParticipants = [...allParticipants].sort((a, b) => {
    const cA = countsByParticipant.get(a.id) || 0;
    const cB = countsByParticipant.get(b.id) || 0;
    return cB - cA;
  });

  const rank = sortedParticipants.findIndex(p => p.id === participant.id) + 1;
  const isLeader = rank === 1 && totalCount > 0;

  // Filtered coins
  const filteredCoins = userCoins.filter(coin => {
    if (activeCategory === 'all') return true;
    return coin.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* HERO CARD: PARTICIPANT PROFILE & MINTED COIN */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 md:p-8 border border-stone-800 shadow-xl relative overflow-hidden">
        
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left: User Identity & Avatar Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left flex-1">
            
            {/* Avatar with Dual-Photo Preview Indicator */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-stone-800">
                <img 
                  src={getParticipantAvatar(participant)} 
                  alt={participant.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-[11px] px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-sm flex items-center gap-1">
                <span>🪙</span>
                <span>{totalCount}</span>
              </div>
            </div>

            {/* Name, Nickname and Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                  {currentLevelInfo.title}
                </span>
                
                {isLeader ? (
                  <span className="bg-yellow-400 text-stone-950 font-black text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs animate-pulse">
                    <Trophy size={12} />
                    <span>Лидер слёта (100% скидка!)</span>
                  </span>
                ) : (
                  <span className="bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold px-2 py-0.5 rounded-lg">
                    {rank > 0 ? `${rank}-е место в рейтинге` : 'В начале пути'}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {participant.name}
              </h2>
              
              <div className="text-amber-300 font-bold text-sm flex items-center justify-center sm:justify-start gap-2">
                <span>Позывной: «{participant.nickname || participant.name}»</span>
                {participant.roleTitle && (
                  <span className="text-stone-400 text-xs font-normal">
                    • {participant.roleTitle}
                  </span>
                )}
              </div>

              {/* Photo Front & Profile status */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-stone-300">
                <div className="flex items-center gap-1">
                  <span className={participant.photoFront ? "text-emerald-400" : "text-stone-500"}>
                    {participant.photoFront ? "✓" : "—"}
                  </span>
                  <span>Анфас</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={participant.photoProfile ? "text-emerald-400" : "text-amber-400"}>
                    {participant.photoProfile ? "✓" : "—"}
                  </span>
                  <span>Фото профиль {participant.photoProfile ? "(в чеканке)" : "(рекомендуется)"}</span>
                </div>

                {onOpenProfileEdit && (
                  <button
                    type="button"
                    onClick={onOpenProfileEdit}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 ml-1"
                  >
                    <Camera size={12} />
                    <span>Загрузить фото профиля</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Big Minted Coin with Silhouette */}
          <div className="flex flex-col items-center bg-stone-900/80 p-4 rounded-3xl border border-stone-800 shadow-inner">
            <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-widest mb-2">
              Именная монета участника
            </span>
            <RallyCoinVisual 
              participant={participant} 
              size="hero" 
              interactive={true} 
            />
            <span className="text-[10px] text-stone-400 mt-2 italic">
              Силуэт профиля • Кликните для переворота
            </span>
          </div>

        </div>

        {/* PROGRESS BAR TO NEXT LEVEL */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Прогресс ранга:</span>
              <span className="text-amber-400 font-bold">{currentLevelInfo.title}</span>
              {nextLevelInfo && (
                <>
                  <ArrowRight size={14} className="text-stone-500" />
                  <span className="text-stone-300">{nextLevelInfo.title}</span>
                </>
              )}
            </div>

            <div className="text-xs font-bold text-stone-300">
              {nextLevelInfo ? (
                <span>
                  Собрано <strong className="text-amber-400 font-black">{totalCount}</strong> из {nextLevelInfo.minCoins} монет ({coinsNeeded} до следующего уровня)
                </span>
              ) : (
                <span className="text-yellow-400 font-black">
                  ★ Максимальный ранг легенды Негодяев!
                </span>
              )}
            </div>
          </div>

          {/* Bar track */}
          <div className="w-full bg-stone-800 rounded-full h-3.5 p-0.5 border border-stone-700/80 overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-700 shadow-xs relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Level Markers (10, 25, 50) */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
            {GAME_LEVELS.map(lvl => {
              const isAchieved = totalCount >= lvl.minCoins;
              const isCurrent = currentLevelInfo.level === lvl.level;
              return (
                <div 
                  key={lvl.level}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isCurrent 
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' 
                      : isAchieved 
                        ? 'bg-stone-800/60 border-stone-700 text-stone-300' 
                        : 'bg-stone-900/40 border-stone-800/80 text-stone-600'
                  }`}
                >
                  <div className="font-bold flex items-center justify-center gap-1">
                    {isAchieved ? <CheckCircle2 size={12} className="text-emerald-400" /> : <span>○</span>}
                    <span>{lvl.minCoins}+ монет</span>
                  </div>
                  <div className="text-[10px] truncate mt-0.5 opacity-90">{lvl.title}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* GRAND PRIZE NOTICE */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
            🏕️
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <span>Главный приз: «Бесплатный слёт 2026»</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                100% скидка
              </span>
            </h4>
            <p className="text-xs text-stone-600">
              Участник, набравший больше всех монеток к началу слёта, полностью освобождается от вступительного взноса. Взнос оплачивается из накопительного Фонда Негодяев.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-center md:text-right">
          <div className="text-xs text-stone-500 font-medium">Ваш текущий баланс:</div>
          <div className="text-xl font-black text-amber-700">
            {totalCount} {totalCount === 1 ? 'монета' : totalCount > 1 && totalCount < 5 ? 'монеты' : 'монет'}
          </div>
        </div>
      </div>

      {/* COINS COLLECTION SECTION */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              <span>Коллекция заработанных монеток ({userCoins.length})</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Именные монеты, врученные Капитаном за вклад в лагерь или выигранные в Колесе Фортуны
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Все ({userCoins.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('task')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'task'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Задачи лагеря ({userCoins.filter(c => c.category === 'task').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('fortune')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'fortune'
                  ? 'bg-purple-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Колесо Фортуны ({userCoins.filter(c => c.category === 'fortune').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('merit')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'merit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Заслуги ({userCoins.filter(c => c.category === 'merit').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('poker')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'poker'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ♠️ Покер ({userCoins.filter(c => c.category === 'poker').length})
            </button>
          </div>
        </div>

        {/* Coins Grid or Empty State */}
        {filteredCoins.length === 0 ? (
          <div className="py-12 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
              🪙
            </div>
            <div className="font-bold text-stone-800 text-sm">
              {activeCategory === 'all' 
                ? 'У вас пока нет монеток слёта' 
                : 'В этой категории пока нет монет'}
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Участвуйте в подготовке к слёту, закупках, строительстве лагеря, крутите «Колесо Фортуны» или выигрывайте в покерном турнире Негодяев!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoins.map((c) => {
              const isFortune = c.category === 'fortune';
              const isPoker = c.category === 'poker';
              const dateStr = new Date(c.awardedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              return (
                <div 
                  key={c.id}
                  onClick={() => setSelectedCoin(c)}
                  className="bg-stone-50 hover:bg-amber-50/60 border border-stone-200 hover:border-amber-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex items-start gap-3.5 group relative"
                >
                  {/* Mini Coin Preview with Profile */}
                  <div className="shrink-0 mt-0.5">
                    <RallyCoinVisual coin={c} participant={participant} size="md" interactive={false} />
                  </div>

                  {/* Coin Details */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${
                        isFortune 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : isPoker
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : c.category === 'merit'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {isFortune ? 'Фортуна' : isPoker ? '♠️ Покер' : c.category === 'merit' ? 'Заслуга' : 'Задача'}
                      </span>
                      <span className="text-[11px] text-stone-400 truncate">
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-amber-800 transition-colors">
                      {c.taskTitle}
                    </h4>

                    {c.comment && (
                      <p className="text-xs text-stone-600 line-clamp-2 italic">
                        «{c.comment}»
                      </p>
                    )}

                    <div className="text-[11px] text-stone-400 font-medium pt-1 flex items-center justify-between">
                      <span>Вручил: {c.awardedBy}</span>
                      <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL: COIN INSPECTION POPUP */}
      {selectedCoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => setSelectedCoin(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <span className="text-xs font-black text-amber-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              ★ Именная монета Негодяя ★
            </span>

            <div className="py-2 flex justify-center">
              <RallyCoinVisual 
                coin={selectedCoin} 
                participant={participant} 
                size="hero" 
                interactive={true} 
              />
            </div>

            <div className="space-y-2 text-left bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <div className="text-[11px] text-stone-500 font-medium">За что вручена:</div>
                <div className="font-black text-stone-900 text-base">{selectedCoin.taskTitle}</div>
              </div>

              {selectedCoin.comment && (
                <div>
                  <div className="text-[11px] text-stone-500 font-medium">Похвала / Описание:</div>
                  <div className="text-xs text-stone-700 italic">«{selectedCoin.comment}»</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Кому:</span>
                  <span className="font-bold text-stone-800">{selectedCoin.participantName}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Кем вручена:</span>
                  <span className="font-bold text-stone-800">{selectedCoin.awardedBy}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Дата чеканки:</span>
                  <span className="font-bold text-stone-800">
                    {new Date(selectedCoin.awardedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Номинал:</span>
                  <span className="font-bold text-amber-700">1 монета слёта</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCoin(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
            >
              Закрыть
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
