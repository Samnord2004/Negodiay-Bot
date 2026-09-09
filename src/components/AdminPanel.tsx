import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, CheckSquare, Coffee, Package, Award, 
  Plus, Trash, Trash2, Edit, CheckCircle, AlertTriangle, Shield, 
  Brain, Sliders, UserCheck, UserX, Key, Calendar, MapPin, RefreshCw, Flame, Bot
} from 'lucide-react';
import { 
  Participant, TaskItem, MenuItem, GroceryItem, 
  InventoryItem, Contest, Excursion, BotConfig, InventoryCondition,
  UserRole, ROLE_DEFINITIONS
} from '../types';
import { getSafeAvatar, getParticipantAvatar } from '../utils/avatar';
import { PSYCHOTYPES } from '../mockData';
import DeleteParticipantModal from './DeleteParticipantModal';

interface AdminPanelProps {
  isAdmin: boolean;
  currentUser: Participant | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  participants: Participant[];
  onUpdateParticipants: (p: Participant[]) => void;
  tasks: TaskItem[];
  onUpdateTasks: (t: TaskItem[]) => void;
  menuItems: MenuItem[];
  onUpdateMenuItems: (m: MenuItem[]) => void;
  groceryItems: GroceryItem[];
  onUpdateGroceryItems: (g: GroceryItem[]) => void;
  inventoryItems: InventoryItem[];
  onUpdateInventoryItems: (i: InventoryItem[]) => void;
  contests: Contest[];
  onUpdateContests: (c: Contest[]) => void;
  excursions: Excursion[];
  onUpdateExcursions: (e: Excursion[]) => void;
  botConfig: BotConfig;
  onUpdateBotConfig: (b: BotConfig) => void;
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
  onSetRole: (userId: string, role: UserRole) => void;
}

export default function AdminPanel({
  isAdmin,
  currentUser,
  onOpenLogin,
  onLogout,
  participants,
  onUpdateParticipants,
  tasks,
  onUpdateTasks,
  menuItems,
  onUpdateMenuItems,
  groceryItems,
  onUpdateGroceryItems,
  inventoryItems,
  onUpdateInventoryItems,
  contests,
  onUpdateContests,
  excursions,
  onUpdateExcursions,
  botConfig,
  onUpdateBotConfig,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onSetRole
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'roles' | 'teamSettings' | 'tasks' | 'menu' | 'inventory' | 'contests' | 'excursions'>('pending');

  // Team parameters & Bot config (Captain control)
  const [foundingYear, setFoundingYear] = useState<number>(botConfig.foundingYear || 2018);
  const [swearingLevel, setSwearingLevel] = useState<'low' | 'medium' | 'high'>(botConfig.swearingLevel || 'medium');
  const [autoDetect, setAutoDetect] = useState<boolean>(botConfig.autoDetectPsychotype ?? true);
  const [isSavedTeamConfig, setIsSavedTeamConfig] = useState(false);

  useEffect(() => {
    if (botConfig.foundingYear) setFoundingYear(botConfig.foundingYear);
    if (botConfig.swearingLevel) setSwearingLevel(botConfig.swearingLevel);
    if (botConfig.autoDetectPsychotype !== undefined) setAutoDetect(botConfig.autoDetectPsychotype);
  }, [botConfig]);

  const handleSaveTeamConfig = (overrides?: Partial<BotConfig>) => {
    const updated: BotConfig = {
      ...botConfig,
      foundingYear: overrides?.foundingYear !== undefined ? overrides.foundingYear : foundingYear,
      swearingLevel: overrides?.swearingLevel !== undefined ? overrides.swearingLevel : swearingLevel,
      autoDetectPsychotype: overrides?.autoDetectPsychotype !== undefined ? overrides.autoDetectPsychotype : autoDetect
    };
    onUpdateBotConfig(updated);
    setIsSavedTeamConfig(true);
    setTimeout(() => setIsSavedTeamConfig(false), 2500);
  };

  // Task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(participants[0]?.id || '1');
  const [taskDeadline, setTaskDeadline] = useState('');

  // Menu form
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuDay, setMenuDay] = useState('День 1. Обед');
  const [menuDish, setMenuDish] = useState('');
  const [menuDesc, setMenuDesc] = useState('');

  // Grocery form
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [groceryName, setGroceryName] = useState('');
  const [groceryQty, setGroceryQty] = useState('');
  const [groceryCategory, setGroceryCategory] = useState('Еда');

  // Inventory form
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [inventoryName, setInventoryName] = useState('');
  const [inventoryCondition, setInventoryCondition] = useState<InventoryCondition>('нормальное');
  const [inventoryResponsible, setInventoryResponsible] = useState(participants[0]?.name || 'Ответственный');

  // Excursion state & forms
  const [showAddExcursion, setShowAddExcursion] = useState(false);
  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [isSavingExcursion, setIsSavingExcursion] = useState(false);
  const [isRefreshingPending, setIsRefreshingPending] = useState(false);

  const [newExcursion, setNewExcursion] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    costBoys: 5000,
    costGirls: 3500
  });

  const pendingUsers = participants.filter(p => p.accountStatus === 'pending');

  // Password reset requests state & Captain password reset modal
  interface PasswordResetRequest {
    id: string;
    userId: string;
    userName: string;
    userNickname: string;
    note?: string;
    status: 'pending' | 'resolved';
    createdAt: string;
  }

  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingResetRequests, setIsLoadingResetRequests] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<Participant | null>(null);
  const [customNewPassword, setCustomNewPassword] = useState('123');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Participant Deletion State
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  const handleConfirmDeleteParticipant = async (id: string) => {
    if (onDeleteUser) {
      await onDeleteUser(id);
    } else {
      try {
        const res = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.participants) {
            onUpdateParticipants(data.participants);
          } else {
            onUpdateParticipants(participants.filter(p => p.id !== id));
          }
        }
      } catch (err) {
        console.error("Delete user error:", err);
      }
    }
  };

  const loadResetRequests = async () => {
    setIsLoadingResetRequests(true);
    try {
      const res = await fetch('/api/admin/password-reset-requests');
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load reset requests:", err);
    } finally {
      setIsLoadingResetRequests(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadResetRequests();
    }
  }, [isAdmin]);

  const handleResetUserPassword = async (userId: string, newPass: string) => {
    setIsResettingPassword(true);
    setResetSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.participants) {
          onUpdateParticipants(data.participants);
        }
        setResetSuccessMessage(`Пароль для ${data.user.name} (@${data.user.nickname}) успешно изменён на: ${newPass}`);
        loadResetRequests();
        setTimeout(() => {
          setResetModalUser(null);
          setResetSuccessMessage(null);
        }, 3000);
      } else {
        alert(data.error || 'Ошибка сброса пароля');
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert('Не удалось связаться с сервером');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleRefreshPending = async () => {
    setIsRefreshingPending(true);
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.participants) {
          onUpdateParticipants(data.participants);
        }
      }
      await loadResetRequests();
    } catch (err) {
      console.error("Refresh pending error:", err);
    } finally {
      setIsRefreshingPending(false);
    }
  };

  const handleCreateExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcursion.title.trim()) return;
    setIsSavingExcursion(true);
    try {
      const payload = {
        title: newExcursion.title.trim(),
        date: newExcursion.date || new Date().toISOString().split('T')[0],
        location: newExcursion.location.trim() || 'Лесная поляна',
        description: newExcursion.description.trim(),
        costPerPerson: Number(newExcursion.costBoys),
        costBoys: Number(newExcursion.costBoys),
        costGirls: Number(newExcursion.costGirls),
        isActive: true
      };
      const res = await fetch('/api/excursions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions) {
          onUpdateExcursions(data.excursions);
        } else {
          onUpdateExcursions([...excursions, { id: 'ex_' + Date.now(), ...payload }]);
        }
        setShowAddExcursion(false);
        setNewExcursion({
          title: '',
          date: '',
          location: '',
          description: '',
          costBoys: 5000,
          costGirls: 3500
        });
      }
    } catch (err) {
      console.error("Create excursion error:", err);
    } finally {
      setIsSavingExcursion(false);
    }
  };

  const handleSaveEditExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExcursion) return;
    setIsSavingExcursion(true);
    try {
      const res = await fetch(`/api/excursions/${editingExcursion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingExcursion)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions) {
          onUpdateExcursions(data.excursions);
        } else {
          onUpdateExcursions(excursions.map(ex => ex.id === editingExcursion.id ? editingExcursion : ex));
        }
        setEditingExcursion(null);
      }
    } catch (err) {
      console.error("Update excursion error:", err);
    } finally {
      setIsSavingExcursion(false);
    }
  };

  const handleDeleteExcursion = async (id: string) => {
    try {
      const res = await fetch(`/api/excursions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions) {
          onUpdateExcursions(data.excursions);
        } else {
          onUpdateExcursions(excursions.filter(e => e.id !== id));
        }
      }
    } catch (err) {
      console.error("Delete excursion error:", err);
    }
  };

  const handleToggleExcursionActive = async (ex: Excursion) => {
    try {
      const res = await fetch(`/api/excursions/${ex.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ex.isActive })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excursions) {
          onUpdateExcursions(data.excursions);
        } else {
          onUpdateExcursions(excursions.map(e => e.id === ex.id ? { ...e, isActive: !e.isActive } : e));
        }
      }
    } catch (err) {
      console.error("Toggle excursion error:", err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border-4 border-red-600 rounded-3xl p-8 max-w-lg mx-auto text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-600 text-yellow-300 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-amber-950 shadow-md">
          🔒
        </div>
        <h2 className="text-2xl font-black text-red-600 uppercase mb-2">Панель Капитана команды</h2>
        <p className="text-xs font-bold text-amber-900 mb-6 leading-relaxed">
          Управление слётом, одобрение регистраций новых участников, назначение казначея фонда, настройка задач, инвентаря и психотипов доступны только Капитану команды.
        </p>
        <button
          type="button"
          onClick={onOpenLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs py-3.5 rounded-xl border-2 border-amber-950 shadow-md transition-all active:scale-95"
        >
          Войти как Капитан команды
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-red-600 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
      
      {/* Top Header with Status & Team Parameters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b-2 border-amber-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-yellow-300 text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-950">
              👑 Капитан команды
            </span>
            {pendingUsers.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                {pendingUsers.length} новых заявок!
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-red-600 uppercase mt-1">
            Штаб управления туристической командой «Негодяи»
          </h2>
          <p className="text-xs text-amber-900 font-bold mt-0.5">
            Год основания: <span className="text-red-600 font-black">{foundingYear}</span> • Возраст команды: <span className="text-red-600 font-black">{Math.max(1, new Date().getFullYear() - foundingYear)} лет</span>
          </p>
        </div>

        {/* Quick Founding Year Input for Captain */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 flex items-center gap-3 shadow-xs">
          <div className="flex flex-col text-left">
            <label className="text-[10px] font-black uppercase text-amber-950 flex items-center gap-1">
              <span>Год основания команды:</span>
            </label>
            <span className="text-[9px] text-amber-800 font-bold">
              (заполняет капитан)
            </span>
          </div>
          <input
            type="number"
            min="1970"
            max={new Date().getFullYear()}
            value={foundingYear}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 2018;
              setFoundingYear(val);
              handleSaveTeamConfig({ foundingYear: val });
            }}
            className="w-24 px-2.5 py-1.5 bg-white border-2 border-amber-400 rounded-xl font-black text-amber-950 text-sm text-center shadow-inner focus:outline-none focus:border-red-600"
            title="Год основания команды (управляет возрастом команды на сайте)"
          />
          {isSavedTeamConfig && (
            <span className="text-xs text-green-700 font-black flex items-center gap-1">
              <CheckCircle size={14} /> Сохранено
            </span>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      {(() => {
        const pendingResetCount = resetRequests.filter(r => r.status === 'pending').length;
        return (
          <div className="flex flex-wrap gap-1.5 bg-amber-100 p-1.5 rounded-2xl border-2 border-amber-300">
            {[
              { id: 'pending', label: `Заявки (${pendingUsers.length + pendingResetCount})`, icon: UserCheck, alert: (pendingUsers.length > 0 || pendingResetCount > 0) },
              { id: 'roles', label: 'Роли & Пароли', icon: Shield },
              { id: 'teamSettings', label: 'Параметры команды', icon: Settings },
              { id: 'tasks', label: 'Задачи слёта', icon: CheckSquare },
              { id: 'menu', label: 'Меню и Продукты', icon: Coffee },
              { id: 'inventory', label: 'Инвентарь', icon: Package },
              { id: 'contests', label: 'Конкурсы', icon: Award },
              { id: 'excursions', label: 'Слёты и Взносы', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    isActive 
                      ? 'bg-red-600 text-yellow-300 shadow-md transform scale-[1.02]' 
                      : 'text-amber-950 hover:bg-amber-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* TAB 1: PENDING REGISTRATIONS & PASSWORD RESETS */}
      {activeTab === 'pending' && (() => {
        const pendingResets = resetRequests.filter(r => r.status === 'pending');
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200">
              <div>
                <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
                  <UserCheck size={18} />
                  Модерация заявок и сброс паролей
                </h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Регистрация активируется только Капитаном. Здесь же обрабатываются запросы на сброс паролей от участников.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefreshPending}
                  disabled={isRefreshingPending || isLoadingResetRequests}
                  className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase rounded-xl border border-amber-400 flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Обновить список заявок с сервера"
                >
                  <RefreshCw size={13} className={(isRefreshingPending || isLoadingResetRequests) ? 'animate-spin text-red-600' : 'text-red-600'} />
                  <span>{(isRefreshingPending || isLoadingResetRequests) ? 'Обновление...' : 'Обновить всё'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: PASSWORD RESET REQUESTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-amber-950 flex items-center gap-2">
                  <Key size={15} className="text-red-600" />
                  Запросы участников на сброс пароля ({pendingResets.length})
                </h4>
                {pendingResets.length > 0 && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                    Требуют сброса Капитаном
                  </span>
                )}
              </div>

              {pendingResets.length === 0 ? (
                <div className="bg-amber-50/60 rounded-xl p-3 text-center border border-amber-200 text-xs text-amber-800 font-medium">
                  Запросов на сброс пароля нет. Когда участник запросит сброс пароля у Капитана, запрос отобразится здесь.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingResets.map(req => {
                    const matchedUser = participants.find(p => p.id === req.userId);
                    return (
                      <div key={req.id} className="bg-white border-2 border-red-400 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getParticipantAvatar(matchedUser)} 
                            alt={req.userName} 
                            className="w-10 h-10 rounded-full border-2 border-red-500 bg-amber-100 object-cover" 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-950 text-sm">{req.userName}</span>
                              <span className="text-xs font-bold text-red-600">@{req.userNickname}</span>
                            </div>
                            {req.note && (
                              <p className="text-xs text-stone-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                                Сообщение: <span className="font-semibold">{req.note}</span>
                              </p>
                            )}
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              Запрос отправлен: {new Date(req.createdAt).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const targetUser = matchedUser || ({
                                id: req.userId,
                                name: req.userName,
                                nickname: req.userNickname,
                                role: 'member' as UserRole
                              } as Participant);
                              setResetModalUser(targetUser);
                              setCustomNewPassword('123');
                              setResetSuccessMessage(null);
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Key size={14} />
                            Сбросить пароль
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: PENDING REGISTRATIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-amber-950 flex items-center gap-2">
                  <UserCheck size={15} className="text-emerald-700" />
                  Заявки на регистрацию в команду ({pendingUsers.length})
                </h4>
                <span className="text-[11px] text-amber-800 font-semibold">
                  Одобрение Капитаном команды
                </span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="bg-amber-50 rounded-2xl p-6 text-center border-2 border-dashed border-amber-300">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-black text-amber-950 text-sm uppercase">Все заявки рассмотрены!</p>
                  <p className="text-xs text-amber-700 mt-1">Новые участники регистрируются без проверочных кодов и сразу направляются сюда.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(p => (
                    <div key={p.id} className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={getParticipantAvatar(p)} alt={p.name} className="w-12 h-12 rounded-full border-2 border-amber-400 bg-white object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-950 text-sm">{p.name}</span>
                            <span className="text-xs font-bold text-red-600">@{p.nickname}</span>
                            {p.biometricEnabled && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                                🛡️ Биометрия
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-800 space-x-2 mt-0.5">
                            {p.phone && <span>📞 {p.phone}</span>}
                            {p.email && <span>📧 {p.email}</span>}
                            <span>🎂 {p.birthday || 'Не указан'}</span>
                          </div>
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            Статус: <strong className="text-amber-800 uppercase">Ожидает решения Капитана команды</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => onApproveUser(p.id)}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow transition-colors flex items-center justify-center gap-1"
                        >
                          <UserCheck size={14} />
                          Принять в команду
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectUser(p.id)}
                          className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs uppercase rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1"
                        >
                          <UserX size={14} />
                          Отклонить
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipantToDelete(p)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs uppercase rounded-xl border border-red-200 hover:border-red-600 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                          title="Удалить заявку и аккаунт полностью"
                        >
                          <Trash2 size={14} />
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 2: ROLES & TEAM ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
                <Shield size={18} />
                Штаб команды: распределение ключевых ролей
              </h3>
              <p className="text-xs text-amber-900 mt-0.5 font-medium">
                Назначьте ответственных за подготовку к слёту: прораб, дизайнер, помощник капитана, хранитель, шеф-повар и казначей.
              </p>
            </div>
          </div>

          {/* Reference Cards for All Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Object.values(ROLE_DEFINITIONS).map((r) => (
              <div
                key={r.role}
                className="bg-white border-2 border-amber-300 rounded-xl p-2.5 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <h4 className="font-black text-xs text-amber-950 leading-tight">{r.title}</h4>
                    <span className={`inline-block text-[9px] font-black px-1.5 py-0.2 rounded border ${r.color}`}>
                      {r.badge}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  {r.description}
                </p>
              </div>
            ))}
          </div>

          {/* Participants Roles Table */}
          <div className="overflow-x-auto rounded-xl border-2 border-amber-300 shadow-md">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-amber-200 uppercase text-amber-950 font-black border-b border-amber-300">
                <tr>
                  <th className="p-3">Участник</th>
                  <th className="p-3">Позывной</th>
                  <th className="p-3">Текущая роль</th>
                  <th className="p-3 min-w-[200px]">Назначить роль в команде</th>
                  <th className="p-3 text-center">Управление & Аккаунт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {participants.map(p => {
                  const currentRole = p.role || 'member';
                  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.member;

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/80 transition-colors">
                      <td className="p-3 font-bold text-amber-950 flex items-center gap-2">
                        <img src={getParticipantAvatar(p)} alt={p.name} className="w-7 h-7 rounded-full border border-amber-300 object-cover" />
                        <div>
                          <span>{p.name}</span>
                          <div className="text-[10px] text-stone-500 font-normal">{p.email || p.phone}</div>
                        </div>
                      </td>
                      <td className="p-3 text-red-700 font-bold">@{p.nickname}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-lg border shadow-xs ${roleMeta.color}`}>
                          <span>{roleMeta.icon}</span>
                          <span>{roleMeta.title}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentRole}
                            onChange={(e) => onSetRole(p.id, e.target.value as UserRole)}
                            className="bg-amber-50 border-2 border-amber-400 focus:border-red-600 text-amber-950 font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="member">⛺ Участник (Негодяй)</option>
                            <option value="foreman">🔨 Прораб (строительные работы, лагерь)</option>
                            <option value="designer">🎨 Дизайнер (оформление лагеря, форма, раздатка)</option>
                            <option value="assistant_captain">🧭 Помощник капитана (координация команды)</option>
                            <option value="keeper">📦 Хранитель (имущество команды)</option>
                            <option value="chef">👨‍🍳 Шеф-повар (командный повар)</option>
                            <option value="treasurer">💰 Казначей фонда (сбор взносов)</option>
                            <option value="admin">👑 Администратор сайта</option>
                          </select>
                          {currentRole !== 'member' && (
                            <button
                              type="button"
                              onClick={() => onSetRole(p.id, 'member')}
                              className="px-2 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] uppercase rounded-lg transition-colors"
                              title="Снять роль и сделать обычным участником"
                            >
                              Снять
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(p);
                              setCustomNewPassword('123');
                              setResetSuccessMessage(null);
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] rounded-lg border border-amber-300 inline-flex items-center gap-1 transition-colors shadow-2xs"
                            title="Сбросить пароль участнику"
                          >
                            <Key size={12} className="text-red-600" />
                            <span>Пароль</span>
                          </button>

                          {/* Delete Member Button */}
                          {p.id !== currentUser?.id && p.id !== '3' && p.role !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => setParticipantToDelete(p)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-bold text-[11px] rounded-lg border border-red-200 hover:border-red-600 inline-flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                              title="Удалить члена команды и полностью удалить его аккаунт"
                            >
                              <Trash2 size={12} />
                              <span>Удалить</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-bold px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200 select-none" title="Главный аккаунт Капитана защищен от удаления">
                              👑 Главный
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM SETTINGS & BOT CONFIG (CAPTAIN EXCLUSIVE) */}
      {activeTab === 'teamSettings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <Settings size={18} />
              Параметры команды и настройка ИИ-Бота (Штаб Капитана)
            </h3>
            {isSavedTeamConfig && (
              <span className="text-xs text-green-700 font-black bg-green-100 border border-green-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-bounce">
                <CheckCircle size={14} /> Параметры успешно сохранены!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Team Founding Year */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-2 border-b border-amber-200">
                <div className="p-2 bg-red-600 text-yellow-300 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase text-amber-950">
                    Год основания команды
                  </h4>
                  <p className="text-[11px] font-bold text-amber-800">
                    Официальный параметр, который заполняет капитан команды
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-amber-950 uppercase">
                  Укажите год основания туристической команды:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1970"
                    max={new Date().getFullYear()}
                    value={foundingYear}
                    onChange={(e) => setFoundingYear(parseInt(e.target.value) || 2018)}
                    className="w-32 px-3 py-2 bg-white border-2 border-amber-400 focus:border-red-600 rounded-xl text-base font-black text-amber-950 text-center shadow-inner outline-none"
                  />
                  <div className="text-xs font-bold text-amber-950 bg-amber-200/80 px-3 py-2 rounded-xl border border-amber-300">
                    Возраст команды: <span className="text-red-700 font-black text-sm">{Math.max(1, new Date().getFullYear() - foundingYear)} лет</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed pt-1">
                  💡 На основе этого значения рассчитывается юбилейный стаж команды «НЕГОДЯИ» на главной странице, в шапке сайта, подвале и статистических сводках.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveTeamConfig({ foundingYear })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> Сохранить год основания
                </button>
              </div>
            </div>

            {/* Card 2: AI Bot & Psychotypes Configuration */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-2 border-b border-amber-200">
                <div className="p-2 bg-red-600 text-yellow-300 rounded-xl">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase text-amber-950">
                    ИИ-Бот Максимка и психотипы
                  </h4>
                  <p className="text-[11px] font-bold text-amber-800">
                    Поведение помощника и ролевая адаптация под участников
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-amber-950 uppercase mb-1">
                    Уровень крепких выражений (мат бота):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low', label: 'Без мата', desc: 'Приличный походный' },
                      { id: 'medium', label: 'Умеренно', desc: 'С перчинкой «бля»' },
                      { id: 'high', label: 'Хардкор', desc: 'Полный походный угар' }
                    ].map(lvl => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setSwearingLevel(lvl.id as any);
                          handleSaveTeamConfig({ swearingLevel: lvl.id as any });
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          swearingLevel === lvl.id
                            ? 'bg-red-600 text-yellow-300 border-amber-950 font-black shadow-md'
                            : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100 font-bold'
                        }`}
                      >
                        <div className="text-xs uppercase">{lvl.label}</div>
                        <div className="text-[9px] opacity-80">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDetect}
                      onChange={(e) => {
                        setAutoDetect(e.target.checked);
                        handleSaveTeamConfig({ autoDetectPsychotype: e.target.checked });
                      }}
                      className="mt-1 w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-black text-amber-950 block">
                        Автоопределение психотипов в чате
                      </span>
                      <span className="text-[11px] text-stone-600 block leading-tight mt-0.5">
                        Бот Максимка анализирует характер реплик участников и подстраивает шутки под их слабости (Excel-занудство, страх медведей, любовь к плову, песни у костра).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveTeamConfig()}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase rounded-xl border border-amber-400 transition-colors"
                >
                  Применить все настройки
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <CheckSquare size={18} />
              Задачи подготовки к слёту ({tasks.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1"
            >
              <Plus size={14} /> Добавить задачу
            </button>
          </div>

          {showAddTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!taskTitle.trim()) return;
                const assignee = participants.find(p => p.id === taskAssignee) || participants[0];
                const newTask: TaskItem = {
                  id: 'task_' + Date.now(),
                  title: taskTitle.trim(),
                  assigneeId: assignee.id,
                  assigneeName: assignee.name,
                  deadline: taskDeadline || 'До слёта',
                  isCompleted: false
                };
                onUpdateTasks([...tasks, newTask]);
                setTaskTitle('');
                setShowAddTask(false);
              }}
              className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Задача:</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Например: Закупить 10 пачек сухого спирта"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Ответственный:</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-red-600 text-yellow-300 rounded-lg text-xs font-black uppercase shadow"
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.isCompleted}
                    onChange={() => {
                      onUpdateTasks(tasks.map(item => item.id === t.id ? { ...item, isCompleted: !item.isCompleted } : item));
                    }}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span className={`text-xs font-bold ${t.isCompleted ? 'line-through text-amber-600' : 'text-amber-950'}`}>
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full">
                    👤 {t.assigneeName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateTasks(tasks.filter(item => item.id !== t.id))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MENU & GROCERY */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Menu Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
                <Coffee size={18} />
                Походное меню
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1"
              >
                <Plus size={14} /> Добавить блюдо
              </button>
            </div>

            {showAddMenu && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!menuDish.trim()) return;
                  const newDish: MenuItem = {
                    id: 'dish_' + Date.now(),
                    day: menuDay,
                    dishName: menuDish.trim(),
                    description: menuDesc
                  };
                  onUpdateMenuItems([...menuItems, newDish]);
                  setMenuDish('');
                  setMenuDesc('');
                  setShowAddMenu(false);
                }}
                className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Приём пищи:</label>
                    <input
                      type="text"
                      value={menuDay}
                      onChange={(e) => setMenuDay(e.target.value)}
                      placeholder="День 1. Обед"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Название блюда:</label>
                    <input
                      type="text"
                      required
                      value={menuDish}
                      onChange={(e) => setMenuDish(e.target.value)}
                      placeholder="Например: Плов по-негодяйски"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Ингредиенты / Секреты:</label>
                  <textarea
                    value={menuDesc}
                    onChange={(e) => setMenuDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-amber-950 h-16"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddMenu(false)} className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold">Отмена</button>
                  <button type="submit" className="px-4 py-1 bg-red-600 text-yellow-300 rounded-lg text-xs font-black uppercase shadow">Добавить</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map(m => (
                <div key={m.id} className="bg-amber-50 border border-amber-300 rounded-xl p-3 relative group">
                  <span className="text-[10px] font-black uppercase text-red-600 bg-amber-200 px-2 py-0.5 rounded-full">{m.day}</span>
                  <h5 className="font-black text-sm text-amber-950 mt-1">{m.dishName}</h5>
                  {m.description && <p className="text-xs text-amber-800 mt-1">{m.description}</p>}
                  <button
                    type="button"
                    onClick={() => onUpdateMenuItems(menuItems.filter(item => item.id !== m.id))}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Grocery Items */}
          <div className="space-y-3 pt-4 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
                <Package size={18} />
                Список закупки продуктов
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGrocery(!showAddGrocery)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1"
              >
                <Plus size={14} /> Добавить позицию
              </button>
            </div>

            {showAddGrocery && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!groceryName.trim()) return;
                  const newG: GroceryItem = {
                    id: 'g_' + Date.now(),
                    name: groceryName.trim(),
                    quantity: groceryQty || 'По потребности',
                    category: groceryCategory,
                    isBought: false
                  };
                  onUpdateGroceryItems([...groceryItems, newG]);
                  setGroceryName('');
                  setGroceryQty('');
                  setShowAddGrocery(false);
                }}
                className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Продукт:</label>
                    <input
                      type="text"
                      required
                      value={groceryName}
                      onChange={(e) => setGroceryName(e.target.value)}
                      placeholder="Тушенка говяжья высший сорт"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Количество:</label>
                    <input
                      type="text"
                      value={groceryQty}
                      onChange={(e) => setGroceryQty(e.target.value)}
                      placeholder="20 банок"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Категория:</label>
                    <select
                      value={groceryCategory}
                      onChange={(e) => setGroceryCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    >
                      <option value="Мясо / Консервы">Мясо / Консервы</option>
                      <option value="Крупы / Макароны">Крупы / Макароны</option>
                      <option value="Овощи / Зелень">Овощи / Зелень</option>
                      <option value="Специи / Чай">Специи / Чай</option>
                      <option value="Хозтовары">Хозтовары</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddGrocery(false)} className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold">Отмена</button>
                  <button type="submit" className="px-4 py-1 bg-red-600 text-yellow-300 rounded-lg text-xs font-black uppercase shadow">Сохранить</button>
                </div>
              </form>
            )}

            <div className="space-y-1.5">
              {groceryItems.map(g => (
                <div key={g.id} className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={g.isBought}
                      onChange={() => {
                        onUpdateGroceryItems(groceryItems.map(item => item.id === g.id ? { ...item, isBought: !item.isBought } : item));
                      }}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className={`text-xs font-bold ${g.isBought ? 'line-through text-amber-600' : 'text-amber-950'}`}>
                      {g.name}
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">
                      {g.quantity}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateGroceryItems(groceryItems.filter(item => item.id !== g.id))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <Package size={18} />
              Лагерный инвентарь и снаряжение
            </h3>
            <button
              type="button"
              onClick={() => setShowAddInventory(!showAddInventory)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1"
            >
              <Plus size={14} /> Добавить инвентарь
            </button>
          </div>

          {showAddInventory && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inventoryName.trim()) return;
                const newInv: InventoryItem = {
                  id: 'inv_' + Date.now(),
                  name: inventoryName.trim(),
                  condition: inventoryCondition,
                  responsibleName: inventoryResponsible
                };
                onUpdateInventoryItems([...inventoryItems, newInv]);
                setInventoryName('');
                setShowAddInventory(false);
              }}
              className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Предмет:</label>
                  <input
                    type="text"
                    required
                    value={inventoryName}
                    onChange={(e) => setInventoryName(e.target.value)}
                    placeholder="Например: Большой казан 15л"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Состояние:</label>
                  <select
                    value={inventoryCondition}
                    onChange={(e) => setInventoryCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  >
                    <option value="отличное">Отличное</option>
                    <option value="нормальное">Нормальное</option>
                    <option value="требует ремонта">Требует ремонта</option>
                    <option value="утеряно">Утеряно</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Хранитель:</label>
                  <input
                    type="text"
                    value={inventoryResponsible}
                    onChange={(e) => setInventoryResponsible(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddInventory(false)} className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold">Отмена</button>
                <button type="submit" className="px-4 py-1 bg-red-600 text-yellow-300 rounded-lg text-xs font-black uppercase shadow">Сохранить</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inventoryItems.map(inv => (
              <div key={inv.id} className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-950">{inv.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      inv.condition === 'нормальное' ? 'bg-emerald-100 text-emerald-800' :
                      inv.condition === 'пришло в негодность' ? 'bg-amber-200 text-amber-900' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inv.condition}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-2 font-medium">
                    Хранит: <strong className="text-amber-950">{inv.responsibleName}</strong>
                  </p>
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={() => onUpdateInventoryItems(inventoryItems.filter(item => item.id !== inv.id))}
                    className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash size={12} /> Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CONTESTS */}
      {activeTab === 'contests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <Award size={18} />
              Конкурсы слёта и График соревнований
            </h3>
          </div>

          <div className="space-y-3">
            {contests.map(c => {
              const participatingMembers = participants.filter(p => c.teamMemberIds?.includes(p.id) && p.id !== c.captainId);
              const allAssignedIds = new Set([c.captainId, ...(c.teamMemberIds || [])]);
              const totalCount = (c.captainId ? 1 : 0) + participatingMembers.length;

              return (
                <div key={c.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-sm uppercase text-amber-950">{c.title}</h5>
                        {c.schedule && (
                          <span className="bg-stone-800 text-yellow-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            🕒 {c.schedule}
                          </span>
                        )}
                        {c.place && (
                          <span className="bg-yellow-300 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full border border-yellow-500">
                            {c.place}
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-xs text-stone-600 font-medium mt-1">{c.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={c.place || ''}
                        onChange={(e) => {
                          const newPlace = e.target.value;
                          onUpdateContests(contests.map(item => item.id === c.id ? { ...item, place: newPlace } : item));
                        }}
                        className="bg-white border border-amber-400 rounded-xl px-2.5 py-1 text-xs font-black text-amber-950 outline-none"
                      >
                        <option value="">Без места</option>
                        <option value="🥇 1-е место">🥇 1-е место</option>
                        <option value="🥈 2-е место">🥈 2-е место</option>
                        <option value="🥉 3-е место">🥉 3-е место</option>
                        <option value="Призёр">Призёр</option>
                        <option value="Участие">Участие</option>
                      </select>
                    </div>
                  </div>

                  {/* FULL PARTICIPANTS LIST */}
                  <div className="bg-white/80 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-red-600" />
                        Состав участников на конкурсе ({totalCount} чел.):
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Captain Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200 border-2 border-amber-400 rounded-xl text-xs font-black text-amber-950 shadow-2xs">
                        <span>👑</span>
                        <span>{c.captainName}</span>
                        <span className="bg-red-600 text-yellow-300 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                          Капитан конкурса
                        </span>
                      </div>

                      {/* Participating Members */}
                      {participatingMembers.map(m => (
                        <div key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-stone-900 shadow-2xs">
                          <span>{m.avatar || '🏕️'}</span>
                          <span>{m.name}</span>
                          <span className="text-stone-400 text-[10px]">(@{m.nickname})</span>
                          <button
                            type="button"
                            title="Исключить из состава"
                            onClick={() => {
                              const updatedMembers = (c.teamMemberIds || []).filter(id => id !== m.id);
                              onUpdateContests(contests.map(item => item.id === c.id ? { ...item, teamMemberIds: updatedMembers } : item));
                            }}
                            className="text-stone-400 hover:text-red-600 ml-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {participatingMembers.length === 0 && (
                        <span className="text-xs text-stone-500 italic py-1">
                          (Другие участники пока не записаны)
                        </span>
                      )}
                    </div>

                    {/* Quick Add Member to Contest */}
                    {participants.filter(p => !allAssignedIds.has(p.id)).length > 0 && (
                      <div className="pt-2 border-t border-amber-100 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-amber-800">Добавить участника:</span>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const addId = e.target.value;
                            if (addId) {
                              const currentList = c.teamMemberIds || [];
                              if (!currentList.includes(addId)) {
                                onUpdateContests(contests.map(item => item.id === c.id ? { ...item, teamMemberIds: [...currentList, addId] } : item));
                              }
                              e.target.value = '';
                            }
                          }}
                          className="bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-950 outline-none"
                        >
                          <option value="">+ Выбрать из списка команды...</option>
                          {participants.filter(p => !allAssignedIds.has(p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {c.imageUrl && c.imageUrl.trim() ? (
                    <div className="mt-2 w-24 h-16 rounded border border-amber-300 overflow-hidden">
                      <img src={c.imageUrl.trim()} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: EXCURSIONS / RALLY EXPENSES */}
      {activeTab === 'excursions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <Calendar size={18} />
              Слёты и Взносы на Поход ({excursions.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingExcursion(null);
                setShowAddExcursion(!showAddExcursion);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> <span>Добавить сбор</span>
            </button>
          </div>

          {/* Form: Add New Excursion */}
          {showAddExcursion && (
            <form
              onSubmit={handleCreateExcursion}
              className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in"
            >
              <h4 className="font-black text-xs uppercase text-red-700">Создание нового сбора команды</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Название сбора / слёта:</label>
                  <input
                    type="text"
                    required
                    value={newExcursion.title}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Например: Большой Осенний Слёт Негодяев 2026"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Локация проведения:</label>
                  <input
                    type="text"
                    required
                    value={newExcursion.location}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Например: Лесное урочище, оз. Светлое"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Дата проведения:</label>
                  <input
                    type="date"
                    value={newExcursion.date}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Описание сбора (необязательно):</label>
                  <input
                    type="text"
                    value={newExcursion.description}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Программа, план, что берем..."
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Взнос с парней (₽):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newExcursion.costBoys}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, costBoys: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Взнос с девушек (₽):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newExcursion.costGirls}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, costGirls: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                <button 
                  type="button" 
                  onClick={() => setShowAddExcursion(false)} 
                  className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingExcursion}
                  className="px-5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 rounded-xl text-xs font-black uppercase shadow transition-colors"
                >
                  {isSavingExcursion ? 'Сохранение...' : 'Сохранить сбор'}
                </button>
              </div>
            </form>
          )}

          {/* Modal: Edit Existing Excursion */}
          {editingExcursion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-amber-50 border-4 border-red-600 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-amber-200">
                  <h4 className="font-black text-base uppercase text-amber-950 flex items-center gap-2">
                    <Edit size={18} className="text-red-600" />
                    <span>Редактирование слёта и взносов</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingExcursion(null)}
                    className="text-amber-800 hover:text-red-600 font-black text-sm px-2 py-1 rounded-lg hover:bg-amber-200"
                  >
                    ✕ Закрыть
                  </button>
                </div>

                <form onSubmit={handleSaveEditExcursion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-amber-950 uppercase mb-1">Название сбора:</label>
                      <input
                        type="text"
                        required
                        value={editingExcursion.title}
                        onChange={(e) => setEditingExcursion({ ...editingExcursion, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-amber-950 uppercase mb-1">Локация проведения:</label>
                      <input
                        type="text"
                        required
                        value={editingExcursion.location}
                        onChange={(e) => setEditingExcursion({ ...editingExcursion, location: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-amber-950 uppercase mb-1">Дата проведения:</label>
                      <input
                        type="text"
                        value={editingExcursion.date}
                        onChange={(e) => setEditingExcursion({ ...editingExcursion, date: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-amber-950 uppercase mb-1">Описание слёта:</label>
                      <input
                        type="text"
                        value={editingExcursion.description || ''}
                        onChange={(e) => setEditingExcursion({ ...editingExcursion, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="bg-blue-50/80 p-3 rounded-2xl border-2 border-blue-200">
                      <label className="block text-xs font-black text-blue-950 uppercase mb-1">Взнос с парней (₽):</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={editingExcursion.costBoys ?? editingExcursion.costPerPerson}
                        onChange={(e) => setEditingExcursion({ 
                          ...editingExcursion, 
                          costBoys: Number(e.target.value),
                          costPerPerson: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 bg-white border-2 border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:border-blue-600 outline-none"
                      />
                    </div>
                    <div className="bg-pink-50/80 p-3 rounded-2xl border-2 border-pink-200">
                      <label className="block text-xs font-black text-pink-950 uppercase mb-1">Взнос с девушек (₽):</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={editingExcursion.costGirls ?? Math.round(editingExcursion.costPerPerson * 0.7)}
                        onChange={(e) => setEditingExcursion({ 
                          ...editingExcursion, 
                          costGirls: Number(e.target.value) 
                        })}
                        className="w-full px-3 py-2 bg-white border-2 border-pink-300 rounded-xl text-xs font-bold text-pink-950 focus:border-pink-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-amber-300">
                      <input
                        type="checkbox"
                        checked={editingExcursion.isActive}
                        onChange={(e) => setEditingExcursion({ ...editingExcursion, isActive: e.target.checked })}
                        className="w-4 h-4 text-red-600 accent-red-600 rounded"
                      />
                      <span className="text-xs font-black text-amber-950 uppercase">Слёт активен (актуальный сбор)</span>
                    </label>

                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setEditingExcursion(null)} 
                        className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors"
                      >
                        Отмена
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSavingExcursion}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase shadow-md transition-colors"
                      >
                        {isSavingExcursion ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {excursions.length === 0 ? (
              <div className="bg-amber-50 rounded-2xl p-6 text-center border-2 border-dashed border-amber-300 text-stone-600 text-xs">
                Пока нет созданных сборов. Нажмите «Добавить сбор» выше, чтобы создать первый слёт команды.
              </div>
            ) : (
              excursions.map(ex => (
                <div key={ex.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm uppercase text-amber-950">{ex.title}</h4>
                      {ex.isActive ? (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                          Активный слёт
                        </span>
                      ) : (
                        <span className="bg-stone-300 text-stone-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          В архиве
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5">
                      📍 {ex.location} • 📅 {ex.date}
                    </p>
                    {ex.description && (
                      <p className="text-[11px] text-stone-600 mt-0.5 italic">{ex.description}</p>
                    )}
                    <div className="text-xs font-bold text-amber-900 mt-1 flex items-center gap-2">
                      <span>Парни: <strong className="text-blue-700 font-black">{ex.costBoys || ex.costPerPerson} ₽</strong></span>
                      <span>•</span>
                      <span>Девушки: <strong className="text-pink-700 font-black">{ex.costGirls || Math.round(ex.costPerPerson * 0.7)} ₽</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExcursion(false);
                        setEditingExcursion(ex);
                      }}
                      className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-amber-950 rounded-xl text-xs font-black uppercase shadow-xs border-2 border-amber-500 flex items-center gap-1.5 transition-all"
                      title="Редактировать слёт и взносы"
                    >
                      <Edit size={14} className="text-red-700" />
                      <span>Редактировать</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleExcursionActive(ex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow-2xs transition-colors ${
                        ex.isActive ? 'bg-stone-200 text-stone-800 hover:bg-stone-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                      title={ex.isActive ? 'Переместить в архив' : 'Активировать сбор'}
                    >
                      {ex.isActive ? 'В архив' : 'Активировать'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Удалить слёт «${ex.title}»?`)) {
                          handleDeleteExcursion(ex.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить слёт"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: RESET PARTICIPANT PASSWORD (CAPTAIN ONLY) */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-4 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-sm uppercase">Сброс пароля участника</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Штаб Капитана команды</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetModalUser(null);
                  setResetSuccessMessage(null);
                }}
                className="text-stone-400 hover:text-stone-700 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Target User Info */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 flex items-center gap-3">
              <img
                src={getParticipantAvatar(resetModalUser)}
                alt={resetModalUser.name}
                className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover bg-white"
              />
              <div>
                <h4 className="font-black text-amber-950 text-sm">{resetModalUser.name}</h4>
                <div className="text-xs font-bold text-red-600">@{resetModalUser.nickname}</div>
                <div className="text-[11px] text-stone-500">{resetModalUser.email || resetModalUser.phone || 'Контакты не указаны'}</div>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-xl p-4 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-black text-xs uppercase">{resetSuccessMessage}</p>
                <p className="text-[11px] text-emerald-700">Сообщите этот пароль участнику команды.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customNewPassword.trim()) {
                    alert('Введите новый пароль');
                    return;
                  }
                  handleResetUserPassword(resetModalUser.id, customNewPassword.trim());
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                    Новый пароль для участника:
                  </label>
                  <input
                    type="text"
                    value={customNewPassword}
                    onChange={(e) => setCustomNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50 border-2 border-amber-400 rounded-xl font-mono text-sm font-bold text-amber-950 focus:border-red-600 outline-none"
                    placeholder="Введите новый пароль"
                    required
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Быстрый выбор:</span>
                    <button
                      type="button"
                      onClick={() => setCustomNewPassword('123')}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold px-2 py-0.5 rounded-md"
                    >
                      123
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomNewPassword('321')}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold px-2 py-0.5 rounded-md"
                    >
                      321
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomNewPassword('negodyai1993')}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold px-2 py-0.5 rounded-md"
                    >
                      negodyai1993
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ Пароль будет немедленно изменён в системе. Участник сможет войти на сайт под своим позывным и этим новым паролем.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetSuccessMessage(null);
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase rounded-xl transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black text-xs uppercase rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <Key size={14} />
                    <span>{isResettingPassword ? 'Сохранение...' : 'Установить пароль'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      <DeleteParticipantModal
        participant={participantToDelete}
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDeleteParticipant}
      />

    </div>
  );
}
