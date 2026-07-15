import { SONNETS, LINE_SIGNIFICANT_WORDS, significantWords } from '../data/sonnets';
import type { EchoCandidate } from './types';

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const w of a) if (b.has(w)) count++;
  return count;
}

export function findEchoes(selectedText: string, excludeSonnet: number, limit = 20): EchoCandidate[] {
  const query = significantWords(selectedText);
  if (query.size === 0) return [];

  const candidates: EchoCandidate[] = [];
  for (const s of SONNETS) {
    if (s.number === excludeSonnet) continue;
    const lineWordSets = LINE_SIGNIFICANT_WORDS.get(s.number)!;
    for (let i = 0; i < s.lines.length; i++) {
      const lineWords = lineWordSets[i];
      const overlap = intersectionSize(query, lineWords);
      if (overlap > 0) {
        candidates.push({
          sonnet: s.number,
          lineIndex: i,
          lineText: s.lines[i],
          score: overlap,
          ratio: lineWords.size > 0 ? overlap / lineWords.size : 0,
        });
      }
    }
  }

  candidates.sort((x, y) => y.score - x.score || y.ratio - x.ratio || x.sonnet - y.sonnet);
  return candidates.slice(0, limit);
}
