export interface StaticSonnet {
  number: number;
  lines: string[];
}

export interface SonnetData {
  significantWords: Set<string>[]; // per-line, precomputed
}

export type AnnotationType = 'note' | 'label';

export interface Annotation {
  id: string;
  lineStart: number;
  lineEnd: number;
  charStart: number;
  charEnd: number;
  type: AnnotationType;
  text?: string; // for type: 'note'
  label?: string; // for type: 'label'
  color?: string; // for type: 'note' — which preselected highlight color was used
  createdAt: number;
}

// Preselected pastel highlight colors offered by the Highlight tool.
export const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: '#f5e59a' },
  { name: 'pink', value: '#f3c6d3' },
  { name: 'blue', value: '#bcd8ea' },
  { name: 'green', value: '#c3e3c3' },
  { name: 'purple', value: '#d9c8ee' },
  { name: 'peach', value: '#f2d3b8' },
];

export interface Endpoint {
  sonnet: number;
  lineStart: number;
  lineEnd: number;
  charStart: number;
  charEnd: number;
}

export interface Connection {
  id: string;
  a: Endpoint;
  b: Endpoint;
  note?: string;
  createdAt: number;
}

export interface Tag {
  name: string;
  color: string;
}

// The two built-in categories are fixed to their canonical sonnet ranges —
// the user can create and apply their own tags freely, but can't add or
// remove Fair Youth/Dark Lady from an individual sonnet.
export const LOCKED_TAGS = ['Fair Youth', 'Dark Lady'];

// Shown on hover wherever these two built-in tags appear, since the split
// isn't self-explanatory to anyone not already familiar with the sonnets.
export const TAG_DESCRIPTIONS: Record<string, string> = {
  'Fair Youth': 'Sonnets 1–126, addressed to a beautiful young man — themes of beauty, love, and the passage of time.',
  'Dark Lady': 'Sonnets 127–154, addressed to a mysterious, dark-featured woman — a more conflicted, often anguished love.',
};

export interface SonnetUserData {
  voltaLine: number; // 1-indexed
  tags: string[];
  seededTags: string[]; // tags applied as a starting default (e.g. Fair Youth/Dark Lady split), not by the user — excluded from annotation counts until the user touches them
  annotations: Annotation[];
}

export interface UserData {
  version: 1;
  tags: Tag[];
  customLabels: string[];
  sonnetData: Record<number, SonnetUserData>;
  connections: Connection[];
}

export interface StructuralGroup {
  label: string;
  lineStart: number; // 0-indexed
  lineEnd: number; // 0-indexed, inclusive
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  note: boolean;
  noteColor?: string;
  echo: boolean;
  labels: string[];
  annotationIds: string[];
}

// Unifies note/label annotations and connection endpoints into one shape so
// segments.ts can sweep both into non-overlapping styled runs — a connection's
// source span renders with the persistent green echo wash the same way a note's
// span renders with the note wash.
export interface AnnotatedSpan {
  id: string;
  lineStart: number;
  lineEnd: number;
  charStart: number;
  charEnd: number;
  kind: 'note' | 'label' | 'echo';
  label?: string;
  color?: string;
}

export type ArmedTool =
  | { kind: 'idle' }
  | { kind: 'highlight'; color: string }
  | { kind: 'echo' }
  | { kind: 'label'; label: string }
  | { kind: 'link'; sourceAnnotationId: string; sourceSonnet: number };

export interface EchoCandidate {
  sonnet: number;
  lineIndex: number;
  lineText: string;
  score: number;
  ratio: number;
}
