export type UserRole = 
  | 'admin' 
  | 'treasurer' 
  | 'foreman' 
  | 'designer' 
  | 'assistant_captain' 
  | 'keeper' 
  | 'chef' 
  | 'member';

export interface RoleInfo {
  role: UserRole;
  title: string;
  badge: string;
  color: string;
  description: string;
  icon: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  admin: {
    role: 'admin',
    title: 'Администратор',
    badge: 'Админ',
    color: 'bg-red-600 text-white border-red-700',
    description: 'Полное управление сайтом, подтверждение участников и настройки команды',
    icon: '👑'
  },
  treasurer: {
    role: 'treasurer',
    title: 'Казначей фонда',
    badge: 'Казначей',
    color: 'bg-emerald-600 text-white border-emerald-700',
    description: 'Управление казной, сбор взносов и финансовая ведомость слёта',
    icon: '💰'
  },
  foreman: {
    role: 'foreman',
    title: 'Прораб',
    badge: 'Прораб',
    color: 'bg-amber-600 text-white border-amber-700',
    description: 'Ответственный за проведение строительных работ, обустройство лагеря и костровища',
    icon: '🔨'
  },
  designer: {
    role: 'designer',
    title: 'Дизайнер',
    badge: 'Дизайнер',
    color: 'bg-purple-600 text-white border-purple-700',
    description: 'Оформление лагеря, командная униформа, конкурс лагерей, сувенирная раздатка',
    icon: '🎨'
  },
  assistant_captain: {
    role: 'assistant_captain',
    title: 'Помощник капитана',
    badge: 'Пом. капитана',
    color: 'bg-blue-600 text-white border-blue-700',
    description: 'Правая рука капитана, оперативная координация команды и регламент слёта',
    icon: '🧭'
  },
  keeper: {
    role: 'keeper',
    title: 'Хранитель',
    badge: 'Хранитель',
    color: 'bg-teal-600 text-white border-teal-700',
    description: 'Управляет имуществом команды (палатки, шатры, казаны, генератор, инвентарь)',
    icon: '📦'
  },
  chef: {
    role: 'chef',
    title: 'Шеф-повар',
    badge: 'Шеф-повар',
    color: 'bg-orange-600 text-white border-orange-700',
    description: 'Командный повар: полевая кухня, меню слёта, костровой плов и сытость всей банды',
    icon: '👨‍🍳'
  },
  member: {
    role: 'member',
    title: 'Участник',
    badge: 'Негодяй',
    color: 'bg-stone-700 text-stone-100 border-stone-800',
    description: 'Член походного братства команды Негодяи',
    icon: '⛺'
  }
};

export type AccountStatus = 'pending' | 'active' | 'rejected';

export interface Participant {
  id: string;
  name: string;
  nickname: string;
  psychotype: string; // e.g. "Весельчак-балагур", "Душнила-контролёр", "Паникёр-истерик", "Тихий философ", "Бунтарь-анархист"
  avatar: string;
  paidAmount: number;
  totalCost: number;
  debtAmount: number; // calculated: totalCost - paidAmount
  joined: boolean;
  birthday?: string; // e.g., "YYYY-MM-DD"
  joinedYear: number; // год первого прихода в команду
  skippedYears: number[]; // года пропусков слета
  gender: 'male' | 'female';
  role?: UserRole; // 'admin' | 'treasurer' | 'member'
  email?: string;
  phone?: string;
  password?: string;
  accountStatus?: AccountStatus;
  biometricEnabled?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: AccountStatus;
  biometricEnabled: boolean;
  verificationMethod: 'sms' | 'email';
  isVerified: boolean;
  participantId?: string;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  year: number;
  title: string;
  description?: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  likes: number;
  likedUserIds?: string[];
}

export type TeamDocumentCategory = 'rally' | 'statutory' | 'prep';

export interface TeamDocument {
  id: string;
  category: TeamDocumentCategory;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'pdf' | 'doc' | 'image' | 'guide';
  content?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FundRecord {
  id: string;
  participantId: string;
  participantName: string;
  participantNickname: string;
  year: number;
  month: number; // 1 - 12
  amount: number; // 500
  isPaid: boolean;
  paidAt?: string;
  note?: string;
}

export type CreativityCategory = 
  | 'camp_design' 
  | 'carnival_costumes' 
  | 'camp_contests' 
  | 'posm_merch' 
  | 'team_clothing';

export interface IdeaComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CreativityIdea {
  id: string;
  category: CreativityCategory;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  imageUrl?: string;
  materialsBudget?: string;
  status: 'idea' | 'discussing' | 'approved' | 'in_progress' | 'done';
  votes: number;
  votedUserIds: string[];
  comments: IdeaComment[];
  createdAt: string;
}

export interface Excursion {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  costPerPerson: number;
  costBoys: number;
  costGirls: number;
  isActive: boolean;
}

export interface BotConfig {
  swearingLevel: 'low' | 'medium' | 'high'; // уровень матершинности
  autoDetectPsychotype: boolean;
  activePersonality: string; // текущий тон ИИ
  welcomeTemplate: string;
  foundingYear: number; // год основания команды
  customLogo?: string | null;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderNickname: string;
  senderPsychotype?: string; // psychotype of this message's sender
  text: string;
  timestamp: string;
  isBot: boolean;
  detectedPsychotypeExplanation?: string; // ИИ анализ психотипа
  adapterStyleUsed?: string; // Какую манеру ИИ применил
  imageUrl?: string; // Фото/картинка прикрепленная к сообщению
  attachments?: ContestAttachment[]; // Прикрепленные файлы/материалы
}

export interface TaskItem {
  id: string;
  title: string;
  assigneeId: string; // Participant ID
  assigneeName: string;
  deadline: string;
  isCompleted: boolean;
}

export interface MenuItem {
  id: string;
  day: string; // e.g., "День 1. Обед"
  dishName: string;
  description: string;
  chef?: string;
  ingredients?: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string; // e.g., "Еда" or "Расходники" or "Жидкая валюта"
  isBought: boolean;
  responsibleName?: string;
  estimatedCost?: number;
}

export type InventoryCondition = 'нормальное' | 'пришло в негодность' | 'пробухали нахер всё' | 'проёбано на слёте' | 'утонало к херам';

export interface InventoryItem {
  id: string;
  name: string;
  condition: InventoryCondition;
  responsibleName: string;
  quantity?: number;
}

export interface ContestAttachment {
  id: string;
  title: string; // e.g. "Правила конкурса", "График проведения", "Знаки ориентирования", "Способы вязки узлов"
  url: string; // base64 or URL
  type?: 'rules' | 'schedule' | 'orienteering' | 'knots' | 'other' | string;
}

export interface Contest {
  id: string;
  title: string;
  captainId: string; // Participant ID
  captainName: string; // Participant Name
  teamMemberIds: string[]; // List of Participant IDs in the mini team
  place?: string; // командное место занятое в конкурсе, e.g., "1-е место", "Призёр", ""
  description?: string; // Описание/правила конкурса
  schedule?: string; // График проведения
  imageUrl?: string; // Обложка/главное фото
  attachments?: ContestAttachment[]; // Прикреплённые фото, карты, схемы узлов и знаков
}

export type StoryCategory = 
  | 'logo' 
  | 'origin' 
  | 'sports' 
  | 'heroes' 
  | 'traditions' 
  | 'custom';

export interface TeamStory {
  id: string;
  category: StoryCategory;
  categoryTitle: string; // e.g. "История создания логотипа", "История образования команды", "Спортивные достижения команды", "Особо отличившиеся негодяи"
  title: string;
  content: string;
  photos: string[]; // URLs or base64
  videos: string[]; // URLs (YouTube/VK/Rutube embed or direct video file)
  authorName?: string;
  year?: number;
  createdAt: string;
}

