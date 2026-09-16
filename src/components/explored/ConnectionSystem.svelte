<script lang="ts">
  import { navigate } from '../../stores/route';
  import type { ConnectionHub } from '../../lib/connections';

  let { hierarchy }: { hierarchy: ConnectionHub[] } = $props();

  // Sizing/spacing for the box-and-connector grammar of the reference
  // diagram: fixed-width leaf slots, hubs sized to fit their own leaves, a
  // single root spanning everything. All static geometry — no simulation.
  const LEAF_W = 68;
  const BOX_H = 28;
  const LEAF_GAP = 8;
  const HUB_GAP = 28;
  const ROW_GAP = 54;
  const MARGIN = 24;

  interface Positioned {
    sonnet: number;
    centerX: number;
  }
  interface HubLayout {
    sonnet: number;
    centerX: number;
    width: number;
    leaves: (Positioned & { note?: string })[];
    spineY: number;
  }

  let layout = $derived.by(() => {
    let cursorX = MARGIN;
    const hubs: HubLayout[] = [];

    for (const hub of hierarchy) {
      const width = hub.links.length * LEAF_W + (hub.links.length - 1) * LEAF_GAP;
      const leaves: (Positioned & { note?: string })[] = [];
      let leafCursor = cursorX;
      for (const link of hub.links) {
        leaves.push({ sonnet: link.other, centerX: leafCursor + LEAF_W / 2, note: link.note });
        leafCursor += LEAF_W + LEAF_GAP;
      }
      hubs.push({ sonnet: hub.sonnet, centerX: cursorX + width / 2, width, leaves, spineY: 0 });
      cursorX += width + HUB_GAP;
    }

    const totalWidth = cursorX - HUB_GAP + MARGIN;
    const rootCenterX =
      hubs.length > 0 ? (hubs[0].centerX + hubs[hubs.length - 1].centerX) / 2 : totalWidth / 2;

    const rootY = MARGIN + BOX_H / 2;
    const hubY = rootY + ROW_GAP;
    const leafY = hubY + ROW_GAP;
    const rootHubSpineY = rootY + ROW_GAP / 2;

    return {
      totalWidth,
      totalHeight: leafY + BOX_H / 2 + MARGIN,
      rootCenterX,
      rootY,
      hubY,
      leafY,
      rootHubSpineY,
      hubs: hubs.map((h) => ({ ...h, spineY: hubY + ROW_GAP / 2 })),
    };
  });

  let hovered = $state<{ sonnet: number; note: string; x: number; y: number } | null>(null);

  function open(sonnet: number) {
    navigate({ view: 'sonnet', number: sonnet });
  }

  function onKeydown(e: KeyboardEvent, sonnet: number) {
    if (e.key === 'Enter') open(sonnet);
  }
</script>

<div class="connection-system">
  <svg
    viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
    width={layout.totalWidth}
    height={layout.totalHeight}
    role="img"
    aria-label="Connection hierarchy"
  >
    <!-- Root -->
    <rect
      class="box root"
      x={layout.rootCenterX - LEAF_W / 2}
      y={layout.rootY - BOX_H / 2}
      width={LEAF_W}
      height={BOX_H}
    ></rect>
    <text class="label root" x={layout.rootCenterX} y={layout.rootY + 4}>CONNECTIONS</text>

    {#if layout.hubs.length > 0}
      <line
        class="wire"
        x1={layout.rootCenterX}
        y1={layout.rootY + BOX_H / 2}
        x2={layout.rootCenterX}
        y2={layout.rootHubSpineY}
      ></line>
      <line
        class="wire"
        x1={layout.hubs[0].centerX}
        y1={layout.rootHubSpineY}
        x2={layout.hubs[layout.hubs.length - 1].centerX}
        y2={layout.rootHubSpineY}
      ></line>
    {/if}

    {#each layout.hubs as hub (hub.sonnet)}
      <line class="wire" x1={hub.centerX} y1={layout.rootHubSpineY} x2={hub.centerX} y2={layout.hubY - BOX_H / 2}
      ></line>

      <g
        class="box-group"
        onclick={() => open(hub.sonnet)}
        onkeydown={(e) => onKeydown(e, hub.sonnet)}
        role="button"
        tabindex="0"
      >
        <rect class="box hub" x={hub.centerX - LEAF_W / 2} y={layout.hubY - BOX_H / 2} width={LEAF_W} height={BOX_H}
        ></rect>
        <text class="label" x={hub.centerX} y={layout.hubY + 4}>{hub.sonnet}</text>
      </g>

      <line class="wire" x1={hub.centerX} y1={layout.hubY + BOX_H / 2} x2={hub.centerX} y2={hub.spineY}></line>
      {#if hub.leaves.length > 1}
        <line
          class="wire"
          x1={hub.leaves[0].centerX}
          y1={hub.spineY}
          x2={hub.leaves[hub.leaves.length - 1].centerX}
          y2={hub.spineY}
        ></line>
      {/if}

      {#each hub.leaves as leaf (leaf.sonnet)}
        <line class="wire" x1={leaf.centerX} y1={hub.spineY} x2={leaf.centerX} y2={layout.leafY - BOX_H / 2}></line>
        <g
          class="box-group"
          onclick={() => open(leaf.sonnet)}
          onkeydown={(e) => onKeydown(e, leaf.sonnet)}
          onmouseenter={() =>
            leaf.note
              ? (hovered = { sonnet: leaf.sonnet, note: leaf.note, x: leaf.centerX, y: layout.leafY + BOX_H / 2 })
              : (hovered = null)}
          onmouseleave={() => (hovered = null)}
          role="button"
          tabindex="0"
        >
          <rect
            class="box leaf"
            class:has-note={!!leaf.note}
            x={leaf.centerX - LEAF_W / 2}
            y={layout.leafY - BOX_H / 2}
            width={LEAF_W}
            height={BOX_H}
          ></rect>
          <text class="label" x={leaf.centerX} y={layout.leafY + 4}>{leaf.sonnet}</text>
        </g>
      {/each}
    {/each}
  </svg>

  {#if hovered}
    <p class="note-label" style:left={`${hovered.x}px`} style:top={`${hovered.y + 8}px`}>
      &ldquo;{hovered.note}&rdquo;
    </p>
  {/if}
</div>

<style>
  .connection-system {
    position: relative;
    overflow-x: auto;
    padding-bottom: var(--space-3);
  }

  .box {
    fill: var(--color-bg);
    stroke: var(--color-rule-strong);
    stroke-width: 1;
  }

  .box.root {
    fill: var(--color-text);
  }

  .box-group {
    cursor: pointer;
  }

  .box-group:hover .box {
    stroke: var(--color-text);
    stroke-width: 1.5;
  }

  .box.leaf.has-note {
    stroke-dasharray: 2 2;
  }

  .wire {
    stroke: var(--color-rule);
    stroke-width: 1;
  }

  .label {
    font-family: var(--font-sans);
    font-size: 11px;
    text-anchor: middle;
    fill: var(--color-text);
    pointer-events: none;
  }

  .label.root {
    font-size: 9px;
    letter-spacing: 0.04em;
    fill: var(--color-bg);
  }

  .note-label {
    position: absolute;
    transform: translateX(-50%);
    max-width: 220px;
    background: #fff;
    border: 1px solid var(--color-rule-strong);
    padding: 4px 8px;
    font-family: var(--font-serif);
    font-size: 12px;
    font-style: italic;
    color: var(--color-text);
    pointer-events: none;
    z-index: 5;
  }
</style>
