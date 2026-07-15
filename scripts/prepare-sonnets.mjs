// One-time data-prep script: parses the raw Project Gutenberg etext #1041
// (Shakespeare's Sonnets, public domain) into src/data/sonnets.json.
// Not run by the app itself — re-run manually only if the source file changes.
//
// Usage: node scripts/prepare-sonnets.mjs scripts/tmp/pg1041.txt

import { readFileSync, writeFileSync } from 'node:fs';

const srcPath = process.argv[2];
if (!srcPath) {
  console.error('Usage: node scripts/prepare-sonnets.mjs <path-to-pg1041.txt>');
  process.exit(1);
}

const text = readFileSync(srcPath, 'utf-8');
const startMarker = '*** START OF';
const endMarker = '*** END OF';
const start = text.indexOf(startMarker);
const end = text.indexOf(endMarker);
if (start === -1 || end === -1) throw new Error('Gutenberg markers not found');

const body = text.slice(start, end).split('\n').slice(1).join('\n');
const lines = body.split('\n');

const ROMAN_RE = /^[IVXLCDM]+$/;
const ROMAN_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function romanToInt(s) {
  let total = 0;
  let prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const v = ROMAN_VALUES[s[i]];
    if (v < prev) total -= v;
    else {
      total += v;
      prev = v;
    }
  }
  return total;
}

const headerIdx = [];
lines.forEach((l, idx) => {
  const t = l.trim();
  if (t !== '' && ROMAN_RE.test(t)) headerIdx.push(idx);
});

const sonnets = [];
headerIdx.forEach((idx, hi) => {
  const number = romanToInt(lines[idx].trim());
  const startLine = idx + 1;
  const endLine = hi + 1 < headerIdx.length ? headerIdx[hi + 1] : lines.length;
  let chunk = lines.slice(startLine, endLine);
  while (chunk.length && chunk[0].trim() === '') chunk.shift();
  while (chunk.length && chunk[chunk.length - 1].trim() === '') chunk.pop();
  sonnets.push({ number, lines: chunk.map((l) => l.trim()) });
});

sonnets.sort((a, b) => a.number - b.number);

if (sonnets.length !== 154) {
  throw new Error(`Expected 154 sonnets, got ${sonnets.length}`);
}
sonnets.forEach((s) => {
  if (s.lines.some((l) => l.length === 0)) {
    throw new Error(`Sonnet ${s.number} has an empty line`);
  }
});

const outPath = new URL('../src/data/sonnets.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(sonnets, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${sonnets.length} sonnets to ${outPath.pathname}`);

const exceptions = sonnets.filter((s) => s.lines.length !== 14);
if (exceptions.length) {
  console.log(
    'Note: non-14-line sonnets preserved faithfully from source:',
    exceptions.map((s) => `${s.number} (${s.lines.length} lines)`).join(', '),
  );
}
