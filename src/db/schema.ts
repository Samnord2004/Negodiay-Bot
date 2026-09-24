import { pgTable, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  psychotype: text("psychotype"),
  avatar: text("avatar").notNull(),
  photoFront: text("photo_front"),
  photoProfile: text("photo_profile"),
  selectedAvatarSource: text("selected_avatar_source").default("front"),
  paidAmount: integer("paid_amount").notNull().default(0),
  totalCost: integer("total_cost").notNull().default(0),
  debtAmount: integer("debt_amount").notNull().default(0),
  joined: boolean("joined").notNull().default(true),
  birthday: text("birthday"),
  joinedYear: integer("joined_year").notNull().default(1993),
  skippedYears: jsonb("skipped_years").$type<number[]>().notNull().default([]),
  gender: text("gender").notNull().default("boy"),
  role: text("role").default("member"),
  email: text("email").default(""),
  phone: text("phone").default(""),
  password: text("password").default("123"),
  accountStatus: text("account_status").default("active"),
  biometricEnabled: boolean("biometric_enabled").default(false)
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
  isActive: boolean("is_active").notNull().default(true),
  participantStatuses: jsonb("participant_statuses").$type<Record<string, any>>().default({})
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
  swearingLevel: text("swearing_level"),
  autoDetectPsychotype: boolean("auto_detect_psychotype"),
  activePersonality: text("active_personality").notNull().default("Старожила слётов"),
  welcomeTemplate: text("welcome_template").notNull().default("Привет, {name}! Добро пожаловать на Слёт Негодяев!"),
  foundingYear: integer("founding_year").notNull().default(1993),
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
  senderPsychotype: text("sender_psychotype"),
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

export const galleryPhotos = pgTable("gallery_photos", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  cloudUrl: text("cloud_url").default(""),
  itemType: text("item_type").default("photo"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  likes: integer("likes").notNull().default(0),
  likedUserIds: jsonb("liked_user_ids").$type<string[]>().notNull().default([])
});

export const teamDocuments = pgTable("team_documents", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type").default("pdf"),
  content: text("content"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: text("uploaded_at").notNull()
});

export const fundRecords = pgTable("fund_records", {
  id: text("id").primaryKey(),
  participantId: text("participant_id").notNull(),
  participantName: text("participant_name").notNull(),
  participantNickname: text("participant_nickname").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  amount: integer("amount").notNull().default(500),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: text("paid_at"),
  note: text("note").default("")
});

export const fundExpenses = pgTable("fund_expenses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  amount: integer("amount").notNull().default(0),
  date: text("date").notNull(),
  category: text("category").notNull(),
  spentBy: text("spent_by").notNull(),
  note: text("note"),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("approved"),
  submittedById: text("submitted_by_id"),
  submittedByName: text("submitted_by_name"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at")
});

export const creativityIdeas = pgTable("creativity_ideas", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  imageUrl: text("image_url"),
  materialsBudget: text("materials_budget").default(""),
  status: text("status").notNull().default("idea"),
  votes: integer("votes").notNull().default(0),
  votedUserIds: jsonb("voted_user_ids").$type<string[]>().notNull().default([]),
  comments: jsonb("comments").$type<any[]>().notNull().default([]),
  createdAt: text("created_at").notNull(),
  isArchived: boolean("is_archived").default(false),
  archivedAt: text("archived_at"),
  captainApproval: text("captain_approval"),
  captainApprovedAt: text("captain_approved_at"),
  captainNote: text("captain_note")
});

export const teamStories = pgTable("team_stories", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  categoryTitle: text("category_title").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  authorName: text("author_name"),
  year: integer("year"),
  createdAt: text("created_at").notNull()
});

export const rallyCoins = pgTable("rally_coins", {
  id: text("id").primaryKey(),
  participantId: text("participant_id").notNull(),
  participantName: text("participant_name").notNull(),
  participantNickname: text("participant_nickname").notNull(),
  participantAvatar: text("participant_avatar"),
  participantPhotoProfile: text("participant_photo_profile"),
  taskTitle: text("task_title").notNull(),
  category: text("category").notNull(),
  comment: text("comment"),
  awardedAt: text("awarded_at").notNull(),
  awardedBy: text("awarded_by").notNull(),
  year: integer("year").notNull().default(2026)
});

export const contestHistory = pgTable("contest_history", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  isOverall: boolean("is_overall").notNull().default(false),
  results: jsonb("results").$type<Record<string, string>>().notNull().default({})
});
