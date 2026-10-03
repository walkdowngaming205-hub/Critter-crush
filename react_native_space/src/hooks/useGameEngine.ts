import { useCallback, useEffect, useRef, useState } from 'react';
import type { Board, CritterType, Pos, SpecialKind } from '../types/game';
import {
  applyGravity,
  classifySwap,
  comboLabel,
  findHint,
  generateBoard,
  getCell,
  hasPossibleMove,
  inBounds,
  isAdjacent,
  MAX_MULTIPLIER,
  reshuffleBoard,
  resolveStep,
  specialSwapOptions,
  swapCells,
  cloneBoard,
  type ResolveOptions,
  type TileFactory,
} from '../engine/board';
import { createRng } from '../engine/rng';
import { HINT_IDLE_MS } from '../constants/levels';
import { CRITTERS } from '../constants/critters';
import { haptics } from '../utils/haptics';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type PowerUpKind = 'bomb' | 'lightning';

export interface Popup {
  id: number;
  text: string;
  kind: 'combo' | 'mult' | 'info';
}

export interface Burst {
  id: number;
  r: number;
  c: number;
  color: string;
}

export interface EngineConfig {
  types: CritterType[];
  seed?: number;
  goldenEnabled: boolean;
  reducedMotion: boolean;
  canPlay: boolean;
  onConsumePowerUp?: (kind: PowerUpKind) => boolean;
}

const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const GOLDEN_CHANCE = 0.04;
const MAX_BURSTS_PER_STEP = 14;

let uid = 0;
const nextUid = () => {
  uid += 1;
  return uid;
};

const DIR: Record<Direction, Pos> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

export function useGameEngine(cfg: EngineConfig) {
  const timings = cfg.reducedMotion
    ? { swap: 110, clear: 120, fall: 160 }
    : { swap: 210, clear: 270, fall: 360 };
  const timingsRef = useRef(timings);
  timingsRef.current = timings;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const makeFactory = (seed?: number): TileFactory => ({
    types: cfg.types.length > 0 ? cfg.types : ['cat', 'dog', 'bunny', 'fox', 'frog'],
    rng: createRng(seed ?? Math.floor(Math.random() * 2 ** 31)),
    goldenChance: cfg.goldenEnabled ? GOLDEN_CHANCE : 0,
  });
  const factoryRef = useRef<TileFactory | null>(null);
  if (!factoryRef.current) factoryRef.current = makeFactory(cfg.seed);

  const [board, setBoard] = useState<Board>(() => generateBoard(factoryRef.current as TileFactory));
  const boardRef = useRef<Board>(board);
  const spawnRowsRef = useRef<Record<number, number>>({});
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

  const [busy, setBusyState] = useState(false);
  const [clearingIds, setClearingIds] = useState<Set<number>>(() => new Set());
  const [shakeTokens, setShakeTokens] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Pos | null>(null);
  const selectedRef = useRef<Pos | null>(null);
  selectedRef.current = selected;
  const [hint, setHint] = useState<[Pos, Pos] | null>(null);
  const [score, setScore] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [armed, setArmed] = useState<PowerUpKind | null>(null);
  const [idleToken, setIdleToken] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setBusy = (v: boolean) => {
    busyRef.current = v;
    if (mountedRef.current) setBusyState(v);
  };

  const commitBoard = useCallback((b: Board, spawnRows?: Record<number, number>) => {
    if (spawnRows) Object.assign(spawnRowsRef.current, spawnRows);
    boardRef.current = b;
    if (mountedRef.current) setBoard(b);
  }, []);

  const pushPopup = useCallback((text: string, kind: Popup['kind']) => {
    const id = nextUid();
    setPopups((p) => [...p.slice(-3), { id, text, kind }]);
    setTimeout(() => {
      if (mountedRef.current) setPopups((p) => p.filter((x) => x.id !== id));
    }, 1300);
  }, []);

  const addBursts = useCallback((cells: { r: number; c: number; color: string }[]) => {
    if (cfgRef.current.reducedMotion || cells.length === 0) return;
    const picked = cells.length > MAX_BURSTS_PER_STEP ? cells.filter((_, i) => i % Math.ceil(cells.length / MAX_BURSTS_PER_STEP) === 0) : cells;
    const created = picked.map((c) => ({ ...c, id: nextUid() }));
    setBursts((b) => [...b, ...created]);
    const ids = new Set(created.map((c) => c.id));
    setTimeout(() => {
      if (mountedRef.current) setBursts((b) => b.filter((x) => !ids.has(x.id)));
    }, 700);
  }, []);

  const runCascade = useCallback(
    async (start: Board, first: ResolveOptions) => {
      const factory = factoryRef.current as TileFactory;
      let cur = start;
      let opts: ResolveOptions = first;
      let mult = 1;
      let step = 0;
      while (mountedRef.current && step < 50) {
        const res = resolveStep(cur, { ...opts, multiplier: mult });
        if (!res) break;
        setMultiplier(mult);
        if (step === 0) pushPopup(comboLabel(res.maxRun), 'combo');
        else pushPopup(`${mult}x!`, 'mult');
        if (res.maxRun >= 4 || res.specialsTriggered > 0 || mult >= 3) haptics.heavy();
        else haptics.medium();
        setScore((s) => s + res.points);
        addBursts(
          res.cleared.map((c) => ({
            r: c.pos.r,
            c: c.pos.c,
            color: c.tile.golden ? '#F59E0B' : CRITTERS[c.tile.type]?.border ?? '#FFB6C1',
          })),
        );
        setClearingIds(new Set(res.cleared.map((c) => c.tile.id)));
        await wait(timingsRef.current.clear);
        if (!mountedRef.current) return;
        setClearingIds(new Set());
        const g = applyGravity(res.board, factory);
        commitBoard(g.board, g.spawnRows);
        await wait(timingsRef.current.fall);
        cur = g.board;
        opts = {};
        mult = Math.min(MAX_MULTIPLIER, mult + 1);
        step += 1;
      }
      setMultiplier(1);
      if (mountedRef.current && !hasPossibleMove(cur)) {
        pushPopup('No moves! Shuffling…', 'info');
        await wait(450);
        commitBoard(reshuffleBoard(cur, factory));
        await wait(timingsRef.current.fall + 150);
      }
    },
    [addBursts, commitBoard, pushPopup],
  );

  const attemptSwap = useCallback(
    async (a: Pos, b: Pos) => {
      if (busyRef.current || !cfgRef.current.canPlay) return;
      if (!inBounds(b.r, b.c) || !isAdjacent(a, b)) return;
      const before = boardRef.current;
      if (!getCell(before, a.r, a.c) || !getCell(before, b.r, b.c)) return;
      setBusy(true);
      setHint(null);
      setSelected(null);
      try {
        const kind = classifySwap(before, a, b);
        const swapped = swapCells(before, a, b);
        commitBoard(swapped);
        haptics.light();
        await wait(timingsRef.current.swap);
        if (!mountedRef.current) return;
        setMovesUsed((m) => m + 1);
        if (kind === 'invalid') {
          commitBoard(before);
          const ta = getCell(before, a.r, a.c);
          const tb = getCell(before, b.r, b.c);
          setShakeTokens((s) => {
            const next = { ...s };
            if (ta) next[ta.id] = (next[ta.id] ?? 0) + 1;
            if (tb) next[tb.id] = (next[tb.id] ?? 0) + 1;
            return next;
          });
          haptics.error();
          await wait(timingsRef.current.swap + 120);
        } else {
          await runCascade(swapped, specialSwapOptions(swapped, a, b, kind));
        }
      } catch (e) {
        console.error('[engine] swap failed', e);
      } finally {
        setBusy(false);
        if (mountedRef.current) setIdleToken((t) => t + 1);
      }
    },
    [commitBoard, runCascade],
  );

  const blastAt = useCallback(
    async (pos: Pos, kind: PowerUpKind) => {
      if (busyRef.current || !cfgRef.current.canPlay) return;
      const tile = getCell(boardRef.current, pos.r, pos.c);
      if (!tile) return;
      const ok = cfgRef.current.onConsumePowerUp?.(kind) ?? false;
      setArmed(null);
      if (!ok) return;
      setBusy(true);
      setHint(null);
      setSelected(null);
      try {
        const special: SpecialKind = kind === 'bomb' ? 'bomb' : Math.random() < 0.5 ? 'lineH' : 'lineV';
        const next = cloneBoard(boardRef.current);
        const row = next[pos.r];
        if (row) row[pos.c] = { ...tile, special };
        commitBoard(next);
        haptics.heavy();
        await wait(timingsRef.current.swap);
        await runCascade(next, { forced: [pos] });
      } catch (e) {
        console.error('[engine] power-up failed', e);
      } finally {
        setBusy(false);
        if (mountedRef.current) setIdleToken((t) => t + 1);
      }
    },
    [commitBoard, runCascade],
  );

  const onTapCell = useCallback(
    (pos: Pos) => {
      if (busyRef.current || !cfgRef.current.canPlay) return;
      if (!inBounds(pos.r, pos.c)) return;
      if (armed) {
        blastAt(pos, armed);
        return;
      }
      setHint(null);
      setIdleToken((t) => t + 1);
      const prev = selectedRef.current;
      if (!prev) {
        haptics.select();
        setSelected(pos);
      } else if (prev.r === pos.r && prev.c === pos.c) {
        setSelected(null);
      } else if (isAdjacent(prev, pos)) {
        setSelected(null);
        attemptSwap(prev, pos);
      } else {
        haptics.select();
        setSelected(pos);
      }
    },
    [armed, attemptSwap, blastAt],
  );

  const onSwipe = useCallback(
    (from: Pos, dir: Direction) => {
      if (armed) return;
      const d = DIR[dir];
      attemptSwap(from, { r: from.r + d.r, c: from.c + d.c });
    },
    [armed, attemptSwap],
  );

  const shuffle = useCallback(async (): Promise<boolean> => {
    if (busyRef.current || !cfgRef.current.canPlay) return false;
    setBusy(true);
    setHint(null);
    setSelected(null);
    try {
      const factory = factoryRef.current as TileFactory;
      commitBoard(reshuffleBoard(boardRef.current, factory));
      haptics.medium();
      await wait(timingsRef.current.fall + 150);
    } finally {
      setBusy(false);
      if (mountedRef.current) setIdleToken((t) => t + 1);
    }
    return true;
  }, [commitBoard]);

  const showHint = useCallback(() => {
    if (busyRef.current) return;
    setHint(findHint(boardRef.current));
    haptics.light();
  }, []);

  const restart = useCallback(() => {
    if (busyRef.current) return;
    factoryRef.current = makeFactory(cfgRef.current.seed);
    spawnRowsRef.current = {};
    const fresh = generateBoard(factoryRef.current);
    commitBoard(fresh);
    setScore(0);
    setMovesUsed(0);
    setMultiplier(1);
    setSelected(null);
    setHint(null);
    setArmed(null);
    setPopups([]);
    setBursts([]);
    setIdleToken((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitBoard]);

  // Auto-hint after idle period
  useEffect(() => {
    if (busy || !cfg.canPlay || hint) return undefined;
    const id = setTimeout(() => {
      if (!busyRef.current && mountedRef.current) setHint(findHint(boardRef.current));
    }, HINT_IDLE_MS);
    return () => clearTimeout(id);
  }, [busy, cfg.canPlay, hint, board, selected, idleToken]);

  return {
    board,
    spawnRows: spawnRowsRef.current,
    clearingIds,
    shakeTokens,
    selected,
    hint,
    score,
    movesUsed,
    multiplier,
    popups,
    bursts,
    busy,
    armed,
    setArmed,
    onTapCell,
    onSwipe,
    shuffle,
    showHint,
    restart,
  };
}

export type GameEngine = ReturnType<typeof useGameEngine>;
