import React, { useState } from 'react';
import { Search, Flame, Skull, Shield, Sparkles, BookOpen } from 'lucide-react';
import { MK_FIGHTERS } from '../../../utils/mkData';

export default function MKFatalityGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFighterId, setSelectedFighterId] = useState<string>(MK_FIGHTERS[0].id);

  const filteredFighters = MK_FIGHTERS.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.alias.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFighter = MK_FIGHTERS.find(f => f.id === selectedFighterId) || MK_FIGHTERS[0];

  return (
    <div className="space-y-4">
      {/* Search and Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={20} className="text-amber-400" />
            <span>Шпаргалка приёмов, комбо и Fatality (UMK3 / Trilogy)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Обозначения: HP = High Punch, LP = Low Punch, HK = High Kick, LK = Low Kick, Run = Бег, Block = Блок.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск бойца (Scorpion, Sub-Zero...)"
            className="w-full pl-8 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
          />
        </div>
      </div>

      {/* Fighters Carousel / Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {filteredFighters.map(fighter => (
          <button
            key={fighter.id}
            type="button"
            onClick={() => setSelectedFighterId(fighter.id)}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all border cursor-pointer ${
              selectedFighterId === fighter.id
                ? 'bg-amber-500 text-stone-950 border-yellow-300 font-black shadow-md scale-105'
                : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700 font-bold'
            }`}
          >
            <span className="text-sm">🥋</span>
            <span className="text-xs">{fighter.name} ({fighter.alias})</span>
          </button>
        ))}
      </div>

      {/* Selected Fighter Detailed Card */}
      <div className="bg-stone-900 border-2 border-amber-400/60 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        
        {/* Fighter Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedFighter.color} flex items-center justify-center text-3xl shadow-md`}>
              🥋
            </div>
            <div>
              <div className="text-lg font-black text-white uppercase">
                {selectedFighter.name} <span className="text-amber-400 text-sm font-bold">({selectedFighter.alias})</span>
              </div>
              <div className="text-xs text-stone-400 font-medium">{selectedFighter.title} • Царство: {selectedFighter.realm}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/60 px-3 py-1.5 rounded-xl text-red-300 text-xs font-black uppercase">
            <Skull size={15} className="text-red-400" />
            <span>Finish Him!</span>
          </div>
        </div>

        {/* Special Moves Grid */}
        <div>
          <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Фирменные Спецприёмы (Special Moves)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {selectedFighter.specialMoves.map((m, idx) => (
              <div key={idx} className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 space-y-1">
                <div className="text-xs font-bold text-white">{m.name}</div>
                <div className="text-[11px] font-mono text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-700/60 inline-block">
                  {m.combo}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fatality Block */}
        <div className="bg-gradient-to-r from-red-950/60 via-stone-950 to-stone-950 border-2 border-red-600/50 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
              <Skull size={15} className="text-red-500" />
              <span>Главное Fatality: {selectedFighter.fatality.name}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
              Дистанция: {selectedFighter.fatality.distance}
            </span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-white bg-red-950/80 border border-red-700/60 px-3 py-2 rounded-lg inline-block">
            {selectedFighter.fatality.combo}
          </div>
        </div>

        {/* Universal Finishers Hint */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-[11px] text-stone-400 space-y-1">
          <div className="font-bold text-stone-300">Универсальные приёмы для всех бойцов:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-400">
            <div>• <strong>Апперкот:</strong> Вниз + HP (максимальный урон)</div>
            <div>• <strong>Бросок:</strong> В упор: Вперёд + LP</div>
            <div>• <strong>Подсечка:</strong> Назад + LK</div>
          </div>
        </div>

      </div>

    </div>
  );
}
