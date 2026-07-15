<script lang="ts">
  import { findEchoes } from '../../lib/echoSearch';
  import { addConnection, updateConnectionNote } from '../../stores/userData';
  import { pendingLink, disarm } from '../../stores/selection';
  import type { Endpoint } from '../../lib/types';

  let {
    sourceEndpoint,
    sourceText,
    anchorRect,
    onClose,
  }: {
    sourceEndpoint: Endpoint;
    sourceText: string;
    anchorRect: DOMRect;
    onClose: () => void;
  } = $props();

  let candidates = $derived(findEchoes(sourceText, sourceEndpoint.sonnet));

  const popoverWidth = Math.min(320, window.innerWidth - 32);
  let top = anchorRect.bottom + window.scrollY + 6;
  let left = Math.max(16, Math.min(anchorRect.left + window.scrollX, window.innerWidth - popoverWidth - 16));

  let connectedId = $state<string | null>(null);
  let connectedSonnet = $state<number | null>(null);
  let noteValue = $state('');

  function confirm(sonnet: number, lineIndex: number, lineText: string) {
    const target: Endpoint = { sonnet, lineStart: lineIndex, lineEnd: lineIndex, charStart: 0, charEnd: lineText.length };
    connectedId = addConnection(sourceEndpoint, target);
    connectedSonnet = sonnet;
  }

  function onNoteInput() {
    if (connectedId) updateConnectionNote(connectedId, noteValue);
  }

  function manualLink() {
    pendingLink.set({ sourceEndpoint });
    disarm();
    onClose();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop" onclick={onClose} role="presentation"></div>

<div class="echo-popover" style:top={`${top}px`} style:left={`${left}px`}>
  {#if connectedId}
    <p class="prompt">Connected to Sonnet {connectedSonnet}</p>
    <textarea
      class="note-field"
      placeholder="Add a note about this echo… (optional)"
      bind:value={noteValue}
      oninput={onNoteInput}
      rows="3"
      autofocus
    ></textarea>
    <div class="actions">
      <button class="cancel" onclick={onClose}>Done</button>
    </div>
  {:else}
    <p class="prompt">Echoes of &ldquo;{sourceText}&rdquo;</p>

    {#if candidates.length === 0}
      <p class="empty">No matches with distinctive shared words.</p>
    {:else}
      <ul>
        {#each candidates as c (c.sonnet + '-' + c.lineIndex)}
          <li>
            <button onclick={() => confirm(c.sonnet, c.lineIndex, c.lineText)}>
              <span class="sonnet-no">Sonnet {c.sonnet}</span>
              <span class="line-text">{c.lineText}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="actions">
      <button class="manual" onclick={manualLink}>Or find it yourself — navigate &amp; select a line</button>
      <button class="cancel" onclick={onClose}>Cancel</button>
    </div>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
  }

  .echo-popover {
    position: absolute;
    z-index: 21;
    width: min(320px, calc(100vw - 32px));
    max-height: 360px;
    overflow-y: auto;
    background: var(--color-bg);
    border: 1px solid var(--color-rule-strong);
    padding: var(--space-3);
  }

  .prompt {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    margin-bottom: var(--space-2);
  }

  .empty {
    font-family: var(--font-serif);
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-dim);
    margin-bottom: var(--space-2);
  }

  .note-field {
    width: 100%;
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid var(--color-rule);
    padding: var(--space-2);
    resize: vertical;
  }

  .note-field:focus {
    outline: none;
    border-color: var(--color-text-dim);
  }

  ul {
    list-style: none;
    margin: 0 0 var(--space-2);
    padding: 0;
  }

  li button {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    text-align: left;
    padding: var(--space-1) var(--space-1);
  }

  li button:hover {
    background: var(--color-highlight-echo-wash);
  }

  .sonnet-no {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-text-dim);
  }

  .line-text {
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--color-text);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-rule);
  }

  .manual,
  .cancel {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-text-dim);
    text-align: left;
  }

  .manual:hover,
  .cancel:hover {
    color: var(--color-text);
  }
</style>
