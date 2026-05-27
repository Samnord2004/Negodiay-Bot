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

export const initialContests: Contest[] = [
  { id: "c1", title: "Спортивное ориентирование", captainId: "3", captainName: "Лёха Навигатор", teamMemberIds: ["3", "1", "2"], place: "2-е место" },
  { id: "c2", title: "Музыкальный баттл у костра", captainId: "2", captainName: "Саня Запевала", teamMemberIds: ["2", "7"], place: "1-е место" },
  { id: "c3", title: "Кулинарный шедевр из тушняка", captainId: "6", captainName: "Юрец Мангальщик", teamMemberIds: ["6", "4", "5"], place: "" }
];

