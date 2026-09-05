import React, { useState } from 'react';
import { 
  Settings, Users, CheckSquare, Coffee, Package, Award, 
  Plus, Trash, Edit, CheckCircle, AlertTriangle, Shield, 
  Brain, Sliders, UserCheck, UserX, Key, Calendar, MapPin
} from 'lucide-react';
import { 
  Participant, TaskItem, MenuItem, GroceryItem, 
  InventoryItem, Contest, Excursion, BotConfig, InventoryCondition,
  UserRole, ROLE_DEFINITIONS
} from '../types';
import { PSYCHOTYPES } from '../mockData';

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
  onSetRole
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'roles' | 'psychotypes' | 'tasks' | 'menu' | 'inventory' | 'contests' | 'excursions'>('pending');

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

  // Excursion form
  const [showAddExcursion, setShowAddExcursion] = useState(false);
  const [newExcursion, setNewExcursion] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    costBoys: 5000,
    costGirls: 3500
  });

  const pendingUsers = participants.filter(p => p.accountStatus === 'pending');

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border-4 border-red-600 rounded-3xl p-8 max-w-lg mx-auto text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-600 text-yellow-300 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-amber-950 shadow-md">
          🔒
        </div>
        <h2 className="text-2xl font-black text-red-600 uppercase mb-2">Административная панель</h2>
        <p className="text-xs font-bold text-amber-900 mb-6 leading-relaxed">
          Управление слётом, одобрение регистраций новых участников, назначение казначея фонда, настройка задач, инвентаря и психотипов доступны только администраторам.
        </p>
        <button
          type="button"
          onClick={onOpenLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs py-3.5 rounded-xl border-2 border-amber-950 shadow-md transition-all active:scale-95"
        >
          Войти как Организатор
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-red-600 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
      
      {/* Top Header with Status & Logout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b-2 border-amber-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-yellow-300 text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-950">
              👑 Режим Организатора
            </span>
            {pendingUsers.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                {pendingUsers.length} новых заявок!
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-red-600 uppercase mt-1">
            Штаб управления бандой «Негодяи»
          </h2>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 bg-amber-100 hover:bg-red-600 hover:text-white text-red-700 font-black text-xs uppercase rounded-xl border-2 border-red-300 transition-colors shrink-0"
        >
          Выйти из админки 🚪
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-amber-100 p-1.5 rounded-2xl border-2 border-amber-300">
        {[
          { id: 'pending', label: `Заявки (${pendingUsers.length})`, icon: UserCheck, alert: pendingUsers.length > 0 },
          { id: 'roles', label: 'Роли & Казначей', icon: Shield },
          { id: 'psychotypes', label: 'Психотипы & ИИ', icon: Brain },
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

      {/* TAB 1: PENDING REGISTRATIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <UserCheck size={18} />
              Подтверждение регистрации участников
            </h3>
            <span className="text-xs font-bold text-amber-900">
              Ожидают проверки: {pendingUsers.length}
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-amber-50 rounded-2xl p-8 text-center border-2 border-dashed border-amber-300">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-black text-amber-950 text-sm uppercase">Все заявки рассмотрены!</p>
              <p className="text-xs text-amber-700 mt-1">Новые участники после регистрации сразу появятся в этом списке.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(p => (
                <div key={p.id} className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-amber-400 bg-white" />
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
                        Статус: <strong className="text-amber-800 uppercase">Ожидает решения администратора</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs uppercase rounded-xl border border-red-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <UserX size={14} />
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {participants.map(p => {
                  const currentRole = p.role || 'member';
                  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.member;

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/80 transition-colors">
                      <td className="p-3 font-bold text-amber-950 flex items-center gap-2">
                        <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full border border-amber-300 object-cover" />
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PSYCHOTYPES & AI COEFFICIENTS (Relocated into Admin panel!) */}
      {activeTab === 'psychotypes' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-3 border-amber-400 rounded-2xl p-5">
            <h3 className="font-black text-lg uppercase text-red-600 flex items-center gap-2 mb-2">
              <Brain size={20} className="text-red-600" />
              Коэффициенты и Тональность ИИ (Психотипы)
            </h3>
            <p className="text-xs text-amber-800 mb-4 font-medium leading-relaxed">
              Блок управления психотипами, походным лексиконом и чувствительностью ИИ перенесен в панель администратора по правилам конфиденциальности команды.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Swearing Level Slider */}
              <div className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-sm space-y-3">
                <label className="block text-xs uppercase font-black text-amber-950">
                  Уровень матершинных выражений (лексикон ИИ):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onUpdateBotConfig({ ...botConfig, swearingLevel: lvl })}
                      className={`text-xs font-black py-2 rounded-xl transition-all uppercase ${
                        botConfig.swearingLevel === lvl
                          ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {lvl === 'low' ? 'Мягкий' : lvl === 'medium' ? 'Сочный' : 'Покос'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-amber-700 font-medium">
                  {botConfig.swearingLevel === 'low' && 'Без мата. ИИ выражается любя: "засранцы", "косячники".'}
                  {botConfig.swearingLevel === 'medium' && 'Умеренное дружеское использование ("бля", "пиздец", "нахуй").'}
                  {botConfig.swearingLevel === 'high' && 'Максимальный угар. Сочные народные ругательства, юмор у костра ("За пизду бля!", "Ахуенно!").'}
                </p>
              </div>

              {/* Auto detect & founding year */}
              <div className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={botConfig.autoDetectPsychotype}
                      onChange={(e) => onUpdateBotConfig({ ...botConfig, autoDetectPsychotype: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-2 border-red-500 rounded accent-red-600"
                    />
                    <span className="text-xs font-black text-amber-950 uppercase">
                      Автодетект Психотипа в диалогах
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    ИИ автоматически распознает стиль общения и корректирует психотип участника.
                  </p>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase">Год основания команды:</span>
                  <input
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    value={botConfig.foundingYear || 2018}
                    onChange={(e) => onUpdateBotConfig({ ...botConfig, foundingYear: Number(e.target.value) || 2018 })}
                    className="w-20 px-2 py-1 bg-white border border-amber-400 rounded text-center text-xs font-black text-red-700"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Reference of Psychotypes */}
          <div className="space-y-2">
            <h4 className="font-black text-sm uppercase text-amber-950">Справочник доступных психотипов команды:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PSYCHOTYPES.map(pt => (
                <div key={pt.name} className="bg-amber-50 border border-amber-300 rounded-xl p-3">
                  <span className="font-black text-xs text-red-700 uppercase block">{pt.name}</span>
                  <p className="text-[11px] text-amber-900 mt-1 leading-tight font-medium">{pt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Update Member Psychotypes in table */}
          <div className="space-y-2 pt-2">
            <h4 className="font-black text-sm uppercase text-amber-950">Назначение психотипов участникам:</h4>
            <div className="overflow-x-auto rounded-xl border border-amber-300">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-amber-100 font-black text-amber-950">
                  <tr>
                    <th className="p-2.5">Участник</th>
                    <th className="p-2.5">Психотип</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {participants.map(p => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-bold text-amber-950">{p.name} (@{p.nickname})</td>
                      <td className="p-2.5">
                        <select
                          value={p.psychotype}
                          onChange={(e) => {
                            const newPsychotype = e.target.value;
                            onUpdateParticipants(participants.map(part => part.id === p.id ? { ...part, psychotype: newPsychotype } : part));
                          }}
                          className="bg-amber-50 border border-amber-400 rounded px-2 py-1 text-xs font-bold text-amber-950"
                        >
                          {PSYCHOTYPES.map(pt => (
                            <option key={pt.name} value={pt.name}>{pt.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            {contests.map(c => (
              <div key={c.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-sm uppercase text-amber-950">{c.title}</h5>
                    {c.place && (
                      <span className="bg-yellow-300 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full border border-yellow-500">
                        {c.place}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-amber-800 mt-1 space-x-3">
                    <span>👑 Капитан: <strong>{c.captainName}</strong></span>
                    {c.teamMemberIds && c.teamMemberIds.length > 0 && (
                      <span>👥 В команде: {c.teamMemberIds.length} чел.</span>
                    )}
                  </div>
                  {c.imageUrl && (
                    <div className="mt-2 w-24 h-16 rounded border border-amber-300 overflow-hidden">
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={c.place || ''}
                    onChange={(e) => {
                      const newPlace = e.target.value;
                      onUpdateContests(contests.map(item => item.id === c.id ? { ...item, place: newPlace } : item));
                    }}
                    className="bg-white border border-amber-400 rounded-xl px-2 py-1 text-xs font-black text-amber-950"
                  >
                    <option value="">Без места</option>
                    <option value="🥇 1-е место">🥇 1-е место</option>
                    <option value="🥈 2-е место">🥈 2-е место</option>
                    <option value="🥉 3-е место">🥉 3-е место</option>
                    <option value="Участие">Участие</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: EXCURSIONS / RALLY EXPENSES */}
      {activeTab === 'excursions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase text-red-600 flex items-center gap-2">
              <Calendar size={18} />
              Слёты и Взносы на Поход
            </h3>
            <button
              type="button"
              onClick={() => setShowAddExcursion(!showAddExcursion)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl shadow flex items-center gap-1"
            >
              <Plus size={14} /> Добавить сбор
            </button>
          </div>

          {showAddExcursion && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newExcursion.title.trim()) return;
                const created: Excursion = {
                  id: 'ex_' + Date.now(),
                  title: newExcursion.title.trim(),
                  date: newExcursion.date || new Date().toISOString().split('T')[0],
                  location: newExcursion.location || 'Лесная поляна',
                  description: newExcursion.description,
                  costPerPerson: Number(newExcursion.costBoys),
                  costBoys: Number(newExcursion.costBoys),
                  costGirls: Number(newExcursion.costGirls),
                  isActive: true
                };
                onUpdateExcursions([...excursions, created]);
                setShowAddExcursion(false);
              }}
              className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Название сбора:</label>
                  <input
                    type="text"
                    required
                    value={newExcursion.title}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Локация:</label>
                  <input
                    type="text"
                    required
                    value={newExcursion.location}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Взнос с парней (₽):</label>
                  <input
                    type="number"
                    value={newExcursion.costBoys}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, costBoys: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Взнос с девушек (₽):</label>
                  <input
                    type="number"
                    value={newExcursion.costGirls}
                    onChange={(e) => setNewExcursion(prev => ({ ...prev, costGirls: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddExcursion(false)} className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold">Отмена</button>
                <button type="submit" className="px-4 py-1 bg-red-600 text-yellow-300 rounded-lg text-xs font-black uppercase shadow">Сохранить</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {excursions.map(ex => (
              <div key={ex.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm uppercase text-amber-950">{ex.title}</h4>
                  <p className="text-xs text-amber-800">
                    📍 {ex.location} • 📅 {ex.date}
                  </p>
                  <div className="text-xs font-bold text-amber-900 mt-1">
                    Парни: <span className="text-blue-700">{ex.costBoys || ex.costPerPerson} ₽</span> | 
                    Девушки: <span className="text-pink-700">{ex.costGirls || Math.round(ex.costPerPerson * 0.7)} ₽</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateExcursions(excursions.map(e => e.id === ex.id ? { ...e, isActive: !e.isActive } : e));
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase shadow ${
                      ex.isActive ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {ex.isActive ? 'Активен' : 'В архиве'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateExcursions(excursions.filter(e => e.id !== ex.id))}
                    className="p-1.5 text-red-500 hover:text-red-700"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
