import React, { useState } from 'react';
import { CheckSquare, Plus, Trash, User, Calendar, CheckCircle2, Circle, Clock, Filter } from 'lucide-react';
import { TaskItem, Participant } from '../types';

interface TasksTabProps {
  tasks: TaskItem[];
  onUpdateTasks: (tasks: TaskItem[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
}

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

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(participants[0]?.id || '');
  const [taskDeadline, setTaskDeadline] = useState('До заезда на поляну');

  const handleToggleTask = (taskId: string) => {
    onUpdateTasks(
      tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)
    );
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Удалить эту задачу?')) {
      onUpdateTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

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
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
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
              className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-950 outline-none"
            >
              <option value="all">Все участники</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Task Form Modal/Inline */}
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
              className="text-amber-800 hover:text-red-600 text-xs font-black"
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
                className="w-full px-3.5 py-2.5 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
                Ответственный негодяй:
              </label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (@{p.nickname})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
                Срок выполнения / Дедлайн:
              </label>
              <input
                type="text"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                placeholder="До 18:00 пятницы, до выезда и т.д."
                className="w-full px-3 py-2 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none"
              />
            </div>
            <div className="flex items-end justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow"
              >
                Создать задачу
              </button>
            </div>
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
                  ? 'bg-amber-50/70 border-emerald-400/60 opacity-80'
                  : 'bg-white border-amber-300 hover:border-red-400'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleTask(t.id)}
                  className="mt-0.5 sm:mt-0 text-amber-800 hover:scale-110 transition-transform shrink-0"
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
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                <span className="bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <User size={12} className="text-red-600" />
                  <span>{t.assigneeName}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить задачу"
                >
                  <Trash size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
