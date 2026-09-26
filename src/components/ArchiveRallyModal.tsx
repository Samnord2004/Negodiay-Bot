import React, { useState } from 'react';
import { Trophy, AlertTriangle, CheckCircle2, X, Archive, Calendar, HelpCircle } from 'lucide-react';
import { Contest, Excursion, ContestHistoryEntry } from '../types';

interface ArchiveRallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPos?: { top: number; right: number } | null;
  excursion: Excursion;
  contests: Contest[];
  contestHistory: ContestHistoryEntry[];
  onConfirmArchive: (params: {
    excursionId: string;
    year: string;
    overallPlace: string;
    updatedContests: Contest[];
  }) => Promise<void> | void;
}

const QUICK_PLACES = ['1-е место', '2-е место', '3-е место', '4-е место', '5-е место', 'Призёр', 'Участник'];

export default function ArchiveRallyModal({
  isOpen,
  onClose,
  anchorPos,
  excursion,
  contests,
  contestHistory,
  onConfirmArchive
}: ArchiveRallyModalProps) {
  if (!isOpen || !excursion) return null;

  // Extract year from excursion date or title, default to current year
  const extractYear = (ex: Excursion): string => {
    if (ex.date) {
      const match = ex.date.match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    if (ex.title) {
      const match = ex.title.match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    return new Date().getFullYear().toString();
  };

  const detectedYear = extractYear(excursion);
  const [targetYear, setTargetYear] = useState<string>(detectedYear);
  const [overallPlace, setOverallPlace] = useState<string>('1-е место');

  // Filter contests linked to this excursion or unlinked
  const rallyContests = contests.filter(c => !c.excursionId || c.excursionId === excursion.id);

  // Local state for editable contest places during archiving
  const [contestPlaces, setContestPlaces] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    rallyContests.forEach(c => {
      initial[c.id] = c.place || '';
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningAck, setWarningAck] = useState(false);

  // Count contests with missing places
  const missingPlaceContests = rallyContests.filter(c => {
    const p = (contestPlaces[c.id] || '').trim();
    return !p || p === '—' || p === '-';
  });

  const hasMissing = missingPlaceContests.length > 0;

  const handleSetPlace = (contestId: string, place: string) => {
    setContestPlaces(prev => ({
      ...prev,
      [contestId]: place
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetYear || !targetYear.trim()) {
      alert('Пожалуйста, укажите год слёта');
      return;
    }

    if (hasMissing && !warningAck) {
      alert(`Внимание! У ${missingPlaceContests.length} конкурсов не проставлены занятые места. Пожалуйста, укажите места или подтвердите отправку без них.`);
      setWarningAck(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedContests: Contest[] = rallyContests.map(c => ({
        ...c,
        place: contestPlaces[c.id] || c.place || ''
      }));

      await onConfirmArchive({
        excursionId: excursion.id,
        year: targetYear.trim(),
        overallPlace: overallPlace.trim(),
        updatedContests
      });

      onClose();
    } catch (err) {
      console.error('Archiving error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Завершение слёта и перенос в архив"
        onClick={(e) => e.stopPropagation()}
        className="bg-amber-50 border-4 border-amber-950 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header */}
        <div className="bg-red-600 text-yellow-300 p-5 flex items-center justify-between border-b-4 border-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-red-700 flex items-center justify-center font-black border-2 border-amber-950 shadow-inner">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight text-yellow-300">
                Завершение слёта и перенос в архив
              </h3>
              <p className="text-xs font-bold text-yellow-100/90">
                Внесение мест в таблицу истории и обнуление текущей программы
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-red-700 text-yellow-200 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Excursion Summary */}
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                  Завершаемый слёт
                </span>
                <h4 className="font-black text-base text-stone-900 mt-1">{excursion.title}</h4>
                <p className="text-xs text-stone-600">
                  📍 {excursion.location} • 📅 {excursion.date}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-amber-100/80 px-3 py-2 rounded-xl border border-amber-300">
                <Calendar className="w-4 h-4 text-amber-800" />
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  Год в истории:
                  <input
                    type="number"
                    value={targetYear}
                    onChange={e => setTargetYear(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-amber-400 rounded-lg text-sm font-black text-amber-950 text-center"
                    min="1990"
                    max="2040"
                    required
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Overall Team Place */}
          <div className="bg-yellow-100/70 border-2 border-yellow-400 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-800" />
              <h4 className="text-xs font-black uppercase text-amber-950">
                Итоговое общекомандное место Негодяев в слёте ({targetYear} год)
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {['1-е место', '2-е место', '3-е место', '4-е место', 'Призёр'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOverallPlace(p)}
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    overallPlace === p
                      ? 'bg-red-600 text-yellow-300 scale-105 border border-amber-950 shadow-xs'
                      : 'bg-white hover:bg-amber-200 text-amber-950 border border-amber-300'
                  }`}
                >
                  {p.startsWith('1') ? '🥇 ' : p.startsWith('2') ? '🥈 ' : p.startsWith('3') ? '🥉 ' : ''}{p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={overallPlace}
              onChange={e => setOverallPlace(e.target.value)}
              placeholder="Например: 1-е место (Кубок наш!)"
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
            />
          </div>

          {/* WARNING: Missing places check */}
          {hasMissing ? (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 shadow-xs space-y-3 animate-pulse-subtle">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-red-700">
                    Внимание капитана! Не указаны результаты в {missingPlaceContests.length} конкурсах
                  </h4>
                  <p className="text-xs text-red-800 font-medium mt-0.5">
                    Чтобы награды не пропали из летописи с 1993 года, укажите занятые места для каждого конкурса ниже:
                  </p>
                </div>
              </div>

              {/* Missing Contests Place Assigner */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {missingPlaceContests.map(c => (
                  <div key={c.id} className="bg-white p-3 rounded-xl border border-red-300 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-stone-900">{c.title}</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        Место не указано
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {QUICK_PLACES.map(qp => (
                        <button
                          key={qp}
                          type="button"
                          onClick={() => handleSetPlace(c.id, qp)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                            contestPlaces[c.id] === qp
                              ? 'bg-red-600 text-yellow-300 scale-105'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                        >
                          {qp.startsWith('1') ? '🥇 ' : qp.startsWith('2') ? '🥈 ' : qp.startsWith('3') ? '🥉 ' : ''}{qp}
                        </button>
                      ))}
                      <input
                        type="text"
                        value={contestPlaces[c.id] || ''}
                        onChange={e => handleSetPlace(c.id, e.target.value)}
                        placeholder="Своё место..."
                        className="w-28 px-2 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-black text-emerald-950">
                Все места по конкурсам ({rallyContests.length}) заполнены и готовы к фиксации в истории!
              </span>
            </div>
          )}

          {/* List of already filled contests */}
          {rallyContests.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase text-amber-950">
                Результаты соревнований к занесению в таблицу ({rallyContests.length}):
              </span>
              <div className="bg-white rounded-2xl border border-stone-200 max-h-44 overflow-y-auto divide-y divide-stone-100">
                {rallyContests.map(c => {
                  const place = contestPlaces[c.id] || c.place || '—';
                  return (
                    <div key={c.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="font-bold text-stone-800 truncate">
                        {c.title}
                        {c.category && (
                          <span className="ml-2 text-[10px] font-normal text-stone-500">
                            ({c.category})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          value={contestPlaces[c.id] || ''}
                          onChange={e => handleSetPlace(c.id, e.target.value)}
                          placeholder="—"
                          className="w-24 px-2 py-0.5 border border-amber-300 rounded-lg text-xs font-black text-amber-950 text-center bg-amber-50"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation Banner */}
          <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-3 text-[11px] text-amber-950 font-medium space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <HelpCircle size={14} className="text-red-600" />
              Что произойдёт после нажатия кнопки:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 pl-1 text-stone-700">
              <li>Результаты запишутся в <strong>«Таблицу истории и мест»</strong> за <strong>{targetYear} год</strong>.</li>
              <li>Текущий список конкурсов слёта будет <strong>обнулен (очищен)</strong> для нового сбора.</li>
              <li>Слёт «{excursion.title}» будет перемещен в <strong>архив</strong>.</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs uppercase cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black text-xs uppercase rounded-xl border-2 border-amber-950 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Archive size={16} />
              <span>{isSubmitting ? 'Сохранение...' : 'Занести в историю и отправить в архив'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
