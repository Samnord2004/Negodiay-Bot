cat > server.ts << 'EOF'
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  initDb,
  getParticipants,
  saveParticipants,
  addOrUpdateParticipant,
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
  saveAdminPassword
} from "./db";

// Load environment variables
dotenv.config();

// Initialize the SQLite Database
initDb();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      inventoryItems
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
Ты — ИИ-бот по имени "Главный Негодяй" (Максимка) в групповом чате брутальной, но очень веселой и дружной походной команды "Негодяи". Эта банда обожает подшучивать над всеми, готовить плов, ходить по рекам, терять сапоги и сосиски.

Твоя цель — отвечать собеседнику уморительно, задорно, держать дух похода и обязательно использовать особенности из предоставленной конфигурации.

=== УРОВЕНЬ МАТЕРШИННЫХ СЛОВ (swearingLevel): "${swearingLevel}" ===
Строго соблюдай этот уровень для ответа:
- "low": Абсолютно без грубого мата. Используй шутливые, дерзкие и живые походные сленговые словечки: "тушканчики", "хрен вам", "засранцы", "фигня", "косячники", "ёлки-палки". Говори задорно и шумно!
- "medium": Разрешено умеренное, сочное использование классического юмористического мата ("бля", "пиздец", "ёптить", "заебись", "нахуй") как междометий для выражения сильных туристических чувств. Не оскорбляй собеседника лично, матерись исключительно по-дружески, выражая восторг, удивление или походную суровость!
- "high": Полный походный хардкор! Используй сочный, многоэтажный, но исключительно дружеский и уморительный русский мат, фольклорные связки и крутые походные ругательства ("какого хуя", "ёбаный карась", "пиздец котенку", "заебали в край"). Сделай это шедевром народного творчества, над которым поржёт вся команда! Но не скатывайся в унылое быдло — будь харизматичным Негодяем у костра.

=== ТВОЯ ПАМЯТЬ О ТУРАХ, СПЛАВАХ И ПОХОДАХ ===
Предстоящая программа туров, сплавов и организованных походов нашей банды:
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

=== ДНИ РОЖДЕНИЯ НАШЕЙ БАНДЫ ===
${birthdayContext}
${todayBirthdaysMention}

=== ИНСТРУКЦИИ ПО ТВОЕМУ ОТВЕТУ (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ!) ===
1. ОТВЕЧАЙ СТРОГО ТОМУ, КТО ЗАДАЛ ВОПРОС! В самом первом предложении твоего ответа ("text") ты обязан ЛИЧНО в дружеской, походной или подкольной форме обратиться к собеседнику \${senderName} (или по его никнейму @\${senderNickname}). Например: "Слышь, \${senderName}, по поводу...", "Эй, @\${senderNickname}, слушай сюда...", "\${senderName}, косячник походный, держи расклад...".
2. ТЫ ОБЯЗАН ОТВЕЧАТЬ ПО СУЩЕСТВУ НА ВОПРОСЫ ПО СЛЕДУЮЩИМ ТЕМАМ ИЗ КОНТЕКСТА:
   - Если спрашивают про деньги/долги/оплаты: зачитай список участников ведомости долгов \${debtsContext}, назови должников халявщиками или забывахами и назови их точные долги в рублях.
   - Если спрашивают про походные задачи/дела/дежурства: перечисли невыполненные задачи из списка \${tasksContext}, назови дедлайны и ответственных.
   - Если спрашивают про меню/еду/продукты/тушняк: зачитай костровое меню \${menuContext} и список продуктов, которые ОСТАЛОСЬ КУПИТЬ из списка \${groceryContext}.
   - Если спрашивают про палатки/пилы/инвентарь/снарягу: зачитай список имущества из \${inventoryContext}, назови хранителей вещей и их состояние на данный момент.
   - Если спрашивают про туры, сплавы, походы или куда едем: зачитай список туров, сплавов и походов \${excursionsContext}, назови даты, локации и стоимость.
   - Если спрашивают про дни рождения, днюху, поздравления или у кого-то сегодня праздник: зачитай список дней рождения ${birthdayContext}, перечисли именинников сегодня, и выдай невероятное, эпичное Негодяйское походное поздравление (например: пожелай крепкой печени, чтоб палатка не текла, тушенка была чисто один кусковой говяжий сок, кабаны за три версты оббегали, а в спальнике всегда было сухо и тепло)! Подколи их психотип!

В нашей банде ровно 15 угарных психотипов. Тебе нужно проанализировать последнее сообщение от \${senderName} (@\${senderNickname}) (его текущий заявленный тип: "\${senderPsychotype}") и тонко подстроиться под один из 15 психотипов:
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
\${recentHistoryText}

Новое сообщение от \${senderName} (@\${senderNickname}) [Психотип: \${senderPsychotype}]:
"\${cleanMessage}"

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
    // Извлекаем текст сообщения и имя отправителя из структуры MAX или старого формата
    let messageText = '';
    let senderName = '';
    let senderNickname = '';

    // Пробуем формат MAX: { message: { body: { text: '...' }, sender: { name: '...' } } }
    if (req.body.message && typeof req.body.message === 'object') {
      messageText = req.body.message.body?.text || req.body.message.text || '';
      senderName = req.body.message.sender?.name || '';
      senderNickname = req.body.message.sender?.name || '';
    } else {
      // Старый формат (curl, старый клиент)
      messageText = req.body.message || '';
      senderName = req.body.senderName || '';
      senderNickname = req.body.senderNickname || '';
    }

    // Если всё ещё пусто, пробуем другие возможные поля
    if (!messageText && typeof req.body.text === 'string') messageText = req.body.text;
    if (!senderName && req.body.senderName) senderName = req.body.senderName;

    if (!messageText || messageText.trim() === "") {
      console.error("No message text in request:", req.body);
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
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };
    addMessage(userMsg);

    const payload = await generateBotResponseInternal({
      ...req.body,
      message: messageText,
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

// Sync endpoints to preserve shared state between clients and the Telegram Bot
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
    messages: getMessages()
  });
});

app.post("/api/sync", (req, res) => {
  try {
    const { participants, excursions, tasks, menuItems, groceryItems, inventoryItems, botConfig, contests, messages } = req.body;
    if (participants) saveParticipants(participants);
    if (excursions) saveExcursions(excursions);
    if (tasks) saveTasks(tasks);
    if (menuItems) saveMenuItems(menuItems);
    if (groceryItems) saveGroceryItems(groceryItems);
    if (inventoryItems) saveInventoryItems(inventoryItems);
    if (botConfig) saveBotConfig(botConfig);
    if (contests) saveContests(contests);
    if (messages) saveMessages(messages);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating server sync:", err);
    res.status(500).json({ error: "Failed to update sync cache" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === getAdminPassword()) {
    return res.json({ success: true, message: "Вы вошли как администратор!" });
  }
  return res.status(401).json({ success: false, error: "Неправильный логин или пароль" });
});

app.post("/api/admin/change-password", (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim() === "") {
    return res.status(400).json({ success: false, error: "Пароль не может быть пустым" });
  }
  saveAdminPassword(newPassword);
  return res.json({ success: true, message: "Пароль администратора успешно изменен!" });
});

// Проверка вебхука (MAX может отправлять GET-запрос)
app.get("/api/bot-respond", (req, res) => {
  console.log("🔍 GET-запрос на вебхук получен");
  res.status(200).send("OK");
});

// МАКС Messenger Bot API is fully supported through the unified "/api/bot-respond" endpoint.
// Corporate webhooks or chat platforms can trigger bot operations by requesting "/api/bot-respond" directly.

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
  inventoryItems?: any[]
) {
  const msgLower = message.toLowerCase();
  let text = "";
  let detectedPsychotype = senderPsychotype;
  let detectedPsychotypeExplanation = `Общается в своей классической манере "${senderPsychotype}".`;
  let adapterStyleUsed = "Негодяйский походный подкол";

  // Check for birthday-related questions or trigger congrats!
  const isBirthdayQuery = msgLower.includes("днюх") || msgLower.includes("рожден") || msgLower.includes("поздрав");
  if (isBirthdayQuery) {
    adapterStyleUsed = "Днюшный походный разнос";
    let targetName = senderName;
    if (msgLower.includes("саня") || msgLower.includes("запева")) targetName = "Саня Запевала";
    else if (msgLower.includes("хорек") || msgLower.includes("андрюх")) targetName = "Андрюха Хорёк";
    else if (msgLower.includes("лех") || msgLower.includes("навига")) targetName = "Лёха Навигатор";
    else if (msgLower.includes("ириш") || msgLower.includes("бул")) targetName = "Иришка Булочка";
    else if (msgLower.includes("михалыч") || msgLower.includes("лесни")) targetName = "Михалыч Лесник";
    else if (msgLower.includes("юр") || msgLower.includes("манг")) targetName = "Юрец Мангальщик";
    else if (msgLower.includes("серег") || msgLower.includes("аккорд")) targetName = "Серёга Три-Аккорда";
    else if (msgLower.includes("данчик") || msgLower.includes("кипиш") || msgLower.includes("выжив")) targetName = "Данчик Кипиш";

    if (swearingLevel === "high") {
      text = `🎉 Ёбаный карась! У ${targetName} сегодня днюха, народ! Желаю тебе, чтоб печень не отказывала после походного спирта, бля! Чтоб палатка стояла железобетонно, кабаны за три версты оббегали, а тушенка всегда была чисто один кусковой жирнейший говяжий сок, нахуй! С праздником, Негодяй! 🍻🎂`;
    } else if (swearingLevel === "medium") {
      text = `🎉 Ух ты, у нас у ${targetName} днюха сегодня, бля! Поздравляю от всей души Негодяя! Желаю крепчайшего здоровья, сухой палатки, сочного плова в казане на костре и чтобы байдарки никогда нахуй не переворачивались! Ура команде! 🍲🥂`;
    } else {
      text = `🎉 Поздравляем нашего дорогого Негодяя ${targetName} с Днем Рождения! Желаем отличных походов, верных друзей у костра, теплого спальника и чтобы все сборы закрывались легко и позитивно! С Днём Рождения! 🎈⛺`;
    }
    return {
      text,
      detectedPsychotype: "Весельчак-балагур",
      detectedPsychotypeExplanation: "Поздравляет товарища с днюхой в самом лучшем куражном настроении!",
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

  // Handle Money or Excursion questions
  const hasMoneyKeywords = msgLower.includes("долг") || msgLower.includes("деньги") || msgLower.includes("бабл") || msgLower.includes("оплат") || msgLower.includes("скидывать") || msgLower.includes("задолж") || msgLower.includes("смет");
  const hasExcursionKeywords = msgLower.includes("сбор") || msgLower.includes("куда") || msgLower.includes("экскурс") || msgLower.includes("слет") || msgLower.includes("когда") || msgLower.includes("тур") || msgLower.includes("поход") || msgLower.includes("сплав");

  const debtors = debts.filter(d => d.debtAmount > 0);
  const totalDebtors = debtors.map(d => `${d.name} (@${d.nickname} - ${d.debtAmount}р)`).join(", ");

  if (hasMoneyKeywords) {
    adapterStyleUsed = "Финансовая порка косячников";
    if (debtors.length > 0) {
      if (swearingLevel === "high") {
        text = `Слышь, ${senderName}! По бабкам тут полный пиздец! Должники опять зажали взносы, бля. Пинаем халявщиков толпой: ${totalDebtors}. Какого хуя сметы стоят?! Быстро скинулись нахуй, иначе будете спать на сырых шишках и грызть кору вместо шашлыка!`;
      } else if (swearingLevel === "medium") {
        text = `Так, банда! Смета горит, бля. Наши забывчивые негодяи: ${totalDebtors} — вы задолжали! Давайте скидывайтесь оперативнее, нахуй, надо уже закупать тушняк, казан и бронировать гидов!`;
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
        text = `Эй, банда Негодяев! Наш грандиозный поход всё ближе: ${excNames}. Готовим хорошее настроение и пакуем походные рюкзаки. Это будет незабываемо!`;
      }
    } else {
      text = `Активных туров нет. Сидим греем задницы у костра и ждем, когда админ добавит новый угарный маршрут!`;
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
          text = `Ну ты даешь! Опять забыл всё снаряжение. Хорошо, что банда Негодяев своих в беде не бросает — поделимся и ложкой, и палаткой, заходи!`;
        }
        break;

      case "Весельчак-балагур":
        adapterStyleUsed = "Угарный перепал";
        if (swearingLevel === "high") {
          text = `Ахаха, ${senderName}, жжёшь сука! Задорно пиздишь, давай пять, бля! Пора собирать рюкзаки и рвать в поход, жопа сама себя не приключит!`;
        } else if (swearingLevel === "medium") {
          text = `Красава, ${senderName}! Юмор зашёл, бля. С таким настроем мы любые горы свернём и весь тушняк уничтожим!`;
        } else {
          text = `Шутка огонь! ${senderName}, с тобой хоть в тайгу, хоть в горы. Всегда поднимешь настроение банде!`;
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
  };
}

// Serve static files from the "dist" folder (built frontend)
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Negodyai MAX Server] Running on http://localhost:${PORT}`);
});
