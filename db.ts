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
  initialMessages,
  initialPhotos,
  initialDocuments,
  initialFundRecords,
  initialCreativityIdeas,
  INITIAL_STORIES
} from "./src/mockData";
import { 
  Participant, 
  Excursion, 
  TaskItem, 
  MenuItem, 
  GroceryItem, 
  InventoryItem, 
  BotConfig, 
  Contest, 
  ChatMessage,
  GalleryPhoto,
  TeamDocument,
  FundRecord,
  CreativityIdea,
  TeamStory,
  UserRole,
  AccountStatus
} from "./src/types";

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
let cachePhotos: GalleryPhoto[] = [];
let cacheDocuments: TeamDocument[] = [];
let cacheFundRecords: FundRecord[] = [];
let cacheCreativityIdeas: CreativityIdea[] = [];
let cacheStories: TeamStory[] = [];
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

      ALTER TABLE participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123';
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS gallery_photos (
        id TEXT PRIMARY KEY,
        year INT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        image_url TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        likes INT NOT NULL DEFAULT 0,
        liked_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS team_documents (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        file_url TEXT,
        file_name TEXT,
        file_type TEXT DEFAULT 'pdf',
        content TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fund_records (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        participant_name TEXT NOT NULL,
        participant_nickname TEXT NOT NULL,
        year INT NOT NULL,
        month INT NOT NULL,
        amount INT NOT NULL DEFAULT 500,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        paid_at TEXT,
        note TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS creativity_ideas (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        image_url TEXT,
        materials_budget TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'idea',
        votes INT NOT NULL DEFAULT 0,
        voted_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        comments JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS team_stories (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        category_title TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        photos JSONB NOT NULL DEFAULT '[]'::jsonb,
        videos JSONB NOT NULL DEFAULT '[]'::jsonb,
        author_name TEXT,
        year INT,
        created_at TEXT NOT NULL
      );

      -- Purge bot messages from team internal chat as requested by user
      DELETE FROM messages WHERE is_bot = TRUE OR sender_nickname = 'negodyai_bot';
      -- Clean up mock bots: only keep Captain ('3') and real user accounts
      DELETE FROM participants WHERE id IN ('1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20') AND id != '3';
      DELETE FROM messages WHERE sender_name IN ('Андрюха Хорёк', 'Иришка Булочка', 'Михалыч Лесник', 'Саня Запевала');
      DELETE FROM fund_records WHERE participant_id IN ('1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20') AND participant_id != '3';
      UPDATE participants SET avatar = '' WHERE avatar LIKE '%dicebear.com/7.x/bottts%';
    `);

    // Load or seed Participants
    const resP = await pool.query("SELECT * FROM participants");
    if (resP.rows.length === 0) {
      for (const p of initialParticipants) {
        await pool.query(
          `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender, role, email, phone, password, account_status, biometric_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender, p.role || 'admin', p.email || '', p.phone || '', p.password || 'admin', p.accountStatus || 'active', p.biometricEnabled || false]
        );
      }
      cacheParticipants = [...initialParticipants];
    } else {
      cacheParticipants = resP.rows.map(r => ({
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        psychotype: r.psychotype,
        avatar: (r.avatar && !r.avatar.includes("dicebear.com/7.x/bottts")) ? r.avatar : "",
        paidAmount: Number(r.paid_amount),
        totalCost: Number(r.total_cost),
        debtAmount: Number(r.debt_amount),
        joined: Boolean(r.joined),
        birthday: r.birthday || undefined,
        joinedYear: Number(r.joined_year),
        skippedYears: Array.isArray(r.skipped_years) ? r.skipped_years : JSON.parse(r.skipped_years || "[]"),
        gender: r.gender,
        role: (r.role as UserRole) || (r.id === "3" ? "admin" : "member"),
        email: r.email || (r.id === "3" ? "admin@negodyai.club" : undefined),
        phone: r.phone || undefined,
        password: r.password || (r.id === "3" ? "admin" : "123"),
        accountStatus: (r.account_status as AccountStatus) || "active",
        biometricEnabled: Boolean(r.biometric_enabled)
      }));

      // Ensure at least one admin exists in cache (Captain)
      const hasAdmin = cacheParticipants.some(p => p.role === 'admin');
      if (!hasAdmin && cacheParticipants.length > 0) {
        cacheParticipants[0].role = 'admin';
        cacheParticipants[0].password = 'admin';
        await pool.query("UPDATE participants SET role = 'admin', password = 'admin' WHERE id = $1", [cacheParticipants[0].id]);
      }
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

    // Load or seed Gallery Photos
    const resPh = await pool.query("SELECT * FROM gallery_photos ORDER BY year DESC, uploaded_at DESC");
    if (resPh.rows.length === 0) {
      for (const ph of initialPhotos) {
        await pool.query(
          `INSERT INTO gallery_photos (id, year, title, description, image_url, uploaded_by, uploaded_at, likes, liked_user_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          [ph.id, ph.year, ph.title, ph.description || "", ph.imageUrl, ph.uploadedBy, ph.uploadedAt, ph.likes, JSON.stringify(ph.likedUserIds || [])]
        );
      }
      cachePhotos = [...initialPhotos];
    } else {
      cachePhotos = resPh.rows.map(r => ({
        id: r.id,
        year: Number(r.year),
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.uploaded_at,
        likes: Number(r.likes),
        likedUserIds: Array.isArray(r.liked_user_ids) ? r.liked_user_ids : JSON.parse(r.liked_user_ids || "[]")
      }));
    }

    // Load or seed Team Documents
    const resDoc = await pool.query("SELECT * FROM team_documents ORDER BY uploaded_at DESC");
    if (resDoc.rows.length === 0) {
      for (const d of initialDocuments) {
        await pool.query(
          `INSERT INTO team_documents (id, category, title, description, file_url, file_name, file_type, content, uploaded_by, uploaded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          [d.id, d.category, d.title, d.description, d.fileUrl || null, d.fileName || null, d.fileType || "pdf", d.content || null, d.uploadedBy, d.uploadedAt]
        );
      }
      cacheDocuments = [...initialDocuments];
    } else {
      cacheDocuments = resDoc.rows.map(r => ({
        id: r.id,
        category: r.category,
        title: r.title,
        description: r.description,
        fileUrl: r.file_url || undefined,
        fileName: r.file_name || undefined,
        fileType: r.file_type || undefined,
        content: r.content || undefined,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.uploaded_at
      }));
    }

    // Load or seed Fund Records
    const resF = await pool.query("SELECT * FROM fund_records ORDER BY year DESC, month ASC");
    if (resF.rows.length === 0) {
      for (const f of initialFundRecords) {
        await pool.query(
          `INSERT INTO fund_records (id, participant_id, participant_name, participant_nickname, year, month, amount, is_paid, paid_at, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          [f.id, f.participantId, f.participantName, f.participantNickname, f.year, f.month, f.amount, f.isPaid, f.paidAt || null, f.note || ""]
        );
      }
      cacheFundRecords = [...initialFundRecords];
    } else {
      cacheFundRecords = resF.rows.map(r => ({
        id: r.id,
        participantId: r.participant_id,
        participantName: r.participant_name,
        participantNickname: r.participant_nickname,
        year: Number(r.year),
        month: Number(r.month),
        amount: Number(r.amount),
        isPaid: Boolean(r.is_paid),
        paidAt: r.paid_at || undefined,
        note: r.note || ""
      }));
    }

    // Load or seed Creativity Ideas
    const resIdea = await pool.query("SELECT * FROM creativity_ideas ORDER BY created_at DESC");
    if (resIdea.rows.length === 0) {
      for (const idea of initialCreativityIdeas) {
        await pool.query(
          `INSERT INTO creativity_ideas (id, category, title, description, author_id, author_name, image_url, materials_budget, status, votes, voted_user_ids, comments, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
          [idea.id, idea.category, idea.title, idea.description, idea.authorId, idea.authorName, idea.imageUrl || null, idea.materialsBudget || "", idea.status, idea.votes, JSON.stringify(idea.votedUserIds || []), JSON.stringify(idea.comments || []), idea.createdAt]
        );
      }
      cacheCreativityIdeas = [...initialCreativityIdeas];
    } else {
      cacheCreativityIdeas = resIdea.rows.map(r => ({
        id: r.id,
        category: r.category,
        title: r.title,
        description: r.description,
        authorId: r.author_id,
        authorName: r.author_name,
        imageUrl: r.image_url || undefined,
        materialsBudget: r.materials_budget || "",
        status: r.status,
        votes: Number(r.votes),
        votedUserIds: Array.isArray(r.voted_user_ids) ? r.voted_user_ids : JSON.parse(r.voted_user_ids || "[]"),
        comments: Array.isArray(r.comments) ? r.comments : JSON.parse(r.comments || "[]"),
        createdAt: r.created_at
      }));
    }

    // Load or seed Team Stories
    const resStories = await pool.query("SELECT * FROM team_stories ORDER BY created_at ASC");
    if (resStories.rows.length === 0) {
      for (const s of INITIAL_STORIES) {
        await pool.query(
          `INSERT INTO team_stories (id, category, category_title, title, content, photos, videos, author_name, year, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          [s.id, s.category, s.categoryTitle, s.title, s.content, JSON.stringify(s.photos || []), JSON.stringify(s.videos || []), s.authorName || "", s.year || 2018, s.createdAt]
        );
      }
      cacheStories = [...INITIAL_STORIES];
    } else {
      cacheStories = resStories.rows.map(r => ({
        id: r.id,
        category: r.category,
        categoryTitle: r.category_title,
        title: r.title,
        content: r.content,
        photos: Array.isArray(r.photos) ? r.photos : JSON.parse(r.photos || "[]"),
        videos: Array.isArray(r.videos) ? r.videos : JSON.parse(r.videos || "[]"),
        authorName: r.author_name || undefined,
        year: r.year ? Number(r.year) : undefined,
        createdAt: r.created_at
      }));
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
      for (const p of participants) {
        await pool.query(
          `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender, role, email, phone, password, account_status, biometric_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, nickname = EXCLUDED.nickname, psychotype = EXCLUDED.psychotype, avatar = EXCLUDED.avatar,
           paid_amount = EXCLUDED.paid_amount, total_cost = EXCLUDED.total_cost, debt_amount = EXCLUDED.debt_amount,
           joined = EXCLUDED.joined, birthday = EXCLUDED.birthday, joined_year = EXCLUDED.joined_year,
           skipped_years = EXCLUDED.skipped_years, gender = EXCLUDED.gender,
           role = EXCLUDED.role, email = EXCLUDED.email, phone = EXCLUDED.phone, password = EXCLUDED.password,
           account_status = EXCLUDED.account_status, biometric_enabled = EXCLUDED.biometric_enabled`,
          [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender, p.role || 'member', p.email || '', p.phone || '', p.password || '123', p.accountStatus || 'active', p.biometricEnabled || false]
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
        `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender, role, email, phone, password, account_status, biometric_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, nickname = EXCLUDED.nickname, psychotype = EXCLUDED.psychotype, avatar = EXCLUDED.avatar,
         paid_amount = EXCLUDED.paid_amount, total_cost = EXCLUDED.total_cost, debt_amount = EXCLUDED.debt_amount,
         joined = EXCLUDED.joined, birthday = EXCLUDED.birthday, joined_year = EXCLUDED.joined_year,
         skipped_years = EXCLUDED.skipped_years, gender = EXCLUDED.gender,
         role = EXCLUDED.role, email = EXCLUDED.email, phone = EXCLUDED.phone, password = EXCLUDED.password,
         account_status = EXCLUDED.account_status, biometric_enabled = EXCLUDED.biometric_enabled`,
        [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender, p.role || 'member', p.email || '', p.phone || '', p.password || '123', p.accountStatus || 'active', p.biometricEnabled || false]
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
  const unique = Array.from(new Map(excursions.map(e => [e.id, e])).values());
  cacheExcursions = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM excursions");
      for (const e of unique) {
        await client.query(
          `INSERT INTO excursions (id, title, date, location, description, cost_per_person, cost_boys, cost_girls, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, date = EXCLUDED.date, location = EXCLUDED.location,
           description = EXCLUDED.description, cost_per_person = EXCLUDED.cost_per_person,
           cost_boys = EXCLUDED.cost_boys, cost_girls = EXCLUDED.cost_girls, is_active = EXCLUDED.is_active`,
          [e.id, e.title, e.date, e.location, e.description, e.costPerPerson, e.costBoys, e.costGirls, e.isActive]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveExcursions error:", e);
    } finally {
      client.release();
    }
  })();
}

export function getTasks(): TaskItem[] {
  return cacheTasks;
}

export function saveTasks(tasks: TaskItem[]) {
  const unique = Array.from(new Map(tasks.map(t => [t.id, t])).values());
  cacheTasks = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM tasks");
      for (const t of unique) {
        await client.query(
          `INSERT INTO tasks (id, title, assignee_id, assignee_name, deadline, is_completed)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, assignee_id = EXCLUDED.assignee_id,
           assignee_name = EXCLUDED.assignee_name, deadline = EXCLUDED.deadline,
           is_completed = EXCLUDED.is_completed`,
          [t.id, t.title, t.assigneeId, t.assigneeName, t.deadline, t.isCompleted]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveTasks error:", e);
    } finally {
      client.release();
    }
  })();
}

export function getMenuItems(): MenuItem[] {
  return cacheMenuItems;
}

export function saveMenuItems(items: MenuItem[]) {
  const unique = Array.from(new Map(items.map(m => [m.id, m])).values());
  cacheMenuItems = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM menu_items");
      for (const m of unique) {
        await client.query(
          `INSERT INTO menu_items (id, day, dish_name, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           day = EXCLUDED.day, dish_name = EXCLUDED.dish_name, description = EXCLUDED.description`,
          [m.id, m.day, m.dishName, m.description]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveMenuItems error:", e);
    } finally {
      client.release();
    }
  })();
}

export function getGroceryItems(): GroceryItem[] {
  return cacheGroceryItems;
}

export function saveGroceryItems(items: GroceryItem[]) {
  const unique = Array.from(new Map(items.map(g => [g.id, g])).values());
  cacheGroceryItems = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM grocery_items");
      for (const g of unique) {
        await client.query(
          `INSERT INTO grocery_items (id, name, quantity, category, is_bought)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, quantity = EXCLUDED.quantity, category = EXCLUDED.category, is_bought = EXCLUDED.is_bought`,
          [g.id, g.name, g.quantity, g.category, g.isBought]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveGroceryItems error:", e);
    } finally {
      client.release();
    }
  })();
}

export function getInventoryItems(): InventoryItem[] {
  return cacheInventoryItems;
}

export function saveInventoryItems(items: InventoryItem[]) {
  const unique = Array.from(new Map(items.map(i => [i.id, i])).values());
  cacheInventoryItems = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM inventory_items");
      for (const i of unique) {
        await client.query(
          `INSERT INTO inventory_items (id, name, condition, responsible_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, condition = EXCLUDED.condition, responsible_name = EXCLUDED.responsible_name`,
          [i.id, i.name, i.condition, i.responsibleName]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveInventoryItems error:", e);
    } finally {
      client.release();
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
  const unique = Array.from(new Map(contests.map(c => [c.id, c])).values());
  cacheContests = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM contests");
      for (const c of unique) {
        await client.query(
          `INSERT INTO contests (id, title, captain_id, captain_name, team_member_ids, place, description, schedule, image_url, attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, captain_id = EXCLUDED.captain_id, captain_name = EXCLUDED.captain_name,
           team_member_ids = EXCLUDED.team_member_ids, place = EXCLUDED.place, description = EXCLUDED.description,
           schedule = EXCLUDED.schedule, image_url = EXCLUDED.image_url, attachments = EXCLUDED.attachments`,
          [c.id, c.title, c.captainId, c.captainName, JSON.stringify(c.teamMemberIds), c.place || "", c.description || "", c.schedule || "", c.imageUrl || "", JSON.stringify(c.attachments || [])]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveContests error:", e);
    } finally {
      client.release();
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
  const unique = Array.from(new Map(messages.map(m => [m.id, m])).values());
  cacheMessages = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM messages");
      for (const m of unique) {
        await client.query(
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
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveMessages error:", e);
    } finally {
      client.release();
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

// Participant Auth & Admin Moderation
export function approveParticipant(id: string) {
  const p = cacheParticipants.find(x => x.id === id);
  if (p) {
    p.accountStatus = "active";
    (async () => {
      try {
        await pool.query("UPDATE participants SET account_status = 'active' WHERE id = $1", [id]);
      } catch (e) {
        console.error("PSQL approveParticipant error:", e);
      }
    })();
  }
}

export function rejectParticipant(id: string) {
  const p = cacheParticipants.find(x => x.id === id);
  if (p) {
    p.accountStatus = "rejected";
    (async () => {
      try {
        await pool.query("UPDATE participants SET account_status = 'rejected' WHERE id = $1", [id]);
      } catch (e) {
        console.error("PSQL rejectParticipant error:", e);
      }
    })();
  }
}

export function updateParticipantRole(id: string, role: UserRole) {
  const p = cacheParticipants.find(x => x.id === id);
  if (p) {
    p.role = role;
    (async () => {
      try {
        await pool.query("UPDATE participants SET role = $1 WHERE id = $2", [role, id]);
      } catch (e) {
        console.error("PSQL updateParticipantRole error:", e);
      }
    })();
  }
}

export function updateParticipantPassword(id: string, newPass: string) {
  const p = cacheParticipants.find(x => x.id === id);
  if (p) {
    p.password = newPass;
    (async () => {
      try {
        await pool.query("UPDATE participants SET password = $1 WHERE id = $2", [newPass, id]);
      } catch (e) {
        console.error("PSQL updateParticipantPassword error:", e);
      }
    })();
  }
}

export function updateParticipantBiometrics(id: string, enabled: boolean) {
  const p = cacheParticipants.find(x => x.id === id);
  if (p) {
    p.biometricEnabled = enabled;
    (async () => {
      try {
        await pool.query("UPDATE participants SET biometric_enabled = $1 WHERE id = $2", [enabled, id]);
      } catch (e) {
        console.error("PSQL updateParticipantBiometrics error:", e);
      }
    })();
  }
}

export function registerNewParticipant(p: Participant) {
  cacheParticipants.push(p);
  (async () => {
    try {
      await pool.query(
        `INSERT INTO participants (id, name, nickname, psychotype, avatar, paid_amount, total_cost, debt_amount, joined, birthday, joined_year, skipped_years, gender, role, email, phone, password, account_status, biometric_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.name, p.nickname, p.psychotype, p.avatar, p.paidAmount, p.totalCost, p.debtAmount, p.joined, p.birthday || null, p.joinedYear, JSON.stringify(p.skippedYears), p.gender, p.role || 'member', p.email || '', p.phone || '', p.password || '123', p.accountStatus || 'pending', p.biometricEnabled || false]
      );
    } catch (e) {
      console.error("PSQL registerNewParticipant error:", e);
    }
  })();
}

// Gallery Photos
export function getPhotos(): GalleryPhoto[] {
  return cachePhotos;
}

export function addPhoto(photo: GalleryPhoto) {
  cachePhotos.unshift(photo);
  (async () => {
    try {
      await pool.query(
        `INSERT INTO gallery_photos (id, year, title, description, image_url, uploaded_by, uploaded_at, likes, liked_user_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
         year = EXCLUDED.year, title = EXCLUDED.title, description = EXCLUDED.description,
         image_url = EXCLUDED.image_url, uploaded_by = EXCLUDED.uploaded_by,
         uploaded_at = EXCLUDED.uploaded_at, likes = EXCLUDED.likes, liked_user_ids = EXCLUDED.liked_user_ids`,
        [photo.id, photo.year, photo.title, photo.description || "", photo.imageUrl, photo.uploadedBy, photo.uploadedAt, photo.likes, JSON.stringify(photo.likedUserIds || [])]
      );
    } catch (e) {
      console.error("PSQL addPhoto error:", e);
    }
  })();
}

export function deletePhoto(id: string) {
  cachePhotos = cachePhotos.filter(p => p.id !== id);
  (async () => {
    try {
      await pool.query("DELETE FROM gallery_photos WHERE id = $1", [id]);
    } catch (e) {
      console.error("PSQL deletePhoto error:", e);
    }
  })();
}

export function togglePhotoLike(photoId: string, userId: string) {
  const photo = cachePhotos.find(p => p.id === photoId);
  if (!photo) return;
  const liked = photo.likedUserIds.includes(userId);
  if (liked) {
    photo.likedUserIds = photo.likedUserIds.filter(id => id !== userId);
    photo.likes = Math.max(0, photo.likes - 1);
  } else {
    photo.likedUserIds.push(userId);
    photo.likes += 1;
  }
  (async () => {
    try {
      await pool.query("UPDATE gallery_photos SET likes = $1, liked_user_ids = $2 WHERE id = $3", [photo.likes, JSON.stringify(photo.likedUserIds), photo.id]);
    } catch (e) {
      console.error("PSQL togglePhotoLike error:", e);
    }
  })();
}

// Team Documents
export function getTeamDocuments(): TeamDocument[] {
  return cacheDocuments;
}

export function addTeamDocument(doc: TeamDocument) {
  cacheDocuments.unshift(doc);
  (async () => {
    try {
      await pool.query(
        `INSERT INTO team_documents (id, category, title, description, file_url, file_name, file_type, content, uploaded_by, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category, title = EXCLUDED.title, description = EXCLUDED.description,
         file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name, file_type = EXCLUDED.file_type,
         content = EXCLUDED.content, uploaded_by = EXCLUDED.uploaded_by, uploaded_at = EXCLUDED.uploaded_at`,
        [doc.id, doc.category, doc.title, doc.description, doc.fileUrl || null, doc.fileName || null, doc.fileType || "pdf", doc.content || null, doc.uploadedBy, doc.uploadedAt]
      );
    } catch (e) {
      console.error("PSQL addTeamDocument error:", e);
    }
  })();
}

export function deleteTeamDocument(id: string) {
  cacheDocuments = cacheDocuments.filter(d => d.id !== id);
  (async () => {
    try {
      await pool.query("DELETE FROM team_documents WHERE id = $1", [id]);
    } catch (e) {
      console.error("PSQL deleteTeamDocument error:", e);
    }
  })();
}

// Negodyai Fund
export function getFundRecords(): FundRecord[] {
  return cacheFundRecords;
}

export function saveFundRecords(records: FundRecord[]) {
  cacheFundRecords = [...records];
  (async () => {
    try {
      for (const f of records) {
        await pool.query(
          `INSERT INTO fund_records (id, participant_id, participant_name, participant_nickname, year, month, amount, is_paid, paid_at, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
           participant_name = EXCLUDED.participant_name, participant_nickname = EXCLUDED.participant_nickname,
           year = EXCLUDED.year, month = EXCLUDED.month, amount = EXCLUDED.amount,
           is_paid = EXCLUDED.is_paid, paid_at = EXCLUDED.paid_at, note = EXCLUDED.note`,
          [f.id, f.participantId, f.participantName, f.participantNickname, f.year, f.month, f.amount, f.isPaid, f.paidAt || null, f.note || ""]
        );
      }
    } catch (e) {
      console.error("PSQL saveFundRecords error:", e);
    }
  })();
}

export function updateFundRecord(id: string, updates: Partial<FundRecord>) {
  const index = cacheFundRecords.findIndex(f => f.id === id);
  if (index >= 0) {
    cacheFundRecords[index] = { ...cacheFundRecords[index], ...updates };
    const f = cacheFundRecords[index];
    (async () => {
      try {
        await pool.query(
          `UPDATE fund_records SET is_paid = $1, paid_at = $2, note = $3, amount = $4 WHERE id = $5`,
          [f.isPaid, f.paidAt || null, f.note || "", f.amount, f.id]
        );
      } catch (e) {
        console.error("PSQL updateFundRecord error:", e);
      }
    })();
  }
}

// Creativity & Ideas
export function getCreativityIdeas(): CreativityIdea[] {
  return cacheCreativityIdeas;
}

export function addCreativityIdea(idea: CreativityIdea) {
  cacheCreativityIdeas.unshift(idea);
  (async () => {
    try {
      await pool.query(
        `INSERT INTO creativity_ideas (id, category, title, description, author_id, author_name, image_url, materials_budget, status, votes, voted_user_ids, comments, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category, title = EXCLUDED.title, description = EXCLUDED.description,
         author_id = EXCLUDED.author_id, author_name = EXCLUDED.author_name,
         image_url = EXCLUDED.image_url, materials_budget = EXCLUDED.materials_budget,
         status = EXCLUDED.status, votes = EXCLUDED.votes, voted_user_ids = EXCLUDED.voted_user_ids,
         comments = EXCLUDED.comments, created_at = EXCLUDED.created_at`,
        [idea.id, idea.category, idea.title, idea.description, idea.authorId, idea.authorName, idea.imageUrl || null, idea.materialsBudget || "", idea.status, idea.votes, JSON.stringify(idea.votedUserIds || []), JSON.stringify(idea.comments || []), idea.createdAt]
      );
    } catch (e) {
      console.error("PSQL addCreativityIdea error:", e);
    }
  })();
}

export function updateCreativityIdea(id: string, updates: Partial<CreativityIdea>) {
  const index = cacheCreativityIdeas.findIndex(i => i.id === id);
  if (index >= 0) {
    cacheCreativityIdeas[index] = { ...cacheCreativityIdeas[index], ...updates };
    const idea = cacheCreativityIdeas[index];
    (async () => {
      try {
        await pool.query(
          `UPDATE creativity_ideas SET title = $1, description = $2, status = $3, materials_budget = $4, votes = $5, voted_user_ids = $6, comments = $7 WHERE id = $8`,
          [idea.title, idea.description, idea.status, idea.materialsBudget || "", idea.votes, JSON.stringify(idea.votedUserIds || []), JSON.stringify(idea.comments || []), idea.id]
        );
      } catch (e) {
        console.error("PSQL updateCreativityIdea error:", e);
      }
    })();
  }
}

export function toggleIdeaVote(ideaId: string, userId: string) {
  const idea = cacheCreativityIdeas.find(i => i.id === ideaId);
  if (!idea) return;
  const voted = idea.votedUserIds.includes(userId);
  if (voted) {
    idea.votedUserIds = idea.votedUserIds.filter(id => id !== userId);
    idea.votes = Math.max(0, idea.votes - 1);
  } else {
    idea.votedUserIds.push(userId);
    idea.votes += 1;
  }
  (async () => {
    try {
      await pool.query("UPDATE creativity_ideas SET votes = $1, voted_user_ids = $2 WHERE id = $3", [idea.votes, JSON.stringify(idea.votedUserIds), idea.id]);
    } catch (e) {
      console.error("PSQL toggleIdeaVote error:", e);
    }
  })();
}

export function addIdeaComment(ideaId: string, comment: { id: string; authorId: string; authorName: string; text: string; createdAt: string }) {
  const idea = cacheCreativityIdeas.find(i => i.id === ideaId);
  if (!idea) return;
  idea.comments.push(comment);
  (async () => {
    try {
      await pool.query("UPDATE creativity_ideas SET comments = $1 WHERE id = $2", [JSON.stringify(idea.comments), idea.id]);
    } catch (e) {
      console.error("PSQL addIdeaComment error:", e);
    }
  })();
}

// Team Stories & History
export function getStories(): TeamStory[] {
  return cacheStories;
}

export function addStory(story: TeamStory) {
  cacheStories.unshift(story);
  (async () => {
    try {
      await pool.query(
        `INSERT INTO team_stories (id, category, category_title, title, content, photos, videos, author_name, year, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category, category_title = EXCLUDED.category_title,
         title = EXCLUDED.title, content = EXCLUDED.content,
         photos = EXCLUDED.photos, videos = EXCLUDED.videos,
         author_name = EXCLUDED.author_name, year = EXCLUDED.year, created_at = EXCLUDED.created_at`,
        [story.id, story.category, story.categoryTitle, story.title, story.content, JSON.stringify(story.photos || []), JSON.stringify(story.videos || []), story.authorName || "", story.year || 2018, story.createdAt]
      );
    } catch (e) {
      console.error("PSQL addStory error:", e);
    }
  })();
}

export function updateStory(id: string, updates: Partial<TeamStory>) {
  const idx = cacheStories.findIndex(s => s.id === id);
  if (idx >= 0) {
    cacheStories[idx] = { ...cacheStories[idx], ...updates };
    const s = cacheStories[idx];
    (async () => {
      try {
        await pool.query(
          `UPDATE team_stories SET category = $1, category_title = $2, title = $3, content = $4, photos = $5, videos = $6, author_name = $7, year = $8 WHERE id = $9`,
          [s.category, s.categoryTitle, s.title, s.content, JSON.stringify(s.photos || []), JSON.stringify(s.videos || []), s.authorName || "", s.year || 2018, s.id]
        );
      } catch (e) {
        console.error("PSQL updateStory error:", e);
      }
    })();
  }
}

export function deleteStory(id: string) {
  cacheStories = cacheStories.filter(s => s.id !== id);
  (async () => {
    try {
      await pool.query("DELETE FROM team_stories WHERE id = $1", [id]);
    } catch (e) {
      console.error("PSQL deleteStory error:", e);
    }
  })();
}

export function saveStories(stories: TeamStory[]) {
  const unique = Array.from(new Map(stories.map(s => [s.id, s])).values());
  cacheStories = [...unique];
  (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM team_stories");
      for (const s of unique) {
        await client.query(
          `INSERT INTO team_stories (id, category, category_title, title, content, photos, videos, author_name, year, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
           category = EXCLUDED.category, category_title = EXCLUDED.category_title,
           title = EXCLUDED.title, content = EXCLUDED.content,
           photos = EXCLUDED.photos, videos = EXCLUDED.videos,
           author_name = EXCLUDED.author_name, year = EXCLUDED.year, created_at = EXCLUDED.created_at`,
          [s.id, s.category, s.categoryTitle, s.title, s.content, JSON.stringify(s.photos || []), JSON.stringify(s.videos || []), s.authorName || "", s.year || 2018, s.createdAt]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("PSQL saveStories error:", e);
    } finally {
      client.release();
    }
  })();
}
