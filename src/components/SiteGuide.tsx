import React, { useState } from 'react';
import { 
  BookOpen, ChevronRight, ChevronLeft, CheckCircle, 
  Shield, User, Users, Calendar, Coins, Sparkles, 
  Coffee, CheckSquare, Package, MessageSquare, Image as ImageIcon,
  Key, Award, HelpCircle, ArrowRight, ExternalLink,
  Flame, Lock, Search, Heart, Maximize2, Minimize2, X
} from 'lucide-react';
import { UserRole, ROLE_DEFINITIONS } from '../types';

interface SiteGuideProps {
  onNavigateTab?: (tabId: string, subTab?: any) => void;
  onClose?: () => void;
  isModal?: boolean;
}

interface GuideStep {
  id: number;
  title: string;
  subtitle: string;
  category: 'auth' | 'rally' | 'food' | 'coins' | 'fund' | 'community';
  targetTab?: string;
  targetSubTab?: string;
  illustrationType: 'auth' | 'rally' | 'menu' | 'coins' | 'fund' | 'chat';
  description: string;
  keyPoints: string[];
  tips: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Шаг 1. Вход и Безопасная Регистрация',
    subtitle: 'Создание аккаунта, надежный пароль и одобрение Капитаном',
    category: 'auth',
    illustrationType: 'auth',
    description: 'Сайт туристической команды «Негодяи» — это закрытый походный штаб. Все данные защищены, а доступ открывается Капитаном команды.',
    keyPoints: [
      'Политика пароля: минимум 6 знаков, обязательны заглавная буква, строчная буква и цифра или спецсимвол.',
      'После регистрации аккаунт попадает на модерацию Капитану (Ковбою).',
      'Если забыли пароль — отправьте заявку на сброс, и Капитан выдаст вам новый пароль в Штабе.',
      'В личном кабинете укажите позывной, имя, дату рождения и загрузите фото профиля.'
    ],
    tips: 'Совет: Укажите точную дату рождения — система автоматически поздравит вас в день рождения на всем сайте!'
  },
  {
    id: 2,
    title: 'Шаг 2. Слёт: Участие и Взносы',
    subtitle: 'Отметка статуса участия, расчет взносов и напоминания',
    category: 'rally',
    targetTab: 'home',
    targetSubTab: 'overview',
    illustrationType: 'rally',
    description: 'Вкладка «Слёты» — сердце нашего лагеря. Здесь публикуются даты предстоящих сборов, локации на карте и финансовая смета слёта.',
    keyPoints: [
      'Выберите свой статус: «Еду точно» (зеленый), «Думаю / Под вопросом» (желтый) или «Не еду» (красный).',
      'Для парней и девушек действует справедливый взнос (обычно для девушек взнос ниже).',
      'При оплате взноса Казначей или Капитан ставят зеленую отметку «Оплачено».',
      'Если возникла задолженность, Капитан может отправить деликатное напоминание («Пнуть должника»).'
    ],
    tips: 'Совет: Заранее отмечайте статус поездки, чтобы шеф-повар мог точно рассчитать раскладку продуктов!'
  },
  {
    id: 3,
    title: 'Шаг 3. Меню лагеря и Закупка продуктов',
    subtitle: 'Полевая кухня, меню по дням и список покупок',
    category: 'food',
    targetTab: 'home',
    targetSubTab: 'menu',
    illustrationType: 'menu',
    description: 'Настоящий поход — это вкусная еда у костра: фирменный плов, уха, сытные каши и чай на травах.',
    keyPoints: [
      'Шеф-повар составляет рацион по дням и приемам пищи (Завтрак, Обед, Ужин).',
      'В смете продуктов видно, что уже куплено, а что еще предстоит приобрести.',
      'Участники могут закреплять за собой закупку определенных продуктов и ставить галочки готовности.',
      'Общая стоимость покупок распределяется прозрачно среди участников.'
    ],
    tips: 'Совет: Загляните во вкладку «Меню» перед поездкой в супермаркет — там указаны точные граммовки!'
  },
  {
    id: 4,
    title: 'Шаг 4. Монеты Негодяев и Скидка на слёт',
    subtitle: 'Игровая экономика, выполнение задач и Колесо Фортуны',
    category: 'coins',
    targetTab: 'home',
    targetSubTab: 'game',
    illustrationType: 'coins',
    description: 'Уникальная система мотивации команды: за помощь лагерю и дежурства участники получают именные золотые монеты Негодяев!',
    keyPoints: [
      'Монеты чеканятся Капитаном за: заготовку дров, дежурство по кухне, обустройство лагеря, победы в конкурсах.',
      'В личном кабинете монет можно крутить «Колесо Фортуны» и выигрывать бонусные монеты.',
      'Накопленные монеты обмениваются на реальную скидку на взнос предстоящего слёта.',
      'В таблице лидеров отображается рейтинг самых активных Негодяев слёта.'
    ],
    tips: 'Совет: Чем больше вы помогаете лагерю, тем дешевле для вас обходится слёт!'
  },
  {
    id: 5,
    title: 'Шаг 5. Фонд Негодяев и Взносы за любой год',
    subtitle: 'Ежемесячный фонд 500 ₽, прозрачные таблицы и выбор года',
    category: 'fund',
    targetTab: 'fund',
    illustrationType: 'fund',
    description: 'Фонд команды обеспечивает покупку общего снаряжения: шатров, казанов, бензогенератора, бензопил и оплату общекомандных нужд.',
    keyPoints: [
      'Стандартный взнос составляет 500 рублей в месяц.',
      'В таблице взносов можно выбрать ЛЮБОЙ год (архивные годы и будущие периоды без ограничений).',
      'Казначей или Капитан ведут учет поступлений с подтверждением галочками по месяцам.',
      'Отчет о балансе фонда и расходах доступен всем участникам для полной прозрачности.'
    ],
    tips: 'Совет: Своевременный взнос в Фонд помогает обновлять лагерный инвентарь к каждому новому сезону!'
  },
  {
    id: 6,
    title: 'Шаг 6. Командный чат, Инвентарь и Фотоархив',
    subtitle: 'Связь 24/7, учет лагерного имущества и хроники с 2018 года',
    category: 'community',
    targetTab: 'history',
    illustrationType: 'chat',
    description: 'Всё необходимое для походной жизни собрано в одном месте: от фотокарточек до складского учета снаряжения.',
    keyPoints: [
      'Чат команды: открывается кнопкой в шапке на любой странице, поддерживает фото и автоответы бота.',
      'Инвентарь: Хранитель лагеря ведет список имущества (шатры, топоры, котлы, посуда) и их состояние.',
      'История и Фотогалерея: летопись с 2018 года, фотоальбомы по годам без ограничений по объему.',
      'Документы: регламенты слёта, памятки походника и инструкции безопасности.'
    ],
    tips: 'Совет: Пользуйтесь строкой быстрого поиска вверху сайта — она ищет по людям, задачам, вещам и документам!'
  }
];

export default function SiteGuide({
  onNavigateTab,
  onClose,
  isModal = false
}: SiteGuideProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'roles' | 'features'>('steps');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const currentStep = GUIDE_STEPS[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setCurrentStepIndex(GUIDE_STEPS.length - 1);
    }
  };

  // Render graphic illustration for each step
  const renderStepGraphic = (type: GuideStep['illustrationType']) => {
    switch (type) {
      case 'auth':
        return (
          <div className="w-full bg-gradient-to-br from-amber-900 via-stone-900 to-red-950 p-4 rounded-2xl border-2 border-amber-500 shadow-lg text-white space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-[11px] font-mono text-amber-300 ml-2">Штаб Негодяев • Вход в систему</span>
              </div>
              <span className="text-[10px] bg-red-600/80 px-2 py-0.5 rounded text-yellow-300 font-black">
                SSL Защищено
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-amber-400/30 space-y-2">
                <div className="text-[11px] font-black uppercase text-yellow-300 flex items-center gap-1.5">
                  <Key size={13} /> Требования к паролю
                </div>
                <ul className="text-[10px] space-y-1 text-stone-200">
                  <li className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle size={11} /> Минимум 6 символов
                  </li>
                  <li className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle size={11} /> Заглавная буква (А-Я / A-Z)
                  </li>
                  <li className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle size={11} /> Строчная буква (а-я / a-z)
                  </li>
                  <li className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle size={11} /> Цифра или спецсимвол (0-9, @#$)
                  </li>
                </ul>
              </div>

              <div className="bg-amber-950/70 p-3 rounded-xl border border-amber-400/40 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Shield size={13} /> Модерация Капитаном
                  </div>
                  <p className="text-[10px] text-stone-300 mt-1">
                    Новый аккаунт ожидает одобрения в Штабе Капитана. Спам и чужаки исключены.
                  </p>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-red-600/60 border border-red-400 px-2 py-1 rounded-lg text-[10px] text-yellow-200 font-bold">
                  👑 Капитан подтверждает доступ
                </div>
              </div>
            </div>
          </div>
        );

      case 'rally':
        return (
          <div className="w-full bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 p-4 rounded-2xl border-2 border-amber-400 shadow-md text-stone-900 space-y-3">
            <div className="flex items-center justify-between bg-red-600 text-yellow-300 px-3 py-1.5 rounded-xl font-black text-xs uppercase">
              <span className="flex items-center gap-1.5">
                <Flame size={14} /> Карточка Слёта: Лесная Поляна
              </span>
              <span>12–14 Июня 2026</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-100 border-2 border-emerald-500 p-2 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-emerald-900">Еду точно</div>
                <div className="text-sm font-black text-emerald-700">18 чел</div>
                <div className="text-[9px] text-emerald-800">Парни: 3 000 ₽</div>
              </div>
              <div className="bg-yellow-100 border-2 border-amber-500 p-2 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-amber-900">Думаю</div>
                <div className="text-sm font-black text-amber-700">4 чел</div>
                <div className="text-[9px] text-amber-800">Девушки: 2 100 ₽</div>
              </div>
              <div className="bg-stone-100 border-2 border-stone-400 p-2 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-stone-700">Не смогу</div>
                <div className="text-sm font-black text-stone-500">2 чел</div>
                <div className="text-[9px] text-stone-500">Архив</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-amber-300">
              <span className="font-bold text-amber-950">Статус оплаты взноса:</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md font-black text-[10px] uppercase">
                ✓ Оплачено Казначею
              </span>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="w-full bg-stone-900 p-4 rounded-2xl border-2 border-amber-500 shadow-md text-white space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="text-xs font-black uppercase text-yellow-300 flex items-center gap-1.5">
                <Coffee size={15} /> Меню Шеф-Повара & Смета Продуктов
              </div>
              <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded font-black">
                Раскладка на 25 человек
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700 space-y-1">
                <div className="font-bold text-amber-400 uppercase">Суббота • Обед</div>
                <div className="text-stone-200 font-black text-xs">Казанный плов с бараниной</div>
                <div className="text-stone-400">Рис 3 кг, Мясо 4 кг, Морковь 3 кг</div>
                <div className="text-emerald-400 font-bold">✓ Закуплено: @Шеф-повар</div>
              </div>

              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700 space-y-1">
                <div className="font-bold text-amber-400 uppercase">Воскресенье • Утро</div>
                <div className="text-stone-200 font-black text-xs">Костровая уха и чай</div>
                <div className="text-stone-400">Рыба свежая, картофель, зелень</div>
                <div className="text-amber-400 font-bold">⌛ В процессе закупки</div>
              </div>
            </div>
          </div>
        );

      case 'coins':
        return (
          <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-4 rounded-2xl border-2 border-yellow-300 shadow-lg text-amber-950 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-yellow-300 border-2 border-amber-900 flex items-center justify-center font-black text-sm shadow">
                  🪙
                </span>
                <span className="font-black text-xs uppercase text-amber-950">
                  Монеты Негодяев & Колесо Фортуны
                </span>
              </div>
              <span className="bg-red-600 text-yellow-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-full border border-amber-950">
                1 Монета = 100 ₽ скидки
              </span>
            </div>

            <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-400 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase text-red-700">Баланс монет Негодяя</div>
                <div className="text-2xl font-black text-amber-950">8 монет</div>
                <div className="text-[10px] text-stone-600 font-medium">Скидка на слёт: 800 рублей</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-purple-600 text-white font-black text-[11px] uppercase rounded-xl shadow-xs">
                  🎡 Крутить Колесо
                </span>
                <div className="text-[9px] text-amber-900 font-bold mt-1">1 прокрутка в день</div>
              </div>
            </div>
          </div>
        );

      case 'fund':
        return (
          <div className="w-full bg-gradient-to-br from-emerald-900 to-stone-900 p-4 rounded-2xl border-2 border-emerald-400 shadow-lg text-white space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/40 pb-2">
              <div className="text-xs font-black uppercase text-emerald-300 flex items-center gap-1.5">
                <Coins size={15} /> Ведомость Фонда Негодяев
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold bg-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-500">
                <span>Год:</span>
                <span className="text-yellow-300 font-black">2026 ▾</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div className="grid grid-cols-12 gap-1 text-center font-black uppercase text-emerald-200 bg-emerald-950/60 p-1.5 rounded-lg">
                <span className="col-span-4 text-left">Участник</span>
                <span className="col-span-2">Янв</span>
                <span className="col-span-2">Фев</span>
                <span className="col-span-2">Мар</span>
                <span className="col-span-2">Апр</span>
              </div>
              <div className="grid grid-cols-12 gap-1 text-center items-center bg-stone-800/80 p-1.5 rounded-lg border border-emerald-500/30">
                <span className="col-span-4 text-left font-bold text-yellow-300 truncate">Ковбой (Капитан)</span>
                <span className="col-span-2 text-emerald-400 font-black">✓ 500</span>
                <span className="col-span-2 text-emerald-400 font-black">✓ 500</span>
                <span className="col-span-2 text-emerald-400 font-black">✓ 500</span>
                <span className="col-span-2 text-emerald-400 font-black">✓ 500</span>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="w-full bg-stone-900 p-4 rounded-2xl border-2 border-amber-400 shadow-lg text-white space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="text-xs font-black uppercase text-yellow-300 flex items-center gap-1.5">
                <MessageSquare size={15} /> Чат команды & База Знаний
              </div>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">
                Онлайн 24/7
              </span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="bg-stone-800 p-2 rounded-xl border border-stone-700">
                <span className="text-red-400 font-black">@Ковбой (Капитан):</span>
                <p className="text-stone-200 mt-0.5">«Негодяи, обновили список инвентаря. Проверьте палатки и шатер!»</p>
              </div>
              <div className="bg-amber-950/70 p-2 rounded-xl border border-amber-600/40">
                <span className="text-yellow-400 font-black">🤖 Бот Негодяев:</span>
                <p className="text-stone-300 mt-0.5">«До слёта осталось 14 дней! Не забудьте отметиться в ведомости.»</p>
              </div>
            </div>
          </div>
        );
    }
  };

  const filteredRoles = Object.values(ROLE_DEFINITIONS).filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.badge.toLowerCase().includes(q);
  });

  return (
    <div className={`flex flex-col bg-amber-50/90 rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden ${
      isModal ? 'max-w-4xl w-full max-h-[90vh]' : 'w-full'
    }`}>
      
      {/* GUIDE HEADER */}
      <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-4 text-yellow-300 border-b-2 border-amber-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-950/40 border border-yellow-300 flex items-center justify-center text-lg shadow-inner">
            📖
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base uppercase tracking-tight text-white leading-tight">
              Интерактивное руководство Негодяев
            </h2>
            <p className="text-[11px] text-yellow-200 font-medium">
              Пошаговая инструкция, обозначения ролей и все возможности сайта
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white hover:text-yellow-300 hover:bg-white/10 rounded-xl transition-colors"
              title="Закрыть руководство"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* TOP NAVIGATION MODE SWITCHER */}
      <div className="bg-amber-200/90 p-2 border-b-2 border-amber-300 flex flex-wrap gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('steps')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'steps'
              ? 'bg-red-600 text-yellow-300 shadow-sm transform scale-[1.01]'
              : 'text-amber-950 hover:bg-amber-100 bg-amber-100/60'
          }`}
        >
          <BookOpen size={14} />
          <span>Пошаговые шаги ({GUIDE_STEPS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'roles'
              ? 'bg-red-600 text-yellow-300 shadow-sm transform scale-[1.01]'
              : 'text-amber-950 hover:bg-amber-100 bg-amber-100/60'
          }`}
        >
          <Shield size={14} />
          <span>Роли в команде (8)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'features'
              ? 'bg-red-600 text-yellow-300 shadow-sm transform scale-[1.01]'
              : 'text-amber-950 hover:bg-amber-100 bg-amber-100/60'
          }`}
        >
          <Sparkles size={14} />
          <span>Возможности сайта</span>
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin max-h-[70vh]">
        
        {/* ================= MODE 1: STEP-BY-STEP SLIDER WITH ILLUSTRATIONS ================= */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            
            {/* Step Selector Badges */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
              {GUIDE_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all shrink-0 flex items-center gap-1.5 ${
                    currentStepIndex === idx
                      ? 'bg-red-600 text-yellow-300 shadow-md ring-2 ring-amber-400'
                      : 'bg-white text-stone-700 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <span>{step.id}.</span>
                  <span className="hidden sm:inline">{step.title.split('.')[1]?.trim() || step.title}</span>
                  <span className="sm:hidden">{step.title.slice(0, 10)}...</span>
                </button>
              ))}
            </div>

            {/* Current Step Active Card */}
            <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    Шаг {currentStep.id} из {GUIDE_STEPS.length}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-amber-950 uppercase mt-1">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    {currentStep.subtitle}
                  </p>
                </div>

                {currentStep.targetTab && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(currentStep.targetTab!, currentStep.targetSubTab);
                      if (onClose) onClose();
                    }}
                    className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-amber-950 font-black text-xs uppercase rounded-xl border border-amber-600 shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-center"
                  >
                    <span>Перейти в раздел</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              {/* Graphic Illustration Card */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-1">
                  <ImageIcon size={12} /> Наглядная иллюстрация действий:
                </div>
                {renderStepGraphic(currentStep.illustrationType)}
              </div>

              {/* Description & Key Points */}
              <div className="space-y-2 text-xs">
                <p className="text-stone-800 leading-relaxed font-medium">
                  {currentStep.description}
                </p>

                <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200 space-y-1.5">
                  <span className="font-black text-amber-950 text-xs uppercase block">
                    📌 Главные правила и действия:
                  </span>
                  <ul className="space-y-1 text-stone-700">
                    {currentStep.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold mt-0.5">▪</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Helpful Tip */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-2.5 rounded-r-xl text-stone-800 text-[11px] font-medium">
                  💡 {currentStep.tips}
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Предыдущий шаг</span>
                </button>

                <div className="text-xs font-black text-amber-950">
                  {currentStepIndex + 1} / {GUIDE_STEPS.length}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors shadow"
                >
                  <span>Следующий шаг</span>
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= MODE 2: TEAM ROLES DIRECTORY ================= */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-2xl border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-xs sm:text-sm uppercase text-red-600 flex items-center gap-1.5">
                  <Shield size={16} />
                  Командная иерархия туристической команды «Негодяи»
                </h3>
                <p className="text-[11px] text-stone-600 font-medium">
                  Ключевые должности уникальны (только 1 человек на должность). Роли назначаются Капитаном.
                </p>
              </div>

              <div className="w-full sm:w-60 relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Поиск роли..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs focus:outline-none focus:border-red-600 font-medium"
                />
              </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRoles.map(role => {
                const isSelected = selectedRole === role.role;
                return (
                  <div
                    key={role.role}
                    onClick={() => setSelectedRole(role.role)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-100/90 border-red-500 shadow-md ring-1 ring-red-400'
                        : 'bg-white hover:bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{role.icon}</span>
                          <div>
                            <h4 className="font-black text-xs uppercase text-amber-950">
                              {role.title}
                            </h4>
                            <span className="text-[10px] text-red-600 font-bold">
                              {role.badge}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${role.color}`}>
                          {role.role === 'admin' ? 'Руководитель' : role.role === 'member' ? 'Общая роль' : 'Должность'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-700 leading-relaxed font-medium">
                        {role.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-amber-200 text-[10px] font-bold text-amber-900 flex items-center justify-between">
                      <span>Назначается: Капитаном команды</span>
                      <span>{role.role === 'member' ? 'Много участников' : 'Строго 1 Негодяй'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Responsibilities Note */}
            <div className="bg-amber-100/70 border-2 border-amber-300 p-3 rounded-2xl text-xs text-amber-950 space-y-1">
              <span className="font-black uppercase flex items-center gap-1.5 text-red-700">
                👑 Принцип передачи должностей:
              </span>
              <p className="text-[11px] text-stone-700">
                При назначении новой ключевой роли (Казначей, Шеф-повар, Завхоз и т.д.) прежний ответственный автоматически переходит в статус рядового Участника (⛺ Негодяй). Это гарантирует порядок и исключает путаницу в обязанностях.
              </p>
            </div>

          </div>
        )}

        {/* ================= MODE 3: ALL SITE FEATURES MAP ================= */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            
            <div className="bg-white p-3.5 rounded-2xl border border-amber-300">
              <h3 className="font-black text-xs sm:text-sm uppercase text-red-600 flex items-center gap-1.5">
                <Sparkles size={16} />
                Карта разделов и быстрый переход
              </h3>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                Кликните на любой раздел, чтобы мгновенно перейти к нему:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { tab: 'history', title: 'История команды', desc: 'Летопись с 2018 года, походные байки и видео-истории', icon: '📖' },
                { tab: 'birthdays', title: 'Дни рождения', desc: 'Календарь именинников, оповещения и поздравления', icon: '🎂' },
                { tab: 'home', sub: 'overview', title: 'Слёты и Взносы', desc: 'План поездки, локации, статус «Еду/Не еду», сбор денег', icon: '⛺' },
                { tab: 'home', sub: 'menu', title: 'Меню и Продукты', desc: 'Рацион костровой кухни, смета закупок и ответственные', icon: '🍲' },
                { tab: 'home', sub: 'game', title: 'Скидка на слёт & Монеты', desc: 'Личный кабинет монет, Колесо Фортуны и скидки', icon: '🪙' },
                { tab: 'home', sub: 'tasks', title: 'Задачи слёта', desc: 'Походные поручения, дежурства по лагерю и дрова', icon: '📋' },
                { tab: 'home', sub: 'contests', title: 'Конкурсы и Творчество', desc: 'Командные соревнования, визитки и творческие идеи', icon: '🏆' },
                { tab: 'inventory', title: 'Инвентарь лагеря', desc: 'Шатры, котлы, генератор, топоры и учет состояния', icon: '📦' },
                { tab: 'gallery', title: 'Фотогалерея', desc: 'Архив фотографий по годам без ограничений по объему', icon: '📸' },
                { tab: 'documents', title: 'Документы и Регламент', desc: 'Походные правила, инструкции безопасности и памятки', icon: '📄' },
                { tab: 'fund', title: 'Фонд Негодяев', desc: 'Взносы 500 ₽/мес, таблица оплат за любой год и отчеты', icon: '💰' }
              ].map((feat, i) => (
                <div
                  key={i}
                  className="bg-white hover:bg-amber-50 border-2 border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feat.icon}</span>
                    <div>
                      <h4 className="font-black text-xs uppercase text-amber-950">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab(feat.tab, feat.sub);
                        if (onClose) onClose();
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-[11px] uppercase rounded-xl transition-all shadow shrink-0"
                    >
                      Открыть
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="bg-amber-100 p-3 border-t-2 border-amber-300 flex items-center justify-between text-xs font-bold text-amber-950 shrink-0">
        <div className="flex items-center gap-2">
          <span>⛺ Туристическая команда «Негодяи»</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline text-stone-500">С нами не пропадешь</span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl font-black uppercase text-xs border border-amber-400 transition-colors"
          >
            Закрыть
          </button>
        )}
      </div>

    </div>
  );
}
