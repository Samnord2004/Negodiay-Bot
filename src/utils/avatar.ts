export const DEFAULT_AVATARS = {
  male: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  female: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
};

/**
 * Returns a valid, non-empty avatar image URL.
 * Guarantees never returning an empty string ("") to avoid React DOM src attribute warnings
 * and duplicate browser page re-fetches.
 */
export function getSafeAvatar(avatar?: string | null, gender?: 'male' | 'female' | 'boy' | 'girl' | string): string {
  if (avatar && typeof avatar === 'string') {
    const trimmed = avatar.trim();
    if (trimmed.length > 0 && !trimmed.includes('dicebear.com/7.x/bottts')) {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
        return trimmed;
      }
    }
  }
  const isFemale = gender === 'female' || gender === 'girl';
  return isFemale ? DEFAULT_AVATARS.female : DEFAULT_AVATARS.male;
}
