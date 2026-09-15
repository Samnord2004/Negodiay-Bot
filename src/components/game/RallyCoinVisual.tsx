import React, { useState } from 'react';
import { Sparkles, Flame, Tent, Mountain, RefreshCw } from 'lucide-react';
import { RallyCoin, Participant } from '../../types';
import { getParticipantAvatar } from '../../utils/avatar';

interface RallyCoinVisualProps {
  coin?: RallyCoin;
  participant?: Participant | { name: string; nickname?: string; avatar?: string; photoProfile?: string; gender?: string };
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  interactive?: boolean;
}

export default function RallyCoinVisual({
  coin,
  participant,
  size = 'md',
  showLabel = false,
  interactive = true
}: RallyCoinVisualProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Extract info
  const name = coin?.participantName || participant?.name || 'Негодяй';
  const nickname = coin?.participantNickname || (participant as any)?.nickname || name;
  const photoProfile = coin?.participantPhotoProfile || (participant as any)?.photoProfile;
  const avatarUrl = coin?.participantAvatar || getParticipantAvatar(participant as any);

  // Size dimensions
  const dimensions = {
    sm: { box: 'w-8 h-8', text: 'text-[7px]', inner: 'w-6 h-6', border: 'border-2' },
    md: { box: 'w-14 h-14', text: 'text-[9px]', inner: 'w-11 h-11', border: 'border-2' },
    lg: { box: 'w-28 h-28', text: 'text-xs', inner: 'w-22 h-22', border: 'border-4' },
    hero: { box: 'w-44 h-44', text: 'text-sm', inner: 'w-36 h-36', border: 'border-4' }
  }[size];

  const handleCoinClick = () => {
    if (!interactive) return;
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center select-none group">
      <div 
        onClick={handleCoinClick}
        title={interactive ? "Нажмите, чтобы перевернуть монетку Негодяя" : undefined}
        className={`relative ${dimensions.box} cursor-pointer perspective-[800px] transition-transform duration-300 hover:scale-105 active:scale-95`}
      >
        <div 
          className="w-full h-full relative duration-700 transition-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* FRONT SIDE (Лицевая сторона: Силуэт профиля участника) */}
          <div 
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Outer Coin Edge & Serrated Rim */}
            <div className="w-full h-full rounded-full border border-yellow-200/60 bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-800 p-1 flex items-center justify-center relative overflow-hidden shadow-inner">
              
              {/* Metallic Radial Sheen */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/40 via-transparent to-black/30 pointer-events-none" />
              
              {/* Beaded rim dots */}
              <div className="absolute inset-1 rounded-full border border-dashed border-amber-900/40 pointer-events-none" />

              {/* Inner Relief Center */}
              <div className={`rounded-full ${dimensions.inner} bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border border-amber-700/50 flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
                
                {/* Silhouette or Cameo Profile */}
                {photoProfile ? (
                  <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                    <img 
                      src={photoProfile} 
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale contrast-200 brightness-75 sepia hue-rotate-15 mix-blend-multiply scale-110"
                    />
                    <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay" />
                  </div>
                ) : avatarUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                    <img 
                      src={avatarUrl} 
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale contrast-150 brightness-90 sepia hue-rotate-15 mix-blend-multiply"
                    />
                    <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay" />
                  </div>
                ) : (
                  /* Stylized Cameo Profile Icon */
                  <div className="text-amber-950 font-black flex flex-col items-center justify-center leading-none">
                    <svg className="w-2/3 h-2/3 fill-amber-950/80 drop-shadow-xs" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                )}

                {/* Nickname Banner across the coin */}
                {(size === 'lg' || size === 'hero') && (
                  <div className="absolute bottom-1 bg-amber-950/75 px-1.5 py-0.5 rounded-full backdrop-blur-xs border border-amber-400/50 shadow-xs max-w-[85%] text-center">
                    <span className="text-[10px] font-black uppercase text-amber-200 tracking-wider truncate block">
                      {nickname}
                    </span>
                  </div>
                )}
              </div>

              {/* Embossed Text Around Border (Only for large / hero sizes) */}
              {(size === 'lg' || size === 'hero') && (
                <div className="absolute inset-0.5 rounded-full pointer-events-none flex items-center justify-center">
                  <span className="absolute top-0.5 text-[7px] font-black uppercase tracking-widest text-amber-950/80 drop-shadow-xs">
                    НЕГОДЯИ
                  </span>
                  <span className="absolute bottom-0.5 text-[6.5px] font-black uppercase tracking-wider text-amber-950/80 drop-shadow-xs">
                    СКИДКА НА СЛЁТ
                  </span>
                </div>
              )}

              {/* Sparkle badge */}
              <div className="absolute top-1 right-1 text-yellow-200 opacity-90 drop-shadow-xs">
                <Sparkles size={size === 'hero' ? 14 : size === 'lg' ? 10 : 7} />
              </div>
            </div>
          </div>

          {/* REVERSE SIDE (Оборотная сторона: Герб Негодяев, Костёр и Палатка) */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="w-full h-full rounded-full border border-yellow-200/60 bg-gradient-to-br from-yellow-500 via-amber-600 to-amber-900 p-1 flex flex-col items-center justify-center relative overflow-hidden shadow-inner text-amber-100">
              
              {/* Radial Metallic Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-black/30 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-0.5 text-amber-200 mb-0.5">
                  <Mountain size={size === 'hero' ? 24 : size === 'lg' ? 16 : 10} />
                  <Flame size={size === 'hero' ? 20 : size === 'lg' ? 14 : 9} className="text-amber-300 animate-pulse" />
                  <Tent size={size === 'hero' ? 22 : size === 'lg' ? 15 : 9} />
                </div>
                
                <span className={`font-black text-amber-100 tracking-tighter ${size === 'hero' ? 'text-2xl' : size === 'lg' ? 'text-lg' : 'text-[10px]'}`}>
                  1
                </span>
                <span className={`font-bold uppercase tracking-wider text-amber-200/90 ${size === 'hero' ? 'text-xs' : size === 'lg' ? 'text-[8px]' : 'text-[6px]'}`}>
                  МОНЕТА
                </span>
                
                {(size === 'lg' || size === 'hero') && (
                  <span className="text-[7px] font-bold text-amber-300/80 mt-1 uppercase tracking-widest border-t border-amber-500/40 pt-0.5">
                    СЛЁТ 2026
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="mt-1.5 text-center">
          <div className="text-xs font-black text-stone-900 leading-tight truncate max-w-[100px]">
            {nickname}
          </div>
          <div className="text-[10px] text-amber-700 font-bold flex items-center justify-center gap-0.5">
            <span>🪙 1 монета</span>
          </div>
        </div>
      )}

      {interactive && (size === 'lg' || size === 'hero') && (
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="mt-2 text-[10px] font-semibold text-stone-500 hover:text-amber-700 flex items-center gap-1 transition-colors bg-stone-100/80 hover:bg-amber-100/70 px-2 py-0.5 rounded-full"
        >
          <RefreshCw size={10} className={isFlipped ? 'rotate-180 transition-transform duration-500' : 'transition-transform duration-500'} />
          <span>{isFlipped ? 'Лицевая сторона' : 'Оборотная сторона'}</span>
        </button>
      )}
    </div>
  );
}
