import React, { useState, useEffect } from 'react';
import { 
  Tent, MessageSquare, Image as ImageIcon, FolderArchive, 
  Coins, Palette, Shield, Cake, User, 
  AlertCircle, CheckCircle, Bell, Sparkles, Edit, BookOpen,
  CheckSquare, Coffee, Package, Trophy
} from 'lucide-react';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';
import SecurityModal from './components/SecurityModal';
import BirthdayNotifications from './components/BirthdayNotifications';
import GalleryTab from './components/GalleryTab';
import DocumentsTab from './components/DocumentsTab';
import FundTab from './components/FundTab';
import CreativityTab from './components/CreativityTab';
import AdminPanel from './components/AdminPanel';
import HomeRallyTab from './components/HomeRallyTab';
import TeamHistoryTab from './components/TeamHistoryTab';
import FloatingChat from './components/FloatingChat';
import TeamAuthGate from './components/TeamAuthGate';
import TasksTab from './components/TasksTab';
import MenuGroceriesTab from './components/MenuGroceriesTab';
import InventoryTab from './components/InventoryTab';
import ContestsTab from './components/ContestsTab';
import NavigationTabs, { TabItem } from './components/NavigationTabs';
import TopSiteMenu from './components/TopSiteMenu';
import ProfileEditModal from './components/ProfileEditModal';
import SiteSearch from './components/SiteSearch';
import { compressImage } from './utils/imageCompressor';

import { 
  Participant, Excursion, ChatMessage, BotConfig, 
  TaskItem, MenuItem, GroceryItem, InventoryItem, 
  Contest, GalleryPhoto, TeamDocument, FundRecord, CreativityIdea,
  TeamStory, UserRole, ROLE_DEFINITIONS, ThemeConfig, DEFAULT_THEME_CONFIG
} from './types';
import { 
  initialParticipants, initialExcursions, initialMessages, 
  initialBotConfig, initialTasks, initialMenuItems, 
  initialGroceryItems, initialInventoryItems, initialContests,
  initialPhotos, initialDocuments, initialFundRecords, initialCreativityIdeas,
  INITIAL_STORIES
} from './mockData';

export default function App() {
  // Navigation
  type TabType = 'history' | 'home' | 'tasks' | 'menu' | 'inventory' | 'contests' | 'gallery' | 'documents' | 'fund' | 'creativity' | 'admin';
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [homeSubTab, setHomeSubTab] = useState<'overview' | 'tasks' | 'menu' | 'contests' | 'creativity'>('overview');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<Participant | null>(() => {
    try {
      const saved = localStorage.getItem('negodyai_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Domain Entities from PostgreSQL / Server Sync
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [excursions, setExcursions] = useState<Excursion[]>(initialExcursions);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialGroceryItems);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [botConfig, setBotConfig] = useState<BotConfig>(initialBotConfig);
  const [contests, setContests] = useState<Contest[]>(initialContests);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [documents, setDocuments] = useState<TeamDocument[]>(initialDocuments);
  const [fundRecords, setFundRecords] = useState<FundRecord[]>(initialFundRecords);
  const [creativityIdeas, setCreativityIdeas] = useState<CreativityIdea[]>(initialCreativityIdeas);
  const [stories, setStories] = useState<TeamStory[]>(INITIAL_STORIES);

  // Theme & Appearance Configuration
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('negodyai_theme_config');
      return saved ? { ...DEFAULT_THEME_CONFIG, ...JSON.parse(saved) } : DEFAULT_THEME_CONFIG;
    } catch {
      return DEFAULT_THEME_CONFIG;
    }
  });

  const handleUpdateThemeConfig = (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    try {
      localStorage.setItem('negodyai_theme_config', JSON.stringify(newTheme));
    } catch (e) {
      console.warn(e);
    }
  };

  // System Toast / Notification
  const [systemToast, setSystemToast] = useState<{ message: string; type?: 'info' | 'success' | 'alert' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 4000);
  };

  // Team Logo upload & reset with compression
  const handleUploadLogoFile = async (file: File) => {
    try {
      const compressed = await compressImage(file, 512, 0.88);
      setBotConfig(prev => ({ ...prev, customLogo: compressed }));
      try {
        localStorage.setItem('negodyai_custom_logo', compressed);
      } catch (e) {
        console.warn("Storage quota warning:", e);
      }
      const res = await fetch("/api/bot-config/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customLogo: compressed })
      });
      if (res.ok) {
        showToast("✨ Логотип команды успешно обновлен и сохранен!", "success");
      } else {
        showToast("Логотип обновлен локально", "info");
      }
    } catch (err) {
      console.error("Logo error:", err);
      showToast("Ошибка при обработке логотипа", "alert");
    }
  };

  const handleResetLogo = async () => {
    setBotConfig(prev => ({ ...prev, customLogo: null }));
    try {
      localStorage.removeItem('negodyai_custom_logo');
    } catch (e) {
      console.warn(e);
    }
    await fetch("/api/bot-config/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customLogo: null })
    });
    showToast("Логотип сброшен на стандартный", "info");
  };

  // Check local logo on boot
  useEffect(() => {
    const localLogo = localStorage.getItem('negodyai_custom_logo');
    if (localLogo && !botConfig.customLogo) {
      setBotConfig(prev => ({ ...prev, customLogo: localLogo }));
    }
  }, []);

  // Sync state from server on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const fetchSync = async () => {
      try {
        const res = await fetch("/api/sync");
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
          return;
        }
        const text = await res.text();
        if (!text || text.trim().startsWith("<")) {
          return;
        }
        const data = JSON.parse(text);
        if (!isMounted) return;

        if (data.participants) setParticipants(data.participants);
        if (data.excursions) setExcursions(data.excursions);
        if (data.tasks) setTasks(data.tasks);
        if (data.menuItems) setMenuItems(data.menuItems);
        if (data.groceryItems) setGroceryItems(data.groceryItems);
        if (data.inventoryItems) setInventoryItems(data.inventoryItems);
        if (data.botConfig) {
          const localLogo = localStorage.getItem('negodyai_custom_logo');
          setBotConfig({
            ...data.botConfig,
            customLogo: data.botConfig.customLogo || localLogo || null
          });
        }
        if (data.contests) setContests(data.contests);
        if (data.messages) setMessages(data.messages);
        if (data.photos) setPhotos(data.photos);
        if (data.documents) setDocuments(data.documents);
        if (data.fundRecords) setFundRecords(data.fundRecords);
        if (data.creativityIdeas) setCreativityIdeas(data.creativityIdeas);
        if (data.stories) setStories(data.stories);
      } catch {
        // Silently ignore transient network or non-JSON payloads during server restart
      }
    };

    fetchSync();
    const interval = setInterval(fetchSync, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sync local changes back to server
  useEffect(() => {
    const pushSync = async () => {
      try {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participants,
            excursions,
            tasks,
            menuItems,
            groceryItems,
            inventoryItems,
            botConfig,
            contests,
            messages,
            fundRecords,
            stories
          })
        });
      } catch (err) {
        console.error("Push sync error:", err);
      }
    };

    if (participants.length > 0) {
      pushSync();
    }
  }, [participants, excursions, tasks, menuItems, groceryItems, inventoryItems, botConfig, contests, messages, fundRecords, stories]);

  // Update current user if participant data changed
  useEffect(() => {
    if (currentUser) {
      const match = participants.find(p => p.id === currentUser.id || String(p.id) === String(currentUser.id));
      if (match) {
        if (
          match.name !== currentUser.name ||
          match.avatar !== currentUser.avatar ||
          match.role !== currentUser.role ||
          match.nickname !== currentUser.nickname ||
          match.psychotype !== currentUser.psychotype ||
          match.phone !== currentUser.phone ||
          match.email !== currentUser.email ||
          match.birthday !== currentUser.birthday
        ) {
          setCurrentUser(match);
          try {
            localStorage.setItem('negodyai_active_user', JSON.stringify(match));
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
  }, [participants]);

  // Auth Handlers
  const handleLoginSuccess = (user: Participant) => {
    setCurrentUser(user);
    localStorage.setItem('negodyai_active_user', JSON.stringify(user));
    showToast(`Добро пожаловать в команду, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('negodyai_active_user');
    showToast('Вы вышли из учетной записи', 'info');
  };

  // Participant Moderation Handlers (Admin)
  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, accountStatus: 'active' as const } : p));
        showToast("Участник успешно принят в команду!", "success");
      }
    } catch (err) {
      showToast("Ошибка подтверждения пользователя", "alert");
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/reject-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, accountStatus: 'rejected' as const } : p));
        showToast("Заявка отклонена", "info");
      }
    } catch (err) {
      showToast("Ошибка при отклонении заявки", "alert");
    }
  };

  const handleSetRole = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
        const roleInfo = ROLE_DEFINITIONS[role];
        showToast(`Роль участника изменена: ${roleInfo ? `${roleInfo.icon} ${roleInfo.title}` : role}`, "success");
      }
    } catch (err) {
      showToast("Ошибка смены роли", "alert");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          setParticipants(prev => prev.filter(p => p.id !== userId));
        }
        showToast(data.message || "Член команды и его аккаунт полностью удалены", "success");
        if (currentUser && (currentUser.id === userId || String(currentUser.id) === String(userId))) {
          handleLogout();
        }
      } else {
        showToast(data.error || "Ошибка при удалении аккаунта", "alert");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      showToast("Ошибка соединения при удалении пользователя", "alert");
    }
  };

  // Chat message sending with Bot auto-response handling
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderNickname: currentUser.nickname,
      senderPsychotype: currentUser.psychotype,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false,
      imageUrl
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: currentUser.name,
          senderNickname: currentUser.nickname,
          senderPsychotype: currentUser.psychotype,
          text,
          imageUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.botMessage) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.botMessage.id)) return prev;
            return [...prev, data.botMessage];
          });
        }
      }
    } catch (err) {
      console.error("Message send error:", err);
    }
  };

  // Nudge Debtor with Bot message in chat
  const handleNudgeDebtor = async (debtor: Participant) => {
    const cleanNick = debtor.nickname ? debtor.nickname.replace(/^@/, '') : '';
    const mention = cleanNick ? `@${cleanNick}` : (debtor.name || 'Участник');
    // Exact user requested phrase: "..... почему не платишь бля, за тобой должок числиться. Если не хочешь в палатку к Буркуту, бегом вносить платёж"
    const phrase = `${mention}, почему не платишь бля, за тобой должок числиться. Если не хочешь в палатку к Буркуту, бегом вносить платёж!`;
    
    // Instant optimistic bot message in local chat
    const botMsg: ChatMessage = {
      id: "bot_nudge_" + Date.now(),
      senderName: "Бот Максимка",
      senderNickname: "negodyai_bot",
      senderPsychotype: "ИИ Главный Негодяй",
      text: phrase,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: true
    };
    setMessages(prev => [...prev, botMsg]);

    showToast(`⚡ Бот Максимка пнул ${debtor.name} в общем чате!`, 'alert');

    try {
      const res = await fetch("/api/chat/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtorId: debtor.id,
          debtorName: debtor.name,
          debtorNickname: debtor.nickname,
          debtAmount: debtor.debtAmount
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Error nudging debtor:", err);
    }
  };

  // Story Handlers
  const handleAddStory = async (story: TeamStory) => {
    setStories(prev => [story, ...prev]);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story)
      });
      if (res.ok) {
        showToast("✨ Блок истории успешно добавлен!", "success");
      }
    } catch (err) {
      console.error("Error adding story:", err);
    }
  };

  const handleUpdateStory = async (id: string, updates: Partial<TeamStory>) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      await fetch(`/api/stories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      showToast("Блок истории обновлён", "info");
    } catch (err) {
      console.error("Error updating story:", err);
    }
  };

  const handleDeleteStory = async (id: string) => {
    setStories(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/stories/${id}`, {
        method: "DELETE"
      });
      showToast("Блок истории удален", "info");
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  // Gating access: Require login & approved account to view the site, including homepage
  if (!currentUser || currentUser.accountStatus !== 'active') {
    return (
      <TeamAuthGate
        currentUser={currentUser}
        onLogin={handleLoginSuccess}
        onLogout={handleLogout}
        participants={participants}
        customLogo={botConfig.customLogo}
        onRegisterSuccess={(newUser) => {
          setParticipants(prev => [newUser, ...prev]);
          handleLoginSuccess(newUser);
        }}
      />
    );
  }

  const currentYear = new Date().getFullYear();
  const teamAgeYears = Math.max(1, currentYear - (botConfig.foundingYear || 2018));
  const yearWord = teamAgeYears % 10 === 1 && teamAgeYears % 100 !== 11 ? 'год' : (teamAgeYears % 10 >= 2 && teamAgeYears % 10 <= 4 && (teamAgeYears % 100 < 10 || teamAgeYears % 100 >= 20)) ? 'года' : 'лет';
  const pendingApprovalsCount = participants.filter(p => p.accountStatus === 'pending').length;

  const handleNavigate = (tabId: string, subTab?: 'overview' | 'tasks' | 'menu' | 'contests' | 'creativity') => {
    if (tabId === 'tasks') {
      setActiveTab('home');
      setHomeSubTab('tasks');
    } else if (tabId === 'menu') {
      setActiveTab('home');
      setHomeSubTab('menu');
    } else if (tabId === 'contests') {
      setActiveTab('home');
      setHomeSubTab('contests');
    } else if (tabId === 'creativity') {
      setActiveTab('home');
      setHomeSubTab('creativity');
    } else {
      setActiveTab(tabId as any);
      if (tabId === 'home' && subTab) {
        setHomeSubTab(subTab);
      }
    }
  };

  const MAIN_TABS: TabItem[] = [
    { id: 'history', label: 'История команды', icon: BookOpen },
    { id: 'home', label: 'Планируемые слёты', icon: Tent },
    { id: 'inventory', label: 'Инвентарь', icon: Package },
    { id: 'gallery', label: 'Фотогалерея', icon: ImageIcon },
    { id: 'documents', label: 'Документы', icon: FolderArchive },
    { id: 'fund', label: 'Фонд Негодяев', icon: Coins },
    { id: 'admin', label: 'Штаб Капитана', icon: Shield, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined }
  ];

  return (
    <div 
      className="min-h-screen flex flex-col font-sans selection:bg-red-600 selection:text-yellow-300 transition-all duration-200"
      style={{
        backgroundColor: themeConfig.bgColor,
        color: themeConfig.textColor,
        filter: `brightness(${themeConfig.brightness}%) contrast(${themeConfig.contrast}%)`
      }}
    >
      
      {/* GLOBAL HEADER */}
      <header 
        className="border-b-4 border-red-600 shadow-md sticky top-0 z-30 transition-colors"
        style={{ backgroundColor: themeConfig.headerBg || '#FACC15' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <input
                  id="header-logo-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadLogoFile(file);
                  }}
                />
                <label htmlFor="header-logo-upload-input" className="cursor-pointer block relative">
                  {botConfig.customLogo && botConfig.customLogo.trim() ? (
                    <img 
                      src={botConfig.customLogo.trim()} 
                      alt="Лого Негодяи" 
                      className="w-12 h-12 object-contain bg-white border-2 border-red-600 rounded-xl p-0.5 shadow-md group-hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <div className="group-hover:opacity-85 transition-opacity">
                      <Logo size="sm" className="bg-white border-2 border-red-600 rounded-xl p-1 shadow-md shrink-0" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-yellow-300 rounded-full p-1 border border-amber-950 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit size={10} />
                  </div>
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-amber-950 uppercase tracking-tight leading-none">
                    <span className="bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded transform -rotate-1 inline-block shadow-sm">НЕГОДЯИ</span>
                  </h1>
                  <span className="bg-red-700 text-yellow-300 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border border-yellow-300 shadow select-none">
                    🧭 нам {teamAgeYears} {yearWord}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-amber-900 mt-0.5">
                  Туристическая команда «Негодяи»
                </p>
              </div>
            </div>
          </div>

          {/* SITE SEARCH BAR IN TOP HEADER */}
          <div className="w-full md:w-auto flex-1 max-w-xl mx-0 md:mx-4">
            <SiteSearch
              participants={participants}
              tasks={tasks}
              contests={contests}
              documents={documents}
              inventoryItems={inventoryItems}
              menuItems={menuItems}
              groceryItems={groceryItems}
              creativityIdeas={creativityIdeas}
              fundRecords={fundRecords}
              stories={stories}
              currentUser={currentUser}
              onNavigateTab={handleNavigate}
              onOpenBirthdays={() => setIsBirthdayModalOpen(true)}
              onOpenProfileEdit={() => setIsProfileEditOpen(true)}
              onDeleteUser={handleDeleteUser}
            />
          </div>

          {/* Open Top Menu Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            
            {/* Top Dropdown Menu */}
            <TopSiteMenu
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigateTab={handleNavigate}
              onOpenProfileEdit={() => setIsProfileEditOpen(true)}
              onOpenSecurity={() => setIsSecurityModalOpen(true)}
              onOpenBirthdays={() => setIsBirthdayModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              pendingApprovalsCount={pendingApprovalsCount}
              themeConfig={themeConfig}
              onUpdateThemeConfig={handleUpdateThemeConfig}
              customLogo={botConfig.customLogo}
              onUploadLogo={handleUploadLogoFile}
              onResetLogo={handleResetLogo}
            />

            {/* Birthday Diary Alert */}
            <button
              type="button"
              onClick={() => setIsBirthdayModalOpen(true)}
              className="px-3 py-2 bg-yellow-300 hover:bg-yellow-200 border-2 border-amber-500 rounded-xl text-xs font-black uppercase text-amber-950 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Ежедневник дней рождений"
            >
              <Cake size={16} className="text-red-600" />
              <span className="hidden sm:inline">Дни рождения</span>
            </button>

            {/* Login Button for Guests */}
            {!currentUser && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 border-2 border-amber-950 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                <User size={15} />
                <span>Войти / Регистрация</span>
              </button>
            )}

          </div>

        </div>

        {/* PRIMARY WEBSITE NAVIGATION TABS WITH DUAL-DIRECTION SCROLL */}
        <NavigationTabs
          tabs={MAIN_TABS}
          activeTab={activeTab === 'tasks' || activeTab === 'menu' || activeTab === 'contests' || activeTab === 'creativity' ? 'home' : activeTab}
          onSelectTab={(id) => handleNavigate(id)}
        />
      </header>

      {/* SYSTEM TOAST ALERT */}
      {systemToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className={`p-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-2.5 text-xs font-black uppercase ${
            systemToast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
            systemToast.type === 'alert' ? 'bg-red-600 text-yellow-300 border-amber-950' :
            'bg-amber-500 text-amber-950 border-amber-700'
          }`}>
            <Sparkles size={16} />
            <span>{systemToast.message}</span>
          </div>
        </div>
      )}

      {/* MAIN WEBSITE CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        
        {/* TAB 0: START PAGE - TEAM HISTORY IN BLOCKS WITH PHOTOS & VIDEOS */}
        {activeTab === 'history' && (
          <TeamHistoryTab
            stories={stories}
            onAddStory={handleAddStory}
            onUpdateStory={handleUpdateStory}
            onDeleteStory={handleDeleteStory}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
          />
        )}

        {/* TAB 1: PLANNED RALLIES (WITH EMBEDDED TASKS, MENU, CONTESTS, CREATIVITY) */}
        {(activeTab === 'home' || activeTab === 'tasks' || activeTab === 'menu' || activeTab === 'contests' || activeTab === 'creativity') && (
          <HomeRallyTab
            participants={participants}
            excursions={excursions}
            onUpdateParticipants={setParticipants}
            onUpdateExcursions={setExcursions}
            onNudgeDebtor={handleNudgeDebtor}
            onNavigateToTab={handleNavigate}
            onDeleteUser={handleDeleteUser}
            tasks={tasks}
            onUpdateTasks={setTasks}
            menuItems={menuItems}
            groceryItems={groceryItems}
            onUpdateMenu={setMenuItems}
            onUpdateGroceries={setGroceryItems}
            contests={contests}
            onUpdateContests={setContests}
            creativityIdeas={creativityIdeas}
            onIdeaAdded={(idea) => setCreativityIdeas(prev => [idea, ...prev])}
            onIdeaVoted={(id) => {
              if (!currentUser) return;
              setCreativityIdeas(prev => prev.map(i => {
                if (i.id === id) {
                  const already = i.votedUserIds.includes(currentUser.id);
                  return {
                    ...i,
                    votes: already ? i.votes - 1 : i.votes + 1,
                    votedUserIds: already ? i.votedUserIds.filter(u => u !== currentUser.id) : [...i.votedUserIds, currentUser.id]
                  };
                }
                return i;
              }));
            }}
            onCommentAdded={(id, text) => {
              if (!currentUser) return;
              const newComment = {
                id: 'c_' + Date.now(),
                authorName: currentUser.name,
                text,
                createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
              };
              setCreativityIdeas(prev => prev.map(i => i.id === id ? { ...i, comments: [...(i.comments || []), newComment] } : i));
            }}
            onStatusChanged={(id, status) => {
              setCreativityIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
            }}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
            activeSubTab={
              activeTab === 'tasks' ? 'tasks' : 
              activeTab === 'menu' ? 'menu' : 
              activeTab === 'contests' ? 'contests' : 
              activeTab === 'creativity' ? 'creativity' : 
              homeSubTab
            }
            onSubTabChange={(sub) => {
              setActiveTab('home');
              setHomeSubTab(sub);
            }}
          />
        )}

        {/* TAB: INVENTORY (MOVED FROM ADMIN) */}
        {activeTab === 'inventory' && (
          <InventoryTab
            inventoryItems={inventoryItems}
            onUpdateInventory={setInventoryItems}
            participants={participants}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
          />
        )}

        {/* TAB 3: PHOTO GALLERY ARCHIVE BY YEARS (UNLIMITED SIZE) */}
        {activeTab === 'gallery' && (
          <GalleryTab
            photos={photos}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
            onPhotoAdded={(p) => setPhotos(prev => [p, ...prev])}
            onPhotoDeleted={(id) => setPhotos(prev => prev.filter(p => p.id !== id))}
            onPhotoLiked={(id) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p))}
          />
        )}

        {/* TAB 4: DOCUMENTS (3 SUBSECTIONS) */}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
            onDocumentAdded={(d) => setDocuments(prev => [d, ...prev])}
            onDocumentDeleted={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
          />
        )}

        {/* TAB 5: NEGODYAI FUND (500 RUB/MONTH + TREASURER) */}
        {activeTab === 'fund' && (
          <FundTab
            fundRecords={fundRecords}
            participants={participants}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
            isTreasurer={currentUser?.role === 'treasurer' || currentUser?.role === 'admin'}
            onPaymentToggled={(rec) => {
              setFundRecords(prev => {
                const idx = prev.findIndex(r => r.id === rec.id || (r.participantId === rec.participantId && r.year === rec.year && r.month === rec.month));
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = rec;
                  return updated;
                }
                return [rec, ...prev];
              });
            }}
            onUpdateFundRecords={(records) => setFundRecords(records)}
            onSetTreasurer={(pId) => handleSetRole(pId, 'treasurer')}
            onSwitchUser={(user) => {
              setCurrentUser(user);
              try {
                localStorage.setItem('negodyai_active_user', JSON.stringify(user));
              } catch (e) {
                console.warn(e);
              }
              showToast(`Вход выполнен под аккаунтом: ${user.name}`, 'success');
            }}
          />
        )}

        {/* TAB 7: ADMIN PANEL (WITH PSYCHOTYPES BLOCK & USER APPROVALS) */}
        {activeTab === 'admin' && (
          <AdminPanel
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            participants={participants}
            onUpdateParticipants={setParticipants}
            tasks={tasks}
            onUpdateTasks={setTasks}
            menuItems={menuItems}
            onUpdateMenuItems={setMenuItems}
            groceryItems={groceryItems}
            onUpdateGroceryItems={setGroceryItems}
            inventoryItems={inventoryItems}
            onUpdateInventoryItems={setInventoryItems}
            contests={contests}
            onUpdateContests={setContests}
            excursions={excursions}
            onUpdateExcursions={setExcursions}
            botConfig={botConfig}
            onUpdateBotConfig={setBotConfig}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onDeleteUser={handleDeleteUser}
            onSetRole={handleSetRole}
          />
        )}

      </main>

      {/* FLOATING CHAT WINDOW (ACCESSIBLE ON ANY PAGE) */}
      <FloatingChat
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        participants={participants}
      />

      {/* FOOTER */}
      <footer className="bg-yellow-400 border-t-4 border-red-600 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-amber-950">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛺</span>
            <span>Туристическая команда &laquo;НЕГОДЯИ&raquo; • Основана в {botConfig.foundingYear || 2018} году</span>
          </div>
          <p className="text-center sm:text-right text-[11px] text-amber-900">
            Все права защищены походным братством. Память сайта на PostgreSQL.
          </p>
        </div>
      </footer>

      {/* MODALS */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          try {
            localStorage.setItem('negodyai_active_user', JSON.stringify(updated));
          } catch (e) {
            console.warn('localStorage save warning:', e);
          }
          setParticipants(prev => prev.map(p => (p.id === updated.id || String(p.id) === String(updated.id)) ? updated : p));
          showToast('Личные данные успешно сохранены!', 'success');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onRegistered={(updated) => {
          setParticipants(updated);
        }}
      />

      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={currentUser}
        isAdmin={currentUser?.role === 'admin'}
      />

      <BirthdayNotifications
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        participants={participants}
        isAdmin={currentUser?.role === 'admin'}
      />

    </div>
  );
}
