import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, MapPin, Coins, AlertCircle, 
  CheckCircle, Plus, Send, ChevronDown, ChevronUp, Sparkles, MessageSquare,
  CheckSquare, Coffee, Tent, Trophy, Palette, Edit, Trash2,
  Check, HelpCircle, X, CreditCard, ShieldCheck, UserCheck
} from 'lucide-react';
import { getSafeAvatar, getParticipantAvatar } from '../utils/avatar';
import { formatBirthdayShort } from '../utils/dateUtils';
import TasksTab from './TasksTab';
import MenuGroceriesTab from './MenuGroceriesTab';
import ContestsTab from './ContestsTab';
import CreativityTab from './CreativityTab';
import DeleteParticipantModal from './DeleteParticipantModal';
import RallyGameHub from './game/RallyGameHub';
import { 
  Participant, Excursion, TaskItem, MenuItem, GroceryItem, Contest, 
  CreativityIdea, RallyCoin, RallyParticipationStatus, RallyParticipantEntry 
} from '../types';

export type HomeRallySubTab = 'overview' | 'game' | 'tasks' | 'menu' | 'contests' | 'creativity';

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
  onDeleteUser?: (userId: string) => Promise<void> | void;
  activeSubTab?: HomeRallySubTab;
  onSubTabChange?: (tab: HomeRallySubTab) => void;
  rallyCoins?: RallyCoin[];
  onAwardCoin?: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune' | 'poker';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
  onDeleteCoin?: (coinId: string) => Promise<void> | void;
  onUpdateCoins?: (coins: RallyCoin[]) => void;
  onOpenProfileEdit?: () => void;
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
  onDeleteUser,
  activeSubTab = 'overview',
  onSubTabChange,
  rallyCoins = [],
  onAwardCoin = async () => {},
  onDeleteCoin = async () => {},
  onUpdateCoins = () => {},
  onOpenProfileEdit
}: HomeRallyTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<HomeRallySubTab>(activeSubTab);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [selectedForPay, setSelectedForPay] = useState<string | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  
  // Excursion editing state
  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [isSavingExcursion, setIsSavingExcursion] = useState(false);

  // Skipped years editing state
  const [editingSkippedParticipant, setEditingSkippedParticipant] = useState<Participant | null>(null);
  const [tempSkippedYears, setTempSkippedYears] = useState<number[]>([]);
  const [isSavingSkippedYears, setIsSavingSkippedYears] = useState(false);

  // Debtor nudging feedback
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  // Participation status state for rallies
  const [statusToast, setStatusToast] = useState<{ excursionId: string; message: string } | null>(null);
  const [expandedRallyRosterId, setExpandedRallyRosterId] = useState<string | null>(null);
  const [rallyRosterFilter, setRallyRosterFilter] = useState<'all' | 'going' | 'thinking' | 'not_going' | 'unanswered'>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [selectedProxyUserId, setSelectedProxyUserId] = useState<string>('');

  const handleUpdateParticipationStatus = async (
    excursionId: string,
    participantId: string,
    newStatus: RallyParticipationStatus,
    newIsPaid?: boolean
  ) => {
    const ex = excursions.find(e => e.id === excursionId);
    if (!ex) return;

    const opId = currentUser?.id || participantId;
    setIsUpdatingStatus(`${excursionId}_${participantId}`);

    // Optimistic local update
    const currentStatuses = ex.participantStatuses ? { ...ex.participantStatuses } : {};
    const prevEntry = currentStatuses[participantId] || { status: 'thinking' as const, isPaid: false };
    const updatedEntry: RallyParticipantEntry = {
      ...prevEntry,
      status: newStatus,
      isPaid: newIsPaid !== undefined ? newIsPaid : prevEntry.isPaid,
      paidAt: newIsPaid === true ? (prevEntry.paidAt || new Date().toISOString()) : (newIsPaid === false ? undefined : prevEntry.paidAt),
      updatedAt: new Date().toISOString()
    };
    const updatedStatuses = { ...currentStatuses, [participantId]: updatedEntry };
    const updatedExcursion = { ...ex, participantStatuses: updatedStatuses };

    if (onUpdateExcursions) {
      onUpdateExcursions(excursions.map(item => item.id === excursionId ? updatedExcursion : item));
    }

    const statusLabels: Record<RallyParticipationStatus, string> = {
      going: '«Еду точно» 🏕️',
      thinking: '«Думаю / вопрос» 🤔',
      not_going: '«Не еду» ❌'
    };

    try {
      const res = await fetch(`/api/excursions/${excursionId}/participant-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          status: newStatus,
          isPaid: newIsPaid,
          operatorId: opId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions && onUpdateExcursions) {
          onUpdateExcursions(data.excursions);
        }
      }
      const participantName = participants.find(p => p.id === participantId)?.name || 'Участник';
      const toastText = (currentUser && currentUser.id === participantId)
        ? `Ваш статус сохранён: ${statusLabels[newStatus]}`
        : `Статус для ${participantName}: ${statusLabels[newStatus]}`;
      setStatusToast({ excursionId, message: toastText });
      setTimeout(() => setStatusToast(null), 3500);
    } catch (err) {
      console.error("Failed to update rally status:", err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleToggleExcursionPaid = async (excursionId: string, participantId: string, currentPaid: boolean) => {
    if (!canManagePayments) return;
    const ex = excursions.find(e => e.id === excursionId);
    if (!ex) return;
    const currentStatus = ex.participantStatuses?.[participantId]?.status || 'thinking';
    await handleUpdateParticipationStatus(excursionId, participantId, currentStatus, !currentPaid);
  };

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

  const activeParticipants = participants.filter(p => p.accountStatus !== 'rejected');
  const totalTargetFunds = activeParticipants.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalPaidFunds = activeParticipants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalDebt = Math.max(0, totalTargetFunds - totalPaidFunds);
  const debtorsCount = activeParticipants.filter(p => (p.debtAmount || 0) > 0).length;

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
    const effectiveJoined = Math.max(1993, Math.min(joinedYear || 1993, currentY));
    const validSkipped = (skippedYears || []).filter(y => y >= effectiveJoined && y <= currentY);
    const years = currentY - effectiveJoined - validSkipped.length;
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
      const pJoined = editingSkippedParticipant.joinedYear || 1993;
      const cleanYears = tempSkippedYears.filter(y => !isNaN(y) && y >= pJoined).sort((a, b) => a - b);
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
            onClick={() => handleSubTabSwitch('game')}
            className={`flex-1 min-w-[160px] py-2 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              internalSubTab === 'game'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-xs border border-yellow-300'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/50'
            }`}
          >
            <span>🪙</span>
            <span>Скидка на слёт</span>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              internalSubTab === 'game' ? 'bg-stone-950 text-amber-300' : 'bg-amber-100 text-amber-800'
            }`}>
              {rallyCoins.length}
            </span>
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
                  🏕️ Контроль бюджета планируемых мероприятий
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase flex items-center gap-2">
                  <Calendar size={20} className="text-red-600" />
                  Активные Сборы и Походы
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Текущие утвержденные выезды, статусы присутствия команды и расчет сумм взносов
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-stone-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                  🏕️ Отметьтесь: едете ли вы на слёт
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {activeExcursions.map(ex => {
                const statuses = ex.participantStatuses || {};
                
                // Determine target participant for status controls
                const targetParticipantId = currentUser?.id || selectedProxyUserId || activeParticipants[0]?.id;
                const targetParticipant = activeParticipants.find(p => p.id === targetParticipantId) || currentUser || activeParticipants[0];
                const currentEntry = targetParticipantId ? statuses[targetParticipantId] : undefined;
                const currentStatus: RallyParticipationStatus | undefined = currentEntry?.status;
                const isTargetPaid = Boolean(currentEntry?.isPaid);

                // Stats calculation
                const goingList = activeParticipants.filter(p => statuses[p.id]?.status === 'going');
                const thinkingList = activeParticipants.filter(p => statuses[p.id]?.status === 'thinking');
                const notGoingList = activeParticipants.filter(p => statuses[p.id]?.status === 'not_going');
                const unansweredList = activeParticipants.filter(p => !statuses[p.id]?.status);
                const paidList = activeParticipants.filter(p => statuses[p.id]?.isPaid);

                const isRosterExpanded = expandedRallyRosterId === ex.id;

                // Filtered roster for this rally
                const filteredRoster = activeParticipants.filter(p => {
                  const s = statuses[p.id]?.status;
                  if (rallyRosterFilter === 'going') return s === 'going';
                  if (rallyRosterFilter === 'thinking') return s === 'thinking';
                  if (rallyRosterFilter === 'not_going') return s === 'not_going';
                  if (rallyRosterFilter === 'unanswered') return !s;
                  return true;
                });

                return (
                  <div key={ex.id} className="bg-stone-50/70 border-2 border-stone-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-amber-400/80 transition-all">
                    <div>
                      {/* Top title & badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⛺</span>
                          <h4 className="font-black text-lg sm:text-xl uppercase text-stone-900 tracking-tight">{ex.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                            Актуальный слёт
                          </span>
                          {isCaptain && (
                            <button
                              type="button"
                              onClick={() => setEditingExcursion({ ...ex })}
                              className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs uppercase rounded-xl flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Редактировать слёт и взносы (доступно капитану)"
                            >
                              <Edit size={13} />
                              <span>Редактировать</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Location, Date & Fees */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs font-semibold text-stone-700">
                        <div className="bg-white px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-2">
                          <span className="text-base">📍</span>
                          <span className="truncate"><strong>Локация:</strong> {ex.location}</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-2">
                          <span className="text-base">📅</span>
                          <span><strong>Даты:</strong> {ex.date}</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-2 sm:col-span-2 md:col-span-1">
                          <span className="text-base">💵</span>
                          <span>Парни: <strong>{ex.costBoys || ex.costPerPerson} ₽</strong> | Девчули: <strong>{ex.costGirls || Math.round(ex.costPerPerson * 0.7)} ₽</strong></span>
                        </div>
                      </div>

                      {ex.description && (
                        <p className="text-xs sm:text-sm text-stone-600 mt-2.5 font-normal leading-relaxed bg-white/70 p-3 rounded-xl border border-stone-200/60">
                          {ex.description}
                        </p>
                      )}

                      {/* Toast notification */}
                      {statusToast && statusToast.excursionId === ex.id && (
                        <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                          <CheckCircle size={16} className="text-emerald-700 shrink-0" />
                          <span>{statusToast.message}</span>
                        </div>
                      )}

                      {/* ========================================================================= */}
                      {/* PARTICIPATION STATUS BUTTONS (PRIMARY REQUIREMENT) */}
                      {/* ========================================================================= */}
                      <div className="mt-4 p-4 sm:p-5 bg-white border-2 border-amber-300/80 rounded-2xl shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2.5">
                            {targetParticipant && (
                              <img
                                src={getParticipantAvatar(targetParticipant)}
                                alt={targetParticipant.name}
                                className="w-8 h-8 rounded-full border border-stone-200 object-cover"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-stone-900">
                                  {currentUser ? 'Ваш статус на этот сбор:' : 'Проставить статус за:'}
                                </span>
                                {targetParticipant && (
                                  <span className="text-xs font-bold text-red-600">
                                    {targetParticipant.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500">
                                Нажмите кнопку ниже, чтобы зафиксировать своё участие в слёте
                              </p>
                            </div>
                          </div>

                          {/* Proxy Selector if not logged in or Captain wants to choose someone */}
                          {(!currentUser || isCaptain) && activeParticipants.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-stone-400 font-bold text-[10px] uppercase">Выбрать соратника:</span>
                              <select
                                value={targetParticipantId}
                                onChange={(e) => setSelectedProxyUserId(e.target.value)}
                                className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800"
                              >
                                {activeParticipants.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.id === currentUser?.id ? '(Вы)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Current Status Pill & Payment Note */}
                        <div className="flex flex-wrap items-center justify-between gap-2 my-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-600">Текущий выбор:</span>
                            {currentStatus === 'going' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs uppercase px-2.5 py-0.5 rounded-lg shadow-2xs">
                                <CheckCircle size={13} className="text-emerald-700" />
                                Еду точно! 🏕️
                              </span>
                            )}
                            {currentStatus === 'thinking' && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 border border-amber-300 font-black text-xs uppercase px-2.5 py-0.5 rounded-lg shadow-2xs">
                                <HelpCircle size={13} className="text-amber-700" />
                                Думаю / под вопросом 🤔
                              </span>
                            )}
                            {currentStatus === 'not_going' && (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-950 border border-rose-300 font-black text-xs uppercase px-2.5 py-0.5 rounded-lg shadow-2xs">
                                <X size={13} className="text-rose-700" />
                                Не смогу поехать ❌
                              </span>
                            )}
                            {!currentStatus && (
                              <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 font-bold text-xs uppercase px-2.5 py-0.5 rounded-lg">
                                ⚪ Статус ещё не выбран
                              </span>
                            )}
                          </div>

                          {isTargetPaid && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              <ShieldCheck size={13} className="text-emerald-600" />
                              Оргвзнос оплачен
                            </span>
                          )}
                        </div>

                        {/* THE 3 STATUS BUTTONS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => targetParticipantId && handleUpdateParticipationStatus(ex.id, targetParticipantId, 'going')}
                            disabled={!targetParticipantId || isUpdatingStatus === `${ex.id}_${targetParticipantId}`}
                            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                              currentStatus === 'going'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500 ring-offset-2 scale-[1.02]'
                                : 'bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-900 border-2 border-emerald-300 hover:border-emerald-400'
                            }`}
                            title="Отметиться: Еду точно на слёт"
                          >
                            <span className="text-base">🟢</span>
                            <span>Еду точно</span>
                            {currentStatus === 'going' && <Check size={16} className="ml-1" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => targetParticipantId && handleUpdateParticipationStatus(ex.id, targetParticipantId, 'thinking')}
                            disabled={!targetParticipantId || isUpdatingStatus === `${ex.id}_${targetParticipantId}`}
                            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                              currentStatus === 'thinking'
                                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 ring-2 ring-amber-400 ring-offset-2 scale-[1.02]'
                                : 'bg-amber-50/50 hover:bg-amber-100/80 text-amber-950 border-2 border-amber-300 hover:border-amber-400'
                            }`}
                            title="Отметиться: Пока думаю / под вопросом"
                          >
                            <span className="text-base">🟡</span>
                            <span>Думаю</span>
                            {currentStatus === 'thinking' && <Check size={16} className="ml-1" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => targetParticipantId && handleUpdateParticipationStatus(ex.id, targetParticipantId, 'not_going')}
                            disabled={!targetParticipantId || isUpdatingStatus === `${ex.id}_${targetParticipantId}`}
                            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                              currentStatus === 'not_going'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500 ring-offset-2 scale-[1.02]'
                                : 'bg-rose-50/50 hover:bg-rose-100/80 text-rose-950 border-2 border-rose-300 hover:border-rose-400'
                            }`}
                            title="Отметиться: Не смогу поехать"
                          >
                            <span className="text-base">🔴</span>
                            <span>Не еду</span>
                            {currentStatus === 'not_going' && <Check size={16} className="ml-1" />}
                          </button>
                        </div>
                      </div>

                      {/* ========================================================================= */}
                      {/* STATS CHIPS & ROSTER TOGGLE */}
                      {/* ========================================================================= */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 bg-stone-100/70 p-3 rounded-2xl border border-stone-200">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className="text-stone-500 uppercase text-[10px] mr-1">Статистика сбора:</span>
                          <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <span>🟢 Едут:</span>
                            <span className="font-black">{goingList.length}</span>
                          </span>
                          <span className="bg-amber-100 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <span>🟡 Думают:</span>
                            <span className="font-black">{thinkingList.length}</span>
                          </span>
                          <span className="bg-rose-100 text-rose-950 px-2.5 py-1 rounded-lg border border-rose-300 flex items-center gap-1 shadow-2xs">
                            <span>🔴 Не едут:</span>
                            <span className="font-black">{notGoingList.length}</span>
                          </span>
                          <span className="bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-300 flex items-center gap-1 shadow-2xs">
                            <span>⚪ Не ответили:</span>
                            <span className="font-black">{unansweredList.length}</span>
                          </span>
                          <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-300 flex items-center gap-1 shadow-2xs">
                            <span>💳 Оплачено:</span>
                            <span className="font-black">{paidList.length}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedRallyRosterId(isRosterExpanded ? null : ex.id)}
                          className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs uppercase rounded-xl border border-stone-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Users size={14} className="text-red-600" />
                          <span>{isRosterExpanded ? 'Скрыть состав' : 'Состав участников слёта'}</span>
                          {isRosterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* EXPANDABLE PARTICIPANTS ROSTER WITH STATUSES */}
                      {isRosterExpanded && (
                        <div className="mt-3 p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <span className="font-black text-xs uppercase text-stone-800 flex items-center gap-1.5">
                              <span>📋 Список соратников и статусы участия ({activeParticipants.length})</span>
                            </span>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => setRallyRosterFilter('all')}
                                className={`px-2 py-0.5 rounded-md cursor-pointer ${rallyRosterFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                Все ({activeParticipants.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setRallyRosterFilter('going')}
                                className={`px-2 py-0.5 rounded-md cursor-pointer ${rallyRosterFilter === 'going' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                              >
                                Едут ({goingList.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setRallyRosterFilter('thinking')}
                                className={`px-2 py-0.5 rounded-md cursor-pointer ${rallyRosterFilter === 'thinking' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
                              >
                                Думают ({thinkingList.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setRallyRosterFilter('not_going')}
                                className={`px-2 py-0.5 rounded-md cursor-pointer ${rallyRosterFilter === 'not_going' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-900 hover:bg-rose-100'}`}
                              >
                                Не едут ({notGoingList.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setRallyRosterFilter('unanswered')}
                                className={`px-2 py-0.5 rounded-md cursor-pointer ${rallyRosterFilter === 'unanswered' ? 'bg-stone-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                Без ответа ({unansweredList.length})
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                            {filteredRoster.map(p => {
                              const pEntry = statuses[p.id];
                              const pStatus = pEntry?.status;
                              const isPaid = Boolean(pEntry?.isPaid);

                              return (
                                <div key={p.id} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white transition-colors flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={getParticipantAvatar(p)}
                                      alt={p.name}
                                      className="w-8 h-8 rounded-full border border-stone-200 object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-stone-900 truncate">{p.name}</p>
                                      <span className="text-[10px] font-semibold text-stone-500">@{p.nickname}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Status Badge */}
                                    {pStatus === 'going' && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                                        🟢 Едет
                                      </span>
                                    )}
                                    {pStatus === 'thinking' && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-200">
                                        🟡 Думает
                                      </span>
                                    )}
                                    {pStatus === 'not_going' && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-950 border border-rose-200">
                                        🔴 Не едет
                                      </span>
                                    )}
                                    {!pStatus && (
                                      <span className="text-[10px] font-semibold text-stone-400 px-1.5 py-0.5 rounded bg-stone-100">
                                        ⚪ Без ответа
                                      </span>
                                    )}

                                    {/* Captain Quick Status Buttons */}
                                    {isCaptain && (
                                      <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateParticipationStatus(ex.id, p.id, 'going')}
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${pStatus === 'going' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-800'}`}
                                          title="Капитан: переключить на «Едет»"
                                        >
                                          🟢
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateParticipationStatus(ex.id, p.id, 'thinking')}
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${pStatus === 'thinking' ? 'bg-amber-500 text-stone-950' : 'hover:bg-amber-50 text-amber-800'}`}
                                          title="Капитан: переключить на «Думает»"
                                        >
                                          🟡
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateParticipationStatus(ex.id, p.id, 'not_going')}
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${pStatus === 'not_going' ? 'bg-rose-600 text-white' : 'hover:bg-rose-50 text-rose-800'}`}
                                          title="Капитан: переключить на «Не едет»"
                                        >
                                          🔴
                                        </button>
                                      </div>
                                    )}

                                    {/* Payment Toggle / Status */}
                                    {canManagePayments ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleExcursionPaid(ex.id, p.id, isPaid)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                                          isPaid
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                                        }`}
                                        title="Казначей/Капитан: кликните для отметки оплаты взноса"
                                      >
                                        <CreditCard size={11} />
                                        <span>{isPaid ? 'Оплачено' : 'Не сдал'}</span>
                                      </button>
                                    ) : (
                                      isPaid && (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" title="Взнос оплачен">
                                          ✓ Оплачено
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOTIVATION GAME PROMO BANNER */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-stone-950 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-yellow-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-yellow-400">
                🪙
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-stone-950 text-yellow-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-md">
                    Мотивационная игра команды
                  </span>
                  <span className="text-xs font-black uppercase text-stone-900">
                    «Скидка на слёт 2026»
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-950 mt-1">
                  Победитель по монеткам едет на слёт БЕСПЛАТНО!
                </h3>
                <p className="text-xs font-semibold text-stone-900/85 mt-0.5">
                  Капитан чеканит именные монеты с силуэтом профиля за обустройство лагеря. Крутите Колесо Фортуны!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubTabSwitch('game')}
              className="px-5 py-2.5 bg-stone-950 hover:bg-stone-900 text-yellow-300 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Вступить в игру</span>
              <span>→</span>
            </button>
          </div>

          {/* Participants Roster & Debt Register */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase flex items-center gap-2">
                  <Users size={20} className="text-red-600" />
                  Реестр команды негодяи ({activeParticipants.length})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Учет взносов на текущий слёт, именные монетки, стаж в команде и дни рождения
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
                    <th className="p-3 text-center">🪙 Монетки</th>
                    <th className="p-3">Стаж</th>
                    <th className="p-3">🎂 Днюха (ДД.ММ.ГГ)</th>
                    <th className="p-3">Статус на слёт</th>
                    <th className="p-3">Сдано / Всего</th>
                    <th className="p-3">Задолженность</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activeParticipants.map(p => {
                    const isDebtor = (p.debtAmount || 0) > 0;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Participant Avatar & Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img src={getParticipantAvatar(p)} alt={p.name} className="w-9 h-9 rounded-full border border-stone-200 bg-white object-cover shadow-2xs" />
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

                        {/* Rally Coins */}
                        <td className="p-3 text-center">
                          {(() => {
                            const userCoins = rallyCoins.filter(c => c.participantId === p.id);
                            return (
                              <button
                                type="button"
                                onClick={() => handleSubTabSwitch('game')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-stone-900 font-bold text-xs transition-colors shadow-2xs group cursor-pointer"
                                title={`Личный кабинет: ${p.name} (🪙 ${userCoins.length})`}
                              >
                                <span className="text-sm">🪙</span>
                                <span className="font-black text-amber-950">{userCoins.length}</span>
                              </button>
                            );
                          })()}
                        </td>

                        {/* Team Age & Skipped Years */}
                        <td className="p-3">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>{getTeamYearsText(p.joinedYear || 1993, p.skippedYears)}</span>
                            <span className="text-[11px] text-stone-500 font-normal">(с {p.joinedYear || 1993} г.)</span>
                          </div>

                          {/* Skipped Years display */}
                          {(() => {
                            const pJoined = p.joinedYear || 1993;
                            const validSkipped = (p.skippedYears || []).filter(y => y >= pJoined);
                            return validSkipped.length > 0 ? (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                  <span>Пропущено слётов:</span>
                                  <strong className="text-red-700 font-bold">{validSkipped.slice().sort((a,b)=>a-b).join(', ')}</strong>
                                  <span className="text-[10px] text-red-600">({validSkipped.length} г.)</span>
                                </span>
                                {(isAdmin || currentUser?.id === p.id) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSkippedParticipant(p);
                                      setTempSkippedYears(validSkipped);
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
                            );
                          })()}
                        </td>

                        {/* Birthday */}
                        <td className="p-3 font-semibold text-stone-700">
                          {p.birthday ? formatBirthdayShort(p.birthday) : '—'}
                        </td>

                        {/* Rally Participation Status */}
                        <td className="p-3">
                          {(() => {
                            const primaryEx = activeExcursions[0];
                            if (!primaryEx) {
                              return <span className="text-stone-400 text-[11px]">—</span>;
                            }
                            const pEntry = primaryEx.participantStatuses?.[p.id];
                            const s = pEntry?.status;
                            const isPaid = Boolean(pEntry?.isPaid);

                            return (
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-1">
                                  {s === 'going' && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                                      🟢 Едет
                                    </span>
                                  )}
                                  {s === 'thinking' && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 border border-amber-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                                      🟡 Думает
                                    </span>
                                  )}
                                  {s === 'not_going' && (
                                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-950 border border-rose-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                                      🔴 Не едет
                                    </span>
                                  )}
                                  {!s && (
                                    <span className="text-stone-400 font-semibold text-[10px] px-1.5 py-0.5 rounded bg-stone-100">
                                      ⚪ Не выбран
                                    </span>
                                  )}

                                  {isPaid && (
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded" title="Взнос на слёт сдан">
                                      💳
                                    </span>
                                  )}
                                </div>

                                {isCaptain && (
                                  <div className="flex items-center gap-0.5 bg-stone-100 rounded p-0.5 border border-stone-200 mt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateParticipationStatus(primaryEx.id, p.id, 'going')}
                                      className={`w-5 h-5 rounded text-[10px] flex items-center justify-center cursor-pointer transition-colors ${s === 'going' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-100'}`}
                                      title="Капитан: Едет"
                                    >
                                      🟢
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateParticipationStatus(primaryEx.id, p.id, 'thinking')}
                                      className={`w-5 h-5 rounded text-[10px] flex items-center justify-center cursor-pointer transition-colors ${s === 'thinking' ? 'bg-amber-500 text-stone-950' : 'hover:bg-amber-100'}`}
                                      title="Капитан: Думает"
                                    >
                                      🟡
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateParticipationStatus(primaryEx.id, p.id, 'not_going')}
                                      className={`w-5 h-5 rounded text-[10px] flex items-center justify-center cursor-pointer transition-colors ${s === 'not_going' ? 'bg-rose-600 text-white' : 'hover:bg-rose-100'}`}
                                      title="Капитан: Не едет"
                                    >
                                      🔴
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
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
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
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
                                title="Отправить напоминание о взносе в общий чат команды"
                              >
                                <span>⚡</span>
                                <span>{nudgingId === p.id ? 'Напомнили! ⚡' : 'Напомнить ⚡'}</span>
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
                            {isCaptain && p.id !== currentUser?.id && p.id !== '3' && p.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => setParticipantToDelete(p)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-[10px] uppercase rounded-lg border border-red-200 hover:border-red-600 flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                                title="Удалить члена команды и его аккаунт (только для Капитана)"
                              >
                                <Trash2 size={11} />
                                <span className="hidden sm:inline">Удалить</span>
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

      {/* SUBTAB: MOTIVATION GAME "СКИДКА НА СЛЁТ" */}
      {internalSubTab === 'game' && (
        <div className="animate-in fade-in duration-200">
          <RallyGameHub
            participants={participants}
            coins={rallyCoins}
            currentUser={currentUser}
            isCaptain={isCaptain}
            onAwardCoin={onAwardCoin}
            onDeleteCoin={onDeleteCoin}
            onUpdateCoins={onUpdateCoins}
            onOpenProfileEdit={onOpenProfileEdit}
          />
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

            {(() => {
              const currentY = new Date().getFullYear();
              const memberJoinedYear = Math.max(1993, Math.min(editingSkippedParticipant.joinedYear || 1993, currentY));
              const availableYears = Array.from(
                { length: currentY - memberJoinedYear + 1 },
                (_, i) => memberJoinedYear + i
              );
              const validSkipped = tempSkippedYears.filter(y => y >= memberJoinedYear && y <= currentY);

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-800">
                      Пропущенные слёты участника (с момента прихода в {memberJoinedYear} г.):
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      {validSkipped.length > 0 ? `Пропусков: ${validSkipped.length}` : 'Без пропусков'}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 leading-snug">
                    Отображаются только года с момента первого прихода в команду ({memberJoinedYear} г.). Года ранее {memberJoinedYear} г. не показываются.
                  </p>

                  <div className="max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-stone-200 grid grid-cols-4 sm:grid-cols-6 gap-1.5 scrollbar-thin">
                    {availableYears.map(year => {
                      const isSkipped = validSkipped.includes(year);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            if (isSkipped) {
                              setTempSkippedYears(prev => prev.filter(y => y !== year && y >= memberJoinedYear));
                            } else {
                              setTempSkippedYears(prev => [...prev.filter(y => y >= memberJoinedYear), year].sort((a, b) => a - b));
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
                    Расчёт стажа: {getTeamYearsText(memberJoinedYear, validSkipped)} чистой верности команде.
                  </p>
                </div>
              );
            })()}

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

      {/* Delete Member Confirmation Modal */}
      <DeleteParticipantModal
        participant={participantToDelete}
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={async (userId) => {
          if (onDeleteUser) {
            await onDeleteUser(userId);
          } else {
            try {
              const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.participants) {
                  onUpdateParticipants(data.participants);
                } else {
                  onUpdateParticipants(participants.filter(p => p.id !== userId));
                }
              }
            } catch (err) {
              console.error("Delete user error:", err);
            }
          }
        }}
      />

    </div>
  );
}
