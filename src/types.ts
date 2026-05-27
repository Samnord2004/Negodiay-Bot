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
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderNickname: string;
  senderPsychotype: string; // psychotype of this message's sender
  text: string;
  timestamp: string;
  isBot: boolean;
  detectedPsychotypeExplanation?: string; // ИИ анализ психотипа
  adapterStyleUsed?: string; // Какую манеру ИИ применил
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
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string; // e.g., "Еда" or "Расходники" or "Жидкая валюта"
  isBought: boolean;
}

export type InventoryCondition = 'нормальное' | 'пришло в негодность' | 'пробухали нахер всё' | 'проёбано на слёте' | 'утонало к херам';

export interface InventoryItem {
  id: string;
  name: string;
  condition: InventoryCondition;
  responsibleName: string;
}

export interface Contest {
  id: string;
  title: string;
  captainId: string; // Participant ID
  captainName: string; // Participant Name
  teamMemberIds: string[]; // List of Participant IDs in the mini team
  place?: string; // командное место занятое в конкурсе, e.g., "1-е место", "Призёр", ""
}

