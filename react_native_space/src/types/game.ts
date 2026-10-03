export type CritterType =
  | 'cat'
  | 'dog'
  | 'bunny'
  | 'bear'
  | 'fox'
  | 'panda'
  | 'frog'
  | 'chick';

/** lineH clears its row, lineV clears its column. */
export type SpecialKind = 'lineH' | 'lineV' | 'bomb' | 'rainbow';

export interface Tile {
  id: number;
  type: CritterType;
  special: SpecialKind | null;
  golden: boolean;
}

export type Cell = Tile | null;
export type Board = Cell[][];

export interface Pos {
  r: number;
  c: number;
}

export interface Run {
  cells: Pos[];
  dir: 'h' | 'v';
  type: CritterType;
}

export interface MatchGroup {
  type: CritterType;
  cells: Pos[];
  runs: Run[];
  maxRun: number;
  special: SpecialKind | null;
}

export interface ClearedTile {
  tile: Tile;
  pos: Pos;
}

export interface StepResult {
  board: Board;
  cleared: ClearedTile[];
  spawns: { pos: Pos; tile: Tile }[];
  groups: MatchGroup[];
  specialsTriggered: number;
  points: number;
  maxRun: number;
}

export interface GravityResult {
  board: Board;
  /** row each newly created tile should animate in from (negative = above board) */
  spawnRows: Record<number, number>;
}

export interface LevelDef {
  levelId: number;
  targetScore: number;
  maxMoves: number;
  availableTypes: CritterType[];
  starThresholds: [number, number, number];
  isRescueLevel: boolean;
}

export interface LevelProgress {
  levelId: number;
  unlocked: boolean;
  stars: number;
  highScore: number;
  bestMovesLeft: number;
}

export interface DailyRecord {
  completed: boolean;
  score: number;
  starEarned: boolean;
}

export type InventoryKind = 'shuffle' | 'bomb' | 'lightning';

export interface Inventory {
  shuffle: number;
  bomb: number;
  lightning: number;
}

export interface StreakState {
  currentStreak: number;
  lastPlayedDate: string | null;
  goldenTileUnlocked: boolean;
}

export interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface GameState {
  levels: LevelProgress[];
  lives: number;
  lastLifeLostAt: string | null;
  streak: StreakState;
  dailyChallenges: Record<string, DailyRecord>;
  settings: SettingsState;
  totalStars: number;
  rescuedAnimals: string[];
  inventory: Inventory;
}

export interface WinOutcome {
  stars: number;
  newHighScore: boolean;
  isRescue: boolean;
  rescuedEmoji: string | null;
  goldenJustUnlocked: boolean;
}
