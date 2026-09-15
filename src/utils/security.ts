import crypto from "crypto";
import { Participant } from "../types";

const PASSWORD_SALT = "negodyai_secure_salt_club_2025";

/**
 * Creates a salted SHA-256 hash of the plain text password.
 */
export function hashPassword(plain: string): string {
  if (!plain) return "";
  return crypto.createHash("sha256").update(plain + PASSWORD_SALT).digest("hex");
}

/**
 * Safely verifies input password against stored hash or legacy plain-text password.
 */
export function verifyPassword(input: string, stored: string | undefined): boolean {
  if (!stored || !input) return false;
  // If stored matches plain-text (for backwards compatibility with existing records)
  if (stored === input) return true;
  // If stored matches salted SHA-256 hash
  return hashPassword(input) === stored;
}

/**
 * Strips password and internal sensitive secrets from a participant object
 * before returning it in any public API responses.
 */
export function sanitizeParticipant<T extends Participant>(p: T): Omit<T, 'password'> {
  const { password, ...safe } = p;
  return safe;
}

/**
 * Sanitizes an array of participants.
 */
export function sanitizeParticipants<T extends Participant>(list: T[]): Omit<T, 'password'>[] {
  return list.map(sanitizeParticipant);
}
