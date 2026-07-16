<script lang="ts">
  import { LOCKED_TAGS } from '../../lib/types';
  import { userData, toggleSonnetTag, getSonnetUserData } from '../../stores/userData';
  import { isEditingAllowed } from '../../stores/auth';
  import TagDot from '../common/TagDot.svelte';
  import NewTagControl from '../list/NewTagControl.svelte';

  let { number }: { number: number } = $props();

  let open = $state(false);
  let rootEl: HTMLElement | undefined = $state();

  let sonnetTags = $derived(getSonnetUserData($userData, number).tags);
  let tagObjs = $derived($userData.tags.filter((t) => sonnetTags.includes(t.name)));

  function onWindowClick(e: MouseEvent) {
    if (!open || !rootEl) return;
    // composedPath (not contains()) because the click that opens the "+ New tag"
    // form removes that trigger button from the DOM as a side effect of the
    // same click, which would otherwise make an ancestor-containment check
    // fail on an already-detached node.
    if (!e.composedPath().includes(rootEl)) open = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="sonnet-tags" bind:this={rootEl}>
  <button class="dots-trigger" onclick={() => (open = !open)} aria-label="Edit tags">
    {#each tagObjs as tag (tag.name)}
      <TagDot color={tag.color} title={tag.name} />
    {/each}
    {#if $isEditingAllowed}
      <span class="add-icon">+</span>
    {/if}
  </button>

  {#if open}
    <div class="tag-dropdown">
      {#each $userData.tags as tag (tag.name)}
        {@const locked = LOCKED_TAGS.includes(tag.name)}
        <label class:locked>
          <input
            type="checkbox"
            checked={sonnetTags.includes(tag.name)}
            disabled={locked || !$isEditingAllowed}
            onchange={() => toggleSonnetTag(number, tag.name)}
          />
          <TagDot color={tag.color} />
          <span>{tag.name}</span>
        </label>
      {/each}
      <hr class="hairline" />
      <NewTagControl />
    </div>
  {/if}
</div>

<style>
  .sonnet-tags {
    position: relative;
  }

  .dots-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 1.2em;
    padding: 2px;
  }

  .add-icon {
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1;
    color: var(--color-rule-strong);
  }

  .dots-trigger:hover .add-icon {
    color: var(--color-text-dim);
  }

  .tag-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 30;
    width: 200px;
    background: var(--color-bg);
    border: 1px solid var(--color-rule-strong);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .tag-dropdown label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    cursor: pointer;
  }

  .tag-dropdown label.locked {
    cursor: default;
    opacity: 0.6;
  }

  .tag-dropdown hr {
    margin: 2px 0;
  }
</style>
