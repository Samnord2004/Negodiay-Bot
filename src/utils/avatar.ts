import { Participant } from '../types';

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

/**
 * Returns the active chosen avatar for a participant.
 * If user selected 'profile', returns photoProfile if available.
 * If user selected 'front', returns photoFront if available.
 * Otherwise falls back to p.avatar, then photoFront, then photoProfile, then default.
 */
export function getParticipantAvatar(p?: Partial<Participant> | null): string {
  if (!p) return DEFAULT_AVATARS.male;

  if (p.selectedAvatarSource === 'profile' && p.photoProfile && p.photoProfile.trim()) {
    return getSafeAvatar(p.photoProfile, p.gender);
  }
  if (p.selectedAvatarSource === 'front' && p.photoFront && p.photoFront.trim()) {
    return getSafeAvatar(p.photoFront, p.gender);
  }
  if (p.avatar && p.avatar.trim()) {
    return getSafeAvatar(p.avatar, p.gender);
  }
  if (p.photoFront && p.photoFront.trim()) {
    return getSafeAvatar(p.photoFront, p.gender);
  }
  if (p.photoProfile && p.photoProfile.trim()) {
    return getSafeAvatar(p.photoProfile, p.gender);
  }
  return getSafeAvatar(undefined, p.gender);
}

