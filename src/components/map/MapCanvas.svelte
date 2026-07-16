<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from 'd3-force';
  import { select } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { zoom, type D3ZoomEvent } from 'd3-zoom';
  import { navigate } from '../../stores/route';
  import { getSonnet } from '../../data/sonnets';
  import type { MapEdge } from '../../lib/connections';

  interface Node extends SimulationNodeDatum {
    number: number;
  }

  let { sonnetNumbers, edges }: { sonnetNumbers: number[]; edges: MapEdge[] } = $props();

  const MOBILE_QUERY = '(max-width: 640px)';
  let isMobile = $state(false);

  // On a narrow phone screen the SVG is scaled way down to fit its container
  // (width: 100% against a ~900-unit viewBox), which shrinks nodes/text to
  // near-illegible, untappable specks. Using a much smaller viewBox on mobile
  // keeps the on-screen render scale close to 1:1 instead.
  let width = $derived(isMobile ? 520 : 900);
  let height = $derived(isMobile ? 560 : 600);
  let nodeRadius = $derived(isMobile ? 7 : 5);
  let touchRadius = $derived(isMobile ? 16 : 5);

  let svgEl: SVGSVGElement | undefined = $state();
  let gEl: SVGGElement | undefined = $state();

  let nodes = $state<Node[]>([]);
  let linkPositions = $state<Array<{ id: string; x1: number; y1: number; x2: number; y2: number; weight: number }>>([]);
  let transform = $state({ x: 0, y: 0, k: 1 });
  let hoveredEdge = $state<MapEdge | null>(null);
  let hoveredNode = $state<number | null>(null);

  let simulation: ReturnType<typeof forceSimulation<Node>> | undefined;

  function maxWeight() {
    return edges.reduce((m, e) => Math.max(m, e.weight), 1);
  }

  function rebuild() {
    simulation?.stop();

    const nodeList: Node[] = sonnetNumbers.map((n) => ({ number: n }));
    const nodeByNumber = new Map(nodeList.map((n) => [n.number, n]));
    const linkList = edges.map((e) => ({ source: nodeByNumber.get(e.a)!, target: nodeByNumber.get(e.b)!, weight: e.weight }));

    simulation = forceSimulation(nodeList)
      .force('link', forceLink(linkList).distance(70).strength(0.5))
      .force('charge', forceManyBody().strength(-90))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(isMobile ? 20 : 16))
      .on('tick', () => {
        nodes = [...nodeList];
        linkPositions = linkList.map((l) => ({
          id: `${(l.source as Node).number}-${(l.target as Node).number}`,
          x1: (l.source as Node).x ?? 0,
          y1: (l.source as Node).y ?? 0,
          x2: (l.target as Node).x ?? 0,
          y2: (l.target as Node).y ?? 0,
          weight: l.weight,
        }));
      });
  }

  $effect(() => {
    void sonnetNumbers;
    void edges;
    void width;
    void height;
    void isMobile;
    rebuild();
  });

  onMount(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    isMobile = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };
    mq.addEventListener('change', onChange);

    if (!svgEl || !gEl) return () => mq.removeEventListener('change', onChange);
    const svgSel = select(svgEl);
    const gSel = select(gEl);

    svgSel.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 3])
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          transform = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
        }),
    );

    return () => mq.removeEventListener('change', onChange);
  });

  onDestroy(() => simulation?.stop());

  function dragHandlers(node: Node) {
    return {
      onpointerdown: (e: PointerEvent) => {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        simulation?.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;

        function onMove(ev: PointerEvent) {
          if (!svgEl) return;
          const rect = svgEl.getBoundingClientRect();
          node.fx = (ev.clientX - rect.left - transform.x) / transform.k;
          node.fy = (ev.clientY - rect.top - transform.y) / transform.k;
        }
        function onUp() {
          simulation?.alphaTarget(0);
          node.fx = null;
          node.fy = null;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        }
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      },
    };
  }

  const mw = $derived(maxWeight());
</script>

<div class="map-canvas">
  <svg bind:this={svgEl} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sonnet connection map">
    <g bind:this={gEl} transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
      {#each linkPositions as l (l.id)}
        <line
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          class="edge"
          stroke-width={0.75 + (Math.log(l.weight + 1) / Math.log(mw + 1)) * 2}
          onmouseenter={() => {
            const [a, b] = l.id.split('-').map(Number);
            hoveredEdge = edges.find((e) => e.a === a && e.b === b) ?? { a, b, weight: 1, notes: [] };
          }}
          onmouseleave={() => (hoveredEdge = null)}
          role="presentation"
        />
      {/each}

      {#each nodes as node (node.number)}
        <g
          class="node"
          transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
          {...dragHandlers(node)}
          onclick={() => navigate({ view: 'sonnet', number: node.number })}
          onmouseenter={() => (hoveredNode = node.number)}
          onmouseleave={() => (hoveredNode = null)}
          role="button"
          tabindex="0"
        >
          <circle class="hit-target" r={touchRadius}></circle>
          <circle r={nodeRadius}></circle>
          <text x={nodeRadius + 4} y="4" class:mobile={isMobile}>{node.number}</text>
        </g>
      {/each}
    </g>
  </svg>

  {#if hoveredNode !== null}
    {@const s = getSonnet(hoveredNode)}
    <div class="edge-label">
      <p class="edge-title">Sonnet {hoveredNode}{s ? ` — ${s.lines[0]}` : ''}</p>
    </div>
  {:else if hoveredEdge}
    <div class="edge-label">
      <p class="edge-title">Sonnet {hoveredEdge.a} — Sonnet {hoveredEdge.b}</p>
      {#each hoveredEdge.notes as note}
        <p class="edge-note">&ldquo;{note}&rdquo;</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  .map-canvas {
    position: relative;
  }

  svg {
    width: 100%;
    height: 70vh;
    background: var(--color-bg);
  }

  .edge {
    stroke: var(--color-rule-strong);
    cursor: pointer;
  }

  .edge:hover {
    stroke: var(--color-highlight-echo);
  }

  .node {
    cursor: pointer;
  }

  .node circle {
    fill: var(--color-bg);
    stroke: var(--color-text-dim);
    stroke-width: 1;
  }

  .node circle.hit-target {
    fill: transparent;
    stroke: none;
  }

  .node:hover circle {
    stroke: var(--color-text);
  }

  .node text {
    font-family: var(--font-sans);
    font-size: 9px;
    fill: var(--color-text-dim);
    pointer-events: none;
  }

  .node text.mobile {
    font-size: 13px;
  }

  .edge-label {
    position: absolute;
    bottom: var(--space-3);
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - var(--space-4));
    background: var(--color-bg);
    padding: 4px 10px;
    border: 1px solid var(--color-rule);
  }

  .edge-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text);
  }

  .edge-note {
    margin-top: 2px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--color-text);
    text-align: center;
  }
</style>
