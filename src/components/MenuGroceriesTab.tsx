import React, { useState } from 'react';
import { 
  Coffee, ShoppingCart, Plus, Trash, Check, CheckCircle2, 
  Circle, Flame, DollarSign, Calendar, User, Lock, ChefHat, AlertCircle
} from 'lucide-react';
import { MenuItem, GroceryItem, Participant } from '../types';

interface MenuGroceriesTabProps {
  menuItems: MenuItem[];
  groceryItems: GroceryItem[];
  onUpdateMenu: (items: MenuItem[]) => void;
  onUpdateGroceries: (items: GroceryItem[]) => void;
  participants: Participant[];
  currentUser: Participant | null;
  isAdmin: boolean;
}

export default function MenuGroceriesTab({
  menuItems,
  groceryItems,
  onUpdateMenu,
  onUpdateGroceries,
  participants,
  currentUser,
  isAdmin
}: MenuGroceriesTabProps) {
  const [subTab, setSubTab] = useState<'menu' | 'groceries'>('menu');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [groceryCategory, setGroceryCategory] = useState<string>('all');

  // Check Chef RBAC permissions
  // Requirement: "Редактировать меню и список продуктов имеет право только шеф-повар"
  const isChef = currentUser?.role === 'chef' || 
                 currentUser?.roleTitle?.toLowerCase().includes('повар') ||
                 currentUser?.roleTitle?.toLowerCase().includes('шеф');

  // Captain (admin) retains override access to manage the squad if chef isn't available
  const canManageMenu = isChef || isAdmin;

  // Find assigned team chef
  const teamChef = participants.find(p => p.role === 'chef' || p.roleTitle?.toLowerCase().includes('повар')) || null;

  // New Dish Modal
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishDay, setDishDay] = useState(1);
  const [dishMeal, setDishMeal] = useState<'Завтрак' | 'Обед' | 'Ужин' | 'Перекус'>('Обед');
  const [dishName, setDishName] = useState('');
  const [dishChef, setDishChef] = useState(teamChef?.name || currentUser?.name || 'Шеф-повар');
  const [dishIngredients, setDishIngredients] = useState('');

  // New Grocery Modal
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [gName, setGName] = useState('');
  const [gQty, setGQty] = useState('');
  const [gCategory, setGCategory] = useState<'Еда' | 'Расходники' | 'Жидкая валюта'>('Еда');
  const [gResponsible, setGResponsible] = useState(teamChef?.name || 'Шеф-повар');
  const [gCost, setGCost] = useState<number>(0);

  // Toggle Grocery Bought Status
  const handleToggleGrocery = (id: string) => {
    if (!canManageMenu) return;
    onUpdateGroceries(
      groceryItems.map(g => g.id === id ? { ...g, isBought: !g.isBought } : g)
    );
  };

  // Add Dish
  const handleAddDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMenu) return;
    if (!dishName.trim()) return;

    const newDish: MenuItem = {
      id: 'dish_' + Date.now(),
      day: `День ${dishDay}. ${dishMeal}`,
      dishName: dishName.trim(),
      description: dishIngredients ? `Ингредиенты: ${dishIngredients}` : 'Походное горячее блюдо',
      chef: dishChef,
      ingredients: dishIngredients ? dishIngredients.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    onUpdateMenu([...menuItems, newDish]);
    setDishName('');
    setDishIngredients('');
    setShowAddDish(false);
  };

  // Add Grocery
  const handleAddGrocerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMenu) return;
    if (!gName.trim() || !gQty.trim()) return;

    const newG: GroceryItem = {
      id: 'g_' + Date.now(),
      name: gName.trim(),
      quantity: gQty.trim(),
      category: gCategory,
      isBought: false,
      responsibleName: gResponsible,
      estimatedCost: gCost ? Number(gCost) : undefined
    };

    onUpdateGroceries([...groceryItems, newG]);
    setGName('');
    setGQty('');
    setGCost(0);
    setShowAddGrocery(false);
  };

  const filteredDishes = menuItems.filter(d => selectedDay === 'all' || d.day.includes(`День ${selectedDay}`));
  const filteredGroceries = groceryItems.filter(g => groceryCategory === 'all' || g.category === groceryCategory);

  const boughtGroceriesCount = groceryItems.filter(g => g.isBought).length;
  const totalGroceryCost = groceryItems.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  return (
    <div className="space-y-5">
      
      {/* Light & Airy Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1.5">
              👨‍🍳 Полевая кухня Негодяев
            </span>
            {isChef && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
                Доступ Шеф-повара активен
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight">
            Меню и продукты
          </h2>
          <p className="text-xs sm:text-sm font-medium text-stone-500">
            Раскладка по дням слёта, график шеф-поваров и централизованный список провизии
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="bg-stone-100 p-1 rounded-2xl flex gap-1 border border-stone-200 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('menu')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              subTab === 'menu'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coffee size={14} className={subTab === 'menu' ? 'text-red-600' : 'text-stone-400'} />
            Лагерное меню
          </button>
          <button
            type="button"
            onClick={() => setSubTab('groceries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              subTab === 'groceries'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingCart size={14} className={subTab === 'groceries' ? 'text-red-600' : 'text-stone-400'} />
            Закупка продуктов
          </button>
        </div>
      </div>

      {/* RBAC Notice Banner */}
      {!canManageMenu ? (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-amber-700 shrink-0" />
            <span>
              Редактировать меню и список продуктов имеет право только <b>Шеф-повар команды</b>.
              {teamChef ? (
                <> Назначенный шеф: <b>{teamChef.name}</b> (@{teamChef.nickname})</>
              ) : (
                ' (Шеф-повар ещё не назначен капитаном)'
              )}
            </span>
          </div>
          {teamChef && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-amber-300 shrink-0">
              <ChefHat size={12} /> {teamChef.name}
            </span>
          )}
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-emerald-600 shrink-0" />
            <span>
              <b>Права шеф-повара подтверждены:</b> Вам доступно добавление, удаление блюд и управление закупками.
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
            {currentUser?.role === 'chef' ? 'Шеф-повар' : 'Капитан команды'}
          </span>
        </div>
      )}

      {/* SUBTAB 1: MENU ITEMS */}
      {subTab === 'menu' && (
        <div className="space-y-4">
          
          {/* Controls & Days bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-bold uppercase text-stone-500 pr-1">День:</span>
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  selectedDay === 'all'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Все дни ({menuItems.length})
              </button>
              {[1, 2, 3, 4].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    selectedDay === d
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  День {d}
                </button>
              ))}
            </div>

            {canManageMenu ? (
              <button
                type="button"
                onClick={() => setShowAddDish(!showAddDish)}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={15} /> Добавить блюдо
              </button>
            ) : (
              <div className="text-stone-400 flex items-center justify-center sm:justify-end gap-1.5 text-xs font-semibold px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl">
                <Lock size={13} /> Только шеф-повар
              </div>
            )}
          </div>

          {/* Add Dish Form */}
          {showAddDish && canManageMenu && (
            <form
              onSubmit={handleAddDishSubmit}
              className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h3 className="font-bold text-sm uppercase text-stone-900 flex items-center gap-2">
                  <Coffee size={16} className="text-red-600" /> Новое блюдо в раскладку
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold text-stone-800">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">День слёта:</label>
                  <select
                    value={dishDay}
                    onChange={(e) => setDishDay(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  >
                    <option value={1}>День 1 (Заезд)</option>
                    <option value={2}>День 2 (Главный)</option>
                    <option value={3}>День 3 (Финал)</option>
                    <option value={4}>День 4 (Отъезд)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Приём пищи:</label>
                  <select
                    value={dishMeal}
                    onChange={(e) => setDishMeal(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  >
                    <option value="Завтрак">Завтрак</option>
                    <option value="Обед">Обед</option>
                    <option value="Ужин">Ужин</option>
                    <option value="Перекус">Перекус / Ночной дожор</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Название блюда:</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Например: Плов с бараниной в 50л казане"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-stone-800">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Шеф-повар / Ответственный:</label>
                  <input
                    type="text"
                    value={dishChef}
                    onChange={(e) => setDishChef(e.target.value)}
                    placeholder="Шеф-повар, Дежурная двойка"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Основные ингредиенты (через запятую):</label>
                  <input
                    type="text"
                    value={dishIngredients}
                    onChange={(e) => setDishIngredients(e.target.value)}
                    placeholder="Рис, морковь, мясо, лук, зира"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase shadow-xs transition-colors"
                >
                  Сохранить блюдо
                </button>
              </div>
            </form>
          )}

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white border border-stone-200 hover:border-amber-400/80 rounded-2xl p-4 shadow-xs space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-100 border border-stone-200 text-stone-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      {dish.day}
                    </span>
                  </div>
                  {canManageMenu && (
                    <button
                      type="button"
                      onClick={() => onUpdateMenu(menuItems.filter(m => m.id !== dish.id))}
                      className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                      title="Удалить блюдо (Шеф-повар)"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-base text-stone-900 leading-snug">
                  {dish.dishName}
                </h3>
                {dish.description && (
                  <p className="text-xs text-stone-600 font-normal leading-relaxed">
                    {dish.description}
                  </p>
                )}

                {dish.chef && (
                  <div className="flex items-center justify-between text-xs font-medium text-stone-600 pt-1">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-red-600" /> Шеф: <b className="text-stone-900">{dish.chef}</b>
                    </span>
                  </div>
                )}

                {dish.ingredients && dish.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dish.ingredients.map((ing, iIdx) => (
                      <span key={iIdx} className="bg-stone-50 border border-stone-200 text-stone-700 text-[10px] font-medium px-2 py-0.5 rounded-md">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUBTAB 2: GROCERIES */}
      {subTab === 'groceries' && (
        <div className="space-y-4">
          
          {/* Filter & Totals */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setGroceryCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    groceryCategory === 'all'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  Все ({groceryItems.length})
                </button>
                {(['Еда', 'Расходники', 'Жидкая валюта'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGroceryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      groceryCategory === cat
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {canManageMenu ? (
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(!showAddGrocery)}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={15} /> Добавить позицию
                </button>
              ) : (
                <div className="text-stone-400 flex items-center justify-center sm:justify-end gap-1.5 text-xs font-semibold px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl">
                  <Lock size={13} /> Только шеф-повар
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-stone-700 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <span>Куплено: <b className="text-emerald-600">{boughtGroceriesCount} / {groceryItems.length}</b></span>
              </div>
              {totalGroceryCost > 0 && (
                <span>Ориентировочный бюджет: <b className="text-red-700">{totalGroceryCost.toLocaleString()} ₽</b></span>
              )}
            </div>
          </div>

          {/* Add Grocery Form */}
          {showAddGrocery && canManageMenu && (
            <form
              onSubmit={handleAddGrocerySubmit}
              className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h3 className="font-bold text-sm uppercase text-stone-900 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-red-600" /> Добавить позицию в список закупки
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-stone-800">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Наименование товара:</label>
                  <input
                    type="text"
                    required
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    placeholder="Например: Тушёнка ГОСТ высший сорт (Говядина)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Количество:</label>
                  <input
                    type="text"
                    required
                    value={gQty}
                    onChange={(e) => setGQty(e.target.value)}
                    placeholder="25 банок / 10 кг / 5 упак"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-stone-800">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Категория:</label>
                  <select
                    value={gCategory}
                    onChange={(e) => setGCategory(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  >
                    <option value="Еда">Еда (Провизия)</option>
                    <option value="Расходники">Расходники (Угли, салфетки, мешки)</option>
                    <option value="Жидкая валюта">Жидкая валюта (Напитки, чай, кофе)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Ответственный за покупку:</label>
                  <input
                    type="text"
                    value={gResponsible}
                    onChange={(e) => setGResponsible(e.target.value)}
                    placeholder="Шеф-повар, Казначей, Дежурные"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Примерная стоимость (₽):</label>
                  <input
                    type="number"
                    value={gCost || ''}
                    onChange={(e) => setGCost(Number(e.target.value))}
                    placeholder="3500"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase shadow-xs transition-colors"
                >
                  Добавить в список
                </button>
              </div>
            </form>
          )}

          {/* Grocery items list */}
          <div className="space-y-2">
            {filteredGroceries.map((item) => (
              <div
                key={item.id}
                className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  item.isBought
                    ? 'bg-stone-50 border-stone-200 opacity-75'
                    : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!canManageMenu}
                    onClick={() => handleToggleGrocery(item.id)}
                    className={`transition-transform shrink-0 ${
                      canManageMenu ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                    }`}
                    title={canManageMenu ? (item.isBought ? 'Отметить как не куплено' : 'Отметить купленным') : 'Изменять статус может только шеф-повар'}
                  >
                    {item.isBought ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <Circle size={20} className={canManageMenu ? "text-stone-300 hover:text-red-500" : "text-stone-300"} />
                    )}
                  </button>

                  <div className="space-y-0.5">
                    <span className={`text-xs sm:text-sm font-bold block ${item.isBought ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        {item.quantity}
                      </span>
                      <span>
                        Категория: <b className="text-stone-700">{item.category}</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  {item.responsibleName && (
                    <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                      👤 {item.responsibleName}
                    </span>
                  )}

                  {item.estimatedCost ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {item.estimatedCost.toLocaleString()} ₽
                    </span>
                  ) : null}

                  {canManageMenu && (
                    <button
                      type="button"
                      onClick={() => onUpdateGroceries(groceryItems.filter(g => g.id !== item.id))}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Удалить позицию (Шеф-повар)"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
