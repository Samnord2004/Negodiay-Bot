import React from 'react';
import { Card } from '../../../types/poker';
import { SUIT_SYMBOLS, SUIT_COLORS, getCardValueSymbol } from '../../../utils/pokerEvaluator';

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
  const sizeClasses = {
    sm: 'w-8 h-12 text-[10px] rounded-md',
    md: 'w-12 h-18 sm:w-14 sm:h-20 text-xs sm:text-sm rounded-lg',
    lg: 'w-16 h-24 sm:w-20 sm:h-28 text-sm sm:text-base rounded-xl'
  };

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-red-900 via-rose-950 to-stone-950 border-2 border-amber-400/80 shadow-md flex items-center justify-center relative overflow-hidden select-none transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
      >
        <div className="absolute inset-1 border border-amber-400/40 rounded flex items-center justify-center">
          <div className="text-center">
            <span className="text-amber-400/90 text-sm font-black">⛺</span>
            <div className="text-[8px] font-black tracking-widest text-amber-300/80 uppercase mt-0.5">
              НЕГОДЯИ
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];
  const valueSymbol = getCardValueSymbol(card.value);

  return (
    <div
      className={`${sizeClasses[size]} bg-white border ${
        highlight
          ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-1 -translate-y-1'
          : 'border-stone-300'
      } shadow-md flex flex-col justify-between p-1 select-none font-bold transition-all duration-200 relative overflow-hidden ${className}`}
    >
      {/* Top Corner */}
      <div className={`flex items-center gap-0.5 leading-none ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
        <span className="font-black text-xs sm:text-sm">{valueSymbol}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center Figure / Suit */}
      <div className="flex-1 flex items-center justify-center">
        {card.value >= 11 && card.value <= 13 ? (
          <div className={`flex flex-col items-center ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
            <span className="text-sm sm:text-base font-black">
              {card.value === 11 ? '🏕️' : card.value === 12 ? '👑' : '🔥'}
            </span>
            <span className="text-[11px] sm:text-xs font-black">{symbol}</span>
          </div>
        ) : card.value === 14 ? (
          <div className={`text-base sm:text-xl font-black ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
            {symbol}
          </div>
        ) : (
          <div className={`text-sm sm:text-lg ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
            {symbol}
          </div>
        )}
      </div>

      {/* Bottom Corner (Upside down) */}
      <div className={`flex items-center gap-0.5 leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
        <span className="font-black text-xs sm:text-sm">{valueSymbol}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>
    </div>
  );
}
