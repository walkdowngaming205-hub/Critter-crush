import type { CritterType } from '../types/game';

export interface CritterDef {
  type: CritterType;
  emoji: string;
  name: string;
  color: string;
  border: string;
}

export const CRITTERS: Record<CritterType, CritterDef> = {
  cat: { type: 'cat', emoji: '🐱', name: 'cat', color: '#FFB6C1', border: '#F48FB1' },
  dog: { type: 'dog', emoji: '🐶', name: 'dog', color: '#93C5FD', border: '#60A5FA' },
  bunny: { type: 'bunny', emoji: '🐰', name: 'bunny', color: '#C4B5FD', border: '#A78BFA' },
  bear: { type: 'bear', emoji: '🐻', name: 'bear', color: '#D2A679', border: '#B5895A' },
  fox: { type: 'fox', emoji: '🦊', name: 'fox', color: '#FDBA74', border: '#FB923C' },
  panda: { type: 'panda', emoji: '🐼', name: 'panda', color: '#E5E7EB', border: '#374151' },
  frog: { type: 'frog', emoji: '🐸', name: 'frog', color: '#86EFAC', border: '#4ADE80' },
  chick: { type: 'chick', emoji: '🐤', name: 'chick', color: '#FDE68A', border: '#FACC15' },
};

/** Order in which critter types are introduced as difficulty ramps. */
export const CRITTER_ORDER: CritterType[] = [
  'cat',
  'dog',
  'bunny',
  'fox',
  'frog',
  'chick',
  'bear',
  'panda',
];

export const SPECIAL_EMOJI = {
  lineH: '⚡',
  lineV: '⚡',
  bomb: '💣',
  rainbow: '🌈',
} as const;
