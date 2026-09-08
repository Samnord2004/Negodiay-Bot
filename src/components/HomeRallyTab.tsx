import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, MapPin, Coins, AlertCircle, 
  CheckCircle, Plus, Send, ChevronDown, ChevronUp, Sparkles, MessageSquare,
  CheckSquare, Coffee, Tent, Trophy, Palette, Edit
} from 'lucide-react';
import { Participant, Excursion, TaskItem, MenuItem, GroceryItem, Contest, CreativityIdea } from '../types';
import { getSafeAvatar } from '../utils/avatar';
import { formatBirthdayShort } from '../utils/dateUtils';
import TasksTab from './TasksTab';
import MenuGroceriesTab from './MenuGroceriesTab';
import ContestsTab from './ContestsTab';
import CreativityTab from './CreativityTab';

export type HomeRallySubTab = 'overview' | 'tasks' | 'menu' | 'contests' | 'creativity';

interface HomeRallyTabProps {
  participants: Participant[];
  excursions: Excursion[];
  onUpdateParticipants: (p: Participant[]) => void;
  onUpdateExcursions?: (ex: Excursion[]) => void;
  onSelectParticipantForPayment?: (p: Participant) => void;
  onNudgeDebtor: (p: Participant) => void;
  onNavigateToTab: (tab: string) => void;
  // Sub-tabs data
  tasks?: TaskItem[];
  onUpdateTasks?: (tasks: TaskItem[]) => void;
  menuItems?: MenuItem[];
  groceryItems?: GroceryItem[];
  onUpdateMenu?: (items: MenuItem[]) => void;
  onUpdateGroceries?: (items: GroceryItem[]) => void;
  contests?: Contest[];
  onUpdateContests?: (contests: Contest[]) => void;
  creativityIdeas?: CreativityIdea[];
  onIdeaAdded?: (idea: CreativityIdea) => void;
  onIdeaVoted?: (ideaId: string) => void;
  onCommentAdded?: (ideaId: string, text: string) => void;
  onStatusChanged?: (ideaId: string, status: CreativityIdea['status']) => void;
  currentUser: Participant | null;
  isAdmin: boolean;
  activeSubTab?: HomeRallySubTab;
  onSubTabChange?: (tab: HomeRallySubTab) => void;
}

export default function HomeRallyTab({
  participants,
  excursions,
  onUpdateParticipants,
  onUpdateExcursions,
  onNudgeDebtor,
  onNavigateToTab,
  tasks = [],
  onUpdateTasks = () => {},
  menuItems = [],
  groceryItems = [],
  onUpdateMenu = () => {},
  onUpdateGroceries = () => {},
  contests = [],
  onUpdateContests = () => {},
  creativityIdeas = [],
  onIdeaAdded = () => {},
  onIdeaVoted = () => {},
  onCommentAdded = () => {},
  onStatusChanged = () => {},
  currentUser,
  isAdmin,
  activeSubTab = 'overview',
  onSubTabChange
}: HomeRallyTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<HomeRallySubTab>(activeSubTab);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [selectedForPay, setSelectedForPay] = useState<string | null>(null);
  
  // Excursion editing state
  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [isSavingExcursion, setIsSavingExcursion] = useState(false);

  // Skipped years editing state
  const [editingSkippedParticipant, setEditingSkippedParticipant] = useState<Participant | null>(null);
  const [tempSkippedYears, setTempSkippedYears] = useState<number[]>([]);
  const [isSavingSkippedYears, setIsSavingSkippedYears] = useState(false);

  // Debtor nudging feedback
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab) {
      setInternalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSubTabSwitch = (tab: HomeRallySubTab) => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const activeExcursions = excursions.filter(e => e.isActive);
  const isCaptain = isAdmin || currentUser?.role === 'admin';
  const canManagePayments = isCaptain || currentUser?.role === 'treasurer';

  const totalTargetFunds = participants.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalPaidFunds = participants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalDebt = Math.max(0, totalTargetFunds - totalPaidFunds);
  const debtorsCount = participants.filter(p => (p.debtAmount || 0) > 0).length;

  const pendingTasksCount = tasks.filter(t => !t.isCompleted).length;
  const unboughtGroceriesCount = groceryItems.filter(g => !g.isBought).length;

  const handleAddPayment = (pId: string) => {
    onUpdateParticipants(participants.map(p => {
      if (p.id === pId) {
        const newPaid = (p.paidAmount || 0) + paymentAmount;
        const newDebt = Math.max(0, (p.totalCost || 0) - newPaid);
        return {
          ...p,
          paidAmount: newPaid,
          debtAmount: newDebt
        };
      }
      return p;
    }));
    setSelectedForPay(null);
  };

  const getTeamYearsText = (joinedYear: number, skippedYears?: number[]) => {
    const currentY = new Date().getFullYear();
    const years = currentY - (joinedYear || 1993) - (skippedYears ? skippedYears.length : 0);
    const positiveYears = Math.max(0, years);
    const lastDigit = positiveYears % 10;
    const lastTwoDigits = positiveYears % 100;
    let word = 'лет';
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      word = 'лет';
    } else if (lastDigit === 1) {
      word = 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      word = 'года';
    }
    return `${positiveYears} ${word}`;
  };

  const handleSaveExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExcursion) return;
    setIsSavingExcursion(true);
    try {
      const res = await fetch(`/api/excursions/${editingExcursion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingExcursion)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions && onUpdateExcursions) {
          onUpdateExcursions(data.excursions);
        } else if (onUpdateExcursions) {
          onUpdateExcursions(excursions.map(ex => ex.id === editingExcursion.id ? editingExcursion : ex));
        }
        setEditingExcursion(null);
      }
    } catch (err) {
      console.error("Excursion update failed:", err);
    } finally {
      setIsSavingExcursion(false);
    }
  };

  const handleSaveSkippedYears = async () => {
    if (!editingSkippedParticipant) return;
    setIsSavingSkippedYears(true);
    try {
      const cleanYears = tempSkippedYears.filter(y => !isNaN(y)).sort((a, b) => a - b);
      const res = await fetch(`/api/participants/${editingSkippedParticipant.id}/skipped-years`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skippedYears: cleanYears })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.participant) {
          onUpdateParticipants(participants.map(p => p.id === data.participant.id ? data.participant : p));
        } else {
          onUpdateParticipants(participants.map(p => p.id === editingSkippedParticipant.id ? { ...p, skippedYears: cleanYears } : p));
        }
        setEditingSkippedParticipant(null);
      }
    } catch (err) {
      console.error("Skipped years update error:", err);
    } finally {
      setIsSavingSkippedYears(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION TABS FOR "ПЛАНИРУЕМЫЕ СЛЁТЫ" */}
      <div className="bg-stone-100/90 border border-stone-200 p-1.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          
          <button
            type="button"
            onClick={() => handleSubTabSwitch('overview')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'overview'
                ? 'bg-white text-red-600 border border-stone-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Tent size={16} className={internalSubTab === 'overview' ? 'text-red-600' : 'text-stone-400'} />
            <span>Обзор и взносы</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('tasks')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'tasks'
                ? 'bg-white text-red-600 border border-stone-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <CheckSquare size={16} className={internalSubTab === 'tasks' ? 'text-red-600' : 'text-stone-400'} />
            <span>Задачи слёта</span>
            {pendingTasksCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('menu')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'menu'
                ? 'bg-white text-red-600 border border-stone-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Coffee size={16} className={internalSubTab === 'menu' ? 'text-red-600' : 'text-stone-400'} />
            <span>Меню и продукты</span>
            {unboughtGroceriesCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unboughtGroceriesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('contests')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'contests'
                ? 'bg-white text-red-600 border border-stone-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Trophy size={16} className={internalSubTab === 'contests' ? 'text-red-600' : 'text-stone-400'} />
            <span>Конкурсы</span>
            {contests.length > 0 && (
              <span className="bg-stone-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {contests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('creativity')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'creativity'
                ? 'bg-white text-red-600 border border-stone-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Palette size={16} className={internalSubTab === 'creativity' ? 'text-red-600' : 'text-stone-400'} />
            <span>Творчество</span>
            {creativityIdeas.length > 0 && (
              <span className="bg-stone-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {creativityIdeas.length}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* SUBTAB 1: RALLY OVERVIEW & FEES */}
      {internalSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Banner Overview */}
          <div className="bg-gradient-to-br from-amber-50/60 via-white to-stone-50 border border-stone-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="bg-red-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-xs">
                  🏕️ Официальный штаб слёта
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 uppercase mt-2.5 leading-tight">
                  туристической команды "Негодяи"
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                  Планируемые лесные слёты, стоянки у костра, палаточные лагеря и дух приключений. Единый реестр участников, казна сборов, горящие задачи и раскладка походного питания.
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white border border-stone-200 p-3.5 rounded-2xl shrink-0 shadow-xs">
                <div className="text-center px-1.5">
                  <span className="block text-[10px] uppercase font-bold text-stone-500">Собрано</span>
                  <span className="text-base sm:text-xl font-black text-emerald-600">{totalPaidFunds.toLocaleString()} ₽</span>
                </div>
                <div className="text-center px-1.5 border-x border-stone-200">
                  <span className="block text-[10px] uppercase font-bold text-stone-500">Долг команды</span>
                  <span className="text-base sm:text-xl font-black text-red-600">{totalDebt.toLocaleString()} ₽</span>
                </div>
                <div className="text-center px-1.5">
                  <span className="block text-[10px] uppercase font-bold text-stone-500">Должников</span>
                  <span className="text-base sm:text-xl font-black text-red-600 flex items-center justify-center gap-1">
                    {debtorsCount}
                    {debtorsCount > 0 && <AlertCircle size={14} className="text-red-500" />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Hikes / Gathering Schedule */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase flex items-center gap-2">
                  <Calendar size={20} className="text-red-600" />
                  Активные Сборы и Походы
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Текущие утвержденные выезды и расчет сумм взносов (редактирование доступно только капитану)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeExcursions.map(ex => (
                <div key={ex.id} className="bg-stone-50/60 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-amber-400 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-base uppercase text-stone-900">{ex.title}</h4>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Активен
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 mt-1.5">
                      <span className="flex items-center gap-1">📍 {ex.location}</span>
                      <span className="flex items-center gap-1">📅 {ex.date}</span>
                    </div>
                    {ex.description && (
                      <p className="text-xs text-stone-600 mt-2 font-normal leading-relaxed">
                        {ex.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                        🧑 Парни: {ex.costBoys || ex.costPerPerson} ₽
                      </span>
                      <span className="bg-pink-50 text-pink-700 px-2.5 py-1 rounded-lg border border-pink-200">
                        👩 Девчули: {ex.costGirls || Math.round(ex.costPerPerson * 0.7)} ₽
                      </span>
                    </div>

                    {isCaptain && (
                      <button
                        type="button"
                        onClick={() => setEditingExcursion({ ...ex })}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                        title="Редактировать слёт и взносы (доступно капитану)"
                      >
                        <Edit size={14} className="text-white" />
                        <span>Редактировать слёт</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants Roster & Debt Register */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase flex items-center gap-2">
                  <Users size={20} className="text-red-600" />
                  Реестр Негодяев команды ({participants.length})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Учет взносов на текущий слёт, стаж в команде и дни рождения
                </p>
              </div>
              {!canManagePayments && (
                <div className="text-[11px] font-semibold text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
                  <span>🔒 Оплаты вносят Казначей и Капитан</span>
                </div>
              )}
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-stone-50 uppercase text-stone-600 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Негодяй</th>
                    <th className="p-3">Роль</th>
                    <th className="p-3">Стаж</th>
                    <th className="p-3">🎂 Днюха (ДД.ММ.ГГ)</th>
                    <th className="p-3">Сдано / Всего</th>
                    <th className="p-3">Задолженность</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {participants.map(p => {
                    const isDebtor = (p.debtAmount || 0) > 0;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Participant Avatar & Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img src={getSafeAvatar(p.avatar, p.gender)} alt={p.name} className="w-9 h-9 rounded-full border border-stone-200 bg-white object-cover" />
                            <div>
                              <p className="font-bold text-sm text-stone-900 leading-tight">{p.name}</p>
                              <span className="text-[11px] font-semibold text-red-600">@{p.nickname}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3">
                          {p.role === 'admin' && (
                            <span className="bg-red-50 text-red-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-red-200 shadow-2xs">
                              Капитан
                            </span>
                          )}
                          {p.role === 'treasurer' && (
                            <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                              Казначей
                            </span>
                          )}
                          {p.role === 'chef' && (
                            <span className="bg-amber-50 text-amber-800 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                              Шеф-повар
                            </span>
                          )}
                          {(!p.role || p.role === 'member') && (
                            <span className="bg-stone-100 text-stone-700 font-medium text-[10px] uppercase px-2 py-0.5 rounded">
                              Негодяй
                            </span>
                          )}
                          {p.role && p.role !== 'admin' && p.role !== 'treasurer' && p.role !== 'chef' && p.role !== 'member' && (
                            <span className="bg-stone-100 text-stone-700 font-medium text-[10px] uppercase px-2 py-0.5 rounded">
                              {p.roleTitle || p.role}
                            </span>
                          )}
                        </td>

                        {/* Team Age & Skipped Years */}
                        <td className="p-3">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>{getTeamYearsText(p.joinedYear || 1993, p.skippedYears)}</span>
                            <span className="text-[11px] text-stone-500 font-normal">(с {p.joinedYear || 1993} г.)</span>
                          </div>

                          {/* Skipped Years display */}
                          {p.skippedYears && p.skippedYears.length > 0 ? (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                <span>Пропущено слётов:</span>
                                <strong className="text-red-700 font-bold">{p.skippedYears.slice().sort((a,b)=>a-b).join(', ')}</strong>
                                <span className="text-[10px] text-red-600">({p.skippedYears.length} г.)</span>
                              </span>
                              {(isAdmin || currentUser?.id === p.id) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSkippedParticipant(p);
                                    setTempSkippedYears(Array.isArray(p.skippedYears) ? [...p.skippedYears] : []);
                                  }}
                                  className="text-[10px] text-red-600 hover:text-red-800 underline font-bold"
                                  title="Изменить пропущенные года слёта"
                                >
                                  ред.
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                                🎖️ Без пропусков
                              </span>
                              {(isAdmin || currentUser?.id === p.id) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSkippedParticipant(p);
                                    setTempSkippedYears([]);
                                  }}
                                  className="text-[10px] text-stone-500 hover:text-red-600 underline font-medium"
                                  title="Указать пропущенные слёты"
                                >
                                  + пропуск
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Birthday */}
                        <td className="p-3 font-semibold text-stone-700">
                          {p.birthday ? formatBirthdayShort(p.birthday) : '—'}
                        </td>

                        {/* Paid vs Total */}
                        <td className="p-3">
                          <div className="font-bold text-stone-900">
                            <span className="text-emerald-600 font-black">{p.paidAmount.toLocaleString()} ₽</span>
                            <span className="text-stone-400 font-normal"> / {p.totalCost.toLocaleString()} ₽</span>
                          </div>
                        </td>

                        {/* Debt */}
                        <td className="p-3">
                          {isDebtor ? (
                            <span className="bg-red-50 text-red-700 font-bold text-xs px-2 py-1 rounded-lg border border-red-200 inline-flex items-center gap-1">
                              <AlertCircle size={12} />
                              {p.debtAmount.toLocaleString()} ₽
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle size={12} />
                              Сдал всё!
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isDebtor && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setNudgingId(p.id);
                                  await onNudgeDebtor(p);
                                  setTimeout(() => setNudgingId(null), 2500);
                                }}
                                disabled={nudgingId === p.id}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 font-bold text-[10px] uppercase rounded-lg border border-amber-300 flex items-center gap-1 transition-all disabled:opacity-80"
                                title="Отправить напоминание о взносе в чат от лица Бота Максимки"
                              >
                                <span>⚡</span>
                                <span>{nudgingId === p.id ? 'Пнули! ⚡' : 'Пнуть ⚡'}</span>
                              </button>
                            )}
                            {canManagePayments && (
                              <button
                                type="button"
                                onClick={() => setSelectedForPay(selectedForPay === p.id ? null : p.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg shadow-xs"
                                title="Внести оплату (казначей или капитан)"
                              >
                                + Оплата
                              </button>
                            )}
                          </div>

                          {selectedForPay === p.id && canManagePayments && (
                            <div className="mt-2 p-2 bg-stone-50 rounded-xl border border-stone-200 text-left flex items-center gap-2">
                              <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-stone-300 rounded text-xs font-bold text-stone-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddPayment(p.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded shadow-xs"
                              >
                                Зачесть
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedForPay(null)}
                                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] uppercase rounded"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: TASKS TAB */}
      {internalSubTab === 'tasks' && (
        <div className="animate-in fade-in duration-200">
          <TasksTab
            tasks={tasks}
            onUpdateTasks={onUpdateTasks}
            participants={participants}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* SUBTAB 3: MENU & GROCERIES TAB */}
      {internalSubTab === 'menu' && (
        <div className="animate-in fade-in duration-200">
          <MenuGroceriesTab
            menuItems={menuItems}
            groceryItems={groceryItems}
            onUpdateMenu={onUpdateMenu}
            onUpdateGroceries={onUpdateGroceries}
            participants={participants}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* SUBTAB 4: CONTESTS TAB */}
      {internalSubTab === 'contests' && (
        <div className="animate-in fade-in duration-200">
          <ContestsTab
            contests={contests}
            onUpdateContests={onUpdateContests}
            participants={participants}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* SUBTAB 5: CREATIVITY TAB */}
      {internalSubTab === 'creativity' && (
        <div className="animate-in fade-in duration-200">
          <CreativityTab
            ideas={creativityIdeas}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onIdeaAdded={onIdeaAdded}
            onIdeaVoted={onIdeaVoted}
            onCommentAdded={onCommentAdded}
            onStatusChanged={onStatusChanged}
          />
        </div>
      )}

      {/* MODAL: EDIT EXCURSION */}
      {editingExcursion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-amber-50 border-4 border-red-600 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-amber-200">
              <h4 className="font-black text-base uppercase text-amber-950 flex items-center gap-2">
                <Edit size={18} className="text-red-600" />
                <span>Редактирование слёта и взносов</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingExcursion(null)}
                className="text-amber-800 hover:text-red-600 font-black text-sm px-2 py-1 rounded-lg hover:bg-amber-200"
              >
                ✕ Закрыть
              </button>
            </div>

            <form onSubmit={handleSaveExcursion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-amber-950 uppercase mb-1">Название сбора:</label>
                  <input
                    type="text"
                    required
                    value={editingExcursion.title}
                    onChange={(e) => setEditingExcursion({ ...editingExcursion, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-amber-950 uppercase mb-1">Локация проведения:</label>
                  <input
                    type="text"
                    required
                    value={editingExcursion.location}
                    onChange={(e) => setEditingExcursion({ ...editingExcursion, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-amber-950 uppercase mb-1">Дата проведения:</label>
                  <input
                    type="text"
                    value={editingExcursion.date}
                    onChange={(e) => setEditingExcursion({ ...editingExcursion, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-amber-950 uppercase mb-1">Описание слёта:</label>
                  <input
                    type="text"
                    value={editingExcursion.description || ''}
                    onChange={(e) => setEditingExcursion({ ...editingExcursion, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="bg-blue-50/80 p-3 rounded-2xl border-2 border-blue-200">
                  <label className="block text-xs font-black text-blue-950 uppercase mb-1">Взнос с парней (₽):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editingExcursion.costBoys ?? editingExcursion.costPerPerson}
                    onChange={(e) => setEditingExcursion({ 
                      ...editingExcursion, 
                      costBoys: Number(e.target.value),
                      costPerPerson: Number(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-white border-2 border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="bg-pink-50/80 p-3 rounded-2xl border-2 border-pink-200">
                  <label className="block text-xs font-black text-pink-950 uppercase mb-1">Взнос с девушек (₽):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editingExcursion.costGirls ?? Math.round(editingExcursion.costPerPerson * 0.7)}
                    onChange={(e) => setEditingExcursion({ 
                      ...editingExcursion, 
                      costGirls: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 bg-white border-2 border-pink-300 rounded-xl text-xs font-bold text-pink-950 focus:border-pink-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-amber-300">
                  <input
                    type="checkbox"
                    checked={editingExcursion.isActive}
                    onChange={(e) => setEditingExcursion({ ...editingExcursion, isActive: e.target.checked })}
                    className="w-4 h-4 text-red-600 accent-red-600 rounded"
                  />
                  <span className="text-xs font-black text-amber-950 uppercase">Слёт активен (актуальный сбор)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setEditingExcursion(null)} 
                    className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingExcursion}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase shadow-md transition-colors"
                  >
                    {isSavingExcursion ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SKIPPED YEARS */}
      {editingSkippedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber-200">
              <h4 className="font-black text-base uppercase text-amber-950 flex items-center gap-2">
                <span>🏕️ Пропущенные года слёта</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingSkippedParticipant(null)}
                className="text-amber-800 hover:text-red-600 font-black text-sm px-2 py-1 rounded-lg hover:bg-amber-200"
              >
                ✕ Закрыть
              </button>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-300 flex items-center gap-3">
              <img
                src={getSafeAvatar(editingSkippedParticipant.avatar, editingSkippedParticipant.gender)}
                alt={editingSkippedParticipant.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400"
              />
              <div>
                <div className="font-bold text-sm text-stone-900">{editingSkippedParticipant.name}</div>
                <div className="text-xs text-stone-500 font-medium">
                  @{editingSkippedParticipant.nickname} • в команде с {editingSkippedParticipant.joinedYear || 1993} г.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-stone-800">
                  Выберите года, когда участник пропустил слёт (с 1993 года):
                </span>
                <span className="text-xs font-bold text-red-600">
                  {tempSkippedYears.length > 0 ? `Пропусков: ${tempSkippedYears.length}` : 'Без пропусков'}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-stone-200 grid grid-cols-4 sm:grid-cols-6 gap-1.5 scrollbar-thin">
                {Array.from({ length: new Date().getFullYear() - 1993 + 1 }, (_, i) => 1993 + i).map(year => {
                  const isSkipped = tempSkippedYears.includes(year);
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        if (isSkipped) {
                          setTempSkippedYears(prev => prev.filter(y => y !== year));
                        } else {
                          setTempSkippedYears(prev => [...prev, year].sort((a, b) => a - b));
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        isSkipped
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {year} {isSkipped ? '✕' : '✓'}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-stone-500 italic pt-1">
                Расчёт стажа: {getTeamYearsText(editingSkippedParticipant.joinedYear || 1993, tempSkippedYears)} чистой верности команде.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-amber-200">
              <button
                type="button"
                onClick={() => setEditingSkippedParticipant(null)}
                className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isSavingSkippedYears}
                onClick={handleSaveSkippedYears}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase shadow-md transition-colors"
              >
                {isSavingSkippedYears ? 'Сохранение...' : 'Сохранить пропуски'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
