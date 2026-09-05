import React, { useState } from 'react';
import { 
  Cake, Bell, Calendar, Gift, AlertTriangle, 
  Sparkles, X, ChevronRight, Clock, Heart 
} from 'lucide-react';
import { Participant } from '../types';

interface BirthdayNotificationsProps {
  participants: Participant[];
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function BirthdayNotifications({
  participants,
  isAdmin,
  isOpen,
  onClose
}: BirthdayNotificationsProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Helper to parse MM-DD and calculate days remaining until next birthday
  const getDaysUntilBirthday = (bdayStr?: string): { days: number; isToday: boolean; dateFormatted: string; age?: number } | null => {
    if (!bdayStr) return null;
    const parts = bdayStr.split('-');
    if (parts.length < 2) return null;
    
    const birthYear = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
    const month = parseInt(parts[parts.length - 2], 10);
    const day = parseInt(parts[parts.length - 1], 10);
    
    if (isNaN(month) || isNaN(day)) return null;

    let targetDate = new Date(today.getFullYear(), month - 1, day);
    if (targetDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      // Birthday already occurred this year, roll over to next year
      targetDate = new Date(today.getFullYear() + 1, month - 1, day);
    }

    const diffTime = targetDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const isToday = (month === currentMonth && day === currentDay);

    const dateFormatted = `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}`;
    const age = birthYear ? today.getFullYear() - birthYear : undefined;

    return { days, isToday, dateFormatted, age };
  };

  // Grouped upcoming birthdays
  const participantsWithBirthday = participants
    .map(p => ({
      participant: p,
      info: getDaysUntilBirthday(p.birthday)
    }))
    .filter((item): item is { participant: Participant; info: NonNullable<ReturnType<typeof getDaysUntilBirthday>> } => item.info !== null)
    .sort((a, b) => a.info.days - b.info.days);

  // Specific alerts
  const todayBirthdays = participantsWithBirthday.filter(item => item.info.isToday);
  const tomorrowBirthdays = participantsWithBirthday.filter(item => item.info.days === 1);
  const oneWeekBirthdays = participantsWithBirthday.filter(item => item.info.days > 1 && item.info.days <= 7);
  const oneMonthBirthdays = participantsWithBirthday.filter(item => item.info.days > 7 && item.info.days <= 30);

  const filteredBirthdays = participantsWithBirthday.filter(item => 
    item.participant.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.participant.nickname.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="text-red-600 w-6 h-6 animate-bounce" />
            <div>
              <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                Ежедневник дней рождений Негодяев
              </h3>
              <p className="text-[11px] font-bold text-red-900">
                Календарь праздников и автоматические уведомления
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* TODAY BIRTHDAY BANNER */}
          {todayBirthdays.length > 0 ? (
            <div className="bg-gradient-to-r from-red-600 to-amber-600 text-yellow-200 p-4 rounded-xl border-3 border-yellow-300 shadow-lg space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-yellow-300 w-6 h-6 animate-spin" />
                <h4 className="font-black text-base uppercase tracking-wide">
                  🎉 СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ!
                </h4>
              </div>
              <div className="space-y-2">
                {todayBirthdays.map(({ participant, info }) => (
                  <div key={participant.id} className="bg-amber-950/40 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={participant.avatar} 
                        alt={participant.name} 
                        className="w-12 h-12 rounded-full border-2 border-yellow-300 bg-amber-100 object-cover" 
                      />
                      <div>
                        <p className="font-black text-base text-yellow-100">{participant.name}</p>
                        <p className="text-xs font-bold text-yellow-300">@{participant.nickname}</p>
                      </div>
                    </div>
                    <span className="bg-yellow-400 text-red-900 text-xs font-black px-3 py-1 rounded-full uppercase shadow">
                      Именинник сегодня! 🎂
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-100 p-3 rounded-xl border border-amber-300 text-xs text-amber-850 font-bold flex items-center gap-2">
              <Calendar size={16} className="text-amber-700" />
              <span>Сегодня именинников нет. Ближайшие праздники смотрите ниже.</span>
            </div>
          )}

          {/* ADMIN UPCOMING NOTIFICATION ALERTS */}
          {isAdmin && (
            <div className="bg-white p-4 rounded-xl border-2 border-red-500 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase">
                <Bell size={16} className="animate-pulse" />
                <span>Особые уведомления Администратора (за 1 день, 1 неделю, 1 месяц)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {/* 1 Day Ahead */}
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between font-black text-red-800 mb-1">
                    <span>Завтра (1 день)</span>
                    <span className="bg-red-200 px-1.5 py-0.5 rounded text-[10px]">{tomorrowBirthdays.length}</span>
                  </div>
                  {tomorrowBirthdays.length > 0 ? (
                    tomorrowBirthdays.map(({ participant }) => (
                      <p key={participant.id} className="font-bold text-red-900 truncate">
                        • {participant.name}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Нет именинников</p>
                  )}
                </div>

                {/* 1 Week Ahead */}
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between font-black text-amber-800 mb-1">
                    <span>Через 1 неделю</span>
                    <span className="bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">{oneWeekBirthdays.length}</span>
                  </div>
                  {oneWeekBirthdays.length > 0 ? (
                    oneWeekBirthdays.map(({ participant, info }) => (
                      <p key={participant.id} className="font-bold text-amber-900 truncate">
                        • {participant.name} ({info.days} дн.)
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Нет именинников</p>
                  )}
                </div>

                {/* 1 Month Ahead */}
                <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between font-black text-yellow-800 mb-1">
                    <span>Через 1 месяц</span>
                    <span className="bg-yellow-200 px-1.5 py-0.5 rounded text-[10px]">{oneMonthBirthdays.length}</span>
                  </div>
                  {oneMonthBirthdays.length > 0 ? (
                    oneMonthBirthdays.map(({ participant, info }) => (
                      <p key={participant.id} className="font-bold text-yellow-900 truncate">
                        • {participant.name} ({info.days} дн.)
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Нет именинников</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ALL BIRTHDAYS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs uppercase text-amber-950 flex items-center gap-1.5">
                <Calendar size={14} className="text-red-600" />
                Все дни рождения команды ({participantsWithBirthday.length})
              </h4>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Поиск по имени..."
                className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-950 focus:border-red-500"
              />
            </div>

            <div className="space-y-2">
              {filteredBirthdays.map(({ participant, info }) => (
                <div 
                  key={participant.id}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                    info.isToday 
                      ? 'bg-yellow-100 border-red-500 shadow-md' 
                      : info.days <= 7
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-white border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={participant.avatar} 
                      alt={participant.name} 
                      className="w-10 h-10 rounded-full border border-amber-300 bg-amber-100 object-cover" 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-amber-950">{participant.name}</span>
                        <span className="text-xs font-bold text-red-600">@{participant.nickname}</span>
                      </div>
                      <p className="text-xs text-amber-700 font-semibold">
                        Дата: {info.dateFormatted} {info.age ? `(${info.age} лет)` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {info.isToday ? (
                      <span className="inline-block px-2.5 py-1 bg-red-600 text-yellow-300 font-black text-xs uppercase rounded-full shadow">
                        Сегодня! 🎂
                      </span>
                    ) : (
                      <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                        через {info.days} дн.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-amber-100 border-t-2 border-amber-300 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow transition-colors"
          >
            Понятно
          </button>
        </div>

      </div>
    </div>
  );
}
