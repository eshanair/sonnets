// Shared DOM-measurement helpers for keeping visual elements (volta marker,
// margin connectors) locked to real rendered line/annotation positions rather
// than assuming a fixed line-height.

export interface Rect {
  top: number;
  bottom: number;
  height: number;
}

// Measures each `[data-line-index]` child of containerEl, relative to containerEl's
// own top edge. Index in the returned array corresponds to the 0-indexed line number.
export function measureLineRects(containerEl: HTMLElement): Rect[] {
  const containerTop = containerEl.getBoundingClientRect().top;
  const lineEls = containerEl.querySelectorAll<HTMLElement>('[data-line-index]');
  const rects: Rect[] = [];
  lineEls.forEach((el) => {
    const idx = Number(el.dataset.lineIndex);
    const r = el.getBoundingClientRect();
    rects[idx] = { top: r.top - containerTop, bottom: r.bottom - containerTop, height: r.height };
  });
  return rects;
}

export interface AnchorRect extends Rect {
  id: string;
  left: number; // x-offset from containerEl's left edge, for mobile's below-text connector
  right: number; // x-offset from containerEl's left edge, for the desktop connector's start point
}

// Measures the union bounding box of every rendered span carrying a given
// annotation id (a highlight can render as multiple spans if it crosses lines
// or is interrupted by an overlapping annotation boundary).
export class AnchorTracker {
  constructor(private containerEl: HTMLElement) {}

  measure(ids: string[]): Map<string, AnchorRect> {
    const containerRect = this.containerEl.getBoundingClientRect();
    const out = new Map<string, AnchorRect>();
    for (const id of ids) {
      const spans = this.containerEl.querySelectorAll<HTMLElement>(
        `[data-annotation-ids~="${cssEscape(id)}"]`,
      );
      if (!spans.length) continue;
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      spans.forEach((s) => {
        const r = s.getBoundingClientRect();
        top = Math.min(top, r.top - containerRect.top);
        bottom = Math.max(bottom, r.bottom - containerRect.top);
        left = Math.min(left, r.left - containerRect.left);
        right = Math.max(right, r.right - containerRect.left);
      });
      out.set(id, { id, top, bottom, height: bottom - top, left, right });
    }
    return out;
  }
}

function cssEscape(s: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s;
}

export interface StackedItem {
  id: string;
  top: number;
}

// Read-then-write stacking pass: nudges items downward (in ascending top order)
// so consecutive margin items never overlap, preserving relative order.
export function resolveStacking(items: StackedItem[], heights: Map<string, number>, minGap = 8): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const resolved = new Map<string, number>();
  let cursor = -Infinity;
  for (const item of sorted) {
    const h = heights.get(item.id) ?? 0;
    const top = Math.max(item.top, cursor);
    resolved.set(item.id, top);
    cursor = top + h + minGap;
  }
  return resolved;
}
