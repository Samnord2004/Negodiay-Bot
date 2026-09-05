import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

interface NavigationTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}

export default function NavigationTabs({
  tabs,
  activeTab,
  onSelectTab
}: NavigationTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds
  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();

    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    
    // Also check on mutation/load
    const timer = setTimeout(checkScroll, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [tabs]);

  // Scroll active tab into view smoothly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -280 : 280;
    el.scrollBy({ left: distance, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  // Convert vertical wheel to horizontal scroll inside the tab bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className="relative bg-amber-100/95 border-t-2 border-amber-300 select-none shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center relative px-1 sm:px-2 py-1">
        
        {/* Left Scroll Chevron Button */}
        <div className="shrink-0 flex items-center pr-1 z-20">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Прокрутить вкладки влево"
            title="Прокрутить влево"
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border shadow-sm ${
              canScrollLeft
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500 cursor-pointer active:scale-90 hover:shadow-md'
                : 'bg-amber-200/50 text-amber-900/30 border-transparent cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft size={19} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Left gradient fade indicator */}
        {canScrollLeft && (
          <div className="absolute left-10 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-100 to-transparent pointer-events-none z-10" />
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={containerRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none py-1 px-1"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                data-tab-id={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shrink-0 whitespace-nowrap border-2 ${
                  isActive
                    ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-md transform scale-[1.02]'
                    : 'bg-white/60 hover:bg-white text-amber-950 border-amber-200/80 hover:border-amber-400 shadow-2xs'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-yellow-300' : 'text-red-600'} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-yellow-300 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right gradient fade indicator */}
        {canScrollRight && (
          <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-100 to-transparent pointer-events-none z-10" />
        )}

        {/* Right Scroll Chevron Button */}
        <div className="shrink-0 flex items-center pl-1 z-20">
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Прокрутить вкладки вправо"
            title="Прокрутить вправо"
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border shadow-sm ${
              canScrollRight
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500 cursor-pointer active:scale-90 hover:shadow-md'
                : 'bg-amber-200/50 text-amber-900/30 border-transparent cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight size={19} className="stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
