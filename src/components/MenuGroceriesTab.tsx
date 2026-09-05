import React, { useState } from 'react';
import { Coffee, ShoppingCart, Plus, Trash, Check, CheckCircle2, Circle, Flame, DollarSign, Calendar, User } from 'lucide-react';
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

  // New Dish Modal
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishDay, setDishDay] = useState(1);
  const [dishMeal, setDishMeal] = useState<'Завтрак' | 'Обед' | 'Ужин' | 'Перекус'>('Обед');
  const [dishName, setDishName] = useState('');
  const [dishChef, setDishChef] = useState(participants[0]?.name || 'Дежурные');
  const [dishIngredients, setDishIngredients] = useState('');

  // New Grocery Modal
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [gName, setGName] = useState('');
  const [gQty, setGQty] = useState('');
  const [gCategory, setGCategory] = useState<'Еда' | 'Расходники' | 'Жидкая валюта'>('Еда');
  const [gResponsible, setGResponsible] = useState(participants[0]?.name || 'Команда');
  const [gCost, setGCost] = useState<number>(0);

  // Toggle Grocery Bought Status
  const handleToggleGrocery = (id: string) => {
    onUpdateGroceries(
      groceryItems.map(g => g.id === id ? { ...g, isBought: !g.isBought } : g)
    );
  };

  // Add Dish
  const handleAddDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 inline-block shadow">
            🍖 Полевая кухня Негодяев
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
            Меню и продукты
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-950">
            Раскладка по дням слёта, график шеф-поваров и централизованный список провизии
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="bg-stone-900 p-1 rounded-2xl flex gap-1 shadow-inner border border-amber-500/50">
          <button
            type="button"
            onClick={() => setSubTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              subTab === 'menu'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Coffee size={15} /> Лагерное меню
          </button>
          <button
            type="button"
            onClick={() => setSubTab('groceries')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              subTab === 'groceries'
                ? 'bg-red-600 text-yellow-300 shadow'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <ShoppingCart size={15} /> Закупка продуктов
          </button>
        </div>
      </div>

      {/* SUBTAB 1: MENU ITEMS */}
      {subTab === 'menu' && (
        <div className="space-y-4">
          
          {/* Controls & Days bar */}
          <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-black uppercase text-amber-950 pr-1">День:</span>
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  selectedDay === 'all'
                    ? 'bg-red-600 text-yellow-300 shadow'
                    : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                Все дни
              </button>
              {[1, 2, 3, 4].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                    selectedDay === d
                      ? 'bg-red-600 text-yellow-300 shadow'
                      : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  День {d}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddDish(!showAddDish)}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs px-4 py-2 rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Plus size={15} /> Добавить блюдо
            </button>
          </div>

          {/* Add Dish Form */}
          {showAddDish && (
            <form
              onSubmit={handleAddDishSubmit}
              className="bg-yellow-50 border-3 border-red-500 rounded-3xl p-5 shadow-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-1.5">
                  <Coffee size={16} /> Новое блюдо в раскладку
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="text-xs font-black text-amber-900 hover:text-red-600"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold text-amber-950">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">День слёта:</label>
                  <select
                    value={dishDay}
                    onChange={(e) => setDishDay(Number(e.target.value))}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  >
                    <option value={1}>День 1 (Заезд)</option>
                    <option value={2}>День 2 (Главный)</option>
                    <option value={3}>День 3 (Финал)</option>
                    <option value={4}>День 4 (Отъезд)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Приём пищи:</label>
                  <select
                    value={dishMeal}
                    onChange={(e) => setDishMeal(e.target.value as any)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  >
                    <option value="Завтрак">Завтрак</option>
                    <option value="Обед">Обед</option>
                    <option value="Ужин">Ужин</option>
                    <option value="Перекус">Перекус / Ночной дожор</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black mb-1">Название блюда:</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Например: Плов с бараниной в 50л казане"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-amber-950">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Шеф-повар / Ответственный:</label>
                  <input
                    type="text"
                    value={dishChef}
                    onChange={(e) => setDishChef(e.target.value)}
                    placeholder="Лёха Навигатор, Дежурная двойка"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Основные ингредиенты (через запятую):</label>
                  <input
                    type="text"
                    value={dishIngredients}
                    onChange={(e) => setDishIngredients(e.target.value)}
                    placeholder="Рис, морковь, мясо, лук, зира"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="px-3 py-1.5 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-red-600 text-yellow-300 rounded-xl text-xs font-black uppercase shadow"
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
                className="bg-white border-2 border-amber-300 hover:border-red-500 rounded-2xl p-4 shadow-sm space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-900 text-yellow-400 font-black text-[11px] px-2.5 py-0.5 rounded-full">
                      {dish.day}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateMenu(menuItems.filter(m => m.id !== dish.id))}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>

                <h3 className="font-black text-base text-stone-900 leading-snug">
                  {dish.dishName}
                </h3>
                {dish.description && (
                  <p className="text-xs text-stone-600 font-medium">
                    {dish.description}
                  </p>
                )}

                {dish.chef && (
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 pt-1">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <User size={13} className="text-red-600" /> Шеф: <b className="text-amber-950">{dish.chef}</b>
                    </span>
                  </div>
                )}

                {dish.ingredients && dish.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dish.ingredients.map((ing, iIdx) => (
                      <span key={iIdx} className="bg-amber-50 border border-amber-200 text-stone-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
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
          <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setGroceryCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                    groceryCategory === 'all'
                      ? 'bg-red-600 text-yellow-300 shadow'
                      : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  Все ({groceryItems.length})
                </button>
                {(['Еда', 'Расходники', 'Жидкая валюта'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGroceryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                      groceryCategory === cat
                        ? 'bg-red-600 text-yellow-300 shadow'
                        : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddGrocery(!showAddGrocery)}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs px-4 py-2 rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <Plus size={15} /> Добавить позицию
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-black text-amber-950 pt-2 border-t border-amber-200">
              <div className="flex items-center gap-3">
                <span>Куплено: <b className="text-emerald-600">{boughtGroceriesCount} / {groceryItems.length}</b></span>
              </div>
              {totalGroceryCost > 0 && (
                <span>Ориентировочный бюджет: <b className="text-red-700">{totalGroceryCost.toLocaleString()} ₽</b></span>
              )}
            </div>
          </div>

          {/* Add Grocery Form */}
          {showAddGrocery && (
            <form
              onSubmit={handleAddGrocerySubmit}
              className="bg-yellow-50 border-3 border-red-500 rounded-3xl p-5 shadow-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-1.5">
                  <ShoppingCart size={16} /> Добавить позицию в список закупки
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="text-xs font-black text-amber-900 hover:text-red-600"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-amber-950">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black mb-1">Наименование товара:</label>
                  <input
                    type="text"
                    required
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    placeholder="Например: Тушёнка ГОСТ высший сорт (Говядина)"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Количество:</label>
                  <input
                    type="text"
                    required
                    value={gQty}
                    onChange={(e) => setGQty(e.target.value)}
                    placeholder="25 банок / 10 кг / 5 упак"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-amber-950">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Категория:</label>
                  <select
                    value={gCategory}
                    onChange={(e) => setGCategory(e.target.value as any)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  >
                    <option value="Еда">Еда (Провизия)</option>
                    <option value="Расходники">Расходники (Угли, салфетки, мешки)</option>
                    <option value="Жидкая валюта">Жидкая валюта (Напитки, бар)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Ответственный за покупку:</label>
                  <input
                    type="text"
                    value={gResponsible}
                    onChange={(e) => setGResponsible(e.target.value)}
                    placeholder="Саня, Лёха, Казначей"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black mb-1">Примерная стоимость (₽):</label>
                  <input
                    type="number"
                    value={gCost || ''}
                    onChange={(e) => setGCost(Number(e.target.value))}
                    placeholder="3500"
                    className="w-full bg-white border border-amber-400 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="px-3 py-1.5 bg-amber-200 text-amber-950 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-red-600 text-yellow-300 rounded-xl text-xs font-black uppercase shadow"
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
                className={`border-2 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  item.isBought
                    ? 'bg-amber-50/70 border-emerald-400/70 opacity-80'
                    : 'bg-white border-amber-300 hover:border-red-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleGrocery(item.id)}
                    className="text-stone-600 hover:scale-110 transition-transform shrink-0"
                  >
                    {item.isBought ? (
                      <CheckCircle2 size={22} className="text-emerald-600" />
                    ) : (
                      <Circle size={22} className="text-amber-400 hover:text-red-500" />
                    )}
                  </button>

                  <div className="space-y-0.5">
                    <span className={`text-xs sm:text-sm font-bold block ${item.isBought ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-900">
                      <span className="font-black text-red-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {item.quantity}
                      </span>
                      <span className="text-stone-500">
                        Категория: <b>{item.category}</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                  {item.responsibleName && (
                    <span className="text-xs font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                      👤 {item.responsibleName}
                    </span>
                  )}

                  {item.estimatedCost ? (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {item.estimatedCost.toLocaleString()} ₽
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onUpdateGroceries(groceryItems.filter(g => g.id !== item.id))}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash size={14} />
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
