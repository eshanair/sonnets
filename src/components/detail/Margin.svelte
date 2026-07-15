<script lang="ts">
  import { onMount } from 'svelte';
  import type { StaticSonnet } from '../../lib/types';
  import { userData, getSonnetUserData, connectionsForSonnet } from '../../stores/userData';
  import { AnchorTracker, resolveStacking } from '../../lib/geometry';
  import AnnotationItem from './AnnotationItem.svelte';
  import ConnectionItem from './ConnectionItem.svelte';

  let { sonnet, containerEl }: { sonnet: StaticSonnet; containerEl?: HTMLElement } = $props();

  const MARGIN_LEFT = 620;
  const MOBILE_QUERY = '(max-width: 860px)';

  let sd = $derived(getSonnetUserData($userData, sonnet.number));
  let annotationItems = $derived(sd.annotations); // notes and labels both render in the margin
  let connItems = $derived(connectionsForSonnet($userData, sonnet.number));

  interface Item {
    id: string;
    kind: 'annotation' | 'connection';
  }
  let items = $derived<Item[]>([
    ...annotationItems.map((a) => ({ id: a.id, kind: 'annotation' as const })),
    ...connItems.map((c) => ({ id: c.connection.id, kind: 'connection' as const })),
  ]);

  const itemEls: Record<string, HTMLElement> = {};

  // Desktop: items float beside the text, positioned by absolute top.
  let anchorTops = $state<Record<string, number>>({});
  let anchorRights = $state<Record<string, number>>({});
  let resolvedTops = $state<Record<string, number>>({});
  let measured = $state(false);

  // Mobile: items stack in normal flow below the poem, but a connector still
  // runs from the highlighted span down to wherever its item landed.
  let mobileAnchorX = $state<Record<string, number>>({});
  let mobileAnchorBottom = $state<Record<string, number>>({});
  let mobileItemX = $state<Record<string, number>>({});
  let mobileItemTop = $state<Record<string, number>>({});
  let mobileMeasured = $state(false);

  let isMobile = $state(false);

  function remeasureDesktop() {
    if (!containerEl) return;
    const tracker = new AnchorTracker(containerEl);
    const ids = items.map((i) => i.id);
    const anchors = tracker.measure(ids);

    const rawTops: Record<string, number> = {};
    const rawRights: Record<string, number> = {};
    for (const id of ids) {
      const a = anchors.get(id);
      if (a) {
        rawTops[id] = a.top;
        rawRights[id] = a.right;
      }
    }

    const heights = new Map<string, number>();
    for (const id of ids) {
      heights.set(id, itemEls[id]?.getBoundingClientRect().height ?? 22);
    }
    const stackInput = ids.filter((id) => id in rawTops).map((id) => ({ id, top: rawTops[id] }));
    const resolved = resolveStacking(stackInput, heights, 10);
    const out: Record<string, number> = {};
    resolved.forEach((v, k) => (out[k] = v));

    anchorTops = rawTops;
    anchorRights = rawRights;
    resolvedTops = out;
    measured = true;
  }

  function remeasureMobile() {
    if (!containerEl) return;
    const tracker = new AnchorTracker(containerEl);
    const ids = items.map((i) => i.id);
    const anchors = tracker.measure(ids);
    const containerRect = containerEl.getBoundingClientRect();

    const ax: Record<string, number> = {};
    const ab: Record<string, number> = {};
    const ix: Record<string, number> = {};
    const it: Record<string, number> = {};

    for (const id of ids) {
      const a = anchors.get(id);
      if (a) {
        ax[id] = (a.left + a.right) / 2;
        ab[id] = a.bottom;
      }
      const el = itemEls[id];
      if (el) {
        const r = el.getBoundingClientRect();
        ix[id] = r.left - containerRect.left + r.width / 2;
        it[id] = r.top - containerRect.top;
      }
    }

    mobileAnchorX = ax;
    mobileAnchorBottom = ab;
    mobileItemX = ix;
    mobileItemTop = it;
    mobileMeasured = true;
  }

  function remeasure() {
    if (isMobile) remeasureMobile();
    else remeasureDesktop();
  }

  function scheduleRemeasure() {
    requestAnimationFrame(() => requestAnimationFrame(remeasure));
  }

  $effect(() => {
    void items;
    void containerEl;
    void isMobile;
    scheduleRemeasure();
  });

  onMount(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    isMobile = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };
    mq.addEventListener('change', onChange);

    let ro: ResizeObserver | undefined;
    if (containerEl) {
      ro = new ResizeObserver(() => scheduleRemeasure());
      ro.observe(containerEl);
    }
    window.addEventListener('resize', scheduleRemeasure);
    document.fonts?.ready?.then(scheduleRemeasure);
    return () => {
      mq.removeEventListener('change', onChange);
      ro?.disconnect();
      window.removeEventListener('resize', scheduleRemeasure);
    };
  });
</script>

{#if isMobile}
  <svg class="mobile-connectors">
    {#each items as item (item.id)}
      {#if mobileMeasured && mobileAnchorX[item.id] !== undefined && mobileItemTop[item.id] !== undefined}
        <line
          x1={mobileAnchorX[item.id]}
          y1={mobileAnchorBottom[item.id]}
          x2={mobileItemX[item.id]}
          y2={mobileItemTop[item.id]}
        />
      {/if}
    {/each}
  </svg>

  <div class="margin-mobile">
    {#each items as item (item.id)}
      <div class="mobile-item" bind:this={itemEls[item.id]}>
        {#if item.kind === 'annotation'}
          {@const ann = annotationItems.find((a) => a.id === item.id)}
          {#if ann}
            <p class="line-ref">Line {ann.lineStart + 1}</p>
            <AnnotationItem sonnetNumber={sonnet.number} annotation={ann} />
          {/if}
        {:else}
          {@const c = connItems.find((x) => x.connection.id === item.id)}
          {#if c}
            <p class="line-ref">Line {c.self.lineStart + 1}</p>
            <ConnectionItem connection={c.connection} self={c.self} other={c.other} />
          {/if}
        {/if}
      </div>
    {/each}

    {#if items.length === 0}
      <p class="empty-hint">No notes or connections yet.</p>
    {/if}
  </div>
{:else}
  <div class="margin-overlay">
    <svg class="connectors">
      {#each items as item (item.id)}
        {#if measured && anchorTops[item.id] !== undefined && resolvedTops[item.id] !== undefined}
          <line
            x1={anchorRights[item.id] + 4}
            y1={anchorTops[item.id] + 10}
            x2={MARGIN_LEFT - 8}
            y2={resolvedTops[item.id] + 10}
          />
        {/if}
      {/each}
    </svg>

    {#each items as item (item.id)}
      <div
        class="margin-item"
        class:measured
        bind:this={itemEls[item.id]}
        style:top={`${resolvedTops[item.id] ?? anchorTops[item.id] ?? 0}px`}
        style:left={`${MARGIN_LEFT}px`}
      >
        {#if item.kind === 'annotation'}
          {@const ann = annotationItems.find((a) => a.id === item.id)}
          {#if ann}
            <AnnotationItem sonnetNumber={sonnet.number} annotation={ann} />
          {/if}
        {:else}
          {@const c = connItems.find((x) => x.connection.id === item.id)}
          {#if c}
            <ConnectionItem connection={c.connection} self={c.self} other={c.other} />
          {/if}
        {/if}
      </div>
    {/each}

    {#if items.length === 0}
      <p class="empty-hint">No notes or connections yet.</p>
    {/if}
  </div>
{/if}

<style>
  .margin-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .connectors {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .connectors line {
    stroke: var(--color-rule-strong);
    stroke-width: 1;
  }

  .margin-item {
    position: absolute;
    width: 260px;
    pointer-events: auto;
    opacity: 0;
    transition: top 0.15s ease, opacity 0.15s ease;
  }

  .margin-item.measured {
    opacity: 1;
  }

  .mobile-connectors {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .mobile-connectors line {
    stroke: var(--color-rule-strong);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }

  .margin-mobile {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-rule);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .mobile-item {
    padding-bottom: var(--space-3);
  }

  .line-ref {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-text-dim);
    margin-bottom: 4px;
  }

  .empty-hint {
    font-family: var(--font-serif);
    font-size: 13px;
    font-style: italic;
    color: var(--color-rule-strong);
  }

  .margin-overlay .empty-hint {
    position: absolute;
    left: 620px;
    top: 0;
  }
</style>
