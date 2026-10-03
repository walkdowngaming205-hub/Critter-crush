import { LIFE_REGEN_MS, MAX_LIVES } from '../constants/levels';

export interface LivesSnapshot {
  lives: number;
  lastLifeLostAt: string | null;
  msToNext: number;
}

/** Applies time-based regeneration: +1 life per 30 minutes, capped at MAX_LIVES. */
export function regenLives(lives: number, lastLifeLostAt: string | null, now: number = Date.now()): LivesSnapshot {
  if (lives >= MAX_LIVES || !lastLifeLostAt) {
    return { lives: Math.min(lives, MAX_LIVES), lastLifeLostAt: lives >= MAX_LIVES ? null : lastLifeLostAt, msToNext: 0 };
  }
  const anchor = Date.parse(lastLifeLostAt);
  if (!Number.isFinite(anchor)) return { lives, lastLifeLostAt: new Date(now).toISOString(), msToNext: LIFE_REGEN_MS };
  const elapsed = Math.max(0, now - anchor);
  const gained = Math.floor(elapsed / LIFE_REGEN_MS);
  const newLives = Math.min(MAX_LIVES, lives + gained);
  if (newLives >= MAX_LIVES) return { lives: MAX_LIVES, lastLifeLostAt: null, msToNext: 0 };
  const newAnchor = anchor + gained * LIFE_REGEN_MS;
  return {
    lives: newLives,
    lastLifeLostAt: new Date(newAnchor).toISOString(),
    msToNext: LIFE_REGEN_MS - (now - newAnchor),
  };
}
