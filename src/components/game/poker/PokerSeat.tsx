import React from 'react';
import { PokerPlayer, GameStage } from '../../../types/poker';
import PokerCard from './PokerCard';
import { User, Eye, EyeOff, UserPlus } from 'lucide-react';

interface PokerSeatProps {
  key?: React.Key;
  seatIndex: number;
  player: PokerPlayer | null;
  isCurrentTurn: boolean;
  isDealer: boolean;
  gameStage: GameStage;
  onSitDown: (seatIndex: number) => void;
  onStandUp?: (seatIndex: number) => void;
  isPeeked?: boolean;
  onTogglePeek?: (seatIndex: number) => void;
  showAllCardsOpen?: boolean;
  isCurrentUser?: boolean;
}

export default function PokerSeat({
  seatIndex,
  player,
  isCurrentTurn,
  isDealer,
  gameStage,
  onSitDown,
  onStandUp,
  isPeeked = false,
  onTogglePeek,
  showAllCardsOpen = false,
  isCurrentUser = false
}: PokerSeatProps) {
  // Free Seat state
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-0.5 sm:p-2">
        <button
          type="button"
          onClick={() => onSitDown(seatIndex)}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-dashed border-amber-400/80 bg-emerald-950/60 hover:bg-emerald-900/90 text-amber-300 hover:scale-105 shadow-md group flex flex-col items-center justify-center transition-all cursor-pointer"
          title={`Посадить соратника на место №${seatIndex + 1}`}
        >
          <UserPlus size={14} className="transition-transform group-hover:scale-110 text-amber-400 sm:w-4 sm:h-4" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase mt-0.5 tracking-tight">#{seatIndex + 1}</span>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold text-amber-300/80 uppercase mt-0.5">
          + Сесть
        </span>
      </div>
    );
  }

  const isShowdown = gameStage === 'showdown';
  const showCardsFaceUp = showAllCardsOpen || isShowdown || isPeeked || (isCurrentUser && !player.folded);
  const canStandUp = (gameStage === 'waiting' || gameStage === 'showdown') && !!onStandUp;

  return (
    <div className="relative flex flex-col items-center select-none group max-w-[100px] sm:max-w-[130px]">
      
      {/* Speech Bubble (Bluff / Banter / Reaction) */}
      {player.speechBubble && (
        <div className="absolute -top-9 sm:-top-10 z-30 animate-bounce bg-white text-stone-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded-2xl shadow-xl border-2 border-amber-400 text-[10px] sm:text-xs font-black whitespace-nowrap max-w-[150px] sm:max-w-[180px] truncate">
          <span>{player.speechBubble}</span>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b-2 border-r-2 border-amber-400 rotate-45" />
        </div>
      )}

      {/* Dealer Button */}
      {isDealer && (
        <div
          className="absolute -top-1.5 -left-1.5 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-stone-800 text-stone-950 font-black text-[10px] sm:text-xs flex items-center justify-center shadow-lg ring-1 ring-yellow-400"
          title="Кнопка дилера (Button)"
        >
          D
        </div>
      )}

      {/* Player Avatar & Info Capsule */}
      <div
        className={`relative flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
          isCurrentTurn
            ? 'bg-amber-400/95 border-yellow-200 text-stone-950 ring-2 sm:ring-4 ring-yellow-400/80 shadow-xl scale-105 z-20'
            : player.folded
            ? 'bg-stone-900/60 border-stone-700/60 text-stone-400 opacity-50'
            : isCurrentUser
            ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md'
            : 'bg-stone-900/85 border-stone-600/80 text-stone-200 shadow-sm'
        }`}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={player.avatar}
            alt={player.name}
            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover border ${
              isCurrentTurn
                ? 'border-stone-950 ring-1 ring-yellow-300'
                : isCurrentUser
                ? 'border-emerald-400'
                : 'border-stone-400'
            }`}
          />
          {isCurrentUser && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[7px] sm:text-[8px] font-black uppercase px-0.5 rounded-full border border-white">
              ВЫ
            </span>
          )}
        </div>

        {/* Player Name & Coins */}
        <div className="min-w-0 pr-0.5">
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] sm:text-xs font-black truncate max-w-[55px] sm:max-w-[85px]">
              {player.nickname || player.name.split(' ')[0]}
            </span>
          </div>

          {/* Real Coins count */}
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] sm:text-xs font-black flex items-center gap-0.5 ${
              isCurrentTurn ? 'text-stone-950' : 'text-amber-300'
            }`}>
              <span>🪙</span>
              <span>{player.chips}</span>
            </span>
          </div>
        </div>

        {/* Stand up button between hands */}
        {canStandUp && (
          <button
            type="button"
            onClick={() => onStandUp && onStandUp(seatIndex)}
            className="opacity-60 hover:opacity-100 transition-opacity ml-0.5 text-[9px] bg-stone-800/80 hover:bg-red-600 text-stone-300 hover:text-white font-black px-1 rounded cursor-pointer"
            title="Встать из-за стола"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hole Cards & Peek Toggle */}
      <div className="relative flex flex-col items-center mt-1.5 z-10">
        <div className="flex items-center -space-x-3 sm:-space-x-4">
          {player.cards.length === 2 && (
            <>
              <PokerCard
                card={player.cards[0]}
                faceDown={!showCardsFaceUp}
                size={isCurrentUser ? 'md' : 'sm'}
                highlight={isCurrentUser && !player.folded}
                className={`transform -rotate-4 hover:rotate-0 transition-all duration-200 ${player.folded ? 'opacity-40 grayscale' : ''}`}
              />
              <PokerCard
                card={player.cards[1]}
                faceDown={!showCardsFaceUp}
                size={isCurrentUser ? 'md' : 'sm'}
                highlight={isCurrentUser && !player.folded}
                className={`transform rotate-4 hover:rotate-0 transition-all duration-200 ${player.folded ? 'opacity-40 grayscale' : ''}`}
              />
            </>
          )}
        </div>

        {/* Peek button for live players */}
        {player.cards.length === 2 && !player.folded && !showAllCardsOpen && !isShowdown && onTogglePeek && (
          <button
            type="button"
            onClick={() => onTogglePeek(seatIndex)}
            className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-950/80 hover:bg-stone-800 text-[9px] font-bold text-stone-300 border border-stone-700 cursor-pointer transition-colors shadow-xs"
            title={isPeeked ? "Скрыть карты" : "Подсмотреть карты"}
          >
            {isPeeked ? <EyeOff size={10} /> : <Eye size={10} />}
            <span>{isPeeked ? "Скрыть" : "Глянуть"}</span>
          </button>
        )}
      </div>

      {/* Last Action Badge */}
      {player.lastAction && (
        <div className="mt-1">
          <span
            className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm ${
              player.lastAction.type === 'fold'
                ? 'bg-stone-800 text-stone-400 border-stone-600'
                : player.lastAction.type === 'check'
                ? 'bg-blue-900/90 text-blue-200 border-blue-400'
                : player.lastAction.type === 'all_in'
                ? 'bg-red-600 text-white border-red-300 animate-pulse ring-2 ring-red-400'
                : player.lastAction.type === 'raise' || player.lastAction.type === 'bet'
                ? 'bg-amber-500 text-stone-950 border-amber-300 ring-1 ring-yellow-400'
                : 'bg-emerald-700 text-emerald-100 border-emerald-400'
            }`}
          >
            {player.lastAction.text}
          </span>
        </div>
      )}

      {/* Current Round Bet Chip on Felt */}
      {player.currentRoundBet > 0 && (
        <div className="mt-1 flex items-center gap-1 bg-stone-950/85 border border-amber-400/90 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg">
          <span>🪙</span>
          <span>+{player.currentRoundBet}</span>
        </div>
      )}

    </div>
  );
}
