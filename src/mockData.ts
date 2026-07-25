import { Participant, Excursion, ChatMessage, BotConfig, TaskItem, MenuItem, GroceryItem, InventoryItem, Contest } from './types';

export interface PsychotypeMeta {
  name: string;
  emoji: string;
  description: string;
  typicalPhrase: string;
}

export const PSYCHOTYPES: PsychotypeMeta[] = [
  {
    name: "Весельчак-балагур",
    emoji: "🎸",
    description: "Душа компании. Шутит, травит байки, поет хулиганские песни.",
    typicalPhrase: "Будет угарно! Будем пить чай, жарить тушняк и орать песни под гитару!"
  },
  {
    name: "Душнила-контролёр",
    emoji: "📐",
    description: "Сводит чеки до копейки, обожает таблицы Excel и правила безопасности.",
    typicalPhrase: "Я составил подробную Excel-таблицу. Сдаём строго по 8500 рублей до пятницы!"
  },
  {
    name: "Паникёр-истерик",
    emoji: "🧁",
    description: "Боится клещей, медведей, плохой погоды, мокрых ног и конца света.",
    typicalPhrase: "А если байдарки перевернутся?! Там тучи чернющие и голодные волки в кустах!"
  },
  {
    name: "Тихий философ",
    emoji: "🌲",
    description: "Созерцает природу и костер, молчалив, ищет внутренний дзен.",
    typicalPhrase: "Мы лишь пылинки у великого костра вечности... Послушайте треск сосновых веток."
  },
  {
    name: "Бунтарь-анархист",
    emoji: "🦡",
    description: "Против систем, правил, смет и душных организаторов.",
    typicalPhrase: "Да нафиг правила! Берём казан, 5 мешков угля и ящик пенного, остальное разберемся!"
  },
  {
    name: "Походный шеф-повар",
    emoji: "🍲",
    description: "Священнодействует у кухонного котла. Никого не подпускает и ворчит.",
    typicalPhrase: "Кто помыл котелок с химозным мылом?! Плов испорчен! Сюда нужен только курдюк!"
  },
  {
    name: "Гитарист-романтик",
    emoji: "🎶",
    description: "Поёт лирические песни всю ночь, мешая спать. Знает ровно 3 аккорда.",
    typicalPhrase: "Ребята, а давайте 'Батарейку' на бис? Или КиШа по третьему кругу?"
  },
  {
    name: "Ленивый лежебока",
    emoji: "🛌",
    description: "Спит в палатке до обеда, уклоняется от колки дров и переноски вещей.",
    typicalPhrase: "Ребят, я полежу полчасика, там голова что-то гудит... Вы пока разверните лагерь."
  },
  {
    name: "Инста-туристка",
    emoji: "📸",
    description: "Ищет идеальный ракурс для селфи, борется за повербанки и связь.",
    typicalPhrase: "Где тут ловит 4G? Мне срочно нужно выложить сторис с красивым мухомором!"
  },
  {
    name: "Клещевой ипохондрик",
    emoji: "🕷️",
    description: "Опрыскивается репеллентами каждую минуту, панически боится укусов.",
    typicalPhrase: "Меня укусила какая-то мошка! Это точно энцефалит?! Проверьте мне спину!"
  },
  {
    name: "Бывалый выживальщик",
    emoji: "🔪",
    description: "Ходит в армейском камуфляже, имеет 4 ножа, огниво и мачете. Готов ко всему.",
    typicalPhrase: "Если потеряемся — будем есть сосновую кору и заваривать мох. Я научу!"
  },
  {
    name: "Спортивный темп-лидер",
    emoji: "🏃",
    description: "Рвётся вперёд без передышки, ругает отстающих за медлительность.",
    typicalPhrase: "Что вы плетётесь как сонные черепахи? Нам осталось всего 15 километров!"
  },
  {
    name: "Алко-турист",
    emoji: "🍺",
    description: "Начинает выпивать еще на этапе погрузки в автобус, спит где придется.",
    typicalPhrase: "О, штрафную наливай! А где вообще моя палатка и где мои ботинки?"
  },
  {
    name: "Эко-защитник",
    emoji: "♻️",
    description: "Сортирует лесной мусор, ругает за брошенные окурки и защищает муравейники.",
    typicalPhrase: "Пластиковый стаканчик разлагается 500 лет! Заберите пластик с собой, кощунники!"
  },
  {
    name: "Халявщик-забываха",
    emoji: "🎒",
    description: "Забыл спальник, палатку, посуду и еду, но взял великолепное настроение.",
    typicalPhrase: "Ой, я ложку и кружку дома забыл... И спальник тоже. Можно к вам в палатку?"
  }
];

export const initialParticipants: Participant[] = [
  {
    id: "1",
    name: "Андрюха Хорёк",
    nickname: "hoorek",
    psychotype: "Бунтарь-анархист",
    avatar: "🦡",
    paidAmount: 5000,
    totalCost: 8500,
    debtAmount: 3500,
    joined: true,
    birthday: "1995-10-12",
    joinedYear: 2018,
    skippedYears: [2020, 2022],
    gender: "male"
  },
  {
    id: "2",
    name: "Саня Запевала",
    nickname: "singing_sanya",
    psychotype: "Весельчак-балагур",
    avatar: "🎸",
    paidAmount: 8500,
    totalCost: 8500,
    debtAmount: 0,
    joined: true,
    birthday: "1994-05-22", // May 22 - Today!
    joinedYear: 2019,
    skippedYears: [],
    gender: "male"
  },
  {
    id: "3",
    name: "Лёха Навигатор",
    nickname: "navigator_alex",
    psychotype: "Душнила-контролёр",
    avatar: "📐",
    paidAmount: 6000,
    totalCost: 8500,
    debtAmount: 2500,
    joined: true,
    birthday: "1989-08-24",
    joinedYear: 2018,
    skippedYears: [2021],
    gender: "male"
  },
  {
    id: "4",
    name: "Иришка Булочка",
    nickname: "irishka_baker",
    psychotype: "Паникёр-истерик",
    avatar: "🧁",
    paidAmount: 1500,
    totalCost: 6000,
    debtAmount: 4500,
    joined: false,
    birthday: "1997-03-15",
    joinedYear: 2021,
    skippedYears: [],
    gender: "female"
  },
  {
    id: "5",
    name: "Михалыч Лесник",
    nickname: "forest_boss",
    psychotype: "Тихий философ",
    avatar: "🌲",
    paidAmount: 8500,
    totalCost: 8500,
    debtAmount: 0,
    joined: true,
    birthday: "1965-11-30",
    joinedYear: 2018,
    skippedYears: [],
    gender: "male"
  },
  {
    id: "6",
    name: "Юрец Мангальщик",
    nickname: "yura_chef",
    psychotype: "Походный шеф-повар",
    avatar: "🍲",
    paidAmount: 8500,
    totalCost: 8500,
    debtAmount: 0,
    joined: true,
    birthday: "1986-05-25",
    joinedYear: 2020,
    skippedYears: [2023],
    gender: "male"
  },
  {
    id: "7",
    name: "Серёга Три-Аккорда",
    nickname: "guitar_serega",
    psychotype: "Гитарист-романтик",
    avatar: "🎶",
    paidAmount: 4000,
    totalCost: 8500,
    debtAmount: 4500,
    joined: true,
    birthday: "1992-06-12",
    joinedYear: 2021,
    skippedYears: [2024],
    gender: "male"
  },
  {
    id: "8",
    name: "Данчик Кипиш",
    nickname: "dan_survivor",
    psychotype: "Бывалый выживальщик",
    avatar: "🔪",
    paidAmount: 0,
    totalCost: 8500,
    debtAmount: 8500,
    joined: false,
    birthday: "1990-07-04",
    joinedYear: 2022,
    skippedYears: [],
    gender: "male"
  }
];

export const initialExcursions: Excursion[] = [
  {
    id: "e1",
    title: "Ежегодный Туристический Слёт 'Негодяи 2026'",
    date: "2026-06-12",
    location: "Озеро Глубокое, лагерь Ромашка",
    description: "Наш главный ежегодный лесной сбор! Палатки, песни под гитару, заплывы, спортивное ориентирование и посвящение новичков.",
    costPerPerson: 5000,
    costBoys: 5000,
    costGirls: 3500,
    isActive: true
  },
  {
    id: "e2",
    title: "Организованный сплав по реке Киржач",
    date: "2026-07-18",
    location: "р. Киржач, Владимирская область",
    description: "Двухдневный сплав на байдарках с посещением заброшенной лесной часовни и грандиозным вечерним пловом.",
    costPerPerson: 3500,
    costBoys: 3500,
    costGirls: 2500,
    isActive: true
  },
  {
    id: "e3",
    title: "Зимний кутёж на горе Малина",
    date: "2026-01-05",
    location: "Горнолыжная база Малина",
    description: "Зимняя вылазка с баней, нырянием в прорубь и заездами на снегоходах.",
    costPerPerson: 4000,
    costBoys: 4000,
    costGirls: 3000,
    isActive: false
  }
];

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    senderName: "Лёха Навигатор",
    senderNickname: "navigator_alex",
    senderPsychotype: "Душнила-контролёр",
    text: "Привет всем! Я детально свёл Excel-таблицу нашей сметы на летние сборы. Ежегодный турслет (5000р) плюс сплав (3500р). Итого с каждого ровно 8500р. Оплату жду до конца недели, дебет с кредитом не бьётся!",
    timestamp: "10:15",
    isBot: false
  },
  {
    id: "m2",
    senderName: "Андрюха Хорёк",
    senderNickname: "hoorek",
    senderPsychotype: "Бунтарь-анархист",
    text: "Алексей, задолбал со своими ячейками и формулами! Нафиг правила, главное — взять 5 мешков угля и большой казан, а там разберёмся! Бунт анархистов на Киржаче!",
    timestamp: "10:18",
    isBot: false
  },
  {
    id: "m3",
    senderName: "Иришка Булочка",
    senderNickname: "irishka_baker",
    senderPsychotype: "Паникёр-истерик",
    text: "Мамочки мои, вы прогноз погоды видели?! Там тучи чернющие! А если байдарки перевернутся посреди реки?! И я читала, что в тех лесах водятся голодные медведи-шатуны... Мы же промокнем и замёрзнем!",
    timestamp: "10:22",
    isBot: false
  },
  {
    id: "m4",
    senderName: "Михалыч Лесник",
    senderNickname: "forest_boss",
    senderPsychotype: "Тихий философ",
    text: "Тише, Иришка. Посмотри, как тихо падает листва. Мы лишь гости в этом зелёном храме. А медведи... они тоже ищут покой. Главное — поймать космический дзен у ночного костра под треск сосновых веток.",
    timestamp: "10:25",
    isBot: false
  },
  {
    id: "m5",
    senderName: "Саня Запевала",
    senderNickname: "singing_sanya",
    senderPsychotype: "Весельчак-балагур",
    text: "Да ладно вам ныть и философствовать! Будет угарно! Будем пить чай, жарить тушняк и петь орные песни под гитару! Бот Максимка, ну-ка зажги, скажи своё веское слово за бабки и за сборы!",
    timestamp: "10:30",
    isBot: false
  }
];

export const initialBotConfig: BotConfig = {
  swearingLevel: "medium",
  autoDetectPsychotype: true,
  activePersonality: "Походный заводила",
  welcomeTemplate: "Привет, Негодяи! Я ваш ИИ-помощник Максимка. Спрашивайте у меня про наши туры, сплавы, походы, долги или просто трындите. Проведу быстрый психоанализ любого душнилы или паникёра!",
  foundingYear: 2018
};

export const initialTasks: TaskItem[] = [
  {
    id: "t1",
    title: "Починить генератор (дым валит чёрный, походу надо менять свечу и слить старый бензин)",
    assigneeId: "1",
    assigneeName: "Андрюха Хорёк",
    deadline: "2026-06-10",
    isCompleted: false
  },
  {
    id: "t2",
    title: "Не забыть взять палатки (особенно большую 4-местную Лёхи Навигатора, иначе спать на сырых шишках)",
    assigneeId: "3",
    assigneeName: "Лёха Навигатор",
    deadline: "2026-06-11",
    isCompleted: true
  },
  {
    id: "t3",
    title: "Закупить сочный курдюк, баранину и хорошую зиру на коронный лесной плов",
    assigneeId: "6",
    assigneeName: "Юрец Мангальщик",
    deadline: "2026-06-12",
    isCompleted: false
  },
  {
    id: "t4",
    title: "Брызгалки от клещей купить (самые зверские, 20 штук, а то Иришка Булочка изноется)",
    assigneeId: "8",
    assigneeName: "Данчик Кипиш",
    deadline: "2026-06-08",
    isCompleted: false
  }
];

export const initialMenuItems: MenuItem[] = [
  {
    id: "m_i1",
    day: "День 1. Обед",
    dishName: "Суп 'Прощай печень' у костра",
    description: "Наваристый суп из 6 банок свиной тушенки ГОСТ, макаронных рожек, картошки и секретных трав, собранных Михалычем."
  },
  {
    id: "m_i2",
    day: "День 1. Ужин",
    dishName: "Коронный Плов от Юрца Мангальщика",
    description: "Настоящий узбекский плов на костровом чугунном казане с курдюком, чесноком, зирой и любовью."
  },
  {
    id: "m_i3",
    day: "День 2. Завтрак",
    dishName: "Похмельная овсянка 'Встань и иди'",
    description: "Густая каша со сгущенным молоком Рогачев, сухофруктами и крепким костровым чаем с лимоном."
  },
  {
    id: "m_i4",
    day: "День 2. Обед",
    dishName: "Печёная Анархическая картошка",
    description: "Картошка запечённая прямо в углях костра, поедаемая с солью и шпротами."
  }
];

export const initialGroceryItems: GroceryItem[] = [
  { id: "g1", name: "Тушёнка свиная ГОСТ (высший сорт, жесть)", quantity: "24 банки", category: "Еда", isBought: true },
  { id: "g2", name: "Гречка Ядрица (мешки по 2кг)", quantity: "3 пачки", category: "Еда", isBought: false },
  { id: "g3", name: "Сгущённое молоко Рогачёв (собачка на принте)", quantity: "8 банок", category: "Еда", isBought: true },
  { id: "g4", name: "Ром золотой для Бунтаря (для дезинфекции души)", quantity: "3 бутылки", category: "Жидкая валюта", isBought: false },
  { id: "g5", name: "Макароны Рожки (группа А)", quantity: "5 кг", category: "Еда", isBought: false },
  { id: "g6", name: "Вода питьевая в канистрах (по 5л)", quantity: "12 канистр", category: "Еда", isBought: true },
  { id: "g7", name: "Капуста, лук, картошка, специи для плова", quantity: "15 кг веса", category: "Еда", isBought: false },
  { id: "g8", name: "Влажные салфетки, мешки для лесного мусора", quantity: "5 упаковок", category: "Расходники", isBought: true }
];

export const initialInventoryItems: InventoryItem[] = [
  { id: "inv1", name: "Казан чугунный походный (20 литров)", condition: "нормальное", responsibleName: "Юрец Мангальщик" },
  { id: "inv2", name: "Бензогенератор барахлящий (требует свечу)", condition: "пришло в негодность", responsibleName: "Андрюха Хорёк" },
  { id: "inv3", name: "Укупорный тент защитный 4x6м", condition: "нормальное", responsibleName: "Лёха Навигатор" },
  { id: "inv4", name: "Гитара походная шестиструнная (но без струны 'ми')", condition: "нормальное", responsibleName: "Серёга Три-Аккорда" },
  { id: "inv5", name: "Костровые треноги и цепи для котла", condition: "проёбано на слёте", responsibleName: "Андрюха Хорёк" },
  { id: "inv6", name: "Большой надувной матрас в палатку", condition: "утонало к херам", responsibleName: "Данчик Кипиш" },
  { id: "inv7", name: "Портативная Bluetooth колонка с музлом", condition: "пробухали нахер всё", responsibleName: "Саня Запевала" }
];

export const ORIENTEERING_SIGNS_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" style="background:#fef3c7; font-family:sans-serif;">
  <rect width="600" height="420" fill="#fffbeb" rx="16" stroke="#d97706" stroke-width="4"/>
  <rect x="0" y="0" width="600" height="55" fill="#d97706"/>
  <text x="300" y="35" fill="#ffffff" font-size="18" font-weight="900" text-anchor="middle">🧭 ЗНАКИ И СИМВОЛЫ СПОРТИВНОГО ОРИЕНТИРОВАНИЯ</text>
  
  <g transform="translate(30, 75)">
    <rect x="0" y="0" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <circle cx="35" cy="30" r="18" fill="none" stroke="#dc2626" stroke-width="4"/>
    <text x="35" y="35" fill="#dc2626" font-size="12" font-weight="bold" text-anchor="middle">КП 1</text>
    <text x="70" y="28" fill="#1e293b" font-size="13" font-weight="bold">Контрольный Пункт (КП)</text>
    <text x="70" y="45" fill="#64748b" font-size="11">Призма бел/красн + электронный чип</text>

    <rect x="290" y="0" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <rect x="305" y="12" width="36" height="36" fill="#bbf7d0" rx="4"/>
    <text x="355" y="28" fill="#1e293b" font-size="13" font-weight="bold">Проходимый сосновый лес</text>
    <text x="355" y="45" fill="#64748b" font-size="11">Зеленый цвет на топокарте</text>

    <rect x="0" y="75" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <line x1="15" y1="105" x2="55" y2="105" stroke="#000000" stroke-width="3" stroke-dasharray="6,4"/>
    <text x="70" y="103" fill="#1e293b" font-size="13" font-weight="bold">Лесная тропинка</text>
    <text x="70" y="120" fill="#64748b" font-size="11">Чёрная пунктирная линия</text>

    <rect x="290" y="75" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <path d="M 305 105 Q 323 85 341 105" fill="none" stroke="#92400e" stroke-width="3"/>
    <text x="355" y="103" fill="#1e293b" font-size="13" font-weight="bold">Овраг / Вымоина</text>
    <text x="355" y="120" fill="#64748b" font-size="11">Коричневый штрих рельефа</text>

    <rect x="0" y="150" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <circle cx="35" cy="180" r="10" fill="#0284c7"/>
    <text x="70" y="178" fill="#1e293b" font-size="13" font-weight="bold">Родник / Источник</text>
    <text x="70" y="195" fill="#64748b" font-size="11">Синий кружок (гидрография)</text>

    <rect x="290" y="150" width="250" height="60" fill="#ffffff" stroke="#f59e0b" stroke-width="2" rx="8"/>
    <rect x="305" y="162" width="36" height="36" fill="#fef08a" rx="4"/>
    <text x="355" y="178" fill="#1e293b" font-size="13" font-weight="bold">Открытая поляна</text>
    <text x="355" y="195" fill="#64748b" font-size="11">Жёлтый залитый контур</text>
  </g>

  <rect x="30" y="315" width="540" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="2" rx="8"/>
  <text x="40" y="338" fill="#78350F" font-size="12" font-weight="bold">📌 Памятка участникам ориентирования:</text>
  <text x="40" y="358" fill="#92400e" font-size="11">1. Карта выдается за 1 минуту до старта. Отметка КП — чипом на старте и финише.</text>
  <text x="40" y="375" fill="#92400e" font-size="11">2. Прохождение строго по порядку номеров (КП1 -> КП2 -> КП3 ... -> Финиш).</text>
</svg>
`)}`;

export const KNOTS_DIAGRAM_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" style="background:#f8fafc; font-family:sans-serif;">
  <rect width="600" height="420" fill="#f1f5f9" rx="16" stroke="#0284c7" stroke-width="4"/>
  <rect x="0" y="0" width="600" height="55" fill="#0284c7"/>
  <text x="300" y="35" fill="#ffffff" font-size="18" font-weight="900" text-anchor="middle">🪢 ТУРИСТИЧЕСКИЕ УЗЛЫ: СХЕМЫ И СПОСОБЫ ВЯЗКИ</text>

  <g transform="translate(25, 70)">
    <rect x="0" y="0" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="85" y="25" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">1. Узел «Восьмёрка»</text>
    <path d="M 40 95 C 40 55 130 55 130 95 C 130 125 40 125 40 85 C 40 55 130 55 130 65" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
    <text x="85" y="135" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Незатягивающаяся петля</text>

    <rect x="190" y="0" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="275" y="25" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">2. Узел «Булинь»</text>
    <circle cx="275" cy="70" r="22" fill="none" stroke="#2563eb" stroke-width="5"/>
    <path d="M 275 92 L 275 120 M 260 70 L 290 70" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
    <text x="275" y="135" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Король узлов (обвязка)</text>

    <rect x="380" y="0" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="465" y="25" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">3. Прямой узел</text>
    <path d="M 400 70 Q 430 50 465 70 T 530 70" fill="none" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
    <path d="M 400 85 Q 430 105 465 85 T 530 85" fill="none" stroke="#0284c7" stroke-width="6" stroke-linecap="round"/>
    <text x="465" y="135" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Связывание 2 веревок</text>

    <rect x="0" y="165" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="85" y="190" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">4. Схватывающий (Прусик)</text>
    <rect x="75" y="205" width="20" height="60" fill="#94a3b8" rx="3"/>
    <path d="M 45 220 L 125 220 M 45 235 L 125 235 M 45 250 L 125 250" stroke="#dc2626" stroke-width="4"/>
    <text x="85" y="295" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Самостраховка на перилах</text>

    <rect x="190" y="165" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="275" y="190" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">5. Ткацкий узел</text>
    <path d="M 210 235 C 240 210 270 260 310 235" fill="none" stroke="#16a34a" stroke-width="5"/>
    <path d="M 230 245 C 260 270 290 220 330 245" fill="none" stroke="#ca8a04" stroke-width="5"/>
    <text x="275" y="295" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Для скользких веревок</text>

    <rect x="380" y="165" width="170" height="150" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="10"/>
    <text x="465" y="190" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">6. Выбленочный (Стремя)</text>
    <circle cx="465" cy="235" r="20" fill="none" stroke="#64748b" stroke-width="8"/>
    <path d="M 445 235 Q 465 210 485 235" fill="none" stroke="#dc2626" stroke-width="5"/>
    <text x="465" y="295" fill="#475569" font-size="10" text-anchor="middle" font-weight="bold">Крепление к опорам</text>
  </g>
</svg>
`)}`;

export const CONTEST_SCHEDULE_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:#f0fdf4; font-family:sans-serif;">
  <rect width="600" height="400" fill="#f0fdf4" rx="16" stroke="#16a34a" stroke-width="4"/>
  <rect x="0" y="0" width="600" height="55" fill="#16a34a"/>
  <text x="300" y="35" fill="#ffffff" font-size="18" font-weight="900" text-anchor="middle">⏱️ ГРАФИК И РАСПИСАНИЕ ПРОВЕДЕНИЯ ЭТАПОВ</text>

  <g transform="translate(40, 80)">
    <rect x="0" y="0" width="520" height="60" fill="#ffffff" stroke="#22c55e" stroke-width="2" rx="8"/>
    <rect x="10" y="10" width="90" height="40" fill="#dcfce7" rx="6"/>
    <text x="55" y="35" fill="#15803d" font-size="14" font-weight="black" text-anchor="middle">14:00 - 14:30</text>
    <text x="115" y="28" fill="#1e293b" font-size="14" font-weight="bold">Этап 1: Построение, инструктаж и выдача карт</text>
    <text x="115" y="45" fill="#64748b" font-size="11">Главный судья: Лёха Навигатор. Главная поляна лагеря.</text>

    <rect x="0" y="75" width="520" height="60" fill="#ffffff" stroke="#22c55e" stroke-width="2" rx="8"/>
    <rect x="10" y="85" width="90" height="40" fill="#dcfce7" rx="6"/>
    <text x="55" y="110" fill="#15803d" font-size="14" font-weight="black" text-anchor="middle">14:30 - 16:30</text>
    <text x="115" y="103" fill="#1e293b" font-size="14" font-weight="bold">Этап 2: Массовый забег по КП и полоса препятствий</text>
    <text x="115" y="120" fill="#64748b" font-size="11">Старт участников с интервалом в 2 минуты. Прохождение 8 КП.</text>

    <rect x="0" y="150" width="520" height="60" fill="#ffffff" stroke="#22c55e" stroke-width="2" rx="8"/>
    <rect x="10" y="160" width="90" height="40" fill="#dcfce7" rx="6"/>
    <text x="55" y="185" fill="#15803d" font-size="14" font-weight="black" text-anchor="middle">16:30 - 17:30</text>
    <text x="115" y="178" fill="#1e293b" font-size="14" font-weight="bold">Этап 3: Финишная сдача электронных чипов и узлы</text>
    <text x="115" y="195" fill="#64748b" font-size="11">Проверка правильности считывания и доп. штрафные секунды.</text>

    <rect x="0" y="225" width="520" height="60" fill="#ffffff" stroke="#22c55e" stroke-width="2" rx="8"/>
    <rect x="10" y="235" width="90" height="40" fill="#fe2c55" rx="6"/>
    <text x="55" y="260" fill="#ffffff" font-size="14" font-weight="black" text-anchor="middle">18:00</text>
    <text x="115" y="253" fill="#1e293b" font-size="14" font-weight="bold">Награждение победителей и торжественное вручение медалей</text>
    <text x="115" y="270" fill="#64748b" font-size="11">Вручение Главного Кубка Негодяев 🏆</text>
  </g>
</svg>
`)}`;

export const initialContests: Contest[] = [
  {
    id: "c1",
    title: "Спортивное ориентирование и знаки",
    captainId: "3",
    captainName: "Лёха Навигатор",
    teamMemberIds: ["3", "1", "2"],
    place: "2-е место",
    description: "Прохождение лесного маршрута по спортивной карте с нахождением 8 контрольных пунктов (КП). Отметка производится электронными чипами. Засчитывается наименьшее время и точность.",
    schedule: "Суббота, 14:00 - Регистрация и выдача карт; 14:30 - Старт участников по очереди каждые 2 мин; 17:00 - Финиш и подсчет результатов.",
    imageUrl: ORIENTEERING_SIGNS_SVG,
    attachments: [
      {
        id: "att_1_1",
        title: "Знаки и символы ориентирования",
        type: "orienteering",
        url: ORIENTEERING_SIGNS_SVG
      },
      {
        id: "att_1_2",
        title: "График проведения ориент-забега",
        type: "schedule",
        url: CONTEST_SCHEDULE_SVG
      }
    ]
  },
  {
    id: "c2",
    title: "Туристические узлы и техника туризма",
    captainId: "8",
    captainName: "Данчик Кипиш",
    teamMemberIds: ["8", "3", "1"],
    place: "1-е место",
    description: "Соревнование по правильной и скоростной вязке 6 ключевых туристических узлов (Восьмёрка, Булинь, Прямой, Прусик, Ткацкий, Выбленочный) и натягиванию навесной переправы.",
    schedule: "Суббота, 17:30 - Проверка личной обвязки и карабинов; 18:00 - Скоростная вязка узлов 'вслепую' и под счет.",
    imageUrl: KNOTS_DIAGRAM_SVG,
    attachments: [
      {
        id: "att_2_1",
        title: "Способы и схемы вязки узлов",
        type: "knots",
        url: KNOTS_DIAGRAM_SVG
      },
      {
        id: "att_2_2",
        title: "График соревнований по узлам",
        type: "schedule",
        url: CONTEST_SCHEDULE_SVG
      }
    ]
  },
  {
    id: "c3",
    title: "Музыкальный баттл у костра",
    captainId: "2",
    captainName: "Саня Запевала",
    teamMemberIds: ["2", "7"],
    place: "1-е место",
    description: "Баттл костровых песен под гитару. Конкурсанты исполняют походные хиты, авторские частушки и лирику. Оценивается громкость, артистизм и эмоциональный отклик команды.",
    schedule: "Суббота, 21:00 - Открытие музыкального ринга у большого ночного костра.",
    attachments: []
  },
  {
    id: "c4",
    title: "Кулинарный шедевр из тушняка",
    captainId: "6",
    captainName: "Юрец Мангальщик",
    teamMemberIds: ["6", "4", "5"],
    place: "Призёр",
    description: "Приготовление ресторанного блюда на костре из ограниченного набора продуктов: банка тушенки ГОСТ, крупа, овощи и костровые специи Юрца.",
    schedule: "Воскресенье, 13:00 - Начало готовки у мангальной зоны.",
    attachments: []
  }
];

