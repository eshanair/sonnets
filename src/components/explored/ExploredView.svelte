<script lang="ts">
  import { SONNETS } from '../../data/sonnets';
  import { annotationCounts } from '../../stores/userData';
  import ExploredRow from './ExploredRow.svelte';

  let ranked = $derived(
    [...SONNETS].sort((a, b) => {
      const countA = $annotationCounts[a.number] ?? 0;
      const countB = $annotationCounts[b.number] ?? 0;
      if (countB !== countA) return countB - countA;
      return a.number - b.number;
    }),
  );
</script>

<div class="explored-view">
  <p class="explanation">
    Ranked by how much you've engaged with each sonnet — notes, labels, tags, and connections all
    count. The ones you return to rise to the top; untouched sonnets sit at 0.
  </p>
  {#each ranked as sonnet (sonnet.number)}
    <ExploredRow {sonnet} count={$annotationCounts[sonnet.number] ?? 0} />
  {/each}
</div>

<style>
  .explored-view {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--space-4);
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
