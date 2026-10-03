import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DailyRecord, GameState, InventoryKind, SettingsState, WinOutcome } from '../types/game';
import { clearState, defaultState, loadState, saveState } from '../services/storage';
import { getLevel, LEVEL_COUNT, MAX_LIVES, rescueEmojiFor, starsForScore } from '../constants/levels';
import { regenLives } from './lives';
import { dateKey, yesterdayKey } from '../utils/date';
import { setHapticsEnabled } from '../utils/haptics';

interface GameContextValue {
  state: GameState;
  loaded: boolean;
  msToNextLife: number;
  recordLevelWin: (levelId: number, score: number, movesLeft: number) => WinOutcome;
  loseLife: () => void;
  addLife: () => void;
  addLevelPoints: (levelId: number, points: number) => void;
  addInventory: (kind: InventoryKind, n?: number) => void;
  consumeInventory: (kind: InventoryKind) => boolean;
  recordDaily: (date: string, score: number, starEarned: boolean) => void;
  updateSettings: (patch: Partial<SettingsState>) => void;
  resetProgress: () => Promise<void>;
  pendingSpinLevel: number | null;
  consumeSpin: () => number | null;
}

const GameContext = createContext<GameContextValue | null>(null);

function applyStreak(state: GameState): { state: GameState; goldenJustUnlocked: boolean } {
  const today = dateKey();
  const last = state.streak?.lastPlayedDate ?? null;
  if (last === today) return { state, goldenJustUnlocked: false };
  const current = last === yesterdayKey() ? (state.streak?.currentStreak ?? 0) + 1 : 1;
  const wasUnlocked = !!state.streak?.goldenTileUnlocked;
  const unlocked = wasUnlocked || current >= 3;
  return {
    state: { ...state, streak: { currentStreak: current, lastPlayedDate: today, goldenTileUnlocked: unlocked } },
    goldenJustUnlocked: unlocked && !wasUnlocked,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, setState] = useState<GameState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [msToNextLife, setMsToNextLife] = useState(0);
  const [pendingSpinLevel, setPendingSpinLevel] = useState<number | null>(null);
  const pendingSpinRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let alive = true;
    loadState().then((s) => {
      if (!alive) return;
      setState(s);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  useEffect(() => {
    setHapticsEnabled(state.settings?.hapticsEnabled ?? true);
  }, [state.settings?.hapticsEnabled]);

  // Life regeneration tick
  useEffect(() => {
    if (!loaded) return undefined;
    const tick = () => {
      const s = stateRef.current;
      const snap = regenLives(s.lives, s.lastLifeLostAt);
      setMsToNextLife(snap.msToNext);
      if (snap.lives !== s.lives || snap.lastLifeLostAt !== s.lastLifeLostAt) {
        setState((prev) => ({ ...prev, lives: snap.lives, lastLifeLostAt: snap.lastLifeLostAt }));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [loaded]);

  const recordLevelWin = useCallback((levelId: number, score: number, movesLeft: number): WinOutcome => {
    const def = getLevel(levelId);
    const prev = stateRef.current;
    const stars = def ? starsForScore(score, def.starThresholds) : 1;
    const existing = prev.levels.find((l) => l.levelId === levelId);
    const newHighScore = score > (existing?.highScore ?? 0);
    const isRescue = !!def?.isRescueLevel;
    const rescuedEmoji = isRescue ? rescueEmojiFor(levelId) : null;

    const levels = prev.levels.map((l) => {
      if (l.levelId === levelId) {
        return {
          ...l,
          unlocked: true,
          stars: Math.max(l.stars, stars),
          highScore: Math.max(l.highScore, score),
          bestMovesLeft: Math.max(l.bestMovesLeft, movesLeft),
        };
      }
      if (l.levelId === levelId + 1 && levelId < LEVEL_COUNT) return { ...l, unlocked: true };
      return l;
    });
    const rescued = [...(prev.rescuedAnimals ?? [])];
    if (rescuedEmoji && !rescued.includes(rescuedEmoji)) rescued.push(rescuedEmoji);
    const withLevels: GameState = {
      ...prev,
      levels,
      totalStars: levels.reduce((s, l) => s + l.stars, 0),
      rescuedAnimals: rescued,
    };
    const { state: next, goldenJustUnlocked } = applyStreak(withLevels);
    stateRef.current = next;
    setState(next);
    if (stars >= 3) {
      pendingSpinRef.current = levelId;
      setPendingSpinLevel(levelId);
    }
    return { stars, newHighScore, isRescue, rescuedEmoji, goldenJustUnlocked };
  }, []);

  const loseLife = useCallback(() => {
    setState((prev) => {
      if (prev.lives <= 0) return prev;
      const lastLifeLostAt = prev.lives >= MAX_LIVES || !prev.lastLifeLostAt ? new Date().toISOString() : prev.lastLifeLostAt;
      return { ...prev, lives: prev.lives - 1, lastLifeLostAt };
    });
  }, []);

  const addLife = useCallback(() => {
    setState((prev) => {
      const lives = Math.min(MAX_LIVES, prev.lives + 1);
      return { ...prev, lives, lastLifeLostAt: lives >= MAX_LIVES ? null : prev.lastLifeLostAt };
    });
  }, []);

  const addLevelPoints = useCallback((levelId: number, points: number) => {
    setState((prev) => ({
      ...prev,
      levels: prev.levels.map((l) => (l.levelId === levelId ? { ...l, highScore: l.highScore + points } : l)),
    }));
  }, []);

  const addInventory = useCallback((kind: InventoryKind, n = 1) => {
    setState((prev) => ({ ...prev, inventory: { ...prev.inventory, [kind]: (prev.inventory?.[kind] ?? 0) + n } }));
  }, []);

  const consumeInventory = useCallback((kind: InventoryKind): boolean => {
    const have = stateRef.current.inventory?.[kind] ?? 0;
    if (have <= 0) return false;
    const next = { ...stateRef.current, inventory: { ...stateRef.current.inventory, [kind]: have - 1 } };
    stateRef.current = next;
    setState(next);
    return true;
  }, []);

  const recordDaily = useCallback((date: string, score: number, starEarned: boolean) => {
    const prev = stateRef.current;
    const old: DailyRecord | undefined = prev.dailyChallenges?.[date];
    const rec: DailyRecord = {
      completed: true,
      score: Math.max(score, old?.score ?? 0),
      starEarned: starEarned || !!old?.starEarned,
    };
    const withDaily: GameState = { ...prev, dailyChallenges: { ...(prev.dailyChallenges ?? {}), [date]: rec } };
    const { state: next } = applyStreak(withDaily);
    stateRef.current = next;
    setState(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<SettingsState>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...(patch ?? {}) } }));
  }, []);

  const resetProgress = useCallback(async () => {
    await clearState();
    const fresh = defaultState();
    fresh.settings = { ...stateRef.current.settings };
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  const consumeSpin = useCallback((): number | null => {
    const lvl = pendingSpinRef.current;
    pendingSpinRef.current = null;
    setPendingSpinLevel(null);
    return lvl;
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      loaded,
      msToNextLife,
      recordLevelWin,
      loseLife,
      addLife,
      addLevelPoints,
      addInventory,
      consumeInventory,
      recordDaily,
      updateSettings,
      resetProgress,
      pendingSpinLevel,
      consumeSpin,
    }),
    [state, loaded, msToNextLife, recordLevelWin, loseLife, addLife, addLevelPoints, addInventory, consumeInventory, recordDaily, updateSettings, resetProgress, pendingSpinLevel, consumeSpin],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
