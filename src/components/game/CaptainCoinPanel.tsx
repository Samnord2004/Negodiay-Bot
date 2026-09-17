import React, { useState } from 'react';
import { 
  Crown, Award, Plus, Trash2, CheckCircle, Sparkles, 
  Search, ShieldAlert, AlertCircle, RefreshCw, Send, Check
} from 'lucide-react';
import { Participant, RallyCoin, DEFAULT_GAME_TASKS } from '../../types';
import { getParticipantAvatar } from '../../utils/avatar';
import { playCoinSound } from '../../utils/audioEffects';
import RallyCoinVisual from './RallyCoinVisual';

interface CaptainCoinPanelProps {
  participants: Participant[];
  coins: RallyCoin[];
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
  onDeleteCoin: (coinId: string) => Promise<void> | void;
  captainUser?: Participant | null;
}

export default function CaptainCoinPanel({
  participants,
  coins,
  onAwardCoin,
  onDeleteCoin,
  captainUser
}: CaptainCoinPanelProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tasks list (predefined + custom added by Captain)
  const [tasksList, setTasksList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('negodyai_custom_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_GAME_TASKS;
  });

  const [selectedTask, setSelectedTask] = useState<string>(tasksList[0] || 'Закупка продуктов и провианта');
  const [isAddingCustomTask, setIsAddingCustomTask] = useState(false);
  const [newCustomTaskInput, setNewCustomTaskInput] = useState('');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<'task' | 'merit' | 'contest'>('task');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mintSuccessMsg, setMintSuccessMsg] = useState<string | null>(null);

  // Filter active participants
  const activeParticipants = participants.filter(p => p.accountStatus !== 'rejected');
  
  const filteredParticipants = activeParticipants.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q);
  });

  const currentSelectedParticipant = activeParticipants.find(p => p.id === selectedParticipantId) || activeParticipants[0];

  // Handle adding custom task to dropdown
  const handleAddNewTask = () => {
    const trimmed = newCustomTaskInput.trim();
    if (!trimmed) return;
    if (!tasksList.includes(trimmed)) {
      const updated = [...tasksList, trimmed];
      setTasksList(updated);
      try {
        localStorage.setItem('negodyai_custom_tasks', JSON.stringify(updated));
      } catch (e) {}
    }
    setSelectedTask(trimmed);
    setNewCustomTaskInput('');
    setIsAddingCustomTask(false);
  };

  // Handle mint & award coin
  const handleMintCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedParticipant) return;

    setIsSubmitting(true);
    try {
      playCoinSound();

      const captainName = captainUser?.name 
        ? `${captainUser.name} (Ковбой)` 
        : 'Капитан Андрей Самойлов';

      await onAwardCoin({
        participantId: currentSelectedParticipant.id,
        participantName: currentSelectedParticipant.name,
        participantNickname: currentSelectedParticipant.nickname || currentSelectedParticipant.name,
        taskTitle: selectedTask,
        category,
        comment: comment.trim(),
        awardedBy: captainName
      });

      setMintSuccessMsg(`Именная монета успешно отчеканена для «${currentSelectedParticipant.nickname || currentSelectedParticipant.name}»!`);
      setComment('');
      
      setTimeout(() => {
        setMintSuccessMsg(null);
      }, 4500);

    } catch (err: any) {
      alert("Ошибка при вручении монетки: " + (err?.message || "Попробуйте снова"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recent captain awards
  const recentCoins = coins.slice(0, 10);

  return (
    <div className="space-y-6">
      
      {/* CAPTAIN BANNER */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white p-6 sm:p-7 rounded-3xl border border-red-900/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-yellow-300">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600/80 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-400/40">
                  Штаб Капитана
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  Чеканка наград слёта
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Панель вручения именных монет Негодяев
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Только капитан имеет право чеканить именные монеты за реальные заслуги, вклад в обустройство лагеря и победы в конкурсах.
              </p>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-center md:text-right shrink-0">
            <div className="text-[11px] text-stone-400">Всего роздано монет:</div>
            <div className="text-2xl font-black text-amber-400">
              🪙 {coins.length}
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {mintSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check size={18} />
          </div>
          <div className="text-sm font-bold flex-1">{mintSuccessMsg}</div>
          <button 
            type="button" 
            onClick={() => setMintSuccessMsg(null)}
            className="text-xs text-emerald-700 font-bold px-2 py-1 hover:bg-emerald-100 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* MINTING FORM CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: AWARD FORM (8 COLS) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
          
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              <span>Форма чеканки монеты за заслуги</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Выберите соратника, категорию задачи и введите похвалу
            </p>
          </div>

          <form onSubmit={handleMintCoin} className="space-y-5">
            
            {/* 1. SELECT PARTICIPANT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  1. Кому вручить монету:
                </label>
                <div className="relative w-44">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск соратника..."
                    className="w-full text-xs pl-7 pr-2 py-1 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Horizontal / Grid Participant Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-2xl bg-stone-50/70">
                {filteredParticipants.map(p => {
                  const isSelected = p.id === selectedParticipantId;
                  const count = coins.filter(c => c.participantId === p.id).length;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedParticipantId(p.id)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2.5 transition-all ${
                        isSelected 
                          ? 'bg-amber-100/80 border-amber-500 text-stone-950 shadow-xs ring-1 ring-amber-400' 
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-100/50'
                      }`}
                    >
                      <img 
                        src={getParticipantAvatar(p)} 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-stone-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate leading-tight">
                          {p.nickname || p.name}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {p.name}
                        </div>
                        <div className="text-[9px] text-amber-700 font-bold mt-0.5">
                          🪙 {count} {count === 1 ? 'монета' : 'монет'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TASK SELECTION / DROPDOWN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Выбор задачи / подвига:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomTask(!isAddingCustomTask)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>{isAddingCustomTask ? 'Отмена' : '+ Своя новая задача'}</span>
                </button>
              </div>

              {isAddingCustomTask ? (
                <div className="flex gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <input
                    type="text"
                    value={newCustomTaskInput}
                    onChange={(e) => setNewCustomTaskInput(e.target.value)}
                    placeholder="Например: Заготовка 5 кубов дров / Ночной дозор"
                    className="flex-1 text-xs px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTask}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                  >
                    Добавить
                  </button>
                </div>
              ) : (
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800"
                >
                  {tasksList.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. CATEGORY SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                3. Тип заслуги:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'task', label: 'Задача лагеря', desc: 'Строительство, продукты, дрова' },
                  { id: 'merit', label: 'Личная заслуга', desc: 'Идея года, выручка друга' },
                  { id: 'contest', label: 'Конкурс / сцена', desc: 'Костюм, песня, победа' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as any)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      category === item.id
                        ? 'bg-amber-100/70 border-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-stone-500 font-normal truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. CAPTAIN'S PRAISE / COMMENT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                4. Похвала капитана / комментарий (необязательно):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Например: За спасение котла с ухой под проливным дождём и молниеносную натяжку тента!"
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800"
              />
            </div>

            {/* MINT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !currentSelectedParticipant}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>🪙</span>
                <span>
                  {isSubmitting ? 'Чеканка монеты...' : `Вручить именную монетку (${currentSelectedParticipant?.nickname || 'Участнику'})`}
                </span>
                <Send size={15} />
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: LIVE MINT PREVIEW (4 COLS) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-stone-900 to-stone-950 text-white rounded-3xl p-6 border border-stone-800 shadow-md flex flex-col items-center text-center justify-between space-y-6">
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Предпросмотр чеканки
            </span>
            <h4 className="text-base font-black text-white">
              Именная монета с профилем
            </h4>
            <p className="text-xs text-stone-400">
              Монетка чеканится с силуэтом профиля участника
            </p>
          </div>

          {currentSelectedParticipant ? (
            <div className="space-y-3 flex flex-col items-center">
              <RallyCoinVisual 
                participant={currentSelectedParticipant} 
                size="lg" 
                interactive={true} 
              />
              
              <div className="space-y-1">
                <div className="text-sm font-black text-amber-300">
                  {currentSelectedParticipant.name}
                </div>
                <div className="text-xs text-stone-300 font-bold">
                  «{currentSelectedParticipant.nickname || currentSelectedParticipant.name}»
                </div>
                <div className="text-[11px] text-stone-400">
                  {currentSelectedParticipant.photoProfile ? (
                    <span className="text-emerald-400 font-semibold">✓ Силуэт из фото профиля</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">★ Стандартный силуэт Негодяя</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-stone-500 text-xs">
              Выберите участника слева
            </div>
          )}

          <div className="w-full bg-stone-800/80 p-3 rounded-2xl border border-stone-700/80 text-[11px] text-stone-300 text-left space-y-1">
            <div className="font-bold text-white flex items-center gap-1 text-xs">
              <Award size={13} className="text-amber-400" />
              <span>Правило капитана:</span>
            </div>
            <div>
              Каждая монетка приближает соратника к скидке 100% на слёт! Победитель определяется накануне общего сбора.
            </div>
          </div>

        </div>

      </div>

      {/* RECENT AWARDS HISTORY TABLE */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-stone-900">
              Последние врученные монеты ({coins.length})
            </h3>
            <p className="text-xs text-stone-500">
              История чеканки. Капитан может отменить ошибочное начисление.
            </p>
          </div>
        </div>

        {recentCoins.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 italic">
            Пока не вручено ни одной монеты
          </div>
        ) : (
          <div className="divide-y divide-stone-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 border-b border-stone-200 pb-2">
                  <th className="py-2.5 font-bold">Участник</th>
                  <th className="py-2.5 font-bold">Задача / Заслуга</th>
                  <th className="py-2.5 font-bold">Категория</th>
                  <th className="py-2.5 font-bold">Дата</th>
                  <th className="py-2.5 font-bold">Кем вручено</th>
                  <th className="py-2.5 font-bold text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentCoins.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 font-bold text-stone-900 flex items-center gap-2">
                      <span className="text-amber-600">🪙</span>
                      <span>{c.participantName}</span>
                      <span className="text-stone-400 text-[11px]">({c.participantNickname})</span>
                    </td>
                    <td className="py-2.5 text-stone-800 font-medium">
                      <div>{c.taskTitle}</div>
                      {c.comment && (
                        <div className="text-[11px] text-stone-500 italic">«{c.comment}»</div>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.category === 'fortune'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : c.category === 'merit'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {c.category === 'fortune' ? 'Фортуна' : c.category === 'merit' ? 'Заслуга' : 'Задача'}
                      </span>
                    </td>
                    <td className="py-2.5 text-stone-500 text-[11px]">
                      {new Date(c.awardedAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-2.5 text-stone-600 text-[11px]">
                      {c.awardedBy}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Отменить вручение монеты для «${c.participantName}» за «${c.taskTitle}»?`)) {
                            onDeleteCoin(c.id);
                          }
                        }}
                        className="text-stone-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                        title="Отозвать монету"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
