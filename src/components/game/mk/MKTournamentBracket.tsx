import React, { useState } from 'react';
import { 
  Trophy, Flame, Swords, Shield, Award, 
  CheckCircle2, Plus, Sparkles, User, HelpCircle, ChevronRight,
  Edit2, Trash2
} from 'lucide-react';
import { Participant, RallyCoin } from '../../../types';
import { MKBout, FinishType, MKFighter } from '../../../types/mkTournament';
import { MK_FIGHTERS } from '../../../utils/mkData';
import { getParticipantAvatar } from '../../../utils/avatar';
import { playMKFatalitySound, playMKGongSound } from '../../../utils/mkSounds';

interface MKTournamentBracketProps {
  participants: Participant[];
  coins: RallyCoin[];
  currentUser: Participant | null;
  isCaptain: boolean;
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune' | 'poker' | 'mortal_kombat';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
}

export default function MKTournamentBracket({
  participants,
  coins,
  currentUser,
  isCaptain,
  onAwardCoin
}: MKTournamentBracketProps) {
  // Sample initial tournament matches with localStorage persistence
  const [bouts, setBouts] = useState<MKBout[]>(() => {
    try {
      const saved = localStorage.getItem('mk_tournament_bouts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load MK bouts from localStorage", e);
    }
    // Generate 3 sample tournament bouts using actual participants
    const p1 = participants[0] || { id: 'p1', name: 'Андрей Самойлов', nickname: 'Капитан' };
    const p2 = participants[1] || { id: 'p2', name: 'Максим Леонов', nickname: 'Душнила' };
    const p3 = participants[2] || { id: 'p3', name: 'Ольга Смирнова', nickname: 'Анархистка' };
    const p4 = participants[3] || { id: 'p4', name: 'Дмитрий Волков', nickname: 'Ковбой' };

    return [
      {
        id: 'bout_qf1',
        roundName: '1/4 Финала #1',
        player1: {
          participantId: p1.id,
          name: p1.name,
          nickname: p1.nickname || p1.name,
          avatar: getParticipantAvatar(p1),
          fighterId: 'scorpion',
          score: 2
        },
        player2: {
          participantId: p2.id,
          name: p2.name,
          nickname: p2.nickname || p2.name,
          avatar: getParticipantAvatar(p2),
          fighterId: 'subzero',
          score: 1
        },
        status: 'completed',
        winnerParticipantId: p1.id,
        finishType: 'fatality',
        coinPrize: 3,
        bets: []
      },
      {
        id: 'bout_qf2',
        roundName: '1/4 Финала #2',
        player1: {
          participantId: p3.id,
          name: p3.name,
          nickname: p3.nickname || p3.name,
          avatar: getParticipantAvatar(p3),
          fighterId: 'sonya',
          score: 0
        },
        player2: {
          participantId: p4.id,
          name: p4.name,
          nickname: p4.nickname || p4.name,
          avatar: getParticipantAvatar(p4),
          fighterId: 'raiden',
          score: 0
        },
        status: 'active',
        coinPrize: 3,
        bets: []
      },
      {
        id: 'bout_final',
        roundName: 'ГРАНД-ФИНАЛ ТУРНИРА 👑',
        player1: {
          participantId: p1.id,
          name: p1.name,
          nickname: p1.nickname || p1.name,
          avatar: getParticipantAvatar(p1),
          fighterId: 'scorpion',
          score: 0
        },
        player2: {
          participantId: p4.id,
          name: p4.name,
          nickname: p4.nickname || p4.name,
          avatar: getParticipantAvatar(p4),
          fighterId: 'raiden',
          score: 0
        },
        status: 'pending',
        coinPrize: 5,
        bets: []
      }
    ];
  });

  const [selectedBoutId, setSelectedBoutId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [betBoutId, setBetBoutId] = useState<string | null>(null);
  const [betPlayerChoice, setBetPlayerChoice] = useState<'p1' | 'p2'>('p1');
  const [betAmount, setBetAmount] = useState(1);

  // New Bout Creation state
  const [newRoundName, setNewRoundName] = useState('Поединок 1 на 1');
  const [newP1Id, setNewP1Id] = useState(participants[0]?.id || '');
  const [newP2Id, setNewP2Id] = useState(participants[1]?.id || '');
  const [newP1Fighter, setNewP1Fighter] = useState('scorpion');
  const [newP2Fighter, setNewP2Fighter] = useState('subzero');
  const [newPrize, setNewPrize] = useState(3);

  // Edit Bout state
  const [editingBout, setEditingBout] = useState<MKBout | null>(null);
  const [editRoundName, setEditRoundName] = useState('');
  const [editP1Id, setEditP1Id] = useState('');
  const [editP2Id, setEditP2Id] = useState('');
  const [editP1Fighter, setEditP1Fighter] = useState('scorpion');
  const [editP2Fighter, setEditP2Fighter] = useState('subzero');
  const [editP1Score, setEditP1Score] = useState(0);
  const [editP2Score, setEditP2Score] = useState(0);
  const [editStatus, setEditStatus] = useState<'pending' | 'active' | 'completed'>('pending');
  const [editWinnerId, setEditWinnerId] = useState('');
  const [editFinishType, setEditFinishType] = useState<FinishType | undefined>('fatality');
  const [editPrize, setEditPrize] = useState(3);

  const saveBoutsToStorage = (updatedBouts: MKBout[]) => {
    try {
      localStorage.setItem('mk_tournament_bouts_v2', JSON.stringify(updatedBouts));
    } catch (e) {
      console.warn("Failed to persist MK bouts", e);
    }
  };

  const handleStartEditBout = (bout: MKBout) => {
    setEditingBout(bout);
    setEditRoundName(bout.roundName);
    setEditP1Id(bout.player1.participantId);
    setEditP2Id(bout.player2.participantId);
    setEditP1Fighter(bout.player1.fighterId);
    setEditP2Fighter(bout.player2.fighterId);
    setEditP1Score(bout.player1.score || 0);
    setEditP2Score(bout.player2.score || 0);
    setEditStatus(bout.status);
    setEditWinnerId(bout.winnerParticipantId || bout.player1.participantId);
    setEditFinishType(bout.finishType || 'fatality');
    setEditPrize(bout.coinPrize);
  };

  const handleSaveEditBout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBout) return;

    const p1 = participants.find(p => p.id === editP1Id) || editingBout.player1;
    const p2 = participants.find(p => p.id === editP2Id) || editingBout.player2;

    const updated = bouts.map(b => {
      if (b.id !== editingBout.id) return b;
      return {
        ...b,
        roundName: editRoundName,
        player1: {
          ...b.player1,
          participantId: p1.id,
          name: p1.name,
          nickname: (p1 as any).nickname || p1.name,
          avatar: getParticipantAvatar(p1 as any),
          fighterId: editP1Fighter,
          score: Number(editP1Score)
        },
        player2: {
          ...b.player2,
          participantId: p2.id,
          name: p2.name,
          nickname: (p2 as any).nickname || p2.name,
          avatar: getParticipantAvatar(p2 as any),
          fighterId: editP2Fighter,
          score: Number(editP2Score)
        },
        status: editStatus,
        winnerParticipantId: editStatus === 'completed' ? (editWinnerId || undefined) : undefined,
        finishType: editStatus === 'completed' ? (editFinishType || undefined) : undefined,
        coinPrize: Number(editPrize)
      };
    });

    setBouts(updated);
    saveBoutsToStorage(updated);
    setEditingBout(null);
  };

  const handleDeleteBout = (boutId: string) => {
    if (window.confirm("Удалить этот поединок из турнирной сетки?")) {
      const updated = bouts.filter(b => b.id !== boutId);
      setBouts(updated);
      saveBoutsToStorage(updated);
    }
  };

  // Finish match modal state
  const [finishWinnerId, setFinishWinnerId] = useState<string>('');
  const [finishScoreP1, setFinishScoreP1] = useState(2);
  const [finishScoreP2, setFinishScoreP2] = useState(1);
  const [finishType, setFinishType] = useState<FinishType>('fatality');

  const selectedBout = bouts.find(b => b.id === selectedBoutId);

  // Handle Recording Match Result
  const handleConfirmBoutResult = async () => {
    if (!selectedBout || !finishWinnerId) return;

    playMKFatalitySound();

    const winnerName = finishWinnerId === selectedBout.player1.participantId
      ? selectedBout.player1.name
      : selectedBout.player2.name;

    const winnerNickname = finishWinnerId === selectedBout.player1.participantId
      ? selectedBout.player1.nickname
      : selectedBout.player2.nickname;

    // Award coins to the winner
    if (selectedBout.coinPrize > 0) {
      await onAwardCoin({
        participantId: finishWinnerId,
        participantName: winnerName,
        participantNickname: winnerNickname,
        taskTitle: `Победа в Mortal Kombat (${selectedBout.roundName})`,
        category: 'mortal_kombat',
        comment: `Триумф в турнире MK! Добивание: ${finishType.toUpperCase()}! Счёт ${finishScoreP1}:${finishScoreP2}`,
        awardedBy: currentUser?.name || 'Судейская коллегия MK'
      });
    }

    const updated = bouts.map(b => {
      if (b.id !== selectedBout.id) return b;
      return {
        ...b,
        status: 'completed' as const,
        winnerParticipantId: finishWinnerId,
        finishType,
        player1: { ...b.player1, score: finishScoreP1 },
        player2: { ...b.player2, score: finishScoreP2 }
      };
    });
    setBouts(updated);
    saveBoutsToStorage(updated);

    setSelectedBoutId(null);
  };

  // Place bet on a bout
  const handlePlaceBet = () => {
    if (!betBoutId || !currentUser) return;
    const bout = bouts.find(b => b.id === betBoutId);
    if (!bout) return;

    const targetParticipantId = betPlayerChoice === 'p1' ? bout.player1.participantId : bout.player2.participantId;

    const newBet = {
      id: 'bet_' + Date.now(),
      participantId: currentUser.id,
      participantName: currentUser.name,
      betOnParticipantId: targetParticipantId,
      amount: betAmount
    };

    const updated = bouts.map(b => {
      if (b.id !== betBoutId) return b;
      return {
        ...b,
        bets: [...b.bets, newBet]
      };
    });
    setBouts(updated);
    saveBoutsToStorage(updated);

    setBetBoutId(null);
    playMKGongSound();
  };

  // Create new custom bout
  const handleCreateBout = () => {
    const p1 = participants.find(p => p.id === newP1Id) || participants[0];
    const p2 = participants.find(p => p.id === newP2Id) || participants[1];
    if (!p1 || !p2) return;

    const newBout: MKBout = {
      id: 'bout_' + Date.now(),
      roundName: newRoundName,
      player1: {
        participantId: p1.id,
        name: p1.name,
        nickname: p1.nickname || p1.name,
        avatar: getParticipantAvatar(p1),
        fighterId: newP1Fighter,
        score: 0
      },
      player2: {
        participantId: p2.id,
        name: p2.name,
        nickname: p2.nickname || p2.name,
        avatar: getParticipantAvatar(p2),
        fighterId: newP2Fighter,
        score: 0
      },
      status: 'pending',
      coinPrize: newPrize,
      bets: []
    };

    const updated = [newBout, ...bouts];
    setBouts(updated);
    saveBoutsToStorage(updated);
    setShowCreateModal(false);
    playMKGongSound();
  };

  return (
    <div className="space-y-4">
      
      {/* HEADER: TOURNAMENT INFO & ADD BOUT BUTTON */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <span>Турнирная Сетка «Mortal Kombat Негодяев»</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Схватки соратников, выбор персонажей, ставки монетами и фиксация побед с Fatality!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Назначить бой</span>
        </button>
      </div>

      {/* BOUTS LIST / CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bouts.map((bout) => {
          const f1 = MK_FIGHTERS.find(f => f.id === bout.player1.fighterId) || MK_FIGHTERS[0];
          const f2 = MK_FIGHTERS.find(f => f.id === bout.player2.fighterId) || MK_FIGHTERS[1];
          const totalBets = bout.bets.reduce((acc, b) => acc + b.amount, 0);

          return (
            <div
              key={bout.id}
              className={`relative bg-stone-900 border-2 rounded-2xl p-3.5 shadow-xl transition-all ${
                bout.status === 'completed'
                  ? 'border-emerald-500/40 opacity-90'
                  : bout.status === 'active'
                  ? 'border-amber-400 shadow-amber-900/30'
                  : 'border-stone-800'
              }`}
            >
              {/* Round Header & Status Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2 mb-2.5">
                <span className="text-xs font-black uppercase text-amber-400 truncate">
                  {bout.roundName}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit Bout Button */}
                  <button
                    type="button"
                    onClick={() => handleStartEditBout(bout)}
                    className="p-1 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    title="Редактировать поединок"
                  >
                    <Edit2 size={13} />
                  </button>

                  {/* Delete Bout Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBout(bout.id)}
                    className="p-1 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    title="Удалить поединок"
                  >
                    <Trash2 size={13} />
                  </button>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    bout.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : bout.status === 'active'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                      : 'bg-stone-800 text-stone-400'
                  }`}>
                    {bout.status === 'completed' ? 'Завершён' : bout.status === 'active' ? 'Идёт бой!' : 'Ожидание'}
                  </span>
                </div>
              </div>

              {/* Matchup: Player 1 VS Player 2 */}
              <div className="grid grid-cols-5 items-center gap-1.5 py-1">
                
                {/* Player 1 */}
                <div className={`col-span-2 text-center p-1.5 rounded-xl border ${
                  bout.winnerParticipantId === bout.player1.participantId
                    ? 'bg-emerald-950/60 border-emerald-400 text-white'
                    : 'bg-stone-950/60 border-stone-800 text-stone-200'
                }`}>
                  <div className="relative inline-block">
                    <img
                      src={bout.player1.avatar}
                      alt={bout.player1.name}
                      className="w-10 h-10 rounded-full mx-auto object-cover border-2 border-amber-400"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs">🥋</span>
                  </div>
                  <div className="text-xs font-black truncate mt-1">
                    {bout.player1.nickname || bout.player1.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase truncate">
                    {f1.name}
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {bout.player1.score}
                  </div>
                </div>

                {/* VS Center Marker */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-black text-rose-500 uppercase tracking-widest block">VS</span>
                  <Swords size={16} className="mx-auto text-amber-400 my-0.5" />
                  {bout.finishType && (
                    <span className="text-[9px] font-black uppercase text-amber-300 bg-stone-950 px-1 py-0.5 rounded block truncate">
                      {bout.finishType}
                    </span>
                  )}
                </div>

                {/* Player 2 */}
                <div className={`col-span-2 text-center p-1.5 rounded-xl border ${
                  bout.winnerParticipantId === bout.player2.participantId
                    ? 'bg-emerald-950/60 border-emerald-400 text-white'
                    : 'bg-stone-950/60 border-stone-800 text-stone-200'
                }`}>
                  <div className="relative inline-block">
                    <img
                      src={bout.player2.avatar}
                      alt={bout.player2.name}
                      className="w-10 h-10 rounded-full mx-auto object-cover border-2 border-cyan-400"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs">🥋</span>
                  </div>
                  <div className="text-xs font-black truncate mt-1">
                    {bout.player2.nickname || bout.player2.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase truncate">
                    {f2.name}
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {bout.player2.score}
                  </div>
                </div>

              </div>

              {/* Prize & Bets Footer */}
              <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>Приз:</span>
                  <span className="font-black">🪙 {bout.coinPrize}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Bets counter / Place bet */}
                  {bout.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => setBetBoutId(bout.id)}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Ставки ({totalBets} 🪙)
                    </button>
                  )}

                  {/* Record Result Button */}
                  {bout.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBoutId(bout.id);
                        setFinishWinnerId(bout.player1.participantId);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-[11px] uppercase cursor-pointer"
                    >
                      Итог боя
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL: RECORD BOUT OUTCOME */}
      {selectedBout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white uppercase flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span>Фиксация победы в бою</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBoutId(null)}
                className="text-stone-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select Winner */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">Кто победил в поединке:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFinishWinnerId(selectedBout.player1.participantId)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    finishWinnerId === selectedBout.player1.participantId
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="text-xs font-black truncate">{selectedBout.player1.name}</div>
                  <div className="text-[10px] text-amber-400">Боец: {selectedBout.player1.fighterId}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFinishWinnerId(selectedBout.player2.participantId)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    finishWinnerId === selectedBout.player2.participantId
                      ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="text-xs font-black truncate">{selectedBout.player2.name}</div>
                  <div className="text-[10px] text-cyan-400">Боец: {selectedBout.player2.fighterId}</div>
                </button>
              </div>
            </div>

            {/* Score Setup */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-400 block mb-1">
                  Раунды {selectedBout.player1.name.split(' ')[0]}:
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={finishScoreP1}
                  onChange={(e) => setFinishScoreP1(Number(e.target.value))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-center text-white font-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-400 block mb-1">
                  Раунды {selectedBout.player2.name.split(' ')[0]}:
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={finishScoreP2}
                  onChange={(e) => setFinishScoreP2(Number(e.target.value))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-center text-white font-black"
                />
              </div>
            </div>

            {/* Finish Type (Fatality, Brutality, etc.) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">Тип добивания (Finish Him!):</label>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {(['fatality', 'brutality', 'friendship', 'babality', 'normal'] as FinishType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFinishType(type)}
                    className={`py-1.5 px-1 rounded-lg font-black uppercase text-center cursor-pointer ${
                      finishType === type
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBoutId(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleConfirmBoutResult}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black rounded-lg text-xs uppercase shadow-md cursor-pointer"
              >
                Наградить и завершить
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PLACE BET ON BOUT */}
      {betBoutId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white uppercase flex items-center gap-2">
                <span>🪙</span>
                <span>Ставка монетами на бойца</span>
              </h3>
              <button
                type="button"
                onClick={() => setBetBoutId(null)}
                className="text-stone-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300">На кого ставите:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBetPlayerChoice('p1')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                    betPlayerChoice === 'p1'
                      ? 'bg-amber-500 text-stone-950 border-yellow-300'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  Игрок 1
                </button>

                <button
                  type="button"
                  onClick={() => setBetPlayerChoice('p2')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                    betPlayerChoice === 'p2'
                      ? 'bg-amber-500 text-stone-950 border-yellow-300'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  Игрок 2
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Размер ставки (монет):</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-1.5 rounded-lg font-black text-xs cursor-pointer ${
                      betAmount === amt
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    🪙 {amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBetBoutId(null)}
                className="px-3 py-1.5 bg-stone-800 text-stone-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handlePlaceBet}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-xs uppercase cursor-pointer"
              >
                Поставить 🪙 {betAmount}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW TOURNAMENT BOUT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white uppercase flex items-center gap-2">
                <Swords size={16} className="text-amber-400" />
                <span>Назначить турнирный поединок</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Round Title */}
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Название раунда:</label>
              <input
                type="text"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="Например: 1/8 Финала, Бой за 3 место..."
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Fighters setup */}
            <div className="grid grid-cols-2 gap-3">
              {/* Player 1 */}
              <div className="space-y-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[11px] font-black uppercase text-amber-400">Игрок 1 (Соратник)</span>
                <select
                  value={newP1Id}
                  onChange={(e) => setNewP1Id(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.nickname || 'Участник'})</option>
                  ))}
                </select>

                <label className="text-[10px] text-stone-400 font-bold block">Персонаж MK:</label>
                <select
                  value={newP1Fighter}
                  onChange={(e) => setNewP1Fighter(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-amber-400"
                >
                  {MK_FIGHTERS.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.alias})</option>
                  ))}
                </select>
              </div>

              {/* Player 2 */}
              <div className="space-y-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[11px] font-black uppercase text-cyan-400">Игрок 2 (Соратник)</span>
                <select
                  value={newP2Id}
                  onChange={(e) => setNewP2Id(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.nickname || 'Участник'})</option>
                  ))}
                </select>

                <label className="text-[10px] text-stone-400 font-bold block">Персонаж MK:</label>
                <select
                  value={newP2Fighter}
                  onChange={(e) => setNewP2Fighter(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-cyan-400"
                >
                  {MK_FIGHTERS.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.alias})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coin Prize */}
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Призовой фонд победителю:</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 10].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNewPrize(amt)}
                    className={`flex-1 py-1.5 rounded-lg font-black text-xs cursor-pointer ${
                      newPrize === amt
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    🪙 {amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 bg-stone-800 text-stone-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleCreateBout}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-xs uppercase cursor-pointer"
              >
                Создать поединок
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: EDIT BOUT */}
      {editingBout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form onSubmit={handleSaveEditBout} className="bg-stone-900 border-2 border-amber-400 rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-4 my-8">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-black text-sm text-white uppercase flex items-center gap-2">
                <Edit2 size={16} className="text-amber-400" />
                <span>Редактировать поединок MK</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBout(null)}
                className="text-stone-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Round Title */}
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Название раунда:</label>
              <input
                type="text"
                required
                value={editRoundName}
                onChange={(e) => setEditRoundName(e.target.value)}
                placeholder="Например: 1/4 Финала, Финал..."
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Status & Prize */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Статус поединка:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2 text-xs text-white"
                >
                  <option value="pending">Ожидание (Pending)</option>
                  <option value="active">Идёт бой (Active)</option>
                  <option value="completed">Завершён (Completed)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Призовой фонд (монеты):</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={editPrize}
                  onChange={(e) => setEditPrize(Number(e.target.value))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2 text-xs text-white font-bold text-amber-400"
                />
              </div>
            </div>

            {/* Fighters & Scores */}
            <div className="grid grid-cols-2 gap-3">
              {/* Player 1 */}
              <div className="space-y-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[11px] font-black uppercase text-amber-400">Игрок 1</span>
                <select
                  value={editP1Id}
                  onChange={(e) => setEditP1Id(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.nickname})</option>
                  ))}
                </select>

                <select
                  value={editP1Fighter}
                  onChange={(e) => setEditP1Fighter(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-amber-400"
                >
                  {MK_FIGHTERS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Счёт раундов:</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editP1Score}
                    onChange={(e) => setEditP1Score(Number(e.target.value))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white font-bold text-center"
                  />
                </div>
              </div>

              {/* Player 2 */}
              <div className="space-y-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[11px] font-black uppercase text-cyan-400">Игрок 2</span>
                <select
                  value={editP2Id}
                  onChange={(e) => setEditP2Id(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.nickname})</option>
                  ))}
                </select>

                <select
                  value={editP2Fighter}
                  onChange={(e) => setEditP2Fighter(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-cyan-400"
                >
                  {MK_FIGHTERS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Счёт раундов:</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editP2Score}
                    onChange={(e) => setEditP2Score(Number(e.target.value))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-white font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Winner selection if completed */}
            {editStatus === 'completed' && (
              <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-500/50 space-y-2">
                <div className="text-xs font-bold text-amber-400">Победитель поединка:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditWinnerId(editP1Id)}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      editWinnerId === editP1Id
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    Победа Игрока 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditWinnerId(editP2Id)}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      editWinnerId === editP2Id
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    Победа Игрока 2
                  </button>
                </div>

                <div className="pt-1">
                  <label className="text-[10px] text-stone-400 block mb-1">Тип добивания (Finish Type):</label>
                  <select
                    value={editFinishType}
                    onChange={(e) => setEditFinishType(e.target.value as FinishType)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-xs text-amber-300 font-bold"
                  >
                    <option value="fatality">FATALITY</option>
                    <option value="brutality">BRUTALITY</option>
                    <option value="babality">BABALITY</option>
                    <option value="friendship">FRIENDSHIP</option>
                    <option value="flawless">FLAWLESS VICTORY</option>
                    <option value="decision">По очкам (Decision)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingBout(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-xs uppercase cursor-pointer shadow-md"
              >
                Сохранить изменения
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
