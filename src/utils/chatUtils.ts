import { ChatMessage } from '../types';

/**
 * Normalizes any timestamp string (e.g. "05:09 PM", "12:27 AM", "0:9", or Date)
 * into a uniform 24-hour Russian time format "HH:mm".
 */
export function formatChatTimestamp(ts?: string | Date | null): string {
  if (!ts) {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  }
  if (ts instanceof Date) {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(ts);
  }
  const str = String(ts).trim();
  // Match 12-hour format like "05:09 PM", "5:09 pm", "12:27 AM"
  const ampm = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = ampm[2];
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  // Match standard 24h format like "5:9", "05:09"
  const standard = str.match(/^(\d{1,2}):(\d{2})$/);
  if (standard) {
    return `${String(parseInt(standard[1], 10)).padStart(2, '0')}:${standard[2]}`;
  }
  return str;
}

/**
 * Cleans and deduplicates an array of chat messages.
 * Merges duplicate entries where the same user sent identical text within
 * proximity, or where duplicate IDs / optimistic updates exist.
 */
export function deduplicateChatMessages(list: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(list) || list.length === 0) return [];

  const result: ChatMessage[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    const msg = { ...list[i] };
    msg.timestamp = formatChatTimestamp(msg.timestamp);

    // If exact ID seen already, skip
    if (seenIds.has(msg.id)) {
      continue;
    }

    // Check if duplicate of an existing message in result
    const cleanText = (msg.text || '').trim().toLowerCase();
    const cleanSender = (msg.senderName || '').trim().toLowerCase();
    const cleanNick = (msg.senderNickname || '').trim().toLowerCase().replace(/^@/, '');

    let isDuplicate = false;
    // Check backwards in the already accepted messages for near-duplicates
    const checkLimit = Math.max(0, result.length - 8);
    for (let j = result.length - 1; j >= checkLimit; j--) {
      const existing = result[j];
      const exText = (existing.text || '').trim().toLowerCase();
      const exSender = (existing.senderName || '').trim().toLowerCase();
      const exNick = (existing.senderNickname || '').trim().toLowerCase().replace(/^@/, '');

      // For bot messages
      if (msg.isBot && existing.isBot) {
        if (cleanText && cleanText === exText) {
          isDuplicate = true;
          break;
        }
      }

      // For user messages
      if (!msg.isBot && !existing.isBot) {
        const sameSender = (cleanSender && cleanSender === exSender) || (cleanNick && cleanNick === exNick);
        const sameText = cleanText && cleanText === exText;
        if (sameSender && sameText) {
          // Merge metadata if the newer message has more details
          if (!existing.imageUrl && msg.imageUrl) existing.imageUrl = msg.imageUrl;
          if (!existing.attachments && msg.attachments) existing.attachments = msg.attachments;
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      seenIds.add(msg.id);
      result.push(msg);
    }
  }

  return result;
}
