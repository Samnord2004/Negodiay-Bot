import React, { useState } from 'react';
import { Award, Plus, Trash, Trophy, Users, Calendar, FileText, CheckCircle2, ChevronDown, ChevronUp, Eye, X, Edit2, History, ListFilter, Archive, Filter } from 'lucide-react';
import { Contest, Participant, ContestHistoryEntry, Excursion } from '../types';
import { initialContestHistory, initialExcursions } from '../mockData';
import { getSafeAvatar } from '../utils/avatar';
import ContestHistoryTable from './ContestHistoryTable';
import ArchiveRallyModal from './ArchiveRallyModal';

interface ContestsTabProps {
  contests: Contest[];
  onUpdateContests: (contests: Contest[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
  contestHistory?: ContestHistoryEntry[];
  onUpdateContestHistory?: (history: ContestHistoryEntry[]) => void;
  excursions?: Excursion[];
  onUpdateExcursions?: (excursions: Excursion[]) => void;
}

export default function ContestsTab({
  contests,
  onUpdateContests,
  participants,
  currentUser,
  isAdmin,
  contestHistory = initialContestHistory,
  onUpdateContestHistory = () => {},
  excursions = initialExcursions,
  onUpdateExcursions = () => {}
}: ContestsTabProps) {
  // USER REQUEST: Swap order so "Текущая программа слёта" is first by default, and "Таблица истории и мест" is second!
  const [activeSection, setActiveSection] = useState<'current' | 'history'>('current');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedContestId, setExpandedContestId] = useState<string | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<{ title: string; content: string; type: string } | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSuccessMessage, setArchiveSuccessMessage] = useState<string | null>(null);

  // Active rally
  const activeExcursion = excursions.find(e => e.isActive) || excursions[0];

  // Excursion filter for viewing contests
  const [filterExcursionId, setFilterExcursionId] = useState<string>('all');

  // Form states for creating new contest
  const [title, setTitle] = useState('');
  const [captainId, setCaptainId] = useState(participants[0]?.id || '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('Суббота, 14:00');
  const [contestExcursionId, setContestExcursionId] = useState<string>(activeExcursion?.id || excursions[0]?.id || '');
  const [contestCategory, setContestCategory] = useState<string>('Туризм');

  // Edit contest state
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [editAnchorPos, setEditAnchorPos] = useState<{ top: number; right: number } | null>(null);
  const [archiveAnchorPos, setArchiveAnchorPos] = useState<{ top: number; right: number } | null>(null);

  const filteredContests = contests.filter(c => {
    if (filterExcursionId === 'all') return true;
    return c.excursionId === filterExcursionId;
  });

  const handleCreateContest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cap = participants.find(p => p.id === captainId) || participants[0];
    const newContest: Contest = {
      id: 'contest_' + Date.now(),
      title: title.trim(),
      captainId: cap.id,
      captainName: cap.name,
      teamMemberIds: selectedMembers,
      place: place || undefined,
      description: description.trim() || undefined,
      schedule: schedule.trim() || undefined,
      excursionId: contestExcursionId || undefined,
      category: contestCategory || 'Туризм',
      attachments: []
    };

    onUpdateContests([...contests, newContest]);
    setTitle('');
    setDescription('');
    setSelectedMembers([]);
    setShowAddForm(false);
  };

  const handleDeleteContest = (id: string) => {
    if (confirm('Удалить этот конкурс из программы слёта?')) {
      onUpdateContests(contests.filter(c => c.id !== id));
    }
  };

  const handlePlaceChange = (id: string, newPlace: string) => {
    onUpdateContests(
      contests.map(c => c.id === id ? { ...c, place: newPlace } : c)
    );
  };

  // Toggle user participation in contest team
  const handleToggleMyParticipation = (contestId: string) => {
    if (!currentUser) return;
    const c = contests.find(item => item.id === contestId);
    if (!c) return;

    const memberIds = c.teamMemberIds || [];
    const isMember = memberIds.includes(currentUser.id);
    const updatedMembers = isMember
      ? memberIds.filter(id => id !== currentUser.id)
      : [...memberIds, currentUser.id];

    onUpdateContests(
      contests.map(item => item.id === contestId ? { ...item, teamMemberIds: updatedMembers } : item)
    );
  };

  // Archive rally flow: transfer places to history, zero current contests, archive excursion
  const handleConfirmArchive = async ({
    excursionId,
    year,
    overallPlace,
    updatedContests
  }: {
    excursionId: string;
    year: string;
    overallPlace: string;
    updatedContests: Contest[];
  }) => {
    // 1. Build updated history entries
    let newHistory: ContestHistoryEntry[] = [...contestHistory];

    // Transfer Overall Place
    if (overallPlace && overallPlace.trim()) {
      const overallIdx = newHistory.findIndex(h => 
        h.isOverall || h.category === 'Общий зачёт' || h.title.toLowerCase().includes('общий зачёт')
      );
      if (overallIdx >= 0) {
        newHistory[overallIdx] = {
          ...newHistory[overallIdx],
          results: {
            ...newHistory[overallIdx].results,
            [year]: overallPlace.trim()
          }
        };
      } else {
        newHistory.unshift({
          id: 'ch_overall_' + Date.now(),
          title: '🏆 Общий зачёт слёта',
          category: 'Общий зачёт',
          isOverall: true,
          results: { [year]: overallPlace.trim() }
        });
      }
    }

    // Transfer each contest place
    updatedContests.forEach((c, idx) => {
      const placeVal = (c.place || '').trim();
      if (!placeVal) return;
      const cleanTitle = c.title.trim();
      const existingIdx = newHistory.findIndex(h => 
        !h.isOverall && (h.title.toLowerCase() === cleanTitle.toLowerCase() || h.id === c.id)
      );

      if (existingIdx >= 0) {
        newHistory[existingIdx] = {
          ...newHistory[existingIdx],
          category: c.category || newHistory[existingIdx].category || 'Туризм',
          results: {
            ...newHistory[existingIdx].results,
            [year]: placeVal
          }
        };
      } else {
        newHistory.push({
          id: 'ch_' + Date.now() + '_' + idx,
          title: cleanTitle,
          category: c.category || 'Туризм',
          results: {
            [year]: placeVal
          }
        });
      }
    });

    // 2. Persist updated history
    onUpdateContestHistory(newHistory);
    try {
      await fetch('/api/contests/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: newHistory })
      });
    } catch (err) {
      console.error('History sync error:', err);
    }

    // 3. ZERO OUT CONTESTS FOR THIS EXCURSION ("обнулять все конкурсы")
    const remainingContests = contests.filter(c => c.excursionId && c.excursionId !== excursionId);
    onUpdateContests(remainingContests);

    // 4. Archive the excursion
    if (onUpdateExcursions && excursions) {
      const updatedExcursions = excursions.map(e => e.id === excursionId ? { ...e, isActive: false } : e);
      onUpdateExcursions(updatedExcursions);
      try {
        await fetch(`/api/excursions/${excursionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false })
        });
      } catch (err) {
        console.error('Archive excursion error:', err);
      }
    }

    // 5. Show toast message and switch to History section so captain sees recorded results!
    const targetEx = excursions.find(e => e.id === excursionId);
    setArchiveSuccessMessage(`Слёт «${targetEx?.title || 'Слёт'}» успешно перемещён в архив! Все результаты и общий зачёт внесены в летопись за ${year} год, а конкурсы слёта обнулены.`);
    setTimeout(() => setArchiveSuccessMessage(null), 8000);
    setActiveSection('history');
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION SWITCHER: CURRENT (1st) vs HISTORY (2nd) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-amber-200/60 rounded-2xl border-2 border-amber-300 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection('current')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'current'
              ? 'bg-red-600 text-yellow-300 shadow-md scale-102 border border-amber-950'
              : 'bg-white/80 hover:bg-white text-amber-950'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Текущая программа слёта ({contests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'history'
              ? 'bg-red-600 text-yellow-300 shadow-md scale-102 border border-amber-950'
              : 'bg-white/80 hover:bg-white text-amber-950'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Таблица истории и мест (1993–2026)</span>
        </button>
      </div>

      {/* Success banner after archiving */}
      {archiveSuccessMessage && (
        <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-950 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-black">{archiveSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setArchiveSuccessMessage(null)}
            className="p-1 hover:bg-emerald-200 rounded-lg text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {activeSection === 'current' ? (
        <>
          {/* Header Banner */}
          <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 inline-block shadow">
                🏆 Битва за кубок слёта
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
                Конкурсы и соревнования
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Составы сборных команд Негодяев, капитаны, привязка к слёту, схемы дистанций и завоёванные награды
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && activeExcursion && (
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setArchiveAnchorPos({
                      top: rect.bottom + 8,
                      right: Math.max(12, window.innerWidth - rect.right)
                    });
                    setIsArchiveModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black uppercase text-xs sm:text-sm px-4 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                  title="Подвести итоги слёта, занести результаты в историю и обнулить конкурсы"
                >
                  <Archive size={18} />
                  <span>Завершить слёт в архив</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={18} /> Добавить конкурс
              </button>
            </div>
          </div>

          {/* Rally Selector & Filter Bar */}
          <div className="bg-amber-100/80 border-2 border-amber-300 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                <Filter size={14} className="text-red-600" /> Фильтр по слёту:
              </span>
              <select
                value={filterExcursionId}
                onChange={(e) => setFilterExcursionId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-400 rounded-xl text-xs font-black text-amber-950 outline-none"
              >
                <option value="all">Все слёты и выезды ({contests.length})</option>
                {excursions.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} {ex.isActive ? '🔥 (Актуальный)' : '📦 (Архив)'}
                  </option>
                ))}
              </select>
            </div>

            {activeExcursion && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950 bg-white/80 px-3 py-1 rounded-xl border border-amber-300">
                <span>⛺ Актуальный сбор:</span>
                <span className="font-black text-red-700">{activeExcursion.title}</span>
              </div>
            )}
          </div>

          {/* Add Contest Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateContest}
              className="bg-yellow-50 border-3 border-red-500 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-2">
                  <Trophy size={18} /> Новая конкурсная дисциплина
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-black text-amber-900 hover:text-red-600"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-amber-950">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black mb-1">Название конкурса:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Туристическая полоса препятствий"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Капитан команды:</label>
                  <select
                    value={captainId}
                    onChange={(e) => setCaptainId(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5"
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RALLY BINDING & CATEGORY (PRIMARY USER REQUIREMENT) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-amber-950 bg-amber-100/60 p-3 rounded-2xl border border-amber-300">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1 text-red-700">
                    ⛺ Привязка к слёту / выезду:
                  </label>
                  <select
                    value={contestExcursionId}
                    onChange={(e) => setContestExcursionId(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 font-black text-amber-950"
                  >
                    {excursions.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} {ex.isActive ? '🔥 (Актуальный слёт)' : '📦 (Архив)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1 text-red-700">
                    🏷️ Категория дисциплины:
                  </label>
                  <select
                    value={contestCategory}
                    onChange={(e) => setContestCategory(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 font-black text-amber-950"
                  >
                    <option value="Туризм">🌲 Туризм и ориентирование</option>
                    <option value="Творчество">🎸 Творчество и костёр</option>
                    <option value="Спорт">⚽ Спорт и эстафеты</option>
                    <option value="Лагерь">🏕️ Лагерь и кулинария</option>
                    <option value="Общий зачёт">🏆 Общий зачёт слёта</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-amber-950">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Расписание / Время старта:</label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Суббота, 15:00, Главная поляна"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Занятое место (если известно):</label>
                  <select
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5"
                  >
                    <option value="">Ещё не завершился</option>
                    <option value="🥇 1-е место (Золото)">🥇 1-е место (Золото)</option>
                    <option value="🥈 2-е место (Серебро)">🥈 2-е место (Серебро)</option>
                    <option value="🥉 3-е место (Бронза)">🥉 3-е место (Бронза)</option>
                    <option value="Призёр слёта">Призёр слёта</option>
                    <option value="Участие и угар">Участие и угар</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Правила и описание:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Условия этапа, экипировка, штрафные баллы..."
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow cursor-pointer"
                >
                  Добавить в программу
                </button>
              </div>
            </form>
          )}

          {/* Contests List */}
          <div className="space-y-4">
            {filteredContests.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-amber-300 rounded-3xl p-8 text-center space-y-2">
                <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="font-black text-amber-950 uppercase">В этой программе пока нет конкурсов</h4>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Нажмите «Добавить конкурс», чтобы создать соревновательную дисциплину для слёта, назначить капитана и открыть запись в команду.
                </p>
              </div>
            ) : (
              filteredContests.map((c) => {
                const participatingMembers = participants.filter(p => c.teamMemberIds?.includes(p.id) && p.id !== c.captainId);
                const isCurrentUserInTeam = currentUser && (c.teamMemberIds?.includes(currentUser.id) || c.captainId === currentUser.id);
                const totalParticipantsCount = (c.captainId ? 1 : 0) + participatingMembers.length;
                const linkedEx = excursions.find(e => e.id === c.excursionId);

                return (
                  <div
                    key={c.id}
                    className="bg-white border-3 border-amber-300 hover:border-red-500 rounded-3xl p-5 sm:p-6 shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-stone-900 text-yellow-300 font-black text-xs px-3 py-1 rounded-full shadow-sm">
                            {c.schedule || 'По графику слёта'}
                          </span>

                          {/* Linked Excursion badge */}
                          {linkedEx && (
                            <span className="bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs flex items-center gap-1">
                              ⛺ {linkedEx.title}
                            </span>
                          )}

                          {/* Category badge */}
                          {c.category && (
                            <span className="bg-stone-100 text-stone-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-stone-200">
                              {c.category}
                            </span>
                          )}

                          {c.place && (
                            <span className="bg-yellow-300 text-amber-950 font-black text-xs px-3 py-1 rounded-full border border-yellow-500 shadow-sm">
                              {c.place}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-tight">
                          {c.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Result selection */}
                        <select
                          value={c.place || ''}
                          onChange={(e) => handlePlaceChange(c.id, e.target.value)}
                          className="bg-amber-50 border border-amber-300 text-amber-950 text-xs font-black rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                        >
                          <option value="">Без награды</option>
                          <option value="🥇 1-е место">🥇 1-е место</option>
                          <option value="🥈 2-е место">🥈 2-е место</option>
                          <option value="🥉 3-е место">🥉 3-е место</option>
                          <option value="4-е место">4-е место</option>
                          <option value="5-е место">5-е место</option>
                          <option value="Призёр">Призёр</option>
                          <option value="Участие и угар">Участие</option>
                        </select>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setEditAnchorPos({
                                  top: rect.bottom + 8,
                                  right: Math.max(12, window.innerWidth - rect.right)
                                });
                                setEditingContest(c);
                              }}
                              className="p-2 text-stone-500 hover:text-amber-600 rounded-xl transition-colors cursor-pointer"
                              title="Редактировать конкурс"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContest(c.id)}
                              className="p-2 text-stone-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                              title="Удалить конкурс"
                            >
                              <Trash size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Full Participants & Captain Roster */}
                    <div className="bg-amber-50/80 p-4 rounded-2xl border-2 border-amber-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                          <Users size={16} className="text-red-600" />
                          Состав участников на конкурсе ({totalParticipantsCount} чел.):
                        </span>
                        
                        {currentUser && c.captainId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleMyParticipation(c.id)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black uppercase transition-all shadow-sm cursor-pointer ${
                              isCurrentUserInTeam
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-yellow-300'
                            }`}
                          >
                            {isCurrentUserInTeam ? '✓ Я в команде (Выйти)' : '+ Записаться в команду'}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Captain Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-200 border-2 border-amber-400 rounded-xl shadow-2xs">
                          <span className="text-base">👑</span>
                          <div>
                            <div className="text-xs font-black text-amber-950 leading-tight flex items-center gap-1.5">
                              <span>{c.captainName}</span>
                              <span className="bg-red-600 text-yellow-300 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                                Капитан конкурса
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Participating Members */}
                        {participatingMembers.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-amber-300 rounded-xl shadow-2xs"
                          >
                            <img
                              src={getSafeAvatar(m.avatar, m.gender)}
                              alt={m.name}
                              className="w-6 h-6 rounded-full object-cover border border-amber-400 shrink-0"
                            />
                            <div>
                              <div className="text-xs font-bold text-amber-950 leading-tight">
                                {m.name}
                              </div>
                              <div className="text-[10px] text-red-600 font-semibold">
                                @{m.nickname}
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (c.teamMemberIds || []).filter(id => id !== m.id);
                                  onUpdateContests(contests.map(item => item.id === c.id ? { ...item, teamMemberIds: updated } : item));
                                }}
                                className="text-stone-400 hover:text-red-600 ml-1 text-xs cursor-pointer"
                                title="Исключить"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        {participatingMembers.length === 0 && (
                          <span className="text-xs text-stone-500 italic py-1">
                            (Пока только капитан. Другие участники команды могут записаться выше!)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <div className="text-xs font-medium text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-200">
                        {c.description}
                      </div>
                    )}

                    {/* Attachments & Diagrams preview */}
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-amber-100">
                        <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5">
                          <FileText size={14} className="text-red-600" /> Схемы, знаки и шпаргалки к этапу:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {c.attachments.map((att, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => setActiveAttachment(att)}
                              className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Eye size={13} className="text-red-600" />
                              <span>{att.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <ContestHistoryTable
          history={contestHistory}
          onUpdateHistory={onUpdateContestHistory}
          isAdmin={isAdmin}
        />
      )}

      {/* ATTACHMENT MODAL (SVG / SCHEMAS) */}
      {activeAttachment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border-4 border-amber-400 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
                <FileText size={18} /> {activeAttachment.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveAttachment(null)}
                className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center overflow-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
              <div
                dangerouslySetInnerHTML={{ __html: activeAttachment.content }}
                className="w-full flex items-center justify-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONTEST MODAL (Anchored to Trigger Button) */}
      {editingContest && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-stone-950/35 backdrop-blur-2xs" 
            onClick={() => setEditingContest(null)} 
          />
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование конкурса"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${Math.min(window.innerHeight - 560, Math.max(12, editAnchorPos?.top ?? 80))}px`,
              right: `${Math.max(12, editAnchorPos?.right ?? 16)}px`,
              maxHeight: 'calc(100vh - 90px)',
            }}
            className="fixed z-50 bg-amber-100 rounded-3xl max-w-xl w-[92vw] p-6 shadow-2xl space-y-4 border-4 border-amber-400 overflow-y-auto animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <h3 className="font-black text-lg uppercase text-red-700 flex items-center gap-2">
                <Edit2 size={20} /> Редактирование конкурса
              </h3>
              <button
                type="button"
                onClick={() => setEditingContest(null)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-amber-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingContest.title.trim()) return;
                const cap = participants.find(p => p.id === editingContest.captainId) || participants[0];
                const updatedContest: Contest = {
                  ...editingContest,
                  title: editingContest.title.trim(),
                  captainId: cap.id,
                  captainName: cap.name,
                  place: editingContest.place || undefined,
                  description: editingContest.description?.trim() || undefined,
                  schedule: editingContest.schedule?.trim() || undefined,
                  excursionId: editingContest.excursionId || undefined,
                  category: editingContest.category || 'Туризм'
                };
                onUpdateContests(contests.map(c => c.id === updatedContest.id ? updatedContest : c));
                setEditingContest(null);
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-xs uppercase font-black mb-1 text-amber-950">Название конкурса:</label>
                <input
                  type="text"
                  required
                  value={editingContest.title}
                  onChange={(e) => setEditingContest({ ...editingContest, title: e.target.value })}
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-sm font-bold text-amber-950 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Excursion and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-black mb-1 text-amber-950">Привязка к слёту:</label>
                  <select
                    value={editingContest.excursionId || ''}
                    onChange={(e) => setEditingContest({ ...editingContest, excursionId: e.target.value })}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950"
                  >
                    <option value="">Без привязки</option>
                    {excursions.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} {ex.isActive ? '🔥 (Актуальный)' : '📦 (Архив)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-black mb-1 text-amber-950">Категория:</label>
                  <select
                    value={editingContest.category || 'Туризм'}
                    onChange={(e) => setEditingContest({ ...editingContest, category: e.target.value })}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950"
                  >
                    <option value="Туризм">🌲 Туризм и ориентирование</option>
                    <option value="Творчество">🎸 Творчество и костёр</option>
                    <option value="Спорт">⚽ Спорт и эстафеты</option>
                    <option value="Лагерь">🏕️ Лагерь и кулинария</option>
                    <option value="Общий зачёт">🏆 Общий зачёт слёта</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-black mb-1 text-amber-950">Капитан команды:</label>
                  <select
                    value={editingContest.captainId}
                    onChange={(e) => setEditingContest({ ...editingContest, captainId: e.target.value })}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950"
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-black mb-1 text-amber-950">Время / Расписание:</label>
                  <input
                    type="text"
                    value={editingContest.schedule || ''}
                    onChange={(e) => setEditingContest({ ...editingContest, schedule: e.target.value })}
                    placeholder="Например, Суббота, 14:00"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-black mb-1 text-amber-950">Занятое место / Награда:</label>
                <select
                  value={editingContest.place || ''}
                  onChange={(e) => setEditingContest({ ...editingContest, place: e.target.value })}
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950"
                >
                  <option value="">Без награды</option>
                  <option value="🥇 1-е место">🥇 1-е место</option>
                  <option value="🥈 2-е место">🥈 2-е место</option>
                  <option value="🥉 3-е место">🥉 3-е место</option>
                  <option value="4-е место">4-е место</option>
                  <option value="5-е место">5-е место</option>
                  <option value="Призёр">Призёр</option>
                  <option value="Участие и угар">Участие и угар</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-black mb-1 text-amber-950">Состав участников команды:</label>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-300 max-h-40 overflow-y-auto space-y-1.5">
                  {participants.map(p => {
                    const isSelected = (editingContest.teamMemberIds || []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-200 text-amber-950' : 'hover:bg-amber-100 text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const cur = editingContest.teamMemberIds || [];
                            const updated = isSelected ? cur.filter(id => id !== p.id) : [...cur, p.id];
                            setEditingContest({ ...editingContest, teamMemberIds: updated });
                          }}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>{p.name}</span>
                        <span className="text-[10px] text-stone-500 font-normal">@{p.nickname}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-black mb-1 text-amber-950">Правила и описание:</label>
                <textarea
                  rows={3}
                  value={editingContest.description || ''}
                  onChange={(e) => setEditingContest({ ...editingContest, description: e.target.value })}
                  placeholder="Условия этапа, экипировка, штрафные баллы..."
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-semibold text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-300">
                <button
                  type="button"
                  onClick={() => setEditingContest(null)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow transition-colors cursor-pointer"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ARCHIVE RALLY MODAL WITH MISSING PLACE REMINDER */}
      {isArchiveModalOpen && activeExcursion && (
        <ArchiveRallyModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          anchorPos={archiveAnchorPos}
          excursion={activeExcursion}
          contests={contests}
          contestHistory={contestHistory}
          onConfirmArchive={handleConfirmArchive}
        />
      )}

    </div>
  );
}
