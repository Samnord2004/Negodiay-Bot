import { 
  Participant, 
  Excursion, 
  ChatMessage, 
  BotConfig, 
  TaskItem, 
  MenuItem, 
  GroceryItem, 
  InventoryItem, 
  Contest,
  GalleryPhoto,
  TeamDocument,
  FundRecord,
  CreativityIdea
} from './types';

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
    gender: "male",
    role: "member",
    email: "horek@negodyai.club",
    phone: "+7 913 555-11-22",
    accountStatus: "active",
    biometricEnabled: true,
    password: "123"
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
    birthday: "1994-09-04", // TODAY!
    joinedYear: 2019,
    skippedYears: [],
    gender: "male",
    role: "member",
    email: "sanya@negodyai.club",
    phone: "+7 923 444-33-22",
    accountStatus: "active",
    biometricEnabled: true,
    password: "123"
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
    birthday: "1989-09-09", // Upcoming in 5 days!
    joinedYear: 2018,
    skippedYears: [2021],
    gender: "male",
    role: "admin",
    email: "admin@negodyai.club",
    phone: "+7 999 123-45-67",
    accountStatus: "active",
    biometricEnabled: true,
    password: "admin"
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
    gender: "female",
    role: "treasurer",
    email: "treasurer@negodyai.club",
    phone: "+7 905 777-88-99",
    accountStatus: "active",
    biometricEnabled: true,
    password: "123"
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
    gender: "male",
    role: "member",
    email: "forest@negodyai.club",
    phone: "+7 902 333-22-11",
    accountStatus: "active",
    biometricEnabled: false,
    password: "123"
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
    gender: "male",
    role: "member",
    email: "yura@negodyai.club",
    phone: "+7 912 666-55-44",
    accountStatus: "active",
    biometricEnabled: false,
    password: "123"
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
    gender: "male",
    role: "member",
    email: "guitar@negodyai.club",
    phone: "+7 918 888-99-00",
    accountStatus: "active",
    biometricEnabled: false,
    password: "123"
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
    gender: "male",
    role: "member",
    email: "dan@negodyai.club",
    phone: "+7 999 555-44-33",
    accountStatus: "active",
    biometricEnabled: false,
    password: "123"
  },
  {
    id: "9",
    name: "Колян Новобранец",
    nickname: "kolyan_new",
    psychotype: "Весельчак-балагур",
    avatar: "⛺",
    paidAmount: 0,
    totalCost: 8500,
    debtAmount: 8500,
    joined: false,
    birthday: "1998-12-05",
    joinedYear: 2026,
    skippedYears: [],
    gender: "male",
    role: "member",
    email: "kolyan@gmail.com",
    phone: "+7 950 111-22-33",
    accountStatus: "pending",
    biometricEnabled: true,
    password: "123"
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

// Sample SVG photo representations for initial gallery
export const PHOTO_CAMP_2026 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"><rect width="800" height="500" fill="%230f172a"/><circle cx="680" cy="100" r="40" fill="%23fef08a" opacity="0.8"/><polygon points="0,500 250,220 500,500" fill="%231e293b"/><polygon points="300,500 550,260 800,500" fill="%23334155"/><rect y="420" width="800" height="80" fill="%2314532d"/><polygon points="180,440 240,320 300,440" fill="%23ea580c"/><polygon points="210,440 240,350 270,440" fill="%23facc15"/><circle cx="500" cy="410" r="35" fill="%23e11d48"/><path d="M470,430 Q500,340 530,430 Z" fill="%23fbbf24"/><text x="40" y="70" fill="%23f8fafc" font-size="28" font-weight="900" font-family="sans-serif">СЛЁТ НЕГОДЯЕВ 2026</text><text x="40" y="105" fill="%23f59e0b" font-size="16" font-family="sans-serif">Таёжная поляна • Подготовка лагеря и костров</text></svg>`;

export const PHOTO_RAFT_2025 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"><rect width="800" height="500" fill="%230284c7"/><path d="M0,280 Q200,240 400,280 T800,280 L800,500 L0,500 Z" fill="%230369a1"/><polygon points="200,320 600,320 550,380 250,380" fill="%23ca8a04"/><circle cx="320" cy="270" r="22" fill="%23ea580c"/><circle cx="480" cy="270" r="22" fill="%23e11d48"/><circle cx="400" cy="260" r="24" fill="%2316a34a"/><line x1="280" y1="280" x2="240" y2="370" stroke="%23f8fafc" stroke-width="8"/><line x1="520" y1="280" x2="560" y2="370" stroke="%23f8fafc" stroke-width="8"/><text x="40" y="70" fill="%23f8fafc" font-size="28" font-weight="900" font-family="sans-serif">СПЛАВ И ПОХОД 2025</text><text x="40" y="105" fill="%23fed7aa" font-size="16" font-family="sans-serif">Речные пороги и командный рафтинг</text></svg>`;

export const PHOTO_BONFIRE_2024 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"><rect width="800" height="500" fill="%2318181b"/><circle cx="400" cy="350" r="180" fill="%23ea580c" opacity="0.3"/><path d="M350,420 Q400,200 450,420 Q400,340 350,420 Z" fill="%23f97316"/><path d="M375,420 Q400,260 425,420 Z" fill="%23fde047"/><rect x="300" y="415" width="200" height="30" rx="10" fill="%23713f12"/><circle cx="240" cy="380" r="25" fill="%23f43f5e"/><circle cx="560" cy="380" r="25" fill="%233b82f6"/><text x="40" y="70" fill="%23f8fafc" font-size="28" font-weight="900" font-family="sans-serif">НОЧНОЙ КОСТЁР 2024</text><text x="40" y="105" fill="%23f59e0b" font-size="16" font-family="sans-serif">Песни до утра под гитару и костровой чай</text></svg>`;

export const PHOTO_CARNIVAL_2023 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"><rect width="800" height="500" fill="%234c0519"/><rect y="380" width="800" height="120" fill="%231c1917"/><polygon points="250,220 300,140 350,220" fill="%23e11d48"/><circle cx="300" cy="270" r="50" fill="%23fbbf24"/><circle cx="500" cy="270" r="50" fill="%2338bdf8"/><polygon points="450,220 500,140 550,220" fill="%2310b981"/><text x="40" y="70" fill="%23f8fafc" font-size="28" font-weight="900" font-family="sans-serif">КОНКУРС КАРНАВАЛА 2023</text><text x="40" y="105" fill="%23fbcfe8" font-size="16" font-family="sans-serif">Пираты сибирской тайги • 1-е место команды</text></svg>`;

export const PHOTO_FIRST_RALLY_2022 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"><rect width="800" height="500" fill="%23064e3b"/><circle cx="400" cy="180" r="110" fill="%23fef08a" opacity="0.6"/><polygon points="100,500 200,240 300,500" fill="%23022c22"/><polygon points="300,500 400,220 500,500" fill="%23065f46"/><polygon points="500,500 600,260 700,500" fill="%23022c22"/><text x="40" y="70" fill="%23f8fafc" font-size="28" font-weight="900" font-family="sans-serif">ПЕРВЫЙ СЛЁТ В БОРУ 2022</text><text x="40" y="105" fill="%236ee7b7" font-size="16" font-family="sans-serif">Историческое основание лагеря на Синих Скалах</text></svg>`;

export const initialPhotos: GalleryPhoto[] = [
  {
    id: "photo_1",
    year: 2026,
    title: "Палаточный городок Негодяев 2026",
    description: "Разбивка лагеря на Большой поляне у реки. Установка штабной палатки и кострового очага.",
    imageUrl: PHOTO_CAMP_2026,
    uploadedBy: "Лёха Навигатор",
    uploadedAt: "2026-08-15",
    likes: 18,
    likedUserIds: ["1", "2", "3", "4"]
  },
  {
    id: "photo_2",
    year: 2025,
    title: "Командный сплав по речным перекатам",
    description: "Преодолели пороги 2-й категории сложности без переворотов. Все в восторге!",
    imageUrl: PHOTO_RAFT_2025,
    uploadedBy: "Андрюха Хорёк",
    uploadedAt: "2025-07-20",
    likes: 24,
    likedUserIds: ["1", "2", "5", "6", "7"]
  },
  {
    id: "photo_3",
    year: 2024,
    title: "Большой ночной костер и гитара",
    description: "Саня Запевала исполнил всю дискографию Короля и Шута. Душевная костровая атмосфера.",
    imageUrl: PHOTO_BONFIRE_2024,
    uploadedBy: "Саня Запевала",
    uploadedAt: "2024-06-28",
    likes: 31,
    likedUserIds: ["2", "3", "4", "7", "8"]
  },
  {
    id: "photo_4",
    year: 2023,
    title: "Карнавальные костюмы 'Пираты тайги'",
    description: "Взяли гран-при на слёте за лучшие образы и театрализованное представление лагеря.",
    imageUrl: PHOTO_CARNIVAL_2023,
    uploadedBy: "Иришка Булочка",
    uploadedAt: "2023-08-10",
    likes: 29,
    likedUserIds: ["1", "4", "6"]
  },
  {
    id: "photo_5",
    year: 2022,
    title: "Основание лагеря на Синих Скалах",
    description: "Первый большой командный выезд в сосновый бор. С этого началась история нашего братства.",
    imageUrl: PHOTO_FIRST_RALLY_2022,
    uploadedBy: "Михалыч Лесник",
    uploadedAt: "2022-07-05",
    likes: 42,
    likedUserIds: ["1", "2", "3", "4", "5", "6", "7", "8"]
  }
];

export const initialDocuments: TeamDocument[] = [
  // 1. Документы слёта
  {
    id: "doc_rally_1",
    category: "rally",
    title: "Положение о XXIII Традиционном турслёте команд",
    description: "Официальный регламент слёта: правила безопасности, условия прохождения этапов полосы препятствий, судейские штрафы и порядок начисления баллов.",
    fileType: "pdf",
    fileName: "Polozhenie_Slet_2026.pdf",
    uploadedBy: "Лёха Навигатор",
    uploadedAt: "2026-08-01",
    content: "ПОЛОЖЕНИЕ О ТУРСЛЁТЕ 2026:\n1. Общие положения: Слёт проводится на поляне 'Кедровая' с 12 по 14 августа.\n2. Участники обязаны соблюдать правила пожарной безопасности и экологический кодекс.\n3. Конкурсная программа включает: ориентирование, технику водного туризма, туристические узлы, карнавальное дефиле и конкурс походных поваров.\n4. Комендантский час: 02:00."
  },
  {
    id: "doc_rally_2",
    category: "rally",
    title: "Карта полигона и схема зонирования лагеря",
    description: "Топографическая схема размещения палаток команды, кухни, костровища, санитарной зоны и маршрутов экстренной эвакуации.",
    fileType: "image",
    fileName: "Karta_Poligona_Zony.png",
    uploadedBy: "Лёха Навигатор",
    uploadedAt: "2026-08-02",
    content: "СХЕМА ЛАГЕРЯ:\n- Сектор А: Штабная палатка и флагшток банды 'Негодяи'.\n- Сектор Б: Жилые палатки участников (расстояние между палатками не менее 1.5 м).\n- Сектор В: Костровая зона с навесом и столовой.\n- Сектор Г: Техническая зона, дрова, пилы, огнетушители."
  },
  {
    id: "doc_rally_3",
    category: "rally",
    title: "График судейских стартов и тайминг этапов",
    description: "Почасовое расписание всех стартов, сдачи походных блюд на дегустацию и выступления команд на сцене слёта.",
    fileType: "guide",
    fileName: "Raspisanie_Startov_2026.txt",
    uploadedBy: "Данчик Кипиш",
    uploadedAt: "2026-08-05",
    content: "ТАЙМИНГ СЛЁТА:\n- Пятница 18:00 — Заезд и обустройство лагеря.\n- Пятница 21:00 — Открытие слёта, жеребьёвка капитанов.\n- Суббота 10:00 — Полоса препятствий и ориентирование.\n- Суббота 14:00 — Конкурс вязки узлов.\n- Суббота 17:00 — Кулинарный баттл.\n- Суббота 20:30 — Карнавал и визитка.\n- Воскресенье 12:00 — Подведение итогов, награждение."
  },

  // 2. Уставные документы
  {
    id: "doc_stat_1",
    category: "statutory",
    title: "Устав туристического клуба «Негодяи»",
    description: "Главный закон команды: цели, принципы братства, порядок принятия решений советом команды и традиция взаимопомощи.",
    fileType: "doc",
    fileName: "Ustav_Klub_Negodyai.doc",
    uploadedBy: "Михалыч Лесник",
    uploadedAt: "2018-05-10",
    content: "УСТАВ ТУРИСТИЧЕСКОГО КЛУБА 'НЕГОДЯИ':\nСтатья 1. Клуб создан ради искренней дружбы, походной романтики, преодоления трудностей и веселья.\nСтатья 2. В лагере Негодяев все равны. Чужой труд уважается, костер поддерживается сообща.\nСтатья 3. Своих в лесу не бросают ни при каких обстоятельствах.\nСтатья 4. Главный девиз на вопрос 'Как гуляет негодяй?!' звучит громко и единогласно: 'АХУЕННО!'."
  },
  {
    id: "doc_stat_2",
    category: "statutory",
    title: "Кодекс чести Негодяя и правила лагеря",
    description: "Неписаные законы костра, сухой закон при дежурстве на кухне, правила бережного отношения к снаряжению и природе.",
    fileType: "doc",
    fileName: "Kodeks_Chesti_Negodyaya.pdf",
    uploadedBy: "Лёха Навигатор",
    uploadedAt: "2020-04-12",
    content: "КОДЕКС ЧЕСТИ НЕГОДЯЯ:\n1. Забыл ложку — выстругай щепку или заслужи право пользоваться поварёшкой.\n2. Мусор за собой убирается под ноль — тайга должна остаться чище, чем была.\n3. У костра запрещены ссоры и политические споры — только песни, юмор и тосты.\n4. Посуду за собой моет каждый сам, казан моет дежурный экипаж."
  },
  {
    id: "doc_stat_3",
    category: "statutory",
    title: "Положение о Негодяйском Фонде и Казначействе",
    description: "Регламент сбора ежемесячной абонентской платы 500 рублей, права и полномочия Казначея команды, целевое использование средств.",
    fileType: "pdf",
    fileName: "Polozhenie_O_Fonde_500r.pdf",
    uploadedBy: "Иришка Булочка",
    uploadedAt: "2024-01-10",
    content: "ПОЛОЖЕНИЕ О НЕГОДЯЙСКОМ ФОНДЕ:\n1. Размер взноса: Каждый зарегистрированный участник ежемесячно сдаёт 500 рублей в фонд.\n2. Назначение фонда: Ремонт и закупка общекомандного снаряжения (шатры, генератор, пилы, казан), флаги, форма и призы.\n3. Управление фондом: Фондом единолично распоряжается Казначей, назначаемый Администратором.\n4. Должники получают автоматические уведомления и публикуются в общем чате команды."
  },

  // 3. Помощь при сборах и подготовке к конкурсам
  {
    id: "doc_prep_1",
    category: "prep",
    title: "Полный чек-лист снаряжения: личное и групповое",
    description: "Исчерпывающий список: палатка, спальник по температуре, пенка, КЛМН, аптечка, фонарик, дождевик, сменная обувь и репелленты.",
    fileType: "guide",
    fileName: "Cheklist_Snaryazheniya_2026.pdf",
    uploadedBy: "Данчик Кипиш",
    uploadedAt: "2026-07-25",
    content: "ЧЕК-ЛИСТ СНАРЯЖЕНИЯ:\nЛИЧНОЕ:\n[ ] Рюкзак 70-90л с непромокаемым чехлом\n[ ] Спальник (комфорт +5°C)\n[ ] Коврик туристический (пенка / самонадувайка)\n[ ] КЛМН (Кружка, Ложка, Миска, Нож)\n[ ] Налобный фонарь с запасными батарейками\n[ ] Аптечка (пластырь, антисептик, обезбол, сорбенты)\n[ ] Мембранная куртка / дождевик\n[ ] Две пары треккинговых носков и обуви\nГРУППОВОЕ:\n[ ] Палатки на всех участников\n[ ] Казан чугунный 15л + тренога\n[ ] Топор Fiskars + двуручная пила\n[ ] Тент лагерный 4х6 м\n[ ] Генератор + гирлянда лагеря"
  },
  {
    id: "doc_prep_2",
    category: "prep",
    title: "Методичка по туристическим узлам с иллюстрациями",
    description: "Схемы завязывания узлов: Прямой, Ткацкий, Академический, Восьмёрка, Булинь, Стремя, Прусик и Схватывающий с описанием назначения.",
    fileType: "guide",
    fileName: "Metodichka_Uzly_Shemy.pdf",
    uploadedBy: "Данчик Кипиш",
    uploadedAt: "2026-08-01",
    content: "ТУРИСТИЧЕСКИЕ УЗЛЫ:\n1. ПРЯМОЙ / РИФОВЫЙ — для связывания веревок одинаковой толщины с обязательными контрольными узлами.\n2. БУЛИНЬ (Беседочный) — 'король узлов', незатягивающаяся петля для страховки и крепления веревки к опоре.\n3. ВОСЬМЕРКА — универсальная петля на конце веревки, не скользит и легко развязывается после нагрузки.\n4. ПРУСИК (Схватывающий) — перемещается рукой по основной веревке, но мгновенно затягивается при срыве."
  },
  {
    id: "doc_prep_3",
    category: "prep",
    title: "Справочник знаков спортивного ориентирования",
    description: "Международные символы карт IOF: формы рельефа, гидрография, проходимость леса, искусственные объекты и легенды КП.",
    fileType: "guide",
    fileName: "Znaki_Orientirovaniya_IOF.pdf",
    uploadedBy: "Лёха Навигатор",
    uploadedAt: "2026-08-03",
    content: "ЗНАКИ СПОРТИВНОГО ОРИЕНТИРОВАНИЯ:\n- Коричневый: Горизонтали, холмы, ямы, овраги.\n- Синий: Озера, реки, ручьи, болота.\n- Черный: Скалы, камни, тропы, дороги, постройки.\n- Желтый: Открытые поляны, луга.\n- Белый: Чистый легкопроходимый лес.\n- Зеленый: Заросли, густой подлесок (чем темнее, тем труднее бежать)."
  }
];

export const initialFundRecords: FundRecord[] = [
  // 2026 records for participants
  { id: "fund_1_1", participantId: "1", participantName: "Андрюха Хорёк", participantNickname: "hoorek", year: 2026, month: 1, amount: 500, isPaid: true, paidAt: "2026-01-12", note: "Перевод на Сбер" },
  { id: "fund_1_2", participantId: "1", participantName: "Андрюха Хорёк", participantNickname: "hoorek", year: 2026, month: 2, amount: 500, isPaid: true, paidAt: "2026-02-10", note: "Наличными на сборе" },
  { id: "fund_1_3", participantId: "1", participantName: "Андрюха Хорёк", participantNickname: "hoorek", year: 2026, month: 3, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_1_4", participantId: "1", participantName: "Андрюха Хорёк", participantNickname: "hoorek", year: 2026, month: 4, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_1_5", participantId: "1", participantName: "Андрюха Хорёк", participantNickname: "hoorek", year: 2026, month: 5, amount: 500, isPaid: false, note: "Долг" },

  { id: "fund_2_1", participantId: "2", participantName: "Саня Запевала", participantNickname: "singing_sanya", year: 2026, month: 1, amount: 500, isPaid: true, paidAt: "2026-01-05", note: "СБП Т-Банк" },
  { id: "fund_2_2", participantId: "2", participantName: "Саня Запевала", participantNickname: "singing_sanya", year: 2026, month: 2, amount: 500, isPaid: true, paidAt: "2026-02-05", note: "СБП Т-Банк" },
  { id: "fund_2_3", participantId: "2", participantName: "Саня Запевала", participantNickname: "singing_sanya", year: 2026, month: 3, amount: 500, isPaid: true, paidAt: "2026-03-05", note: "СБП Т-Банк" },
  { id: "fund_2_4", participantId: "2", participantName: "Саня Запевала", participantNickname: "singing_sanya", year: 2026, month: 4, amount: 500, isPaid: true, paidAt: "2026-04-05", note: "СБП Т-Банк" },
  { id: "fund_2_5", participantId: "2", participantName: "Саня Запевала", participantNickname: "singing_sanya", year: 2026, month: 5, amount: 500, isPaid: true, paidAt: "2026-05-05", note: "СБП Т-Банк" },

  { id: "fund_3_1", participantId: "3", participantName: "Лёха Навигатор", participantNickname: "navigator_alex", year: 2026, month: 1, amount: 500, isPaid: true, paidAt: "2026-01-01", note: "Годовой аванс" },
  { id: "fund_3_2", participantId: "3", participantName: "Лёха Навигатор", participantNickname: "navigator_alex", year: 2026, month: 2, amount: 500, isPaid: true, paidAt: "2026-01-01", note: "Годовой аванс" },
  { id: "fund_3_3", participantId: "3", participantName: "Лёха Навигатор", participantNickname: "navigator_alex", year: 2026, month: 3, amount: 500, isPaid: true, paidAt: "2026-01-01", note: "Годовой аванс" },
  { id: "fund_3_4", participantId: "3", participantName: "Лёха Навигатор", participantNickname: "navigator_alex", year: 2026, month: 4, amount: 500, isPaid: true, paidAt: "2026-01-01", note: "Годовой аванс" },
  { id: "fund_3_5", participantId: "3", participantName: "Лёха Навигатор", participantNickname: "navigator_alex", year: 2026, month: 5, amount: 500, isPaid: true, paidAt: "2026-01-01", note: "Годовой аванс" },

  { id: "fund_4_1", participantId: "4", participantName: "Иришка Булочка", participantNickname: "irishka_baker", year: 2026, month: 1, amount: 500, isPaid: true, paidAt: "2026-01-10", note: "Казначей оплатил" },
  { id: "fund_4_2", participantId: "4", participantName: "Иришка Булочка", participantNickname: "irishka_baker", year: 2026, month: 2, amount: 500, isPaid: true, paidAt: "2026-02-10", note: "Казначей оплатил" },
  { id: "fund_4_3", participantId: "4", participantName: "Иришка Булочка", participantNickname: "irishka_baker", year: 2026, month: 3, amount: 500, isPaid: true, paidAt: "2026-03-10", note: "Казначей оплатил" },
  { id: "fund_4_4", participantId: "4", participantName: "Иришка Булочка", participantNickname: "irishka_baker", year: 2026, month: 4, amount: 500, isPaid: true, paidAt: "2026-04-10", note: "Казначей оплатил" },
  { id: "fund_4_5", participantId: "4", participantName: "Иришка Булочка", participantNickname: "irishka_baker", year: 2026, month: 5, amount: 500, isPaid: true, paidAt: "2026-05-10", note: "Казначей оплатил" },

  { id: "fund_5_1", participantId: "5", participantName: "Михалыч Лесник", participantNickname: "forest_boss", year: 2026, month: 1, amount: 500, isPaid: true, paidAt: "2026-01-15", note: "Наличными" },
  { id: "fund_5_2", participantId: "5", participantName: "Михалыч Лесник", participantNickname: "forest_boss", year: 2026, month: 2, amount: 500, isPaid: true, paidAt: "2026-02-15", note: "Наличными" },
  { id: "fund_5_3", participantId: "5", participantName: "Михалыч Лесник", participantNickname: "forest_boss", year: 2026, month: 3, amount: 500, isPaid: true, paidAt: "2026-03-15", note: "Наличными" },
  { id: "fund_5_4", participantId: "5", participantName: "Михалыч Лесник", participantNickname: "forest_boss", year: 2026, month: 4, amount: 500, isPaid: true, paidAt: "2026-04-15", note: "Наличными" },
  { id: "fund_5_5", participantId: "5", participantName: "Михалыч Лесник", participantNickname: "forest_boss", year: 2026, month: 5, amount: 500, isPaid: false, note: "Долг" },

  { id: "fund_8_1", participantId: "8", participantName: "Данчик Кипиш", participantNickname: "dan_survivor", year: 2026, month: 1, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_8_2", participantId: "8", participantName: "Данчик Кипиш", participantNickname: "dan_survivor", year: 2026, month: 2, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_8_3", participantId: "8", participantName: "Данчик Кипиш", participantNickname: "dan_survivor", year: 2026, month: 3, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_8_4", participantId: "8", participantName: "Данчик Кипиш", participantNickname: "dan_survivor", year: 2026, month: 4, amount: 500, isPaid: false, note: "Долг" },
  { id: "fund_8_5", participantId: "8", participantName: "Данчик Кипиш", participantNickname: "dan_survivor", year: 2026, month: 5, amount: 500, isPaid: false, note: "Долг" }
];

export const initialCreativityIdeas: CreativityIdea[] = [
  {
    id: "idea_1",
    category: "camp_design",
    title: "Входные ворота 'Форпост Негодяев' со смотровой вышкой",
    description: "Собрать массивную входную арку из сухих бревен с выжженным логотипом команды, резными черепами и смотровой площадкой для дежурного с сигнальным горном.",
    authorId: "3",
    authorName: "Лёха Навигатор",
    materialsBudget: "Бревна сухостоя, джутовая веревка 50м, брезент, светодиодная лента на аккумуляторе 12В. Бюджет: ~3 500 ₽",
    status: "approved",
    votes: 14,
    votedUserIds: ["1", "2", "3", "4", "5", "6"],
    comments: [
      { id: "c_1", authorName: "Михалыч Лесник", text: "Одобряю, бензопилу и тросы я возьму. Главное не рубить живые деревья!", createdAt: "2026-08-10 14:20" },
      { id: "c_2", authorName: "Андрюха Хорёк", text: "Сделаем подсветку красными диодами, ночью будет выглядеть эпично!", createdAt: "2026-08-10 15:05" }
    ],
    createdAt: "2026-08-10"
  },
  {
    id: "idea_2",
    category: "carnival_costumes",
    title: "Костюмы 'Лесные шаманы и таёжные духи'",
    description: "Образы для конкурса карнавальности: накидки из мешковины, оленьи и сосновые рога, боевая раскраска глиной и углём, бубны из бересты и посохи с колокольчиками.",
    authorId: "4",
    authorName: "Иришка Булочка",
    materialsBudget: "Мешковина 20м, перья, аквагрим походный, колокольчики, джут. Бюджет: ~2 200 ₽",
    status: "in_progress",
    votes: 19,
    votedUserIds: ["1", "2", "4", "7", "8"],
    comments: [
      { id: "c_3", authorName: "Саня Запевала", text: "Я напишу шаманский ритуальный гимн с горловым пением под варган!", createdAt: "2026-08-12 18:40" }
    ],
    createdAt: "2026-08-12"
  },
  {
    id: "idea_3",
    category: "camp_contests",
    title: "Ночной турнир по распилу бревен двуручной пилой 'Дружба'",
    description: "Внутрилагерный чемпионат в темноте при свете факелов: пары соревнуются на скорость распила соснового бревна 30 см на аккуратные чурбаки. Победителям — фирменная кружка.",
    authorId: "1",
    authorName: "Андрюха Хорёк",
    materialsBudget: "2 пилы 'Дружба', напильники для разводки зубьев, чурбаки, призовой фонд. Бюджет: ~1 000 ₽",
    status: "discussing",
    votes: 11,
    votedUserIds: ["1", "3", "5", "8"],
    comments: [
      { id: "c_4", authorName: "Данчик Кипиш", text: "Только в очках и кожаных перчатках, безопасность превыше всего!", createdAt: "2026-08-14 11:15" }
    ],
    createdAt: "2026-08-14"
  },
  {
    id: "idea_4",
    category: "posm_merch",
    title: "Виниловые влагостойкие стикерпаки и эмалированные пины",
    description: "Выпуск набора походных стикеров для котелков, термосов и машин: фразы 'Как гуляет негодяй?! — АХУЕННО!', 'Запись дубля', 'Пизда на глаза' + металлический значок с лисом/хорьком.",
    authorId: "2",
    authorName: "Саня Запевала",
    materialsBudget: "Типография: 100 стикерпаков + 50 значков. Бюджет: ~6 500 ₽ из Негодяйского Фонда",
    status: "approved",
    votes: 23,
    votedUserIds: ["1", "2", "3", "4", "5", "6", "7", "8"],
    comments: [
      { id: "c_5", authorName: "Иришка Булочка", text: "Казначейство одобрило бюджет! Макеты уже в печати!", createdAt: "2026-08-16 09:30" }
    ],
    createdAt: "2026-08-15"
  },
  {
    id: "idea_5",
    category: "team_clothing",
    title: "Худи оверсайз из плотного футера с начесом 'Банда Негодяев'",
    description: "Тёплые черные и оливковые худи с глубоким капюшоном от ветра. Спереди минималистичный шеврон, на спине большая шелкография с картой тайги и датой основания 2018.",
    authorId: "6",
    authorName: "Юрец Мангальщик",
    materialsBudget: "Пошив партии 25 шт с термотрансферным нанесением. Стоимость ~2 800 ₽/шт под заказ участников.",
    status: "in_progress",
    votes: 17,
    votedUserIds: ["2", "3", "4", "6", "7"],
    comments: [
      { id: "c_6", authorName: "Лёха Навигатор", text: "Размерную сетку закинул в документы, пишите свои размеры в чат!", createdAt: "2026-08-17 19:00" }
    ],
    createdAt: "2026-08-17"
  }
];

export const INITIAL_STORIES: any[] = [
  {
    id: "story_1",
    category: "logo",
    categoryTitle: "История создания логотипа",
    title: "Как родился символ Негодяев: пламя костра, походные топоры и череп в бандане",
    year: 2018,
    authorName: "Саня Запевала & Михалыч",
    content: `В июле 2018 года на третью ночь первого большого слёта мы сидели у догорающего костра на берегу реки. Была поставлена задача: нам нужен свой герб, который никто не спутает с академическими турклубами или скучными спортсекциями.\n\nПервый набросок был сделан углем прямо на березовом полене! Основой стал дерзкий символ свободы: череп в походной ветрозащитной бандане, два скрещенных колуна Fiskars, компас, указывающий строго на лесную глушь, и костровой язык пламени.\n\nЧерно-красно-золотая гамма символизирует костровую сажу, жар углей и неиссякаемый задор команды. Позже макет оцифровали, вышили на шевронах, нанесли на клубный флаг и выгравировали на наградных топорах лучших участников слётов.`,
    photos: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [
      "https://www.youtube.com/embed/fEErySYqKmI"
    ],
    createdAt: "2026-05-10"
  },
  {
    id: "story_2",
    category: "origin",
    categoryTitle: "История образования команды",
    title: "Первый слёт 2018 года: как мы стали бандой единомышленников",
    year: 2018,
    authorName: "Основатели команды",
    content: `Всё началось со спонтанного побега из душного города в мае 2018 года. Шестеро друзей погрузили в старый внедорожник две брезентовые палатки, закопчённый армейский казан и гитару. Место выбрали наугад по спутниковой карте — глухой мыс у излучины быстрой лесной реки.\n\nВ ту ночь зарядил проливной штормовой дождь. В лагерях соседних тургрупп началась паника, а мы натянули тент между вековыми соснами, растопили жаркий костер березовым сушняком, сварили легендарный суп из тушенки с черемшой и пели песни под гитару до рассвета.\n\nКогда утром солнце пробилось сквозь сосны, соседние туристы с улыбкой сказали: «Ну вы и негодяи, в такой потоп так весело куражиться!». Слово прижилось мгновенно. Так родилась туристическая команда «Негодяи» — сообщество людей, готовых пройти сквозь любой ливень, ветер и бурелом с песней и поддержкой надежного плеча.`,
    photos: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [
      "https://www.youtube.com/embed/2OEL4P1Rz04"
    ],
    createdAt: "2026-05-15"
  },
  {
    id: "story_3",
    category: "sports",
    categoryTitle: "Спортивные достижения команды",
    title: "Триумфы на лесных трассах: кубки, перетягивание каната и полоса препятствий",
    year: 2024,
    authorName: "Лёха Навигатор",
    content: `«Негодяи» — это не просто душевные посиделки у огня, но и железная спортивная выправка! С 2019 года команда участвует в межклубных туристических слетах и спартакиадах.\n\nНаши главные командные рекорды:\n• 1-е место в ночном спортивном ориентировании по контрольным пунктам (2022, 2024)\n• Абсолютные чемпионы по перетягиванию каната через грязевой брод (три года подряд без единого поражения!)\n• Скоростная сборка байдарки «Таймень-3» за 8 минут 40 секунд\n• Лучшее прохождение полосы препятствий «Тропа спецназа» (переправа по натянутому тросу через каньон, преодоление гати, транспортировка условно пострадавшего)\n\nГлавный кубок слёта 2024 года с гордостью хранится в нашем базовом лагере!`,
    photos: [
      "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [],
    createdAt: "2026-06-01"
  },
  {
    id: "story_4",
    category: "heroes",
    categoryTitle: "Особо отличившиеся негодяи",
    title: "Зал славы команды: герои костра, штурманы и хранители традиций",
    year: 2025,
    authorName: "Совет Негодяев",
    content: `Каждый Негодяй уникален, но подвиги этих соратников навсегда вписаны золотыми буквами в историю братства:\n\n🔥 Саня Запевала — абсолютный рекордсмен: 9 часов непрерывной игры на гитаре у ночного костра. Знает наизусть больше 300 походных и рок-баллад, не охрип ни разу.\n\n🍲 Юрец Мангальщик — повар высшего разряда. Во время урагана на озере удержал шатер плечом и одновременно приготовил 45 порций плова в 30-литровом казане.\n\n🧭 Лёха Навигатор — вывел команду из заболоченной глуши при севших фонарях и разряженных GPS-навигаторах, ориентируясь по рельефу берега и полярной звезде.\n\n🌲 Михалыч Лесник — за 20 минут в темноте заготовил сухой валежник на всю ночь для 6 палаток, используя один только колун и ручную цепную пилу.\n\n💼 Иришка Булочка — бессменный и неподкупный казначей команды. Сохранила общую казну сборов, разрулила все сметы и не потеряла ни единого рубля даже при перевороте байдарки!`,
    photos: [
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [],
    createdAt: "2026-06-10"
  },
  {
    id: "story_5",
    category: "traditions",
    categoryTitle: "Традиции и ритуалы Негодяев",
    title: "Посвящение в команду, костровой круг и коронные тосты",
    year: 2023,
    authorName: "Команда",
    content: `Наши традиции священны и передаются каждому новичку:\n\n1. «Посвящение Негодяя» — новичок, прошедший свой первый 15-километровый маршрут или ночевку в палатке, выпивает из кружки с родниковой водой каплю походного отвара, целует лезвие лагерного топора и произносит клятву верности костру и друзьям.\n\n2. Коронный клич: на вопрос «Как гуляет негодяй?!» весь лагерь хором отвечает громогласным: «АХУЕННО!», разносящимся эхом по всей реке.\n\n3. Костровой круг: в полночь гитары затихают на 10 минут, каждый передает по кругу медную кружку и говорит одно слово благодарности уходящему дню и верным соратникам.\n\n4. Закон тайги: в лагере Негодяев никто не бросает товарища, за костром нет чужих, а посуда моется сразу без напоминаний!`,
    photos: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [],
    createdAt: "2026-06-15"
  }
];

