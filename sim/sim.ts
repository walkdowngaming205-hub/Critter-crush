import { generateBoard, applyGravity, resolveStep, classifySwap, swapCells, specialSwapOptions, findRuns, hasPossibleMove, reshuffleBoard, ROWS, COLS, TileFactory, findHint, MAX_MULTIPLIER } from '../react_native_space/src/engine/board';
import { createRng } from '../react_native_space/src/engine/rng';
import { CRITTER_ORDER } from '../react_native_space/src/constants/critters';
import { LEVELS } from '../react_native_space/src/constants/levels';
import type { Board, Pos } from '../react_native_space/src/types/game';

function check(b: Board, ctx: string) {
  const ids = new Set<number>();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){ const t=b[r]?.[c]; if(!t) throw new Error('hole '+ctx); if(ids.has(t.id)) throw new Error('dup id '+ctx); ids.add(t.id);}  
  if (findRuns(b).length) throw new Error('unresolved runs '+ctx);
}
let specials: Record<string, number> = {};
function play(b: Board, a: Pos, bb: Pos, f: TileFactory): { board: Board; points: number } | null {
  const kind = classifySwap(b, a, bb);
  if (kind === 'invalid') return null;
  let cur = swapCells(b, a, bb);
  let opts = specialSwapOptions(cur, a, bb, kind);
  let mult = 1, pts = 0;
  for (let i=0;i<100;i++) {
    const res = resolveStep(cur, { ...opts, multiplier: mult });
    if (!res) break;
    res.spawns.forEach(s => specials[s.tile.special!] = (specials[s.tile.special!] ?? 0) + 1);
    pts += res.points;
    cur = applyGravity(res.board, f).board;
    opts = {}; mult = Math.min(MAX_MULTIPLIER, mult+1);
  }
  if (!hasPossibleMove(cur)) cur = reshuffleBoard(cur, f);
  return { board: cur, points: pts };
}
function allMoves(b: Board): [Pos,Pos][] { const m: [Pos,Pos][]=[]; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ for(const n of [{r,c:c+1},{r:r+1,c}]){ if(n.r<ROWS&&n.c<COLS&&classifySwap(b,{r,c},n)!=='invalid') m.push([{r,c},n]); } } return m; }

const seedRng = createRng(42);
function runGame(types: number, moves: number, mode: 'greedy'|'random'): number {
  const rng = createRng(Math.floor(seedRng()*1e9));
  const f: TileFactory = { types: CRITTER_ORDER.slice(0, types), rng, goldenChance: 0 };
  let b = generateBoard(f); check(b, 'gen');
  let score = 0;
  for (let i=0;i<moves;i++) {
    const ms = allMoves(b); if (!ms.length) throw new Error('no moves');
    if (!findHint(b)) throw new Error('hint mismatch');
    let best: { board: Board; points: number } | null = null;
    const cands = mode==='random' ? [ms[Math.floor(rng()*ms.length)]!] : ms;
    for (const [a, bb] of cands) {
      const save = rng; const r = play(b, a, bb, f);
      if (r && (!best || r.points > best.points)) best = r;
      if (mode === 'greedy') {} 
    }
    b = best!.board; check(b, 'move'); score += best!.points;
  }
  return score;
}
for (const t of [5,6,7,8]) {
  for (const mode of ['random','greedy'] as const) {
    const N = 40, moves = 20; let tot = 0;
    for (let g=0; g<N; g++) tot += runGame(t, moves, mode);
    console.log(`types=${t} ${mode} perMove=${(tot/N/moves).toFixed(1)}`);
  }
}
console.log('specials created', specials);
console.log(LEVELS.map(l => `${l.levelId}:${l.availableTypes.length}t ${l.maxMoves}m ${l.targetScore}`).join('\n'));
// pass rates using "semi" player: best of 3 random candidate moves
function semiGame(types: number, moves: number): number {
  const rng = createRng(Math.floor(seedRng()*1e9));
  const f: TileFactory = { types: CRITTER_ORDER.slice(0, types), rng, goldenChance: 0 };
  let b = generateBoard(f); let score = 0;
  for (let i=0;i<moves;i++){ const ms = allMoves(b); let best: any=null; for(let k=0;k<3;k++){ const [a,bb]=ms[Math.floor(rng()*ms.length)]!; const r=play(b,a,bb,f); if(r&&(!best||r.points>best.points)) best=r;} b=best.board; score+=best.points; }
  return score;
}
for (const l of LEVELS) { let pass=0, three=0, N=30; for(let g=0;g<N;g++){ const s=semiGame(l.availableTypes.length,l.maxMoves); if(s>=l.targetScore)pass++; if(s>=l.starThresholds[2])three++; } console.log(`L${l.levelId} target ${l.targetScore} pass ${Math.round(pass/N*100)}% 3star ${Math.round(three/N*100)}%`); }
for (const t of [5,6,7,8]) { const s:number[]=[]; for(let g=0;g<40;g++) s.push(runGame(t,25,'random')/25); s.sort((a,b)=>a-b); console.log(`median random t=${t}`, s[10]!.toFixed(0), s[20]!.toFixed(0), s[30]!.toFixed(0)); }
{ const s:number[]=[]; for(let g=0;g<40;g++){ const rng=createRng(g+7); const f: TileFactory={types:CRITTER_ORDER.slice(0,5),rng,goldenChance:0}; let b=generateBoard(f); let sc=0; for(let i=0;i<30;i++){ const ms=allMoves(b); const r=play(b,ms[0]![0],ms[0]![1],f)!; b=r.board; sc+=r.points;} s.push(sc);} s.sort((a,b)=>a-b); console.log('firstfound t5 30 moves', s[10], s[20], s[30]); }
