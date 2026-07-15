<script lang="ts">
  import { route, navigate } from '../../stores/route';
  import { isEditingAllowed, clearEditPassword } from '../../stores/auth';
  import TagFilterDropdown from './TagFilterDropdown.svelte';
  import SearchBox from './SearchBox.svelte';
  import JoinPopover from './JoinPopover.svelte';

  const views: Array<{ key: 'list' | 'explored' | 'map'; label: string }> = [
    { key: 'list', label: 'List' },
    { key: 'explored', label: 'Explored' },
    { key: 'map', label: 'Map' },
  ];

  function isActive(key: string): boolean {
    return $route.view === key;
  }

  let showTagFilter = $derived(
    $route.view === 'list' || $route.view === 'explored' || $route.view === 'map',
  );

  let joinOpen = $state(false);
</script>

<div class="top-bar-fixed">
  <header class="top-bar">
    <nav class="views">
      {#each views as v (v.key)}
        <button
          class="view-toggle"
          class:active={isActive(v.key)}
          onclick={() => navigate({ view: v.key })}
        >
          {v.label}
        </button>
      {/each}
    </nav>
    

    <div class="right-controls">
      {#if showTagFilter}
        <TagFilterDropdown />
      {/if}
      <div class="search-wrap">
        <SearchBox />
      </div>
      {#if $isEditingAllowed}
        <button class="join-trigger" onclick={() => clearEditPassword()}>editing · log out</button>
      {:else}
        <button class="join-trigger" onclick={() => (joinOpen = true)}>join?</button>
      {/if}
    </div>
  </header>

  <hr class="hairline" />
</div>

{#if joinOpen}
  <JoinPopover onClose={() => (joinOpen = false)} />
{/if}

<style>
  .top-bar-fixed {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-bg);
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3) var(--space-4);
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-4);
    flex-wrap: wrap;
  }

  .views {
    display: flex;
    gap: var(--space-4);
  }

  .view-toggle {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    padding: var(--space-1) 0;
    border-bottom: 1px solid transparent;
  }

  .view-toggle.active {
    color: var(--color-text);
    border-bottom-color: var(--color-text);
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-left: auto;
  }

  .search-wrap {
    display: flex;
  }

  .join-trigger {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--color-rule-strong);
    white-space: nowrap;
  }

  .join-trigger:hover {
    color: var(--color-text);
  }

  @media (max-width: 640px) {
    .top-bar {
      padding: var(--space-3);
      gap: var(--space-2) var(--space-3);
    }

    .views {
      order: 1;
      gap: var(--space-3);
    }

    .right-controls {
      order: 2;
      flex-wrap: wrap;
      width: 100%;
      justify-content: flex-end;
    }

    .search-wrap {
      order: 3;
      flex-basis: 100%;
      width: 100%;
    }
  }
</style>
