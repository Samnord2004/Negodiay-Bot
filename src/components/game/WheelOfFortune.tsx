import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Trophy, Award, Clock, HelpCircle, 
  CheckCircle2, Flame, UserCheck, Volume2, VolumeX
} from 'lucide-react';
import { Participant, RallyCoin } from '../../types';
import { getParticipantAvatar } from '../../utils/avatar';
import { playWheelTickSound, playCelebrationFanfare, playCoinSound } from '../../utils/audioEffects';
import RallyCoinVisual from './RallyCoinVisual';

interface WheelOfFortuneProps {
  participants: Participant[];
  coins: RallyCoin[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onAwardCoin: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
}

// Palette for wheel slices
const SECTOR_COLORS = [
  '#DC2626', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EA580C', // Orange
  '#06B6D4', // Cyan
  '#65A30D', // Lime
  '#6366F1'  // Indigo
];

export default function WheelOfFortune({
  participants,
  coins,
  currentUser,
  isAdmin,
  onAwardCoin
}: WheelOfFortuneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Daily spin restriction for regular members
  const [lastSpinTime, setLastSpinTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`negodyai_last_spin_${currentUser?.id || 'guest'}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const activeParticipants = participants.filter(p => p.joined !== false && p.accountStatus !== 'rejected');

  // Count coins for each participant
  const coinsByParticipant = new Map<string, number>();
  activeParticipants.forEach(p => coinsByParticipant.set(p.id, 0));
  coins.forEach(c => {
    coinsByParticipant.set(c.participantId, (coinsByParticipant.get(c.participantId) || 0) + 1);
  });

  // Calculate weighted odds: the FEWER coins, the HIGHER the chance!
  // Formula: weight = Math.max(1, 20 - coinCount)
  const weightedParticipants = activeParticipants.map(p => {
    const coinCount = coinsByParticipant.get(p.id) || 0;
    const weight = Math.max(1, 20 - coinCount);
    return { participant: p, coinCount, weight };
  });

  const totalWeight = weightedParticipants.reduce((sum, item) => sum + item.weight, 0);

  // Time remaining until next free spin
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const timeSinceLastSpin = now - lastSpinTime;
  const canRegularSpin = timeSinceLastSpin >= TWENTY_FOUR_HOURS;
  const canSpin = isAdmin || canRegularSpin;

  const hoursRemaining = Math.max(0, Math.ceil((TWENTY_FOUR_HOURS - timeSinceLastSpin) / (1000 * 60 * 60)));

  // Draw the wheel onto the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeParticipants.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 14;
    const numSlices = activeParticipants.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer Decorative Golden Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    const ringGrad = ctx.createLinearGradient(0, 0, size, size);
    ringGrad.addColorStop(0, '#F59E0B');
    ringGrad.addColorStop(0.5, '#FDE68A');
    ringGrad.addColorStop(1, '#B45309');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 14;
    ctx.stroke();

    // Metallic dots on outer rim
    const totalDots = 24;
    for (let i = 0; i < totalDots; i++) {
      const dotAngle = (i * 2 * Math.PI) / totalDots;
      const dotX = center + (radius + 10) * Math.cos(dotAngle);
      const dotY = center + (radius + 10) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#FEF08A' : '#78350F';
      ctx.fill();
    }
    ctx.restore();

    // Slices
    activeParticipants.forEach((p, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Gradient slice
      const sliceGrad = ctx.createRadialGradient(center, center, 10, center, center, radius);
      sliceGrad.addColorStop(0, '#FFFFFF');
      sliceGrad.addColorStop(0.3, color);
      sliceGrad.addColorStop(1, color);
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text label inside slice
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 4;

      const label = p.nickname || p.name.split(' ')[0];
      ctx.fillText(label, radius - 26, 5);

      // Mini coin count indicator
      const count = coinsByParticipant.get(p.id) || 0;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = '#FEF08A';
      ctx.fillText(`🪙 ${count}`, radius - 26, 18);

      ctx.restore();
      ctx.restore();
    });

    // Center Cap (Gold Knob)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(center, center, 5, center, center, 32);
    centerGrad.addColorStop(0, '#FEF08A');
    centerGrad.addColorStop(0.6, '#F59E0B');
    centerGrad.addColorStop(1, '#92400E');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center star / icon
    ctx.fillStyle = '#451A03';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('★', center, center);
    ctx.restore();

  }, [activeParticipants, coins, coinsByParticipant]);

  // SPIN MECHANISM
  const handleSpin = () => {
    if (isSpinning || !canSpin || activeParticipants.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // 1. Pick winner with WEIGHTED RANDOM (fewer coins = higher chance!)
    let rand = Math.random() * totalWeight;
    let chosen = weightedParticipants[0].participant;
    for (const item of weightedParticipants) {
      if (rand < item.weight) {
        chosen = item.participant;
        break;
      }
      rand -= item.weight;
    }

    const winnerIndex = activeParticipants.findIndex(p => p.id === chosen.id);
    const numSlices = activeParticipants.length;
    const sliceDegrees = 360 / numSlices;

    // The pointer is at TOP (270 degrees in canvas space / standard angle)
    // Angle of sector center:
    const targetSectorCenter = winnerIndex * sliceDegrees + (sliceDegrees / 2);
    
    // We want this sector to end up at 270 deg (top):
    // Final wheel rotation mod 360 should make: (270 - targetSectorCenter)
    const baseTarget = (270 - targetSectorCenter + 360) % 360;

    // Add 6 to 8 full spins for exciting suspense
    const fullSpins = 360 * (6 + Math.floor(Math.random() * 2));
    const randomSubSliceJiggle = (Math.random() - 0.5) * (sliceDegrees * 0.7); // subtle offset within slice
    const totalRotation = rotation + fullSpins + baseTarget + randomSubSliceJiggle;

    setRotation(totalRotation);

    // Audio tick ticker simulation
    if (soundEnabled) {
      const interval = setInterval(() => {
        playWheelTickSound();
      }, 180);

      setTimeout(() => clearInterval(interval), 4000);
    }

    // Wheel stops after 5 seconds
    setTimeout(async () => {
      setIsSpinning(false);
      setWinner(chosen);
      setShowWinnerModal(true);

      if (soundEnabled) {
        playCelebrationFanfare();
        setTimeout(playCoinSound, 600);
      }

      // Record last spin time for non-admins
      const nowTime = Date.now();
      setLastSpinTime(nowTime);
      try {
        localStorage.setItem(`negodyai_last_spin_${currentUser?.id || 'guest'}`, nowTime.toString());
      } catch (e) {}

      // Automatically award coin to winner
      try {
        await onAwardCoin({
          participantId: chosen.id,
          participantName: chosen.name,
          participantNickname: chosen.nickname || chosen.name,
          taskTitle: "Удача Негодяя (Колесо Фортуны)",
          category: 'fortune',
          comment: "Счастливый сектор в ежедневном Колесе Фортуны команды!",
          awardedBy: "Колесо Фортуны"
        });
      } catch (e) {
        console.error("Failed to auto-award fortune coin:", e);
      }

    }, 5100);
  };

  // Recent fortune winners
  const fortuneCoins = coins.filter(c => c.category === 'fortune');

  return (
    <div className="space-y-8">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-7 border border-purple-900/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-yellow-300">
              🎡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-400">
                  Удача Негодяев
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  Поддержка отстающих участников
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Колесо Фортуны: случайная монетка слёта
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Честный алгоритм с весами: чем меньше у соратника монет, тем выше его вероятность выпадения!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-700"
              title={soundEnabled ? "Выключить звук" : "Включить звук"}
            >
              {soundEnabled ? <Volume2 size={15} className="text-amber-400" /> : <VolumeX size={15} />}
              <span>{soundEnabled ? 'Звук ВКЛ' : 'Звук ВЫКЛ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* WHEEL DISPLAY & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT / CENTER: THE WHEEL CANVAS CONTAINER (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-4 sm:p-8 bg-white border border-stone-200 rounded-3xl shadow-xs">
          
          {/* Wheel Pointer Triangle (Top Indicator) */}
          <div className="absolute top-2 sm:top-6 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-500 drop-shadow-md" />
            <div className="w-3 h-3 rounded-full bg-amber-200 border-2 border-amber-600 -mt-2 shadow-xs" />
          </div>

          {/* Rotating Canvas Wrapper */}
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="w-full h-full drop-shadow-xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5.1s cubic-bezier(0.15, 0.9, 0.25, 1.0)' : 'none'
              }}
            />
          </div>

          {/* SPIN ACTION BUTTON */}
          <div className="mt-6 flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || !canSpin}
              className={`px-8 py-4 rounded-2xl font-black text-base uppercase tracking-wider shadow-lg transition-all flex items-center gap-3 cursor-pointer ${
                isSpinning
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed scale-95'
                  : canSpin
                    ? 'bg-gradient-to-r from-purple-600 via-amber-500 to-yellow-500 hover:from-purple-700 hover:to-amber-600 text-white hover:scale-105 active:scale-95 shadow-amber-500/20'
                    : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Sparkles size={20} className={isSpinning ? 'animate-spin' : ''} />
              <span>
                {isSpinning 
                  ? 'Фортуна вращается...' 
                  : isAdmin 
                    ? 'Крутить колесо (Капитан)' 
                    : canRegularSpin 
                      ? 'Крутить колесо удачи!' 
                      : `Следующий спин через ${hoursRemaining} ч.`}
              </span>
            </button>

            {!isAdmin && !canRegularSpin && (
              <div className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                <span>Доступно 1 раз в 24 часа для поддержания баланса игры</span>
              </div>
            )}

            {isAdmin && (
              <div className="text-[11px] text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                👑 Капитанский режим: свободное вращение без ограничения таймера
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: WEIGHTS TABLE & TRANSPARENCY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <HelpCircle size={18} className="text-amber-500" />
                <span>Шансы и веса участников</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Честный баланс
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Чтобы соревнование оставалось интересным до самого слёта, Колесо Фортуны чаще выбирает участников с наименьшим числом монет.
            </p>

            <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 pr-1">
              {weightedParticipants
                .sort((a, b) => b.weight - a.weight)
                .map(({ participant: p, coinCount, weight }) => {
                  const chancePercent = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0';

                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={getParticipantAvatar(p)} 
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div className="truncate font-bold text-stone-900">
                          {p.nickname || p.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-stone-500 text-[11px]">
                          🪙 {coinCount}
                        </span>
                        <div className="text-right">
                          <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {chancePercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>

            <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-2xl border border-stone-200">
              💡 <strong>Правило:</strong> Победа в Колесе Фортуны автоматически чеканит золотую именную монету Негодяя в коллекцию победителя.
            </div>
          </div>

          {/* RECENT FORTUNE WINS */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-md space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span>🏆 Последние счастливчики колеса</span>
            </h4>

            {fortuneCoins.length === 0 ? (
              <div className="text-xs text-stone-400 italic py-2">
                Колесо Фортуны ещё ни разу не запускалось в этом сезоне
              </div>
            ) : (
              <div className="space-y-2">
                {fortuneCoins.slice(0, 4).map(c => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">🪙</span>
                      <span className="font-bold text-white">{c.participantName}</span>
                      <span className="text-stone-400 text-[10px]">({c.participantNickname})</span>
                    </div>
                    <span className="text-stone-400 text-[10px]">
                      {new Date(c.awardedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CELEBRATION WINNER MODAL */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-500/50 shadow-2xl text-center relative space-y-5 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="text-4xl animate-bounce">
              🎉 🪙 🎊
            </div>

            <div className="space-y-1">
              <span className="bg-amber-400 text-stone-950 text-xs font-black uppercase px-3 py-0.5 rounded-full">
                Удача Негодяев!
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Колесо Фортуны выбрало победителя!
              </h3>
              <p className="text-xs text-amber-300">
                Именная монета отчеканена и добавлена в личный кабинет
              </p>
            </div>

            {/* Winner Avatar and Minted Coin */}
            <div className="py-3 flex flex-col items-center justify-center">
              <RallyCoinVisual participant={winner} size="hero" interactive={true} />
              
              <div className="mt-3">
                <div className="text-xl font-black text-white">
                  {winner.name}
                </div>
                <div className="text-amber-300 font-bold text-sm">
                  «{winner.nickname || winner.name}»
                </div>
              </div>
            </div>

            <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 text-xs text-stone-300 space-y-1">
              <div className="font-bold text-white">
                +1 монета слёта в копилку!
              </div>
              <div>
                Поздравляем счастливчика! Каждый голос фортуны приближает соратника к главному призу — бесплатному участию в слёте!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWinnerModal(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-950 font-black rounded-xl text-sm uppercase tracking-wider shadow-md"
            >
              Отлично! В копилку братства
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
