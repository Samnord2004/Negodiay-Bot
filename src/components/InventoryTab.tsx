import React, { useState } from 'react';
import { 
  Package, Plus, Trash2, Search, Filter, AlertTriangle, CheckCircle, 
  Flame, ShieldAlert, Waves, Pencil, Check, X, Lock, Shield, 
  Camera, Image as ImageIcon, Upload, Eye
} from 'lucide-react';
import { InventoryItem, InventoryCondition, Participant } from '../types';
import { compressImage } from '../utils/imageCompressor';

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
  const [addAnchorPos, setAddAnchorPos] = useState<{ top: number; right: number } | null>(null);

  // Strict Permissions: Only Captain (admin) and Keeper (хранитель) can manage inventory
  const isCaptain = isAdmin || 
    currentUser?.role === 'admin' ||
    (currentUser?.nickname || '').toLowerCase().replace(/^@/, '') === 'ковбой' ||
    (currentUser?.nickname || '').toLowerCase().replace(/^@/, '') === 'cowboy' ||
    (currentUser?.email || '').toLowerCase() === 'asamoilov81@gmail.com' ||
    (currentUser?.name || '').toLowerCase().includes('самойлов');

  const isKeeper = currentUser?.role === 'keeper';
  const canManageInventory = isCaptain || isKeeper;

  // Add Form states
  const [itemName, setItemName] = useState('');
  const [itemResponsible, setItemResponsible] = useState(participants[0]?.name || 'Общий лагерь');
  const [itemCondition, setItemCondition] = useState<InventoryCondition>('нормальное');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemImage, setItemImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Edit states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemResponsible, setEditItemResponsible] = useState('');
  const [editItemCondition, setEditItemCondition] = useState<InventoryCondition>('нормальное');
  const [editItemQuantity, setEditItemQuantity] = useState(1);
  const [editItemImage, setEditItemImage] = useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // Fullscreen Photo Lightbox
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);

  // Start editing item
  const handleStartEdit = (item: InventoryItem) => {
    if (!canManageInventory) return;
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemResponsible(item.responsibleName || 'Общий лагерь');
    setEditItemCondition(item.condition);
    setEditItemQuantity(item.quantity || 1);
    setEditItemImage(item.imageUrl || '');
  };

  // Save edited item
  const handleSaveEdit = async (id: string) => {
    if (!canManageInventory || !editItemName.trim()) return;

    const updated = inventoryItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: editItemName.trim(),
          responsibleName: editItemResponsible.trim() || 'Общий лагерь',
          condition: editItemCondition,
          quantity: Number(editItemQuantity) || 1,
          imageUrl: editItemImage.trim() || undefined
        };
      }
      return item;
    });

    onUpdateInventory(updated);
    setEditingItemId(null);
    setEditItemImage('');

    try {
      await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editItemName.trim(),
          responsibleName: editItemResponsible.trim() || 'Общий лагерь',
          condition: editItemCondition,
          quantity: Number(editItemQuantity) || 1,
          imageUrl: editItemImage.trim() || undefined
        })
      });
    } catch (err) {
      console.error('Failed to sync inventory update:', err);
    }
  };

  // Quick direct photo attach to an existing card
  const handleQuickAttachPhoto = async (itemId: string, file: File) => {
    if (!canManageInventory) return;
    try {
      setUploadingCardId(itemId);
      const compressed = await compressImage(file, 1024, 0.85);
      const updated = inventoryItems.map(item =>
        item.id === itemId ? { ...item, imageUrl: compressed } : item
      );
      onUpdateInventory(updated);
      await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: compressed })
      });
    } catch (err) {
      console.error('Failed to attach photo:', err);
    } finally {
      setUploadingCardId(null);
    }
  };

  // Quick photo removal from a card
  const handleRemovePhoto = async (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManageInventory) return;
    if (!confirm('Удалить фото этого снаряжения?')) return;

    const updated = inventoryItems.map(item =>
      item.id === itemId ? { ...item, imageUrl: undefined } : item
    );
    onUpdateInventory(updated);

    try {
      await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null })
      });
    } catch (err) {
      console.error('Failed to remove photo:', err);
    }
  };

  // Update item condition directly
  const handleStatusChange = async (id: string, newCondition: InventoryCondition) => {
    if (!canManageInventory) return;

    const updated = inventoryItems.map(item => 
      item.id === id ? { ...item, condition: newCondition } : item
    );
    onUpdateInventory(updated);

    try {
      await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: newCondition })
      });
    } catch (err) {
      console.error('Failed to sync condition change:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    if (!canManageInventory) return;
    if (!confirm('Удалить эту позицию инвентаря?')) return;
    
    const filtered = inventoryItems.filter(item => item.id !== id);
    onUpdateInventory(filtered);

    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to sync inventory deletion:', err);
    }
  };

  // Add Item
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInventory || !itemName.trim()) return;

    const newItem: InventoryItem = {
      id: 'inv_' + Date.now(),
      name: itemName.trim(),
      responsibleName: itemResponsible.trim() || 'Общий лагерь',
      condition: itemCondition,
      quantity: Number(itemQuantity) || 1,
      imageUrl: itemImage.trim() || undefined
    };

    onUpdateInventory([...inventoryItems, newItem]);
    setItemName('');
    setItemQuantity(1);
    setItemImage('');
    setShowAddForm(false);

    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } catch (err) {
      console.error('Failed to sync new inventory item:', err);
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesCondition = filterCondition === 'all' || item.condition === filterCondition;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.responsibleName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCondition && matchesSearch;
  });

  const readyCount = inventoryItems.filter(i => i.condition === 'нормальное').length;
  const lostCount = inventoryItems.filter(i => i.condition !== 'нормальное').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 inline-block shadow">
              ⛺ Снаряжение и лагерный шмот
            </span>
            {canManageInventory ? (
              <span className="bg-emerald-600 text-white font-black text-[11px] uppercase px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Shield size={13} /> Управление: {isCaptain ? 'Капитан' : 'Хранитель'}
              </span>
            ) : (
              <span className="bg-stone-800 text-yellow-300 font-black text-[11px] uppercase px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Lock size={12} /> Режим ознакомления
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
            Инвентарь команды
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-950">
            Учёт шатров, казанов, топоров, генераторов и легендарных потерь после бурных ночей
          </p>
        </div>

        {/* Action Button / Permission Notice */}
        {canManageInventory ? (
          <button
            type="button"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAddAnchorPos({
                top: rect.bottom + 8,
                right: Math.max(12, window.innerWidth - rect.right)
              });
              setShowAddForm(!showAddForm);
            }}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={18} /> Добавить инвентарь
          </button>
        ) : (
          <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm shrink-0">
            <Lock size={16} className="text-red-600 shrink-0" />
            <div>
              <div className="font-black uppercase text-[11px] text-red-700">Только для ознакомления</div>
              <div className="text-[10px] text-stone-700 font-medium">Управлять инвентарём могут только <b>Капитан</b> и <b>Хранитель</b></div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and stats */}
      <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterCondition('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all shrink-0 ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all shrink-0 ${
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

          <div className="w-full sm:w-64 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по инвентарю и хранителю..."
              className="w-full px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-black text-amber-950 pt-2 border-t border-amber-200">
          <div className="flex items-center gap-4">
            <span>В строю: <b className="text-emerald-700">{readyCount}</b></span>
            <span>Потери / Ремонт: <b className="text-red-700">{lostCount}</b></span>
          </div>
        </div>
      </div>

      {/* ADD FORM: Anchored to "Добавить инвентарь" button */}
      {showAddForm && canManageInventory && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-stone-950/20 backdrop-blur-2xs" 
            onClick={() => setShowAddForm(false)} 
          />
          <form
            onSubmit={handleAddItemSubmit}
            style={{
              top: Math.min(window.innerHeight - 560, Math.max(12, addAnchorPos?.top || 120)),
              right: Math.max(12, addAnchorPos?.right || 16),
              maxHeight: 'calc(100vh - 40px)'
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-yellow-50 border-4 border-red-500 rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150 w-[92vw] max-w-lg overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-2">
              <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-1.5">
                <Package size={16} /> Новая позиция снаряжения
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-black text-amber-900 hover:text-red-600 p-1 cursor-pointer"
              >
                ✕ Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold text-amber-950">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-black mb-1">Название снаряжения *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Например: Казан чугунный 50 л, бензогенератор"
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Ответственный хранитель:</label>
                <input
                  type="text"
                  value={itemResponsible}
                  onChange={(e) => setItemResponsible(e.target.value)}
                  list="new-item-participants-list"
                  placeholder="Андрей, Саня, Общий лагерь"
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 outline-none focus:border-red-500"
                />
                <datalist id="new-item-participants-list">
                  <option value="Общий лагерь" />
                  {participants.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Количество (шт):</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 text-center outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Photo Section in Add Form */}
            <div className="border-2 border-dashed border-amber-300 rounded-2xl p-3 bg-amber-50/70 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-black text-amber-950">
                <span className="flex items-center gap-1.5">
                  <Camera size={14} className="text-red-600" />
                  Фото инвентаря (снаряжения):
                </span>
                {itemImage && (
                  <button
                    type="button"
                    onClick={() => setItemImage('')}
                    className="text-red-600 hover:text-red-800 text-[10px] lowercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} /> удалить фото
                  </button>
                )}
              </div>

              {itemImage ? (
                <div className="relative group rounded-xl overflow-hidden border-2 border-amber-300 bg-stone-900 max-h-48 flex items-center justify-center">
                  <img
                    src={itemImage}
                    alt="Предпросмотр инвентаря"
                    className="w-full max-h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="bg-white/90 hover:bg-white text-stone-900 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer shadow flex items-center gap-1.5 transition-colors">
                      <Camera size={14} /> Заменить фото
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingImage(true);
                            try {
                              const compressed = await compressImage(file, 1024, 0.85);
                              setItemImage(compressed);
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="w-full sm:w-auto flex-1 bg-white hover:bg-amber-100 border-2 border-amber-400 hover:border-red-500 rounded-xl px-3 py-2 text-center text-xs font-bold text-amber-950 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs">
                    <Upload size={14} className="text-red-600" />
                    <span>{isUploadingImage ? 'Сжатие фото...' : 'Выбрать фото с устройства'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploadingImage(true);
                          try {
                            const compressed = await compressImage(file, 1024, 0.85);
                            setItemImage(compressed);
                          } finally {
                            setIsUploadingImage(false);
                          }
                        }
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-stone-400 font-bold">или URL:</span>
                  <input
                    type="url"
                    value={itemImage}
                    onChange={(e) => setItemImage(e.target.value)}
                    placeholder="https://... ссылка на фото"
                    className="w-full sm:w-1/2 bg-white border border-amber-400 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-amber-950">
              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Текущее состояние:</label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value as InventoryCondition)}
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 font-bold outline-none focus:border-red-500"
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
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  Записать в инвентарь
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isEditing = editingItemId === item.id;
          const condStyle = CONDITION_COLORS[item.condition] || CONDITION_COLORS['нормальное'];

          if (isEditing && canManageInventory) {
            return (
              <div
                key={item.id}
                className="bg-amber-50 border-3 border-red-500 rounded-2xl p-4 shadow-lg space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <span className="text-xs font-black uppercase text-red-700 flex items-center gap-1.5">
                    <Pencil size={14} /> Редактирование вещи
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingItemId(null)}
                    className="p-1 text-stone-500 hover:text-red-700 rounded-lg cursor-pointer"
                    title="Отмена"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-bold text-amber-950">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-amber-900 mb-0.5">
                      Название снаряжения:
                    </label>
                    <input
                      type="text"
                      required
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      className="w-full bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl px-3 py-1.5 font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-amber-900 mb-0.5">
                        Хранитель:
                      </label>
                      <input
                        type="text"
                        value={editItemResponsible}
                        onChange={(e) => setEditItemResponsible(e.target.value)}
                        list={`edit-participants-list-${item.id}`}
                        className="w-full bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl px-2.5 py-1.5 font-bold outline-none"
                      />
                      <datalist id={`edit-participants-list-${item.id}`}>
                        <option value="Общий лагерь" />
                        {participants.map(p => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-amber-900 mb-0.5">
                        Количество:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editItemQuantity}
                        onChange={(e) => setEditItemQuantity(Number(e.target.value))}
                        className="w-full bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl px-2 py-1.5 font-bold outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Photo Edit in Card */}
                  <div className="border border-dashed border-amber-400 rounded-xl p-2.5 bg-amber-100/50 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black text-amber-900">
                      <span className="flex items-center gap-1">
                        <Camera size={13} className="text-red-600" /> Фото снаряжения:
                      </span>
                      {editItemImage && (
                        <button
                          type="button"
                          onClick={() => setEditItemImage('')}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Удалить фото
                        </button>
                      )}
                    </div>
                    {editItemImage ? (
                      <div className="relative h-28 rounded-lg overflow-hidden border border-amber-300 bg-stone-900">
                        <img src={editItemImage} alt="Снаряжение" className="w-full h-full object-cover" />
                        <label className="absolute bottom-1 right-1 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer flex items-center gap-1">
                          <Camera size={11} /> Заменить
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploadingEditImage(true);
                                try {
                                  const comp = await compressImage(file, 1024, 0.85);
                                  setEditItemImage(comp);
                                } finally {
                                  setIsUploadingEditImage(false);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="block w-full bg-white hover:bg-amber-50 border border-amber-300 rounded-lg p-2 text-center text-xs font-bold text-amber-900 cursor-pointer transition-colors">
                        <Upload size={13} className="inline mr-1 text-red-600" />
                        {isUploadingEditImage ? 'Загрузка...' : 'Добавить фото к вещи'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingEditImage(true);
                              try {
                                const comp = await compressImage(file, 1024, 0.85);
                                setEditItemImage(comp);
                              } finally {
                                setIsUploadingEditImage(false);
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-amber-900 mb-0.5">
                      Состояние:
                    </label>
                    <select
                      value={editItemCondition}
                      onChange={(e) => setEditItemCondition(e.target.value as InventoryCondition)}
                      className="w-full bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl px-2.5 py-1.5 font-bold outline-none"
                    >
                      {Object.keys(CONDITION_COLORS).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-300">
                  <button
                    type="button"
                    onClick={() => setEditingItemId(null)}
                    className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(item.id)}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase shadow transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={14} /> Сохранить
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="bg-white border-2 border-amber-300 hover:border-red-500 rounded-2xl p-4 shadow-sm space-y-3 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-2.5">
                {/* Photo Display if Present */}
                {item.imageUrl ? (
                  <div 
                    onClick={() => setPreviewItem(item)}
                    className="relative h-44 -mx-4 -mt-4 mb-2 bg-stone-900 overflow-hidden cursor-pointer group"
                    title="Нажмите для просмотра фото в полном размере"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                      <span className="text-white text-[11px] font-black flex items-center gap-1 drop-shadow">
                        <Eye size={14} /> Открыть фото
                      </span>
                      {canManageInventory && (
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(item.id, e)}
                          className="p-1 rounded-md bg-red-600 hover:bg-red-700 text-white shadow transition-colors cursor-pointer"
                          title="Удалить фото"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : canManageInventory ? (
                  /* Quick photo upload button if item has no photo yet */
                  <label className="flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-amber-300 hover:border-red-500 bg-amber-50/60 hover:bg-amber-100/70 rounded-xl text-[11px] font-bold text-amber-900 cursor-pointer transition-colors -mt-1 shadow-2xs">
                    <Camera size={13} className="text-red-600" />
                    <span>{uploadingCardId === item.id ? 'Загрузка...' : '+ Добавить фото инвентаря'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQuickAttachPhoto(item.id, file);
                      }}
                    />
                  </label>
                ) : null}

                <div className="flex items-start justify-between gap-2 border-b border-amber-100 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-stone-500 block">
                      Хранитель: <b className="text-amber-950">{item.responsibleName}</b>
                    </span>
                    <h3 className="font-black text-sm text-stone-900 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <span className="bg-amber-100 text-stone-900 font-black text-xs px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                    {item.quantity || 1} шт.
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                {/* Condition: Selector if Manager, Read-only badge if Member */}
                {canManageInventory ? (
                  <select
                    value={item.condition}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as InventoryCondition)}
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${condStyle.bg} ${condStyle.text} ${condStyle.border} outline-none cursor-pointer`}
                  >
                    {Object.keys(CONDITION_COLORS).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-xl border ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}>
                    {condStyle.label}
                  </span>
                )}

                {/* Manager Controls: Edit & Delete */}
                {canManageInventory && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="text-amber-700 hover:text-red-700 hover:bg-amber-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Редактировать снаряжение"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {previewItem && previewItem.imageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-stone-950 border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl cursor-default"
          >
            {/* Header */}
            <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-base font-black text-amber-400 uppercase tracking-tight">
                  {previewItem.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                  <span>Хранитель: <b className="text-stone-200">{previewItem.responsibleName}</b></span>
                  <span>•</span>
                  <span>Количество: <b className="text-stone-200">{previewItem.quantity || 1} шт.</b></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${
                  (CONDITION_COLORS[previewItem.condition] || CONDITION_COLORS['нормальное']).bg
                } ${
                  (CONDITION_COLORS[previewItem.condition] || CONDITION_COLORS['нормальное']).text
                } ${
                  (CONDITION_COLORS[previewItem.condition] || CONDITION_COLORS['нормальное']).border
                }`}>
                  {(CONDITION_COLORS[previewItem.condition] || CONDITION_COLORS['нормальное']).label}
                </span>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                  title="Закрыть"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Full Image */}
            <div className="p-3 flex-1 flex items-center justify-center overflow-auto bg-black">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.name}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
