import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, Trash, Trash2, Edit, CheckCircle, AlertTriangle, Shield, 
  UserCheck, UserX, Key, Calendar, MapPin, RefreshCw, Flame, Crown
} from 'lucide-react';
import { 
  Participant, TaskItem, MenuItem, GroceryItem, 
  InventoryItem, Contest, Excursion, BotConfig, InventoryCondition,
  UserRole, ROLE_DEFINITIONS, isUniqueRole, RallyCoin
} from '../types';
import { getSafeAvatar, getParticipantAvatar } from '../utils/avatar';
import DeleteParticipantModal from './DeleteParticipantModal';
import CaptainCoinPanel from './game/CaptainCoinPanel';

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
  coins?: RallyCoin[];
  onAwardCoin?: (newCoinData: {
    participantId: string;
    participantName: string;
    participantNickname: string;
    taskTitle: string;
    category: 'task' | 'merit' | 'contest' | 'fortune';
    comment: string;
    awardedBy: string;
  }) => Promise<void> | void;
  onDeleteCoin?: (coinId: string) => Promise<void> | void;
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
  onSetRole,
  coins,
  onAwardCoin,
  onDeleteCoin
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'roles' | 'excursions' | 'captain_panel'>('pending');

  // Team parameters (Captain control: founding year)
  const [foundingYear, setFoundingYear] = useState<number>(botConfig.foundingYear || 1993);
  const [isSavedTeamConfig, setIsSavedTeamConfig] = useState(false);

  useEffect(() => {
    if (botConfig.foundingYear) setFoundingYear(botConfig.foundingYear);
  }, [botConfig]);

  const handleSaveTeamConfig = (overrides?: Partial<BotConfig>) => {
    const updated: BotConfig = {
      ...botConfig,
      foundingYear: overrides?.foundingYear !== undefined ? overrides.foundingYear : foundingYear
    };
    onUpdateBotConfig(updated);
    setIsSavedTeamConfig(true);
    setTimeout(() => setIsSavedTeamConfig(false), 2500);
  };

  // Role transfer confirmation modal state (strictly prevents duplicate roles in the team)
  const [roleTransferModal, setRoleTransferModal] = useState<{
    targetParticipant: Participant;
    newRole: UserRole;
    previousHolder: Participant;
  } | null>(null);

  const handleInitiateRoleChange = (targetParticipant: Participant, newRole: UserRole) => {
    const currentRole = targetParticipant.role || 'member';
    if (newRole === currentRole) return;

    if (newRole === 'member') {
      onSetRole(targetParticipant.id, 'member');
      return;
    }

    // Check if another participant in the team already holds this unique role
    const currentHolder = participants.find(p => p.id !== targetParticipant.id && p.role === newRole);
    if (currentHolder) {
      setRoleTransferModal({
        targetParticipant,
        newRole,
        previousHolder: currentHolder
      });
    } else {
      onSetRole(targetParticipant.id, newRole);
    }
  };

  const handleConfirmRoleTransfer = () => {
    if (!roleTransferModal) return;
    onSetRole(roleTransferModal.targetParticipant.id, roleTransferModal.newRole);
    setRoleTransferModal(null);
  };

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

  const loadResetRequests = async (showLoading = false) => {
    if (showLoading) setIsLoadingResetRequests(true);
    try {
      const res = await fetch('/api/admin/password-reset-requests');
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load reset requests:", err);
    } finally {
      if (showLoading) setIsLoadingResetRequests(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadResetRequests(false);
      const interval = setInterval(() => {
        loadResetRequests(false);
      }, 10000);
      return () => clearInterval(interval);
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
        loadResetRequests(false);
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

  const handleManualRefresh = async () => {
    setIsRefreshingPending(true);
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.participants && Array.isArray(data.participants)) {
          onUpdateParticipants(data.participants);
        }
      }
      await loadResetRequests(true);
    } catch (err) {
      console.error("Manual refresh error:", err);
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

  // Verify if current user is the Captain
  const isCaptain = (user: Participant | null | undefined): boolean => {
    if (!user) return false;
    const nick = (user.nickname || '').toLowerCase().replace(/^@/, '');
    const email = (user.email || '').toLowerCase();
    const name = (user.name || '').toLowerCase();
    return user.role === 'admin' || nick === 'ковбой' || nick === 'cowboy' || email === 'asamoilov81@gmail.com' || name.includes('самойлов') || user.id === 'cowboy_1';
  };

  const effectiveIsAdmin = isAdmin || isCaptain(currentUser);

  if (!effectiveIsAdmin) {
    return (
      <div className="bg-yellow-50 border-4 border-red-600 rounded-3xl p-8 max-w-lg mx-auto text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-600 text-yellow-300 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-amber-950 shadow-md">
          🔒
        </div>
        <h2 className="text-2xl font-black text-red-600 uppercase mb-2">Панель Капитана команды</h2>
        <p className="text-xs font-bold text-amber-900 mb-6 leading-relaxed">
          Управление слётом, одобрение регистраций новых участников, назначение казначея фонда, настройка задач и инвентаря доступны только Капитану команды (Андрей Самойлов, позывной «Ковбой»).
        </p>
        <button
          type="button"
          onClick={onOpenLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs py-3.5 rounded-xl border-2 border-amber-950 shadow-md transition-all active:scale-95 cursor-pointer"
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
              { id: 'excursions', label: 'Слёты и Взносы', icon: Calendar },
              { id: 'captain_panel', label: 'Панель Капитана', icon: Crown }
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
                  onClick={handleManualRefresh}
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
                  <p className="text-xs text-amber-700 mt-1">Новые заявки на регистрацию в команду сразу поступают сюда на рассмотрение.</p>
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
            {Object.values(ROLE_DEFINITIONS).map((r) => {
              const currentHolder = participants.find(p => p.role === r.role);
              const isMemberRole = r.role === 'member';
              const membersCount = participants.filter(p => !p.role || p.role === 'member').length;

              return (
                <div
                  key={r.role}
                  className={`bg-white border-2 rounded-xl p-3 shadow-xs flex flex-col justify-between transition-colors ${
                    currentHolder ? 'border-amber-400 hover:border-amber-500' : 'border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{r.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs text-amber-950 leading-tight truncate">{r.title}</h4>
                        <span className={`inline-block text-[9px] font-black px-1.5 py-0.2 rounded border ${r.color}`}>
                          {r.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {r.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-amber-100">
                    {isMemberRole ? (
                      <div className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0"></span>
                        <span>В строю: <strong>{membersCount}</strong> участников</span>
                      </div>
                    ) : currentHolder ? (
                      <div className="flex items-center justify-between gap-1.5 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={getParticipantAvatar(currentHolder)}
                            alt={currentHolder.name}
                            className="w-5 h-5 rounded-full border border-amber-300 object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-amber-950 truncate leading-tight">
                              {currentHolder.name}
                            </div>
                            <div className="text-[9px] text-red-700 font-bold truncate">
                              @{currentHolder.nickname}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSetRole(currentHolder.id, 'member')}
                          className="text-[10px] text-stone-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-stone-200 transition-colors shrink-0"
                          title="Освободить роль (сделать участником команды)"
                        >
                          Снять
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                        <span>Свободно (не назначен)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Participants Roles Table */}
          <div className="overflow-x-auto rounded-xl border-2 border-amber-300 shadow-md">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-amber-200 uppercase text-amber-950 font-black border-b border-amber-300">
                <tr>
                  <th className="p-3">Участник</th>
                  <th className="p-3">Позывной</th>
                  <th className="p-3">Текущая роль</th>
                  <th className="p-3 min-w-[240px]">Назначить роль в команде</th>
                  <th className="p-3 text-center">Управление & Аккаунт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {participants.map(p => {
                  const currentRole = p.role || 'member';
                  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.member;

                  const availableRoleKeys: UserRole[] = [
                    'member',
                    'foreman',
                    'designer',
                    'assistant_captain',
                    'keeper',
                    'chef',
                    'treasurer',
                    'admin'
                  ];

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
                            onChange={(e) => handleInitiateRoleChange(p, e.target.value as UserRole)}
                            className="bg-amber-50 border-2 border-amber-400 focus:border-red-600 text-amber-950 font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer w-full max-w-[290px]"
                          >
                            {availableRoleKeys.map(rKey => {
                              const rDef = ROLE_DEFINITIONS[rKey];
                              const occupiedBy = participants.find(other => other.role === rKey);
                              const isCurrent = currentRole === rKey;
                              let label = `${rDef.icon} ${rDef.title}`;

                              if (isCurrent) {
                                label += ' (текущая)';
                              } else if (rKey !== 'member' && occupiedBy) {
                                label += ` (занято: ${occupiedBy.name})`;
                              } else if (rKey !== 'member') {
                                label += ' (свободно)';
                              }

                              return (
                                <option key={rKey} value={rKey}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                          {currentRole !== 'member' && (
                            <button
                              type="button"
                              onClick={() => handleInitiateRoleChange(p, 'member')}
                              className="px-2 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] uppercase rounded-lg transition-colors whitespace-nowrap"
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

      {/* TAB: CAPTAIN PANEL (TRANSFERRED FROM GAME HUB AS REQUESTED) */}
      {activeTab === 'captain_panel' && (
        <div className="space-y-4">
          <div className="bg-amber-100/80 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-yellow-300 flex items-center justify-center shadow-md shrink-0">
                <Crown size={22} />
              </div>
              <div>
                <h3 className="font-black text-base uppercase text-red-700">Панель Капитана: Мотивация и Монеты слёта</h3>
                <p className="text-xs text-amber-900 font-medium">
                  Чеканка именных монет Негодяев, поощрение за дежурства, помощь лагерю и управление скидками на слёт.
                </p>
              </div>
            </div>
          </div>

          <CaptainCoinPanel
            participants={participants}
            coins={coins || []}
            onAwardCoin={onAwardCoin || (async () => {})}
            onDeleteCoin={onDeleteCoin || (async () => {})}
            captainUser={currentUser}
          />
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

      {/* Role Transfer Confirmation Modal (Guarantees zero role duplication in team) */}
      {roleTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-4 border-amber-500 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-2xl shrink-0">
                {ROLE_DEFINITIONS[roleTransferModal.newRole]?.icon || '👑'}
              </div>
              <div>
                <h3 className="font-black text-lg text-amber-950 uppercase leading-tight">
                  Передача командной роли
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  В туристической команде «Негодяи» роль не может дублироваться.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-300 text-xs text-amber-950 space-y-1">
              <p className="font-bold">
                Ключевая должность «{ROLE_DEFINITIONS[roleTransferModal.newRole]?.title}» уже закреплена за другим участником.
              </p>
              <p className="text-stone-600">
                В команде может быть только <strong>один</strong> {ROLE_DEFINITIONS[roleTransferModal.newRole]?.title.toLowerCase()}. Если подтвердить передачу, прежний ответственный автоматически станет рядовым участником команды.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              {/* Previous holder */}
              <div className="bg-stone-50 border-2 border-red-300 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-red-700 mb-2 block">
                  Снимается с роли ➔ Участник
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={getParticipantAvatar(roleTransferModal.previousHolder)}
                    alt={roleTransferModal.previousHolder.name}
                    className="w-10 h-10 rounded-full border border-stone-300 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-stone-900 truncate">
                      {roleTransferModal.previousHolder.name}
                    </h4>
                    <span className="text-[11px] text-red-600 font-bold block">
                      @{roleTransferModal.previousHolder.nickname}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-stone-500 font-medium">
                  Статус: станет рядовым Негодяем (⛺ Участник)
                </div>
              </div>

              {/* New assignee */}
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 mb-2 block">
                  Новый ответственный ➔ {ROLE_DEFINITIONS[roleTransferModal.newRole]?.badge}
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={getParticipantAvatar(roleTransferModal.targetParticipant)}
                    alt={roleTransferModal.targetParticipant.name}
                    className="w-10 h-10 rounded-full border border-emerald-400 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-emerald-950 truncate">
                      {roleTransferModal.targetParticipant.name}
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold block">
                      @{roleTransferModal.targetParticipant.nickname}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-emerald-800 font-black">
                  Получит роль: {ROLE_DEFINITIONS[roleTransferModal.newRole]?.title}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setRoleTransferModal(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleTransfer}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <span>Подтвердить передачу роли</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
