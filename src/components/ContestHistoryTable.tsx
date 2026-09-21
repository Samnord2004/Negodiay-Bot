import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Search, 
  Check, 
  X, 
  Save, 
  Sparkles,
  Shield,
  HelpCircle
} from 'lucide-react';
import { ContestHistoryEntry } from '../types';

interface ContestHistoryTableProps {
  history: ContestHistoryEntry[];
  onUpdateHistory: (newHistory: ContestHistoryEntry[]) => void;
  isAdmin: boolean;
}

export default function ContestHistoryTable({
  history,
  onUpdateHistory,
  isAdmin
}: ContestHistoryTableProps) {
  // Decade filter: 'all' | '2020s' | '2010s' | '2000s' | '1990s'
  const [decadeFilter, setDecadeFilter] = useState<'all' | '2020s' | '2010s' | '2000s' | '1990s'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDescending, setSortDescending] = useState(true); // default: 2026 -> 1993

  // Editing cell state: { contestId, year, currentPlace }
  const [editingCell, setEditingCell] = useState<{ contestId: string; year: string; currentPlace: string } | null>(null);
  const [cellInputValue, setCellInputValue] = useState('');

  // Add new contest discipline modal state
  const [showAddContestModal, setShowAddContestModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Общий зачёт' | 'Творчество' | 'Туризм' | 'Спорт' | 'Лагерь'>('Туризм');

  // Add new year state
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  // Save status notification
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Extract all distinct years available in history, starting from at least 1993 up to 2026
  const allYears = useMemo(() => {
    const yearSet = new Set<string>();
    // Guarantee 1993 to 2026
    for (let y = 1993; y <= 2026; y++) {
      yearSet.add(y.toString());
    }
    history.forEach(item => {
      Object.keys(item.results || {}).forEach(y => yearSet.add(y));
    });

    const list = Array.from(yearSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return sortDescending ? numB - numA : numA - numB;
    });

    return list;
  }, [history, sortDescending]);

  // Filtered years based on decade
  const visibleYears = useMemo(() => {
    return allYears.filter(yearStr => {
      const y = parseInt(yearStr, 10);
      if (decadeFilter === '2020s') return y >= 2020;
      if (decadeFilter === '2010s') return y >= 2010 && y <= 2019;
      if (decadeFilter === '2000s') return y >= 2000 && y <= 2009;
      if (decadeFilter === '1990s') return y >= 1990 && y <= 1999;
      return true;
    });
  }, [allYears, decadeFilter]);

  // Filtered contests
  const filteredContests = useMemo(() => {
    return history.filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    });
  }, [history, searchQuery]);

  // Overall Statistics across all records
  const stats = useMemo(() => {
    let goldCount = 0;
    let silverCount = 0;
    let bronzeCount = 0;

    history.forEach(c => {
      Object.values(c.results || {}).forEach(val => {
        const clean = String(val).trim().toLowerCase();
        if (clean === '1' || clean === '1-е' || clean.includes('1-е место') || clean === '1 место') {
          goldCount++;
        } else if (clean === '2' || clean === '2-е' || clean.includes('2-е место') || clean === '2 место') {
          silverCount++;
        } else if (clean === '3' || clean === '3-е' || clean.includes('3-е место') || clean === '3 место') {
          bronzeCount++;
        }
      });
    });

    return {
      goldCount,
      silverCount,
      bronzeCount,
      totalPodiums: goldCount + silverCount + bronzeCount,
      totalYears: allYears.length
    };
  }, [history, allYears]);

  // Cell Place helper
  const renderPlaceBadge = (val: string | undefined, isOverall = false) => {
    if (!val || val === '—' || val === '-' || val.trim() === '') {
      return <span className="text-amber-900/30 text-xs font-bold select-none">—</span>;
    }

    const clean = val.trim();
    const isFirst = clean === '1' || clean === '1-е' || clean.startsWith('1');
    const isSecond = clean === '2' || clean === '2-е' || clean.startsWith('2');
    const isThird = clean === '3' || clean === '3-е' || clean.startsWith('3');

    if (isFirst) {
      return (
        <span 
          className={`inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-black shadow-xs border ${
            isOverall 
              ? 'bg-amber-400 text-amber-950 border-amber-600 ring-2 ring-amber-300' 
              : 'bg-amber-300 text-amber-950 border-amber-500'
          }`}
          title="1-е место (Золото)"
        >
          <span className="text-[10px]">🥇</span> {clean}
        </span>
      );
    }

    if (isSecond) {
      return (
        <span 
          className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-black bg-slate-200 text-slate-800 border border-slate-400 shadow-xs"
          title="2-е место (Серебро)"
        >
          <span className="text-[10px]">🥈</span> {clean}
        </span>
      );
    }

    if (isThird) {
      return (
        <span 
          className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-black bg-amber-700/20 text-amber-900 border border-amber-800/40 shadow-xs"
          title="3-е место (Бронза)"
        >
          <span className="text-[10px]">🥉</span> {clean}
        </span>
      );
    }

    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
        {clean}
      </span>
    );
  };

  // Open Edit Cell Modal
  const handleOpenEditCell = (contestId: string, year: string, currentPlace: string) => {
    if (!isAdmin) return;
    setEditingCell({ contestId, year, currentPlace });
    setCellInputValue(currentPlace === '—' ? '' : currentPlace);
  };

  // Save Cell Edit
  const handleSaveCell = (newPlaceValue: string) => {
    if (!editingCell) return;
    const { contestId, year } = editingCell;

    const updated = history.map(item => {
      if (item.id === contestId) {
        const nextResults = { ...(item.results || {}) };
        if (!newPlaceValue || newPlaceValue.trim() === '' || newPlaceValue === '—') {
          delete nextResults[year];
        } else {
          nextResults[year] = newPlaceValue.trim();
        }
        return { ...item, results: nextResults };
      }
      return item;
    });

    onUpdateHistory(updated);
    setEditingCell(null);
    showNotification(`Место за ${year} год успешно сохранено!`);
  };

  // Add Contest Discipline
  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEntry: ContestHistoryEntry = {
      id: 'ch_' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      results: {}
    };

    onUpdateHistory([...history, newEntry]);
    setNewTitle('');
    setShowAddContestModal(false);
    showNotification(`Дисциплина «${newEntry.title}» добавлена в хронику!`);
  };

  // Delete Contest Discipline
  const handleDeleteDiscipline = (id: string, title: string) => {
    if (!isAdmin) return;
    if (confirm(`Удалить дисциплину «${title}» со всей историей выступлений?`)) {
      onUpdateHistory(history.filter(item => item.id !== id));
      showNotification(`Дисциплина удалена.`);
    }
  };

  // Add New Year
  const handleAddNewYear = (e: React.FormEvent) => {
    e.preventDefault();
    const yNum = parseInt(newYearInput.trim(), 10);
    if (isNaN(yNum) || yNum < 1993 || yNum > 2099) {
      alert('Пожалуйста, укажите корректный год (от 1993 до 2099)');
      return;
    }
    const yearStr = yNum.toString();
    // Add dummy place to overall to anchor the year if needed
    const updated = history.map(item => {
      if (item.isOverall && !item.results[yearStr]) {
        return {
          ...item,
          results: { ...item.results, [yearStr]: '—' }
        };
      }
      return item;
    });
    onUpdateHistory(updated);
    setShowAddYearModal(false);
    setNewYearInput('');
    showNotification(`Год ${yearStr} добавлен в таблицу хроники!`);
  };

  return (
    <div className="space-y-6" id="contests-history-section">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-950 text-yellow-300 px-4 py-3 rounded-2xl border-2 border-yellow-400 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 border-4 border-amber-600 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-amber-300/40 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-700 text-yellow-200 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 shadow-xs inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Хроника с 1993 года
              </span>
              <span className="bg-amber-900/80 text-amber-100 font-bold text-xs px-2.5 py-1 rounded-full">
                Летопись слётов
              </span>
              {isAdmin && (
                <span className="bg-emerald-700 text-emerald-100 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Режим капитана (Редактирование включено)
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-tight">
              История выступлений и занятые места
            </h2>
            <p className="text-sm sm:text-base text-amber-950/80 font-medium max-w-2xl">
              Таблица результатов команды «Негодяи» во всех конкурсах за 34 года хроники туристических слётов.
              {isAdmin && ' Нажмите на любую ячейку, чтобы изменить занятое место.'}
            </p>
          </div>

          {/* Captain Toolbar Controls */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => setShowAddContestModal(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-amber-950"
              >
                <Plus className="w-4 h-4" />
                <span>+ Дисциплина</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddYearModal(true)}
                className="px-3.5 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>+ Год</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stat Badges */}
        <div className="mt-6 pt-5 border-t border-amber-600/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-100/80 backdrop-blur-xs rounded-2xl p-3 border border-amber-400/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              🥇
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950">{stats.goldCount}</div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Первых мест</div>
            </div>
          </div>

          <div className="bg-amber-100/80 backdrop-blur-xs rounded-2xl p-3 border border-amber-400/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-300 text-slate-800 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              🥈
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950">{stats.silverCount}</div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Вторых мест</div>
            </div>
          </div>

          <div className="bg-amber-100/80 backdrop-blur-xs rounded-2xl p-3 border border-amber-400/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-amber-100 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              🥉
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950">{stats.bronzeCount}</div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Третьих мест</div>
            </div>
          </div>

          <div className="bg-amber-100/80 backdrop-blur-xs rounded-2xl p-3 border border-amber-400/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-yellow-300 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              🏆
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950">{stats.totalYears}</div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Лет в хронике</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white/80 backdrop-blur-xs border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Decade tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-700" /> Период:
          </span>
          {[
            { id: 'all', label: 'Все года (1993–2026)' },
            { id: '2020s', label: '2020-е' },
            { id: '2010s', label: '2010-е' },
            { id: '2000s', label: '2000-е' },
            { id: '1990s', label: '1990-е (Основание)' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDecadeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                decadeFilter === tab.id
                  ? 'bg-red-600 text-yellow-300 shadow-xs scale-102'
                  : 'bg-amber-100/70 hover:bg-amber-200/80 text-amber-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort order */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Discipline */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-amber-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск дисциплины..."
              className="w-full pl-8 pr-3 py-1.5 bg-amber-50 text-xs font-bold text-amber-950 rounded-xl border border-amber-300 focus:border-red-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-700 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortDescending(!sortDescending)}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Переключить порядок годов"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-700" />
            <span>{sortDescending ? '2026 → 1993' : '1993 → 2026'}</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-amber-900 text-yellow-300 text-xs uppercase tracking-wider font-black select-none border-b-2 border-amber-950">
                {/* Sticky Header: Contest Title */}
                <th className="sticky left-0 z-30 bg-amber-950 px-4 py-3.5 min-w-[240px] sm:min-w-[280px] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span>Конкурс / Дисциплина</span>
                    <span className="text-[10px] text-amber-300/70 font-normal">
                      ({filteredContests.length})
                    </span>
                  </div>
                </th>

                {/* Year Columns */}
                {visibleYears.map(yearStr => {
                  const isCurrentYear = yearStr === '2026';
                  const isFoundingYear = yearStr === '1993';
                  return (
                    <th 
                      key={yearStr}
                      className={`px-3 py-3.5 text-center min-w-[70px] border-l border-amber-800/60 ${
                        isCurrentYear 
                          ? 'bg-red-700 text-yellow-200 font-black' 
                          : isFoundingYear 
                          ? 'bg-amber-800 text-amber-100' 
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black">{yearStr}</span>
                        {isFoundingYear && (
                          <span className="text-[9px] font-bold text-yellow-300 tracking-tighter uppercase">
                            Основание
                          </span>
                        )}
                        {isCurrentYear && (
                          <span className="text-[9px] font-bold text-yellow-300 tracking-tighter uppercase">
                            Слёт 2026
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-200/80 text-sm">
              {filteredContests.map((contest, idx) => {
                const isOverall = !!contest.isOverall;
                return (
                  <tr 
                    key={contest.id}
                    className={`transition-colors ${
                      isOverall 
                        ? 'bg-amber-100/90 font-bold hover:bg-amber-100' 
                        : idx % 2 === 0 
                        ? 'bg-white hover:bg-amber-50/60' 
                        : 'bg-amber-50/40 hover:bg-amber-50'
                    }`}
                  >
                    {/* Sticky Contest Name Column */}
                    <td className={`sticky left-0 z-20 px-4 py-3 border-r-2 border-amber-300 ${
                      isOverall 
                        ? 'bg-amber-200/95 text-amber-950 font-black' 
                        : idx % 2 === 0 
                        ? 'bg-white/95 text-amber-950' 
                        : 'bg-amber-50/95 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-amber-950 truncate max-w-[200px] sm:max-w-[230px]" title={contest.title}>
                            {contest.title}
                          </div>
                          {contest.category && (
                            <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              contest.category === 'Общий зачёт'
                                ? 'bg-red-600 text-yellow-200'
                                : contest.category === 'Творчество'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : contest.category === 'Туризм'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : contest.category === 'Спорт'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-amber-200 text-amber-950 border border-amber-400'
                            }`}>
                              {contest.category}
                            </span>
                          )}
                        </div>

                        {/* Captain delete button for non-overall disciplines */}
                        {isAdmin && !isOverall && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDiscipline(contest.id, contest.title)}
                            className="p-1 text-amber-600/60 hover:text-red-600 rounded hover:bg-amber-200/50 transition-colors cursor-pointer"
                            title="Удалить дисциплину"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Year Result Cells */}
                    {visibleYears.map(yearStr => {
                      const placeValue = contest.results ? contest.results[yearStr] : undefined;
                      const isCurrentYear = yearStr === '2026';

                      return (
                        <td 
                          key={yearStr}
                          onClick={() => handleOpenEditCell(contest.id, yearStr, placeValue || '—')}
                          className={`px-2 py-2 text-center border-l border-amber-200/70 transition-colors ${
                            isAdmin 
                              ? 'cursor-pointer hover:bg-amber-200/60' 
                              : ''
                          } ${isCurrentYear ? 'bg-amber-100/30' : ''}`}
                          title={isAdmin ? `Кликните, чтобы изменить место (${yearStr} год)` : undefined}
                        >
                          <div className="flex items-center justify-center min-h-[26px]">
                            {renderPlaceBadge(placeValue, isOverall)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredContests.length === 0 && (
                <tr>
                  <td colSpan={visibleYears.length + 1} className="py-12 text-center text-amber-800 font-bold">
                    Дисциплины не найдены по запросу «{searchQuery}»
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Guide */}
        <div className="p-4 bg-amber-50/80 border-t border-amber-200 text-xs text-amber-900/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-amber-950">Обозначения:</span>
            <span className="inline-flex items-center gap-1 font-bold"><span className="text-sm">🥇</span> 1-е место</span>
            <span className="inline-flex items-center gap-1 font-bold"><span className="text-sm">🥈</span> 2-е место</span>
            <span className="inline-flex items-center gap-1 font-bold"><span className="text-sm">🥉</span> 3-е место</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-800/60"><span>—</span> не проводился / нет данных</span>
          </div>

          <div className="text-amber-950 font-bold">
            {isAdmin 
              ? '💡 Как капитан вы можете нажать на любую ячейку для быстрой смены места' 
              : '🏆 Команда «Негодяи» — бессменные чемпионы и хранители походных традиций!'}
          </div>
        </div>
      </div>

      {/* MODAL: EDIT CELL PLACE (Captain Popover) */}
      {editingCell && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEditingCell(null)}
        >
          <div 
            className="bg-amber-50 border-4 border-red-600 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <div>
                <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                  Редактирование результата
                </span>
                <h3 className="text-lg font-black text-amber-950">
                  {editingCell.year} год
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="p-1 text-amber-800 hover:text-red-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-amber-900">
              {history.find(c => c.id === editingCell.contestId)?.title}
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                Быстрый выбор места:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '🥇 1-е', val: '1' },
                  { label: '🥈 2-е', val: '2' },
                  { label: '🥉 3-е', val: '3' },
                  { label: '4-е место', val: '4' },
                  { label: '5-е место', val: '5' },
                  { label: 'Гран-при', val: 'Гран-при' },
                  { label: 'Призёр', val: 'Призёр' },
                  { label: 'Участие', val: 'Участие' },
                  { label: 'Очистить (—)', val: '—' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSaveCell(preset.val)}
                    className="px-2 py-2 bg-white hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5 pt-2 border-t border-amber-200">
              <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                Или введите своё значение:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cellInputValue}
                  onChange={e => setCellInputValue(e.target.value)}
                  placeholder="e.g. 1-е, 2, Приз симпатий"
                  className="flex-1 px-3 py-2 bg-white text-xs font-bold text-amber-950 border-2 border-amber-400 focus:border-red-600 focus:outline-none rounded-xl"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveCell(cellInputValue)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ОК</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTEST DISCIPLINE */}
      {showAddContestModal && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAddContestModal(false)}
        >
          <div 
            className="bg-amber-50 border-4 border-red-600 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <div>
                <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                  Новая дисциплина
                </span>
                <h3 className="text-xl font-black text-amber-950">
                  Добавить конкурс в хронику
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContestModal(false)}
                className="p-1 text-amber-800 hover:text-red-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDiscipline} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Название конкурса / этапа:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 🏹 Стрельба из лука / Пневматика"
                  required
                  className="w-full px-3 py-2 bg-white text-sm font-bold text-amber-950 border-2 border-amber-400 focus:border-red-600 focus:outline-none rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Категория конкурса:
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white text-sm font-bold text-amber-950 border-2 border-amber-400 focus:border-red-600 focus:outline-none rounded-xl cursor-pointer"
                >
                  <option value="Туризм">Туризм (КТМ, ориентирование, узлы)</option>
                  <option value="Творчество">Творчество (визитка, песня, газета)</option>
                  <option value="Спорт">Спорт (волейбол, слалом, перетягивание)</option>
                  <option value="Лагерь">Лагерь (бивуак, казан, капитаны)</option>
                  <option value="Общий зачёт">Общий зачёт</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-amber-300">
                <button
                  type="button"
                  onClick={() => setShowAddContestModal(false)}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD YEAR */}
      {showAddYearModal && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAddYearModal(false)}
        >
          <div 
            className="bg-amber-50 border-4 border-red-600 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <div>
                <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                  Новый слёт
                </span>
                <h3 className="text-xl font-black text-amber-950">
                  Добавить год в таблицу
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddYearModal(false)}
                className="p-1 text-amber-800 hover:text-red-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewYear} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Год слёта:
                </label>
                <input
                  type="number"
                  min="1993"
                  max="2099"
                  value={newYearInput}
                  onChange={e => setNewYearInput(e.target.value)}
                  placeholder="e.g. 2027"
                  required
                  className="w-full px-3 py-2 bg-white text-sm font-bold text-amber-950 border-2 border-amber-400 focus:border-red-600 focus:outline-none rounded-xl"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-amber-300">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить год</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
