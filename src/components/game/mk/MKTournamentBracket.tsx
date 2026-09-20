import React, { useState } from 'react';
import { 
  Trophy, Flame, Swords, Shield, Award, 
  CheckCircle2, Plus, Sparkles, User, HelpCircle, ChevronRight
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
  // Sample initial tournament matches
  const [bouts, setBouts] = useState<MKBout[]>(() => {
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

    setBouts(prev => prev.map(b => {
      if (b.id !== selectedBout.id) return b;
      return {
        ...b,
        status: 'completed',
        winnerParticipantId: finishWinnerId,
        finishType,
        player1: { ...b.player1, score: finishScoreP1 },
        player2: { ...b.player2, score: finishScoreP2 }
      };
    }));

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

    setBouts(prev => prev.map(b => {
      if (b.id !== betBoutId) return b;
      return {
        ...b,
        bets: [...b.bets, newBet]
      };
    }));

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

    setBouts(prev => [newBout, ...prev]);
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

    </div>
  );
}
