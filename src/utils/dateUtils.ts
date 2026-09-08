/**
 * Utility functions for Russian date format DD.MM.YY (ДД.ММ.ГГ)
 * and birthday calculation.
 */

export interface ParsedBirthday {
  day: number;
  month: number;
  year: number; // 4-digit full year (e.g. 1988)
  shortYear: string; // 2-digit (e.g. "88")
  formatted: string; // "DD.MM.YY" (e.g. "14.05.81")
  fullFormatted: string; // "DD.MM.YYYY"
}

/**
 * Parses any birthday string (DD.MM.YY, DD.MM.YYYY, YYYY-MM-DD, DD/MM/YY)
 * into a structured object with full year, day, month, and DD.MM.YY format.
 */
export function parseBirthday(input?: string | null): ParsedBirthday | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let day = 0;
  let month = 0;
  let year = 0;

  // Case 1: DD.MM.YY or DD.MM.YYYY (dots or slashes)
  if (trimmed.includes('.') || trimmed.includes('/')) {
    const parts = trimmed.split(/[./]/).map(p => parseInt(p, 10));
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      day = parts[0];
      month = parts[1];
      year = 1990; // fallback if year wasn't supplied
    }
  } 
  // Case 2: ISO YYYY-MM-DD (dashes)
  else if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }
  }

  if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Convert 2-digit year to 4-digit year:
  // If year < 100: e.g. 81 -> 1981, 95 -> 1995, 05 -> 2005
  const currentFullYear = new Date().getFullYear();
  const currentTwoDigit = currentFullYear % 100; // e.g. 26
  if (year < 100) {
    if (year > currentTwoDigit) {
      year = 1900 + year;
    } else {
      year = 2000 + year;
    }
  }

  const dStr = day < 10 ? `0${day}` : `${day}`;
  const mStr = month < 10 ? `0${month}` : `${month}`;
  const yShort = String(year).slice(-2);

  return {
    day,
    month,
    year,
    shortYear: yShort,
    formatted: `${dStr}.${mStr}.${yShort}`,
    fullFormatted: `${dStr}.${mStr}.${year}`
  };
}

/**
 * Format any birthday string consistently into DD.MM.YY
 */
export function formatBirthdayShort(input?: string | null): string {
  const parsed = parseBirthday(input);
  if (!parsed) return input && input.trim() ? input : '—';
  return parsed.formatted;
}

/**
 * Validate if input matches DD.MM.YY format pattern
 */
export function isValidBirthdayShort(input: string): boolean {
  const parsed = parseBirthday(input);
  return parsed !== null;
}

/**
 * Calculate days until next birthday and age
 */
export function getBirthdayRemainingDays(bdayStr?: string | null): {
  days: number;
  isToday: boolean;
  dateFormatted: string;
  age?: number;
} | null {
  const parsed = parseBirthday(bdayStr);
  if (!parsed) return null;

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let targetDate = new Date(today.getFullYear(), parsed.month - 1, parsed.day);
  if (targetDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    targetDate = new Date(today.getFullYear() + 1, parsed.month - 1, parsed.day);
  }

  const diffTime = targetDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isToday = (parsed.month === currentMonth && parsed.day === currentDay);

  const age = today.getFullYear() - parsed.year;

  return {
    days,
    isToday,
    dateFormatted: parsed.formatted,
    age: age > 0 ? age : undefined
  };
}
