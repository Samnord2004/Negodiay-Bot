import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
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

const dataDir = process.env.DATA_DIR || "/app/data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "data.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Helper to initialize Tables
export function initDb() {
  // 1. participants Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL,
      psychotype TEXT NOT NULL,
      avatar TEXT NOT NULL,
      paidAmount INTEGER NOT NULL,
      totalCost INTEGER NOT NULL,
      debtAmount INTEGER NOT NULL,
      joined INTEGER NOT NULL,
      birthday TEXT,
      joinedYear INTEGER NOT NULL,
      skippedYears TEXT NOT NULL,
      gender TEXT NOT NULL
    )
  `);

  // 2. excursions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS excursions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      costPerPerson INTEGER NOT NULL,
      costBoys INTEGER NOT NULL,
      costGirls INTEGER NOT NULL,
      isActive INTEGER NOT NULL
    )
  `);

  // 3. tasks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      assigneeId TEXT NOT NULL,
      assigneeName TEXT NOT NULL,
      deadline TEXT NOT NULL,
      isCompleted INTEGER NOT NULL
    )
  `);

  // 4. menu_items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      dishName TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

  // 5. grocery_items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity TEXT NOT NULL,
      category TEXT NOT NULL,
      isBought INTEGER NOT NULL
    )
  `);

  // 6. inventory_items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      condition TEXT NOT NULL,
      responsibleName TEXT NOT NULL
    )
  `);

  // 7. bot_config Table (a single row)
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      swearingLevel TEXT NOT NULL,
      autoDetectPsychotype INTEGER NOT NULL,
      activePersonality TEXT NOT NULL,
      welcomeTemplate TEXT NOT NULL,
      foundingYear INTEGER NOT NULL
    )
  `);

  // 8. contests Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      captainId TEXT NOT NULL,
      captainName TEXT NOT NULL,
      teamMemberIds TEXT NOT NULL,
      place TEXT
    )
  `);

  // 9. messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderName TEXT NOT NULL,
      senderNickname TEXT NOT NULL,
      senderPsychotype TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      isBot INTEGER NOT NULL,
      detectedPsychotypeExplanation TEXT,
      adapterStyleUsed TEXT
    )
  `);

  // 10. admin_settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      password TEXT NOT NULL
    )
  `);

  // Seed default admin password if not present
  const adminRow = db.prepare("SELECT * FROM admin_settings WHERE id = 1").get();
  if (!adminRow) {
    db.prepare("INSERT OR IGNORE INTO admin_settings (id, password) VALUES (1, 'admin')").run();
  }

  // Sync initial mock data if tables are empty
  const countParticipants = db.prepare("SELECT count(*) as count FROM participants").get() as { count: number };
  if (countParticipants.count === 0) {
    console.log("Seeding database with initial mock data...");
    seedInitialData();
  }
}

function seedInitialData() {
  db.transaction(() => {
    // Participants
    const insertParticipant = db.prepare(`
      INSERT INTO participants (id, name, nickname, psychotype, avatar, paidAmount, totalCost, debtAmount, joined, birthday, joinedYear, skippedYears, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of initialParticipants) {
      insertParticipant.run(
        p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount,
        p.joined ? 1 : 0, p.birthday || "", p.joinedYear, JSON.stringify(p.skippedYears), p.gender
      );
    }

    // Excursions
    const insertExcursion = db.prepare(`
      INSERT INTO excursions (id, title, date, location, description, costPerPerson, costBoys, costGirls, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const e of initialExcursions) {
      insertExcursion.run(e.id, e.title, e.date, e.location, e.description, e.costPerPerson, e.costBoys, e.costGirls, e.isActive ? 1 : 0);
    }

    // Tasks
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, title, assigneeId, assigneeName, deadline, isCompleted)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const t of initialTasks) {
      insertTask.run(t.id, t.title, t.assigneeId, t.assigneeName, t.deadline, t.isCompleted ? 1 : 0);
    }

    // Menu Items
    const insertMenuItem = db.prepare(`
      INSERT INTO menu_items (id, day, dishName, description)
      VALUES (?, ?, ?, ?)
    `);
    for (const m of initialMenuItems) {
      insertMenuItem.run(m.id, m.day, m.dishName, m.description);
    }

    // Grocery Items
    const insertGroceryItem = db.prepare(`
      INSERT INTO grocery_items (id, name, quantity, category, isBought)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const g of initialGroceryItems) {
      insertGroceryItem.run(g.id, g.name, g.quantity, g.category, g.isBought ? 1 : 0);
    }

    // Inventory Items
    const insertInventoryItem = db.prepare(`
      INSERT INTO inventory_items (id, name, condition, responsibleName)
      VALUES (?, ?, ?, ?)
    `);
    for (const i of initialInventoryItems) {
      insertInventoryItem.run(i.id, i.name, i.condition, i.responsibleName);
    }

    // Bot Config
    const insertBotConfig = db.prepare(`
      REPLACE INTO bot_config (id, swearingLevel, autoDetectPsychotype, activePersonality, welcomeTemplate, foundingYear)
      VALUES (1, ?, ?, ?, ?, ?)
    `);
    insertBotConfig.run(
      initialBotConfig.swearingLevel, initialBotConfig.autoDetectPsychotype ? 1 : 0,
      initialBotConfig.activePersonality, initialBotConfig.welcomeTemplate, initialBotConfig.foundingYear
    );

    // Contests
    const insertContest = db.prepare(`
      INSERT INTO contests (id, title, captainId, captainName, teamMemberIds, place)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const c of initialContests) {
      insertContest.run(c.id, c.title, c.captainId, c.captainName, JSON.stringify(c.teamMemberIds), c.place || "");
    }

    // Messages
    const insertMessage = db.prepare(`
      INSERT INTO messages (id, senderName, senderNickname, senderPsychotype, text, timestamp, isBot, detectedPsychotypeExplanation, adapterStyleUsed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of initialMessages) {
      insertMessage.run(
        m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp,
        m.isBot ? 1 : 0, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || ""
      );
    }
  });
}

// Data fetching helper functions
export function getParticipants(): Participant[] {
  const rows = db.prepare("SELECT * FROM participants").all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    nickname: r.nickname,
    psychotype: r.psychotype,
    avatar: r.avatar,
    paidAmount: Number(r.paidAmount),
    totalCost: Number(r.totalCost),
    debtAmount: Number(r.debtAmount),
    joined: r.joined === 1,
    birthday: r.birthday || undefined,
    joinedYear: Number(r.joinedYear),
    skippedYears: JSON.parse(r.skippedYears || "[]"),
    gender: r.gender as any
  }));
}

export function saveParticipants(participants: Participant[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM participants").run();
    const stmt = db.prepare(`
      INSERT INTO participants (id, name, nickname, psychotype, avatar, paidAmount, totalCost, debtAmount, joined, birthday, joinedYear, skippedYears, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of participants) {
      stmt.run(
        p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount,
        p.joined ? 1 : 0, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender
      );
    }
  })();
}

export function addOrUpdateParticipant(p: Participant) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO participants (id, name, nickname, psychotype, avatar, paidAmount, totalCost, debtAmount, joined, birthday, joinedYear, skippedYears, gender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount,
    p.joined ? 1 : 0, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender
  );
}

export function getExcursions(): Excursion[] {
  const rows = db.prepare("SELECT * FROM excursions").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    date: r.date,
    location: r.location,
    description: r.description,
    costPerPerson: Number(r.costPerPerson),
    costBoys: Number(r.costBoys),
    costGirls: Number(r.costGirls),
    isActive: r.isActive === 1
  }));
}

export function saveExcursions(excursions: Excursion[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM excursions").run();
    const stmt = db.prepare(`
      INSERT INTO excursions (id, title, date, location, description, costPerPerson, costBoys, costGirls, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const e of excursions) {
      stmt.run(e.id, e.title, e.date, e.location, e.description, e.costPerPerson, e.costBoys, e.costGirls, e.isActive ? 1 : 0);
    }
  })();
}

export function getTasks(): TaskItem[] {
  const rows = db.prepare("SELECT * FROM tasks").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    assigneeId: r.assigneeId,
    assigneeName: r.assigneeName,
    deadline: r.deadline,
    isCompleted: r.isCompleted === 1
  }));
}

export function saveTasks(tasks: TaskItem[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM tasks").run();
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, assigneeId, assigneeName, deadline, isCompleted)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const t of tasks) {
      stmt.run(t.id, t.title, t.assigneeId, t.assigneeName, t.deadline, t.isCompleted ? 1 : 0);
    }
  })();
}

export function getMenuItems(): MenuItem[] {
  const rows = db.prepare("SELECT * FROM menu_items").all() as any[];
  return rows.map(r => ({
    id: r.id,
    day: r.day,
    dishName: r.dishName,
    description: r.description
  }));
}

export function saveMenuItems(items: MenuItem[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM menu_items").run();
    const stmt = db.prepare(`
      INSERT INTO menu_items (id, day, dishName, description)
      VALUES (?, ?, ?, ?)
    `);
    for (const m of items) {
      stmt.run(m.id, m.day, m.dishName, m.description);
    }
  })();
}

export function getGroceryItems(): GroceryItem[] {
  const rows = db.prepare("SELECT * FROM grocery_items").all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    category: r.category,
    isBought: r.isBought === 1
  }));
}

export function saveGroceryItems(items: GroceryItem[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM grocery_items").run();
    const stmt = db.prepare(`
      INSERT INTO grocery_items (id, name, quantity, category, isBought)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const g of items) {
      stmt.run(g.id, g.name, g.quantity, g.category, g.isBought ? 1 : 0);
    }
  })();
}

export function getInventoryItems(): InventoryItem[] {
  const rows = db.prepare("SELECT * FROM inventory_items").all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    condition: r.condition as any,
    responsibleName: r.responsibleName
  }));
}

export function saveInventoryItems(items: InventoryItem[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM inventory_items").run();
    const stmt = db.prepare(`
      INSERT INTO inventory_items (id, name, condition, responsibleName)
      VALUES (?, ?, ?, ?)
    `);
    for (const i of items) {
      stmt.run(i.id, i.name, i.condition, i.responsibleName);
    }
  })();
}

export function getBotConfig(): BotConfig {
  const r = db.prepare("SELECT * FROM bot_config WHERE id = 1").get() as any;
  if (!r) {
    return initialBotConfig;
  }
  return {
    swearingLevel: r.swearingLevel as any,
    autoDetectPsychotype: r.autoDetectPsychotype === 1,
    activePersonality: r.activePersonality,
    welcomeTemplate: r.welcomeTemplate,
    foundingYear: Number(r.foundingYear)
  };
}

export function saveBotConfig(config: BotConfig) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO bot_config (id, swearingLevel, autoDetectPsychotype, activePersonality, welcomeTemplate, foundingYear)
    VALUES (1, ?, ?, ?, ?, ?)
  `);
  stmt.run(config.swearingLevel, config.autoDetectPsychotype ? 1 : 0, config.activePersonality, config.welcomeTemplate, config.foundingYear);
}

export function getContests(): Contest[] {
  const rows = db.prepare("SELECT * FROM contests").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    captainId: r.captainId,
    captainName: r.captainName,
    teamMemberIds: JSON.parse(r.teamMemberIds || "[]"),
    place: r.place || ""
  }));
}

export function saveContests(contests: Contest[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM contests").run();
    const stmt = db.prepare(`
      INSERT INTO contests (id, title, captainId, captainName, teamMemberIds, place)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const c of contests) {
      stmt.run(c.id, c.title, c.captainId, c.captainName, JSON.stringify(c.teamMemberIds), c.place || "");
    }
  })();
}

export function getMessages(): ChatMessage[] {
  const rows = db.prepare("SELECT * FROM messages").all() as any[];
  return rows.map(r => ({
    id: r.id,
    senderName: r.senderName,
    senderNickname: r.senderNickname,
    senderPsychotype: r.senderPsychotype,
    text: r.text,
    timestamp: r.timestamp,
    isBot: r.isBot === 1,
    detectedPsychotypeExplanation: r.detectedPsychotypeExplanation || undefined,
    adapterStyleUsed: r.adapterStyleUsed || undefined
  }));
}

export function addMessage(m: ChatMessage) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO messages (id, senderName, senderNickname, senderPsychotype, text, timestamp, isBot, detectedPsychotypeExplanation, adapterStyleUsed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp,
    m.isBot ? 1 : 0, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || ""
  );
}

export function saveMessages(messages: ChatMessage[]) {
  db.transaction(() => {
    db.prepare("DELETE FROM messages").run();
    const stmt = db.prepare(`
      INSERT INTO messages (id, senderName, senderNickname, senderPsychotype, text, timestamp, isBot, detectedPsychotypeExplanation, adapterStyleUsed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of messages) {
      stmt.run(
        m.id, m.senderName, m.senderNickname, m.senderPsychotype, m.text, m.timestamp,
        m.isBot ? 1 : 0, m.detectedPsychotypeExplanation || "", m.adapterStyleUsed || ""
      );
    }
  })();
}

export function getAdminPassword(): string {
  const row = db.prepare("SELECT password FROM admin_settings WHERE id = 1").get() as any;
  return row ? row.password : "admin";
}

export function saveAdminPassword(password: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO admin_settings (id, password)
    VALUES (1, ?)
  `);
  stmt.run(password);
}
