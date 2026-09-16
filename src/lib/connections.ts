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

export interface MapEdgeNote {
  id: string; // the underlying connection's id, so the note can be edited in place
  text: string;
}

export interface MapEdge {
  a: number;
  b: number;
  weight: number;
  notes: MapEdgeNote[];
}

// De-duplicates the flat connection list into one edge per unordered sonnet pair,
// weighted by how many line-level connections exist between them, and collects
// any notes attached to those connections for display (and editing) on hover.
export function deriveMapEdges(data: UserData): MapEdge[] {
  const weights = new Map<string, MapEdge>();
  for (const c of data.connections) {
    const lo = Math.min(c.a.sonnet, c.b.sonnet);
    const hi = Math.max(c.a.sonnet, c.b.sonnet);
    const key = `${lo}-${hi}`;
    const existing = weights.get(key);
    const note = c.note?.trim();
    if (existing) {
      existing.weight += 1;
      if (note) existing.notes.push({ id: c.id, text: note });
    } else {
      weights.set(key, { a: lo, b: hi, weight: 1, notes: note ? [{ id: c.id, text: note }] : [] });
    }
  }
  return [...weights.values()];
}

export interface ConnectionHubLink {
  other: number;
  note?: string;
}

export interface ConnectionHub {
  sonnet: number;
  links: ConnectionHubLink[];
}

// One hub per sonnet that has at least one connection, listing every sonnet
// it's linked to from its own perspective — a connection between 5 and 20
// therefore appears under both hubs, the same "from this sonnet's point of
// view" framing connectionsForSonnet already uses for the margin. Sorted by
// sonnet number so this reads as an ordered catalog, distinct from the
// ranked-by-engagement list.
export function deriveConnectionHierarchy(data: UserData): ConnectionHub[] {
  const sonnetNumbers = [...new Set(data.connections.flatMap((c) => [c.a.sonnet, c.b.sonnet]))].sort(
    (a, b) => a - b,
  );

  return sonnetNumbers.map((sonnet) => ({
    sonnet,
    links: connectionsForSonnet(data, sonnet).map(({ connection, other }) => ({
      other: other.sonnet,
      note: connection.note?.trim() || undefined,
    })),
  }));
}
