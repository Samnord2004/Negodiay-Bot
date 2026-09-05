import React, { useState } from 'react';
import { Award, Plus, Trash, Trophy, Users, Calendar, FileText, CheckCircle2, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { Contest, Participant } from '../types';

interface ContestsTabProps {
  contests: Contest[];
  onUpdateContests: (contests: Contest[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
}

export default function ContestsTab({
  contests,
  onUpdateContests,
  participants,
  currentUser,
  isAdmin
}: ContestsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedContestId, setExpandedContestId] = useState<string | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<{ title: string; content: string; type: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [captainId, setCaptainId] = useState(participants[0]?.id || '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('Суббота, 14:00');

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

  return (
    <div className="space-y-6">
      
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
            Составы сборных команд Негодяев, капитаны, схемы дистанций и завоёванные награды
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0"
        >
          <Plus size={18} /> Добавить конкурс
        </button>
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
              className="px-4 py-2 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow"
            >
              Добавить в программу
            </button>
          </div>
        </form>
      )}

      {/* Contests List */}
      <div className="space-y-4">
        {contests.map((c) => {
          const participatingMembers = participants.filter(p => c.teamMemberIds?.includes(p.id) && p.id !== c.captainId);
          const isCurrentUserInTeam = currentUser && (c.teamMemberIds?.includes(currentUser.id) || c.captainId === currentUser.id);
          const totalParticipantsCount = (c.captainId ? 1 : 0) + participatingMembers.length;

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
                    className="bg-amber-50 border border-amber-300 text-amber-950 text-xs font-black rounded-xl px-3 py-1.5 outline-none"
                  >
                    <option value="">Без награды</option>
                    <option value="🥇 1-е место">🥇 1-е место</option>
                    <option value="🥈 2-е место">🥈 2-е место</option>
                    <option value="🥉 3-е место">🥉 3-е место</option>
                    <option value="Призёр">Призёр</option>
                  </select>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteContest(c.id)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl transition-colors"
                      title="Удалить конкурс"
                    >
                      <Trash size={16} />
                    </button>
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
                      className={`py-1.5 px-3 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
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
                        src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
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
                          className="text-stone-400 hover:text-red-600 ml-1 text-xs"
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
                        className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
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
        })}
      </div>

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
                className="p-1 text-stone-400 hover:text-stone-900"
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

    </div>
  );
}
