<script lang="ts">
  import { route } from './stores/route';
  import TopBar from './components/shell/TopBar.svelte';
  import ListView from './components/list/ListView.svelte';
  import ExploredView from './components/explored/ExploredView.svelte';
  import MapView from './components/map/MapView.svelte';
  import SonnetDetail from './components/detail/SonnetDetail.svelte';
  import SearchResultsView from './components/search/SearchResultsView.svelte';
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
    font-family: 'UnifrakturMaguntia', cursive;
    font-size: 22px;
    letter-spacing: -0.5px;
    color: #000;
    pointer-events: none;
    z-index: 50;
  }

  @media (max-width: 640px) {
    .signature {
      display: none;
    }
  }
</style>
