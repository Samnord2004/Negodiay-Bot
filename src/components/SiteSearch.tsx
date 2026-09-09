import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, User, ArrowRight, CheckCircle2, AlertTriangle, 
  Coins, CheckSquare, Trophy, FolderArchive, Package, Coffee, 
  Sparkles, Compass, Shield, Cake, Palette, BookOpen, 
  Calendar, Clock, ExternalLink, HelpCircle, Eye, ChevronRight, Trash2
} from 'lucide-react';
import { 
  Participant, TaskItem, Contest, TeamDocument, InventoryItem, 
  MenuItem, GroceryItem, CreativityIdea, FundRecord, TeamStory, 
  ROLE_DEFINITIONS 
} from '../types';
import { PSYCHOTYPES } from '../mockData';
import { getSafeAvatar, getParticipantAvatar } from '../utils/avatar';
import DeleteParticipantModal from './DeleteParticipantModal';

interface SiteSearchProps {
  participants: Participant[];
  tasks: TaskItem[];
  contests: Contest[];
  documents: TeamDocument[];
  inventoryItems: InventoryItem[];
  menuItems: MenuItem[];
  groceryItems: GroceryItem[];
  creativityIdeas: CreativityIdea[];
  fundRecords: FundRecord[];
  stories: TeamStory[];
  currentUser: Participant | null;
  onNavigateTab: (tabId: string, subTab?: 'overview' | 'tasks' | 'menu' | 'contests' | 'creativity') => void;
  onOpenBirthdays: () => void;
  onOpenProfileEdit: () => void;
  onOpenAppearance?: () => void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
}

// Site Sections with Keywords and Synonyms
interface SectionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  tabId: string;
  subTab?: 'overview' | 'tasks' | 'menu' | 'contests' | 'creativity';
  icon: any;
  badge?: string;
  customAction?: 'birthdays' | 'appearance';
}

const SITE_SECTIONS: SectionItem[] = [
  {
    id: 'sec_history',
    title: 'Реестр негодяев и история команды',
    category: 'Команда',
    description: 'Полный список участников, архив слётов с 1993 года, герои костра и традиции',
    keywords: ['реестр негодяев', 'реестр', 'состав', 'участники', 'негодяи', 'список', 'команда', 'братство', 'база', 'история', 'герои', 'традиции'],
    tabId: 'history',
    icon: BookOpen,
    badge: 'Главная база'
  },
  {
    id: 'sec_docs',
    title: 'Документы и Устав команды',
    category: 'Документы',
    description: 'Устав Негодяев, Кодекс чести костра, положение о фонде, методичка по узлам и знакам',
    keywords: ['документы', 'документ', 'устав', 'положение', 'кодекс', 'правила', 'регламент', 'инструкции', 'чек-лист', 'памятка', 'узлы', 'знаки', 'файлы'],
    tabId: 'documents',
    icon: FolderArchive,
    badge: 'Документация'
  },
  {
    id: 'sec_rallies',
    title: 'Планируемые слёты и программа',
    category: 'Слёты',
    description: 'Главный ежегодный лесной сбор Негодяев 2026, сплавы, карта лагеря и регламент',
    keywords: ['слёты', 'слёт', 'ралли', 'лагерь', 'программа', 'сбор', 'выезд', '2026', 'палатки', 'поляна', 'расписание'],
    tabId: 'home',
    subTab: 'overview',
    icon: Compass,
    badge: 'Слёт 2026'
  },
  {
    id: 'sec_tasks',
    title: 'Чек-лист задач и подготовка',
    category: 'Слёты',
    description: 'Список дел к слёту: ремонт генератора, закупки, палатки, дедлайны и ответственные',
    keywords: ['задачи', 'задача', 'дела', 'поручения', 'чек-лист', 'подготовка', 'план', 'дедлайны', 'генератор'],
    tabId: 'home',
    subTab: 'tasks',
    icon: CheckSquare,
    badge: 'Задачи'
  },
  {
    id: 'sec_menu',
    title: 'Полевая кухня и раскладка продуктов',
    category: 'Слёты',
    description: 'Коронный узбекский плов, суп из тушенки, раскладка по дням и список закупок',
    keywords: ['меню', 'продукты', 'раскладка', 'кухня', 'еда', 'плов', 'суп', 'овсянка', 'тушенка', 'повар', 'закупки', 'зиры', 'курдюк'],
    tabId: 'home',
    subTab: 'menu',
    icon: Coffee,
    badge: 'Кухня'
  },
  {
    id: 'sec_contests',
    title: 'Конкурсы программы слёта',
    category: 'Слёты',
    description: 'Спортивное ориентирование, вязка узлов, кулинарный баттл и музыкальный ринг',
    keywords: ['конкурсы', 'конкурс', 'соревнования', 'состязания', 'волейбол', 'ориентирование', 'узлы', 'баттл', 'призы', 'кубок'],
    tabId: 'home',
    subTab: 'contests',
    icon: Trophy,
    badge: 'Конкурсы'
  },
  {
    id: 'sec_creativity',
    title: 'Творчество, карнавал и оформление лагеря',
    category: 'Слёты',
    description: 'Конкурс лагерей, карнавальные костюмы, клубный мерч и голосование за идеи',
    keywords: ['творчество', 'карнавал', 'костюмы', 'идеи', 'оформление лагеря', 'песни', 'гимн', 'мерч', 'голосование', 'ворота'],
    tabId: 'home',
    subTab: 'creativity',
    icon: Sparkles,
    badge: 'Творчество'
  },
  {
    id: 'sec_inventory',
    title: 'Инвентарь и снаряжение команды',
    category: 'Снаряжение',
    description: 'Казаны, бензогенератор, шатры, пилы, топоры и проверка состояния вещей',
    keywords: ['инвентарь', 'снаряжение', 'палатки', 'генератор', 'казан', 'пила', 'топор', 'тент', 'склад', 'вещи', 'состояние'],
    tabId: 'inventory',
    icon: Package,
    badge: 'Склад'
  },
  {
    id: 'sec_gallery',
    title: 'Фотогалерея команды',
    category: 'Медиа',
    description: 'Исторические фотографии слётов, сплавов, костров и карнавалов разных лет',
    keywords: ['фотогалерея', 'фото', 'фотографии', 'снимки', 'альбомы', 'кадры', 'воспоминания'],
    tabId: 'gallery',
    icon: FolderArchive,
    badge: 'Архив фото'
  },
  {
    id: 'sec_fund',
    title: 'Фонд Негодяев и Казначейство',
    category: 'Финансы',
    description: 'Ежемесячный взнос 500 рублей, смета слёта, ведомость оплат и баланс казны',
    keywords: ['фонд негодяев', 'фонд', 'казна', 'взносы', 'взнос', '500 рублей', 'казначей', 'бюджет', 'смета', 'долги', 'баланс', 'сколько должен'],
    tabId: 'fund',
    icon: Coins,
    badge: 'Казна 500 ₽'
  },
  {
    id: 'sec_admin',
    title: 'Штаб Капитана и Управление',
    category: 'Управление',
    description: 'Заявки новичков, назначение ролей Негодяев, пароли и администрирование',
    keywords: ['штаб капитана', 'штаб', 'капитан', 'админка', 'панель управления', 'заявки', 'роли', 'пароли', 'одобрение'],
    tabId: 'admin',
    icon: Shield,
    badge: 'Штаб'
  },
  {
    id: 'sec_birthdays',
    title: 'Ежедневник дней рождений',
    category: 'Календарь',
    description: 'Календарь именинников команды, ближайшие юбилеи и поздравления',
    keywords: ['дни рождения', 'день рождения', 'именинники', 'днюхи', 'поздравления', 'календарь', 'возраст', 'праздник'],
    tabId: 'history',
    icon: Cake,
    badge: 'Праздники',
    customAction: 'birthdays'
  }
];

export default function SiteSearch({
  participants,
  tasks,
  contests,
  documents,
  inventoryItems,
  menuItems,
  groceryItems,
  creativityIdeas,
  fundRecords,
  currentUser,
  onNavigateTab,
  onOpenBirthdays,
  onOpenProfileEdit,
  onOpenAppearance,
  onDeleteUser
}: SiteSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'people' | 'sections' | 'tasks' | 'docs'>('all');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global hotkey: Ctrl+K, Cmd+K, or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedParticipant(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  // 1. PARTICIPANTS MATCHING & DOSSIER COMPUTATION
  const matchingParticipants = useMemo(() => {
    if (!cleanQuery) return [];

    const isSelfQuery = ['я', 'мой', 'мои данные', 'мои долги', 'мои задачи', 'моя роль', 'мои голосования', 'себе'].includes(cleanQuery);

    return participants.filter(p => {
      if (isSelfQuery && currentUser && p.id === currentUser.id) return true;

      const nameMatch = p.name.toLowerCase().includes(cleanQuery);
      const nickMatch = (p.nickname || '').toLowerCase().includes(cleanQuery);
      const emailMatch = (p.email || '').toLowerCase().includes(cleanQuery);
      const phoneMatch = (p.phone || '').toLowerCase().includes(cleanQuery);
      const roleMatch = (p.role && ROLE_DEFINITIONS[p.role]?.title.toLowerCase().includes(cleanQuery));

      // Also match individual words in query
      const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
      const wordsMatch = queryWords.length > 1 && queryWords.every(w => 
        p.name.toLowerCase().includes(w) || (p.nickname || '').toLowerCase().includes(w)
      );

      return nameMatch || nickMatch || emailMatch || phoneMatch || roleMatch || wordsMatch;
    }).map(p => {
      // Calculate financial debts
      const totalCost = p.totalCost || 8500;
      const paidAmount = p.paidAmount || 0;
      const debtAmount = Math.max(0, totalCost - paidAmount);
      const isRallyPaid = debtAmount === 0;

      // Calculate fund 500r payments for 2026
      const currentYear = new Date().getFullYear();
      const userFund = fundRecords.filter(f => (f.participantId === p.id || f.participantName === p.name) && f.year === currentYear);
      const paidMonths = userFund.filter(f => f.isPaid);
      const fundPaidMonthsCount = paidMonths.length;

      // Calculate task responsibilities
      const pTasks = tasks.filter(t => 
        t.assigneeId === p.id || 
        (p.name && t.assigneeName.toLowerCase().includes(p.name.toLowerCase())) ||
        (p.nickname && t.assigneeName.toLowerCase().includes(p.nickname.toLowerCase()))
      );
      const pendingTasks = pTasks.filter(t => !t.isCompleted);
      const completedTasks = pTasks.filter(t => t.isCompleted);

      // Inventory responsibility
      const pInventory = inventoryItems.filter(i => 
        (p.name && i.responsibleName.toLowerCase().includes(p.name.toLowerCase())) ||
        (p.nickname && i.responsibleName.toLowerCase().includes(p.nickname.toLowerCase()))
      );

      // Grocery responsibility
      const pGroceries = groceryItems.filter(g => 
        (p.name && g.responsibleName?.toLowerCase().includes(p.name.toLowerCase())) ||
        (p.nickname && g.responsibleName?.toLowerCase().includes(p.nickname.toLowerCase()))
      );

      // Contest participations (Captain or team member)
      const captainContests = contests.filter(c => c.captainId === p.id);
      const memberContests = contests.filter(c => c.teamMemberIds?.includes(p.id) && c.captainId !== p.id);

      // Creativity ideas (Voted or Authored)
      const votedIdeas = creativityIdeas.filter(idea => idea.votedUserIds?.includes(p.id));
      const authoredIdeas = creativityIdeas.filter(idea => idea.authorId === p.id);

      // Role info
      const roleInfo = p.role ? ROLE_DEFINITIONS[p.role] : ROLE_DEFINITIONS.member;
      const psychotypeMeta = PSYCHOTYPES.find(pt => pt.name === p.psychotype);

      return {
        participant: p,
        totalCost,
        paidAmount,
        debtAmount,
        isRallyPaid,
        fundPaidMonthsCount,
        pTasks,
        pendingTasks,
        completedTasks,
        pInventory,
        pGroceries,
        captainContests,
        memberContests,
        votedIdeas,
        authoredIdeas,
        roleInfo,
        psychotypeMeta
      };
    });
  }, [cleanQuery, participants, tasks, contests, creativityIdeas, fundRecords, inventoryItems, groceryItems, currentUser]);

  // 2. SECTIONS & KEYWORDS MATCHING
  const matchingSections = useMemo(() => {
    if (!cleanQuery || cleanQuery.length < 2) return [];

    return SITE_SECTIONS.filter(sec => {
      const titleMatch = sec.title.toLowerCase().includes(cleanQuery);
      const descMatch = sec.description.toLowerCase().includes(cleanQuery);
      const keyMatch = sec.keywords.some(k => k.includes(cleanQuery) || cleanQuery.includes(k));
      return titleMatch || descMatch || keyMatch;
    });
  }, [cleanQuery]);

  // 3. DOCUMENTS MATCHING
  const matchingDocuments = useMemo(() => {
    if (!cleanQuery || cleanQuery.length < 2) return [];
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(cleanQuery) ||
      doc.description.toLowerCase().includes(cleanQuery) ||
      (doc.content && doc.content.toLowerCase().includes(cleanQuery)) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(cleanQuery))
    ).slice(0, 4);
  }, [cleanQuery, documents]);

  // 4. TASKS MATCHING
  const matchingTasks = useMemo(() => {
    if (!cleanQuery || cleanQuery.length < 2) return [];
    return tasks.filter(t => 
      t.title.toLowerCase().includes(cleanQuery) ||
      t.assigneeName.toLowerCase().includes(cleanQuery)
    ).slice(0, 5);
  }, [cleanQuery, tasks]);

  // 5. CONTESTS MATCHING
  const matchingContests = useMemo(() => {
    if (!cleanQuery || cleanQuery.length < 2) return [];
    return contests.filter(c => 
      c.title.toLowerCase().includes(cleanQuery) ||
      c.captainName.toLowerCase().includes(cleanQuery) ||
      (c.description && c.description.toLowerCase().includes(cleanQuery))
    ).slice(0, 4);
  }, [cleanQuery, contests]);

  // Total results count
  const totalResultsCount = matchingParticipants.length + matchingSections.length + matchingDocuments.length + matchingTasks.length + matchingContests.length;

  const handleSelectSection = (sec: SectionItem) => {
    setIsOpen(false);
    setQuery('');
    if (sec.customAction === 'birthdays') {
      onOpenBirthdays();
    } else {
      onNavigateTab(sec.tabId, sec.subTab);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      
      {/* SEARCH INPUT BAR IN GLOBAL HEADER */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 text-amber-800/80 pointer-events-none flex items-center">
          <Search size={16} className={isOpen ? 'text-red-600' : 'text-amber-800'} />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Поиск по сайту (участники, долги, задачи, документы...)"
          className="w-full pl-9 pr-16 py-2 bg-amber-50/95 hover:bg-white focus:bg-white text-amber-950 font-bold text-xs sm:text-sm border border-amber-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-xs placeholder:text-amber-800/60 focus:outline-none transition-all duration-150"
        />

        {/* Clear Button / Hotkey indicator */}
        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-1 text-amber-800 hover:text-red-700 hover:bg-amber-200/60 rounded-md transition-colors"
              title="Очистить поиск"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-200/60 border border-amber-300 rounded-md select-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* DROPDOWN SEARCH RESULTS PANEL */}
      {isOpen && (
        <>
          {/* Semi-transparent click-outside backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/25 backdrop-blur-2xs z-40 transition-opacity animate-in fade-in duration-100"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] sm:w-[560px] md:w-[640px] max-w-2xl mt-2.5 bg-white border-2 border-amber-400 rounded-3xl shadow-2xl z-50 overflow-hidden max-h-[min(78vh,640px)] flex flex-col ring-1 ring-black/10 animate-in fade-in zoom-in-98 slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header Bar of Search Results */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-4 py-3 flex items-center justify-between text-amber-100 border-b border-amber-800/60 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="bg-red-600 text-yellow-300 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide shadow-xs shrink-0">
                  Поиск
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                    {cleanQuery ? `Результаты: «${query}»` : 'Поиск по базе команды «Негодяи»'}
                  </h4>
                  <p className="text-[10px] text-amber-300/80 truncate">
                    {cleanQuery 
                      ? `Найдено записей: ${totalResultsCount}` 
                      : 'Участники, баланс взносов, задачи, документы, конкурсы'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2 shrink-0"
                title="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Filter Tabs */}
            {cleanQuery && totalResultsCount > 0 && (
              <div className="bg-amber-50/90 px-3 py-1.5 border-b border-amber-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold shrink-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'all' ? 'bg-red-600 text-white font-black shadow-xs' : 'text-amber-950 hover:bg-amber-200/60'}`}
                >
                  Все ({totalResultsCount})
                </button>
                {matchingParticipants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('people')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'people' ? 'bg-red-600 text-white font-black shadow-xs' : 'text-amber-950 hover:bg-amber-200/60'}`}
                  >
                    Участники ({matchingParticipants.length})
                  </button>
                )}
                {matchingSections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('sections')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'sections' ? 'bg-red-600 text-white font-black shadow-xs' : 'text-amber-950 hover:bg-amber-200/60'}`}
                  >
                    Разделы ({matchingSections.length})
                  </button>
                )}
                {matchingTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('tasks')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'tasks' ? 'bg-red-600 text-white font-black shadow-xs' : 'text-amber-950 hover:bg-amber-200/60'}`}
                  >
                    Задачи ({matchingTasks.length})
                  </button>
                )}
                {matchingDocuments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('docs')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'docs' ? 'bg-red-600 text-white font-black shadow-xs' : 'text-amber-950 hover:bg-amber-200/60'}`}
                  >
                    Документы ({matchingDocuments.length})
                  </button>
                )}
              </div>
            )}

            {/* Body Content of Search Results */}
            <div className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1 scrollbar-thin">
              
              {/* CLEAN EMPTY STATE - NO PRE-POPULATED QUICK QUERIES */}
              {!cleanQuery && (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-red-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                    <Search size={22} />
                  </div>
                  <p className="font-black text-sm text-stone-900 uppercase tracking-tight">
                    Поиск по всей базе туристической команды
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    Начните вводить имя участника, позывной, задачу слёта, название документа, пункт меню или конкурс
                  </p>
                </div>
              )}

            {/* 1. PARTICIPANTS DOSSIER SECTION */}
            {(viewMode === 'all' || viewMode === 'people') && matchingParticipants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-red-600" />
                    <span>Личное досье участника ({matchingParticipants.length}):</span>
                  </h5>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    Долги • Роли • Задачи • Голосования
                  </span>
                </div>

                <div className="space-y-3">
                  {matchingParticipants.map(({
                    participant: p,
                    totalCost,
                    paidAmount,
                    debtAmount,
                    isRallyPaid,
                    fundPaidMonthsCount,
                    pTasks,
                    pendingTasks,
                    captainContests,
                    memberContests,
                    votedIdeas,
                    authoredIdeas,
                    roleInfo,
                    psychotypeMeta,
                    pInventory,
                    pGroceries
                  }) => {
                    const avatarUrl = getParticipantAvatar(p);
                    const totalVotingsCount = captainContests.length + memberContests.length + votedIdeas.length + authoredIdeas.length;

                    return (
                      <div
                        key={p.id}
                        className="bg-stone-50/60 hover:bg-amber-50/50 border border-amber-200 hover:border-amber-300 rounded-xl p-3 sm:p-4 shadow-xs transition-all space-y-3"
                      >
                        {/* Top: Participant Header Card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarUrl}
                              alt={p.name}
                              className="w-11 h-11 rounded-xl border border-amber-300 object-cover shadow-xs bg-amber-100"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm sm:text-base text-amber-950 uppercase tracking-tight">
                                  {p.name}
                                </h4>
                                {p.nickname && (
                                  <span className="bg-red-600 text-yellow-300 text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-950/20">
                                    @{p.nickname}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.color}`}>
                                  {roleInfo.icon} {roleInfo.title}
                                </span>
                                {p.psychotype && (
                                  <span className="text-[10px] font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                    {psychotypeMeta?.emoji || '🎭'} {p.psychotype}
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500">
                                  В банде с {p.joinedYear || 1993}г
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedParticipant(p)}
                              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-lg border border-amber-300 shadow-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Eye size={13} />
                              <span>Развернуть досье</span>
                            </button>
                          </div>
                        </div>

                        {/* 4 CORE DOSSIER BLOCKS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                          
                          {/* 1. СКОЛЬКО ДОЛЖЕН */}
                          <div className={`p-2.5 rounded-xl border bg-white ${
                            isRallyPaid ? 'border-emerald-300' : 'border-red-300'
                          }`}>
                            <div className="flex items-center justify-between font-bold text-[11px] mb-1.5">
                              <span className="flex items-center gap-1.5 text-amber-950">
                                <Coins size={14} className={isRallyPaid ? 'text-emerald-600' : 'text-red-600'} />
                                <span>Сколько должен:</span>
                              </span>
                              {isRallyPaid ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[10px]">
                                  Взнос сдан полностью ✅
                                </span>
                              ) : (
                                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 font-bold text-[10px]">
                                  Долг: {debtAmount.toLocaleString('ru-RU')} ₽ ⚠️
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 font-medium text-stone-700 text-[11px]">
                              <div className="flex justify-between">
                                <span>Смета слёта 2026:</span>
                                <span className="font-bold text-stone-900">{totalCost.toLocaleString('ru-RU')} ₽</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Сдано в кассу:</span>
                                <span className={`font-bold ${isRallyPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                                  {paidAmount.toLocaleString('ru-RU')} ₽
                                </span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-amber-100 text-[10px]">
                                <span>Фонд Негодяев (500 ₽/мес):</span>
                                <span className="text-emerald-700 font-bold">Оплачено {fundPaidMonthsCount} мес. за 2026г</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                onNavigateTab('fund');
                              }}
                              className="mt-2 text-[10px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline"
                            >
                              <span>Ведомость взносов и фонд</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>

                          {/* 2. ЗА КАКИЕ ЗАДАЧИ ОТВЕЧАЕТ */}
                          <div className="p-2.5 rounded-xl border border-amber-200 bg-white">
                            <div className="flex items-center justify-between font-bold text-[11px] mb-1.5 text-amber-950">
                              <span className="flex items-center gap-1.5">
                                <CheckSquare size={14} className="text-red-600" />
                                <span>Задачи и ответственность:</span>
                              </span>
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                {pendingTasks.length} в работе / {pTasks.length} всего
                              </span>
                            </div>

                            {pTasks.length > 0 ? (
                              <div className="space-y-1">
                                {pTasks.slice(0, 2).map(task => (
                                  <div key={task.id} className="flex items-start gap-1.5 text-[11px] leading-tight">
                                    {task.isCompleted ? (
                                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <Clock size={13} className="text-amber-600 shrink-0 mt-0.5" />
                                    )}
                                    <span className={task.isCompleted ? 'line-through text-stone-400' : 'font-medium text-stone-900 truncate'}>
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                                {pTasks.length > 2 && (
                                  <div className="text-[10px] text-stone-500">
                                    + ещё {pTasks.length - 2} задач(и)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-stone-500 italic">
                                Персональных задач не назначено.
                              </p>
                            )}

                            {(pInventory.length > 0 || pGroceries.length > 0) && (
                              <div className="mt-1 pt-1 border-t border-amber-100 text-[10px] text-stone-600 flex items-center gap-1 flex-wrap">
                                <span>📦 Имущество:</span>
                                {pInventory.map(i => (
                                  <span key={i.id} className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    {i.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                onNavigateTab('home', 'tasks');
                              }}
                              className="mt-2 text-[10px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline"
                            >
                              <span>Чек-лист всех задач</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>

                          {/* 3. В КАКИХ ГОЛОСОВАНИЯХ УЧАСТВУЕТ */}
                          <div className="p-2.5 rounded-xl border border-amber-200 bg-white">
                            <div className="flex items-center justify-between font-bold text-[11px] mb-1.5 text-amber-950">
                              <span className="flex items-center gap-1.5">
                                <Trophy size={14} className="text-red-600" />
                                <span>Голосования и конкурсы:</span>
                              </span>
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                {totalVotingsCount} участий
                              </span>
                            </div>

                            <div className="space-y-1 text-[11px] text-stone-700">
                              {captainContests.length > 0 && (
                                <div className="flex items-center gap-1 text-red-700 font-bold truncate">
                                  <span>👑 Капитан:</span>
                                  <span className="truncate">{captainContests.map(c => c.title).join(', ')}</span>
                                </div>
                              )}
                              {memberContests.length > 0 && (
                                <div className="flex items-center gap-1 text-stone-700 truncate">
                                  <span>🏃 Боец:</span>
                                  <span className="truncate">{memberContests.map(c => c.title).join(', ')}</span>
                                </div>
                              )}
                              {votedIdeas.length > 0 && (
                                <div className="flex items-center gap-1 text-emerald-800">
                                  <span>🗳️ Голос ЗА:</span>
                                  <span>{votedIdeas.length} творч. идей</span>
                                </div>
                              )}
                              {authoredIdeas.length > 0 && (
                                <div className="flex items-center gap-1 text-purple-800 truncate">
                                  <span>💡 Автор:</span>
                                  <span className="truncate">{authoredIdeas.map(i => i.title).join(', ')}</span>
                                </div>
                              )}
                              {totalVotingsCount === 0 && (
                                <p className="text-stone-400 italic text-[10px]">
                                  Пока не участвует в активных голосованиях.
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                onNavigateTab('home', 'contests');
                              }}
                              className="mt-2 text-[10px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline"
                            >
                              <span>Программа конкурсов</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>

                          {/* 4. КАКИЕ РОЛИ И ОБЯЗАННОСТИ */}
                          <div className="p-2.5 rounded-xl border border-amber-200 bg-white">
                            <div className="flex items-center justify-between font-bold text-[11px] mb-1.5 text-amber-950">
                              <span className="flex items-center gap-1.5">
                                <Shield size={14} className="text-red-600" />
                                <span>Клубные роли:</span>
                              </span>
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-bold">
                                {roleInfo.title}
                              </span>
                            </div>

                            <p className="text-[10px] text-stone-600 leading-tight mb-1 line-clamp-2">
                              {roleInfo.description}
                            </p>

                            {psychotypeMeta && (
                              <div className="p-1.5 bg-amber-50 rounded text-[10px] text-amber-950 italic border border-amber-200 truncate">
                                «{psychotypeMeta.typicalPhrase}»
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                onNavigateTab('history');
                              }}
                              className="mt-2 text-[10px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline"
                            >
                              <span>В Реестр Негодяев</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. MATCHING SITE SECTIONS */}
            {(viewMode === 'all' || viewMode === 'sections') && matchingSections.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-red-600" />
                  <span>Разделы сайта ({matchingSections.length}):</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchingSections.map(sec => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleSelectSection(sec)}
                        className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl flex items-center justify-between text-left transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-amber-950 group-hover:text-red-700 transition-colors truncate">
                                {sec.title}
                              </span>
                              {sec.badge && (
                                <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                                  {sec.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                              {sec.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                          <ArrowRight size={13} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. MATCHING TASKS */}
            {(viewMode === 'all' || viewMode === 'tasks') && matchingTasks.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-red-600" />
                  <span>Задачи слёта ({matchingTasks.length}):</span>
                </h5>

                <div className="space-y-1.5">
                  {matchingTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('home', 'tasks');
                      }}
                      className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {t.isCompleted ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Clock size={15} className="text-amber-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className={`text-xs font-bold truncate block ${t.isCompleted ? 'line-through text-stone-400' : 'text-amber-950'}`}>
                            {t.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                            <span>Исполнитель: <b>{t.assigneeName}</b></span>
                            <span>•</span>
                            <span>Дедлайн: {t.deadline}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 shrink-0 ml-2">
                        <span>Открыть</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MATCHING DOCUMENTS */}
            {(viewMode === 'all' || viewMode === 'docs') && matchingDocuments.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <FolderArchive size={14} className="text-red-600" />
                  <span>Документы и положения ({matchingDocuments.length}):</span>
                </h5>

                <div className="space-y-1.5">
                  {matchingDocuments.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('documents');
                      }}
                      className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                          <FolderArchive size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-950 truncate">{doc.title}</span>
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                              {doc.category === 'statutory' ? 'Уставной' : doc.category === 'rally' ? 'Слёт' : 'Подготовка'}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 shrink-0 ml-2">
                        <span>Читать</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. MATCHING CONTESTS */}
            {matchingContests.length > 0 && (viewMode === 'all') && (
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <Trophy size={14} className="text-red-600" />
                  <span>Конкурсы и соревнования ({matchingContests.length}):</span>
                </h5>

                <div className="space-y-1.5">
                  {matchingContests.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('home', 'contests');
                      }}
                      className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-900 flex items-center justify-center shrink-0">
                          <Trophy size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-950 truncate">{c.title}</span>
                            {c.place && (
                              <span className="bg-yellow-200 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-400 shrink-0">
                                {c.place}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Капитан: <b>{c.captainName}</b>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 shrink-0 ml-2">
                        <span>Смотреть</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NO RESULTS FOUND STATE */}
            {cleanQuery && totalResultsCount === 0 && (
              <div className="p-6 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl">
                  🧭
                </div>
                <h4 className="font-bold text-sm text-amber-950">
                  По запросу «{query}» ничего не найдено
                </h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  Попробуйте ввести имя бойца, позывной, слово <b>задачи</b>, <b>документы</b>, <b>смета</b> или <b>фонд</b>.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Сбросить поиск
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer of Search Results */}
          <div className="bg-amber-50/90 px-4 py-2 border-t border-amber-200/80 flex items-center justify-between text-[11px] font-medium text-stone-600 shrink-0">
            <span>
              💡 Нажмите <kbd className="px-1.5 py-0.5 bg-white rounded border border-amber-300 font-mono text-[10px] text-amber-900">Esc</kbd> чтобы закрыть
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="text-red-700 hover:text-red-800 font-bold uppercase text-[10px]"
            >
              Закрыть поиск
            </button>
          </div>

        </div>
        </>
      )}

      {/* FULL PERSONAL DOSSIER MODAL VIEW */}
      {selectedParticipant && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedParticipant(null)}
        >
          <div 
            className="bg-white border border-amber-300/90 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-amber-950 px-4 py-3 flex items-center justify-between text-amber-100 border-b border-amber-900/60 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="bg-red-600 text-yellow-300 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide shadow-xs shrink-0">
                  Досье
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate leading-tight">
                    {selectedParticipant.name}
                  </h3>
                  <p className="text-[10px] text-amber-300/80 truncate">
                    Баланс долгов, задачи, голосования, роли и психотип
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="p-1 text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 ml-2"
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-3 flex-1 scrollbar-thin">
              
              {/* Profile Card */}
              <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                <img
                  src={getParticipantAvatar(selectedParticipant)}
                  alt={selectedParticipant.name}
                  className="w-14 h-14 rounded-xl border border-amber-300 object-cover shadow-xs bg-amber-100 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base sm:text-lg text-amber-950 uppercase tracking-tight">
                      {selectedParticipant.name}
                    </h2>
                    {selectedParticipant.nickname && (
                      <span className="bg-red-600 text-yellow-300 font-bold text-[11px] px-2 py-0.5 rounded-full border border-amber-950/20">
                        @{selectedParticipant.nickname}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      selectedParticipant.role ? ROLE_DEFINITIONS[selectedParticipant.role]?.color : 'bg-stone-700 text-white'
                    }`}>
                      {selectedParticipant.role ? ROLE_DEFINITIONS[selectedParticipant.role]?.icon : '⛺'} {selectedParticipant.role ? ROLE_DEFINITIONS[selectedParticipant.role]?.title : 'Участник'}
                    </span>
                    {selectedParticipant.psychotype && (
                      <span className="text-[10px] font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                        🎭 {selectedParticipant.psychotype}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. ФИНАНСОВЫЙ БЛОК: СКОЛЬКО ДОЛЖЕН */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Coins size={15} className="text-red-600" />
                  <span>Финансовый статус: Сколько должен</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-center">
                    <span className="text-[10px] font-medium text-stone-500 uppercase block">Смета слёта</span>
                    <span className="font-bold text-sm text-amber-950">{(selectedParticipant.totalCost || 8500).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] font-medium text-emerald-800 uppercase block">Сдано в кассу</span>
                    <span className="font-bold text-sm text-emerald-700">{(selectedParticipant.paidAmount || 0).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-center ${
                    (selectedParticipant.debtAmount || 0) === 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">Остаток долга</span>
                    <span className="font-bold text-sm">
                      {(selectedParticipant.debtAmount || 0) === 0 ? '0 ₽ (Оплачено ✅)' : `${(selectedParticipant.debtAmount || 0).toLocaleString('ru-RU')} ₽ ⚠️`}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                  <span className="text-stone-600">Членские взносы в Фонд Негодяев (500 ₽/мес):</span>
                  <span className="font-bold text-emerald-700">Взносы за 2026г активны</span>
                </div>
              </div>

              {/* 2. ЗА КАКИЕ ЗАДАЧИ ОТВЕЧАЕТ */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <CheckSquare size={15} className="text-red-600" />
                  <span>За какие задачи отвечает</span>
                </h4>

                <div className="space-y-1.5">
                  {tasks.filter(t => 
                    t.assigneeId === selectedParticipant.id || 
                    (selectedParticipant.name && t.assigneeName.toLowerCase().includes(selectedParticipant.name.toLowerCase())) ||
                    (selectedParticipant.nickname && t.assigneeName.toLowerCase().includes(selectedParticipant.nickname.toLowerCase()))
                  ).map(task => (
                    <div key={task.id} className="p-2 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {task.isCompleted ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Clock size={14} className="text-amber-600 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${task.isCompleted ? 'line-through text-stone-400' : 'font-medium text-stone-900'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0">
                        до {task.deadline}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. В КАКИХ ГОЛОСОВАНИЯХ УЧАСТВУЕТ */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Trophy size={15} className="text-red-600" />
                  <span>В каких голосованиях и конкурсах участвует</span>
                </h4>

                <div className="space-y-1.5 text-xs">
                  {contests.filter(c => c.captainId === selectedParticipant.id || c.teamMemberIds?.includes(selectedParticipant.id)).map(c => (
                    <div key={c.id} className="p-2 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Trophy size={14} className="text-yellow-600 shrink-0" />
                        <span className="font-medium text-stone-900 truncate">{c.title}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                        {c.captainId === selectedParticipant.id ? '👑 Капитан конкурса' : 'Боец команды'}
                      </span>
                    </div>
                  ))}

                  {creativityIdeas.filter(i => i.votedUserIds?.includes(selectedParticipant.id) || i.authorId === selectedParticipant.id).map(idea => (
                    <div key={idea.id} className="p-2 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles size={14} className="text-purple-600 shrink-0" />
                        <span className="font-medium text-stone-900 truncate">{idea.title}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        Голос "ЗА" отдан ✅
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. КАКИЕ РОЛИ И ОБЯЗАННОСТИ */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Shield size={15} className="text-red-600" />
                  <span>Клубные роли и походные обязанности</span>
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {selectedParticipant.role ? ROLE_DEFINITIONS[selectedParticipant.role]?.description : 'Член походного братства Негодяев.'}
                </p>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="bg-amber-50/90 px-4 py-2.5 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParticipant(null);
                    setIsOpen(false);
                    onNavigateTab('home', 'tasks');
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100/70 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckSquare size={13} />
                  <span>Открыть задачи</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedParticipant(null);
                    setIsOpen(false);
                    onNavigateTab('fund');
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100/70 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Coins size={13} />
                  <span>Взносы в фонд</span>
                </button>

                {currentUser?.role === 'admin' && selectedParticipant.id !== currentUser.id && selectedParticipant.id !== '3' && selectedParticipant.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => setParticipantToDelete(selectedParticipant)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    title="Удалить члена команды и полностью удалить его аккаунт"
                  >
                    <Trash2 size={13} />
                    <span>Удалить аккаунт</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                Закрыть досье
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      <DeleteParticipantModal
        participant={participantToDelete}
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={async (userId) => {
          if (onDeleteUser) {
            await onDeleteUser(userId);
          } else {
            await fetch('/api/admin/delete-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            });
          }
          setSelectedParticipant(null);
        }}
      />

    </div>
  );
}
