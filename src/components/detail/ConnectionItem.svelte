<script lang="ts">
  import { navigate } from '../../stores/route';
  import { removeConnection, updateConnectionNote } from '../../stores/userData';
  import { isEditingAllowed } from '../../stores/auth';
  import type { Connection, Endpoint } from '../../lib/types';

  let { connection, other }: { connection: Connection; self: Endpoint; other: Endpoint } = $props();

  let noteValue = $state(connection.note ?? '');
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  }

  function onInput() {
    updateConnectionNote(connection.id, noteValue);
    autoResize();
  }

  // Picks up notes set from elsewhere (e.g. the Find Echoes popup's own note
  // field right after confirming a match) without clobbering active typing here.
  $effect(() => {
    const external = connection.note ?? '';
    if (external !== noteValue) noteValue = external;
  });

  $effect(() => {
    void noteValue;
    autoResize();
  });
</script>

<div class="connection-item">
  <button class="target" onclick={() => navigate({ view: 'sonnet', number: other.sonnet })}>
    Sonnet {other.sonnet}, line {other.lineStart + 1}
  </button>
  <div class="text-row">
    <textarea
      bind:this={textareaEl}
      bind:value={noteValue}
      oninput={onInput}
      placeholder="Add a note…"
      rows="1"
      readonly={!$isEditingAllowed}
    ></textarea>
  </div>
  {#if $isEditingAllowed}
    <button class="remove" onclick={() => removeConnection(connection.id)} aria-label="Remove connection">
      &times;
    </button>
  {/if}
</div>

<style>
  .connection-item {
    position: relative;
    padding-right: 16px;
  }

  .target {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--color-highlight-echo);
    text-align: left;
  }

  .target:hover {
    text-decoration: underline;
  }

  .text-row {
    margin-top: 2px;
  }

  textarea {
    width: 100%;
    resize: none;
    overflow: hidden;
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.5;
    border-bottom: 1px solid var(--color-rule);
    min-height: 1.5em;
  }

  @media (max-width: 860px) {
    textarea {
      white-space: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }

  textarea:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  textarea::placeholder {
    color: var(--color-rule-strong);
  }

  .remove {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 12px;
    color: var(--color-text-dim);
    opacity: 0;
  }

  .connection-item:hover .remove {
    opacity: 1;
  }

  @media (max-width: 860px) {
    .connection-item {
      padding-right: 32px;
    }

    .remove {
      width: 28px;
      height: 28px;
      font-size: 20px;
      line-height: 28px;
      text-align: center;
      opacity: 1;
    }
  }
</style>
