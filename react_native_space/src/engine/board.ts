import type {
  Board,
  ClearedTile,
  CritterType,
  GravityResult,
  MatchGroup,
  Pos,
  Run,
  SpecialKind,
  StepResult,
  Tile,
} from '../types/game';
import { randInt, shuffleInPlace, type Rng } from './rng';

export const ROWS = 8;
export const COLS = 8;

export const POINTS_PER_TILE = 10;
export const POINTS_GOLDEN = 50;
export const POINTS_SPECIAL_TRIGGER = 50;
export const POINTS_SPECIAL_CREATE = 30;
export const MAX_MULTIPLIER = 4;

let nextId = 1;
export function newTileId(): number {
  nextId += 1;
  return nextId;
}

export interface TileFactory {
  types: CritterType[];
  rng: Rng;
  goldenChance: number;
}

export function makeTile(type: CritterType, special: SpecialKind | null = null, golden = false): Tile {
  return { id: newTileId(), type, special, golden };
}

export const key = (p: Pos): string => `${p.r},${p.c}`;
export const parseKey = (k: string): Pos => {
  const [r, c] = k.split(',').map((v) => parseInt(v, 10));
  return { r: r ?? 0, c: c ?? 0 };
};
export const inBounds = (r: number, c: number): boolean => r >= 0 && r < ROWS && c >= 0 && c < COLS;
export const isAdjacent = (a: Pos, b: Pos): boolean => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export function cloneBoard(b: Board): Board {
  return (b ?? []).map((row) => [...(row ?? [])]);
}

export function getCell(b: Board, r: number, c: number): Tile | null {
  if (!inBounds(r, c)) return null;
  return b?.[r]?.[c] ?? null;
}

/** Type used for matching; rainbow tiles never match by colour. */
function matchType(t: Tile | null): CritterType | null {
  if (!t || t.special === 'rainbow') return null;
  return t.type;
}

function randomTile(f: TileFactory, exclude: CritterType[] = []): Tile {
  const allowed = f.types.filter((t) => !exclude.includes(t));
  const pool = allowed.length > 0 ? allowed : f.types;
  const type = pool[randInt(f.rng, pool.length)] ?? 'cat';
  const golden = f.goldenChance > 0 && f.rng() < f.goldenChance;
  return makeTile(type, null, golden);
}

/** Builds a board with no existing matches and at least one valid move. */
export function generateBoard(f: TileFactory): Board {
  let board: Board = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      const row: (Tile | null)[] = [];
      for (let c = 0; c < COLS; c++) {
        const exclude: CritterType[] = [];
        const l1 = row[c - 1];
        const l2 = row[c - 2];
        if (l1 && l2 && l1.type === l2.type) exclude.push(l1.type);
        const u1 = board[r - 1]?.[c];
        const u2 = board[r - 2]?.[c];
        if (u1 && u2 && u1.type === u2.type) exclude.push(u1.type);
        row.push(randomTile(f, exclude));
      }
      board.push(row);
    }
    if (findRuns(board).length === 0 && findHint(board) !== null) return board;
  }
  return board;
}

/** All horizontal and vertical runs of 3+ matching tiles. */
export function findRuns(board: Board): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const t = matchType(getCell(board, r, c));
      let end = c + 1;
      while (t && end < COLS && matchType(getCell(board, r, end)) === t) end++;
      if (t && end - c >= 3) {
        const cells: Pos[] = [];
        for (let k = c; k < end; k++) cells.push({ r, c: k });
        runs.push({ cells, dir: 'h', type: t });
      }
      c = end;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const t = matchType(getCell(board, r, c));
      let end = r + 1;
      while (t && end < ROWS && matchType(getCell(board, end, c)) === t) end++;
      if (t && end - r >= 3) {
        const cells: Pos[] = [];
        for (let k = r; k < end; k++) cells.push({ r: k, c });
        runs.push({ cells, dir: 'v', type: t });
      }
      r = end;
    }
  }
  return runs;
}

/** Merges runs that share cells into groups and decides which special each creates. */
export function findMatchGroups(board: Board): MatchGroup[] {
  const runs = findRuns(board);
  if (runs.length === 0) return [];
  const parent = runs.map((_, i) => i);
  const find = (i: number): number => {
    let x = i;
    while (parent[x] !== x) x = parent[x] ?? x;
    return x;
  };
  const owner = new Map<string, number>();
  runs.forEach((run, i) => {
    run.cells.forEach((p) => {
      const k = key(p);
      const prev = owner.get(k);
      if (prev !== undefined) parent[find(i)] = find(prev);
      else owner.set(k, i);
    });
  });
  const byRoot = new Map<number, Run[]>();
  runs.forEach((run, i) => {
    const root = find(i);
    byRoot.set(root, [...(byRoot.get(root) ?? []), run]);
  });
  const groups: MatchGroup[] = [];
  byRoot.forEach((groupRuns) => {
    const cellMap = new Map<string, Pos>();
    groupRuns.forEach((run) => run.cells.forEach((p) => cellMap.set(key(p), p)));
    const maxRun = Math.max(...groupRuns.map((r) => r.cells.length));
    const hasH = groupRuns.some((r) => r.dir === 'h');
    const hasV = groupRuns.some((r) => r.dir === 'v');
    let special: SpecialKind | null = null;
    if (maxRun >= 5) special = 'rainbow';
    else if (hasH && hasV) special = 'bomb';
    else if (maxRun === 4) special = groupRuns[0]?.dir === 'h' ? 'lineH' : 'lineV';
    groups.push({
      type: groupRuns[0]?.type ?? 'cat',
      cells: Array.from(cellMap.values()),
      runs: groupRuns,
      maxRun,
      special,
    });
  });
  return groups;
}

function spawnPosition(group: MatchGroup, preferred: Pos[]): Pos {
  const cellKeys = new Set(group.cells.map(key));
  const pref = preferred.find((p) => cellKeys.has(key(p)));
  if (pref) return pref;
  if (group.special === 'bomb') {
    const counts = new Map<string, number>();
    group.runs.forEach((run) => run.cells.forEach((p) => counts.set(key(p), (counts.get(key(p)) ?? 0) + 1)));
    for (const [k, n] of counts) if (n > 1) return parseKey(k);
  }
  const longest = [...group.runs].sort((a, b) => b.cells.length - a.cells.length)[0];
  const cells = longest?.cells ?? group.cells;
  return cells[Math.floor(cells.length / 2)] ?? group.cells[0] ?? { r: 0, c: 0 };
}

function mostCommonType(board: Board): CritterType | null {
  const counts = new Map<CritterType, number>();
  board.forEach((row) =>
    row.forEach((t) => {
      const mt = matchType(t);
      if (mt) counts.set(mt, (counts.get(mt) ?? 0) + 1);
    }),
  );
  let best: CritterType | null = null;
  let bestN = 0;
  counts.forEach((n, t) => {
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  });
  return best;
}

export function cellsOfType(board: Board, type: CritterType): Pos[] {
  const out: Pos[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (matchType(getCell(board, r, c)) === type) out.push({ r, c });
  return out;
}

export function allCells(): Pos[] {
  const out: Pos[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) out.push({ r, c });
  return out;
}

/** Cells affected when the special at `pos` is triggered. */
export function specialArea(board: Board, pos: Pos, kind: SpecialKind): Pos[] {
  const out: Pos[] = [];
  if (kind === 'lineH') {
    for (let c = 0; c < COLS; c++) out.push({ r: pos.r, c });
  } else if (kind === 'lineV') {
    for (let r = 0; r < ROWS; r++) out.push({ r, c: pos.c });
  } else if (kind === 'bomb') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (inBounds(pos.r + dr, pos.c + dc)) out.push({ r: pos.r + dr, c: pos.c + dc });
  } else if (kind === 'rainbow') {
    const t = mostCommonType(board);
    if (t) out.push(...cellsOfType(board, t));
    out.push(pos);
  }
  return out;
}

export interface ResolveOptions {
  /** cells preferred for spawning specials (e.g. swapped cells) */
  preferred?: Pos[];
  /** cells to clear in addition to matches; their specials trigger */
  forced?: Pos[];
  /** cells to clear whose specials must NOT trigger (e.g. a rainbow consumed by a swap) */
  consumed?: Pos[];
  multiplier?: number;
}

/**
 * Resolves one step: finds every match on the board simultaneously, creates specials,
 * chains special explosions and returns the board with cleared cells set to null.
 */
export function resolveStep(board: Board, opts: ResolveOptions = {}): StepResult | null {
  const groups = findMatchGroups(board);
  const forced = opts.forced ?? [];
  const consumed = opts.consumed ?? [];
  if (groups.length === 0 && forced.length === 0 && consumed.length === 0) return null;

  const multiplier = Math.max(1, Math.min(MAX_MULTIPLIER, opts.multiplier ?? 1));
  const toClear = new Set<string>();
  const processed = new Set<string>();
  const queue: Pos[] = [];

  const addClear = (p: Pos) => {
    if (!inBounds(p.r, p.c)) return;
    const k = key(p);
    if (toClear.has(k)) return;
    if (!getCell(board, p.r, p.c)) return;
    toClear.add(k);
    if (getCell(board, p.r, p.c)?.special && !processed.has(k)) queue.push(p);
  };

  consumed.forEach((p) => {
    processed.add(key(p));
    addClear(p);
  });
  forced.forEach(addClear);

  const spawns: { pos: Pos; tile: Tile }[] = [];
  const spawnKeys = new Set<string>();
  groups.forEach((g) => {
    g.cells.forEach(addClear);
    if (g.special) {
      let pos = spawnPosition(g, opts.preferred ?? []);
      if (spawnKeys.has(key(pos))) {
        pos = g.cells.find((p) => !spawnKeys.has(key(p))) ?? pos;
      }
      if (!spawnKeys.has(key(pos))) {
        spawnKeys.add(key(pos));
        spawns.push({ pos, tile: makeTile(g.type, g.special, false) });
      }
    }
  });

  let specialsTriggered = 0;
  while (queue.length > 0) {
    const p = queue.shift();
    if (!p) break;
    const k = key(p);
    if (processed.has(k)) continue;
    processed.add(k);
    const tile = getCell(board, p.r, p.c);
    if (!tile?.special) continue;
    specialsTriggered += 1;
    specialArea(board, p, tile.special).forEach(addClear);
  }

  const next = cloneBoard(board);
  const cleared: ClearedTile[] = [];
  toClear.forEach((k) => {
    const p = parseKey(k);
    const tile = getCell(board, p.r, p.c);
    if (tile) cleared.push({ tile, pos: p });
    const row = next[p.r];
    if (row) row[p.c] = null;
  });
  spawns.forEach(({ pos, tile }) => {
    const row = next[pos.r];
    if (row) row[pos.c] = tile;
  });

  const goldenCount = cleared.filter((c) => c.tile.golden).length;
  const points =
    ((cleared.length - goldenCount) * POINTS_PER_TILE + goldenCount * POINTS_GOLDEN) * multiplier +
    specialsTriggered * POINTS_SPECIAL_TRIGGER +
    spawns.length * POINTS_SPECIAL_CREATE;

  return {
    board: next,
    cleared,
    spawns,
    groups,
    specialsTriggered,
    points,
    maxRun: groups.reduce((m, g) => Math.max(m, g.maxRun), 0),
  };
}

/** Drops tiles into empty cells and fills from the top with new tiles. */
export function applyGravity(board: Board, f: TileFactory): GravityResult {
  const next: Board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  const spawnRows: Record<number, number> = {};
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const t = getCell(board, r, c);
      if (t) {
        const row = next[write];
        if (row) row[c] = t;
        write--;
      }
    }
    const missing = write + 1;
    for (let r = write; r >= 0; r--) {
      const t = randomTile(f);
      const row = next[r];
      if (row) row[c] = t;
      spawnRows[t.id] = r - missing;
    }
  }
  return { board: next, spawnRows };
}

export function swapCells(board: Board, a: Pos, b: Pos): Board {
  const next = cloneBoard(board);
  const ta = getCell(board, a.r, a.c);
  const tb = getCell(board, b.r, b.c);
  const ra = next[a.r];
  const rb = next[b.r];
  if (ra) ra[a.c] = tb;
  if (rb) rb[b.c] = ta;
  return next;
}

export type SwapKind = 'invalid' | 'match' | 'rainbow' | 'doubleSpecial';

/** Classifies a swap of a and b (positions on the pre-swap board). */
export function classifySwap(board: Board, a: Pos, b: Pos): SwapKind {
  if (!isAdjacent(a, b)) return 'invalid';
  const ta = getCell(board, a.r, a.c);
  const tb = getCell(board, b.r, b.c);
  if (!ta || !tb) return 'invalid';
  if (ta.special === 'rainbow' || tb.special === 'rainbow') return 'rainbow';
  if (ta.special && tb.special) return 'doubleSpecial';
  const swapped = swapCells(board, a, b);
  const runs = findRuns(swapped);
  const ka = key(a);
  const kb = key(b);
  const involved = runs.some((run) => run.cells.some((p) => key(p) === ka || key(p) === kb));
  return involved ? 'match' : 'invalid';
}

/**
 * Builds resolve options for a special swap. `swapped` is the board AFTER the swap,
 * a/b are the original positions (so tiles have exchanged places).
 */
export function specialSwapOptions(swapped: Board, a: Pos, b: Pos, kind: SwapKind): ResolveOptions {
  const atA = getCell(swapped, a.r, a.c);
  const atB = getCell(swapped, b.r, b.c);
  if (kind === 'rainbow') {
    if (atA?.special === 'rainbow' && atB?.special === 'rainbow') {
      return { forced: allCells(), consumed: [a, b], preferred: [b, a] };
    }
    const rainbowPos = atA?.special === 'rainbow' ? a : b;
    const otherPos = rainbowPos === a ? b : a;
    const other = getCell(swapped, otherPos.r, otherPos.c);
    const forced = other ? cellsOfType(swapped, other.type) : [];
    forced.push(otherPos);
    return { forced, consumed: [rainbowPos], preferred: [b, a] };
  }
  if (kind === 'doubleSpecial') {
    return { forced: [a, b], preferred: [b, a] };
  }
  return { preferred: [b, a] };
}

/** Returns one valid swap, or null if the board has no possible moves. */
export function findHint(board: Board): [Pos, Pos] | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = { r, c };
      const neighbours: Pos[] = [
        { r, c: c + 1 },
        { r: r + 1, c },
      ];
      for (const b of neighbours) {
        if (!inBounds(b.r, b.c)) continue;
        if (classifySwap(board, a, b) !== 'invalid') return [a, b];
      }
    }
  }
  return null;
}

export const hasPossibleMove = (board: Board): boolean => findHint(board) !== null;

/** Rearranges existing tiles so there are no matches and at least one move. */
export function reshuffleBoard(board: Board, f: TileFactory): Board {
  const tiles: Tile[] = [];
  board.forEach((row) => row.forEach((t) => t && tiles.push(t)));
  if (tiles.length !== ROWS * COLS) return generateBoard(f);
  for (let attempt = 0; attempt < 300; attempt++) {
    shuffleInPlace(tiles, f.rng);
    const next: Board = [];
    for (let r = 0; r < ROWS; r++) next.push(tiles.slice(r * COLS, r * COLS + COLS));
    if (findRuns(next).length === 0 && hasPossibleMove(next)) return next;
  }
  return generateBoard(f);
}

export function comboLabel(maxRun: number): string {
  if (maxRun >= 5) return 'LEGENDARY!';
  if (maxRun === 4) return 'AMAZING!';
  return 'SWEET!';
}
