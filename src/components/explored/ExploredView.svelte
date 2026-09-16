<script lang="ts">
  import { SONNETS } from '../../data/sonnets';
  import { userData, annotationCounts } from '../../stores/userData';
  import { deriveConnectionHierarchy } from '../../lib/connections';
  import ExploredRow from './ExploredRow.svelte';
  import ConnectionSystem from './ConnectionSystem.svelte';
  import EmptyState from '../common/EmptyState.svelte';

  let mode = $state<'ranked' | 'system'>('ranked');

  let ranked = $derived(
    [...SONNETS].sort((a, b) => {
      const countA = $annotationCounts[a.number] ?? 0;
      const countB = $annotationCounts[b.number] ?? 0;
      if (countB !== countA) return countB - countA;
      return a.number - b.number;
    }),
  );

  let hierarchy = $derived(deriveConnectionHierarchy($userData));
</script>

<div class="explored-view">
  <div class="mode-toggle">
    <button class="mode-btn" class:active={mode === 'ranked'} onclick={() => (mode = 'ranked')}>Ranked</button>
    <button class="mode-btn" class:active={mode === 'system'} onclick={() => (mode = 'system')}>System</button>
  </div>

  {#if mode === 'ranked'}
    <p class="explanation">
      Ranked by engagement with each sonnet — notes, labels, tags, and connection
      count. Ones returned to the most rise to the top; untouched sonnets sit at 0.
    </p>
    {#each ranked as sonnet (sonnet.number)}
      <ExploredRow {sonnet} count={$annotationCounts[sonnet.number] ?? 0} />
    {/each}
  {:else if hierarchy.length === 0}
    <EmptyState
      title="No connections yet"
      body="Select a phrase with the Find Echoes tool on any sonnet's page, or link two spans manually, and the sonnets you connect will appear here as a structure."
    />
  {:else}
    <p class="explanation">
      The corpus as a linked structure — every sonnet that's been connected via Find
      Echoes, and what it's tied to.
    </p>
    <ConnectionSystem {hierarchy} />
  {/if}
</div>

<style>
  .explored-view {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  .mode-toggle {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .mode-btn {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    padding: var(--space-1) 0;
    border-bottom: 1px solid transparent;
  }

  .mode-btn.active {
    color: var(--color-text);
    border-bottom-color: var(--color-text);
  }

  .explanation {
    font-family: var(--font-serif);
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-dim);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-rule);
  }
</style>
