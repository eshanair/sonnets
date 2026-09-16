<script lang="ts">
  import type { StaticSonnet } from '../../lib/types';
  import { LOCKED_TAGS, TAG_DESCRIPTIONS } from '../../lib/types';
  import { userData, toggleSonnetTag, getSonnetUserData } from '../../stores/userData';
  import { navigate } from '../../stores/route';
  import { isEditingAllowed } from '../../stores/auth';
  import TagDot from '../common/TagDot.svelte';
  import Tooltip from '../common/Tooltip.svelte';

  let { sonnet }: { sonnet: StaticSonnet } = $props();

  let editingTags = $state(false);

  let sonnetTags = $derived(getSonnetUserData($userData, sonnet.number).tags);
  let tagObjs = $derived(
    $userData.tags.filter((t) => sonnetTags.includes(t.name)),
  );

  function openDetail() {
    navigate({ view: 'sonnet', number: sonnet.number });
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') openDetail();
  }
</script>

<div class="row-wrap" data-sonnet-number={sonnet.number}>
  <div class="row" onclick={openDetail} onkeydown={onKeydown} tabindex="0" role="button">
    <span class="title">
      <span class="number">Sonnet {sonnet.number}</span>
      <span class="first-line">{sonnet.lines[0]}</span>
    </span>
    <span
      class="dots"
      role="button"
      tabindex="0"
      onclick={(e) => {
        e.stopPropagation();
        editingTags = !editingTags;
      }}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          editingTags = !editingTags;
        }
      }}
    >
      {#each tagObjs as tag (tag.name)}
        <TagDot color={tag.color} title={tag.name} />
      {/each}
    </span>
  </div>

  {#if editingTags}
    <div class="tag-editor">
      {#each $userData.tags as tag (tag.name)}
        {@const locked = LOCKED_TAGS.includes(tag.name)}
        <label class:locked>
          <input
            type="checkbox"
            checked={sonnetTags.includes(tag.name)}
            disabled={locked || !$isEditingAllowed}
            onchange={() => toggleSonnetTag(sonnet.number, tag.name)}
          />
          {#if TAG_DESCRIPTIONS[tag.name]}
            <Tooltip text={TAG_DESCRIPTIONS[tag.name]}>
              <TagDot color={tag.color} />
              {tag.name}
            </Tooltip>
          {:else}
            <TagDot color={tag.color} />
            {tag.name}
          {/if}
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .row-wrap {
    border-bottom: 1px solid var(--color-rule);
  }

  .row {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    cursor: pointer;
  }

  .title {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
    flex: none;
  }

  .number {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    flex: none;
  }

  .row-wrap:hover .number {
    font-weight: 700;
    color: var(--color-text);
  }

  .first-line {
    font-family: var(--font-serif);
    font-size: 12px;
    color: var(--color-text);
    white-space: nowrap;
  }

  .dots {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    min-width: var(--space-3);
    min-height: 1em;
    padding: var(--space-1);
    cursor: pointer;
  }

  .tag-editor {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-2) 0 var(--space-3);
  }

  .tag-editor label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-dim);
    cursor: pointer;
  }

  .tag-editor label.locked {
    cursor: default;
    opacity: 0.6;
  }

  @media (max-width: 640px) {
    .title {
      flex: 1 1 auto;
      min-width: 0;
    }

    .first-line {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row {
      gap: var(--space-2);
    }
  }
</style>
