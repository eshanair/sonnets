import type { StructuralGroup } from './types';

export const DEFAULT_VOLTA_LINE = 9; // 1-indexed: the turn is conventionally before this line

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Structure and rhyme scheme are positional, not phonetic (no scansion/detection here —
// see project non-goals). All but two of the 154 sonnets are exactly 14 lines
// (standard 3 quatrains + couplet); Sonnet 99 (15 lines) and Sonnet 126 (12 lines) are
// genuine textual exceptions preserved faithfully from the source, so both functions
// below are line-count-generic rather than hardcoded to 14 so those two still render
// sensibly without altering the underlying text.

export function getStructuralGroups(lineCount: number): StructuralGroup[] {
  const groups: StructuralGroup[] = [];
  const coupletSize = lineCount >= 2 ? 2 : lineCount;
  const bodyCount = lineCount - coupletSize;
  let start = 0;
  let qIndex = 1;
  while (start < bodyCount) {
    const size = Math.min(4, bodyCount - start);
    groups.push({ label: `Q${qIndex}`, lineStart: start, lineEnd: start + size - 1 });
    start += size;
    qIndex++;
  }
  if (coupletSize > 0) {
    groups.push({ label: 'C', lineStart: start, lineEnd: lineCount - 1 });
  }
  return groups;
}

export function getRhymeScheme(lineCount: number): string[] {
  const scheme: string[] = [];
  const coupletSize = lineCount >= 2 ? 2 : lineCount;
  const bodyCount = lineCount - coupletSize;
  let letterIdx = 0;
  let i = 0;
  while (i < bodyCount) {
    const groupSize = Math.min(4, bodyCount - i);
    if (groupSize === 4) {
      scheme.push(LETTERS[letterIdx], LETTERS[letterIdx + 1], LETTERS[letterIdx], LETTERS[letterIdx + 1]);
      letterIdx += 2;
    } else {
      for (let k = 0; k < groupSize; k++) scheme.push(LETTERS[letterIdx + k]);
      letterIdx += groupSize;
    }
    i += groupSize;
  }
  if (coupletSize === 2) {
    scheme.push(LETTERS[letterIdx], LETTERS[letterIdx]);
  } else if (coupletSize === 1) {
    scheme.push(LETTERS[letterIdx]);
  }
  return scheme;
}
