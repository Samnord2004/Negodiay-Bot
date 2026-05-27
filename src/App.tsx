import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash, Edit, Settings, MessageSquare, AlertCircle, Coins, 
  Users, Calendar, TrendingUp, Send, Sparkles, CheckCircle, 
  User, RefreshCw, Volume2, ShieldAlert, Lock
} from 'lucide-react';
import Logo from './components/Logo';
import { Participant, Excursion, ChatMessage, BotConfig, TaskItem, MenuItem, GroceryItem, InventoryItem, InventoryCondition, Contest } from './types';
import { initialParticipants, initialExcursions, initialMessages, initialBotConfig, PSYCHOTYPES, initialTasks, initialMenuItems, initialGroceryItems, initialInventoryItems, initialContests } from './mockData';

export default function App() {
  // State elements
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [excursions, setExcursions] = useState<Excursion[]>(initialExcursions);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [botConfig, setBotConfig] = useState<BotConfig>(initialBotConfig);

  // Admin Login and tabs views
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'settings' | 'tasks' | 'menu' | 'inventory' | 'contests'>('settings');

  // Domain state entities
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialGroceryItems);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [contests, setContests] = useState<Contest[]>(initialContests);

  // Logo customization states
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('negodyai_custom_logo') || null;
  });
  const [logoInputUrl, setLogoInputUrl] = useState('');

  // New forms submission states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('1');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuDay, setNewMenuDay] = useState('День 1. Обед');
  const [newMenuDishName, setNewMenuDishName] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');

  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryQuantity, setNewGroceryQuantity] = useState('');
  const [newGroceryCategory, setNewGroceryCategory] = useState('Еда');

  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInventoryName, setNewInventoryName] = useState('');
  const [newInventoryCondition, setNewInventoryCondition] = useState<InventoryCondition>('нормальное');
  const [newInventoryResponsible, setNewInventoryResponsible] = useState('Юрец Мангальщик');

  // Contest form states
  const [showAddContest, setShowAddContest] = useState(false);
  const [newContestTitle, setNewContestTitle] = useState('');
  const [newContestCaptainId, setNewContestCaptainId] = useState('1');
  const [newContestTeamMemberIds, setNewContestTeamMemberIds] = useState<string[]>([]);
  const [newContestPlace, setNewContestPlace] = useState('');
  
  // Impersonating sender state
  const [selectedSender, setSelectedSender] = useState<Participant>(initialParticipants[0]);
  const [customMessage, setCustomMessage] = useState('');
  
  // App states
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  
  // Forms states
  const [showAddExcursion, setShowAddExcursion] = useState(false);
  const [newExcursion, setNewExcursion] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    costBoys: 5000,
    costGirls: 3500
  });

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    nickname: '',
    psychotype: 'Весельчак-балагур',
    avatar: '⛺',
    paidAmount: 0,
    totalCost: 8500,
    birthday: '',
    joinedYear: new Date().getFullYear(),
    skippedYears: '',
    gender: 'male' as 'male' | 'female'
  });

  const [expandedYearsId, setExpandedYearsId] = useState<string | null>(null);

  // Excursion editing state
  const [editingExcursionId, setEditingExcursionId] = useState<string | null>(null);
  const [editingExcursionData, setEditingExcursionData] = useState<Excursion | null>(null);

  const startEditExcursion = (ex: Excursion) => {
    setEditingExcursionId(ex.id);
    setEditingExcursionData({ ...ex });
  };

  const handleSaveExcursionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExcursionData || !editingExcursionData.title) return;

    setExcursions(prev => prev.map(ex => {
      if (ex.id === editingExcursionData.id) {
        return {
          ...editingExcursionData,
          costPerPerson: editingExcursionData.costBoys
        };
      }
      return ex;
    }));

    triggerSystemNotification(`📝 Изменения в туре "${editingExcursionData.title}" сохранены!`);
    setEditingExcursionId(null);
    setEditingExcursionData(null);
  };

  // Contest editing state
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [editingContestData, setEditingContestData] = useState<Contest | null>(null);

  const startEditContest = (contest: Contest) => {
    setEditingContestId(contest.id);
    setEditingContestData({ ...contest });
  };

  const cancelEditContest = () => {
    setEditingContestId(null);
    setEditingContestData(null);
  };

  const saveContestEdit = () => {
    if (!editingContestData || !editingContestData.title.trim()) return;
    const captain = participants.find(p => p.id === editingContestData.captainId);
    const updatedContest: Contest = {
      ...editingContestData,
      captainName: captain ? captain.name : editingContestData.captainName
    };
    setContests(prev => prev.map(c => c.id === updatedContest.id ? updatedContest : c));
    setEditingContestId(null);
    setEditingContestData(null);
    triggerSystemNotification(`📝 Изменения в конкурсе "${updatedContest.title}" сохранены!`);
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat internally to latest messages without jumping the whole webpage viewport
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  // Sync custom logo across storage adjustments
  useEffect(() => {
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('negodyai_custom_logo') || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Poll state from server every 1.5 seconds to synchronize chat, participants, and contests
  useEffect(() => {
    let isMounted = true;
    const fetchSync = async () => {
      try {
        const res = await fetch("/api/sync");
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.participants) setParticipants(data.participants);
        if (data.excursions) setExcursions(data.excursions);
        if (data.tasks) setTasks(data.tasks);
        if (data.menuItems) setMenuItems(data.menuItems);
        if (data.groceryItems) setGroceryItems(data.groceryItems);
        if (data.inventoryItems) setInventoryItems(data.inventoryItems);
        if (data.botConfig) setBotConfig(data.botConfig);
        if (data.contests) setContests(data.contests);
        if (data.messages) setMessages(data.messages);
      } catch (err) {
        console.error("Sync fetch error:", err);
      }
    };

    fetchSync();
    const interval = setInterval(fetchSync, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Push local edits back to live Express server cache
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
            messages
          })
         });
      } catch (err) {
        console.error("Sync push error:", err);
      }
    };

    if (participants.length > 0) {
      pushSync();
    }
  }, [participants, excursions, tasks, menuItems, groceryItems, inventoryItems, botConfig, contests, messages]);

  // Recalculate participant total costs based on gender when active excursions list changes
  useEffect(() => {
    const hasChanged = participants.some(p => {
      const activeCost = excursions
        .filter(e => e.isActive)
        .reduce((acc, curr) => {
          const cost = p.gender === 'female' 
            ? (curr.costGirls ?? curr.costPerPerson ?? 3500) 
            : (curr.costBoys ?? curr.costPerPerson ?? 5000);
          return acc + cost;
        }, 0);
      return p.totalCost !== activeCost || p.debtAmount !== Math.max(0, activeCost - p.paidAmount);
    });

    if (hasChanged) {
      setParticipants(prev => prev.map(p => {
        const activeCost = excursions
          .filter(e => e.isActive)
          .reduce((acc, curr) => {
            const cost = p.gender === 'female' 
              ? (curr.costGirls ?? curr.costPerPerson ?? 3500) 
              : (curr.costBoys ?? curr.costPerPerson ?? 5000);
            return acc + cost;
          }, 0);
        return {
          ...p,
          totalCost: activeCost,
          debtAmount: Math.max(0, activeCost - p.paidAmount)
        };
      }));
    }
  }, [excursions, participants]);

  // Handle adding an excursion
  const handleAddExcursion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcursion.title || !newExcursion.location) return;

    const excursion: Excursion = {
      id: "e_" + Date.now(),
      title: newExcursion.title,
      date: newExcursion.date || new Date().toISOString().split('T')[0],
      location: newExcursion.location,
      description: newExcursion.description,
      costPerPerson: Number(newExcursion.costBoys),
      costBoys: Number(newExcursion.costBoys),
      costGirls: Number(newExcursion.costGirls),
      isActive: true
    };

    setExcursions(prev => [...prev, excursion]);
    setNewExcursion({ title: '', date: '', location: '', description: '', costBoys: 5000, costGirls: 3500 });
    setShowAddExcursion(false);
    
    // Auto-alert chat about the new gathering
    triggerSystemNotification(`📢 ДОБАВЛЕН НОВЫЙ СБОР: "${excursion.title}" в ${excursion.location}! Цена с парней: ${excursion.costBoys} руб, с девчонок: ${excursion.costGirls} руб. Собираем взносы!`);
  };

  // Toggle Excursion active status
  const toggleExcursion = (id: string) => {
    setExcursions(prev => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
  };

  // Delete excursion
  const deleteExcursion = (id: string) => {
    setExcursions(prev => prev.filter(e => e.id !== id));
  };

  const getTeamYearsText = (joinedYear: number, skippedYears: number[]) => {
    const currentY = new Date().getFullYear();
    const years = currentY - (joinedYear || 2018) - (skippedYears ? skippedYears.length : 0);
    const positiveYears = Math.max(0, years);
    const lastDigit = positiveYears % 10;
    const lastTwoDigits = positiveYears % 100;
    let word = 'лет';
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      word = 'лет';
    } else if (lastDigit === 1) {
      word = 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      word = 'года';
    }
    return `${positiveYears} ${word}`;
  };

  const updateJoinedYear = (id: string, year: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          joinedYear: Math.max(1980, Math.min(new Date().getFullYear(), Number(year) || 2018))
        };
      }
      return p;
    }));
  };

  const addSkippedYear = (id: string, year: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const list = p.skippedYears || [];
        if (year && !list.includes(year)) {
          return {
            ...p,
            skippedYears: [...list, year].sort((a, b) => a - b)
          };
        }
      }
      return p;
    }));
  };

  const removeSkippedYear = (id: string, year: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const list = p.skippedYears || [];
        return {
          ...p,
          skippedYears: list.filter(y => y !== year)
        };
      }
      return p;
    }));
  };

  // Handle adding a participant
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.name || !newParticipant.nickname) return;

    const activeCost = excursions
      .filter(e => e.isActive)
      .reduce((acc, curr) => {
        const cost = newParticipant.gender === 'female' 
          ? (curr.costGirls ?? curr.costPerPerson ?? 3500) 
          : (curr.costBoys ?? curr.costPerPerson ?? 5000);
        return acc + cost;
      }, 0);

    const parsedSkipped = newParticipant.skippedYears
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(num => !isNaN(num) && num > 0);

    const participant: Participant = {
      id: "p_" + Date.now(),
      name: newParticipant.name,
      nickname: newParticipant.nickname.replace('@', ''),
      psychotype: newParticipant.psychotype,
      avatar: newParticipant.avatar,
      paidAmount: Number(newParticipant.paidAmount),
      totalCost: activeCost,
      debtAmount: Math.max(0, activeCost - Number(newParticipant.paidAmount)),
      joined: true,
      birthday: newParticipant.birthday || undefined,
      joinedYear: Number(newParticipant.joinedYear) || new Date().getFullYear(),
      skippedYears: parsedSkipped,
      gender: newParticipant.gender
    };

    setParticipants(prev => [...prev, participant]);
    setSelectedSender(participant); // switch current sender to new participant for ease of use
    setNewParticipant({
      name: '',
      nickname: '',
      psychotype: 'Весельчак-балагур',
      avatar: '⛺',
      paidAmount: 0,
      totalCost: 8500,
      birthday: '',
      joinedYear: new Date().getFullYear(),
      skippedYears: '',
      gender: 'male'
    });
    setShowAddParticipant(false);

    triggerSystemNotification(`⛺ В команду "Негодяи" пробрался новый участник: ${participant.name} (@${participant.nickname})! Его психотип: ${participant.psychotype}.`);
  };

  // Edit payment for participant
  const updatePayment = (id: string, amount: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const validatedAmount = Math.max(0, Number(amount));
        return {
          ...p,
          paidAmount: validatedAmount,
          debtAmount: Math.max(0, p.totalCost - validatedAmount)
        };
      }
      return p;
    }));
  };

  // Edit birthday for participant
  const updateBirthday = (id: string, bday: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          birthday: bday || undefined
        };
      }
      return p;
    }));
  };

  // Edit gender for participant
  const updateGender = (id: string, gender: 'male' | 'female') => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          gender
        };
      }
      return p;
    }));
  };

  // Delete participant
  const deleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  // Add new contest
  const handleAddContest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContestTitle.trim()) return;

    const captain = participants.find(p => p.id === newContestCaptainId);
    const newContId = "contest_" + Date.now();
    
    const newCont: Contest = {
      id: newContId,
      title: newContestTitle,
      captainId: newContestCaptainId,
      captainName: captain ? captain.name : "Неизвестный",
      teamMemberIds: newContestTeamMemberIds,
      place: newContestPlace.trim() || undefined
    };

    setContests(prev => [...prev, newCont]);
    setNewContestTitle('');
    setNewContestPlace('');
    setNewContestTeamMemberIds([]);
    setShowAddContest(false);

    triggerSystemNotification(`🏆 Объявлен новый конкурс на слёте: "${newCont.title}". Ответственный капитан: ${newCont.captainName}!`);
  };

  // Delete contest
  const deleteContest = (id: string) => {
    setContests(prev => prev.filter(c => c.id !== id));
  };

  // Update contest place
  const updateContestPlace = (id: string, place: string) => {
    setContests(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, place: place || undefined };
      }
      return c;
    }));
  };

  // Update contest captain and mini team members list
  const updateContestTeam = (id: string, captainId: string, teamMemberIds: string[]) => {
    const captain = participants.find(p => p.id === captainId);
    setContests(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          captainId,
          captainName: captain ? captain.name : c.captainName,
          teamMemberIds
        };
      }
      return c;
    }));
  };

  // System notification injected in chat
  const triggerSystemNotification = (text: string) => {
    const sysMsg: ChatMessage = {
      id: "sys_" + Date.now(),
      senderName: "Служба Контроля",
      senderNickname: "system",
      senderPsychotype: "Система",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  // Handler for Admin Login via API
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAdminLoggedIn(true);
        setLoginError('');
        setAdminUsername('');
        setAdminPassword('');
        triggerSystemNotification("🔑 Внимание! Администратор (admin) вошёл в панель управления слётом.");
      } else {
        setLoginError(data.error || "Косяк! Неверный логин или пароль. Логин по умолчанию: admin, пароль: admin");
      }
    } catch (err) {
      setLoginError("Сбой сети! Не удается связаться с сервером.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    triggerSystemNotification("🔒 Администратор вышел из панели управления.");
  };

  // Handler for changing admin password via API
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) {
      setChangePasswordError("Пароль не может быть пустым!");
      setChangePasswordSuccess("");
      return;
    }
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: newAdminPassword
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setChangePasswordSuccess("Пароль успешно изменен!");
        setChangePasswordError("");
        setNewAdminPassword("");
        triggerSystemNotification("🔒 Администратор обновил секретный пароль доступа к панели.");
      } else {
        setChangePasswordError(data.error || "Не удалось изменить пароль.");
        setChangePasswordSuccess("");
      }
    } catch (err) {
      setChangePasswordError("Сбой при отправке запроса на сервер.");
      setChangePasswordSuccess("");
    }
  };

  // Handler for adding a task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignee = participants.find(p => p.id === newTaskAssigneeId);
    const assigneeName = assignee ? assignee.name : "Общий чат";

    const task: TaskItem = {
      id: "t_" + Date.now(),
      title: newTaskTitle,
      assigneeId: newTaskAssigneeId,
      assigneeName,
      deadline: newTaskDeadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isCompleted: false
    };

    setTasks(prev => [...prev, task]);
    setNewTaskTitle('');
    setShowAddTask(false);

    triggerSystemNotification(`🛠️ Назначена новая задача: "${task.title}". Ответственный: ${task.assigneeName}. Срок до: ${task.deadline}`);
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        triggerSystemNotification(nextState 
          ? `✓ Задача выполнена: "${t.title}" (Закрыл: ${t.assigneeName})`
          : `✗ Задача возобновлена: "${t.title}" (Ответственный: ${t.assigneeName})`
        );
        return { ...t, isCompleted: nextState };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Handler for adding to menu
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuDishName.trim()) return;

    const menu: MenuItem = {
      id: "m_at_" + Date.now(),
      day: newMenuDay,
      dishName: newMenuDishName,
      description: newMenuDescription
    };

    setMenuItems(prev => [...prev, menu]);
    setNewMenuDishName('');
    setNewMenuDescription('');
    setShowAddMenu(false);

    triggerSystemNotification(`🍲 Обновлено костровое меню! Добавлено блюдо: "${menu.dishName}" на ${menu.day}.`);
  };

  const deleteMenu = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  // Handler for groceries listing
  const handleAddGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim() || !newGroceryQuantity.trim()) return;

    const grocery: GroceryItem = {
      id: "g_at_" + Date.now(),
      name: newGroceryName,
      quantity: newGroceryQuantity,
      category: newGroceryCategory,
      isBought: false
    };

    setGroceryItems(prev => [...prev, grocery]);
    setNewGroceryName('');
    setNewGroceryQuantity('');
    setShowAddGrocery(false);

    triggerSystemNotification(`🛒 Реестр продуктов пополнен: "${grocery.name}" (${grocery.quantity}).`);
  };

  const toggleGroceryBought = (id: string) => {
    setGroceryItems(prev => prev.map(g => g.id === id ? { ...g, isBought: !g.isBought } : g));
  };

  const deleteGrocery = (id: string) => {
    setGroceryItems(prev => prev.filter(g => g.id !== id));
  };

  // Handler for inventory tracking
  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInventoryName.trim()) return;

    const inventory: InventoryItem = {
      id: "inv_at_" + Date.now(),
      name: newInventoryName,
      condition: newInventoryCondition,
      responsibleName: newInventoryResponsible
    };

    setInventoryItems(prev => [...prev, inventory]);
    setNewInventoryName('');
    setShowAddInventory(false);

    triggerSystemNotification(`📦 Зарегистрировано походное имущество: "${inventory.name}" в состоянии "${inventory.condition}" (Хранитель: ${inventory.responsibleName}).`);
  };

  const updateInventoryCondition = (id: string, newCondition: InventoryCondition) => {
    setInventoryItems(prev => prev.map(inv => {
      if (inv.id === id) {
        triggerSystemNotification(`📦 Внимание! Состояние имущества "${inv.name}" изменилось на: "${newCondition.toUpperCase()}"!`);
        return { ...inv, condition: newCondition };
      }
      return inv;
    }));
  };

  const deleteInventory = (id: string) => {
    setInventoryItems(prev => prev.filter(inv => inv.id !== id));
  };

  // Core function: interact with AI Bot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    const userText = customMessage;
    setCustomMessage('');

    // 1. Add sender message to chat history state
    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      senderName: selectedSender.name,
      senderNickname: selectedSender.nickname,
      senderPsychotype: selectedSender.psychotype,
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };

    setMessages(prev => [...prev, userMsg]);

    const startsWithBot = userText.trim().toLowerCase().startsWith("бот");

    if (!startsWithBot) {
      // The bot ignores general chatter that doesn't start with "Бот"
      return;
    }

    setIsTyping(true);
    setTypingStatus(`Максимка печатает (${selectedSender.psychotype})...`);

    // Prepare context to supply to server-side Gemini Proxy
    try {
      const response = await fetch("/api/bot-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          senderName: selectedSender.name,
          senderNickname: selectedSender.nickname,
          chatHistory: [...messages, userMsg].map(m => ({
            senderName: m.senderName,
            senderNickname: m.senderNickname,
            text: m.text
          })),
          swearingLevel: botConfig.swearingLevel,
          excursions: excursions,
          participants: participants.map(p => ({
            name: p.name,
            nickname: p.nickname,
            birthday: p.birthday
          })),
          debts: participants.map(p => ({
            name: p.name,
            nickname: p.nickname,
            paidAmount: p.paidAmount,
            totalCost: p.totalCost,
            debtAmount: p.debtAmount
          })),
          tasks,
          menuItems,
          groceryItems,
          inventoryItems
        })
      });

      const data = await response.json();

      // Artificial timer effect to seem realistic
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: "bot_" + Date.now(),
          senderName: "Бот Максимка",
          senderNickname: "negodyai_bot",
          senderPsychotype: "ИИ Главный Негодяй",
          text: data.text || "А фиг его знает, бля, что ответить! Давай на сплав ехать!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isBot: true,
          detectedPsychotypeExplanation: data.detectedPsychotypeExplanation || `Подстроился под общение.`,
          adapterStyleUsed: data.adapterStyleUsed || `Угарный походник`,
        };
        
        // Auto-refresh psychotype of sender if detected in real-time
        if (botConfig.autoDetectPsychotype && data.detectedPsychotype) {
          setParticipants(prev => prev.map(p => 
            p.id === selectedSender.id ? { ...p, psychotype: data.detectedPsychotype } : p
          ));
        }

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 700);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  // Calculated ledger metrics
  const totalTargetFunds = participants.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalPaidFunds = participants.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalRemainingDebt = participants.reduce((acc, curr) => acc + curr.debtAmount, 0);
  const totalExcursionCost = excursions.filter(e => e.isActive).reduce((acc, curr) => acc + curr.costPerPerson, 0);
  const unpaidDebtors = participants.filter(p => p.debtAmount > 0).length;

  const currentYear = new Date().getFullYear();
  const foundingYear = botConfig.foundingYear || 2018;
  const teamAgeYears = Math.max(0, currentYear - foundingYear);

  const getYearWord = (years: number) => {
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'лет';
    }
    if (lastDigit === 1) {
      return 'год';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'года';
    }
    return 'лет';
  };
  const yearWord = getYearWord(teamAgeYears);

  const todayBirthdays = participants.filter(p => {
    if (!p.birthday) return false;
    const parts = p.birthday.split('-');
    if (parts.length < 2) return false;
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const todayObj = new Date();
    return m === (todayObj.getMonth() + 1) && d === todayObj.getDate();
  });

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-amber-950 font-sans flex flex-col selection:bg-red-500 selection:text-white pb-8">
      
      {/* HEADER WITH RED SHARP BACKGROUND STYLE */}
      <header className="bg-yellow-400 border-b-6 border-red-600 shadow-lg px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4">
            <div className="relative group cursor-pointer" title="Нажмите, чтобы изменить логотип">
              {customLogo ? (
                <img 
                  src={customLogo} 
                  alt="Пользовательский Логотип" 
                  className="h-12 w-16 bg-white border-2 border-red-500 rounded p-1 shadow-md shrink-0 object-contain transition-all group-hover:opacity-75 group-hover:border-dashed"
                  onError={() => {
                    setCustomLogo(null);
                    localStorage.removeItem('negodyai_custom_logo');
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById('header-logo-file-input');
                    if (fileInput) (fileInput as HTMLInputElement).click();
                  }}
                />
              ) : (
                <div 
                  onClick={() => {
                    const fileInput = document.getElementById('header-logo-file-input');
                    if (fileInput) (fileInput as HTMLInputElement).click();
                  }}
                  className="transition-all group-hover:opacity-75"
                >
                  <Logo size="sm" className="bg-white border-2 border-red-500 rounded p-1 shadow-md shrink-0 cursor-pointer" />
                </div>
              )}
              {/* Pencil icon overlay */}
              <div className="absolute -bottom-1 -right-1 bg-red-650 text-yellow-300 rounded-full p-1 border border-amber-950 shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Edit size={10} className="stroke-[3]" />
              </div>
              <input
                id="header-logo-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      setCustomLogo(base64String);
                      localStorage.setItem('negodyai_custom_logo', base64String);
                      triggerSystemNotification("✨ Логотип успешно изменен!");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-red-600 tracking-tight uppercase flex flex-wrap items-center gap-x-2 gap-y-1 justify-center sm:justify-start leading-none mb-1">
                Туристическая банда <span className="bg-red-600 text-yellow-300 px-2 py-0.5 rounded transform -rotate-2 inline-block text-lg sm:text-xl md:text-2xl font-black">НЕГОДЯИ</span>
                <span className="bg-red-650 text-yellow-300 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-yellow-300 shadow-md transform rotate-1 inline-flex items-center gap-1 shrink-0 select-none animate-pulse">
                  🧭 негодяям {teamAgeYears} {yearWord}
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-red-800 tracking-wide leading-tight">
                ИИ-помощник &laquo;Максимка&raquo; для чата в МАКС мессенджере + Админка походов
              </p>
            </div>
          </div>

          {/* QUICK GENERAL LEDGER BOARD */}
          {isAdminLoggedIn && (
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 bg-[#FFFBEB] p-2 rounded-lg border-3 border-red-600 shadow-inner">
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-black text-amber-700">Всего Собрано</span>
                <span className="text-sm md:text-lg font-black text-emerald-600">{totalPaidFunds.toLocaleString()} ₽</span>
              </div>
              <div className="border-r border-amber-300 hidden md:block" />
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-black text-amber-700">Задолженность</span>
                <span className="text-sm md:text-lg font-black text-red-600">{totalRemainingDebt.toLocaleString()} ₽</span>
              </div>
              <div className="border-r border-amber-300 hidden md:block" />
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-black text-amber-700">Косячников</span>
                <span className="text-sm md:text-lg font-black text-red-600 flex items-center justify-center gap-1">
                  {unpaidDebtors}
                  <AlertCircle size={16} className={unpaidDebtors > 0 ? "animate-bounce text-red-500" : "text-amber-300"} />
                </span>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* DETAILED DOUBLE-COLUMN WORKSPACE */}
      <main className="max-w-7xl mx-auto w-full px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* LEFT COLUMN: ADMIN PANEL (Lg-7 or Lg-12 if not logged in) */}
        <section className={`${isAdminLoggedIn ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col gap-6`} id="admin-panel">
          
          {!isAdminLoggedIn ? (
            <div className="bg-yellow-50 border-4 border-red-500 rounded-3xl p-6 shadow-xl space-y-4 max-w-md mx-auto w-full my-auto self-center">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-red-600 text-yellow-300 rounded-2xl flex items-center justify-center font-black text-3xl shadow-md border-2 border-amber-950 transform rotate-3 select-none">
                  🔑
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-red-600 uppercase tracking-tight">Вход в Админку</h2>
                <p className="text-xs text-amber-900 font-bold">Введите учетные данные организатора слёта</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] sm:text-xs font-black text-red-800 uppercase">Логин:</label>
                  <input
                    type="text"
                    required
                    placeholder="Логин (например: admin)"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-[#FFFBEB] text-[#111] text-xs p-3 rounded-lg border-2 border-amber-400 font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] sm:text-xs font-black text-red-800 uppercase">Пароль:</label>
                  <input
                    type="password"
                    required
                    placeholder="Пароль администратора"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#FFFBEB] text-[#111] text-xs p-3 rounded-lg border-2 border-amber-400 font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                {loginError && (
                  <div className="bg-red-100 border-2 border-red-500 rounded-xl p-3 text-red-800 text-xs font-bold leading-relaxed">
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs py-3 rounded-xl border-2 border-amber-950 shadow-md transition-transform transform active:scale-95 uppercase tracking-wider"
                >
                  Войти как Организатор
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* TAB SYSTEM NAVIGATION WITH LOGOUT */}
              <div className="flex flex-col sm:flex-row gap-2 bg-amber-100 p-2 rounded-2xl border-3 border-red-500 shadow-sm items-stretch sm:items-center">
                <nav className="flex-grow flex flex-wrap gap-1">
                  {(['settings', 'tasks', 'menu', 'inventory', 'contests'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveAdminTab(tab)}
                      className={`flex-1 min-w-[100px] text-center py-2 px-1 text-xs font-black uppercase rounded-xl transition-all ${
                        activeAdminTab === tab 
                          ? 'bg-red-600 text-yellow-300 shadow-md transform scale-[1.02]' 
                          : 'text-amber-900 hover:bg-amber-200'
                      }`}
                    >
                      {tab === 'settings' ? '⚙️ Параметры' : 
                       tab === 'tasks' ? '🛠️ Задачи слёта' : 
                       tab === 'menu' ? '🍲 Меню и Продукты' : 
                       tab === 'inventory' ? '📦 Инвентарь' :
                       '🏆 Конкурсы'}
                    </button>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="bg-amber-200 hover:bg-red-650 hover:text-white text-red-700 hover:border-red-650 transition-all font-black text-xs uppercase px-4 py-2.5 rounded-xl border-2 border-red-400 shrink-0"
                >
                  Выйти 🚪
                </button>
              </div>

          {/* TAB CONTENT: SETTINGS (Includes configuration, excursions, and debt register) */}
          {activeAdminTab === 'settings' && (
            <div className="flex flex-col gap-6">
              
              {/* BOT CONFIG SECTION COEFFS */}
              <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md pr-6">
                <h2 className="text-xl font-black text-red-600 uppercase flex items-center gap-2 mb-4">
                  <Settings size={22} className="text-red-600" />
                  Коэффициенты и Тональность ИИ
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-black text-red-800 mb-1">
                      Уровень матершинных слов (для ИИ):
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-[#FFFBEB] border-2 border-amber-400 rounded-lg p-1">
                      {(['low', 'medium', 'high'] as const).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setBotConfig(prev => ({ ...prev, swearingLevel: lvl }))}
                          className={`text-xs font-bold py-1.5 px-1 rounded transition-colors uppercase ${
                            botConfig.swearingLevel === lvl
                              ? 'bg-red-600 text-yellow-300 font-extrabold shadow-md'
                              : 'text-amber-800 hover:bg-yellow-200'
                          }`}
                        >
                          {lvl === 'low' ? 'Мягкий' : lvl === 'medium' ? 'Сочный' : 'Покос'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1 leading-tight font-medium">
                      {botConfig.swearingLevel === 'low' && 'Без мата. ИИ будет обзывать любя: "засранцы", "косячники".'}
                      {botConfig.swearingLevel === 'medium' && 'Умеренное дружеское использование (бля, пиздец, нахуй).'}
                      {botConfig.swearingLevel === 'high' && 'Максимальный угар. Сочные народные ругательства, юмор у костра.'}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-2.5">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={botConfig.autoDetectPsychotype}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, autoDetectPsychotype: e.target.checked }))}
                          className="w-4 h-4 text-red-600 border-2 border-red-500 rounded accent-red-600"
                        />
                        <span className="text-xs font-black text-red-800 uppercase">
                          Автодетект Психотипа
                        </span>
                      </label>
                      <p className="text-[10px] text-amber-700 leading-tight mt-1 font-medium">
                        ИИ автоматически распознает манеру речи говорящего и обновит его профиль.
                      </p>
                    </div>

                    <div className="bg-[#FFFDBB]/70 p-2.5 rounded-lg border-2 border-amber-300">
                      <label className="block text-[10px] uppercase font-black text-red-800 mb-1">
                        🎂 Год основания команды:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1980"
                          max={currentYear}
                          value={botConfig.foundingYear || 2018}
                          onChange={(e) => {
                            const yearVal = Math.min(currentYear, Math.max(1980, Number(e.target.value) || 2018));
                            setBotConfig(prev => ({ ...prev, foundingYear: yearVal }));
                          }}
                          className="bg-white text-amber-955 border-2 border-amber-400 rounded px-2 py-0.5 text-xs font-black w-20 text-center focus:outline-none focus:border-red-600"
                        />
                        <span className="text-[10px] text-amber-900 font-extrabold">
                          Негодяям <span className="text-red-700 font-black text-xs">{teamAgeYears}</span> {yearWord}!
                        </span>
                      </div>
                    </div>
                    
                    {botConfig.swearingLevel === 'high' && (
                      <div className="bg-red-100 border-2 border-red-400 rounded-lg p-1.5 flex items-start gap-1.5">
                        <ShieldAlert size={14} className="text-red-600 shrink-0 mt-0.5 animate-pulse" />
                        <span className="text-[9px] text-red-800 font-bold leading-tight uppercase">
                          Внимание: включена полная матерная выдача! Будьте готовы к порции походной правды!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LOGO CUSTOMIZATION COMPONENT */}
                <div className="border-t-2 border-dashed border-amber-300 pt-4 mt-4">
                  <label className="block text-xs uppercase font-black text-red-800 mb-2">
                    Настройка Логотипа Админ Панели:
                  </label>
                  <p className="text-[10px] text-amber-700 font-semibold mb-2 leading-tight">
                    Позволяет заменить стандартный логотип на свою картинку (сохраняется у вас в браузере).
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-yellow-101/50 p-3 rounded-xl border border-amber-300">
                    <div className="shrink-0 bg-white border-2 border-red-500 rounded p-1 shadow-md w-16 h-12 flex items-center justify-center relative overflow-hidden">
                      {customLogo ? (
                        <img src={customLogo} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">⛺</span>
                      )}
                    </div>
                    <div className="flex-grow w-full space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Вставьте ссылку на картинку логотипа (URL)"
                          value={logoInputUrl}
                          onChange={(e) => setLogoInputUrl(e.target.value)}
                          className="flex-grow bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (logoInputUrl.trim()) {
                              setCustomLogo(logoInputUrl.trim());
                              localStorage.setItem('negodyai_custom_logo', logoInputUrl.trim());
                              setLogoInputUrl('');
                              triggerSystemNotification("✨ Логотип успешно заменен по ссылке!");
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs px-3 py-1 rounded border border-amber-950 transition-colors"
                        >
                          ОК
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <label className="bg-amber-300 hover:bg-amber-400 text-amber-950 px-2.5 py-1 rounded text-xs font-bold border border-amber-500 cursor-pointer shrink-0 transition-colors">
                          📁 Выбрать файл на ПК
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64String = reader.result as string;
                                  setCustomLogo(base64String);
                                  localStorage.setItem('negodyai_custom_logo', base64String);
                                  triggerSystemNotification("✨ Собственный логотип успешно загружен!");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {customLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLogo(null);
                              localStorage.removeItem('negodyai_custom_logo');
                              triggerSystemNotification("✨ Логотип возвращён к стандартному ⛺");
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold hover:underline text-[11px]"
                          >
                            ❌ Сбросить логотип
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHANGE ADMIN PASSWORD SECTION */}
              <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md pr-6">
                <h2 className="text-xl font-black text-red-600 uppercase flex items-center gap-2 mb-4">
                  <Lock size={22} className="text-red-600" />
                  Безопасность и смена пароля
                </h2>
                
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase font-black text-red-800 mb-1">
                      Новый пароль администратора:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Введите новый пароль"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="bg-[#FFFBEB] text-[#111] text-xs p-2.5 rounded-lg border-2 border-amber-400 font-bold focus:outline-none focus:border-red-500 flex-grow"
                      />
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs px-5 py-2 rounded-lg border border-amber-950 transition-colors uppercase shrink-0"
                      >
                        Изменить пароль
                      </button>
                    </div>
                  </div>
                  {changePasswordError && (
                    <p className="text-red-600 font-bold text-xs">{changePasswordError}</p>
                  )}
                  {changePasswordSuccess && (
                    <p className="text-emerald-600 font-bold text-xs">{changePasswordSuccess}</p>
                  )}
                </form>
              </div>

            {/* NEW EXCURSION FORM popup */}
            {showAddExcursion && (
              <form onSubmit={handleAddExcursion} className="bg-yellow-200 border-3 border-dashed border-red-500 rounded-xl p-3 mb-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-red-800">Заполнение нового тура, сплава или похода:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Название (например, Поход на скалы)"
                    value={newExcursion.title}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Локация"
                    required
                    value={newExcursion.location}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="date"
                    value={newExcursion.date}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-amber-800">С парней (₽):</label>
                      <input
                        type="number"
                        required
                        value={newExcursion.costBoys}
                        onChange={(e) => setNewExcursion(prev => ({ ...prev, costBoys: Number(e.target.value) }))}
                        className="w-full bg-[#FFFBEB] text-blue-900 border-2 border-amber-400 rounded px-1.5 py-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-amber-800">С девчонок (₽):</label>
                      <input
                        type="number"
                        required
                        value={newExcursion.costGirls}
                        onChange={(e) => setNewExcursion(prev => ({ ...prev, costGirls: Number(e.target.value) }))}
                        className="w-full bg-[#FFFBEB] text-pink-905 border-2 border-amber-400 rounded px-1.5 py-1 text-xs font-black"
                      />
                    </div>
                  </div>
                </div>
                <textarea
                  placeholder="Дополнительный угарный комментарий / снаряжение"
                  value={newExcursion.description}
                  onChange={(e) => setNewExcursion(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold h-12 focus:outline-none focus:border-red-505"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddExcursion(false)}
                    className="px-3 py-1 bg-amber-300 hover:bg-amber-400 rounded font-bold text-amber-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-650 hover:bg-red-750 text-yellow-300 font-bold rounded"
                  >
                    Сохранить тур/поход
                  </button>
                </div>
              </form>
            )}

            {/* EXCURSIONS ROWS LISTED OR EDITED */}
            <div className="space-y-3">
              {excursions.map(excursion => {
                const isEditing = editingExcursionId === excursion.id;
                
                if (isEditing && editingExcursionData) {
                  return (
                    <form 
                      key={excursion.id} 
                      onSubmit={handleSaveExcursionEdit}
                      className="bg-yellow-100 border-3 border-amber-400 rounded-xl p-3 space-y-2 text-xs"
                    >
                      <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase block w-max mb-1">
                        Редактирование Тура
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-black text-amber-900 uppercase">Название:</label>
                          <input
                            type="text"
                            required
                            value={editingExcursionData.title}
                            onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                            className="w-full bg-white text-amber-955 border-2 border-amber-350 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-amber-900 uppercase">Локация:</label>
                          <input
                            type="text"
                            required
                            value={editingExcursionData.location}
                            onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
                            className="w-full bg-white text-amber-955 border-2 border-amber-350 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-amber-900 uppercase">Дата:</label>
                          <input
                            type="date"
                            value={editingExcursionData.date}
                            onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                            className="w-full bg-white text-amber-955 border-2 border-amber-350 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <label className="block text-[8px] font-black text-blue-900 uppercase">Мужской взнос (₽):</label>
                            <input
                              type="number"
                              required
                              value={editingExcursionData.costBoys ?? excursion.costPerPerson}
                              onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, costBoys: Number(e.target.value) }) : null)}
                              className="w-full bg-white text-blue-955 border-2 border-amber-350 rounded px-1.5 py-1 text-xs font-black text-right"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-pink-905 uppercase">Женский взнос (₽):</label>
                            <input
                              type="number"
                              required
                              value={editingExcursionData.costGirls ?? Math.round(excursion.costPerPerson * 0.7)}
                              onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, costGirls: Number(e.target.value) }) : null)}
                              className="w-full bg-white text-pink-955 border-2 border-amber-350 rounded px-1.5 py-1 text-xs font-black text-right"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-amber-905 uppercase">Доп. описание:</label>
                        <textarea
                          value={editingExcursionData.description}
                          onChange={(e) => setEditingExcursionData(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                          className="w-full bg-white text-amber-955 border-2 border-amber-350 rounded px-2 py-1 text-xs font-bold h-12"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingExcursionId(null)}
                          className="px-2 py-1 bg-amber-250 hover:bg-amber-300 text-amber-900 font-extrabold rounded"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded"
                        >
                          Сохранить изменения
                        </button>
                      </div>
                    </form>
                  );
                }

                const excursionBoysCost = excursion.costBoys ?? excursion.costPerPerson;
                const excursionGirlsCost = excursion.costGirls ?? Math.round(excursion.costPerPerson * 0.7);

                return (
                  <div 
                    key={excursion.id}
                    className={`border-3 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      excursion.isActive 
                        ? 'bg-yellow-100 border-red-500' 
                        : 'bg-amber-100/60 border-amber-300 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⛺</span>
                        <h4 className="font-extrabold text-amber-955 text-sm sm:text-base leading-snug">
                          {excursion.title}
                        </h4>
                        {excursion.isActive ? (
                          <span className="bg-red-600 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                            Сбор взносов
                          </span>
                        ) : (
                          <span className="bg-amber-400 text-amber-900 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                            Архив
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-amber-800 mt-1 font-semibold flex items-center gap-1.5">
                        <span className="bg-yellow-300 px-1 rounded text-red-700 font-extrabold">{excursion.date}</span> | 📍 {excursion.location}
                      </p>
                      {excursion.description && (
                        <p className="text-[11px] text-amber-700/90 mt-1 leading-snug bg-[#FFFBEB]/50 p-1 rounded">
                          {excursion.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right sm:mr-2 space-y-0.5 shrink-0">
                        <span className="block text-[8px] uppercase font-black text-blue-700">♂️ Парни: <span className="font-extrabold">{excursionBoysCost.toLocaleString()} ₽</span></span>
                        <span className="block text-[8px] uppercase font-black text-pink-700">♀️ Девчонки: <span className="font-extrabold">{excursionGirlsCost.toLocaleString()} ₽</span></span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditExcursion(excursion)}
                          className="p-1.5 rounded bg-yellow-300 hover:bg-yellow-400 border border-amber-500 text-amber-955"
                          title="Редактировать тур"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => toggleExcursion(excursion.id)}
                          className={`p-1 rounded border-2 text-[10px] font-black uppercase ${
                            excursion.isActive 
                              ? 'bg-amber-300 hover:bg-amber-400 text-amber-900 border-amber-500' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                          }`}
                          title={excursion.isActive ? "Отправить в архив" : "Активировать"}
                        >
                          {excursion.isActive ? 'В архив' : 'Вкл'}
                        </button>
                        <button
                          onClick={() => deleteExcursion(excursion.id)}
                          className="p-1.5 rounded bg-red-105 hover:bg-red-200 border border-red-300 text-red-650"
                          title="Удалить сбор"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-red-600 uppercase flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                Таблица Взносов и Долгов Команды
              </h3>
              <button
                onClick={() => setShowAddParticipant(!showAddParticipant)}
                className="bg-red-600 hover:bg-red-700 text-yellow-300 p-2 rounded-lg border-2 border-amber-900 font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow"
              >
                <Plus size={14} />
                Добавить Негодяя
              </button>
            </div>

            {/* ADD NEGODYA PARTICIPANT FORM */}
            {showAddParticipant && (
              <form onSubmit={handleAddParticipant} className="bg-yellow-200 border-3 border-dashed border-red-500 rounded-xl p-3 mb-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-red-800">Регистрация в банде Негодяев:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Человеческое Имя (Саня)"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Никнейм в МАКС (@sanya)"
                    value={newParticipant.nickname}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, nickname: e.target.value }))}
                    className="bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Куражный Психотип:</label>
                    <select
                      value={newParticipant.psychotype}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchType = PSYCHOTYPES.find(pt => pt.name === val);
                        setNewParticipant(prev => ({
                          ...prev,
                          psychotype: val,
                          avatar: matchType ? matchType.emoji : prev.avatar
                        }));
                      }}
                      className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded p-1 text-xs font-bold"
                    >
                      {PSYCHOTYPES.map(pt => (
                        <option key={pt.name} value={pt.name}>
                          {pt.emoji} {pt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Пол (определяет тариф):</label>
                    <select
                      value={newParticipant.gender}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                      className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded p-1 text-xs font-bold"
                    >
                      <option value="male">🧑‍♂️ Парниша (Мужской взнос)</option>
                      <option value="female">👩‍🦰 Девчуля (Женский взнос - Скидка!)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Аватар (Эмодзи):</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={newParticipant.avatar}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, avatar: e.target.value }))}
                      className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Сколько уже сдал (руб):</label>
                    <input
                      type="number"
                      value={newParticipant.paidAmount}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                      className="w-full bg-[#FFFBEB] text-[#78350F] border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">День Рождения (🎂):</label>
                    <input
                      type="date"
                      value={newParticipant.birthday}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full bg-[#FFFBEB] text-[#78350F] border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">📅 Год первого похода:</label>
                    <input
                      type="number"
                      min="1980"
                      max={new Date().getFullYear()}
                      value={newParticipant.joinedYear}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, joinedYear: Number(e.target.value) || new Date().getFullYear() }))}
                      className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">🚫 Пропущенные годы (через запятую):</label>
                    <input
                      type="text"
                      placeholder="Например: 2020, 2022"
                      value={newParticipant.skippedYears}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, skippedYears: e.target.value }))}
                      className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-400 rounded px-2.5 py-1 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipant(false)}
                    className="px-3 py-1 bg-amber-300 hover:bg-amber-400 rounded font-bold text-amber-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-650 hover:bg-red-700 rounded text-yellow-300 font-bold"
                  >
                    Принять в банду
                  </button>
                </div>
              </form>
            )}

            {/* LEDGER GRID OF PARTICIPANTS */}
            <div className="overflow-x-auto rounded-lg border-2 border-amber-300">
              <table className="w-full text-left text-xs text-amber-950 bg-white border-collapse">
                <thead className="bg-yellow-400 uppercase text-amber-950 font-black border-b-2 border-red-500">
                  <tr>
                    <th className="p-2.5">Негодяй</th>
                    <th className="p-2.5">Психотип</th>
                    <th className="p-2.5 w-32">Внесено</th>
                    <th className="p-2.5 w-36">🎂 Днюха</th>
                    <th className="p-2.5">Задолженность</th>
                    <th className="p-2.5 text-center">Пнуть</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {participants.map(p => (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-yellow-50/50">
                        <td className="p-2.5 flex items-center gap-1.5 font-extrabold text-amber-955">
                          <span className="text-sm bg-amber-100 p-1 rounded border border-amber-300">{p.avatar}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <span>{p.name}</span>
                              <button
                                type="button"
                                onClick={() => setExpandedYearsId(expandedYearsId === p.id ? null : p.id)}
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5 border select-none transition-all ${
                                  expandedYearsId === p.id 
                                    ? 'bg-red-600 text-yellow-300 border-red-700 font-bold scale-105 shadow-sm' 
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                                }`}
                                title="Редактировать года активности"
                              >
                                🏕️ {getTeamYearsText(p.joinedYear, p.skippedYears)} {expandedYearsId === p.id ? '✕' : '⚙️'}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-amber-600">@{p.nickname}</span>
                              <select
                                value={p.gender || 'male'}
                                onChange={(e) => updateGender(p.id, e.target.value as 'male' | 'female')}
                                className="bg-[#FFFBEB] hover:bg-yellow-100 text-amber-955 text-[9px] font-black border border-amber-300 rounded px-1 py-0.5 cursor-pointer focus:outline-none focus:border-red-500"
                              >
                                <option value="male">🧑‍♂️ Парниша (Муж)</option>
                                <option value="female">👩‍🦰 Девчуля (Жен)</option>
                              </select>
                              <span className="text-[8.5px] font-normal text-amber-500">(с {p.joinedYear} г.)</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.psychotype === 'Душнила-контролёр' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            p.psychotype === 'Паникёр-истерик' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            p.psychotype === 'Бунтарь-анархист' ? 'bg-red-100 text-red-800 border border-red-200' :
                            p.psychotype === 'Тихий философ' ? 'bg-orange-100 text-orange-850 border border-orange-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {p.psychotype}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={p.paidAmount}
                              onChange={(e) => updatePayment(p.id, Number(e.target.value))}
                              className="bg-yellow-100/50 hover:bg-yellow-50 focus:bg-white text-emerald-700 font-extrabold border-2 border-amber-300 rounded px-1 py-0.5 w-16 text-right"
                            />
                            <span className="text-[10px] text-amber-500 uppercase font-black">из {p.totalCost}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="date"
                            value={p.birthday || ''}
                            onChange={(e) => updateBirthday(p.id, e.target.value)}
                            className="bg-[#FFFBEB] hover:bg-yellow-50 focus:bg-white text-amber-955 border-2 border-amber-300 font-bold rounded px-1.5 py-0.5 w-28 text-center text-xs"
                          />
                        </td>
                        <td className="p-2.5 font-extrabold text-right">
                          {p.debtAmount > 0 ? (
                            <span className="text-red-650 font-black flex items-center justify-end gap-1">
                              -{p.debtAmount.toLocaleString()} ₽
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center justify-end gap-1">
                              Оплачено! <CheckCircle size={12} />
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedSender(p);
                                const funnyNudges = [
                                  "Але, где мои сбережения?!",
                                  "Где бабки?? Чат не резиновый!",
                                  "Что там по долгам за поход?",
                                  "Косячу по оплате счетов, бот ответь!",
                                  "Глянь в таблицу Excel, там п**дец!"
                                ];
                                const randomNudge = funnyNudges[Math.floor(Math.random() * funnyNudges.length)];
                                setCustomMessage(randomNudge);
                                // Scroll into view of the typewriter form
                                document.getElementById("chat-form-section")?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-xs p-1 bg-amber-400 hover:bg-amber-500 border border-amber-600 rounded text-amber-950 font-black uppercase"
                              title="Стимулировать в чате"
                            >
                              💬 Пнуть
                            </button>
                            <button
                              onClick={() => deleteParticipant(p.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-105 p-1 rounded"
                              title="Изгнать из команды"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedYearsId === p.id && (
                        <tr className="bg-amber-50/70">
                          <td colSpan={6} className="p-3 border-y border-amber-300 box-border text-[11px]">
                            <div className="flex flex-col gap-3 p-3 bg-yellow-100/40 border-2 border-dashed border-amber-400 rounded-xl">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-1.5">
                                <span className="font-extrabold text-amber-950 uppercase text-[10px] block">
                                  🧭 Настройка стажа Негодяя: <strong className="text-red-700">{p.name}</strong>
                                </span>
                                <span className="bg-emerald-650 text-yellow-300 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase border border-yellow-300 shadow-sm animate-pulse">
                                  🏕️ {getTeamYearsText(p.joinedYear, p.skippedYears)} в банде
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-3">
                                  <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">📅 Год первого похода:</label>
                                  <input
                                    type="number"
                                    min="1980"
                                    max={new Date().getFullYear()}
                                    value={p.joinedYear || 2018}
                                    onChange={(e) => updateJoinedYear(p.id, Number(e.target.value))}
                                    className="w-full bg-white border border-amber-400 rounded p-1.5 text-xs font-black text-amber-955 text-center focus:outline-none focus:border-red-600"
                                  />
                                </div>
                                <div className="md:col-span-5">
                                  <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">🚫 Пропущенные слёты ({p.skippedYears?.length || 0}):</label>
                                  <div className="flex flex-wrap gap-1 items-center bg-[#FFFBEB] p-1.5 border border-amber-350 rounded-lg min-h-[34px] w-full">
                                    {(!p.skippedYears || p.skippedYears.length === 0) ? (
                                      <span className="text-[10px] text-amber-600 font-bold px-1 italic">Ходит стабильно каждый год! 🙌</span>
                                    ) : (
                                      p.skippedYears.map(yr => (
                                        <span key={yr} className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-1 border border-red-200">
                                          {yr}
                                          <button type="button" onClick={() => removeSkippedYear(p.id, yr)} className="text-red-650 hover:text-red-900 font-black text-[9px]">✕</button>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                                <div className="md:col-span-4">
                                  <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">➕ Записать пропустивший год:</label>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const input = form.elements.namedItem('skippedYearInput') as HTMLInputElement;
                                    const val = parseInt(input.value, 10);
                                    const jYear = p.joinedYear || 2018;
                                    const currentYear = new Date().getFullYear();
                                    if (val >= jYear && val <= currentYear) {
                                      addSkippedYear(p.id, val);
                                      input.value = '';
                                    } else {
                                      alert(`Год должен быть не раньше года прихода (${jYear}) и не позднее ${currentYear}!`);
                                    }
                                  }} className="flex gap-1">
                                    <input
                                      type="number"
                                      name="skippedYearInput"
                                      min={p.joinedYear || 2018}
                                      max={new Date().getFullYear()}
                                      placeholder="Год"
                                      className="bg-white border border-amber-400 rounded p-1.5 text-xs font-bold w-18 text-center focus:outline-none focus:ring-1 focus:ring-red-600"
                                    />
                                    <button type="submit" className="flex-grow bg-red-600 hover:bg-red-700 text-yellow-300 px-3 py-1 text-xs font-black uppercase rounded border border-red-700">Внести</button>
                                  </form>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 border-t border-amber-200 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedYearsId(null)}
                                  className="text-[10px] font-black uppercase bg-amber-300 hover:bg-amber-400 text-amber-950 border border-amber-500 px-3 py-1 rounded"
                                >
                                  Готово ✔️
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-amber-700 leading-tight mt-2 italic font-semibold">
              * Сметная задолженность рассчитывается индивидуально для каждого Негодяя на основе общего прайса подключённых туров, сплавов или походов и его внесённых взносов. Пинайте должников вовремя!
            </p>
          </div>
        </div>
      )}

        {/* TAB CONTENT: TASKS */}
        {activeAdminTab === 'tasks' && (
          <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md space-y-4">
            <div className="flex justify-between items-center border-b-2 border-red-500 pb-2">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-red-650 uppercase flex items-center gap-2">
                  <Settings size={20} className="text-red-600" />
                  Походные Наряды и Задачи
                </h3>
                <p className="text-xs font-semibold text-amber-800">Назначение ответственных и сроков контролируется Душнилой</p>
              </div>
              <button 
                onClick={() => setShowAddTask(!showAddTask)} 
                className="bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs uppercase px-3 py-1.5 rounded-lg border-2 border-amber-900 transition-all shadow shrink-0"
              >
                {showAddTask ? 'Свернуть' : '+ Новая задача'}
              </button>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="bg-yellow-200 border-3 border-dashed border-red-500 p-3 rounded-xl space-y-3">
                <h4 className="text-xs font-black uppercase text-red-800">Добавить поручение:</h4>
                <input 
                  type="text" 
                  required 
                  placeholder="Что сделать (починить генератор, взять палатки)" 
                  value={newTaskTitle} 
                  onChange={(e) => setNewTaskTitle(e.target.value)} 
                  className="w-full p-2 bg-[#FFFBEB] text-xs font-bold rounded border-2 border-amber-400 text-amber-950 placeholder-amber-700/60" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Кто отдувается:</label>
                    <select 
                      value={newTaskAssigneeId} 
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)} 
                      className="bg-[#FFFBEB] text-xs p-1.5 rounded border-2 border-amber-400 text-amber-950 font-bold w-full"
                    >
                      <option value="">Весь табор</option>
                      {participants.map(p => <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Времени до:</label>
                    <input 
                      type="date" 
                      value={newTaskDeadline} 
                      onChange={(e) => setNewTaskDeadline(e.target.value)} 
                      className="bg-[#FFFBEB] text-xs p-1 rounded border-2 border-amber-400 text-amber-950 font-bold w-full" 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black py-2 rounded-lg transition-colors border border-amber-950 uppercase shadow">Выдать наряд</button>
              </form>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-xs font-bold text-amber-700 italic text-center py-4 bg-[#FFFBEB] rounded-xl border border-amber-300">Задач пока нет. Свобода негодяям!</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className={`p-3 rounded-xl border-3 flex items-start gap-3 justify-between text-xs bg-white ${t.isCompleted ? 'opacity-70 bg-emerald-50 border-emerald-300 line-through' : 'border-amber-300 shadow-xs'}`}>
                    <div className="flex items-start gap-2.5">
                      <input 
                        type="checkbox" 
                        checked={t.isCompleted} 
                        onChange={() => toggleTaskCompleted(t.id)} 
                        className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0" 
                      />
                      <div>
                        <span className="font-extrabold text-amber-955 text-sm">{t.title}</span>
                        <div className="text-[10px] font-black text-amber-700 mt-1 uppercase">👤 Дежурный: <span className="text-red-700">{t.assigneeName}</span> | ⏰ дедлайн: <span className="bg-yellow-200 px-1.5 py-0.5 rounded border border-amber-300 ml-1">{t.deadline}</span></div>
                      </div>
                    </div>
                    <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-700 font-extrabold text-xs bg-red-50 hover:bg-red-100 p-1.5 rounded border border-red-200 transition-colors shrink-0">🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* TAB CONTENT: MENU */}
        {activeAdminTab === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* COOSTROVOE MENU */}
            <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md flex flex-col gap-3">
              <div className="flex justify-between items-center border-b-2 border-amber-300 pb-2">
                <span className="text-sm sm:text-base font-black text-red-650 uppercase">🍲 Костровое Меню</span>
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)} 
                  className="bg-red-650 hover:bg-red-700 text-yellow-300 text-xs px-2.5 py-1.5 rounded uppercase font-black"
                >
                  {showAddMenu ? 'Свернуть' : '+ Добавить'}
                </button>
              </div>
              {showAddMenu && (
                <form onSubmit={handleAddMenu} className="bg-yellow-250 p-3 rounded-xl gap-2 flex flex-col border-2 border-red-400">
                  <input type="text" required placeholder="День 1. Обед" value={newMenuDay} onChange={(e) => setNewMenuDay(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold" />
                  <input type="text" required placeholder="Борщ из 5 банок тушёнки" value={newMenuDishName} onChange={(e) => setNewMenuDishName(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold" />
                  <input type="text" placeholder="Угарное описание блюда" value={newMenuDescription} onChange={(e) => setNewMenuDescription(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold" />
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black py-1.5 rounded uppercase">Добавить в меню</button>
                </form>
              )}
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {menuItems.map(m => (
                  <div key={m.id} className="bg-white p-3 border-2 border-amber-200 rounded-xl relative shadow-xs">
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 border border-red-200 rounded font-black block w-max uppercase mb-1">{m.day}</span>
                    <strong className="text-xs text-amber-955 block leading-tight">{m.dishName}</strong>
                    <p className="text-[10px] italic leading-tight text-amber-800 mt-1">{m.description}</p>
                    <button onClick={() => deleteMenu(m.id)} className="absolute top-2 right-2 text-red-500 text-xs font-bold bg-red-50 hover:bg-red-100 p-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* GROCERIES */}
            <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md flex flex-col gap-3">
              <div className="flex justify-between items-center border-b-2 border-amber-300 pb-2">
                <span className="text-sm sm:text-base font-black text-red-650 uppercase">🛒 Сметные Продукты</span>
                <button 
                  onClick={() => setShowAddGrocery(!showAddGrocery)} 
                  className="bg-red-650 hover:bg-red-700 text-yellow-300 text-xs px-2.5 py-1.5 rounded uppercase font-black"
                >
                  {showAddGrocery ? 'Свернуть' : '+ Продукт'}
                </button>
              </div>
              {showAddGrocery && (
                <form onSubmit={handleAddGrocery} className="bg-yellow-250 p-3 rounded-xl gap-2 flex flex-col border-2 border-red-400">
                  <input type="text" required placeholder="Гречка, Ром, Тушняк" value={newGroceryName} onChange={(e) => setNewGroceryName(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold" />
                  <input type="text" required placeholder="Кол-во: 5кг, 24шт" value={newGroceryQuantity} onChange={(e) => setNewGroceryQuantity(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold" />
                  <select value={newGroceryCategory} onChange={(e) => setNewGroceryCategory(e.target.value)} className="bg-white text-xs p-1.5 border border-amber-300 rounded font-bold">
                    <option value="Еда">🍔 Еда</option>
                    <option value="Расходники">🔥 Расходники</option>
                    <option value="Жидкая валюта">🥃 Жидкая валюта</option>
                  </select>
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black py-1.5 rounded uppercase">Записать продукт</button>
                </form>
              )}
              <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                {groceryItems.map(g => (
                  <div key={g.id} className={`p-2.5 border-2 rounded-xl flex items-center justify-between text-xs bg-white ${g.isBought ? 'bg-emerald-50 text-amber-955/65 line-through italic border-emerald-300' : 'border-amber-250'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <input type="checkbox" checked={g.isBought} onChange={() => toggleGroceryBought(g.id)} className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0" />
                      <span className="font-extrabold text-amber-955 truncate leading-tight">{g.name} <span className="text-[10px] block opacity-75 font-black uppercase text-amber-600">⚖️ {g.quantity} | {g.category}</span></span>
                    </div>
                    <button onClick={() => deleteGrocery(g.id)} className="text-red-500 font-extrabold text-xs bg-red-50 hover:bg-red-100 p-1.5 rounded shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: INVENTORY */}
        {activeAdminTab === 'inventory' && (
          <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md space-y-4">
            <div className="flex justify-between items-center border-b-2 border-red-500 pb-2">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-red-650 uppercase flex items-center gap-2">
                  <Settings size={20} className="text-red-600" />
                  Общая Снаряга и Имущество
                </h3>
                <p className="text-xs font-semibold text-amber-800 pb-0.5">Вносите имущество и отслеживайте его весёлое походное состояние</p>
              </div>
              <button 
                onClick={() => setShowAddInventory(!showAddInventory)} 
                className="bg-red-650 hover:bg-red-700 text-yellow-300 text-xs px-2.5 py-1.5 rounded uppercase font-black shrink-0"
              >
                {showAddInventory ? 'Свернуть' : '+ Новая снаряга'}
              </button>
            </div>
            {showAddInventory && (
              <form onSubmit={handleAddInventory} className="bg-yellow-200 border-3 border-dashed border-red-500 p-3 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Имущество:</label>
                    <input type="text" required placeholder="Казан, Генератор, Тент" value={newInventoryName} onChange={(e) => setNewInventoryName(e.target.value)} className="bg-white text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-950" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Состояние:</label>
                    <select value={newInventoryCondition} onChange={(e) => setNewInventoryCondition(e.target.value as InventoryCondition)} className="bg-white text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-950">
                      <option value="нормальное">Реально нормальное ✅</option>
                      <option value="пришло в негодность">Пришло в негодность 🔧</option>
                      <option value="пробухали нахер всё">Пробухали нахер всё 🍻</option>
                      <option value="проёбано на слёте">Проёбано на слёте ⛺</option>
                      <option value="утонало к херам">Утонало к херам 🌊</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Ответственное лицо:</label>
                  <input type="text" placeholder="Кто хранит (напр Саня)" value={newInventoryResponsible} onChange={(e) => setNewInventoryResponsible(e.target.value)} className="bg-white text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-950" />
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black py-2 rounded-lg transition-colors border border-amber-955 uppercase shadow">Внести в ведомость</button>
              </form>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
              {inventoryItems.map(inv => (
                <div key={inv.id} className="bg-white border-2 border-amber-250 p-3 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex justify-between items-center border-b pb-1 mb-1.5 gap-2">
                      <span className="font-extrabold text-amber-955 text-sm truncate">🔹 {inv.name}</span>
                      <button onClick={() => deleteInventory(inv.id)} className="text-red-500 font-black text-xs hover:bg-red-100 p-1 rounded shrink-0">✕</button>
                    </div>
                    <div className="text-[11px] text-amber-700 font-bold">👤 Хранитель: {inv.responsibleName}</div>
                  </div>
                  <div className="mt-2 text-[10px]">
                    <span className="text-[9px] font-black text-red-700 uppercase block mb-1">Статус/Состояние:</span>
                    <select
                      value={inv.condition} 
                      onChange={(e) => updateInventoryCondition(inv.id, e.target.value as InventoryCondition)}
                      className={`w-full text-xs font-black p-1 border rounded cursor-pointer ${
                        inv.condition === 'нормальное' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        inv.condition === 'пришло в негодность' ? 'bg-yellow-100 text-amber-800 border-amber-300' :
                        inv.condition === 'пробухали нахер всё' ? 'bg-orange-100 text-orange-850 animate-pulse border-orange-300' :
                        inv.condition === 'проёбано на слёте' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="нормальное">Реально нормальное ✅</option>
                      <option value="пришло в негодность">Пришло в негодность 🔧</option>
                      <option value="пробухали нахер всё">Пробухали нахер всё 🍻</option>
                      <option value="проёбано на слёте">Проёбано на слёте ⛺</option>
                      <option value="утонало к херам">Утонало к херам 🌊</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: CONTESTS */}
        {activeAdminTab === 'contests' && (
          <div className="bg-yellow-50 border-4 border-red-500 rounded-2xl p-4 shadow-md space-y-4">
            <div className="flex justify-between items-center border-b-2 border-red-500 pb-2">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-red-650 uppercase flex items-center gap-2">
                  🏆 Таблица Конкурсов на слёте
                </h3>
                <p className="text-xs font-semibold text-amber-800 pb-0.5">
                  Назначайте ответственных капитанов, собирайте мини-команды и фиксируйте призовые места!
                </p>
              </div>
              <button 
                onClick={() => setShowAddContest(!showAddContest)} 
                className="bg-red-650 hover:bg-red-700 text-yellow-300 text-xs px-2.5 py-1.5 rounded uppercase font-black shrink-0"
              >
                {showAddContest ? 'Свернуть' : '+ Новый конкурс'}
              </button>
            </div>

            {showAddContest && (
              <form onSubmit={handleAddContest} className="bg-yellow-200 border-3 border-dashed border-red-500 p-3 rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Название конкурса:</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Например: Волейбол, КСП, Туристическая полоса" 
                      value={newContestTitle} 
                      onChange={(e) => setNewContestTitle(e.target.value)} 
                      className="bg-[#FFFBEB] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-955 focus:outline-none focus:border-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Капитан конкурса (ответственный):</label>
                    <select 
                      value={newContestCaptainId} 
                      onChange={(e) => setNewContestCaptainId(e.target.value)} 
                      className="bg-[#FFFBEB] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-955 cursor-pointer"
                    >
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.avatar} {p.name} (@{p.nickname})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Мини-команда негодяев:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-[#FFFBEB]/50 p-2.5 rounded border border-amber-300 max-h-[150px] overflow-y-auto">
                    {participants.map(p => {
                      const isChecked = newContestTeamMemberIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-yellow-100 p-1 rounded">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {
                              if (isChecked) {
                                setNewContestTeamMemberIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setNewContestTeamMemberIds(prev => [...prev, p.id]);
                              }
                            }}
                            className="rounded text-red-650 border-amber-400 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-extrabold truncate text-amber-955 select-none">
                            {p.avatar} {p.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Командное место (если занято):</label>
                  <select 
                    value={newContestPlace} 
                    onChange={(e) => setNewContestPlace(e.target.value)} 
                    className="bg-[#FFFBEB] text-[#111] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold text-amber-955 cursor-pointer"
                  >
                    <option value="">Не занято / Участие</option>
                    {Array.from({ length: 99 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={`${num}-е место`}>
                        {num === 1 ? '🥇 ' : num === 2 ? '🥈 ' : num === 3 ? '🥉 ' : '🏆 '}{num}-е место
                      </option>
                    ))}
                    <option value="Призёр">🏆 Призёр</option>
                    <option value="Участие">⛺ Участие</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 text-xs font-black py-2 rounded-lg transition-colors border border-amber-955 uppercase shadow"
                >
                  🚀 Создать и начать подготовку
                </button>
              </form>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {contests.length === 0 ? (
                <div className="text-center py-6 text-xs text-amber-700 font-bold">
                  📭 Пока нет конкурсов. Нажмите "+ Новый конкурс" чтобы добавить!
                </div>
              ) : (
                contests.map(contest => {
                  const isEditing = editingContestId === contest.id;

                  if (isEditing && editingContestData) {
                    return (
                      <div key={contest.id} className="bg-amber-55 bg-amber-50 border-3 border-amber-500 p-4 rounded-2xl shadow-sm space-y-3 text-xs text-amber-955">
                        <div className="flex justify-between items-center border-b-2 border-amber-350 pb-1.5">
                          <span className="font-extrabold text-amber-950 text-sm uppercase flex items-center gap-1">
                            🏆 Редактор конкурса: {contest.title}
                          </span>
                          <button 
                            type="button"
                            onClick={cancelEditContest}
                            className="bg-amber-200 hover:bg-amber-300 text-amber-900 font-black text-[10px] px-2 py-1 rounded shadow-sm"
                          >
                            Отмена
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Название конкурса:</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Название конкурса"
                            value={editingContestData.title} 
                            onChange={(e) => setEditingContestData({ ...editingContestData, title: e.target.value })} 
                            className="bg-[#FFFBEB] text-[#111] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold focus:outline-none focus:border-red-500" 
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Капитан конкурса:</label>
                            <select 
                              value={editingContestData.captainId} 
                              onChange={(e) => setEditingContestData({ ...editingContestData, captainId: e.target.value })} 
                              className="bg-[#FFFBEB] text-[#111] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold cursor-pointer"
                            >
                              {participants.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.avatar} {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase mb-0.5">Занятое место:</label>
                            <select 
                              value={editingContestData.place || ''} 
                              onChange={(e) => setEditingContestData({ ...editingContestData, place: e.target.value || undefined })} 
                              className="bg-[#FFFBEB] text-[#111] text-xs p-2 rounded w-full border-2 border-amber-400 font-bold cursor-pointer"
                            >
                              <option value="">Не занято / Участие</option>
                              {Array.from({ length: 99 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={`${num}-е место`}>
                                  {num === 1 ? '🥇 ' : num === 2 ? '🥈 ' : num === 3 ? '🥉 ' : '🏆 '}{num}-е место
                                </option>
                              ))}
                              <option value="Призёр">🏆 Призёр</option>
                              <option value="Участие">⛺ Участие</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Мини-команда негодяев:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-[#FFFBEB]/50 p-2 rounded border border-amber-300 max-h-[120px] overflow-y-auto">
                            {participants.map(p => {
                              const isChecked = (editingContestData.teamMemberIds || []).includes(p.id);
                              return (
                                <label key={p.id} className="flex items-center gap-1 cursor-pointer hover:bg-yellow-200 p-1 rounded select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {
                                      const currentIds = editingContestData.teamMemberIds || [];
                                      const nextIds = isChecked 
                                        ? currentIds.filter(id => id !== p.id) 
                                        : [...currentIds, p.id];
                                      setEditingContestData({ ...editingContestData, teamMemberIds: nextIds });
                                    }}
                                    className="rounded text-red-650 border-amber-455 focus:ring-red-500 h-3 w-3 cursor-pointer"
                                  />
                                  <span className="text-[10px] font-bold text-amber-955 truncate">
                                    {p.avatar} {p.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={saveContestEdit}
                            className="flex-grow bg-[#10b981] hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-lg transition-colors shadow-sm uppercase font-black"
                          >
                            💾 Сохранить изменения
                          </button>
                          <button 
                            type="button" 
                            onClick={cancelEditContest}
                            className="bg-red-500 hover:bg-red-650 text-white text-xs font-black py-2 px-4 rounded-lg transition-colors shadow-sm font-black"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={contest.id} className="bg-white border-2 border-amber-300 p-3.5 rounded-2xl shadow-sm space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-extrabold text-amber-955 text-sm sm:text-base">
                            🏆 {contest.title}
                          </h4>
                          <span className="inline-flex items-center mt-1 text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                            👑 Капитан: {contest.captainName}
                          </span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditContest(contest)}
                            className="p-1 px-2.5 rounded bg-amber-105 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-black text-[10px] flex items-center gap-1 shadow-xs uppercase shrink-0"
                            title="Редактировать конкурс"
                          >
                            <Edit size={11} /> Правка
                          </button>
                          <button 
                            onClick={() => deleteContest(contest.id)} 
                            className="text-red-500 font-black text-xs hover:bg-red-50 p-1.5 rounded shrink-0"
                            title="Удалить конкурс"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-amber-100 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-black text-red-700 uppercase block mb-1">
                            Мини-команда:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {contest.teamMemberIds && contest.teamMemberIds.length > 0 ? (
                              contest.teamMemberIds.map(memId => {
                                const pt = participants.find(p => p.id === memId);
                                if (!pt) return null;
                                return (
                                  <span key={memId} className="inline-block bg-yellow-100 text-amber-955 font-bold px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                                    {pt.avatar} {pt.name}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-amber-600 italic text-[11px]">Команда ещё не набрана</span>
                            )}
                          </div>

                          {/* INLINE MINI TEAM AND CAPTAIN REGISTRATION EDITOR FOR ACTIVE CONTEST */}
                          <div className="mt-2.5 bg-yellow-50 p-2 rounded-xl border border-amber-200">
                            <span className="text-[9px] font-black text-amber-800 uppercase block mb-1">Редактор Капитана и Банды:</span>
                            <div className="space-y-1.5">
                              <select
                                value={contest.captainId}
                                onChange={(e) => updateContestTeam(contest.id, e.target.value, contest.teamMemberIds)}
                                className="w-full bg-[#FFFBEB] text-[#111] text-[10px] font-extrabold border border-amber-300 rounded p-1 cursor-pointer"
                              >
                                {participants.map(p => (
                                  <option key={p.id} value={p.id}>👑 {p.name}</option>
                                ))}
                              </select>
                              <div className="flex flex-wrap gap-1 bg-white p-1 rounded border border-amber-200 max-h-[80px] overflow-y-auto">
                                {participants.map(p => {
                                  const isChecked = contest.teamMemberIds.includes(p.id);
                                  return (
                                    <label key={p.id} className="flex items-center gap-1 cursor-pointer p-0.5 hover:bg-yellow-550 rounded select-none hover:bg-yellow-50 rounded select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const nextIds = isChecked 
                                            ? contest.teamMemberIds.filter(id => id !== p.id)
                                            : [...contest.teamMemberIds, p.id];
                                          updateContestTeam(contest.id, contest.captainId, nextIds);
                                        }}
                                        className="rounded text-red-650 focus:ring-red-500 h-3 w-3 cursor-pointer"
                                      />
                                      <span className="text-[9px] font-bold text-amber-955">{p.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-red-700 uppercase block mb-1">
                            Занятое Командное место:
                          </label>
                          <select 
                            value={contest.place || ''}
                            onChange={(e) => updateContestPlace(contest.id, e.target.value)}
                            className="w-full bg-[#FFFBEB] text-amber-955 border-2 border-amber-300 rounded px-2.5 py-1.5 text-xs font-black cursor-pointer"
                          >
                            <option value="">Не занято / Участие</option>
                            {Array.from({ length: 99 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={`${num}-е место`}>
                                {num === 1 ? '🥇 ' : num === 2 ? '🥈 ' : num === 3 ? '🥉 ' : '🏆 '}{num}-е место
                              </option>
                            ))}
                            <option value="Призёр">🏆 Призёр</option>
                            <option value="Участие">⛺ Участие</option>
                          </select>
                          <div className="mt-2 bg-amber-50 rounded-xl p-2 border border-amber-200">
                            <span className="text-[9px] font-black text-amber-800 uppercase block leading-tight">Быстрый статус:</span>
                            <div className="flex gap-1.5 mt-1">
                              <button 
                                onClick={() => updateContestPlace(contest.id, "🥇 1-е место")} 
                                className="px-1.5 py-0.5 bg-yellow-300 border border-yellow-500 text-[10px] font-black text-amber-900 rounded hover:opacity-90"
                              >
                                🥇 1-е
                              </button>
                              <button 
                                onClick={() => updateContestPlace(contest.id, "🥈 2-е место")} 
                                className="px-1.5 py-0.5 bg-slate-200 border border-slate-400 text-[10px] font-black text-slate-900 rounded hover:opacity-90"
                              >
                                🥈 2-е
                              </button>
                              <button 
                                onClick={() => updateContestPlace(contest.id, "🥉 3-е место")} 
                                className="px-1.5 py-0.5 bg-amber-200 border border-amber-450 text-[10px] font-black text-amber-900 rounded hover:opacity-90"
                              >
                                🥉 3-е
                              </button>
                              <button 
                                onClick={() => updateContestPlace(contest.id, "")} 
                                className="px-1.5 py-0.5 bg-white border border-rose-300 text-[10px] font-bold text-rose-700 rounded hover:bg-rose-50"
                              >
                                Сбросить
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

            </>
          )}

      </section>

        {/* RIGHT COLUMN: MAX MESSENGER GROUP CHAT WORKSPACE (Lg-5) */}
        {isAdminLoggedIn && (
          <section className="lg:col-span-5 flex flex-col h-[550px] lg:h-[770px] bg-[#FEF3C7] border-4 border-red-500 rounded-3xl shadow-xl overflow-hidden relative" id="messenger-chat">
          
          {/* MESSENGER PHONE STATUS HEADER */}
          <div className="bg-yellow-400 p-3 border-b-4 border-red-500 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-2xl">🤘</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-700 uppercase tracking-tight leading-tight">
                  МАКС ЧАТ: НЕГОДЯИ (5)
                </h3>
                <span className="text-[9px] font-black text-amber-800 uppercase flex items-center gap-1">
                  ИИ Бот Максимка <span className="bg-red-500 text-yellow-300 px-1 rounded text-[8px]">АКТИВЕН</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] block font-black text-red-800 uppercase">Туры / Походы</span>
              <span className="text-xs font-extrabold text-amber-950">Цель: {totalTargetFunds.toLocaleString()} ₽</span>
            </div>
          </div>

          {/* CHAT CHRONICLE TIMELINE SCROLL CONTENT */}
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-yellow-100/50 shadow-inner">
            
            {/* WELCOME PINNED POST */}
            <div className="bg-yellow-105 border-2 border-dashed border-amber-400 rounded-xl p-3 text-xs leading-snug">
              <p className="font-extrabold text-red-700 uppercase mb-1 flex items-center gap-1">
                📌 ЗАКРЕПЛЕНО БАНДОЙ:
              </p>
              <p className="text-amber-900 font-semibold italic">
                {botConfig.welcomeTemplate}
              </p>
            </div>

            {/* TODAY BIRTHDAYS PRESENT CELEB BANNER */}
            {todayBirthdays.length > 0 && (
              <div className="bg-gradient-to-r from-red-650 to-amber-500 border-4 border-yellow-400 text-white rounded-2xl p-3.5 shadow-lg relative overflow-hidden animate-pulse">
                <div className="absolute right-2 top-2 text-2xl opacity-30 select-none">🎈🎂🥳</div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-yellow-300">
                  🎉 СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ! 🎉
                </h4>
                <p className="text-xs font-bold leading-normal mt-1">
                  Сегодня празднует Негодяй: <strong className="text-white underline">{todayBirthdays.map(p => p.name).join(", ")}</strong>! 🥳
                </p>
                <div className="mt-2.5 flex justify-start">
                  <button
                    onClick={() => {
                      const targetName = todayBirthdays[0].name;
                      setCustomMessage(`Бот, у ${targetName} сегодня днюха! Поздравь этого Негодяя в своем самом сочном походном стиле! 🎂🎁🍖`);
                      document.getElementById("chat-form-section")?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow transition-transform hover:scale-105 duration-100"
                  >
                    🎁 Крикнуть боту: "Поздравь!"
                  </button>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${msg.isBot ? 'mr-auto items-start' : 'ml-auto items-end'}`}
              >
                
                {/* SENDER LABEL METADATA */}
                {!msg.isBot && msg.senderName !== "Служба Контроля" && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-800 font-extrabold uppercase mb-0.5 px-1">
                    <span>{msg.senderName}</span>
                    <span className="text-amber-500">(@{msg.senderNickname})</span>
                    <span className="bg-amber-200 border border-amber-300 text-[8px] px-1 rounded">
                      {msg.senderPsychotype}
                    </span>
                  </div>
                )}
                
                {msg.isBot && (
                  <div className="flex items-center gap-1 text-[10px] text-red-700 font-black uppercase mb-0.5 px-0.5">
                    <span>{msg.senderName}</span>
                    <span className="bg-amber-300 text-amber-905 text-[8px] px-1 rounded">ИИ</span>
                  </div>
                )}

                {/* SENDER CORRESPODING WRAPPERS bubble */}
                {msg.senderName === "Служба Контроля" ? (
                  <div className="w-full text-center my-1.5">
                    <span className="inline-block bg-yellow-200 border-2 border-red-500/30 text-red-850 px-3 py-1 text-[10px] rounded-lg font-bold leading-tight">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div 
                    className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm transition-all border-2 ${
                      msg.isBot 
                        ? 'bg-[#FFFBEB] border-red-500 text-amber-955 rounded-bl-none' 
                        : 'bg-yellow-400 border-amber-950/20 text-amber-950 rounded-br-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-right text-[9px] opacity-60 text-amber-900 font-mono mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* AI ADAPTATION EXPLANATORY DIAGNOSTIC BOX */}
                {msg.isBot && (msg.detectedPsychotypeExplanation || msg.adapterStyleUsed) && (
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-2 text-[10px] space-y-1 max-w-full text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-red-700 uppercase">Психоанализ:</span>
                      <span className="font-black bg-yellow-300 text-red-800 px-1 rounded text-[8px]">
                        {msg.detectedPsychotypeExplanation ? "Распознано" : "Адаптировано"}
                      </span>
                    </div>
                    {msg.detectedPsychotypeExplanation && (
                      <p className="text-amber-900 leading-normal font-medium italic">
                        &laquo;{msg.detectedPsychotypeExplanation}&raquo;
                      </p>
                    )}
                    {msg.adapterStyleUsed && (
                      <p className="text-amber-700 text-[9px]">
                        ⚙️ ИИ применил манеру: <strong className="text-red-700 uppercase">{msg.adapterStyleUsed}</strong>
                      </p>
                    )}
                  </div>
                )}

              </div>
            ))}

            {/* AI TYPING DOTS LOADER */}
            {isTyping && (
              <div className="flex flex-col mr-auto max-w-[80%] items-start">
                <span className="text-[10px] text-red-700 font-bold uppercase mb-0.5 px-0.5">
                  {typingStatus}
                </span>
                <div className="bg-[#FFFBEB] border-2 border-red-500 rounded-2xl rounded-bl-none p-3 shadow-inner flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}


          </div>

          {/* SENDER SWITCHER & SEND INPUT PANEL */}
          <div className="p-3 bg-yellow-400 border-t-4 border-red-500 shadow-md flex-shrink-0" id="chat-form-section">
            <form onSubmit={handleSendMessage} className="space-y-2">
              
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="block text-[10px] uppercase font-black text-red-800 leading-none">
                    Писать от лица:
                  </span>
                </div>
                
                {/* INTERACTIVE dropdown to choose which character talks */}
                <select
                  value={selectedSender.id}
                  onChange={(e) => {
                    const match = participants.find(p => p.id === e.target.value);
                    if (match) setSelectedSender(match);
                  }}
                  className="bg-[#FFFBEB] border-2 border-amber-550 rounded py-0.5 px-1.5 text-xs font-black text-amber-950 uppercase"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name} ({p.psychotype})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                   type="text"
                   required
                   placeholder={`Спросить Максимку (начни фразу с "Бот...", например: "Бот, что по меню?")`}
                   value={customMessage}
                   onChange={(e) => setCustomMessage(e.target.value)}
                   className="flex-grow bg-[#FFFBEB] text-amber-950 border-3 border-amber-950/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-red-500 shadow-inner"
                />
                 
                <button
                   type="submit"
                   disabled={isTyping}
                   className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 px-4 rounded-xl border-2 border-amber-950 font-black flex items-center justify-center transition-all shadow-md shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>

            </form>
            
            {/* EASY QUICK MESSAGE CHIPS FOR THE CHOSEN SENDER */}
            <div className="flex gap-1.5 overflow-x-auto pt-1.5 scrollbar-thin">
              <span className="text-[9px] uppercase font-black text-red-800 shrink-0 self-center">Вопросы боту:</span>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, покажи наше походное меню и продукты")}
                className="bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded text-emerald-850 shrink-0 uppercase"
              >
                🍲 Меню и Еда
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, какие у нас походные задачи и дела?")}
                className="bg-blue-100 hover:bg-blue-200 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded text-blue-850 shrink-0 uppercase"
              >
                📋 Задачи команды
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, что там по инвентарю и снаряге? Какое состояние?")}
                className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded text-amber-850 shrink-0 uppercase"
              >
                📦 Инвентарь / Вещи
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, кто злостный халявщик и сколько денег висит долгами?")}
                className="bg-red-100 hover:bg-red-200 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded text-red-850 shrink-0 uppercase"
              >
                💸 Долги банды
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, зачитай отчет о наших сборах и планах")}
                className="bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded text-cyan-850 shrink-0 uppercase"
              >
                📢 Экскурсии / Сборы
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, я замерзла, боюсь грозы и дикого кабана!")}
                className="bg-purple-100 hover:bg-purple-200 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded text-purple-850 shrink-0 uppercase"
              >
                🙀 Страх у костра
              </button>
              <button
                type="button"
                onClick={() => setCustomMessage("Бот, мы едем бунтовать, жечь покрышки и жарить сосиски!")}
                className="bg-orange-100 hover:bg-orange-200 border border-orange-300 text-[10px] font-bold px-2 py-0.5 rounded text-orange-850 shrink-0 uppercase"
              >
                🤘 Раскачать чат
              </button>
            </div>

          </div>

        </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto w-full px-4 text-center mt-8 text-xs text-amber-700/80 font-semibold border-t-2 border-dashed border-amber-300 pt-4">
        Бот Максимка &laquo;Главный Негодяй&raquo; © 2026. Разработано специально для лесной туристической банды Негодяев. По коням!
      </footer>

    </div>
  );
}
