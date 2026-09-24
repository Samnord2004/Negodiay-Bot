import React from 'react';
import { Card } from '../../../types/poker';
import { SUIT_SYMBOLS, getCardValueSymbol } from '../../../utils/pokerEvaluator';

interface PokerCardProps {
  key?: React.Key;
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  className?: string;
}

export default function PokerCard({
  card,
  faceDown = false,
  size = 'md',
  highlight = false,
  className = ''
}: PokerCardProps) {
  // Generous, high-visibility dimensions optimized for both desktop and mobile
  const sizeClasses = {
    sm: 'w-10 h-15 sm:w-12 sm:h-18 rounded-lg',
    md: 'w-13 h-19 sm:w-16 sm:h-23 rounded-xl',
    lg: 'w-18 h-26 sm:w-22 sm:h-32 rounded-2xl'
  };

  const cornerValueClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  };

  const cornerSuitClasses = {
    sm: 'text-[11px] sm:text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base'
  };

  const centerClasses = {
    sm: 'text-base sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-4xl'
  };

  // Face-down card back
  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-red-950 via-rose-900 to-stone-950 border-2 border-amber-400/90 shadow-lg flex items-center justify-center relative overflow-hidden select-none shrink-0 transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
      >
        <div className="absolute inset-1 border border-amber-400/40 rounded-md flex flex-col items-center justify-center bg-red-950/40">
          <span className="text-amber-400 text-sm sm:text-base font-black drop-shadow-sm">⛺</span>
          <div className="text-[7px] sm:text-[8px] font-black tracking-widest text-amber-300 uppercase leading-none mt-0.5">
            НЕГОДЯИ
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];
  const valueSymbol = getCardValueSymbol(card.value);

  // High-contrast color palette:
  // Hearts: vivid crimson, Diamonds: bright ruby red, Spades/Clubs: solid jet black
  const suitColor = isRed ? 'text-red-600' : 'text-stone-950';

  return (
    <div
      className={`${sizeClasses[size]} bg-white border-2 ${
        highlight
          ? 'border-yellow-400 ring-3 ring-yellow-400 ring-offset-1 -translate-y-1 shadow-xl'
          : 'border-stone-300/90 shadow-md hover:border-amber-400'
      } flex flex-col justify-between p-1 sm:p-1.5 select-none font-bold transition-all duration-200 relative overflow-hidden shrink-0 ${className}`}
    >
      {/* Top-Left Corner Index */}
      <div className={`flex flex-col items-center leading-none ${suitColor} shrink-0`}>
        <span className={`font-black tracking-tighter ${cornerValueClasses[size]}`}>
          {valueSymbol}
        </span>
        <span className={`font-black ${cornerSuitClasses[size]}`}>
          {symbol}
        </span>
      </div>

      {/* Center Figure: Crystal-clear, readable from any distance */}
      <div className="flex-1 flex flex-col items-center justify-center leading-none py-0.5">
        {card.value === 14 ? (
          // Ace: Big bold suit emblem with rank
          <div className={`flex flex-col items-center ${suitColor}`}>
            <span className={`${centerClasses[size]} font-black`}>{symbol}</span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mt-0.5">
              ТУЗ
            </span>
          </div>
        ) : card.value >= 11 && card.value <= 13 ? (
          // Face Cards: J, Q, K with clear rank letter and crown badge
          <div className={`flex flex-col items-center ${suitColor}`}>
            <div className="flex items-center gap-0.5">
              <span className={`${centerClasses[size]} font-black`}>{valueSymbol}</span>
              <span className="text-xs sm:text-sm">{card.value === 13 ? '👑' : card.value === 12 ? '👸' : '⚔️'}</span>
            </div>
            <span className={`text-xs sm:text-sm font-black ${suitColor}`}>{symbol}</span>
          </div>
        ) : (
          // Number Cards 2-10: Large clear rank and suit symbol
          <div className={`flex flex-col items-center ${suitColor}`}>
            <span className={`${centerClasses[size]} font-black`}>{symbol}</span>
          </div>
        )}
      </div>

      {/* Bottom-Right Corner Index (Rotated 180°) */}
      <div className={`flex flex-col items-center leading-none ${suitColor} self-end rotate-180 shrink-0`}>
        <span className={`font-black tracking-tighter ${cornerValueClasses[size]}`}>
          {valueSymbol}
        </span>
        <span className={`font-black ${cornerSuitClasses[size]}`}>
          {symbol}
        </span>
      </div>
    </div>
  );
}
