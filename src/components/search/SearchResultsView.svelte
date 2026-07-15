<script lang="ts">
  import { getSonnet } from '../../data/sonnets';
  import { userData } from '../../stores/userData';
  import { searchSonnetText, searchNotes, searchByTag } from '../../lib/search';
  import { navigate } from '../../stores/route';
  import EmptyState from '../common/EmptyState.svelte';

  let { query }: { query: string } = $props();

  let textMatches = $derived(searchSonnetText(query));
  let noteMatches = $derived(searchNotes(query, $userData));
  let tagMatches = $derived(searchByTag(query, $userData));

  let hasAnyMatches = $derived(textMatches.length > 0 || noteMatches.length > 0 || tagMatches.length > 0);

  function openSonnet(n: number) {
    navigate({ view: 'sonnet', number: n });
  }
</script>

<div class="search-results">
  <p class="heading">Search: &ldquo;{query}&rdquo;</p>

  {#if !hasAnyMatches}
    <EmptyState title="No matches" body="Nothing in the sonnets, your notes, or your tags matches that search." />
  {:else}
    {#if tagMatches.length > 0}
      <section>
        <p class="section-title">By tag</p>
        {#each tagMatches as m (m.sonnet + '-' + m.tagName)}
          {@const sonnet = getSonnet(m.sonnet)}
          <div
            class="result-row"
            onclick={() => openSonnet(m.sonnet)}
            onkeydown={(e) => e.key === 'Enter' && openSonnet(m.sonnet)}
            role="button"
            tabindex="0"
          >
            <span class="number">Sonnet {m.sonnet}</span>
            <span class="snippet">{sonnet ? sonnet.lines[0] : ''}</span>
            <span class="tag-name">{m.tagName}</span>
          </div>
        {/each}
      </section>
    {/if}

    {#if textMatches.length > 0}
      <section>
        <p class="section-title">In the sonnets</p>
        {#each textMatches as m (m.sonnet + '-' + m.lineIndex)}
          <div
            class="result-row"
            onclick={() => openSonnet(m.sonnet)}
            onkeydown={(e) => e.key === 'Enter' && openSonnet(m.sonnet)}
            role="button"
            tabindex="0"
          >
            <span class="number">Sonnet {m.sonnet}</span>
            <span class="snippet">{m.lineText}</span>
          </div>
        {/each}
      </section>
    {/if}

    {#if noteMatches.length > 0}
      <section>
        <p class="section-title">In your notes</p>
        {#each noteMatches as m (m.annotationId)}
          <div
            class="result-row"
            onclick={() => openSonnet(m.sonnet)}
            onkeydown={(e) => e.key === 'Enter' && openSonnet(m.sonnet)}
            role="button"
            tabindex="0"
          >
            <span class="number">Sonnet {m.sonnet}</span>
            <span class="snippet note">{m.text}</span>
          </div>
        {/each}
      </section>
    {/if}
  {/if}
</div>

<style>
  .search-results {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  .heading {
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-text);
    margin-bottom: var(--space-4);
  }

  .section-title {
    font-family: var(--font-sans);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-dim);
    margin: var(--space-4) 0 var(--space-2);
  }

  .result-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-rule);
    cursor: pointer;
  }

  .number {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--color-text-dim);
    flex: none;
  }

  .snippet {
    font-family: var(--font-serif);
    font-size: 15px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snippet.note {
    font-style: italic;
  }

  .tag-name {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    flex: none;
    margin-left: auto;
  }
</style>
