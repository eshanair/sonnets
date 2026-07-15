import raw from './sonnets.json';
import { STOPWORDS } from './stopwords';
import type { StaticSonnet } from '../lib/types';

export const SONNETS: StaticSonnet[] = raw as StaticSonnet[];

const byNumber = new Map<number, StaticSonnet>(SONNETS.map((s) => [s.number, s]));

export function getSonnet(number: number): StaticSonnet | undefined {
  return byNumber.get(number);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

export function significantWords(text: string): Set<string> {
  return new Set(tokenize(text).filter((w) => !STOPWORDS.has(w)));
}

// Precomputed once at module load so echo search never re-tokenizes on every query.
export const LINE_SIGNIFICANT_WORDS: Map<number, Set<string>[]> = new Map(
  SONNETS.map((s) => [s.number, s.lines.map((line) => significantWords(line))]),
);
