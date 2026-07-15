import { SONNETS } from '../data/sonnets';
import type { UserData } from './types';

export interface SonnetMatch {
  sonnet: number;
  lineIndex: number;
  lineText: string;
}

export interface NoteMatch {
  sonnet: number;
  annotationId: string;
  text: string;
}

export function searchSonnetText(query: string): SonnetMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SonnetMatch[] = [];
  for (const s of SONNETS) {
    s.lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) results.push({ sonnet: s.number, lineIndex: i, lineText: line });
    });
  }
  return results;
}

export function searchNotes(query: string, data: UserData): NoteMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: NoteMatch[] = [];
  for (const [sonnetStr, sd] of Object.entries(data.sonnetData)) {
    for (const a of sd.annotations) {
      if (a.type === 'note' && a.text && a.text.toLowerCase().includes(q)) {
        results.push({ sonnet: Number(sonnetStr), annotationId: a.id, text: a.text });
      }
    }
  }
  return results;
}

export interface TagMatch {
  sonnet: number;
  tagName: string;
}

export function searchByTag(query: string, data: UserData): TagMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: TagMatch[] = [];
  for (const [sonnetStr, sd] of Object.entries(data.sonnetData)) {
    for (const tagName of sd.tags) {
      if (tagName.toLowerCase().includes(q)) {
        results.push({ sonnet: Number(sonnetStr), tagName });
      }
    }
  }
  return results;
}
