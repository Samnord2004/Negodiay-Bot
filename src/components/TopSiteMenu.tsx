import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, User, ChevronDown, LogOut, Lock, Cake, 
  BookOpen, Tent, CheckSquare, Coffee, Package, Trophy, 
  Image as ImageIcon, FolderArchive, Coins, Palette, Shield, 
  Edit3, Sparkles, MessageSquare, ExternalLink, ArrowRight
} from 'lucide-react';
import { Participant, ROLE_DEFINITIONS } from '../types';

interface TopSiteMenuProps {
  currentUser: Participant | null;
  activeTab: string;
  onNavigateTab: (tabId: string, subTab?: 'overview' | 'tasks' | 'menu') => void;
  onOpenProfileEdit: () => void;
  onOpenSecurity: () => void;
  onOpenBirthdays: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  pendingApprovalsCount?: number;
}

export default function TopSiteMenu({
  currentUser,
  activeTab,
  onNavigateTab,
  onOpenProfileEdit,
  onOpenSecurity,
  onOpenBirthdays,
  onOpenAuth,
  onLogout,
  pendingApprovalsCount = 0
}: TopSiteMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectNav = (tabId: string, subTab?: 'overview' | 'tasks' | 'menu') => {
    onNavigateTab(tabId, subTab);
    setIsOpen(false);
  };

  const roleMeta = currentUser?.role ? ROLE_DEFINITIONS[currentUser.role] : null;

  return (
    <div ref={menuRef} className="relative z-40">
      
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Главное меню сайта"
        className={`px-3.5 py-2 rounded-2xl border-2 font-black text-xs uppercase flex items-center gap-2 transition-all shadow-md active:scale-95 ${
          isOpen
            ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-lg'
            : 'bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 text-amber-950 border-amber-500'
        }`}
      >
        <Menu size={18} className={isOpen ? 'text-yellow-300' : 'text-red-700'} />
        <span className="tracking-tight">Меню сайта</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-yellow-300' : 'text-amber-800'}`} 
        />
        {pendingApprovalsCount > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white animate-ping" />
        )}
      </button>

      {/* DROPDOWN MENU PANEL */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[92vw] sm:w-[420px] max-w-[440px] bg-amber-50 border-4 border-amber-600 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh]">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-3.5 flex items-center justify-between text-yellow-300 border-b-2 border-amber-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧭</span>
              <h3 className="font-black text-xs uppercase tracking-tight text-white leading-tight">
                Навигация & Профиль негодяя
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-white hover:text-yellow-300 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 space-y-4 flex-1 scrollbar-thin">
            
            {/* 1. USER PROFILE SECTION */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                  <User size={13} /> Личный кабинет
                </span>
                {currentUser && roleMeta && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${roleMeta.color}`}>
                    {roleMeta.icon} {roleMeta.badge}
                  </span>
                )}
              </div>

              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-2xl border-2 border-amber-400 object-cover bg-amber-50 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-amber-950 truncate leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-xs font-bold text-red-600">
                        @{currentUser.nickname}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {currentUser.email || currentUser.phone || currentUser.psychotype || 'Участник команды'}
                      </div>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenProfileEdit();
                      }}
                      className="px-2.5 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-400 rounded-xl text-[11px] font-black text-amber-950 uppercase flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Edit3 size={13} className="text-red-700" />
                      <span>Личные данные</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSecurity();
                      }}
                      className="px-2.5 py-2 bg-yellow-100 hover:bg-yellow-200 border border-amber-400 rounded-xl text-[11px] font-black text-amber-950 uppercase flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Lock size={13} className="text-amber-800" />
                      <span>Безопасность</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-stone-600 font-medium">
                    Вы просматриваете сайт как гость. Авторизуйтесь для доступа к личным данным и взносам!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl border border-amber-950 shadow transition-all active:scale-95"
                  >
                    Войти в аккаунт банды
                  </button>
                </div>
              )}
            </div>

            {/* 2. PRIMARY SITE NAVIGATION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Разделы сайта
                </span>
                <span className="text-[10px] text-stone-400 font-bold">
                  быстрый переход
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                
                {/* 1: История */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('history')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'history'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={17} className={activeTab === 'history' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">История команды</div>
                      <div className={`text-[10px] ${activeTab === 'history' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Летопись с 2018 года, байки и фото-истории
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 2: Планируемые слёты (с подпунктами) */}
                <div className={`rounded-xl border-2 overflow-hidden transition-all ${
                  activeTab === 'home' ? 'border-red-600 bg-amber-100/60' : 'border-amber-200 bg-white'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleSelectNav('home', 'overview')}
                    className="w-full text-left p-2.5 flex items-center justify-between hover:bg-amber-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tent size={17} className="text-red-600" />
                      <div>
                        <div className="font-black text-xs uppercase text-amber-950 leading-tight">
                          Планируемые слёты
                        </div>
                        <div className="text-[10px] text-stone-500">
                          График походов, казна, задачи и меню
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      Главное
                    </span>
                  </button>

                  {/* Sub-links inside planned rallies */}
                  <div className="grid grid-cols-3 gap-1 px-2 pb-2 pt-0.5 border-t border-amber-200/80 bg-amber-50/50">
                    <button
                      type="button"
                      onClick={() => handleSelectNav('home', 'overview')}
                      className="py-1 px-1.5 bg-white hover:bg-amber-200 border border-amber-300 rounded-lg text-[10px] font-black text-amber-950 uppercase text-center transition-colors shadow-2xs"
                    >
                      🏕️ Обзор
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectNav('home', 'tasks')}
                      className="py-1 px-1.5 bg-white hover:bg-amber-200 border border-amber-300 rounded-lg text-[10px] font-black text-amber-950 uppercase text-center transition-colors shadow-2xs"
                    >
                      📋 Задачи
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectNav('home', 'menu')}
                      className="py-1 px-1.5 bg-white hover:bg-amber-200 border border-amber-300 rounded-lg text-[10px] font-black text-amber-950 uppercase text-center transition-colors shadow-2xs"
                    >
                      🍲 Меню
                    </button>
                  </div>
                </div>

                {/* 3: Инвентарь */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('inventory')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'inventory'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={17} className={activeTab === 'inventory' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Инвентарь</div>
                      <div className={`text-[10px] ${activeTab === 'inventory' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Общекомандное снаряжение и палатки
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 4: Конкурсы */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('contests')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'contests'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={17} className={activeTab === 'contests' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Конкурсы</div>
                      <div className={`text-[10px] ${activeTab === 'contests' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Ориентирование, визитки и схемы
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 5: Фотогалерея */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('gallery')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'gallery'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon size={17} className={activeTab === 'gallery' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Фотогалерея</div>
                      <div className={`text-[10px] ${activeTab === 'gallery' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Неограниченный архив кадров по годам
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 6: Документы */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('documents')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'documents'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderArchive size={17} className={activeTab === 'documents' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Документы</div>
                      <div className={`text-[10px] ${activeTab === 'documents' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Карты, положения и бланки
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 7: Фонд Негодяев */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('fund')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'fund'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Coins size={17} className={activeTab === 'fund' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Фонд Негодяев (500 ₽)</div>
                      <div className={`text-[10px] ${activeTab === 'fund' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Казна команды и контроль взносов
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 8: Творчество */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('creativity')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'creativity'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette size={17} className={activeTab === 'creativity' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight">Творчество</div>
                      <div className={`text-[10px] ${activeTab === 'creativity' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Идеи, конкурсы и креатив банды
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

                {/* 9: Админка */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('admin')}
                  className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-yellow-300 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-amber-950 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield size={17} className={activeTab === 'admin' ? 'text-yellow-300' : 'text-red-600'} />
                    <div>
                      <div className="font-black text-xs uppercase leading-tight flex items-center gap-2">
                        <span>Панель управления (Админка)</span>
                        {pendingApprovalsCount > 0 && (
                          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            +{pendingApprovalsCount}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] ${activeTab === 'admin' ? 'text-yellow-100' : 'text-stone-500'}`}>
                        Роли штаба, модерация, психотипы
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-60" />
                </button>

              </div>
            </div>

            {/* 3. QUICK UTILITY BUTTONS */}
            <div className="bg-amber-100/80 border-2 border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBirthdays();
                }}
                className="flex-1 py-2 px-2 bg-yellow-300 hover:bg-yellow-200 border border-amber-500 rounded-xl text-[11px] font-black text-amber-950 uppercase flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Cake size={14} className="text-red-600" />
                <span>Дни рождения</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSecurity();
                }}
                className="flex-1 py-2 px-2 bg-yellow-300 hover:bg-yellow-200 border border-amber-500 rounded-xl text-[11px] font-black text-amber-950 uppercase flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Lock size={14} className="text-red-600" />
                <span>Пароль / Доступ</span>
              </button>
            </div>

            {/* 4. LOGOUT ACTION */}
            {currentUser && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border-2 border-red-400 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
                >
                  <LogOut size={16} />
                  <span>Выйти с сайта</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
