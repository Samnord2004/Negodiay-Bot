import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  initDb,
  getParticipants,
  saveParticipants,
  addOrUpdateParticipant,
  approveParticipant,
  rejectParticipant,
  updateParticipantRole,
  updateParticipantPassword,
  updateParticipantBiometrics,
  registerNewParticipant,
  getExcursions,
  saveExcursions,
  getTasks,
  saveTasks,
  getMenuItems,
  saveMenuItems,
  getGroceryItems,
  saveGroceryItems,
  getInventoryItems,
  saveInventoryItems,
  getBotConfig,
  saveBotConfig,
  getContests,
  saveContests,
  getMessages,
  addMessage,
  saveMessages,
  getAdminPassword,
  saveAdminPassword,
  getPhotos,
  addPhoto,
  deletePhoto,
  togglePhotoLike,
  getTeamDocuments,
  addTeamDocument,
  deleteTeamDocument,
  getFundRecords,
  saveFundRecords,
  updateFundRecord,
  getCreativityIdeas,
  addCreativityIdea,
  updateCreativityIdea,
  toggleIdeaVote,
  addIdeaComment,
  getStories,
  addStory,
  updateStory,
  deleteStory,
  saveStories
} from "./db";
import { ORIENTEERING_SIGNS_SVG, KNOTS_DIAGRAM_SVG, CONTEST_SCHEDULE_SVG } from "./src/mockData";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// High body limits to allow lossless photo archives without file size limits as requested
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Lazy-initialize Gemini SDK to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Shared, robust bot response generator supporting both Web client and active Telegram Bot
async function generateBotResponseInternal(body: any): Promise<any> {
  const {
    message,
    senderName,
    senderNickname = senderName,
    senderPsychotype = "Весельчак-балагур",
    chatHistory = [],
    swearingLevel = "medium",
    excursions = [],
    debts = [],
    tasks = [],
    menuItems = [],
    groceryItems = [],
    inventoryItems = [],
    participants = [],
    contests = getContests()
  } = body;

  const birthdayContext = (participants || []).map((p: any) => 
    `- ${p.name} (@${p.nickname}): ДР ${p.birthday || "не указан"}`
  ).join("\n") || "Нет данных о днях рождения.";

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const todayBirthdays = (participants || []).filter((p: any) => {
    if (!p.birthday) return false;
    const parts = p.birthday.split('-');
    if (parts.length < 2) return false;
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return m === currentMonth && d === currentDay;
  });

  const todayBirthdaysMention = todayBirthdays.length > 0 
    ? `ВНИМАНИЕ! Сегодня ДЕНЬ РОЖДЕНИЯ (ДР) у следующих участников: ${todayBirthdays.map((p: any) => `${p.name} (@${p.nickname})`).join(", ")}!!! Обязательно удели этому внимание и напиши эпичное, супер-веселое поздравление, если они написали или тебя попросили поздравить!`
    : "Сегодня ни у кого нет дня рождения.";

  // Trim and strip the addressing prefix (e.g., "Бот, " or "Бот:") to analyze the actual core query
  let cleanMessage = message || "";
  const botPrefixRegex = /^(бот)\b[,:\s]*/i;
  if (botPrefixRegex.test(cleanMessage)) {
    cleanMessage = cleanMessage.replace(botPrefixRegex, "").trim();
  }

  // Fast checks for specific requested expressions and media attachments
  const msgLower = cleanMessage.toLowerCase();

  // 1. "Как гуляет негодяй?"
  if (msgLower.includes("как гуляет негодяй") || msgLower.includes("как гуляет") || msgLower.includes("как отдыхает негодяй") || msgLower.includes("как тусит негодяй")) {
    let answerText = "🔥 Как гуляет негодяй?! — АХУЕННО!";
    if (swearingLevel === "low") {
      answerText = "🔥 Как гуляет негодяй?! — АФИГЕННО!";
    }
    return {
      text: answerText,
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Главный фирменный девиз Негодяев — емко и без лишней болтовни!",
      adapterStyleUsed: "Фирменный Негодяйский Клич"
    };
  }

  // 2. "Пизда на глаза"
  if (msgLower.includes("пизда на глаза") || (msgLower.includes("глаза") && msgLower.includes("пизда"))) {
    let answerText = "👀 ПИЗДА НА ГЛАЗА! 🤯 Удивление так удивление! Фирменный негодяйский ответ на все шоковые вопросы и крайнее изумление!";
    if (swearingLevel === "low") {
      answerText = "👀 Глаза на лоб вылезли! 🤯 Вот это удивление так удивление! Фирменная реакция на крайнее изумление!";
    }
    return {
      text: answerText,
      detectedPsychotype: "Алко-турист",
      detectedPsychotypeExplanation: "Использовал фирменную реакцию на крайнее удивление 'Пизда на глаза'.",
      adapterStyleUsed: "Шоковая реакция Негодяев"
    };
  }

  // 3. "Записьдень"
  if (msgLower.includes("записьдень") || msgLower.includes("запись день") || msgLower.includes("запиздень")) {
    let answerText = "📝 Записьдень! (от слова Запиздень!) 🤬 Слишком много пиздишь, брат! Хватит языком чесать и заливать сказки, марш казан мыть!";
    if (swearingLevel === "low") {
      answerText = "📝 Записьдень! (от слова Запиздень!) 🛑 Слишком много пустословишь! Хватит языком чесать, иди за дело берись!";
    }
    return {
      text: answerText,
      detectedPsychotype: "Душнила-контролёр",
      detectedPsychotypeExplanation: "Зафиксирован 'Запиздень' — кто-то в чате слишком много пиздит.",
      adapterStyleUsed: "Затыкание балабола"
    };
  }

  // 4. "Запись дубля"
  if (msgLower.includes("запись дубля") || msgLower.includes("запись дубль") || msgLower.includes("за пизду бля")) {
    let answerText = "🎬 Запись дубля! — ЗА ПИЗДУ БЛЯ! 🥂🍻 Фирменный негодяйский тост! Наливай полнее, осушаем до дна!";
    if (swearingLevel === "low") {
      answerText = "🎬 Запись дубля! — ЗА ПОХОД И ЗА ДРУЗЕЙ! 🥂🍻 Фирменный негодяйский тост! Поднимаем кружки и пьем до дна!";
    }
    return {
      text: answerText,
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Произнес культовый негодяйский тост 'Запись дубля' (За пизду бля)!",
      adapterStyleUsed: "Фирменный костровой тост"
    };
  }

  // 5. "Кто с Негодяем дрался..."
  if (msgLower.includes("кто с негодяем дрался") || msgLower.includes("негодяем дрался") || msgLower.includes("кто дрался")) {
    let answerText = "🌲👊 Кто с Негодяем дрался — тот в крапиве обосрался! С нашей командой шутки плохи, порвём за своих!";
    if (swearingLevel === "low") {
      answerText = "🌲👊 Кто с Негодяем дрался — тот без штанов остался! С нашей командой шутки плохи, победа за нами!";
    }
    return {
      text: answerText,
      detectedPsychotype: "Бунтарь-анархист",
      detectedPsychotypeExplanation: "Фирменная Негодяйская боевая поговорка!",
      adapterStyleUsed: "Боевой клич Негодяев"
    };
  }

  // 6. "Давай Негодяй"
  if (msgLower.includes("давай негодяй") || msgLower.includes("давай, негодяй")) {
    let answerText = "🔥 Давай Негодяй — жги, гуляй, наливай и не унывай! Вперёд в тайгу, навстречу костровому угару!";
    return {
      text: answerText,
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Задорный командный боевой заряд 'Давай Негодяй'!",
      adapterStyleUsed: "Командный боевой клич"
    };
  }

  // Check for attachments query
  const isKnotsQuery = msgLower.includes("узел") || msgLower.includes("узл") || msgLower.includes("вязать") || msgLower.includes("прусик") || msgLower.includes("восьмерк");
  const isOrientQuery = msgLower.includes("ориентирован") || msgLower.includes("знаки") || msgLower.includes("карты") || msgLower.includes("кп");
  const isScheduleQuery = msgLower.includes("график") || msgLower.includes("расписан") || msgLower.includes("этапы") || msgLower.includes("время соревнований");
  const isContestsGeneralQuery = msgLower.includes("конкурс") || msgLower.includes("соревнован") || msgLower.includes("турнир");

  const ai = getGeminiClient();

  // If Gemini API is not configured, fall back to our high-fidelity, hilarious local engine
  if (!ai) {
    console.warn("[AIS Build Core] GEMINI_API_KEY is not set. Running mock engine fallback.");
    const mockResult = generateMockNegodyaiResponse(
      cleanMessage,
      senderName,
      senderPsychotype,
      swearingLevel,
      excursions,
      debts,
      tasks,
      menuItems,
      groceryItems,
      inventoryItems,
      contests,
      participants
    );
    return {
      ...mockResult,
      isMocked: true,
      warning: "Работает в режиме симуляции (ключ GEMINI_API_KEY не задан)."
    };
  }

  // Build high-context reference tables for the AI
  const excursionsContext = excursions.map((e: any) => 
    `- Тур/Поход: "${e.title}" | Дата: ${e.date} | Место: ${e.location} | Цена с носа: ${e.costPerPerson} руб. | Статус: ${e.isActive ? "Активен" : "Архив"}`
  ).join("\n") || "Нет планируемых туров, сплавов или походов.";

  const debtsContext = debts.map((d: any) => 
    `- ${d.name} (@${d.nickname}): Сдано ${d.paidAmount} руб. из ${d.totalCost} руб. | Долг: ${d.debtAmount} руб.`
  ).join("\n") || "Все сборы закрыты, должников нет.";

  const tasksContext = tasks.map((t: any) =>
    `- Задача: "${t.title}" | Ответственный: ${t.assigneeName} (@${t.assigneeNickname || ''}) | Срок: ${t.deadline} | Статус: ${t.isCompleted ? 'ВЫПОЛНЕНО ✓' : 'НЕ ВЫПОЛНЕНО ✗'}`
  ).join("\n") || "Нет текущих задач команды.";

  const menuContext = menuItems.map((m: any) =>
    `- Блюдо: "${m.dishName}" на ${m.day} | Описание: ${m.description || 'нет'}`
  ).join("\n") || "Походное костровое меню пока пустует.";

  const groceryContext = groceryItems.map((g: any) =>
    `- Продукт: "${g.name}" (${g.quantity}) | Категория: ${g.category} | Статус: ${g.isBought ? 'КУПЛЕНО ✓' : 'НАДО КУПИТЬ ✗'}`
  ).join("\n") || "Список продуктов и закупок пуст.";

  const inventoryContext = inventoryItems.map((i: any) =>
    `- Имущество: "${i.name}" | Состояние: ${i.condition.toUpperCase()} | Хранитель/Ответственный: ${i.responsibleName}`
  ).join("\n") || "Нет зарегистрированного имущества команды.";

  const recentHistoryText = chatHistory.slice(-5).map((m: any) => 
    `[${m.senderName} ("@${m.senderNickname}")]: ${m.text}`
  ).join("\n") || "Чат пуст.";

  const systemPrompt = `
Ты — ИИ-бот по имени "Главный Негодяй" (Максимка) в групповом чате брутальной, но очень веселой и дружной туристической команды "Негодяи". Эта команда обожает подшучивать над всеми, готовить плов, ходить по рекам, терять сапоги и сосиски.

Твоя цель — отвечать собеседнику уморительно, задорно, держать дух похода и обязательно использовать особенности из предоставленной конфигурации.

=== УРОВЕНЬ МАТЕРШИННЫХ СЛОВ (swearingLevel): "${swearingLevel}" ===
Строго соблюдай этот уровень для ответа:
- "low": Абсолютно без грубого мата. Используй шутливые, дерзкие и живые походные сленговые словечки: "тушканчики", "хрен вам", "засранцы", "фигня", "косячники", "ёлки-палки". Говори задорно и шумно!
- "medium": Разрешено умеренное, сочное использование классического юмористического мата ("бля", "пиздец", "ёптить", "заебись", "нахуй") как междометий для выражения сильных туристических чувств. Не оскорбляй собеседника лично, матерись исключительно по-дружески, выражая восторг, удивление или походную суровость!
- "high": Полный походный хардкор! Используй сочный, многоэтажный, но исключительно дружеский и уморительный русский мат, фольклорные связки и крутые походные ругательства ("какого хуя", "ёбаный карась", "пиздец котенку", "заебали в край"). Сделай это шедевром народного творчества, над которым поржёт вся команда! Но не скатывайся в унылое быдло — будь харизматичным Негодяем у костра.

=== ТВОЯ ПАМЯТЬ О ТУРАХ, СПЛАВАХ И ПОХОДАХ ===
Предстоящая программа туров, сплавов и организованных походов нашей команды:
${excursionsContext}

Ведомость оплаты и долгов команды (долг = общая цена - сколько сдали):
${debtsContext}

=== ПОХОДНЫЕ ЗАДАЧИ И ОТВЕТСТВЕННЫЕ ЛИЦА ===
${tasksContext}

=== МЕНЮ СЛЁТА И ПРОДУКТЫ ===
Меню блюд:
${menuContext}

Продукты и закупки:
${groceryContext}

=== ИНВЕНТАРИЗАЦИЯ И ОБЩЕЕ ИМУЩЕСТВО (с отслеживанием состояния) ===
${inventoryContext}

=== ДНИ РОЖДЕНИЯ НАШЕЙ КОМАНДЫ ===
${birthdayContext}
${todayBirthdaysMention}

=== ФИРМЕННЫЕ КРЫЛАТЫЕ ВЫРАЖЕНИЯ И ДЕВИЗЫ КОМАНДЫ НЕГОДЯЕВ (СТРОГО СОБЛЮДАЙ!) ===
1. Если спрашивают "Как гуляет негодяй?" (или вариации этого вопроса) — твой ответ СТРОГО И ЕДИНСТВЕННО: "Ахуенно!" (БЕЗ ВСЯКИХ КОММЕНТАРИЕВ, СЛОВ ИЛИ СМАЙЛОВ ПОСЛЕ СЛОВА "Ахуенно!").
2. "Пизда на глаза" — фирменный ответ на многие вопросы или сильное удивление.
3. "Записьдень" (от слова "запиздень") — использовать когда кто-то слишком много пиздит или занудствует.
4. "Запись дубля" — фирменный тост: "За пизду бля!". Отвечай "За пизду бля!".
5. "Кто с Негодяем дрался..." — отвечай крылатой фразой: "Кто с Негодяем дрался — тот в крапиве обосрался!".
6. "Давай Негодяй" — отвечай бодро: "Давай Негодяй — жги, гуляй, наливай и не унывай!".

=== ИНСТРУКЦИИ ПО ТВОЕМУ ОТВЕТУ (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ!) ===
1. ОТВЕЧАЙ СТРОГО ТОМУ, КТО ЗАДАЛ ВОПРОС! В самом первом предложении твоего ответа ("text") ты обязан ЛИЧНО в дружеской, походной или подкольной форме обратиться к собеседнику ${senderName} (или по его никнейму @${senderNickname}). Например: "Слышь, ${senderName}, по поводу...", "Эй, @${senderNickname}, слушай сюда...", "${senderName}, косячник походный, держи расклад...".
2. ТЫ ОБЯЗАН ОТВЕЧАТЬ ПО СУЩЕСТВУ НА ВОПРОСЫ ПО СЛЕДУЮЩИМ ТЕМАМ ИЗ КОНТЕКСТА:
   - Если спрашивают про деньги/долги/оплаты: зачитай список участников ведомости долгов ${debtsContext}, назови должников халявщиками или забывахами и назови их точные долги в рублях.
   - Если спрашивают про походные задачи/дела/дежурства: перечисли невыполненные задачи из списка ${tasksContext}, назови дедлайны и ответственных.
   - Если спрашивают про меню/еду/продукты/тушняк: зачитай костровое меню ${menuContext} и список продуктов, которые ОСТАЛОСЬ КУПИТЬ из списка ${groceryContext}.
   - Если спрашивают про палатки/пилы/инвентарь/снарягу: зачитай список имущества из ${inventoryContext}, назови хранителей вещей и их состояние на данный момент.
   - Если спрашивают про туры, сплавы, походы или куда едем: зачитай список туров, сплавов и походов ${excursionsContext}, назови даты, локации и стоимость.
   - Если спрашивают про дни рождения, днюху, поздравления или у кого-то сегодня праздник: зачитай список дней рождения ${birthdayContext}, перечисли именинников сегодня, и выдай невероятное, эпичное Негодяйское походное поздравление (например: пожелай крепкой печени, чтоб палатка не текла, тушенка была чисто один кусковой говяжий сок, кабаны за три версты оббегали, а в спальнике всегда было сухо и тепло)! Подколи их психотип!

В нашей команде ровно 15 угарных психотипов. Тебе нужно проанализировать последнее сообщение от ${senderName} (@${senderNickname}) (его текущий заявленный тип: "${senderPsychotype}") и тонко подстроиться под один из 15 психотипов:
1. "Весельчак-балагур" (Шутит, флудит, орет, обожает безумие)
2. "Душнила-контролёр" (Сверяет списки, обожает Excel и правила занудства)
3. "Паникёр-истерик" (Боится клещей, медведей, промокнуть, туч)
4. "Тихий философ" (Созерцает пламя, медитирует на огонь костра, философствует)
5. "Бунтарь-анархист" (Горячая кровь требует анархии, поджогов и полного хаоса)
6. "Походный шеф-повар" (Готов убить за мытьё котелка моющим средством и дрожит над зирой)
7. "Гитарист-романтик" (Бесконечно поет КиШа и Сплин, просит внимания)
8. "Ленивый лежебока" (Спит до полудня, увиливает от дров и лагеря)
9. "Инста-туристка" (Ищет розетки и 4G, фотографирует красивые грибы)
10. "Клещевой ипохондрик" (Пшикается ОФФом каждые 40 секунд, проверяет все родинки)
11. "Бывалый выживальщик" (Берет 10 мачете, предлагает питаться корой и личинками)
12. "Спортивный темп-лидер" (Гонит всех вперед на 30км, кричит "быстрее, улитки")
13. "Алко-турист" (Начинает отмечать в автобусе, путает палатки и ботинки)
14. "Эко-защитник" (Против пластика, собирает бычки у костра и плачет за муравьев)
15. "Халявщик-забываха" (Забыл КЛМН, спальник и палатку, но взял улыбку)

Адаптируй свой ответ под особенности речи пользователя, подколи его за его слабости его психотипа сочно и уморительно!

Предыдущие до 5 сообщений в чате для контекста:
${recentHistoryText}

Новое сообщение от ${senderName} (@${senderNickname}) [Психотип: ${senderPsychotype}]:
"${cleanMessage}"

Верни ответ СТРОГО в формате JSON со следующими полями:
{
  "text": "Твой ответ в роли Главного Негодяя",
  "detectedPsychotype": "Название выявленного психотипа собеседника (один из 15 вариантов выше)",
  "detectedPsychotypeExplanation": "Одно короткое остроумное предложение на русском почему ты так считаешь",
  "adapterStyleUsed": "Краткое название применённого тобой стиля общения подстройки"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Ответь на последнее сообщение команды.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            detectedPsychotype: { type: Type.STRING },
            detectedPsychotypeExplanation: { type: Type.STRING },
            adapterStyleUsed: { type: Type.STRING },
          },
          required: ["text", "detectedPsychotype", "detectedPsychotypeExplanation", "adapterStyleUsed"],
        }
      }
    });

    const parsedResponse = JSON.parse(response.text?.trim() || "{}");
    return parsedResponse;

  } catch (error: any) {
    console.error("Error communicating with Gemini:", error);
    const fallback = generateMockNegodyaiResponse(
      cleanMessage,
      senderName,
      senderPsychotype,
      swearingLevel,
      excursions,
      debts,
      tasks,
      menuItems,
      groceryItems,
      inventoryItems
    );
    return {
      ...fallback,
      warning: "Произошла ошибка ИИ. Перешли на резервный алгоритм ответов Негодяя."
    };
  }
}

// API endpoint for generating bot responses
app.post("/api/bot-respond", async (req, res) => {
  try {
    const { message, senderName, senderNickname } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    const normSenderName = senderName || "Анонимный Негодяй";
    const normSenderNickname = senderNickname || normSenderName.toLowerCase().replace(/\s+/g, "_");

    // Check if participant is registered on the server, if not - add them (MAX dynamic synch)
    const currentParticipants = getParticipants();
    let existingP = currentParticipants.find(
      (p: any) => p.name === normSenderName || p.nickname === normSenderNickname
    );

    if (!existingP) {
      const isFemale =
        normSenderName.endsWith("а") ||
        normSenderName.endsWith("я") ||
        normSenderName.endsWith("ка") ||
        normSenderName.toLowerCase().includes("иришка") ||
        normSenderName.toLowerCase().includes("булочка");

      // Calculate totalCost based on active excursions
      const currentExcursions = getExcursions();
      const activeCost = currentExcursions
        .filter((e: any) => e.isActive)
        .reduce((acc: number, curr: any) => acc + (isFemale ? (curr.costGirls ?? curr.costPerPerson ?? 3500) : (curr.costBoys ?? curr.costPerPerson ?? 5000)), 0);

      existingP = {
        id: "p_" + Date.now(),
        name: normSenderName,
        nickname: normSenderNickname,
        psychotype: "Весельчак-балагур",
        avatar: isFemale ? "💁‍♀️" : "🏕️",
        paidAmount: 0,
        totalCost: activeCost,
        debtAmount: activeCost,
        joined: true,
        birthday: "",
        joinedYear: new Date().getFullYear(),
        skippedYears: [],
        gender: isFemale ? "female" : "male"
      };
      addOrUpdateParticipant(existingP);
    }

    // Capture incoming user message in serverMessages
    const userMsg = {
      id: "msg_" + Date.now() + "_user",
      senderName: normSenderName,
      senderNickname: normSenderNickname,
      senderPsychotype: existingP.psychotype || "Весельчак-балагур",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };
    addMessage(userMsg);

    const payload = await generateBotResponseInternal({
      ...req.body,
      senderName: normSenderName,
      senderNickname: normSenderNickname,
      senderPsychotype: existingP.psychotype,
      participants: getParticipants(),
      excursions: getExcursions(),
      tasks: getTasks(),
      menuItems: getMenuItems(),
      groceryItems: getGroceryItems(),
      inventoryItems: getInventoryItems(),
      debts: getParticipants().map((p: any) => ({
        name: p.name,
        nickname: p.nickname,
        paidAmount: p.paidAmount,
        totalCost: p.totalCost,
        debtAmount: p.debtAmount
      }))
    });

    // Capture outgoing bot response in serverMessages
    const botMsg = {
      id: "bot_" + Date.now() + "_res",
      senderName: "Бот Максимка",
      senderNickname: "negodyai_bot",
      senderPsychotype: "ИИ Главный Негодяй",
      text: payload.text || "А фиг его знает, бля, что ответить! Давай на сплав ехать!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: true,
      detectedPsychotypeExplanation: payload.detectedPsychotypeExplanation || "Подстроился под общение.",
      adapterStyleUsed: payload.adapterStyleUsed || "Угарный походник"
    };
    addMessage(botMsg);

    // Auto detect sender psychotype if configured
    const botConfig = getBotConfig();
    if (botConfig.autoDetectPsychotype && payload.detectedPsychotype) {
      existingP.psychotype = payload.detectedPsychotype;
      addOrUpdateParticipant(existingP);
    }

    return res.json(payload);
  } catch (error: any) {
    console.error("Express API error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Sync endpoints to preserve shared state backed by PostgreSQL
app.get("/api/sync", (req, res) => {
  res.json({
    participants: getParticipants(),
    excursions: getExcursions(),
    tasks: getTasks(),
    menuItems: getMenuItems(),
    groceryItems: getGroceryItems(),
    inventoryItems: getInventoryItems(),
    botConfig: getBotConfig(),
    contests: getContests(),
    messages: getMessages(),
    photos: getPhotos(),
    documents: getTeamDocuments(),
    fundRecords: getFundRecords(),
    creativityIdeas: getCreativityIdeas(),
    stories: getStories()
  });
});

app.post("/api/sync", (req, res) => {
  try {
    const { 
      participants, 
      excursions, 
      tasks, 
      menuItems, 
      groceryItems, 
      inventoryItems, 
      botConfig, 
      contests, 
      messages,
      fundRecords,
      stories 
    } = req.body;
    if (participants) saveParticipants(participants);
    if (excursions) saveExcursions(excursions);
    if (tasks) saveTasks(tasks);
    if (menuItems) saveMenuItems(menuItems);
    if (groceryItems) saveGroceryItems(groceryItems);
    if (inventoryItems) saveInventoryItems(inventoryItems);
    if (botConfig) saveBotConfig(botConfig);
    if (contests) saveContests(contests);
    if (messages) saveMessages(messages);
    if (fundRecords) saveFundRecords(fundRecords);
    if (stories) saveStories(stories);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating server sync:", err);
    res.status(500).json({ error: "Failed to update sync cache" });
  }
});

// Auth & Registration
app.post("/api/auth/register", (req, res) => {
  const { name, nickname, email, phone, password, verificationMethod, verificationCode, biometricEnabled, avatar } = req.body;
  if (!name || !nickname) {
    return res.status(400).json({ success: false, error: "Укажите имя и позывной" });
  }
  
  if (verificationCode && verificationCode.length !== 4 && verificationCode !== "1234") {
    return res.status(400).json({ success: false, error: "Неверный код подтверждения" });
  }

  const newId = "user_" + Date.now();
  const newParticipant = {
    id: newId,
    name,
    nickname,
    psychotype: "Новичок-энтузиаст",
    avatar: avatar || "",
    paidAmount: 0,
    totalCost: 15000,
    debtAmount: 15000,
    joined: false,
    joinedYear: new Date().getFullYear(),
    skippedYears: [],
    gender: "male" as const,
    role: "member" as const,
    email: email || "",
    phone: phone || "",
    password: password || "123",
    accountStatus: "pending" as const, // Requires captain approval!
    biometricEnabled: Boolean(biometricEnabled)
  };

  registerNewParticipant(newParticipant);
  res.json({
    success: true,
    message: "Заявка на регистрацию принята! Ожидайте подтверждения от Капитана команды.",
    user: newParticipant
  });
});

app.post("/api/auth/login", (req, res) => {
  const { identifier, password, useBiometrics } = req.body;
  const participants = getParticipants();

  // Captain special login check
  if ((identifier === "admin" || identifier === "admin@negodyai.club") && (password === getAdminPassword() || useBiometrics)) {
    let adminUser = participants.find(p => p.role === "admin" || p.id === "3");
    if (!adminUser) {
      adminUser = {
        id: "3",
        name: "Капитан команды",
        nickname: "Captain",
        role: "admin",
        accountStatus: "active",
        avatar: "",
        biometricEnabled: true,
        psychotype: "Генералиссимус-стратег",
        paidAmount: 0,
        totalCost: 0,
        debtAmount: 0,
        joined: true,
        joinedYear: 2018,
        skippedYears: [],
        gender: "male",
        email: "admin@negodyai.club",
        phone: "+7 999 123-45-67",
        password: getAdminPassword()
      };
      addOrUpdateParticipant(adminUser);
    } else if (adminUser.avatar && adminUser.avatar.includes("dicebear.com/7.x/bottts")) {
      adminUser.avatar = "";
      addOrUpdateParticipant(adminUser);
    }
    return res.json({
      success: true,
      user: { ...adminUser, role: "admin" }
    });
  }

  const user = participants.find(p => 
    p.nickname.toLowerCase() === identifier?.toLowerCase() ||
    p.name.toLowerCase() === identifier?.toLowerCase() ||
    (p.email && p.email.toLowerCase() === identifier?.toLowerCase()) ||
    (p.phone && p.phone === identifier)
  );

  if (!user) {
    return res.status(401).json({ success: false, error: "Пользователь не найден. Проверьте позывной, email или телефон." });
  }

  if (user.accountStatus === "pending") {
    return res.status(403).json({ success: false, error: "Ваша регистрация ожидает подтверждения Капитаном команды." });
  }

  if (user.accountStatus === "rejected") {
    return res.status(403).json({ success: false, error: "Ваша регистрация была отклонена Капитаном команды." });
  }

  if (useBiometrics) {
    if (!user.biometricEnabled) {
      return res.status(400).json({ success: false, error: "Биометрия (Touch/Face ID) не подключена для этого аккаунта" });
    }
    return res.json({ success: true, user });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, error: "Неверный пароль" });
  }

  return res.json({ success: true, user });
});

app.post("/api/auth/change-password", (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.trim() === "") {
    return res.status(400).json({ success: false, error: "Новый пароль не может быть пустым" });
  }
  if (userId === "admin_user" || userId === "admin") {
    saveAdminPassword(newPassword);
    return res.json({ success: true, message: "Пароль Капитана команды изменен" });
  }
  const user = getParticipants().find(p => p.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "Пользователь не найден" });
  }
  if (oldPassword && user.password && user.password !== oldPassword) {
    return res.status(400).json({ success: false, error: "Текущий пароль указан неверно" });
  }
  updateParticipantPassword(userId, newPassword);
  return res.json({ success: true, message: "Пароль успешно обновлен" });
});

app.post("/api/auth/toggle-biometrics", (req, res) => {
  const { userId, enabled } = req.body;
  updateParticipantBiometrics(userId, Boolean(enabled));
  res.json({ success: true, enabled: Boolean(enabled) });
});

// Update personal user profile
app.post("/api/user/update-profile", (req, res) => {
  const { userId, name, nickname, email, phone, avatar, birthday, joinedYear, psychotype, gender } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId обязателен" });
  }
  const participants = getParticipants();
  let existing = participants.find(p => p.id === userId);
  
  // Robust fallback for Captain/admin accounts if ID alias was used
  if (!existing && (userId === "admin_user" || userId === "3" || userId === "admin")) {
    existing = participants.find(p => p.role === "admin" || p.id === "3");
  }

  // If user was not found by ID (e.g. client registered locally or restored state)
  if (!existing) {
    existing = {
      id: userId,
      name: name || "Участник команды",
      nickname: nickname || "negodyai",
      psychotype: psychotype || "Весельчак-балагур",
      avatar: "",
      paidAmount: 0,
      totalCost: 0,
      debtAmount: 0,
      joined: true,
      birthday: birthday || "",
      joinedYear: joinedYear || 2018,
      skippedYears: [],
      gender: gender === "female" ? "female" : "male",
      role: (userId === "admin_user" || userId === "3" || userId === "admin") ? "admin" : "member",
      email: email || "",
      phone: phone || "",
      password: "123",
      accountStatus: "active",
      biometricEnabled: false
    };
  }

  // Clean avatar to ensure no Dicebear bot art survives
  let cleanAvatar = existing.avatar || "";
  if (avatar !== undefined) {
    cleanAvatar = avatar && avatar.includes("dicebear.com/7.x/bottts") ? "" : avatar.trim();
  }

  const updated = {
    ...existing,
    id: existing.id,
    name: name !== undefined && name.trim() !== "" ? name.trim() : existing.name,
    nickname: nickname !== undefined && nickname.trim() !== "" ? nickname.trim().replace(/^@/, '') : existing.nickname,
    email: email !== undefined ? email.trim() : existing.email,
    phone: phone !== undefined ? phone.trim() : existing.phone,
    avatar: cleanAvatar,
    birthday: birthday !== undefined ? birthday : existing.birthday,
    joinedYear: joinedYear !== undefined && !isNaN(Number(joinedYear)) ? Number(joinedYear) : existing.joinedYear,
    psychotype: psychotype !== undefined ? psychotype : existing.psychotype,
    gender: gender === "female" ? ("female" as const) : ("male" as const)
  };

  addOrUpdateParticipant(updated);
  res.json({ success: true, message: "Профиль успешно обновлен", user: updated });
});

// Admin Moderation
app.post("/api/admin/approve-user", (req, res) => {
  const { userId } = req.body;
  approveParticipant(userId);
  res.json({ success: true, message: "Участник успешно одобрен!" });
});

app.post("/api/admin/reject-user", (req, res) => {
  const { userId } = req.body;
  rejectParticipant(userId);
  res.json({ success: true, message: "Заявка участника отклонена" });
});

app.post("/api/admin/set-role", (req, res) => {
  const { userId, role } = req.body;
  const validRoles = ["admin", "treasurer", "foreman", "designer", "assistant_captain", "keeper", "chef", "member"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: "Недопустимая роль" });
  }
  updateParticipantRole(userId, role);
  res.json({ success: true, message: `Роль успешно изменена на ${role}` });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === getAdminPassword()) {
    return res.json({ success: true, message: "Вы вошли как Капитан команды!" });
  }
  return res.status(401).json({ success: false, error: "Неправильный логин или пароль" });
});

app.post("/api/admin/change-password", (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim() === "") {
    return res.status(400).json({ success: false, error: "Пароль не может быть пустым" });
  }
  saveAdminPassword(newPassword);
  return res.json({ success: true, message: "Пароль Капитана команды успешно изменен!" });
});

// Gallery Photos
app.get("/api/photos", (req, res) => {
  res.json(getPhotos());
});

app.post("/api/photos", (req, res) => {
  const { year, title, description, imageUrl, uploadedBy } = req.body;
  if (!imageUrl || !title) {
    return res.status(400).json({ success: false, error: "Заголовок и фото обязательны" });
  }
  const newPhoto = {
    id: "photo_" + Date.now(),
    year: parseInt(year, 10) || new Date().getFullYear(),
    title,
    description: description || "",
    imageUrl,
    uploadedBy: uploadedBy || "Негодяй",
    uploadedAt: new Date().toISOString().split("T")[0],
    likes: 0,
    likedUserIds: []
  };
  addPhoto(newPhoto);
  res.json({ success: true, photo: newPhoto });
});

app.delete("/api/photos/:id", (req, res) => {
  deletePhoto(req.params.id);
  res.json({ success: true });
});

app.post("/api/photos/:id/like", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  togglePhotoLike(req.params.id, userId);
  res.json({ success: true, photos: getPhotos() });
});

// Documents
app.get("/api/documents", (req, res) => {
  res.json(getTeamDocuments());
});

app.post("/api/documents", (req, res) => {
  const { category, title, description, fileUrl, fileName, fileType, content, uploadedBy } = req.body;
  if (!title || !category) {
    return res.status(400).json({ success: false, error: "Заполните название и раздел" });
  }
  const newDoc = {
    id: "doc_" + Date.now(),
    category,
    title,
    description: description || "",
    fileUrl: fileUrl || undefined,
    fileName: fileName || title + ".pdf",
    fileType: fileType || "pdf",
    content: content || undefined,
    uploadedBy: uploadedBy || "Капитан команды",
    uploadedAt: new Date().toISOString().split("T")[0]
  };
  addTeamDocument(newDoc);
  res.json({ success: true, document: newDoc });
});

app.delete("/api/documents/:id", (req, res) => {
  deleteTeamDocument(req.params.id);
  res.json({ success: true });
});

// Fund Management
app.get("/api/fund", (req, res) => {
  res.json(getFundRecords());
});

app.post("/api/fund/update", (req, res) => {
  const { id, isPaid, note, paidAt, amount } = req.body;
  updateFundRecord(id, {
    isPaid: Boolean(isPaid),
    paidAt: isPaid ? (paidAt || new Date().toISOString().split("T")[0]) : undefined,
    note: note || "",
    amount: amount ? Number(amount) : undefined
  });
  res.json({ success: true, fundRecords: getFundRecords() });
});

// Creativity & Ideas
app.get("/api/creativity", (req, res) => {
  res.json(getCreativityIdeas());
});

app.post("/api/creativity", (req, res) => {
  const { category, title, description, authorId, authorName, imageUrl, materialsBudget } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ success: false, error: "Заполните категорию, название и описание идеи" });
  }
  const newIdea = {
    id: "idea_" + Date.now(),
    category,
    title,
    description,
    authorId: authorId || "1",
    authorName: authorName || "Негодяй",
    imageUrl: imageUrl || undefined,
    materialsBudget: materialsBudget || "",
    status: "idea" as const,
    votes: 1,
    votedUserIds: [authorId || "1"],
    comments: [],
    createdAt: new Date().toISOString().split("T")[0]
  };
  addCreativityIdea(newIdea);
  res.json({ success: true, idea: newIdea });
});

app.post("/api/creativity/:id/vote", (req, res) => {
  const { userId } = req.body;
  toggleIdeaVote(req.params.id, userId);
  res.json({ success: true, ideas: getCreativityIdeas() });
});

app.post("/api/creativity/:id/comment", (req, res) => {
  const { authorId, authorName, text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });
  addIdeaComment(req.params.id, {
    id: "cmt_" + Date.now(),
    authorId,
    authorName,
    text,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString()
  });
  res.json({ success: true, ideas: getCreativityIdeas() });
});

app.post("/api/creativity/:id/status", (req, res) => {
  const { status } = req.body;
  updateCreativityIdea(req.params.id, { status });
  res.json({ success: true, ideas: getCreativityIdeas() });
});

// Team Stories & History endpoints
app.get("/api/stories", (req, res) => {
  res.json(getStories());
});

app.post("/api/stories", (req, res) => {
  const { category, categoryTitle, title, content, photos, videos, authorName, year } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  const newStory = {
    id: "story_" + Date.now(),
    category: category || "custom",
    categoryTitle: categoryTitle || "История команды",
    title,
    content,
    photos: photos || [],
    videos: videos || [],
    authorName: authorName || "Негодяй",
    year: year ? parseInt(year) : new Date().getFullYear(),
    createdAt: new Date().toISOString().split("T")[0]
  };
  addStory(newStory);
  res.json({ success: true, story: newStory, stories: getStories() });
});

app.put("/api/stories/:id", (req, res) => {
  updateStory(req.params.id, req.body);
  res.json({ success: true, stories: getStories() });
});

app.delete("/api/stories/:id", (req, res) => {
  deleteStory(req.params.id);
  res.json({ success: true, stories: getStories() });
});

// Participant internal chat message (with integrated Bot Maximka support)
app.post("/api/chat/send", async (req, res) => {
  const { senderName, senderNickname, senderPsychotype, text, imageUrl, attachments, triggerBot } = req.body;
  if (!text && !imageUrl) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  const newMsg = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    senderName: senderName || "Участник",
    senderNickname: senderNickname || "member",
    senderPsychotype: senderPsychotype || "Негодяй",
    text: text || "",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isBot: false,
    imageUrl: imageUrl || undefined,
    attachments: attachments || undefined
  };
  addMessage(newMsg);

  // Check if bot should reply
  const textLower = (text || "").toLowerCase();
  const shouldBotAnswer = triggerBot ||
    textLower.includes("бот") ||
    textLower.includes("максимк") ||
    textLower.includes("негодяй") ||
    textLower.includes("как гуляет") ||
    textLower.includes("днюх") ||
    textLower.includes("рожден") ||
    textLower.includes("именин") ||
    textLower.includes("поздрав") ||
    textLower.includes("задач") ||
    textLower.includes("меню") ||
    textLower.includes("продукт") ||
    textLower.includes("еда") ||
    textLower.includes("жрат") ||
    textLower.includes("пожрать") ||
    textLower.includes("конкурс") ||
    textLower.includes("соревнован") ||
    textLower.includes("турнир") ||
    textLower.includes("долг") ||
    textLower.includes("деньг") ||
    textLower.includes("бабл") ||
    textLower.includes("взнос") ||
    textLower.includes("смет") ||
    textLower.includes("инвентар") ||
    textLower.includes("снаряг") ||
    textLower.includes("палатк") ||
    textLower.includes("тост") ||
    textLower.includes("запись") ||
    textLower.includes("?") ||
    textLower.startsWith("/");

  let botMessage = null;
  if (shouldBotAnswer) {
    try {
      const payload = await generateBotResponseInternal({
        message: text,
        senderName: newMsg.senderName,
        senderNickname: newMsg.senderNickname,
        senderPsychotype: newMsg.senderPsychotype,
        participants: getParticipants(),
        excursions: getExcursions(),
        tasks: getTasks(),
        menuItems: getMenuItems(),
        groceryItems: getGroceryItems(),
        inventoryItems: getInventoryItems(),
        contests: getContests(),
        debts: getParticipants().map((p: any) => ({
          name: p.name,
          nickname: p.nickname,
          paidAmount: p.paidAmount,
          totalCost: p.totalCost,
          debtAmount: p.debtAmount
        }))
      });

      botMessage = {
        id: "bot_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        senderName: "Бот Максимка",
        senderNickname: "negodyai_bot",
        senderPsychotype: "ИИ Главный Негодяй",
        text: payload.text || "А фиг его знает, бля, что ответить! Собираемся на слёт!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: true,
        detectedPsychotypeExplanation: payload.detectedPsychotypeExplanation || "Ответил в походном стиле.",
        adapterStyleUsed: payload.adapterStyleUsed || "Угарный Негодяй",
        imageUrl: payload.imageUrl,
        attachments: payload.attachments
      };
      addMessage(botMessage);
    } catch (e) {
      console.error("Error auto-generating bot reply:", e);
    }
  }

  res.json({ success: true, message: newMsg, botMessage });
});

// Fallback algorithm generating custom witty responses when Gemini is unconfigured or errors out
function generateMockNegodyaiResponse(
  message: string, 
  senderName: string, 
  senderPsychotype: string,
  swearingLevel: string, 
  excursions: any[], 
  debts: any[],
  tasks?: any[],
  menuItems?: any[],
  groceryItems?: any[],
  inventoryItems?: any[],
  contests?: any[],
  participants?: any[]
) {
  const msgLower = message.toLowerCase();
  let text = "";
  let detectedPsychotype = senderPsychotype;
  let detectedPsychotypeExplanation = `Общается в своей классической манере "${senderPsychotype}".`;
  let adapterStyleUsed = "Негодяйский походный подкол";
  let imageUrl: string | undefined = undefined;
  let attachments: any[] | undefined = undefined;

  // Signature Negodyai Mottos and catchphrases
  if (msgLower.includes("как гуляет негодяй") || msgLower.includes("как гуляет")) {
    return {
      text: "Ахуенно!",
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Фирменный девиз команды Негодяи!",
      adapterStyleUsed: "Фирменный девиз"
    };
  }

  if (msgLower.includes("записьдень") || msgLower.includes("запиздень")) {
    return {
      text: "Записьдень!",
      detectedPsychotype: "Душнила-контролёр",
      detectedPsychotypeExplanation: "Кто-то слишком много пиздит — чистый записьдень!",
      adapterStyleUsed: "Фирменное осаживание"
    };
  }

  if (msgLower.includes("запись дубля") || msgLower.includes("дубль")) {
    return {
      text: "За пизду бля!",
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Фирменный негодяйский тост!",
      adapterStyleUsed: "Командный тост"
    };
  }

  if (msgLower.includes("пизда на глаза")) {
    return {
      text: "Пизда на глаза!",
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Фирменный ответ на вопросы или сильное удивление!",
      adapterStyleUsed: "Фирменное удивление"
    };
  }

  if (msgLower.includes("кто с негодяем дрался") || msgLower.includes("негодяем дрался") || msgLower.includes("кто дрался")) {
    return {
      text: swearingLevel === "low" 
        ? "Кто с Негодяем дрался — тот без штанов остался! 🌲👊 С нашей командой шутки плохи, победа за нами!" 
        : "Кто с Негодяем дрался — тот в крапиве обосрался! 🌲👊 С нашей командой шутки плохи, порвём за своих!",
      detectedPsychotype: "Бунтарь-анархист",
      detectedPsychotypeExplanation: "Фирменная Негодяйская боевая поговорка!",
      adapterStyleUsed: "Боевой клич Негодяев"
    };
  }

  if (msgLower.includes("давай негодяй") || msgLower.includes("давай, негодяй")) {
    return {
      text: "🔥 Давай Негодяй — жги, гуляй, наливай и не унывай! Вперёд в тайгу, навстречу костровому угару! 🍻",
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Задорный командный боевой заряд 'Давай Негодяй'!",
      adapterStyleUsed: "Командный боевой клич"
    };
  }

  // Check for birthday-related questions or trigger congrats!
  const isBirthdayQuery = msgLower.includes("днюх") || msgLower.includes("рожден") || msgLower.includes("именин") || msgLower.includes("поздрав");
  if (isBirthdayQuery) {
    adapterStyleUsed = "Днюшный походный разнос";
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Check today's birthdays
    const todayList = (participants || []).filter((p: any) => {
      if (!p.birthday) return false;
      const parts = p.birthday.split('-');
      if (parts.length < 3) return false;
      return parseInt(parts[1], 10) === currentMonth && parseInt(parts[2], 10) === currentDay;
    });

    const upcomingList = (participants || [])
      .filter((p: any) => p.birthday)
      .map((p: any) => {
        const parts = p.birthday.split('-');
        return `${p.name} (${parts[2]}.${parts[1]})`;
      })
      .slice(0, 5)
      .join(", ");

    if (todayList.length > 0) {
      const bdayPerson = todayList[0].name;
      if (swearingLevel === "high") {
        text = `🎉 Ёбаный карась! У ${bdayPerson} СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ, команда! От лица всех Негодяев желаю: крепчайшей титановой печени, чтоб палатка стояла железобетонно, костер горел в любой ливень, а тушенка была чисто один кусковой говяжий сок, нахуй! С праздником, братуха! Наливай полнее! 🍻🎂🎈`;
      } else if (swearingLevel === "medium") {
        text = `🎉 Братва, внимание! Сегодня ДЕНЬ РОЖДЕНИЯ у нашего негодяя: ${bdayPerson}, бля! От всей команды поздравляем! Желаем здоровья, сочного плова в казане, сухих спальников и чтобы байдарки никогда нахуй не переворачивались! Ура имениннику! 🍲🥂🎂`;
      } else {
        text = `🎉 Внимание команде! Сегодня празднует ДЕНЬ РОЖДЕНИЯ наш соратник: ${bdayPerson}! Желаем отличных маршрутов, душевных песен у костра, крепкого здоровья и закрытия всех сборов! С Днём Рождения! 🎈⛺✨`;
      }
    } else {
      let targetName = senderName;
      if (msgLower.includes("саня") || msgLower.includes("запева")) targetName = "Саня Запевала";
      else if (msgLower.includes("хорек") || msgLower.includes("андрюх")) targetName = "Андрюха Хорёк";
      else if (msgLower.includes("лех") || msgLower.includes("навига")) targetName = "Лёха Навигатор";
      else if (msgLower.includes("ириш") || msgLower.includes("бул")) targetName = "Иришка Булочка";
      else if (msgLower.includes("михалыч") || msgLower.includes("лесни")) targetName = "Михалыч Лесник";
      else if (msgLower.includes("юр") || msgLower.includes("манг")) targetName = "Юрец Мангальщик";
      else if (msgLower.includes("данчик") || msgLower.includes("кипиш")) targetName = "Данчик Кипиш";

      if (swearingLevel === "high") {
        text = `🎂 Слышь, ${senderName}! Сегодня прямо сейчас никто не проставился, но вот походный календарь днюх команды: ${upcomingList}! А для ${targetName} желаю, чтоб жизнь была огонь, а в рюкзаке всегда звенело то, что надо, бля! 🍻`;
      } else {
        text = `🎂 Привет, ${senderName}! Я слежу за всеми днями рождения нашей команды! Ближайшие даты негодяев: ${upcomingList}. Готовим кружки и поздравления!`;
      }
    }

    return {
      text,
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Следит за днями рождениями и заряжает походное поздравление!",
      adapterStyleUsed
    };
  }

  // Detailed detection rules based on 15 psychotypes
  if (msgLower.includes("excel") || msgLower.includes("таблиц") || msgLower.includes("список") || msgLower.includes("отчет") || msgLower.includes("руб") || msgLower.includes("смет")) {
    detectedPsychotype = "Душнила-контролёр";
    detectedPsychotypeExplanation = "Требует отчеты, сводки, цифры и обожает душность таблиц больше свободы.";
  } else if (msgLower.includes("страшно") || msgLower.includes("гроза") || msgLower.includes("медведь") || msgLower.includes("дождь") || msgLower.includes("замерзнем") || msgLower.includes("волк") || msgLower.includes("кабан")) {
    detectedPsychotype = "Паникёр-истерик";
    detectedPsychotypeExplanation = "Находится в предынфарктном состоянии из-за потенциального дождя и кабанов.";
  } else if (msgLower.includes("анарх") || msgLower.includes("покрышк") || msgLower.includes("забей") || msgLower.includes("нафиг") || msgLower.includes("к черту") || msgLower.includes("бунт")) {
    detectedPsychotype = "Бунтарь-анархист";
    detectedPsychotypeExplanation = "Горячая кровь требует анархии, поджогов и полного хаоса!";
  } else if (msgLower.includes("плов") || msgLower.includes("котел") || msgLower.includes("курдюк") || msgLower.includes("мыло") || msgLower.includes("кастрюл") || msgLower.includes("повар")) {
    detectedPsychotype = "Походный шеф-повар";
    detectedPsychotypeExplanation = "Готов убить за мытьё котелка моющим средством и дрожит над зирой.";
  } else if (msgLower.includes("батарейк") || msgLower.includes("гитар") || msgLower.includes("песн") || msgLower.includes("аккорд") || msgLower.includes("струн") || msgLower.includes("киш")) {
    detectedPsychotype = "Гитарист-романтик";
    detectedPsychotypeExplanation = "Его пальцы зудят сыграть 'Батарейку' 40 раз подряд.";
  } else if (msgLower.includes("поспать") || msgLower.includes("лень") || msgLower.includes("полеж") || msgLower.includes("устал") || msgLower.includes("ношу") || msgLower.includes("сплю")) {
    detectedPsychotype = "Ленивый лежебока";
    detectedPsychotypeExplanation = "Готов проспать даже нападение медведей, лишь бы не собирать катамаран.";
  } else if (msgLower.includes("сеть") || msgLower.includes("связь") || msgLower.includes("интернет") || msgLower.includes("фото") || msgLower.includes("инст") || msgLower.includes("сторис") || msgLower.includes("лайк")) {
    detectedPsychotype = "Инста-туристка";
    detectedPsychotypeExplanation = "Ради 4G и пары лайков в сторис готова залезть на самую высокую сосну лесничества.";
  } else if (msgLower.includes("клещ") || msgLower.includes("болет") || msgLower.includes("комар") || msgLower.includes("пшик") || msgLower.includes("брызг") || msgLower.includes("укус") || msgLower.includes("аптеч")) {
    detectedPsychotype = "Клещевой ипохондрик";
    detectedPsychotypeExplanation = "Репелленты заменили ему воду, а в каждой соринке видит энцефалит.";
  } else if (msgLower.includes("нож") || msgLower.includes("огниво") || msgLower.includes("кора") || msgLower.includes("выжить") || msgLower.includes("мачете") || msgLower.includes("тактич")) {
    detectedPsychotype = "Бывалый выживальщик";
    detectedPsychotypeExplanation = "Мечтает потеряться в тайге на полгода, чтобы наконец применить свои четыре ножа и тактический шпагат.";
  } else if (msgLower.includes("быстрее") || msgLower.includes("вперед") || msgLower.includes("километр") || msgLower.includes("беж") || msgLower.includes("темп") || msgLower.includes("улитки")) {
    detectedPsychotype = "Спортивный темп-лидер";
    detectedPsychotypeExplanation = "Бежит впереди планеты всей и искренне презирает тех, кто хочет просто посидеть на пеньке.";
  } else if (msgLower.includes("выпить") || msgLower.includes("наливай") || msgLower.includes("рюмк") || msgLower.includes("пиво") || msgLower.includes("бренди") || msgLower.includes("алко") || msgLower.includes("пьян")) {
    detectedPsychotype = "Алко-турист";
    detectedPsychotypeExplanation = "Начал ментальный сплав по реке алкоголя еще до выхода из дома.";
  } else if (msgLower.includes("пластик") || msgLower.includes("мусор") || msgLower.includes("окурок") || msgLower.includes("эко") || msgLower.includes("природ") || msgLower.includes("дерев")) {
    detectedPsychotype = "Эко-защитник";
    detectedPsychotypeExplanation = "Душа болит за флору и фауну, готов расстрелять за брошенный фантик от конфеты.";
  } else if (msgLower.includes("забыл") || msgLower.includes("одолж") || msgLower.includes("поделит") || msgLower.includes("нет ложки") || msgLower.includes("нет спальника") || msgLower.includes("возьми в палатку")) {
    detectedPsychotype = "Халявщик-забываха";
    detectedPsychotypeExplanation = "Всё забыл, но аппетит и наглость привёз в полном объеме.";
  } else if (msgLower.includes("тишин") || msgLower.includes("философ") || msgLower.includes("дзен") || msgLower.includes("космос") || msgLower.includes("вечност") || msgLower.includes("смысл")) {
    detectedPsychotype = "Тихий философ";
    detectedPsychotypeExplanation = "Медитирует на огонь костра и видит в треске веток тайный шифр вселенной.";
  }

  // Handle Money, Excursion, Menu, Tasks or Inventory questions
  const hasMoneyKeywords = msgLower.includes("долг") || msgLower.includes("деньги") || msgLower.includes("бабл") || msgLower.includes("оплат") || msgLower.includes("скидывать") || msgLower.includes("задолж") || msgLower.includes("смет");
  const hasExcursionKeywords = msgLower.includes("сбор") || msgLower.includes("куда") || msgLower.includes("экскурс") || msgLower.includes("слет") || msgLower.includes("когда") || msgLower.includes("тур") || msgLower.includes("поход") || msgLower.includes("сплав");
  const hasMenuKeywords = msgLower.includes("меню") || msgLower.includes("еда") || msgLower.includes("едят") || msgLower.includes("блюд") || msgLower.includes("пожрать") || msgLower.includes("закуп") || msgLower.includes("продукт") || msgLower.includes("тушняк") || msgLower.includes("кушать") || msgLower.includes("обед") || msgLower.includes("ужин") || msgLower.includes("завтрак") || msgLower.includes("повар") || msgLower.includes("жрат");
  const hasTaskKeywords = msgLower.includes("задач") || msgLower.includes("дел") || msgLower.includes("дежур") || msgLower.includes("поручен") || msgLower.includes("сделать") || msgLower.includes("кто что") || msgLower.includes("дрова") || msgLower.includes("обязан");
  const hasInventoryKeywords = msgLower.includes("инвентар") || msgLower.includes("имуществ") || msgLower.includes("палатк") || msgLower.includes("снаряг") || msgLower.includes("пила") || msgLower.includes("казан") || msgLower.includes("топор") || msgLower.includes("вещи");
  const isKnotsQuery = msgLower.includes("узел") || msgLower.includes("узл") || msgLower.includes("вязать") || msgLower.includes("прусик") || msgLower.includes("восьмерк");
  const isOrientQuery = msgLower.includes("ориентирован") || msgLower.includes("знаки") || msgLower.includes("карты") || msgLower.includes("кп");
  const isScheduleQuery = msgLower.includes("график") || msgLower.includes("расписан") || msgLower.includes("этапы") || msgLower.includes("время соревнований");
  const isContestQuery = msgLower.includes("конкурс") || msgLower.includes("соревнован") || msgLower.includes("турнир");

  const debtors = debts.filter(d => d.debtAmount > 0);
  const totalDebtors = debtors.map(d => `${d.name} (@${d.nickname} - ${d.debtAmount}р)`).join(", ");

  if (hasMoneyKeywords) {
    adapterStyleUsed = "Финансовая порка косячников";
    if (debtors.length > 0) {
      if (swearingLevel === "high") {
        text = `Слышь, ${senderName}! По бабкам тут полный пиздец! Должники опять зажали взносы, бля. Пинаем халявщиков толпой: ${totalDebtors}. Какого хуя сметы стоят?! Быстро скинулись нахуй, иначе будете спать на сырых шишках и грызть кору вместо шашлыка!`;
      } else if (swearingLevel === "medium") {
        text = `Так, команда! Смета горит, бля. Наши забывчивые негодяи: ${totalDebtors} — вы задолжали! Давайте скидывайтесь оперативнее, нахуй, надо уже закупать тушняк, казан и бронировать гидов!`;
      } else {
        text = `По финансовым отчетам ведомости у нас есть задержки по сборам: ${totalDebtors}. Ребятки, давайте поскорее закроем долги, чтобы мы могли спокойно ехать кутить в поход! Всех обнял!`;
      }
    } else {
      if (swearingLevel === "high") {
        text = `Охуеть, бля! Все сдали копейка в копейку! Долгов ноль! Это грандиозное событие, за такое нужно срочно накатить по походной стопочке!`;
      } else {
        text = `Чудо свершилось! Абсолютно никто ничего не должен! До ведомости не докопаться. Сборы закрыты, мы официально едем тусить со спокойной совестью!`;
      }
    }
  } else if (hasExcursionKeywords) {
    const activeExcursions = excursions.filter(e => e.isActive);
    const excNames = activeExcursions.map(e => `"${e.title}" (${e.date} в ${e.location} - ${e.costPerPerson}р)`).join(" и ");
    adapterStyleUsed = "Срочный сбор по коням";
    if (activeExcursions.length > 0) {
      if (swearingLevel === "high") {
        text = `Ёбаный карась, народ! Ближайшие движухи: ${excNames}! Быстро пакуем рюкзаки, спальники, закупаем пивас и тушняк нахуй! Кто пропустит этот сплав — тот вонючий домашний сырок! Быть всем, без пизды!`;
      } else if (swearingLevel === "medium") {
        text = `Напоминаю, бля! Едем в поход: ${excNames}. Всем перетряхнуть палатки, подготовить сапоги! Пропустить такое — полный пиздец, будет угарно!`;
      } else {
        text = `Эй, команда Негодяев! Наш грандиозный поход всё ближе: ${excNames}. Готовим хорошее настроение и пакуем походные рюкзаки. Это будет незабываемо!`;
      }
    } else {
      text = `Активных туров нет. Сидим греем задницы у костра и ждем, когда Капитан команды добавит новый угарный маршрут!`;
    }
  } else if (hasMenuKeywords) {
    adapterStyleUsed = "Кулинарный расклад слёта";
    const dishesList = (menuItems || []).map((m: any) => `"${m.dishName}" (${m.day})`).join(", ");
    const groceriesNeeded = (groceryItems || []).filter((g: any) => !g.isBought).map((g: any) => `"${g.name}" (${g.quantity})`).join(", ");
    
    if (dishesList) {
      if (swearingLevel === "high") {
        text = `Слышь, ${senderName}! По меню у нас на слёте полный кайф и объедение, бля! Готовим: ${dishesList}. А из заготовок осталась докупить всякая херня: ${groceriesNeeded || "всё уже закуплено, красавчики"}! Готовь большую ложку и котелок, нахуй!`;
      } else if (swearingLevel === "medium") {
        text = `Эй, Негодяи! Вот наше походное меню на слёт, бля: ${dishesList}! Осталось затариться в магазе: ${groceriesNeeded || "все продукты уже в багажниках"}! Костровая кухня будет огонь!`;
      } else {
        text = `Привет, ${senderName}! Вот наше вкуснотища-меню на слёт: ${dishesList}. Не забудьте, что нужно еще докупить: ${groceriesNeeded || "все закупки закрыты"}! Ждем ароматного плова и ухи у костра!`;
      }
    } else {
      text = `Пока меню на слёт пустует. Капитан команды еще не внес фирменный плов и тушенку! Пора бы заполнить раздел еды!`;
    }
  } else if (hasTaskKeywords) {
    adapterStyleUsed = "Раздача походных задач";
    const openTasks = (tasks || []).filter((t: any) => !t.isCompleted);
    const tasksList = openTasks.map((t: any) => `"${t.title}" (Ответственный: ${t.assigneeName}, до: ${t.deadline})`).join("; ");
    
    if (openTasks.length > 0) {
      if (swearingLevel === "high") {
        text = `Слышь, ${senderName}! По задачам слёта у нас висит нехилый завал, бля! Вот горе-дела, которые НАДО СДЕЛАТЬ: ${tasksList}. Быстро подхватили задницы и закрываем дедлайны нахуй, а то на слёте будете только дрова таскать!`;
      } else if (swearingLevel === "medium") {
        text = `Команда, по задачам слёта у нас тут есть невыполненные хвосты, бля: ${tasksList}! Давайте активнее включайтесь, помогайте ответственным, чтобы слёт прошёл на высоте!`;
      } else {
        text = `Привет, ${senderName}! Напоминаю список важных задач для слёта: ${tasksList}. Давайте дружно закроем их до выезда!`;
      }
    } else {
      if (swearingLevel === "high") {
        text = `Ахуеть, бля! Все задачи по слёту выполнены! Команда просто зверюги! Можно расслабиться и наливать чаёк у костра!`;
      } else {
        text = `Отличные новости! Все походные задачи команды успешно закрыты! Мы полностью готовы к слёту!`;
      }
    }
  } else if (isKnotsQuery) {
    adapterStyleUsed = "Инструктаж по узлам";
    if (swearingLevel === "high") {
      text = `Слышь, ${senderName}! Учись вязки узлов, бля! Вот тебе схема: Булинь, Прусик, Восьмерка и Стремя! Свяжи байдарку так, чтоб на волне не уплыла нахуй!`;
    } else {
      text = `Привет, ${senderName}! Держи наглядную схему вязки основных туристических узлов (Булинь, Прусик, Восьмерка, Грейпвайн) для слёта и похода!`;
    }
    imageUrl = KNOTS_DIAGRAM_SVG;
    attachments = [{ id: "att_knots", title: "Схемы вязки туристических узлов", url: KNOTS_DIAGRAM_SVG, type: "knots" }];
  } else if (isOrientQuery) {
    adapterStyleUsed = "Ориентирование на местности";
    if (swearingLevel === "high") {
      text = `Слышь, ${senderName}! Держи карту и знаки спортивного ориентирования, бля! Внимательно смотри легенду КП, чтоб не уйти в соседнее болото нахуй!`;
    } else {
      text = `Эй, ${senderName}! Вот официальная условная таблица топографических знаков для спортивного ориентирования на слёте!`;
    }
    imageUrl = ORIENTEERING_SIGNS_SVG;
    attachments = [{ id: "att_orient", title: "Знаки и символы спортивного ориентирования", url: ORIENTEERING_SIGNS_SVG, type: "orienteering" }];
  } else if (isScheduleQuery) {
    adapterStyleUsed = "График этапов слёта";
    if (swearingLevel === "high") {
      text = `Так, ${senderName}, вот тебе почасовой график соревнований на слёте, бля! Не проспи свой этап, а то команду дисквалифицируют нахуй!`;
    } else {
      text = `Привет, ${senderName}! Направляю расписание и график проведения соревновательных этапов нашего турслёта!`;
    }
    imageUrl = CONTEST_SCHEDULE_SVG;
    attachments = [{ id: "att_sched", title: "График соревнований и этапов слёта", url: CONTEST_SCHEDULE_SVG, type: "schedule" }];
  } else if (isContestQuery) {
    adapterStyleUsed = "Конкурсная программа слёта";
    const contestList = (contests || []).map((c: any) => `🏆 "${c.title}" (Капитан: ${c.captainName}, Место: ${c.place || "в процессе"})`).join("\n");
    if (swearingLevel === "high") {
      text = `Слышь, ${senderName}! Наш конкурсный список на слёте — огонь, бля:\n${contestList || "Пока конкурсы не внесены"}\nПрикрепляю схемы ориентирования, узлов и график соревнований! Порвём всех нахуй!`;
    } else {
      text = `Привет, ${senderName}! Вот программа конкурсов нашей команды на турслёте:\n${contestList || "Конкурсы готовятся"}\nВысылаю учебные схемы, карты и график этапов!`;
    }
    imageUrl = ORIENTEERING_SIGNS_SVG;
    attachments = [
      { id: "att_1", title: "Знаки спортивного ориентирования", url: ORIENTEERING_SIGNS_SVG, type: "orienteering" },
      { id: "att_2", title: "Схемы туристических узлов", url: KNOTS_DIAGRAM_SVG, type: "knots" },
      { id: "att_3", title: "График соревнований и этапов", url: CONTEST_SCHEDULE_SVG, type: "schedule" }
    ];
  } else if (hasInventoryKeywords) {
    adapterStyleUsed = "Проверка снаряжения";
    const invList = (inventoryItems || []).map((i: any) => `"${i.name}" [Состояние: ${i.condition}] (Хранитель: ${i.responsibleName})`).join("; ");
    if (invList) {
      if (swearingLevel === "high") {
        text = `Так, ${senderName}, по шмоткам и снаряге расклад такой, бля: ${invList}! Хранители вечно где-то тусят, так что перед выездом проверьте дыры в палаточных тентах и не просрите пилы нахуй!`;
      } else {
        text = `Вот реестр нашего общекомандного имущества и снаряжения: ${invList}. Убедитесь, что всё сухое и готово к походу!`;
      }
    } else {
      text = `Инвентарь пока пуст. Зарегистрируйте палатки, котлы и топоры в админке!`;
    }
  } else {
    // Highly tailored mock response for all 15 psychotypes
    switch (detectedPsychotype) {
      case "Душнила-контролёр":
        adapterStyleUsed = "Душное тушение";
        if (swearingLevel === "high") {
          text = `Слышай, ${senderName}, ну ты и душнила, пиздец! Засунь свой Excel в рюкзак поглубже и накати бальзама с шишками нахуй! Давай лучше дрова пилить, экономист грёбаный!`;
        } else if (swearingLevel === "medium") {
          text = `Опять пошли занудные формулы, бля! ${senderName}, кончай душнить у костра, а то дым по законам физики пойдет прямо на тебя! Расслабься, поход — это хаос!`;
        } else {
          text = `Уважаемый финансовый аудитор ${senderName}! Ваш Excel-запрос принят, но мы тут у костра сидим — давай просто петь песни и жарить сосиски!`;
        }
        break;

      case "Паникёр-истерик":
        adapterStyleUsed = "Психотерапия пинком";
        if (swearingLevel === "high") {
          text = `Да кончай истерить нахуй, ${senderName}! Никакие медведи твой зад не съедят — они брезгуют паникёрами! А если промокнем — у нас есть 5 литров антифриза! Не ссы, бля!`;
        } else if (swearingLevel === "medium") {
          text = `Отставить панику, бля! ${senderName}, спокуха! Дождик — это просто бесплатный душ, а клещи боятся нашего угара. Держи кружку с бальзамом!`;
        } else {
          text = `Спокойствие! ${senderName}, паниковать в диком лесу вредно для нервов. Мы с вами, палатка прочная, костер горит — всё будет отлично!`;
        }
        break;

      case "Бунтарь-анархист":
        adapterStyleUsed = "Поддержка бунта";
        if (swearingLevel === "high") {
          text = `Гыыы, ${senderName}, красава, бля! Анархия — мать порядка! Давай сожжем инструкцию по безопасности, а палатку Лёхи Навигатора пустим на флаги! Полный рок-н-ролл нахуй!`;
        } else if (swearingLevel === "medium") {
          text = `Бунт на Киржаче? Полностью за, бля! ${senderName}, давай жахнем и устроим дикие танцы! Нафиг условности и тихий час!`;
        } else {
          text = `Наш человек! Правила созданы для того, чтобы их весело нарушать под треск сосновых веток. Поддерживаю протест!`;
        }
        break;

      case "Походный шеф-повар":
        adapterStyleUsed = "Поварской поклон";
        if (swearingLevel === "high") {
          text = `Ооо, господин повар ${senderName}! Плов — это святое дело нахуй! Обещаем не мыть котел фейри, клянусь усами карася! Только плов, только курдюк, только хардкор, бля!`;
        } else if (swearingLevel === "medium") {
          text = `Юрец, спокуха, бля! Никто твой казан руками не тронет без разрешения! Твой плов — это пища богов, ждем костровой ужин!`;
        } else {
          text = `Шеф-повару уважение! На твоей стряпне держится весь моральный дух похода. Корми нас, кормилец, мы ценим твой труд!`;
        }
        break;

      case "Гитарист-романтик":
        adapterStyleUsed = "Подпевание в тон";
        if (swearingLevel === "high") {
          text = `Ооо, расчехляй гитару нахуй, ${senderName}! Если ещё раз запоешь 'Батарейку' — мы тебя к сосне привяжем, бля! Но КиШа — святое! Давай хуярь аккорды!`;
        } else if (swearingLevel === "medium") {
          text = `Гитара — огонь, бля! ${senderName}, запевай давай Сплина или ДДТ, подпоем как миленькие, особенно после стопочки у костра!`;
        } else {
          text = `Музыкальный вечер объявляется открытым! ${senderName}, сыграй нам что-нибудь душевное. Гитара у костра — лучшее в походе!`;
        }
        break;

      case "Ленивый лежебока":
        adapterStyleUsed = "Пинание сони";
        if (swearingLevel === "high") {
          text = `Просыпайся нахуй, ${senderName}! Хватит дрыхнуть до обеда, бля! Кто за тебя дрова таскать будет, Пушкин?! Подъем, иначе спальник обольем холодной водой!`;
        } else if (swearingLevel === "medium") {
          text = `Спишь опять, харя?! ${senderName}, кончай лениться, бля. Вставай, костер сам себя не растопит, да и каша стынет!`;
        } else {
          text = `Соня на связи! ${senderName}, просыпайся, пора на свежий воздух. Утро давно началось, все дела уже ждут!`;
        }
        break;

      case "Инста-туристка":
        adapterStyleUsed = "Помощь в поиске кадра";
        if (swearingLevel === "high") {
          text = `Слышь, блогерша, бля, ${senderName}! Какого хуя ты ищешь розетки в тайге?! Иди сфоткай корову или лопухи нахуй, будет тебе миллион лайков! Связи тут нет и пиздец!`;
        } else if (swearingLevel === "medium") {
          text = `Ой, опять фотосессия у каждой сосны, бля! ${senderName}, выключи телефон, лови реальный дзен, а не лайки в инсте!`;
        } else {
          text = `Наш главный репортер на связи! ${senderName}, кадры получаются супер, но не забывай смотреть под ноги и дышать чистым воздухом!`;
        }
        break;

      case "Клещевой ипохондрик":
        adapterStyleUsed = "Репеллентный стеб";
        if (swearingLevel === "high") {
          text = `Да не ссы ты за этих клещей нахуй, ${senderName}! Мы тебя обольем дихлофосом с ног до головы, бля! Они от одного твоего страха дохнуть будут на лету!`;
        } else if (swearingLevel === "medium") {
          text = `Прекрати пшикаться каждые сорок секунд, бля! ${senderName}, все клещи уже улетели в соседний лес от твоего амбре. Расслабься!`;
        } else {
          text = `Безопасность прежде всего! ${senderName}, не волнуйся, мы тебя осмотрим вечером у костра. Все живы и здоровы будем!`;
        }
        break;

      case "Бывалый выживальщик":
        adapterStyleUsed = "Выживальческий юмор";
        if (swearingLevel === "high") {
          text = `Слышь, Беар Гриллс комнатный, ${senderName}! Какого хуя у тебя четыре ножа и тактический шпагат?! Предлагаешь фильтровать воду носками и сожрать короеда, бля?! Давай зажигай костер огнивом быстрее!`;
        } else if (swearingLevel === "medium") {
          text = `Опять выживальческие байки, бля! ${senderName}, у нас есть тушняк и макароны, спрячь свое мачете. Но костер разведи образцовый!`;
        } else {
          text = `Настоящий профи лесного дела! ${senderName}, твоя экипировка впечатляет. Помоги нам разжечь дрова, они сыроваты после дождя.`;
        }
        break;

      case "Спортивный темп-лидер":
        adapterStyleUsed = "Осаживание лося";
        if (swearingLevel === "high") {
          text = `Куда ты ломишься как лось бешеный, ${senderName}?! Тормози нахуй, у нас котел с супом сзади плетется! Мы приехали отдыхать, а не сдавать нормы ГТО по тайге, бля!`;
        } else if (swearingLevel === "medium") {
          text = `Притормози коней, бля! ${senderName}, мы не на Олимпиаде. Если убежишь слишком далеко, плов будешь кушать виртуально!`;
        } else {
          text = `Спортсмен, потише! Дай ребятам насладиться лесом, а не просто бежать марафон по болотам. Давай сделаем привал!`;
        }
        break;

      case "Алко-турист":
        adapterStyleUsed = "Алко-кореш";
        if (swearingLevel === "high") {
          text = `Ооо, наш человек ${senderName}! Наливай по самый ободок, бля! Главное — не упасть лицом в костер и не перепутать палатку с медвежьей берлогой нахуй! По коням, грешники!`;
        } else if (swearingLevel === "medium") {
          text = `Слышь, баклажан, бля! ${senderName}, ты обувь свою нашел вообще? Закусывай тушняком пожирнее, а то завтра грести на байдарке будешь по кругу!`;
        } else {
          text = `Ого, веселье идет полным ходом! Наш главный ценитель походных напитков на связи. Главное — держись ближе к палаточному городку!`;
        }
        break;

      case "Эко-защитник":
        adapterStyleUsed = "Зеленый привет";
        if (swearingLevel === "high") {
          text = `Гринпис лесной, спокуха, бля! Никто пластик в речку кидать не будет — Лёха Навигатор заставит нарушителя этот пластик сожрать нахуй! Экология — заебись тема, мы за чистую тайгу!`;
        } else if (swearingLevel === "medium") {
          text = `Всё соберем в мешки, не ори, бля! ${senderName}, мы Негодяи, но культурные — за собой оставляем поляну чище, чем была. Улыбнись эко-патруль!`;
        } else {
          text = `Уважение к природе — закон! ${senderName}, мы обязательно соберем весь мусор до единого фантика. Лес ответит нам взаимностью!`;
        }
        break;

      case "Халявщик-забываха":
        adapterStyleUsed = "Дружеский нагоняй";
        if (swearingLevel === "high") {
          text = `Слышь, забываха хренов ${senderName}! Какого хуя ты опять без спальника приехал?! Ложку за тебя бот держать будет, бля?! Будешь хлебать суп ладошкой и спать на бревне у костра!`;
        } else if (swearingLevel === "medium") {
          text = `Опять всё дома оставил, бля?! Но главное настроение не забыл, халявщик ${senderName}! Ладно, ложку выстругаем веткой, спать пустим к Хорьку в палатку!`;
        } else {
          text = `Ну ты даешь! Опять забыл всё снаряжение. Хорошо, что команда Негодяев своих в беде не бросает — поделимся и ложкой, и палаткой, заходи!`;
        }
        break;

      case "Весельчак-балагур":
        adapterStyleUsed = "Угарный перепал";
        if (swearingLevel === "high") {
          text = `Ахаха, ${senderName}, жжёшь сука! Задорно пиздишь, давай пять, бля! Пора собирать рюкзаки и рвать в поход, жопа сама себя не приключит!`;
        } else if (swearingLevel === "medium") {
          text = `Красава, ${senderName}! Юмор зашёл, бля. С таким настроем мы любые горы свернём и весь тушняк уничтожим!`;
        } else {
          text = `Шутка огонь! ${senderName}, с тобой хоть в тайгу, хоть в горы. Всегда поднимешь настроение команде!`;
        }
        break;

      case "Тихий философ":
      default:
        adapterStyleUsed = "Дзенский угар";
        if (swearingLevel === "high") {
          text = `Уфф бля, ${senderName}, загнул глубоко! Жизнь — это просто вспышка спички у вечного костра, нахуй. Наливай чай, слушай треск сосны и лови космический дзен, пока тучи не разогнали наш шабаш!`;
        } else if (swearingLevel === "medium") {
          text = `Глубокомысленно глядишь, бля! ${senderName}, вселенная — это одна большая палатка, а мы в ней почетные гости у костра вечности. Накатим походного за космос!`;
        } else {
          text = `Великолепно сказано, философ! На фоне лесной тишины и звездного неба все споры о деньгах кажутся сущими пустяками. Поймаем дзен!`;
        }
        break;
    }
  }

  return {
    text,
    detectedPsychotype,
    detectedPsychotypeExplanation,
    adapterStyleUsed,
    imageUrl,
    attachments
  };
}

// Vite Server middleware integration for dev-mode or static build distribution of compiled files
async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Negodyai MAX Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
