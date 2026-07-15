<script lang="ts">
  import { userData, getSonnetUserData } from '../../stores/userData';
  import { activeTagFilter } from '../../stores/filter';
  import { deriveMapEdges } from '../../lib/connections';
  import EmptyState from '../common/EmptyState.svelte';
  import MapCanvas from './MapCanvas.svelte';

  let allEdges = $derived(deriveMapEdges($userData));

  let taggedSonnets = $derived(
    $activeTagFilter === 'All'
      ? null
      : new Set(
          Object.entries($userData.sonnetData)
            .filter(([, sd]) => sd.tags.includes($activeTagFilter))
            .map(([n]) => Number(n)),
        ),
  );

  let edges = $derived(
    taggedSonnets ? allEdges.filter((e) => taggedSonnets!.has(e.a) && taggedSonnets!.has(e.b)) : allEdges,
  );

  let sonnetNumbers = $derived([...new Set(edges.flatMap((e) => [e.a, e.b]))]);
</script>

{#if edges.length === 0}
  <EmptyState
    title="No connections yet"
    body="Select a phrase with the Find Echoes tool on any sonnet's page, or link two spans manually, and the sonnets you connect will appear here as a map."
  />
{:else}
  <div class="map-view">
    <MapCanvas {sonnetNumbers} {edges} />
  </div>
{/if}

<style>
  .map-view {
    padding: var(--space-4);
  }

  @media (max-width: 640px) {
    .map-view {
      padding: var(--space-2);
    }
  }
</style>
