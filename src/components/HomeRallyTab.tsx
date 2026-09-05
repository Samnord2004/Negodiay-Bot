import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, MapPin, Coins, AlertCircle, 
  CheckCircle, Plus, Send, ChevronDown, ChevronUp, Sparkles, MessageSquare,
  CheckSquare, Coffee, Tent
} from 'lucide-react';
import { Participant, Excursion, TaskItem, MenuItem, GroceryItem } from '../types';
import TasksTab from './TasksTab';
import MenuGroceriesTab from './MenuGroceriesTab';

interface HomeRallyTabProps {
  participants: Participant[];
  excursions: Excursion[];
  onUpdateParticipants: (p: Participant[]) => void;
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
  currentUser: Participant | null;
  isAdmin: boolean;
  activeSubTab?: 'overview' | 'tasks' | 'menu';
  onSubTabChange?: (tab: 'overview' | 'tasks' | 'menu') => void;
}

export default function HomeRallyTab({
  participants,
  excursions,
  onUpdateParticipants,
  onNudgeDebtor,
  onNavigateToTab,
  tasks = [],
  onUpdateTasks = () => {},
  menuItems = [],
  groceryItems = [],
  onUpdateMenu = () => {},
  onUpdateGroceries = () => {},
  currentUser,
  isAdmin,
  activeSubTab = 'overview',
  onSubTabChange
}: HomeRallyTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<'overview' | 'tasks' | 'menu'>(activeSubTab);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [selectedForPay, setSelectedForPay] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab) {
      setInternalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSubTabSwitch = (tab: 'overview' | 'tasks' | 'menu') => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const activeExcursions = excursions.filter(e => e.isActive);
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
    const years = currentY - (joinedYear || 2018) - (skippedYears ? skippedYears.length : 0);
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

  return (
    <div className="space-y-6">
      
      {/* SECTION TABS FOR "ПЛАНИРУЕМЫЕ СЛЁТЫ" */}
      <div className="bg-amber-100/90 border-3 border-amber-400 p-1.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          
          <button
            type="button"
            onClick={() => handleSubTabSwitch('overview')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all border-2 ${
              internalSubTab === 'overview'
                ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-md transform scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-amber-950 border-amber-300'
            }`}
          >
            <Tent size={16} className={internalSubTab === 'overview' ? 'text-yellow-300' : 'text-red-600'} />
            <span>Обзор и взносы</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('tasks')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all border-2 ${
              internalSubTab === 'tasks'
                ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-md transform scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-amber-950 border-amber-300'
            }`}
          >
            <CheckSquare size={16} className={internalSubTab === 'tasks' ? 'text-yellow-300' : 'text-red-600'} />
            <span>Задачи слёта</span>
            {pendingTasksCount > 0 && (
              <span className="bg-amber-950 text-yellow-300 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-yellow-300">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch('menu')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all border-2 ${
              internalSubTab === 'menu'
                ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-md transform scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-amber-950 border-amber-300'
            }`}
          >
            <Coffee size={16} className={internalSubTab === 'menu' ? 'text-yellow-300' : 'text-red-600'} />
            <span>Меню и продукты</span>
            {unboughtGroceriesCount > 0 && (
              <span className="bg-amber-950 text-yellow-300 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-yellow-300">
                {unboughtGroceriesCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* SUBTAB 1: RALLY OVERVIEW & FEES */}
      {internalSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Banner Overview */}
          <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 shadow">
                  🏕️ Официальный штаб слёта
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase mt-2 leading-tight">
                  туристической команды "Негодяи"
                </h2>
                <p className="text-xs sm:text-sm font-bold text-amber-950 mt-1 max-w-2xl leading-relaxed">
                  Планируемые лесные слёты, стоянки у костра, палаточные лагеря и дух приключений. Единый реестр участников, казна сборов, горящие задачи и раскладка походного питания.
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-yellow-100/90 border-3 border-red-500 p-3.5 rounded-2xl shrink-0 shadow-inner">
                <div className="text-center px-1">
                  <span className="block text-[10px] uppercase font-black text-amber-900">Собрано</span>
                  <span className="text-base sm:text-xl font-black text-emerald-600">{totalPaidFunds.toLocaleString()} ₽</span>
                </div>
                <div className="text-center px-1 border-x-2 border-amber-300">
                  <span className="block text-[10px] uppercase font-black text-amber-900">Долг банды</span>
                  <span className="text-base sm:text-xl font-black text-red-600">{totalDebt.toLocaleString()} ₽</span>
                </div>
                <div className="text-center px-1">
                  <span className="block text-[10px] uppercase font-black text-amber-900">Должников</span>
                  <span className="text-base sm:text-xl font-black text-red-600 flex items-center justify-center gap-1">
                    {debtorsCount}
                    {debtorsCount > 0 && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Hikes / Gathering Schedule */}
          <div className="bg-white border-4 border-red-600 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-red-600 uppercase flex items-center gap-2">
                  <Calendar size={22} className="text-red-600" />
                  Активные Сборы и Походы
                </h3>
                <p className="text-xs font-bold text-amber-900 mt-0.5">
                  Текущие утвержденные выезды и расчет сумм взносов
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeExcursions.map(ex => (
                <div key={ex.id} className="bg-amber-50 border-3 border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-red-500 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-black text-base uppercase text-amber-950">{ex.title}</h4>
                      <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Активен
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-amber-800 mt-1.5">
                      <span className="flex items-center gap-1">📍 {ex.location}</span>
                      <span className="flex items-center gap-1">📅 {ex.date}</span>
                    </div>
                    {ex.description && (
                      <p className="text-xs text-amber-900 mt-2 font-medium leading-relaxed">
                        {ex.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-black">
                      <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded-lg border border-blue-300">
                        🧑 Парни: {ex.costBoys || ex.costPerPerson} ₽
                      </span>
                      <span className="bg-pink-100 text-pink-900 px-2 py-1 rounded-lg border border-pink-300">
                        👩 Девчули: {ex.costGirls || Math.round(ex.costPerPerson * 0.7)} ₽
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants Roster & Debt Register */}
          <div className="bg-white border-4 border-red-600 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-amber-200">
              <div>
                <h3 className="text-xl font-black text-red-600 uppercase flex items-center gap-2">
                  <Users size={22} className="text-red-600" />
                  Реестр Негодяев команды ({participants.length})
                </h3>
                <p className="text-xs font-bold text-amber-900 mt-0.5">
                  Учет взносов на текущий слёт, стаж в банде и дни рождения
                </p>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border-2 border-amber-300">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-yellow-400 uppercase text-amber-950 font-black border-b-2 border-red-500">
                  <tr>
                    <th className="p-3">Негодяй</th>
                    <th className="p-3">Роль</th>
                    <th className="p-3">Стаж</th>
                    <th className="p-3">🎂 Днюха</th>
                    <th className="p-3">Сдано / Всего</th>
                    <th className="p-3">Задолженность</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {participants.map(p => {
                    const isDebtor = (p.debtAmount || 0) > 0;
                    return (
                      <tr key={p.id} className="hover:bg-amber-50/70 transition-colors">
                        {/* Participant Avatar & Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full border-2 border-amber-400 bg-white object-cover" />
                            <div>
                              <p className="font-black text-sm text-amber-950 leading-tight">{p.name}</p>
                              <span className="text-[11px] font-bold text-red-600">@{p.nickname}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3">
                          {p.role === 'admin' && (
                            <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded shadow-xs">
                              Админ
                            </span>
                          )}
                          {p.role === 'treasurer' && (
                            <span className="bg-emerald-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded shadow-xs">
                              Казначей
                            </span>
                          )}
                          {(!p.role || p.role === 'member') && (
                            <span className="bg-amber-100 text-amber-900 font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                              Негодяй
                            </span>
                          )}
                          {p.role && p.role !== 'admin' && p.role !== 'treasurer' && p.role !== 'member' && (
                            <span className="bg-amber-200 text-amber-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                              {p.role}
                            </span>
                          )}
                        </td>

                        {/* Team Age */}
                        <td className="p-3 font-bold text-amber-950">
                          {getTeamYearsText(p.joinedYear || 2018, p.skippedYears)}
                        </td>

                        {/* Birthday */}
                        <td className="p-3 font-bold text-amber-900">
                          {p.birthday || '—'}
                        </td>

                        {/* Paid vs Total */}
                        <td className="p-3">
                          <div className="font-black text-amber-950">
                            <span className="text-emerald-600">{p.paidAmount.toLocaleString()} ₽</span>
                            <span className="text-amber-500 font-bold"> / {p.totalCost.toLocaleString()} ₽</span>
                          </div>
                        </td>

                        {/* Debt */}
                        <td className="p-3">
                          {isDebtor ? (
                            <span className="bg-red-100 text-red-700 font-black text-xs px-2 py-1 rounded-lg border border-red-300 inline-flex items-center gap-1">
                              <AlertCircle size={12} />
                              {p.debtAmount.toLocaleString()} ₽
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-1 rounded-lg border border-emerald-300 inline-flex items-center gap-1">
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
                                onClick={() => onNudgeDebtor(p)}
                                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-500 text-amber-950 font-black text-[10px] uppercase rounded-lg shadow-xs border border-amber-500"
                                title="Отправить напоминание о взносе"
                              >
                                Пнуть ⚡
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedForPay(selectedForPay === p.id ? null : p.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-lg shadow-xs"
                            >
                              + Оплата
                            </button>
                          </div>

                          {selectedForPay === p.id && (
                            <div className="mt-2 p-2 bg-amber-100 rounded-xl border border-amber-300 text-left flex items-center gap-2">
                              <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-amber-400 rounded text-xs font-black text-amber-950"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddPayment(p.id)}
                                className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] uppercase rounded shadow-xs"
                              >
                                Зачесть
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedForPay(null)}
                                className="text-amber-800 hover:text-red-600 text-xs font-bold"
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

    </div>
  );
}
