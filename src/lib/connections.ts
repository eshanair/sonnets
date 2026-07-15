import { connectionsForSonnet, getSonnetUserData } from '../stores/userData';
import type { AnnotatedSpan, UserData } from './types';

// Unifies a sonnet's note/label annotations and its connection endpoints into
// one span list for segments.ts to render.
export function spansForSonnet(data: UserData, sonnet: number): AnnotatedSpan[] {
  const sd = getSonnetUserData(data, sonnet);
  const annotationSpans: AnnotatedSpan[] = sd.annotations.map((a) => ({
    id: a.id,
    lineStart: a.lineStart,
    lineEnd: a.lineEnd,
    charStart: a.charStart,
    charEnd: a.charEnd,
    kind: a.type,
    label: a.label,
    color: a.color,
  }));
  const connectionSpans: AnnotatedSpan[] = connectionsForSonnet(data, sonnet).map(({ connection, self }) => ({
    id: connection.id,
    lineStart: self.lineStart,
    lineEnd: self.lineEnd,
    charStart: self.charStart,
    charEnd: self.charEnd,
    kind: 'echo',
  }));
  return [...annotationSpans, ...connectionSpans];
}

export interface MapEdge {
  a: number;
  b: number;
  weight: number;
}

// De-duplicates the flat connection list into one edge per unordered sonnet pair,
// weighted by how many line-level connections exist between them.
export function deriveMapEdges(data: UserData): MapEdge[] {
  const weights = new Map<string, MapEdge>();
  for (const c of data.connections) {
    const lo = Math.min(c.a.sonnet, c.b.sonnet);
    const hi = Math.max(c.a.sonnet, c.b.sonnet);
    const key = `${lo}-${hi}`;
    const existing = weights.get(key);
    if (existing) existing.weight += 1;
    else weights.set(key, { a: lo, b: hi, weight: 1 });
  }
  return [...weights.values()];
}
