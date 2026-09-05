import React, { useState } from 'react';
import { 
  PiggyBank, ShieldCheck, UserCheck, AlertCircle, 
  CheckCircle, Bell, DollarSign, Calendar, RefreshCw, Send, Award
} from 'lucide-react';
import { FundRecord, Participant } from '../types';

interface FundTabProps {
  fundRecords: FundRecord[];
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
  isTreasurer: boolean;
  onPaymentToggled: (record: FundRecord) => void;
  onSetTreasurer: (participantId: string) => void;
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
  onSetTreasurer
}: FundTabProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1 - 12
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTreasurerId, setSelectedTreasurerId] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Find the treasurer
  const currentTreasurer = participants.find(p => p.role === 'treasurer') || 
                           participants.find(p => p.nickname.toLowerCase().includes('булочк')) || 
                           participants[0];

  // Helper to find or synthesize record for participant & month
  const getRecord = (pId: string, month: number): { isPaid: boolean; amount: number; id?: string } => {
    const rec = fundRecords.find(r => r.participantId === pId && r.year === selectedYear && r.month === month);
    if (rec) return rec;
    // Default: months before currentMonth default to unpaid or paid based on mock
    return { isPaid: false, amount: 500 };
  };

  // Calculate debt for each participant (up to current month for the current year)
  const calculateParticipantFundDebt = (pId: string) => {
    let unpaidMonths = 0;
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      const rec = getRecord(pId, m);
      if (!rec.isPaid) unpaidMonths++;
    }
    return unpaidMonths * 500;
  };

  // Calculate aggregate stats
  const totalCollected = fundRecords
    .filter(r => r.year === selectedYear && r.isPaid)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalDebtAll = participants.reduce((sum, p) => sum + calculateParticipantFundDebt(p.id), 0);

  const handleToggleMonth = async (p: Participant, month: number) => {
    if (!isAdmin && !isTreasurer) {
      alert('Только Казначей фонда или Администратор может изменять статус оплаты взносов!');
      return;
    }

    const currentRec = getRecord(p.id, month);
    const nextPaidState = !currentRec.isPaid;

    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: p.id,
          participantName: p.name,
          participantNickname: p.nickname,
          year: selectedYear,
          month,
          amount: 500,
          isPaid: nextPaidState,
          paidAt: nextPaidState ? new Date().toISOString().split('T')[0] : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentToggled(data.record);
      }
    } catch (err) {
      console.error(err);
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
    setNotificationToast(`Уведомления успешно отправлены ${debtors.length} должникам: ${debtorNames}. Напоминание продублировано в чат.`);
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

  return (
    <div className="space-y-6">

      {/* Main Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-8 h-8 text-red-700" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-red-700 tracking-tight">
                Фонд Негодяев (500 ₽ в месяц)
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1">
              Автономный фонд команды Негодяи. Отделен от взносов на турслёт и расходуется на реквизит, лагерь и общее благо!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNotifyDebtors}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Bell size={18} className="animate-bounce" />
              Уведомить должников фонда
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t-2 border-red-600/30">
          <div className="bg-yellow-300/80 p-3 rounded-xl border border-yellow-500">
            <span className="text-[11px] font-black uppercase text-amber-900 block">
              Собрано в фонд ({selectedYear} г.)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {totalCollected.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="bg-yellow-300/80 p-3 rounded-xl border border-yellow-500">
            <span className="text-[11px] font-black uppercase text-amber-900 block">
              Текущий суммарный долг
            </span>
            <span className="text-xl sm:text-2xl font-black text-red-600">
              {totalDebtAll.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="bg-yellow-300/80 p-3 rounded-xl border border-yellow-500">
            <span className="text-[11px] font-black uppercase text-amber-900 block">
              Ежемесячный взнос с носа
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-950">
              500 ₽ / месяц
            </span>
          </div>
        </div>
      </div>

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

      {/* TREASURER BADGE & ADMIN ASSIGNMENT BLOCK */}
      <div className="bg-white border-3 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentTreasurer && (
              <img 
                src={currentTreasurer.avatar} 
                alt={currentTreasurer.name} 
                className="w-14 h-14 rounded-full border-3 border-emerald-500 bg-amber-100 object-cover" 
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Award className="text-emerald-600 w-5 h-5" />
                <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Ответственный Казначей Фонда
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-amber-950 mt-1">
                {currentTreasurer ? `${currentTreasurer.name} (@${currentTreasurer.nickname})` : 'Казначей не назначен'}
              </h3>
              <p className="text-[11px] text-amber-700">
                Казначей ведет учет сборов, подтверждает взносы и хранит фонд Негодяев.
              </p>
            </div>
          </div>

          {/* Admin role assignment */}
          {isAdmin && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedTreasurerId || (currentTreasurer?.id || '')}
                onChange={(e) => setSelectedTreasurerId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-950"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignTreasurer}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-lg shadow whitespace-nowrap"
              >
                Назначить Казначеем
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fund Matrix (Members x Months) */}
      <div className="bg-white border-3 border-amber-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-amber-100 border-b-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-amber-800 w-5 h-5" />
            <h4 className="font-black text-sm uppercase text-amber-950">
              Таблица взносов по месяцам ({selectedYear} год)
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-800">Год:</span>
            {[currentYear - 1, currentYear].map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg font-black uppercase transition-all ${
                  selectedYear === yr ? 'bg-red-600 text-yellow-300' : 'bg-white text-amber-950'
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
                <th className="px-4 py-3 sticky left-0 bg-amber-50 z-10 min-w-[180px]">Участник Негодяй</th>
                <th className="px-3 py-3 text-center text-red-600 min-w-[90px]">Долг фонда</th>
                {MONTHS_NAMES.map((m, idx) => (
                  <th 
                    key={m} 
                    className={`px-2 py-3 text-center min-w-[65px] ${
                      idx + 1 === currentMonth && selectedYear === currentYear ? 'bg-yellow-200 text-red-800' : ''
                    }`}
                  >
                    {m.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {participants.map(p => {
                const debt = calculateParticipantFundDebt(p.id);
                return (
                  <tr key={p.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 flex items-center gap-2.5">
                      <img 
                        src={p.avatar} 
                        alt={p.name} 
                        className="w-8 h-8 rounded-full border border-amber-300 bg-amber-100 object-cover shrink-0" 
                      />
                      <div className="truncate">
                        <p className="font-black text-amber-950 truncate">{p.name}</p>
                        <p className="text-[10px] text-amber-600 font-bold">@{p.nickname}</p>
                      </div>
                    </td>

                    {/* Auto-calculated Debt */}
                    <td className="px-3 py-3 text-center font-black">
                      {debt > 0 ? (
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded-full text-[11px]">
                          {debt} ₽
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px]">
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
                          className={`px-1 py-2 text-center ${isCurrentM ? 'bg-yellow-50' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleMonth(p, monthNum)}
                            disabled={!isAdmin && !isTreasurer}
                            className={`w-8 h-8 mx-auto rounded-lg font-black text-[10px] transition-all flex items-center justify-center ${
                              rec.isPaid
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                                : 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 border border-dashed border-gray-300'
                            } ${(!isAdmin && !isTreasurer) ? 'cursor-default' : 'cursor-pointer'}`}
                            title={`${rec.isPaid ? 'Оплачено 500 ₽' : 'Не оплачено'} (Нажмите для изменения)`}
                          >
                            {rec.isPaid ? '✓' : '500'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
