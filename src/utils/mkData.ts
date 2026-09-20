import { MKFighter } from '../types/mkTournament';

export const MK_FIGHTERS: MKFighter[] = [
  {
    id: 'scorpion',
    name: 'Scorpion',
    alias: 'Скорпион',
    title: 'Ниндзя-призрак из преисподней',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    realm: 'Netherrealm',
    color: 'from-amber-600 to-yellow-500',
    specialMoves: [
      { name: 'Гарпун («Get Over Here!»)', combo: 'Назад, Назад + LP' },
      { name: 'Телепорт-удар', combo: 'Вниз, Назад + HP' },
      { name: 'Бросок в воздухе', combo: 'В воздухе: Блок' }
    ],
    fatality: {
      name: 'Огненное дыхание (Toasty!)',
      distance: 'В упор (Sweep)',
      combo: 'Вниз, Вниз, Вверх, HP'
    }
  },
  {
    id: 'subzero',
    name: 'Sub-Zero',
    alias: 'Саб-Зиро',
    title: 'Грандмастер клана Лин Куэй',
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-blue-600 to-cyan-500',
    specialMoves: [
      { name: 'Заморозка ледяным лучом', combo: 'Вниз, Вперёд + LP' },
      { name: 'Ледяной клон', combo: 'Вниз, Назад + LP' },
      { name: 'Подкат', combo: 'Назад + LP + LK + Блок' }
    ],
    fatality: {
      name: 'Вырывание хребта (Spine Rip)',
      distance: 'В упор',
      combo: 'Вперёд, Вниз, Вперёд + HP'
    }
  },
  {
    id: 'liukang',
    name: 'Liu Kang',
    alias: 'Лю Кан',
    title: 'Шаолиньский монах, Чемпион Смертельной Битвы',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-red-600 to-orange-500',
    specialMoves: [
      { name: 'Огненный шар (высокий)', combo: 'Вперёд, Вперёд + HP' },
      { name: 'Огненный шар (низкий)', combo: 'Вперёд, Вперёд + LP' },
      { name: 'Полёт велосипедом (Bicycle Kick)', combo: 'Удерживать LK 3 сек, отпустить' },
      { name: 'Удар дракона в полёте', combo: 'Вперёд, Вперёд + HK' }
    ],
    fatality: {
      name: 'Превращение в Дракона',
      distance: 'В упор',
      combo: 'Вперёд, Вперёд, Вниз, Вверх + LK'
    }
  },
  {
    id: 'raiden',
    name: 'Raiden',
    alias: 'Рейден',
    title: 'Бог грома и защитник Земного Царства',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm / Heavens',
    color: 'from-sky-500 to-indigo-600',
    specialMoves: [
      { name: 'Полёт торпедой («Superman»)', combo: 'Назад, Назад, Вперёд' },
      { name: 'Молния', combo: 'Вниз, Вперёд + LP' },
      { name: 'Телепортация за спину', combo: 'Вниз, Вверх' }
    ],
    fatality: {
      name: 'Электрический взрыв головы',
      distance: 'В упор',
      combo: 'Удерживать HP 3 сек, отпустить в упоре'
    }
  },
  {
    id: 'sonya',
    name: 'Sonya Blade',
    alias: 'Соня Блейд',
    title: 'Офицер Специального Назначения',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-emerald-600 to-green-500',
    specialMoves: [
      { name: 'Энергетические кольца', combo: 'Вниз, Вперёд + LP' },
      { name: 'Захват ногами (Leg Grab)', combo: 'Вниз + LP + Блок' },
      { name: 'Велосипедный удар ногами', combo: 'Назад, Назад, Вниз + HK' }
    ],
    fatality: {
      name: 'Поцелуй Смерти',
      distance: 'Любое расстояние',
      combo: 'Назад, Вперёд, Вниз, Вперёд + Run'
    }
  },
  {
    id: 'jax',
    name: 'Jax Briggs',
    alias: 'Джакс',
    title: 'Майор с бионическими руками',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-stone-600 to-zinc-500',
    specialMoves: [
      { name: 'Удар по земле (Землетрясение)', combo: 'Удерживать LK 3 сек' },
      { name: 'Ракетный выстрел', combo: 'Назад, Вперёд + HP' },
      { name: 'Ломание спины в воздухе', combo: 'В воздухе: Блок' }
    ],
    fatality: {
      name: 'Хлопок по ушам (Голова всмятку)',
      distance: 'В упор',
      combo: 'Удерживать Блок: Вверх, Вниз, Вперёд, Вверх'
    }
  },
  {
    id: 'reptile',
    name: 'Reptile',
    alias: 'Рептилия',
    title: 'Ящер-убийца из Затерянной Расы',
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80',
    realm: 'Zaterra / Outworld',
    color: 'from-lime-600 to-emerald-600',
    specialMoves: [
      { name: 'Плевок кислотой', combo: 'Вперёд, Вперёд + HP' },
      { name: 'Медленный шар энергии', combo: 'Назад, Назад + HP + LP' },
      { name: 'Быстрый шар энергии', combo: 'Вперёд, Вперёд + HP + LP' },
      { name: 'Невидимость', combo: 'Удерживать Блок: Вверх, Вверх, Вниз + HK' }
    ],
    fatality: {
      name: 'Поедание головы языком',
      distance: 'Прыжок',
      combo: 'Назад, Назад, Вниз + LP'
    }
  },
  {
    id: 'cyrax',
    name: 'Cyrax',
    alias: 'Сайракс',
    title: 'Жёлтый киборг клана Лин Куэй (LK-4D4)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-yellow-600 to-amber-500',
    specialMoves: [
      { name: 'Зелёная энергетическая сеть', combo: 'Назад, Назад + LK' },
      { name: 'Бомба (ближняя)', combo: 'Удерживать LK: Назад, Назад + HK' },
      { name: 'Телепортация со взрывом', combo: 'Вперёд, Вниз + Блок' }
    ],
    fatality: {
      name: 'Вертолёт-самоубийство',
      distance: 'В упор',
      combo: 'Вниз, Вниз, Вперёд, Вверх + Run'
    }
  },
  {
    id: 'sektor',
    name: 'Sektor',
    alias: 'Сектор',
    title: 'Красный киборг клана Лин Куэй (LK-9T9)',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    realm: 'Earthrealm',
    color: 'from-rose-600 to-red-700',
    specialMoves: [
      { name: 'Прямая ракета', combo: 'Вперёд, Вперёд + LP' },
      { name: 'Самонаводящаяся ракета', combo: 'Вниз, Назад + HP' },
      { name: 'Телепорт-апперкот снизу', combo: 'Вперёд, Вперёд + LK' }
    ],
    fatality: {
      name: 'Пресс-тиски',
      distance: 'Sweep',
      combo: 'LP, Run, Run, Блок'
    }
  },
  {
    id: 'noob',
    name: 'Noob Saibot',
    alias: 'Нуб Сайбот',
    title: 'Теневой ниндзя, первородный Саб-Зиро',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    realm: 'Netherrealm',
    color: 'from-stone-900 to-zinc-800',
    specialMoves: [
      { name: 'Теневой двойник (бросок)', combo: 'Вперёд, Вперёд + HP' },
      { name: 'Теневое облако-дизаблер', combo: 'Вниз, Вперёд + LP' },
      { name: 'Телепорт с падением', combo: 'Вниз, Вверх' }
    ],
    fatality: {
      name: 'Растягивание тенью',
      distance: 'Sweep',
      combo: 'Назад, Назад, Вперёд, Вперёд + HK'
    }
  }
];

// Helper to save ROM to IndexedDB for offline / instant reload
const DB_NAME = 'NegodyaiMK_DB';
const STORE_NAME = 'rom_store';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRomToIndexedDB(file: File): Promise<void> {
  const db = await openDB();
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      name: file.name,
      size: file.size,
      buffer,
      savedAt: new Date().toISOString()
    }, 'current_rom');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRomFromIndexedDB(): Promise<{ name: string; size: number; file: File } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_rom');
      req.onsuccess = () => {
        const data = req.result;
        if (!data || !data.buffer) {
          resolve(null);
          return;
        }
        const file = new File([data.buffer], data.name, { type: 'application/octet-stream' });
        resolve({ name: data.name, size: data.size, file });
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearRomFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('current_rom');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error(e);
  }
}
