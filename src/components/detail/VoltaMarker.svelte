<script lang="ts">
  import { measureLineRects } from '../../lib/geometry';
  import { setVoltaLine } from '../../stores/userData';
  import { isEditingAllowed } from '../../stores/auth';
  import { get } from 'svelte/store';

  let { sonnetNumber, voltaLine, lineCount }: { sonnetNumber: number; voltaLine: number; lineCount: number } =
    $props();

  let dragging = $state(false);

  function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }

  function onPointerDown(e: PointerEvent) {
    if (!get(isEditingAllowed)) return;
    const container = (e.currentTarget as HTMLElement).closest('.sonnet-text-grid') as HTMLElement | null;
    if (!container) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging = true;

    const rects = measureLineRects(container);
    const boundaries = [...rects.map((r) => r.top), rects[rects.length - 1].bottom];
    const containerTop = container.getBoundingClientRect().top;

    function onMove(ev: PointerEvent) {
      const y = ev.clientY - containerTop;
      let closestIdx = 0;
      let closestDist = Infinity;
      boundaries.forEach((b, i) => {
        const d = Math.abs(b - y);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      });
      const newLine = clamp(closestIdx + 1, 1, lineCount);
      if (newLine !== voltaLine) setVoltaLine(sonnetNumber, newLine);
    }

    function onUp() {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
</script>

<div class="volta-marker" class:dragging style:grid-row={voltaLine}>
  <button
    class="handle"
    class:locked={!$isEditingAllowed}
    onpointerdown={onPointerDown}
    aria-label="Drag to move the volta"
  >
    volta
  </button>
</div>

<style>
  .volta-marker {
    grid-column: 1 / -1;
    align-self: start;
    border-top: 1px dashed var(--color-text-dim);
    position: relative;
    pointer-events: none;
  }

  .volta-marker.dragging {
    border-top-color: var(--color-text);
  }

  .handle {
    position: absolute;
    right: 0;
    top: -8px;
    transform: translateY(-100%);
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--color-text-dim);
    cursor: ns-resize;
    pointer-events: auto;
    padding: 2px 6px;
  }

  .volta-marker.dragging .handle,
  .handle:hover {
    color: var(--color-text);
  }

  .handle.locked {
    cursor: default;
  }
</style>
