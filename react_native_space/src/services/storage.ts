import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, LevelProgress } from '../types/game';
import { LEVELS, MAX_LIVES } from '../constants/levels';

const STORAGE_KEY = 'critter_crush_state_v1';

export function defaultLevels(): LevelProgress[] {
  return LEVELS.map((l) => ({
    levelId: l.levelId,
    unlocked: l.levelId === 1,
    stars: 0,
    highScore: 0,
    bestMovesLeft: 0,
  }));
}

export function defaultState(): GameState {
  return {
    levels: defaultLevels(),
    lives: MAX_LIVES,
    lastLifeLostAt: null,
    streak: { currentStreak: 0, lastPlayedDate: null, goldenTileUnlocked: false },
    dailyChallenges: {},
    settings: { soundEnabled: true, hapticsEnabled: true },
    totalStars: 0,
    rescuedAnimals: [],
    inventory: { shuffle: 0, bomb: 0, lightning: 0 },
  };
}

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Merges a possibly partial/corrupt saved object onto defaults. */
function sanitize(raw: unknown): GameState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<GameState>;
  const savedLevels = Array.isArray(r.levels) ? r.levels : [];
  const levels = base.levels.map((def) => {
    const s = savedLevels.find((l) => l?.levelId === def.levelId);
    if (!s) return def;
    return {
      levelId: def.levelId,
      unlocked: def.levelId === 1 ? true : !!s.unlocked,
      stars: Math.max(0, Math.min(3, num(s.stars, 0))),
      highScore: Math.max(0, num(s.highScore, 0)),
      bestMovesLeft: Math.max(0, num(s.bestMovesLeft, 0)),
    };
  });
  return {
    levels,
    lives: Math.max(0, Math.min(MAX_LIVES, num(r.lives, MAX_LIVES))),
    lastLifeLostAt: typeof r.lastLifeLostAt === 'string' ? r.lastLifeLostAt : null,
    streak: {
      currentStreak: num(r.streak?.currentStreak, 0),
      lastPlayedDate: typeof r.streak?.lastPlayedDate === 'string' ? r.streak.lastPlayedDate : null,
      goldenTileUnlocked: !!r.streak?.goldenTileUnlocked,
    },
    dailyChallenges: r.dailyChallenges && typeof r.dailyChallenges === 'object' ? r.dailyChallenges : {},
    settings: {
      soundEnabled: r.settings?.soundEnabled ?? true,
      hapticsEnabled: r.settings?.hapticsEnabled ?? true,
    },
    totalStars: levels.reduce((s, l) => s + l.stars, 0),
    rescuedAnimals: Array.isArray(r.rescuedAnimals) ? r.rescuedAnimals.filter((x) => typeof x === 'string') : [],
    inventory: {
      shuffle: Math.max(0, num(r.inventory?.shuffle, 0)),
      bomb: Math.max(0, num(r.inventory?.bomb, 0)),
      lightning: Math.max(0, num(r.inventory?.lightning, 0)),
    },
  };
}

export async function loadState(): Promise<GameState> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return defaultState();
    return sanitize(JSON.parse(json));
  } catch (e) {
    console.error('[storage] failed to load state', e);
    return defaultState();
  }
}

export async function saveState(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[storage] failed to save state', e);
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[storage] failed to clear state', e);
  }
}
