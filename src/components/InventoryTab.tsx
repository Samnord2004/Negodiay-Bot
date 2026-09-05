import React, { useState } from 'react';
import { Package, Plus, Trash, Search, Filter, AlertTriangle, CheckCircle, Flame, ShieldAlert, Waves } from 'lucide-react';
import { InventoryItem, InventoryCondition, Participant } from '../types';

interface InventoryTabProps {
  inventoryItems: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
}

const CONDITION_COLORS: Record<InventoryCondition, { bg: string; text: string; border: string; label: string }> = {
  'нормальное': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'В строю (Нормальное)' },
  'пришло в негодность': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Пришло в негодность' },
  'пробухали нахер всё': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Пробухали нахер всё' },
  'проёбано на слёте': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: 'Проёбано на слёте' },
  'утонало к херам': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Утонало к херам' }
};

export default function InventoryTab({
  inventoryItems,
  onUpdateInventory,
  participants,
  currentUser,
  isAdmin
}: InventoryTabProps) {
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemResponsible, setItemResponsible] = useState(participants[0]?.name || 'Общий лагерь');
  const [itemCondition, setItemCondition] = useState<InventoryCondition>('нормальное');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Update item condition directly
  const handleStatusChange = (id: string, newCondition: InventoryCondition) => {
    onUpdateInventory(
      inventoryItems.map(item => item.id === id ? { ...item, condition: newCondition } : item)
    );
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (confirm('Удалить эту позицию инвентаря?')) {
      onUpdateInventory(inventoryItems.filter(item => item.id !== id));
    }
  };

  // Add Item
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const newItem: InventoryItem = {
      id: 'inv_' + Date.now(),
      name: itemName.trim(),
      responsibleName: itemResponsible,
      condition: itemCondition,
      quantity: Number(itemQuantity) || 1
    };

    onUpdateInventory([...inventoryItems, newItem]);
    setItemName('');
    setItemQuantity(1);
    setShowAddForm(false);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesCondition = filterCondition === 'all' || item.condition === filterCondition;
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.responsibleName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCondition && matchesSearch;
  });

  const readyCount = inventoryItems.filter(i => i.condition === 'нормальное').length;
  const lostCount = inventoryItems.filter(i => i.condition !== 'нормальное').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 inline-block shadow">
            ⛺ Снаряжение и лагерный шмот
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
            Инвентарь команды
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-950">
            Учёт шатров, казанов, топоров, генераторов и легендарных потерь после бурных ночей
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0"
        >
          <Plus size={18} /> Добавить инвентарь
        </button>
      </div>

      {/* Filter and stats */}
      <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterCondition('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                filterCondition === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              Все ({inventoryItems.length})
            </button>
            {Object.keys(CONDITION_COLORS).map((cond) => {
              const count = inventoryItems.filter(i => i.condition === cond).length;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setFilterCondition(cond)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                    filterCondition === cond
                      ? 'bg-red-600 text-yellow-300 shadow'
                      : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  {cond} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по инвентарю..."
              className="w-full px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-black text-amber-950 pt-2 border-t border-amber-200">
          <div className="flex items-center gap-3">
            <span>В боевой готовности: <b className="text-emerald-600">{readyCount}</b></span>
            <span>Потери / Ремонт: <b className="text-red-700">{lostCount}</b></span>
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <form
          onSubmit={handleAddItemSubmit}
          className="bg-yellow-50 border-3 border-red-500 rounded-3xl p-5 shadow-xl space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-amber-300 pb-2">
            <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-1.5">
              <Package size={16} /> Новая позиция снаряжения
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-black text-amber-900 hover:text-red-600"
            >
              ✕ Закрыть
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold text-amber-950">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-black mb-1">Название снаряжения:</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Например: Казан чугунный 50 л, бензогенератор 3 кВт"
                className="w-full bg-white border border-amber-400 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black mb-1">Ответственный хранитель:</label>
              <input
                type="text"
                value={itemResponsible}
                onChange={(e) => setItemResponsible(e.target.value)}
                placeholder="Лёха, Саня, База"
                className="w-full bg-white border border-amber-400 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black mb-1">Количество (шт):</label>
              <input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                className="w-full bg-white border border-amber-400 rounded-xl p-2 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-amber-950">
            <div>
              <label className="block text-[10px] uppercase font-black mb-1">Текущее состояние:</label>
              <select
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value as InventoryCondition)}
                className="w-full bg-white border border-amber-400 rounded-xl p-2 font-bold"
              >
                {Object.keys(CONDITION_COLORS).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-red-600 text-yellow-300 rounded-xl text-xs font-black uppercase shadow"
              >
                Записать в инвентарь
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const condStyle = CONDITION_COLORS[item.condition] || CONDITION_COLORS['нормальное'];

          return (
            <div
              key={item.id}
              className="bg-white border-2 border-amber-300 hover:border-red-500 rounded-2xl p-4 shadow-sm space-y-3 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-amber-100 pb-2 mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-stone-500 block">
                      Хранитель: <b className="text-amber-950">{item.responsibleName}</b>
                    </span>
                    <h3 className="font-black text-sm text-stone-900 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <span className="bg-amber-100 text-stone-900 font-black text-xs px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                    {item.quantity || 1} шт.
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                {/* Condition Selector */}
                <select
                  value={item.condition}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as InventoryCondition)}
                  className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${condStyle.bg} ${condStyle.text} ${condStyle.border} outline-none cursor-pointer`}
                >
                  {Object.keys(CONDITION_COLORS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-stone-400 hover:text-red-600 p-1"
                  title="Удалить"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
