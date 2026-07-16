<script lang="ts">
  import { route } from './stores/route';
  import TopBar from './components/shell/TopBar.svelte';
  import ListView from './components/list/ListView.svelte';
  import ExploredView from './components/explored/ExploredView.svelte';
  import MapView from './components/map/MapView.svelte';
  import SonnetDetail from './components/detail/SonnetDetail.svelte';
  import SearchResultsView from './components/search/SearchResultsView.svelte';
  import AboutPopover from './components/shell/AboutPopover.svelte';

  let aboutOpen = $state(false);
  let aboutAnchor = $state<DOMRect | null>(null);

  function openAbout(e: MouseEvent) {
    aboutAnchor = (e.currentTarget as HTMLElement).getBoundingClientRect();
    aboutOpen = true;
  }
</script>

<div class="shell">
  <TopBar />

  <main>
    {#if $route.view === 'list'}
      <ListView />
    {:else if $route.view === 'explored'}
      <ExploredView />
    {:else if $route.view === 'map'}
      <MapView />
    {:else if $route.view === 'sonnet'}
      {#key $route.number}
        <SonnetDetail number={$route.number} />
      {/key}
    {:else if $route.view === 'search'}
      <SearchResultsView query={$route.query} />
    {/if}
  </main>
</div>

<p class="signature">The Sonnet Project</p>
<button class="about-corner" onclick={openAbout}>about this site</button>

{#if aboutOpen && aboutAnchor}
  <AboutPopover anchorRect={aboutAnchor} placement="above" onClose={() => (aboutOpen = false)} />
{/if}

<style>
  .shell {
    max-width: 1100px;
    margin: 0 auto;
    min-height: 100vh;
  }

  main {
    padding-bottom: var(--space-6);
  }

  .signature {
    position: fixed;
    left: 0;
    bottom: var(--space-2);
    padding-left: var(--space-3);
    font-family: 'Canterbury', cursive;
    font-size: 22px;
    letter-spacing: -0.5px;
    color: #000;
    pointer-events: none;
    z-index: 50;
  }

  .about-corner {
    position: fixed;
    right: 0;
    bottom: var(--space-2);
    padding-right: var(--space-3);
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--color-rule-strong);
    z-index: 50;
  }

  .about-corner:hover {
    color: var(--color-text);
  }

  @media (max-width: 640px) {
    .signature,
    .about-corner {
      display: none;
    }
  }
</style>
