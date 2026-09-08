import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, ShieldCheck, UserCheck, AlertCircle, 
  CheckCircle, Bell, DollarSign, Calendar, RefreshCw, Send, Award,
  Edit2, Plus, Check, X, CreditCard, ChevronRight, User, ShoppingBag,
  TrendingUp, Wallet, Lock, Unlock, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import { FundRecord, Participant, FundExpense } from '../types';
import { getSafeAvatar } from '../utils/avatar';

interface FundTabProps {
  fundRecords: FundRecord[];
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
  isTreasurer: boolean;
  onPaymentToggled: (record: FundRecord) => void;
  onSetTreasurer: (participantId: string) => void;
  onSwitchUser?: (participant: Participant) => void;
  onUpdateFundRecords?: (records: FundRecord[]) => void;
}

const MONTHS_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function FundTab({
  fundRecords,
  participants,
  currentUser,
  isAdmin,
  isTreasurer,
  onPaymentToggled,
  onSetTreasurer,
  onSwitchUser,
  onUpdateFundRecords
}: FundTabProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1 - 12
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTreasurerId, setSelectedTreasurerId] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [monthlyRate, setMonthlyRate] = useState<number>(500);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState('500');

  // Explicit Treasurer Edit Mode (defaults to true so fields are immediately active!)
  const [editMode, setEditMode] = useState<boolean>(true);

  // Modal for editing a specific payment record
  const [editingRecord, setEditingRecord] = useState<{
    id?: string;
    participant: Participant;
    month: number;
    year: number;
    amount: number;
    isPaid: boolean;
    paidAt: string;
    note: string;
  } | null>(null);

  // Modal for adding a manual custom payment
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentParticipantId, setNewPaymentParticipantId] = useState('');
  const [newPaymentMonth, setNewPaymentMonth] = useState(currentMonth);
  const [newPaymentYear, setNewPaymentYear] = useState(currentYear);
  const [newPaymentAmount, setNewPaymentAmount] = useState('500');
  const [newPaymentIsPaid, setNewPaymentIsPaid] = useState(true);
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentNote, setNewPaymentNote] = useState('');

  // Expenses from Fund (stored locally and in state)
  const [expenses, setExpenses] = useState<FundExpense[]>(() => {
    try {
      const saved = localStorage.getItem('negodyai_fund_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'exp_1',
        title: 'Командный тент 4х6м с люверсами',
        amount: 4500,
        date: '2025-05-12',
        category: 'Лагерное снаряжение',
        spentBy: 'Казначей',
        note: 'Для обустройства общей костровой зоны'
      },
      {
        id: 'exp_2',
        title: 'Походная аптечка и перевязочные средства',
        amount: 2300,
        date: '2025-06-01',
        category: 'Безопасность',
        spentBy: 'Казначей',
        note: 'Жгуты, бинты, антисептики, спазмолитики'
      }
    ];
  });

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState('Лагерное снаряжение');
  const [expenseNote, setExpenseNote] = useState('');

  // Find the appointed treasurer
  const currentTreasurer = participants.find(p => p.role === 'treasurer') || 
                           participants.find(p => p.nickname.toLowerCase().includes('булочк')) || 
                           participants[0];

  // Check if current user has treasurer rights
  const hasTreasurerRights = 
    isAdmin || 
    isTreasurer || 
    (currentUser && currentTreasurer && currentUser.id === currentTreasurer.id) ||
    (currentUser && currentUser.role === 'treasurer') ||
    editMode; // If edit mode is toggled, allow editing

  // Helper to find or synthesize record for participant & month
  const getRecord = (pId: string, month: number): { isPaid: boolean; amount: number; id?: string; paidAt?: string; note?: string } => {
    const rec = fundRecords.find(r => r.participantId === pId && r.year === selectedYear && r.month === month);
    if (rec) return rec;
    return { isPaid: false, amount: monthlyRate };
  };

  // Calculate debt for each participant (up to current month for the current year)
  const calculateParticipantFundDebt = (pId: string) => {
    let unpaidMonths = 0;
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      const rec = getRecord(pId, m);
      if (!rec.isPaid) unpaidMonths++;
    }
    return unpaidMonths * monthlyRate;
  };

  // Calculate aggregate stats
  const totalCollected = fundRecords
    .filter(r => r.year === selectedYear && r.isPaid)
    .reduce((sum, r) => sum + (r.amount || monthlyRate), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const treasuryBalance = totalCollected - totalExpenses;

  const totalDebtAll = participants.reduce((sum, p) => sum + calculateParticipantFundDebt(p.id), 0);

  // Quick toggle month payment
  const handleToggleMonth = async (p: Participant, month: number) => {
    const currentRec = getRecord(p.id, month);
    const nextPaidState = !currentRec.isPaid;

    const payload = {
      id: currentRec.id || `fund_${p.id}_${selectedYear}_${month}`,
      participantId: p.id,
      participantName: p.name,
      participantNickname: p.nickname,
      year: selectedYear,
      month,
      amount: currentRec.amount || monthlyRate,
      isPaid: nextPaidState,
      paidAt: nextPaidState ? new Date().toISOString().split('T')[0] : undefined,
      note: currentRec.note || ""
    };

    // Optimistic UI update
    onPaymentToggled(payload);

    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.record) {
        onPaymentToggled(data.record);
        if (data.fundRecords && onUpdateFundRecords) {
          onUpdateFundRecords(data.fundRecords);
        }
      }
    } catch (err) {
      console.error("Fund toggle error:", err);
    }
  };

  // Open detailed editor for a cell
  const handleOpenCellEditor = (p: Participant, month: number) => {
    const rec = getRecord(p.id, month);
    setEditingRecord({
      id: rec.id,
      participant: p,
      month,
      year: selectedYear,
      amount: rec.amount || monthlyRate,
      isPaid: rec.isPaid,
      paidAt: rec.paidAt || (rec.isPaid ? new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      note: rec.note || ""
    });
  };

  // Save detailed record from modal
  const handleSaveDetailedRecord = async () => {
    if (!editingRecord) return;

    const payload = {
      id: editingRecord.id || `fund_${editingRecord.participant.id}_${editingRecord.year}_${editingRecord.month}`,
      participantId: editingRecord.participant.id,
      participantName: editingRecord.participant.name,
      participantNickname: editingRecord.participant.nickname,
      year: editingRecord.year,
      month: editingRecord.month,
      amount: Number(editingRecord.amount) || monthlyRate,
      isPaid: editingRecord.isPaid,
      paidAt: editingRecord.isPaid ? editingRecord.paidAt : undefined,
      note: editingRecord.note
    };

    onPaymentToggled(payload);
    setEditingRecord(null);

    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.fundRecords && onUpdateFundRecords) {
        onUpdateFundRecords(data.fundRecords);
      }
      setNotificationToast(`✓ Взнос за ${MONTHS_NAMES[payload.month - 1]} (${payload.participantName}) сохранен!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all past months as paid for a participant
  const handleMarkAllPaid = async (p: Participant) => {
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      const rec = getRecord(p.id, m);
      if (!rec.isPaid) {
        await handleToggleMonth(p, m);
      }
    }
    setNotificationToast(`Все взносы до ${MONTHS_NAMES[maxMonth - 1]} для ${p.name} отмечены как оплаченные!`);
  };

  // Create manual payment
  const handleAddManualPayment = async () => {
    const p = participants.find(part => part.id === newPaymentParticipantId) || participants[0];
    if (!p) return;

    const payload = {
      id: `fund_${p.id}_${newPaymentYear}_${newPaymentMonth}`,
      participantId: p.id,
      participantName: p.name,
      participantNickname: p.nickname,
      year: Number(newPaymentYear),
      month: Number(newPaymentMonth),
      amount: Number(newPaymentAmount) || monthlyRate,
      isPaid: newPaymentIsPaid,
      paidAt: newPaymentIsPaid ? newPaymentDate : undefined,
      note: newPaymentNote
    };

    onPaymentToggled(payload);
    setIsAddingPayment(false);

    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.fundRecords && onUpdateFundRecords) {
        onUpdateFundRecords(data.fundRecords);
      }
      setNotificationToast(`✓ Взнос успешно внесен в ведомость фонда!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Add expense
  const handleAddExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount) return;
    const newExp: FundExpense = {
      id: `exp_${Date.now()}`,
      title: expenseTitle.trim(),
      amount: Number(expenseAmount),
      date: expenseDate,
      category: expenseCategory,
      spentBy: currentUser ? currentUser.name : (currentTreasurer ? currentTreasurer.name : 'Казначей'),
      note: expenseNote.trim()
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    try {
      localStorage.setItem('negodyai_fund_expenses', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setIsAddingExpense(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNote('');
    setNotificationToast(`Расход «${newExp.title}» (${newExp.amount} ₽) успешно зафиксирован!`);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    try {
      localStorage.setItem('negodyai_fund_expenses', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNotifyDebtors = () => {
    const debtors = participants
      .map(p => ({ participant: p, debt: calculateParticipantFundDebt(p.id) }))
      .filter(d => d.debt > 0);

    if (debtors.length === 0) {
      setNotificationToast('Задолженностей по фонду нет! Все взносы внесены вовремя.');
      return;
    }

    const debtorNames = debtors.map(d => `${d.participant.name} (${d.debt} ₽)`).join(', ');
    setNotificationToast(`Уведомления отправлены ${debtors.length} должникам: ${debtorNames}. Напоминание продублировано в чат команды.`);
  };

  const handleAssignTreasurer = async () => {
    if (!selectedTreasurerId) return;
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedTreasurerId,
          role: 'treasurer'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSetTreasurer(selectedTreasurerId);
        setNotificationToast(`Казначеем фонда успешно назначен: ${participants.find(p => p.id === selectedTreasurerId)?.name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToTreasurer = () => {
    if (currentTreasurer && onSwitchUser) {
      onSwitchUser(currentTreasurer);
      setNotificationToast(`Вход выполнен под аккаунтом Казначея: ${currentTreasurer.name}. Права управления фондом активны!`);
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-8 h-8 text-red-700" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-red-700 tracking-tight">
                Фонд Негодяев & Касса Команды
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1">
              Автономный фонд команды Негодяи. Отделен от оргвзносов турслёта и расходуется на общекомандный инвентарь, лагерь и общее благо!
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Toggle Edit Mode */}
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className={`px-3.5 py-2 font-black uppercase text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 border ${
                editMode 
                  ? 'bg-emerald-600 text-white border-emerald-800' 
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
              title="Включить или отключить режим редактирования данных фонда"
            >
              {editMode ? <Unlock size={15} /> : <Lock size={15} />}
              <span>{editMode ? 'Редактирование: ВКЛ' : 'Редактирование: ВЫКЛ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingPayment(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Внести взнос</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingExpense(true)}
              className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShoppingBag size={15} />
              <span>Расход кассы</span>
            </button>

            <button
              type="button"
              onClick={handleNotifyDebtors}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Bell size={15} />
              <span>Должники</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t-2 border-red-600/30">
          <div className="bg-yellow-300/90 p-3 rounded-xl border border-yellow-500 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-amber-900 block flex items-center gap-1">
              <ArrowDownCircle size={12} className="text-emerald-700" /> Собрано ({selectedYear} г.)
            </span>
            <span className="text-lg sm:text-2xl font-black text-emerald-800 block mt-0.5">
              {totalCollected.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="bg-yellow-300/90 p-3 rounded-xl border border-yellow-500 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-amber-900 block flex items-center gap-1">
              <ArrowUpCircle size={12} className="text-amber-800" /> Расходы фонда
            </span>
            <span className="text-lg sm:text-2xl font-black text-amber-900 block mt-0.5">
              {totalExpenses.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="bg-yellow-300/90 p-3 rounded-xl border border-yellow-500 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-amber-900 block flex items-center gap-1">
              <Wallet size={12} className="text-blue-800" /> В кассе команды
            </span>
            <span className={`text-lg sm:text-2xl font-black block mt-0.5 ${treasuryBalance >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
              {treasuryBalance.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="bg-yellow-300/90 p-3 rounded-xl border border-yellow-500 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-900 block">
                Взнос в месяц
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempRate(String(monthlyRate));
                  setIsEditingRate(true);
                }}
                className="text-[9px] font-black uppercase text-red-700 hover:underline flex items-center gap-0.5"
              >
                <Edit2 size={10} /> Изменить
              </button>
            </div>
            <span className="text-lg sm:text-2xl font-black text-amber-950 block mt-0.5">
              {monthlyRate} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Rate editor modal/dialog */}
      {isEditingRate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-amber-600 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="font-black text-sm uppercase text-amber-950">
                Базовый размер взноса
              </h3>
              <button onClick={() => setIsEditingRate(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Сумма ежемесячного членского взноса с одного Негодяя (₽):
              </label>
              <input
                type="number"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-lg font-black text-amber-950 focus:outline-none focus:border-red-600"
              />
              <div className="flex gap-2">
                {[300, 500, 700, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTempRate(String(val))}
                    className="flex-1 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg border border-amber-300"
                  >
                    {val} ₽
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingRate(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const r = Number(tempRate) || 500;
                  setMonthlyRate(r);
                  setIsEditingRate(false);
                  setNotificationToast(`Базовый взнос изменен на ${r} ₽/мес`);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow-xs"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="p-4 bg-yellow-100 border-3 border-red-500 rounded-xl text-xs sm:text-sm text-red-900 font-bold flex items-start justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-start gap-2">
            <Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{notificationToast}</span>
          </div>
          <button 
            onClick={() => setNotificationToast(null)}
            className="text-red-700 hover:text-red-900 text-xs uppercase underline shrink-0 font-black"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* TREASURER STATUS & ACCESS CONTROL CARD */}
      <div className="bg-white border-3 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentTreasurer && (
              <img 
                src={getSafeAvatar(currentTreasurer.avatar, currentTreasurer.gender)} 
                alt={currentTreasurer.name} 
                className="w-13 h-13 rounded-full border-3 border-emerald-500 bg-amber-100 object-cover shrink-0" 
              />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Award className="text-emerald-600 w-3.5 h-3.5" />
                  Ответственный Казначей: {currentTreasurer ? currentTreasurer.name : 'Не назначен'}
                </span>
                {currentTreasurer && (
                  <span className="text-xs font-bold text-amber-700">
                    @{currentTreasurer.nickname}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Казначей ведет учет взносов, управляет ведомостью и кошельком команды Негодяев.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Fast switch to treasurer user button if current user isn't treasurer */}
            {currentTreasurer && currentUser?.id !== currentTreasurer.id && onSwitchUser && (
              <button
                type="button"
                onClick={handleSwitchToTreasurer}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors"
              >
                <User size={13} />
                <span>Войти как Казначей</span>
              </button>
            )}

            {/* Admin role assignment */}
            {isAdmin && (
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-300 flex items-center gap-1.5">
                <select
                  value={selectedTreasurerId || (currentTreasurer?.id || '')}
                  onChange={(e) => setSelectedTreasurerId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-950"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignTreasurer}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] rounded-lg shadow whitespace-nowrap"
                >
                  Назначить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informational banner about editing */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Быстрое редактирование:</strong> кликните на ячейку месяца для отметки оплаты, либо нажмите значок карандаша для ввода произвольной суммы или чека.
            </span>
          </div>
        </div>
      </div>

      {/* Fund Matrix (Members x Months) */}
      <div className="bg-white border-3 border-amber-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-amber-100 border-b-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-amber-800 w-5 h-5" />
            <h4 className="font-black text-sm uppercase text-amber-950">
              Таблица взносов Негодяев ({selectedYear} год)
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-800">Год ведомости:</span>
            {[currentYear - 1, currentYear, currentYear + 1].map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg font-black uppercase transition-all ${
                  selectedYear === yr 
                    ? 'bg-red-600 text-yellow-300 shadow-2xs' 
                    : 'bg-white hover:bg-amber-50 text-amber-950 border border-amber-300'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50 border-b border-amber-200 text-amber-900 uppercase font-black">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-amber-50 z-10 min-w-[190px]">Участник Негодяй</th>
                <th className="px-2 py-3 text-center text-red-600 min-w-[85px]">Долг</th>
                {MONTHS_NAMES.map((m, idx) => (
                  <th 
                    key={m} 
                    className={`px-2 py-3 text-center min-w-[62px] ${
                      idx + 1 === currentMonth && selectedYear === currentYear ? 'bg-yellow-200 text-red-800' : ''
                    }`}
                  >
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="px-3 py-3 text-center min-w-[80px]">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {participants.map(p => {
                const debt = calculateParticipantFundDebt(p.id);
                return (
                  <tr key={p.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-white z-10 flex items-center gap-2.5">
                      <img 
                        src={getSafeAvatar(p.avatar, p.gender)} 
                        alt={p.name} 
                        className="w-8 h-8 rounded-full border border-amber-300 bg-amber-100 object-cover shrink-0" 
                      />
                      <div className="truncate">
                        <p className="font-black text-amber-950 truncate leading-tight">{p.name}</p>
                        <p className="text-[10px] text-amber-600 font-bold">@{p.nickname}</p>
                      </div>
                    </td>

                    {/* Auto-calculated Debt */}
                    <td className="px-2 py-2.5 text-center font-black">
                      {debt > 0 ? (
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded-full text-[10px]">
                          {debt} ₽
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[10px]">
                          0 ₽ ✓
                        </span>
                      )}
                    </td>

                    {/* Months 1-12 */}
                    {MONTHS_NAMES.map((_, idx) => {
                      const monthNum = idx + 1;
                      const rec = getRecord(p.id, monthNum);
                      const isCurrentM = monthNum === currentMonth && selectedYear === currentYear;
                      return (
                        <td 
                          key={monthNum} 
                          className={`px-1 py-1.5 text-center ${isCurrentM ? 'bg-yellow-50' : ''}`}
                        >
                          <div className="relative group/cell inline-block">
                            <button
                              type="button"
                              onClick={() => handleToggleMonth(p, monthNum)}
                              className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                                rec.isPaid
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  : 'bg-stone-100 hover:bg-red-100 text-stone-400 hover:text-red-700 border border-dashed border-stone-300'
                              }`}
                              title={`${MONTHS_NAMES[idx]}: ${rec.isPaid ? `Оплачено ${rec.amount || monthlyRate} ₽` : 'Не оплачено'}. Кликните для переключения`}
                            >
                              {rec.isPaid ? '✓' : String(rec.amount || monthlyRate)}
                            </button>

                            {/* Small edit dot/button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellEditor(p, monthNum);
                              }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity shadow-xs"
                              title="Редактировать сумму или комментарий"
                            >
                              <Edit2 size={8} />
                            </button>
                          </div>
                        </td>
                      );
                    })}

                    {/* Action: mark all paid */}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleMarkAllPaid(p)}
                        className="py-1 px-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-black uppercase rounded-lg transition-colors whitespace-nowrap"
                        title="Отметить все прошедшие месяцы оплаченными"
                      >
                        Оплатить всё
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FUND EXPENSES & LEDGER SECTION */}
      <div className="bg-white border-3 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
          <div>
            <h4 className="font-black text-base uppercase text-amber-950 flex items-center gap-2">
              <ShoppingBag className="text-red-600 w-5 h-5" />
              <span>Журнал расходов из фонда Негодяев</span>
            </h4>
            <p className="text-xs text-stone-600">
              Все целевые траты на лагерный инвентарь, бензин, снаряжение и общие нужды команды.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingExpense(true)}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Добавить расход</span>
          </button>
        </div>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <div className="p-6 text-center text-stone-500 text-xs bg-amber-50/50 rounded-xl border border-dashed border-amber-200">
            Расходов из фонда пока не зафиксировано. Вся сумма находится в кассе команды.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expenses.map(exp => (
              <div 
                key={exp.id} 
                className="bg-amber-50/70 border-2 border-amber-200 hover:border-amber-300 rounded-xl p-3 flex items-start justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-950">{exp.title}</span>
                    <span className="font-black text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                      -{exp.amount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold flex-wrap">
                    <span>📅 {exp.date}</span>
                    <span>•</span>
                    <span className="text-amber-800 font-black">{exp.category}</span>
                    <span>•</span>
                    <span>Купил: {exp.spentBy}</span>
                  </div>
                  {exp.note && (
                    <p className="text-[10px] text-stone-600 italic bg-white/80 p-1.5 rounded border border-amber-100">
                      {exp.note}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteExpense(exp.id)}
                  className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                  title="Удалить запись расхода"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: DETAILED CELL EDITING */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-amber-600 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div>
                <h3 className="font-black text-sm uppercase text-amber-950">
                  Взнос: {MONTHS_NAMES[editingRecord.month - 1]} {editingRecord.year} г.
                </h3>
                <p className="text-xs text-amber-700 font-bold">
                  Участник: {editingRecord.participant.name} (@{editingRecord.participant.nickname})
                </p>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Payment Status Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border-2 border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRecord.isPaid}
                  onChange={(e) => setEditingRecord({ ...editingRecord, isPaid: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
                <div>
                  <span className="font-black text-xs text-amber-950 block">
                    {editingRecord.isPaid ? '✓ Взнос оплачен' : 'Взнос НЕ оплачен'}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {editingRecord.isPaid ? 'Участник внес деньги в фонд' : 'Участник числится в должниках'}
                  </span>
                </div>
              </label>

              {/* Amount input */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Сумма взноса (₽):
                </label>
                <input
                  type="number"
                  value={editingRecord.amount}
                  onChange={(e) => setEditingRecord({ ...editingRecord, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-base font-black text-amber-950 focus:outline-none focus:border-red-600"
                />
                <div className="flex gap-2 mt-1.5">
                  {[500, 1000, 1500, 2000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditingRecord({ ...editingRecord, amount: val })}
                      className="flex-1 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg border border-amber-300"
                    >
                      {val} ₽
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid date input */}
              {editingRecord.isPaid && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Дата внесения взноса:
                  </label>
                  <input
                    type="date"
                    value={editingRecord.paidAt}
                    onChange={(e) => setEditingRecord({ ...editingRecord, paidAt: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-semibold text-amber-950 focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              {/* Note / check description */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Примечание к платежу (чек / способ оплаты):
                </label>
                <input
                  type="text"
                  placeholder="Например: Перевод на Сбер Булочке, Наличными на слёте"
                  value={editingRecord.note}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-medium text-amber-950 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveDetailedRecord}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow-xs"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL PAYMENT */}
      {isAddingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-amber-600 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="font-black text-sm uppercase text-amber-950 flex items-center gap-1.5">
                <CreditCard size={16} className="text-red-600" />
                <span>Внести взнос в фонд</span>
              </h3>
              <button onClick={() => setIsAddingPayment(false)} className="text-stone-400 hover:text-stone-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Участник Негодяй:
                </label>
                <select
                  value={newPaymentParticipantId || (participants[0]?.id || '')}
                  onChange={(e) => setNewPaymentParticipantId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 bg-white"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Месяц:
                  </label>
                  <select
                    value={newPaymentMonth}
                    onChange={(e) => setNewPaymentMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 bg-white"
                  >
                    {MONTHS_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Год:
                  </label>
                  <select
                    value={newPaymentYear}
                    onChange={(e) => setNewPaymentYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 bg-white"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Сумма взноса (₽):
                </label>
                <input
                  type="number"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-base font-black text-amber-950"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Дата платежа:
                </label>
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs text-amber-950 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Примечание / комментарий:
                </label>
                <input
                  type="text"
                  placeholder="Перевод на карту Казначея"
                  value={newPaymentNote}
                  onChange={(e) => setNewPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs text-amber-950"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setIsAddingPayment(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddManualPayment}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-xs"
              >
                Зафиксировать взнос
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {isAddingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-amber-600 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="font-black text-sm uppercase text-amber-950 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-red-600" />
                <span>Зафиксировать расход из фонда</span>
              </h3>
              <button onClick={() => setIsAddingExpense(false)} className="text-stone-400 hover:text-stone-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Наименование покупки / услуги:
                </label>
                <input
                  type="text"
                  placeholder="Например: Походный казан 15л, Бензин генератора, Тент"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Сумма (₽):
                  </label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-base font-black text-amber-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Дата:
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs text-amber-950 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Категория расхода:
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 bg-white"
                >
                  <option value="Лагерное снаряжение">Лагерное снаряжение</option>
                  <option value="Безопасность и аптечка">Безопасность и аптечка</option>
                  <option value="Генератор и топливо">Генератор и топливо</option>
                  <option value="Реквизит и конкурсы">Реквизит и конкурсы</option>
                  <option value="Общая кухня и костер">Общая кухня и костер</option>
                  <option value="Прочее">Прочее</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Примечание / отчет:
                </label>
                <textarea
                  rows={2}
                  placeholder="Где куплено, номер чека, кто забирал..."
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-xs text-amber-950"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-yellow-300 font-black text-xs uppercase rounded-xl shadow-xs"
              >
                Записать расход
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
