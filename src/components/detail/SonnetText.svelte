<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { AnnotatedSpan, StaticSonnet } from '../../lib/types';
  import { userData, addAnnotation, addConnection } from '../../stores/userData';
  import { spansForSonnet } from '../../lib/connections';
  import { computeLineSegments } from '../../lib/segments';
  import { getStructuralGroups } from '../../lib/rhymeStructure';
  import { selectionToLineCharRange, type LineCharRange } from '../../lib/textRange';
  import { armedTool, pendingLink, disarm, echoPreview } from '../../stores/selection';
  import SonnetLine from './SonnetLine.svelte';
  import VoltaMarker from './VoltaMarker.svelte';

  let {
    sonnet,
    voltaLine,
    onEchoSelection,
  }: {
    sonnet: StaticSonnet;
    voltaLine: number;
    onEchoSelection?: (args: { lineStart: number; lineEnd: number; charStart: number; charEnd: number; text: string; rect: DOMRect }) => void;
  } = $props();

  let lineCount = $derived(sonnet.lines.length);
  // Structure is still computed (not displayed) purely to know where the
  // closing couplet starts, so those two lines can be set with the
  // traditional typographic indent.
  let coupletGroup = $derived(getStructuralGroups(lineCount).find((g) => g.label === 'C'));
  // A Find Echoes search hasn't created a real connection yet, so the source
  // line it's searching from wouldn't otherwise show any highlight while the
  // popover is open — this previews it as a plain echo span (same green wash
  // as a real connection) for as long as the popover stays open.
  let previewSpan = $derived<AnnotatedSpan[]>(
    $echoPreview && $echoPreview.sonnet === sonnet.number
      ? [{ id: '__echo-preview__', lineStart: $echoPreview.lineStart, lineEnd: $echoPreview.lineEnd, charStart: $echoPreview.charStart, charEnd: $echoPreview.charEnd, kind: 'echo' }]
      : [],
  );
  let spans = $derived([...spansForSonnet($userData, sonnet.number), ...previewSpan]);
  let lineSegments = $derived(sonnet.lines.map((text, i) => computeLineSegments(text, i, spans)));

  let gridEl: HTMLElement;
  let isMobile = $state(false);

  const MOBILE_QUERY = '(max-width: 640px)';

  // Applies an already-resolved {line,char} range to whichever tool is armed —
  // shared by the desktop drag-selection path and the mobile whole-line-tap path
  // below, so both funnel through one place that actually mutates the store.
  function applyRange(range: LineCharRange, selectedText: string, rect: DOMRect | null) {
    const pending = $pendingLink;
    if (pending && pending.sourceEndpoint.sonnet !== sonnet.number) {
      addConnection(pending.sourceEndpoint, { sonnet: sonnet.number, ...range });
      pendingLink.set(null);
      disarm();
      return;
    }

    const tool = $armedTool;
    if (tool.kind === 'highlight') {
      addAnnotation(sonnet.number, { ...range, type: 'note', text: '', color: tool.color });
    } else if (tool.kind === 'label') {
      addAnnotation(sonnet.number, { ...range, type: 'label', label: tool.label });
    } else if (tool.kind === 'echo' && rect) {
      onEchoSelection?.({ ...range, text: selectedText, rect });
    }
  }

  // Desktop: precise word/phrase drag-selection via the real Selection/Range API.
  function handleSelection(sel: Selection) {
    if (!gridEl) return;
    const range = selectionToLineCharRange(sel, gridEl);
    if (!range) return;
    const rect = sel.rangeCount > 0 ? sel.getRangeAt(0).getBoundingClientRect() : null;
    applyRange(range, sel.toString(), rect);
    sel.removeAllRanges();
  }

  function onMouseUp() {
    if (isMobile) return; // mobile uses the whole-line tap handler instead
    const sel = window.getSelection();
    if (!sel) return;
    handleSelection(sel);
  }

  // Mobile: precise touch-drag text selection is unreliable across browsers (long-press
  // handles, inconsistent selectionchange timing), so instead a tap on a line while a
  // tool is armed just highlights/labels/echoes that whole line — no drag required.
  // The tool disarms itself right after: scrolling a phone to keep reading is itself a
  // touch gesture, and leaving the tool armed risked the next incidental tap near a line
  // (while just trying to scroll past it) silently annotating something the user never
  // meant to touch.
  function applyMobileLineTap(lineEl: HTMLElement) {
    const lineIndex = Number(lineEl.dataset.lineIndex);
    const text = sonnet.lines[lineIndex];
    const range: LineCharRange = { lineStart: lineIndex, lineEnd: lineIndex, charStart: 0, charEnd: text.length };
    applyRange(range, text, lineEl.getBoundingClientRect());
    disarm();
  }

  // This uses the raw `touchend` event rather than the synthetic `click` WebKit
  // derives from it: on real iOS Safari (not Chrome devtools' mobile *emulation*,
  // which runs on a desktop engine and doesn't reproduce this), a click synthesized
  // from a tap on a selectable-text region can get swallowed by Safari's own
  // selection/callout gesture recognizer before it ever reaches this component.
  // Reading the touch point directly sidesteps that entirely.
  function onLineTouchEnd(e: TouchEvent) {
    if (!isMobile || !gridEl) return;
    if ($armedTool.kind === 'idle' && !$pendingLink) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const lineEl = target?.closest<HTMLElement>('[data-line-index]');
    if (!lineEl) return;
    e.preventDefault(); // suppress the trailing synthetic click so this can't double-fire
    applyMobileLineTap(lineEl);
  }

  // Fallback for any mobile browser where, for whatever reason, touchend didn't
  // fire (or was intercepted upstream) but a click still made it through.
  function onLineClick(e: MouseEvent) {
    if (!isMobile || !gridEl) return;
    if ($armedTool.kind === 'idle' && !$pendingLink) return;
    const lineEl = (e.target as HTMLElement).closest<HTMLElement>('[data-line-index]');
    if (!lineEl) return;
    applyMobileLineTap(lineEl);
  }

  // Touch devices finish a selection by dragging native handles, which doesn't
  // reliably fire mouseup on this element — but it always fires `selectionchange`
  // on the document, regardless of what UI produced the change. Debounce until the
  // selection stops moving, then treat it the same as a mouseup. Kept as a fallback
  // for wider touch screens (e.g. tablets past the mobile breakpoint) that still use
  // the desktop drag-selection path.
  function trySelection() {
    if (isMobile) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !gridEl) return;
    const range = sel.getRangeAt(0);
    if (!gridEl.contains(range.commonAncestorContainer)) return;
    handleSelection(sel);
  }

  let selectionTimer: ReturnType<typeof setTimeout> | undefined;

  function onSelectionChange() {
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(trySelection, 350);
  }

  onMount(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    isMobile = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };
    mq.addEventListener('change', onChange);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      mq.removeEventListener('change', onChange);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  });

  onDestroy(() => {
    if (selectionTimer) clearTimeout(selectionTimer);
  });
</script>

<div
  class="sonnet-text-grid"
  bind:this={gridEl}
  onmouseup={onMouseUp}
  onclick={onLineClick}
  ontouchend={onLineTouchEnd}
  style:grid-template-rows={`repeat(${lineCount}, var(--line-height-poem))`}
>
  {#each sonnet.lines as _line, i (i)}
    <SonnetLine lineIndex={i} segments={lineSegments[i]} indent={coupletGroup ? i >= coupletGroup.lineStart : false} />
  {/each}
  <VoltaMarker sonnetNumber={sonnet.number} {voltaLine} {lineCount} />
</div>

<style>
  .sonnet-text-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    max-width: 600px;
    position: relative;
    user-select: text;
    -webkit-user-select: text;
  }

  /* Mobile uses tap-whole-line instead of drag-selection, so native text
     selection is more liability than asset here — on a real iOS/Android
     device, a selectable region invites the OS's own selection/callout
     gesture to swallow the tap before our click handler ever sees it. This
     doesn't show up in desktop-browser "mobile view" emulation, which is why
     it can look fine there and still fail on an actual phone. */
  @media (max-width: 640px) {
    .sonnet-text-grid {
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
  }
</style>
