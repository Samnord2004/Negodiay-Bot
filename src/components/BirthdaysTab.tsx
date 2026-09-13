import React, { useState } from 'react';
import { 
  Cake, Calendar, Sparkles, Gift, Heart, Bell, 
  Search, MessageSquare, User, Shield, ChevronRight,
  Filter, CheckCircle, Flame, Star, Trophy, ExternalLink
} from 'lucide-react';
import { Participant, ROLE_DEFINITIONS } from '../types';
import { getParticipantAvatar } from '../utils/avatar';
import { getBirthdayRemainingDays, formatBirthdayShort, parseBirthday } from '../utils/dateUtils';

interface BirthdaysTabProps {
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onOpenProfileEdit: () => void;
  onOpenChatWithGreeting: (text: string) => void;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function BirthdaysTab({
  participants,
  currentUser,
  isAdmin,
  onOpenProfileEdit,
  onOpenChatWithGreeting
}: BirthdaysTabProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming30' | 'today'>('all');

  // Compute birthday info for all participants with birthdays
  const participantsWithBirthday = participants
    .map(p => {
      const parsed = parseBirthday(p.birthday);
      const info = getBirthdayRemainingDays(p.birthday);
      return {
        participant: p,
        parsed,
        info
      };
    })
    .filter((item): item is { 
      participant: Participant; 
      parsed: NonNullable<ReturnType<typeof parseBirthday>>; 
      info: NonNullable<ReturnType<typeof getBirthdayRemainingDays>> 
    } => item.parsed !== null && item.info !== null)
    .sort((a, b) => a.info.days - b.info.days);

  // Grouped counts
  const todayBirthdays = participantsWithBirthday.filter(item => item.info.isToday);
  const tomorrowBirthdays = participantsWithBirthday.filter(item => item.info.days === 1);
  const oneWeekBirthdays = participantsWithBirthday.filter(item => item.info.days > 1 && item.info.days <= 7);
  const oneMonthBirthdays = participantsWithBirthday.filter(item => item.info.days > 7 && item.info.days <= 30);

  // Filtering
  const filteredList = participantsWithBirthday.filter(item => {
    // Text search
    const query = filterQuery.toLowerCase().trim();
    if (query) {
      const matchName = item.participant.name.toLowerCase().includes(query);
      const matchNick = item.participant.nickname.toLowerCase().includes(query);
      if (!matchName && !matchNick) return false;
    }

    // Quick filter mode
    if (filterMode === 'today') {
      if (!item.info.isToday) return false;
    } else if (filterMode === 'upcoming30') {
      if (item.info.days > 30) return false;
    }

    // Month filter
    if (selectedMonth !== 'all') {
      if (item.parsed.month !== selectedMonth) return false;
    }

    return true;
  });

  const handleSendGreeting = (p: Participant) => {
    const greetingText = `🎉 Команда «Негодяи» поздравляет @${p.nickname} (${p.name}) с Днём Рождения! 🎂 Желаем неиссякаемой походной бодрости, верных друзей на тропе, сухих дров, ярких звёзд над палаткой и крепкого здоровья! 🏕️✨🔥`;
    onOpenChatWithGreeting(greetingText);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER HERO BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 rounded-3xl p-6 sm:p-8 text-amber-950 border-4 border-amber-950 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-700/80 text-yellow-300 text-xs font-black uppercase tracking-wider border border-yellow-300/40 shadow-xs">
              <Cake size={14} className="animate-bounce" />
              <span>Ежедневник Негодяев • Формат ДД.ММ.ГГ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase drop-shadow-md">
              Дни рождения команды
            </h2>
            <p className="text-sm sm:text-base font-bold text-yellow-100 leading-relaxed">
              Летопись именинников походного братства «Негодяи». Не пропускаем ни одной даты, вовремя поздравляем в чате и готовим сюрпризы у костра!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={onOpenProfileEdit}
              className="px-4 py-3 bg-yellow-300 hover:bg-yellow-200 text-amber-950 border-2 border-amber-950 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Calendar size={16} className="text-red-600" />
              <span>{currentUser?.birthday ? 'Изменить свой ДР' : 'Указать свой ДР'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChatWithGreeting('🎉 Всем привет! Заглянул в раздел Дней Рождений Негодяев! 🎂')}
              className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-yellow-300 border-2 border-yellow-400 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <MessageSquare size={16} />
              <span>Поздравить в чате</span>
            </button>
          </div>
        </div>

        {/* STATS CHIPS */}
        <div className="mt-6 pt-5 border-t border-amber-950/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white">
          <div className="bg-amber-950/40 backdrop-blur-xs rounded-2xl p-3 border border-yellow-300/30">
            <div className="text-[10px] font-black uppercase text-yellow-300">Именинников в базе</div>
            <div className="text-xl font-black mt-0.5">{participantsWithBirthday.length} чел.</div>
          </div>
          <div className="bg-amber-950/40 backdrop-blur-xs rounded-2xl p-3 border border-yellow-300/30">
            <div className="text-[10px] font-black uppercase text-yellow-300">Празднуют сегодня</div>
            <div className="text-xl font-black mt-0.5 text-yellow-200">
              {todayBirthdays.length > 0 ? `🎂 ${todayBirthdays.length}` : '0 чел.'}
            </div>
          </div>
          <div className="bg-amber-950/40 backdrop-blur-xs rounded-2xl p-3 border border-yellow-300/30">
            <div className="text-[10px] font-black uppercase text-yellow-300">Ближайшие 7 дней</div>
            <div className="text-xl font-black mt-0.5">
              {tomorrowBirthdays.length + oneWeekBirthdays.length} чел.
            </div>
          </div>
          <div className="bg-amber-950/40 backdrop-blur-xs rounded-2xl p-3 border border-yellow-300/30">
            <div className="text-[10px] font-black uppercase text-yellow-300">Ближайший месяц</div>
            <div className="text-xl font-black mt-0.5">
              {oneMonthBirthdays.length} чел.
            </div>
          </div>
        </div>
      </div>

      {/* TODAY CELEBRATION SHOWCASE */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 p-1 rounded-3xl shadow-xl animate-pulse">
          <div className="bg-amber-950 text-yellow-100 rounded-[22px] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-yellow-400 mb-4">
              <Sparkles className="w-8 h-8 animate-spin" />
              <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  🎉 СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ В КОМАНДЕ! 🎂
                </h3>
                <p className="text-xs font-bold text-yellow-300 mt-0.5">
                  Не забудьте поднять кружку чая и поздравить в чате команды прямо сейчас!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {todayBirthdays.map(({ participant, info }) => (
                <div 
                  key={participant.id} 
                  className="bg-stone-900/90 border-2 border-yellow-400 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img 
                      src={getParticipantAvatar(participant)} 
                      alt={participant.name} 
                      className="w-16 h-16 rounded-full border-3 border-yellow-400 bg-amber-100 object-cover shadow" 
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-lg text-white">{participant.name}</span>
                        <span className="text-xs font-bold text-yellow-300">@{participant.nickname}</span>
                      </div>
                      <p className="text-xs text-stone-300 font-bold mt-1">
                        Дата: <span className="text-yellow-400 font-black">{info.dateFormatted}</span> 
                        {info.age ? ` • Исполняется ${info.age} лет!` : ''}
                      </p>
                      <div className="mt-1 inline-block px-2.5 py-0.5 bg-red-600 text-yellow-200 text-[10px] font-black uppercase rounded-full">
                        Главный виновник торжества 👑
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendGreeting(participant)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-amber-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <Gift size={15} />
                    <span>Поздравить в чате</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN NOTIFICATION PREVIEW BLOCKS */}
      {isAdmin && (
        <div className="bg-amber-50 border-2 border-red-500 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase tracking-wider">
            <Bell size={16} className="animate-pulse" />
            <span>Штаб Капитана: Контроль юбилеев и дат (за 1 день, 1 неделю, 1 месяц)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1 Day Ahead */}
            <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between font-black text-red-800 mb-2">
                <span>Завтра (1 день)</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {tomorrowBirthdays.length}
                </span>
              </div>
              {tomorrowBirthdays.length > 0 ? (
                <div className="space-y-1.5">
                  {tomorrowBirthdays.map(({ participant, info }) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 truncate">
                        • {participant.name} (@{participant.nickname})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendGreeting(participant)}
                        className="text-[10px] font-bold text-red-600 hover:underline shrink-0 ml-1"
                      >
                        Поздравить
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-[11px]">Завтра именинников нет</p>
              )}
            </div>

            {/* 1 Week Ahead */}
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between font-black text-amber-800 mb-2">
                <span>Через неделю (до 7 дн.)</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {oneWeekBirthdays.length}
                </span>
              </div>
              {oneWeekBirthdays.length > 0 ? (
                <div className="space-y-1.5">
                  {oneWeekBirthdays.map(({ participant, info }) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 truncate">
                        • {participant.name}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 shrink-0">
                        через {info.days} дн.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-[11px]">На неделе именинников нет</p>
              )}
            </div>

            {/* 1 Month Ahead */}
            <div className="bg-white p-3.5 rounded-2xl border border-yellow-200 shadow-2xs">
              <div className="flex items-center justify-between font-black text-yellow-800 mb-2">
                <span>В течение месяца (до 30 дн.)</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {oneMonthBirthdays.length}
                </span>
              </div>
              {oneMonthBirthdays.length > 0 ? (
                <div className="space-y-1.5">
                  {oneMonthBirthdays.map(({ participant, info }) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 truncate">
                        • {participant.name}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500 shrink-0">
                        {info.dateFormatted} ({info.days} дн.)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-[11px]">В течение месяца нет именинников</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Поиск по имени или позывному негодяя..."
              className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-amber-200 focus:border-red-500 focus:bg-white rounded-2xl text-xs font-bold text-stone-900 outline-none transition-colors"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Mode pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                filterMode === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Все ({participantsWithBirthday.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('upcoming30')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                filterMode === 'upcoming30'
                  ? 'bg-red-600 text-yellow-300 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Ближайшие 30 дней ({tomorrowBirthdays.length + oneWeekBirthdays.length + oneMonthBirthdays.length})
            </button>
            {todayBirthdays.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  filterMode === 'today'
                    ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                    : 'bg-yellow-200 text-amber-900 hover:bg-yellow-300'
                }`}
              >
                🎂 Сегодня ({todayBirthdays.length})
              </button>
            )}
          </div>
        </div>

        {/* Month selector row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-stone-100">
          <span className="text-[11px] font-black uppercase text-stone-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter size={12} />
            Месяц:
          </span>
          <button
            type="button"
            onClick={() => setSelectedMonth('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-colors ${
              selectedMonth === 'all'
                ? 'bg-amber-500 text-white font-black'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Все месяцы
          </button>
          {MONTH_NAMES.map((mName, idx) => {
            const mNum = idx + 1;
            const countInMonth = participantsWithBirthday.filter(p => p.parsed.month === mNum).length;
            return (
              <button
                key={mNum}
                type="button"
                onClick={() => setSelectedMonth(mNum)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-colors flex items-center gap-1 ${
                  selectedMonth === mNum
                    ? 'bg-amber-500 text-white font-black'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{mName}</span>
                {countInMonth > 0 && (
                  <span className={`text-[10px] px-1 rounded-full ${
                    selectedMonth === mNum ? 'bg-amber-700 text-yellow-200' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {countInMonth}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BIRTHDAYS CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-sm uppercase text-amber-950 flex items-center gap-2">
            <Cake size={16} className="text-red-600" />
            Список именинников команды ({filteredList.length})
          </h3>
          <span className="text-xs text-stone-500 font-bold">
            Отсортировано по ближайшей дате
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-12 text-center space-y-3">
            <Cake size={40} className="mx-auto text-stone-300" />
            <p className="font-bold text-base text-stone-700">Именинников по заданным критериям не найдено</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Попробуйте сбросить фильтр или строку поиска. Если у кого-то из команды ещё не указан день рождения, укажите его в профиле участника!
            </p>
            <button
              type="button"
              onClick={() => { setFilterQuery(''); setSelectedMonth('all'); setFilterMode('all'); }}
              className="mt-2 px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-xs uppercase"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredList.map(({ participant, parsed, info }) => {
              const roleInfo = ROLE_DEFINITIONS[participant.role];
              return (
                <div
                  key={participant.id}
                  className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                    info.isToday
                      ? 'border-red-500 bg-gradient-to-br from-yellow-50 via-white to-red-50 ring-2 ring-red-400'
                      : info.days <= 7
                      ? 'border-amber-400 bg-amber-50/40'
                      : 'border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Member Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={getParticipantAvatar(participant)}
                            alt={participant.name}
                            className="w-12 h-12 rounded-full border-2 border-amber-300 bg-stone-100 object-cover shadow-2xs"
                          />
                          {info.isToday && (
                            <span className="absolute -top-1.5 -right-1.5 text-base leading-none animate-bounce">
                              🎂
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-900 leading-tight">
                              {participant.name}
                            </span>
                            {roleInfo && (
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${roleInfo.color}`}>
                                {roleInfo.badge || roleInfo.title}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-red-600 block mt-0.5">
                            @{participant.nickname}
                          </span>
                        </div>
                      </div>

                      {/* Remaining badge */}
                      <div>
                        {info.isToday ? (
                          <span className="px-2.5 py-1 bg-red-600 text-yellow-200 font-black text-[11px] uppercase rounded-full shadow-xs animate-pulse inline-block">
                            Сегодня! 🎉
                          </span>
                        ) : info.days === 1 ? (
                          <span className="px-2 py-0.5 bg-amber-400 text-amber-950 font-black text-[10px] uppercase rounded-full">
                            Завтра!
                          </span>
                        ) : info.days <= 7 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-850 font-bold text-[10px] rounded-full border border-amber-200">
                            через {info.days} дн.
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 font-medium text-[10px] rounded-full">
                            через {info.days} дн.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date info */}
                    <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-500 block">Дата рождения:</span>
                        <span className="font-black text-stone-900 text-sm">{info.dateFormatted}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-stone-500 block">Возраст:</span>
                        <span className="font-bold text-stone-700">
                          {info.age ? `${info.age} лет` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400 font-medium">
                      {MONTH_NAMES[parsed.month - 1]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendGreeting(participant)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>Поздравить</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
