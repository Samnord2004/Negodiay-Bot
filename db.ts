import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "./src/db/schema";
import { 
  initialParticipants, 
  initialExcursions, 
  initialTasks, 
  initialMenuItems, 
  initialGroceryItems, 
  initialInventoryItems, 
  initialBotConfig,
  initialContests,
  initialMessages
} from "./src/mockData";
import { Participant, Excursion, TaskItem, MenuItem, GroceryItem, InventoryItem, BotConfig, Contest, ChatMessage } from "./src/types";

const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres";
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "";
const host = process.env.SQL_HOST || "127.0.0.1";
const database = process.env.SQL_DB_NAME || "cloud_sql_development_database";

export const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user,
        password,
        host,
        database,
        port: 5432,
      }
);

export const db = drizzle(pool, { schema });

// In-memory sync state backed asynchronously by PostgreSQL
let cacheParticipants: Participant[] = [];
let cacheExcursions: Excursion[] = [];
let cacheTasks: TaskItem[] = [];
let cacheMenuItems: MenuItem[] = [];
let cacheGroceryItems: GroceryItem[] = [];
let cacheInventoryItems: InventoryItem[] = [];
let cacheBotConfig: BotConfig = initialBotConfig;
let cacheContests: Contest[] = [];
let cacheMessages: ChatMessage[] = [];
let cacheAdminPassword = "admin";

export async function initDb() {
  try {
    // Ensure tables exist in PostgreSQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nickname TEXT NOT NULL,
        psychotype TEXT NOT NULL,
        avatar TEXT NOT NULL,
        paid_amount INT NOT NULL DEFAULT 0,
        total_cost INT NOT NULL DEFAULT 0,
        debt_amount INT NOT NULL DEFAULT 0,
        joined BOOLEAN NOT NULL DEFAULT TRUE,
        birthday TEXT,
        joined_year INT NOT NULL DEFAULT 2025,
        skipped_years JSONB NOT NULL DEFAULT '[]'::jsonb,
        gender TEXT NOT NULL DEFAULT 'boy'
      );

      CREATE TABLE IF NOT EXISTS excursions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        cost_per_person INT NOT NULL DEFAULT 0,
        cost_boys INT NOT NULL DEFAULT 0,
        cost_girls INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        assignee_id TEXT NOT NULL,
        assignee_name TEXT NOT NULL,
        deadline TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        dish_name TEXT NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS grocery_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        category TEXT NOT NULL,
        is_bought BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        condition TEXT NOT NULL,
        responsible_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bot_config (
        id INT PRIMARY KEY DEFAULT 1,
        swearing_level TEXT NOT NULL DEFAULT 'medium',
        auto_detect_psychotype BOOLEAN NOT NULL DEFAULT TRUE,
        active_personality TEXT NOT NULL DEFAULT 'Старожила слётов',
        welcome_template TEXT NOT NULL DEFAULT 'Привет, {name}! Добро пожаловать на Слёт Негодяев!',
        founding_year INT NOT NULL DEFAULT 2018,
        custom_logo TEXT
      );

      CREATE TABLE IF NOT EXISTS contests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        captain_id TEXT NOT NULL,
        captain_name TEXT NOT NULL,
        team_member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        place TEXT DEFAULT '',
        description TEXT DEFAULT '',
        schedule TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        attachments JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      ALTER TABLE contests ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT '';
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_name TEXT NOT NULL,
        sender_nickname TEXT NOT NULL,
        sender_psychotype TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_bot BOOLEAN NOT NULL DEFAULT FALSE,
        detected_psychotype_explanation TEXT,
        adapter_style_used TEXT,
        image_url TEXT,
        attachments JSONB
      );

      ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB;

      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT PRIMARY KEY DEFAULT 1,
        password TEXT NOT NULL DEFAULT 'admin'
      );
    `);

    // Load or seed Participants
    const resP = await pool.query("SELECT * FROM participants");
    if (resP.rows.length === 0) {
      for (const p of initialParticipants) {
        await pool.query(
          `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender]
        );
      }
      cacheParticipants = [...initialParticipants];
    } else {
      cacheParticipants = resP.rows.map(r => ({
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        psychotype: r.psychotype,
        avatar: r.avatar,
        paidAmount: Number(r.paid_amount),
        totalCost: Number(r.total_cost),
        debtAmount: Number(r.debt_amount),
        joined: Boolean(r.joined),
        birthday: r.birthday || undefined,
        joinedYear: Number(r.joined_year),
        skippedYears: Array.isArray(r.skipped_years) ? r.skipped_years : JSON.parse(r.skipped_years || "[]"),
        gender: r.gender
      }));
    }

    // Load or seed Excursions
    const resE = await pool.query("SELECT * FROM excursions");
    if (resE.rows.length === 0) {
      for (const e of initialExcursions) {
        await pool.query(
          `INSERT INTO excursions (id, title, date, location, description, cost_per_person, cost_boys, cost_girls, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          [e.id, e.title, e.date, e.location, e.description, e.costPerPerson, e.costBoys, e.costGirls, e.isActive]
        );
      }
      cacheExcursions = [...initialExcursions];
    } else {
      cacheExcursions = resE.rows.map(r => ({
        id: r.id,
        title: r.title,
        date: r.date,
        location: r.location,
        description: r.description,
        costPerPerson: Number(r.cost_per_person),
        costBoys: Number(r.cost_boys),
        costGirls: Number(r.cost_girls),
        isActive: Boolean(r.is_active)
      }));
    }

    // Load or seed Tasks
    const resT = await pool.query("SELECT * FROM tasks");
    if (resT.rows.length === 0) {
      for (const t of initialTasks) {
        await pool.query(
          `INSERT INTO tasks (id, title, assignee_id, assignee_name, deadline, is_completed)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [t.id, t.title, t.assigneeId, t.assigneeName, t.deadline, t.isCompleted]
        );
      }
      cacheTasks = [...initialTasks];
    } else {
      cacheTasks = resT.rows.map(r => ({
        id: r.id,
        title: r.title,
        assigneeId: r.assignee_id,
        assigneeName: r.assignee_name,
        deadline: r.deadline,
        isCompleted: Boolean(r.is_completed)
      }));
    }

    // Load or seed Menu Items
    const resM = await pool.query("SELECT * FROM menu_items");
    if (resM.rows.length === 0) {
      for (const m of initialMenuItems) {
        await pool.query(
          `INSERT INTO menu_items (id, day, dish_name, description)
           VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [m.id, m.day, m.dishName, m.description]
        );
      }
      cacheMenuItems = [...initialMenuItems];
    } else {
      cacheMenuItems = resM.rows.map(r => ({
        id: r.id,
        day: r.day,
        dishName: r.dish_name,
        description: r.description
      }));
    }

    // Load or seed Grocery Items
    const resG = await pool.query("SELECT * FROM grocery_items");
    if (resG.rows.length === 0) {
      for (const g of initialGroceryItems) {
        await pool.query(
          `INSERT INTO grocery_items (id, name, quantity, category, is_bought)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          [g.id, g.name, g.quantity, g.category, g.isBought]
        );
      }
      cacheGroceryItems = [...initialGroceryItems];
    } else {
      cacheGroceryItems = resG.rows.map(r => ({
        id: r.id,
        name: r.name,
        quantity: r.quantity,
        category: r.category,
        isBought: Boolean(r.is_bought)
      }));
    }

    // Load or seed Inventory Items
    const resI = await pool.query("SELECT * FROM inventory_items");
    if (resI.rows.length === 0) {
      for (const i of initialInventoryItems) {
        await pool.query(
          `INSERT INTO inventory_items (id, name, condition, responsible_name)
           VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [i.id, i.name, i.condition, i.responsibleName]
        );
      }
      cacheInventoryItems = [...initialInventoryItems];
    } else {
      cacheInventoryItems = resI.rows.map(r => ({
        id: r.id,
        name: r.name,
        condition: r.condition,
        responsibleName: r.responsible_name
      }));
    }

    // Load or seed Bot Config
    const resBC = await pool.query("SELECT * FROM bot_config WHERE id = 1");
    if (resBC.rows.length === 0) {
      await pool.query(
        `INSERT INTO bot_config (id, swearing_level, auto_detect_psychotype, active_personality, welcome_template, founding_year, custom_logo)
         VALUES (1, $1, $2, $3, $4, $5, $6)`,
        [initialBotConfig.swearingLevel, initialBotConfig.autoDetectPsychotype, initialBotConfig.activePersonality, initialBotConfig.welcomeTemplate, initialBotConfig.foundingYear, null]
      );
      cacheBotConfig = { ...initialBotConfig };
    } else {
      const r = resBC.rows[0];
      cacheBotConfig = {
        swearingLevel: r.swearing_level,
        autoDetectPsychotype: Boolean(r.auto_detect_psychotype),
        activePersonality: r.active_personality,
        welcomeTemplate: r.welcome_template,
        foundingYear: Number(r.founding_year),
        customLogo: r.custom_logo || null
      };
    }

    // Load or seed Contests
    const resC = await pool.query("SELECT * FROM contests");
    if (resC.rows.length === 0) {
      for (const c of initialContests) {
        await pool.query(
          `INSERT INTO contests (id, title, captain_id, captain_name, team_member_ids, place, description, schedule, image_url, attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.title, c.captainId, c.captainName, JSON.stringify(c.teamMemberIds), c.place || "", c.description || "", c.schedule || "", c.imageUrl || "", JSON.stringify(c.attachments || [])]
        );
      }
      cacheContests = [...initialContests];
    } else {
      cacheContests = resC.rows.map(r => ({
        id: r.id,
        title: r.title,
        captainId: r.captain_id,
        captainName: r.captain_name,
        teamMemberIds: Array.isArray(r.team_member_ids) ? r.team_member_ids : JSON.parse(r.team_member_ids || "[]"),
        place: r.place || "",
        description: r.description || "",
        schedule: r.schedule || "",
        imageUrl: r.image_url || "",
        attachments: Array.isArray(r.attachments) ? r.attachments : JSON.parse(r.attachments || "[]")
      }));
    }

    // Load or seed Messages
    const resMsg = await pool.query("SELECT * FROM messages");
    if (resMsg.rows.length === 0) {
      for (const m of initialMessages) {
        await pool.query(
          `INSERT INTO messages (id, sender_name, sender_nickname, sender_psychotype, text, timestamp, is_bot, detected_psychotype_explanation, adapter_style_used, image_url, attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
          [m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp, m.isBot, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || "", m.imageUrl || null, JSON.stringify(m.attachments || null)]
        );
      }
      cacheMessages = [...initialMessages];
    } else {
      cacheMessages = resMsg.rows.map(r => ({
        id: r.id,
        senderName: r.sender_name,
        senderNickname: r.sender_nickname,
        senderPsychotype: r.sender_psychotype,
        text: r.text,
        timestamp: r.timestamp,
        isBot: Boolean(r.is_bot),
        detectedPsychotypeExplanation: r.detected_psychotype_explanation || undefined,
        adapterStyleUsed: r.adapter_style_used || undefined,
        imageUrl: r.image_url || undefined,
        attachments: r.attachments ? (Array.isArray(r.attachments) ? r.attachments : JSON.parse(r.attachments)) : undefined
      }));
    }

    // Load or seed Admin Settings
    const resA = await pool.query("SELECT * FROM admin_settings WHERE id = 1");
    if (resA.rows.length === 0) {
      await pool.query("INSERT INTO admin_settings (id, password) VALUES (1, 'admin') ON CONFLICT (id) DO NOTHING");
      cacheAdminPassword = "admin";
    } else {
      cacheAdminPassword = resA.rows[0].password || "admin";
    }

    console.log("PostgreSQL database successfully initialized and synced.");
  } catch (err) {
    console.error("Error initializing PostgreSQL database:", err);
  }
}

// Data Getters and Setters with PSQL Persistence

export function getParticipants(): Participant[] {
  return cacheParticipants;
}

export function saveParticipants(participants: Participant[]) {
  cacheParticipants = [...participants];
  (async () => {
    try {
      await pool.query("DELETE FROM participants");
      for (const p of participants) {
        await pool.query(
          `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, nickname = EXCLUDED.nickname, psychotype = EXCLUDED.psychotype, avatar = EXCLUDED.avatar,
           paid_amount = EXCLUDED.paid_amount, total_cost = EXCLUDED.total_cost, debt_amount = EXCLUDED.debt_amount,
           joined = EXCLUDED.joined, birthday = EXCLUDED.birthday, joined_year = EXCLUDED.joined_year,
           skipped_years = EXCLUDED.skipped_years, gender = EXCLUDED.gender`,
          [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender]
        );
      }
    } catch (e) {
      console.error("PSQL saveParticipants error:", e);
    }
  })();
}

export function addOrUpdateParticipant(p: Participant) {
  const index = cacheParticipants.findIndex(x => x.id === p.id);
  if (index >= 0) cacheParticipants[index] = p;
  else cacheParticipants.push(p);

  (async () => {
    try {
      await pool.query(
        `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, nickname = EXCLUDED.nickname, psychotype = EXCLUDED.psychotype, avatar = EXCLUDED.avatar,
         paid_amount = EXCLUDED.paid_amount, total_cost = EXCLUDED.total_cost, debt_amount = EXCLUDED.debt_amount,
         joined = EXCLUDED.joined, birthday = EXCLUDED.birthday, joined_year = EXCLUDED.joined_year,
         skipped_years = EXCLUDED.skipped_years, gender = EXCLUDED.gender`,
        [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender]
      );
    } catch (e) {
      console.error("PSQL addOrUpdateParticipant error:", e);
    }
  })();
}

export function getExcursions(): Excursion[] {
  return cacheExcursions;
}

export function saveExcursions(excursions: Excursion[]) {
  cacheExcursions = [...excursions];
  (async () => {
    try {
      await pool.query("DELETE FROM excursions");
      for (const e of excursions) {
        await pool.query(
          `INSERT INTO excursions (id, title, date, location, description, cost_per_person, cost_boys, cost_girls, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, date = EXCLUDED.date, location = EXCLUDED.location,
           description = EXCLUDED.description, cost_per_person = EXCLUDED.cost_per_person,
           cost_boys = EXCLUDED.cost_boys, cost_girls = EXCLUDED.cost_girls, is_active = EXCLUDED.is_active`,
          [e.id, e.title, e.date, e.location, e.description, e.costPerPerson, e.costBoys, e.costGirls, e.isActive]
        );
      }
    } catch (e) {
      console.error("PSQL saveExcursions error:", e);
    }
  })();
}

export function getTasks(): TaskItem[] {
  return cacheTasks;
}

export function saveTasks(tasks: TaskItem[]) {
  cacheTasks = [...tasks];
  (async () => {
    try {
      await pool.query("DELETE FROM tasks");
      for (const t of tasks) {
        await pool.query(
          `INSERT INTO tasks (id, title, assignee_id, assignee_name, deadline, is_completed)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, assignee_id = EXCLUDED.assignee_id,
           assignee_name = EXCLUDED.assignee_name, deadline = EXCLUDED.deadline,
           is_completed = EXCLUDED.is_completed`,
          [t.id, t.title, t.assigneeId, t.assigneeName, t.deadline, t.isCompleted]
        );
      }
    } catch (e) {
      console.error("PSQL saveTasks error:", e);
    }
  })();
}

export function getMenuItems(): MenuItem[] {
  return cacheMenuItems;
}

export function saveMenuItems(items: MenuItem[]) {
  cacheMenuItems = [...items];
  (async () => {
    try {
      await pool.query("DELETE FROM menu_items");
      for (const m of items) {
        await pool.query(
          `INSERT INTO menu_items (id, day, dish_name, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           day = EXCLUDED.day, dish_name = EXCLUDED.dish_name, description = EXCLUDED.description`,
          [m.id, m.day, m.dishName, m.description]
        );
      }
    } catch (e) {
      console.error("PSQL saveMenuItems error:", e);
    }
  })();
}

export function getGroceryItems(): GroceryItem[] {
  return cacheGroceryItems;
}

export function saveGroceryItems(items: GroceryItem[]) {
  cacheGroceryItems = [...items];
  (async () => {
    try {
      await pool.query("DELETE FROM grocery_items");
      for (const g of items) {
        await pool.query(
          `INSERT INTO grocery_items (id, name, quantity, category, is_bought)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, quantity = EXCLUDED.quantity, category = EXCLUDED.category, is_bought = EXCLUDED.is_bought`,
          [g.id, g.name, g.quantity, g.category, g.isBought]
        );
      }
    } catch (e) {
      console.error("PSQL saveGroceryItems error:", e);
    }
  })();
}

export function getInventoryItems(): InventoryItem[] {
  return cacheInventoryItems;
}

export function saveInventoryItems(items: InventoryItem[]) {
  cacheInventoryItems = [...items];
  (async () => {
    try {
      await pool.query("DELETE FROM inventory_items");
      for (const i of items) {
        await pool.query(
          `INSERT INTO inventory_items (id, name, condition, responsible_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, condition = EXCLUDED.condition, responsible_name = EXCLUDED.responsible_name`,
          [i.id, i.name, i.condition, i.responsibleName]
        );
      }
    } catch (e) {
      console.error("PSQL saveInventoryItems error:", e);
    }
  })();
}

export function getBotConfig(): BotConfig {
  return cacheBotConfig;
}

export function saveBotConfig(config: BotConfig) {
  cacheBotConfig = { ...config };
  (async () => {
    try {
      await pool.query(
        `INSERT INTO bot_config (id, swearing_level, auto_detect_psychotype, active_personality, welcome_template, founding_year, custom_logo)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
         swearing_level = EXCLUDED.swearing_level,
         auto_detect_psychotype = EXCLUDED.auto_detect_psychotype,
         active_personality = EXCLUDED.active_personality,
         welcome_template = EXCLUDED.welcome_template,
         founding_year = EXCLUDED.founding_year,
         custom_logo = EXCLUDED.custom_logo`,
        [config.swearingLevel, config.autoDetectPsychotype, config.activePersonality, config.welcomeTemplate, config.foundingYear, config.customLogo || null]
      );
    } catch (e) {
      console.error("PSQL saveBotConfig error:", e);
    }
  })();
}

export function getContests(): Contest[] {
  return cacheContests;
}

export function saveContests(contests: Contest[]) {
  cacheContests = [...contests];
  (async () => {
    try {
      await pool.query("DELETE FROM contests");
      for (const c of contests) {
        await pool.query(
          `INSERT INTO contests (id, title, captain_id, captain_name, team_member_ids, place, description, schedule, image_url, attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, captain_id = EXCLUDED.captain_id, captain_name = EXCLUDED.captain_name,
           team_member_ids = EXCLUDED.team_member_ids, place = EXCLUDED.place, description = EXCLUDED.description,
           schedule = EXCLUDED.schedule, image_url = EXCLUDED.image_url, attachments = EXCLUDED.attachments`,
          [c.id, c.title, c.captainId, c.captainName, JSON.stringify(c.teamMemberIds), c.place || "", c.description || "", c.schedule || "", c.imageUrl || "", JSON.stringify(c.attachments || [])]
        );
      }
    } catch (e) {
      console.error("PSQL saveContests error:", e);
    }
  })();
}

export function getMessages(): ChatMessage[] {
  return cacheMessages;
}

export function addMessage(m: ChatMessage) {
  const index = cacheMessages.findIndex(x => x.id === m.id);
  if (index >= 0) cacheMessages[index] = m;
  else cacheMessages.push(m);

  (async () => {
    try {
      await pool.query(
        `INSERT INTO messages (id, sender_name, sender_nickname, sender_psychotype, text, timestamp, is_bot, detected_psychotype_explanation, adapter_style_used, image_url, attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
         sender_name = EXCLUDED.sender_name, sender_nickname = EXCLUDED.sender_nickname,
         sender_psychotype = EXCLUDED.sender_psychotype, text = EXCLUDED.text,
         timestamp = EXCLUDED.timestamp, is_bot = EXCLUDED.is_bot,
         detected_psychotype_explanation = EXCLUDED.detected_psychotype_explanation,
         adapter_style_used = EXCLUDED.adapter_style_used,
         image_url = EXCLUDED.image_url,
         attachments = EXCLUDED.attachments`,
        [m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp, m.isBot, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || "", m.imageUrl || null, JSON.stringify(m.attachments || null)]
      );
    } catch (e) {
      console.error("PSQL addMessage error:", e);
    }
  })();
}

export function saveMessages(messages: ChatMessage[]) {
  cacheMessages = [...messages];
  (async () => {
    try {
      await pool.query("DELETE FROM messages");
      for (const m of messages) {
        await pool.query(
          `INSERT INTO messages (id, sender_name, sender_nickname, sender_psychotype, text, timestamp, is_bot, detected_psychotype_explanation, adapter_style_used, image_url, attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
           sender_name = EXCLUDED.sender_name, sender_nickname = EXCLUDED.sender_nickname,
           sender_psychotype = EXCLUDED.sender_psychotype, text = EXCLUDED.text,
           timestamp = EXCLUDED.timestamp, is_bot = EXCLUDED.is_bot,
           detected_psychotype_explanation = EXCLUDED.detected_psychotype_explanation,
           adapter_style_used = EXCLUDED.adapter_style_used,
           image_url = EXCLUDED.image_url,
           attachments = EXCLUDED.attachments`,
          [m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp, m.isBot, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || "", m.imageUrl || null, JSON.stringify(m.attachments || null)]
        );
      }
    } catch (e) {
      console.error("PSQL saveMessages error:", e);
    }
  })();
}

export function getAdminPassword(): string {
  return cacheAdminPassword;
}

export function saveAdminPassword(password: string) {
  cacheAdminPassword = password;
  (async () => {
    try {
      await pool.query(
        `INSERT INTO admin_settings (id, password) VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password`,
        [password]
      );
    } catch (e) {
      console.error("PSQL saveAdminPassword error:", e);
    }
  })();
}
