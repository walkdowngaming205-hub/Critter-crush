import type { LevelDef } from '../types/game';
import { CRITTER_ORDER, CRITTERS } from './critters';

export const LEVEL_COUNT = 24;
export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 30 * 60 * 1000;
export const HINT_IDLE_MS = 5000;

export const DAILY_TIME_LIMIT_S = 180;
export const DAILY_TYPE_COUNT = 6;
export const DAILY_TARGET = 4000;

function typeCountFor(n: number): number {
  if (n <= 4) return 5;
  if (n <= 10) return 6;
  if (n <= 16) return 7;
  return 8;
}

/** Target scores calibrated against an automated greedy-player simulation. */
function targetFor(n: number, types: number, moves: number): number {
  // Expected points per move falls as more critter types appear.
  const perMove: Record<number, number> = { 5: 300, 6: 200, 7: 140, 8: 100 };
  const capacity = (perMove[types] ?? 40) * moves;
  // Difficulty ratio ramps from 30% to 85% of an average player's capacity.
  const ratio = 0.3 + ((n - 1) / (LEVEL_COUNT - 1)) * 0.55;
  return Math.max(300, Math.round((capacity * ratio) / 50) * 50);
}

function buildLevels(): LevelDef[] {
  const out: LevelDef[] = [];
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const types = typeCountFor(n);
    const maxMoves = Math.round(30 - ((n - 1) * 14) / (LEVEL_COUNT - 1));
    const targetScore = targetFor(n, types, maxMoves);
    const round50 = (v: number) => Math.round(v / 50) * 50;
    out.push({
      levelId: n,
      targetScore,
      maxMoves,
      availableTypes: CRITTER_ORDER.slice(0, types),
      starThresholds: [targetScore, round50(targetScore * 1.25), round50(targetScore * 1.5)],
      isRescueLevel: n % 5 === 0,
    });
  }
  return out;
}

export const LEVELS: LevelDef[] = buildLevels();

export function getLevel(levelId: number): LevelDef | null {
  return LEVELS.find((l) => l?.levelId === levelId) ?? null;
}

export function rescueEmojiFor(levelId: number): string {
  const idx = Math.max(0, Math.floor(levelId / 5) - 1) % CRITTER_ORDER.length;
  const type = CRITTER_ORDER[idx] ?? 'cat';
  return CRITTERS[type]?.emoji ?? '🐱';
}

export function starsForScore(score: number, thresholds: [number, number, number]): number {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}
