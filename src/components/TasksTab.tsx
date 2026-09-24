import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Trash2, User, Calendar, CheckCircle2, 
  Circle, Clock, Filter, Edit3, X, Check, AlertTriangle 
} from 'lucide-react';
import { TaskItem, Participant } from '../types';

interface TasksTabProps {
  tasks: TaskItem[];
  onUpdateTasks: (tasks: TaskItem[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
}

const QUICK_DEADLINES = [
  'До заезда на поляну',
  'До 18:00 пятницы',
  'В первый день слёта',
  'Суббота (к конкурсам)',
  'Перед отъездом (уборка)'
];

export default function TasksTab({
  tasks,
  onUpdateTasks,
  participants,
  currentUser,
  isAdmin
}: TasksTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Form states for creating
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(participants[0]?.id || '');
  const [taskDeadline, setTaskDeadline] = useState('До заезда на поляну');
  const [isCreating, setIsCreating] = useState(false);

  // Form states for editing
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // State for safe delete confirmation
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleTask = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const updated = { ...target, isCompleted: !target.isCompleted };
    const updatedTasks = tasks.map(t => t.id === taskId ? updated : t);
    onUpdateTasks(updatedTasks);

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to sync task status with server:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    const id = taskToDelete.id;
    const updatedTasks = tasks.filter(t => t.id !== id);
    onUpdateTasks(updatedTasks);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          onUpdateTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error("Failed to delete task on server:", err);
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsCreating(true);
    const assignee = participants.find(p => p.id === taskAssignee) || participants[0];
    const newTask: TaskItem = {
      id: 'task_' + Date.now(),
      title: taskTitle.trim(),
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      deadline: taskDeadline.trim() || 'До слёта',
      isCompleted: false
    };

    onUpdateTasks([...tasks, newTask]);
    setTaskTitle('');
    setShowAddForm(false);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          onUpdateTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error("Failed to save new task on server:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    setIsSavingEdit(true);
    const assignee = participants.find(p => p.id === editingTask.assigneeId);
    const updated: TaskItem = {
      ...editingTask,
      title: editingTask.title.trim(),
      assigneeName: assignee ? assignee.name : editingTask.assigneeName,
      deadline: editingTask.deadline.trim() || 'До слёта'
    };

    const updatedTasks = tasks.map(t => t.id === updated.id ? updated : t);
    onUpdateTasks(updatedTasks);

    try {
      const res = await fetch(`/api/tasks/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          onUpdateTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error("Failed to update task on server:", err);
    } finally {
      setIsSavingEdit(false);
      setEditingTask(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'completed' ? t.isCompleted :
      !t.isCompleted;
    
    const matchesAssignee = filterAssignee === 'all' || t.assigneeId === filterAssignee;
    return matchesStatus && matchesAssignee;
  });

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.length - completedCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 inline-block shadow">
            📋 Оперативный план подготовки
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
            Задачи слёта
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-950">
            Распределение орг-вопросов, закупки снаряжения, подготовки лагеря и дежурств
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={18} /> Добавить задачу
        </button>
      </div>

      {/* Progress & Stats Bar */}
      <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-amber-950">
          <div className="flex items-center gap-4">
            <span>Всего задач: <b className="text-red-700">{tasks.length}</b></span>
            <span>В процессе: <b className="text-amber-600">{pendingCount}</b></span>
            <span>Выполнено: <b className="text-emerald-600">{completedCount}</b></span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-48">
            <div className="flex-1 bg-amber-100 h-3 rounded-full overflow-hidden border border-amber-300">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-black text-xs text-emerald-700">{progressPercent}%</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-amber-200">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              Все ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-yellow-300 shadow'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              В работе ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-yellow-300 shadow'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              Сделано ({completedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-amber-900 shrink-0">Ответственный:</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-950 outline-none cursor-pointer"
            >
              <option value="all">Все участники</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Task Form Inline */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-yellow-50 border-3 border-red-500 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-amber-300 pb-2">
            <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-2">
              <Plus size={16} /> Новая задача подготовки к слёту
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-amber-800 hover:text-red-600 text-xs font-black cursor-pointer"
            >
              ✕ Закрыть
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
                Суть задачи:
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Например: Закупить 10 пачек сухого спирта и 20 банок тушёнки"
                className="w-full px-3.5 py-2.5 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
                Ответственный негодяй:
              </label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none cursor-pointer"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
              Срок выполнения / Дедлайн:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                placeholder="До 18:00 пятницы, до выезда и т.д."
                className="flex-1 px-3 py-2 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none focus:border-red-500"
              />
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {QUICK_DEADLINES.slice(0, 3).map(qd => (
                  <button
                    key={qd}
                    type="button"
                    onClick={() => setTaskDeadline(qd)}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    {qd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-300 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 rounded-xl text-xs font-black uppercase shadow cursor-pointer transition-colors"
            >
              {isCreating ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center text-amber-800 text-xs font-bold">
            Задач по выбранным критериям не найдено.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`border-2 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                t.isCompleted
                  ? 'bg-emerald-50/50 border-emerald-300/80 opacity-90'
                  : 'bg-white border-amber-300 hover:border-red-400'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleTask(t.id)}
                  className="mt-0.5 sm:mt-0 text-amber-800 hover:scale-110 transition-transform shrink-0 cursor-pointer"
                  title={t.isCompleted ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                >
                  {t.isCompleted ? (
                    <CheckCircle2 size={22} className="text-emerald-600" />
                  ) : (
                    <Circle size={22} className="text-amber-400 hover:text-red-500" />
                  )}
                </button>

                <div className="space-y-0.5">
                  <span className={`text-xs sm:text-sm font-bold block ${
                    t.isCompleted ? 'line-through text-stone-500' : 'text-amber-950'
                  }`}>
                    {t.title}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-800">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock size={12} className="text-amber-600" /> {t.deadline}
                    </span>
                    {t.isCompleted && (
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Выполнено
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                <span className="bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <User size={12} className="text-red-600" />
                  <span>{t.assigneeName}</span>
                </span>

                {/* EDIT TASK BUTTON */}
                <button
                  type="button"
                  onClick={() => setEditingTask({ ...t })}
                  className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                  title="Редактировать задачу"
                >
                  <Edit3 size={16} />
                </button>

                {/* DELETE TASK BUTTON */}
                <button
                  type="button"
                  onClick={() => setTaskToDelete(t)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Удалить задачу"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: EDIT TASK */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border-4 border-amber-400 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-stone-900">Редактирование задачи</h3>
                  <p className="text-xs text-stone-500">Изменение сути, исполнителя или срока</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-900 uppercase mb-1">
                  Суть задачи:
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Опишите суть задачи..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 focus:border-amber-400 rounded-xl text-xs font-bold text-stone-900 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 uppercase mb-1">
                  Ответственный участник:
                </label>
                <select
                  value={editingTask.assigneeId}
                  onChange={(e) => {
                    const sel = participants.find(p => p.id === e.target.value);
                    setEditingTask({
                      ...editingTask,
                      assigneeId: e.target.value,
                      assigneeName: sel ? sel.name : editingTask.assigneeName
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 focus:border-amber-400 rounded-xl text-xs font-bold text-stone-900 outline-none cursor-pointer"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 uppercase mb-1">
                  Срок выполнения (дедлайн):
                </label>
                <input
                  type="text"
                  value={editingTask.deadline}
                  onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                  placeholder="Например: До 18:00 пятницы"
                  className="w-full px-3.5 py-2 bg-stone-50 border-2 border-stone-200 focus:border-amber-400 rounded-xl text-xs font-bold text-stone-900 outline-none"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">Быстрый выбор:</span>
                  {QUICK_DEADLINES.map(qd => (
                    <button
                      key={qd}
                      type="button"
                      onClick={() => setEditingTask({ ...editingTask, deadline: qd })}
                      className="px-2 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      {qd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={editingTask.isCompleted}
                    onChange={(e) => setEditingTask({ ...editingTask, isCompleted: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-stone-900 uppercase">
                    {editingTask.isCompleted ? '✓ Задача выполнена' : 'В процессе выполнения'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black text-xs uppercase rounded-xl shadow cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {isSavingEdit ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE TASK */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-red-500 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-base uppercase text-stone-900">Удалить задачу?</h3>
                <p className="text-xs text-stone-500 font-medium">Это действие нельзя будет отменить</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 font-bold">
              «{taskToDelete.title}»
              <div className="text-[11px] text-stone-600 font-medium pt-1">
                Ответственный: {taskToDelete.assigneeName} • Срок: {taskToDelete.deadline}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
