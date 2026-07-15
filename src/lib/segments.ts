import type { AnnotatedSpan, Segment } from './types';

function onLine(lineIndex: number) {
  return (a: AnnotatedSpan) => a.lineStart <= lineIndex && a.lineEnd >= lineIndex;
}

// Clips a span to the portion that falls on the given line, returning the
// [start,end) char boundary within that line's own text.
function clipToLine(a: AnnotatedSpan, lineIndex: number, lineLength: number): [number, number] {
  const start = a.lineStart === lineIndex ? a.charStart : 0;
  const end = a.lineEnd === lineIndex ? a.charEnd : lineLength;
  return [start, end];
}

function uniqueSorted(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

function covers(a: AnnotatedSpan, lineIndex: number, start: number, end: number, lineLength: number): boolean {
  if (a.lineStart > lineIndex || a.lineEnd < lineIndex) return false;
  const [aStart, aEnd] = clipToLine(a, lineIndex, lineLength);
  return aStart <= start && aEnd >= end;
}

// Interval-sweep: turns a flat list of (possibly overlapping) spans touching this
// line into an ordered list of non-overlapping runs, each carrying the union of
// styles active across it, so a note highlight, a connection's echo highlight, and
// a structural label can all coexist visually on the same stretch of text.
export function computeLineSegments(lineText: string, lineIndex: number, spans: AnnotatedSpan[]): Segment[] {
  const onThisLine = spans.filter(onLine(lineIndex));
  if (onThisLine.length === 0) {
    return [{ start: 0, end: lineText.length, text: lineText, note: false, echo: false, labels: [], annotationIds: [] }];
  }

  const boundaryPoints = uniqueSorted([
    0,
    lineText.length,
    ...onThisLine.flatMap((a) => clipToLine(a, lineIndex, lineText.length)),
  ]);

  const segments: Segment[] = [];
  for (let i = 0; i < boundaryPoints.length - 1; i++) {
    const start = boundaryPoints[i];
    const end = boundaryPoints[i + 1];
    if (start === end) continue;
    const active = onThisLine.filter((a) => covers(a, lineIndex, start, end, lineText.length));
    const labels = active.filter((a) => a.kind === 'label' && a.label).map((a) => a.label!);
    const noteAnn = active.find((a) => a.kind === 'note');
    segments.push({
      start,
      end,
      text: lineText.slice(start, end),
      note: !!noteAnn,
      noteColor: noteAnn?.color,
      echo: active.some((a) => a.kind === 'echo'),
      labels,
      annotationIds: active.map((a) => a.id),
    });
  }
  return segments;
}
