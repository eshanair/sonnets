export interface LineCharRange {
  lineStart: number;
  lineEnd: number;
  charStart: number;
  charEnd: number;
}

function closestLine(node: Node, root: HTMLElement): HTMLElement | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  const line = el?.closest<HTMLElement>('[data-line-index]');
  if (!line || !root.contains(line)) return null;
  return line;
}

// Resolves an element+childIndex boundary (the container Range gives you when a
// selection starts/ends exactly at a span edge) down to the nearest text
// node/offset, since domPositionToCharOffset only knows how to walk text nodes.
function resolveToTextPosition(node: Node, offset: number): { node: Node; offset: number } {
  if (node.nodeType === Node.TEXT_NODE) return { node, offset };
  const children = node.childNodes;
  if (offset < children.length) {
    const child = children[offset];
    if (child.nodeType === Node.TEXT_NODE) return { node: child, offset: 0 };
    // descend into the first text node of this child
    const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first) return { node: first, offset: 0 };
  }
  // offset points past the last child (or child had no text) — land at the end
  // of the previous text node, or the end of the whole element if none precedes it.
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let last: Node | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) last = n;
  if (last) return { node: last, offset: last.textContent!.length };
  return { node, offset: 0 };
}

function domPositionToCharOffset(lineEl: HTMLElement, node: Node, offset: number): number {
  const resolved = resolveToTextPosition(node, offset);
  let acc = 0;
  const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
  let t: Node | null;
  while ((t = walker.nextNode())) {
    if (t === resolved.node) return acc + resolved.offset;
    acc += t.textContent?.length ?? 0;
  }
  return acc; // fell through: resolved node wasn't found, clamp to line end
}

// Converts the browser's current text selection into a {lineStart,lineEnd,charStart,charEnd}
// range against the sonnet's line-string model. Returns null for empty/whitespace-only
// selections or selections that escape the text container (e.g. into the margin).
export function selectionToLineCharRange(sel: Selection, root: HTMLElement): LineCharRange | null {
  if (!sel.rangeCount || sel.isCollapsed) return null;
  // Range.start*/end* are always in document order regardless of drag direction,
  // unlike Selection.anchor/focus which flip when the user drags backwards.
  const range = sel.getRangeAt(0);
  if (range.toString().trim().length === 0) return null;

  const startLineEl = closestLine(range.startContainer, root);
  const endLineEl = closestLine(range.endContainer, root);
  if (!startLineEl || !endLineEl) return null;

  return {
    lineStart: Number(startLineEl.dataset.lineIndex),
    charStart: domPositionToCharOffset(startLineEl, range.startContainer, range.startOffset),
    lineEnd: Number(endLineEl.dataset.lineIndex),
    charEnd: domPositionToCharOffset(endLineEl, range.endContainer, range.endOffset),
  };
}
