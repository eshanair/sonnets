<script lang="ts">
  import { SONNETS } from '../../data/sonnets';
  import { userData, getSonnetUserData } from '../../stores/userData';
  import { activeTagFilter } from '../../stores/filter';
  import ImagePlaceholder from './ImagePlaceholder.svelte';
  import TagLegend from './TagLegend.svelte';
  import SonnetRow from './SonnetRow.svelte';
  import SonnetHoverArt from './SonnetHoverArt.svelte';
  import AboutPopover from '../shell/AboutPopover.svelte';

  let aboutOpen = $state(false);
  let aboutAnchor = $state<DOMRect | null>(null);

  function openAbout(e: MouseEvent) {
    aboutAnchor = (e.currentTarget as HTMLElement).getBoundingClientRect();
    aboutOpen = true;
  }

  let filtered = $derived(
    $activeTagFilter === 'All'
      ? SONNETS
      : SONNETS.filter((s) =>
          getSonnetUserData($userData, s.number).tags.includes($activeTagFilter),
        ),
  );

  let hoveredNumber = $state<number | null>(null);

  let hoveredSonnet = $derived(hoveredNumber ? SONNETS.find((s) => s.number === hoveredNumber) : null);
  let hoverLines = $derived(hoveredSonnet ? hoveredSonnet.lines : []);

  function rowNumberFromEvent(e: Event): number | null {
    const rowEl = (e.target as HTMLElement).closest<HTMLElement>('[data-sonnet-number]');
    return rowEl ? Number(rowEl.dataset.sonnetNumber) : null;
  }

  function onRowsMouseOver(e: MouseEvent) {
    const num = rowNumberFromEvent(e);
    if (num !== null) hoveredNumber = num;
  }

  function onRowsMouseLeave() {
    hoveredNumber = null;
  }

  // Touch devices have no hover state, so a finger-down gets the same treatment
  // as a mouseover — the preview appears immediately under the touch, ahead of
  // the tap's own navigation.
  function onRowsTouchStart(e: TouchEvent) {
    const num = rowNumberFromEvent(e);
    if (num !== null) hoveredNumber = num;
  }
</script>

<div class="list-view">
  <aside class="side">
    <div class="mobile-heading">
      <span class="mobile-title">The Sonnet Project</span>
      <button class="mobile-tagline" onclick={openAbout}>about this site</button>
    </div>
    <ImagePlaceholder />
    <TagLegend />
  </aside>

  <section
    class="rows"
    onmouseover={onRowsMouseOver}
    onmouseleave={onRowsMouseLeave}
    ontouchstart={onRowsTouchStart}
  >
    {#each filtered as sonnet (sonnet.number)}
      <SonnetRow {sonnet} />
    {/each}
  </section>
</div>

<SonnetHoverArt lines={hoverLines} visible={!!hoveredSonnet} />

{#if aboutOpen && aboutAnchor}
  <AboutPopover anchorRect={aboutAnchor} onClose={() => (aboutOpen = false)} />
{/if}

<style>
  .list-view {
    display: grid;
    grid-template-columns: minmax(240px, 340px) minmax(0, 1fr);
    gap: var(--space-6);
    padding: var(--space-2);
    align-items: start;
  }

  .side {
    position: sticky;
    top: calc(76px + var(--space-4));
  }

  .rows {
    min-width: 0;
    max-width: 560px;
    position: relative;
  }

  .mobile-heading {
    display: none;
  }

  @media (max-width: 640px) {
    .list-view {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding: var(--space-3);
    }

    .side {
      position: static;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .mobile-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      width: 100%;
      gap: var(--space-3);
    }

    .mobile-title {
      font-family: 'Canterbury', cursive;
      font-size: 20px;
      color: #000;
      white-space: nowrap;
    }

    .mobile-tagline {
      font-family: var(--font-serif);
      font-style: italic;
      font-size: 12px;
      color: var(--color-rule-strong);
      text-align: right;
    }

    .mobile-tagline:hover {
      color: var(--color-text);
    }

    .side :global(.image-placeholder) {
      width: 160px;
    }

    .side :global(.tag-legend) {
      width: 100%;
    }

    .rows {
      max-width: none;
    }
  }
</style>
