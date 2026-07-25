import { pgTable, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  psychotype: text("psychotype").notNull(),
  avatar: text("avatar").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  totalCost: integer("total_cost").notNull().default(0),
  debtAmount: integer("debt_amount").notNull().default(0),
  joined: boolean("joined").notNull().default(true),
  birthday: text("birthday"),
  joinedYear: integer("joined_year").notNull().default(2025),
  skippedYears: jsonb("skipped_years").$type<number[]>().notNull().default([]),
  gender: text("gender").notNull().default("boy")
});

export const excursions = pgTable("excursions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  costPerPerson: integer("cost_per_person").notNull().default(0),
  costBoys: integer("cost_boys").notNull().default(0),
  costGirls: integer("cost_girls").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true)
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  assigneeId: text("assignee_id").notNull(),
  assigneeName: text("assignee_name").notNull(),
  deadline: text("deadline").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false)
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  dishName: text("dish_name").notNull(),
  description: text("description").notNull()
});

export const groceryItems = pgTable("grocery_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  category: text("category").notNull(),
  isBought: boolean("is_bought").notNull().default(false)
});

export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  condition: text("condition").notNull(),
  responsibleName: text("responsible_name").notNull()
});

export const botConfig = pgTable("bot_config", {
  id: integer("id").primaryKey().default(1),
  swearingLevel: text("swearing_level").notNull().default("medium"),
  autoDetectPsychotype: boolean("auto_detect_psychotype").notNull().default(true),
  activePersonality: text("active_personality").notNull().default("Старожила слётов"),
  welcomeTemplate: text("welcome_template").notNull().default("Привет, {name}! Добро пожаловать на Слёт Негодяев!"),
  foundingYear: integer("founding_year").notNull().default(2018),
  customLogo: text("custom_logo")
});

export const contests = pgTable("contests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  captainId: text("captain_id").notNull(),
  captainName: text("captain_name").notNull(),
  teamMemberIds: jsonb("team_member_ids").$type<string[]>().notNull().default([]),
  place: text("place").default(""),
  description: text("description").default(""),
  schedule: text("schedule").default(""),
  imageUrl: text("image_url").default(""),
  attachments: jsonb("attachments").$type<{ id: string; title: string; url: string; type?: string }[]>().notNull().default([])
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  senderName: text("sender_name").notNull(),
  senderNickname: text("sender_nickname").notNull(),
  senderPsychotype: text("sender_psychotype").notNull(),
  text: text("text").notNull(),
  timestamp: text("timestamp").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  detectedPsychotypeExplanation: text("detected_psychotype_explanation"),
  adapterStyleUsed: text("adapter_style_used"),
  imageUrl: text("image_url"),
  attachments: jsonb("attachments").$type<{ id: string; title: string; url: string; type?: string }[]>()
});

export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().default(1),
  password: text("password").notNull().default("admin")
});
