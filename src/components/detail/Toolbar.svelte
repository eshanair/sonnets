<script lang="ts">
  import { userData, addCustomLabel } from '../../stores/userData';
  import { armedTool, disarm } from '../../stores/selection';
  import { isEditingAllowed } from '../../stores/auth';
  import { HIGHLIGHT_COLORS } from '../../lib/types';
  import type { ArmedTool } from '../../lib/types';

  const BUILT_IN_LABELS = [
    'enjambment',
    'caesura',
    'apostrophe',
    'metaphor/conceit',
    'antithesis',
    'wordplay/pun',
    'irregular meter',
    'alliteration',
  ];

  let labels = $derived([...BUILT_IN_LABELS, ...$userData.customLabels]);

  let addingLabel = $state(false);
  let newLabelName = $state('');

  let selectedLabel = $derived($armedTool.kind === 'label' ? $armedTool.label : '');

  function isArmed(tool: ArmedTool): boolean {
    if (tool.kind !== $armedTool.kind) return false;
    if (tool.kind === 'label' && $armedTool.kind === 'label') return tool.label === $armedTool.label;
    if (tool.kind === 'highlight' && $armedTool.kind === 'highlight') return tool.color === $armedTool.color;
    return true;
  }

  function toggle(tool: ArmedTool) {
    if (isArmed(tool)) disarm();
    else armedTool.set(tool);
  }

  function onLabelSelect(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    if (value === '__new__') {
      addingLabel = true;
    } else if (value === '') {
      disarm();
    } else {
      armedTool.set({ kind: 'label', label: value });
    }
  }

  function submitLabel(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    addCustomLabel(trimmed);
    armedTool.set({ kind: 'label', label: trimmed });
    newLabelName = '';
    addingLabel = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      disarm();
      addingLabel = false;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="toolbar">
  <div class="tool-group">
    <span class="group-label" class:disabled={!$isEditingAllowed}>Highlight</span>
    {#each HIGHLIGHT_COLORS as c (c.name)}
      <button
        class="swatch"
        class:active={isArmed({ kind: 'highlight', color: c.value })}
        style:background-color={c.value}
        onclick={() => toggle({ kind: 'highlight', color: c.value })}
        disabled={!$isEditingAllowed}
        aria-label={`Highlight (${c.name})`}
      ></button>
    {/each}
  </div>

  <button
    class="tool echo"
    class:active={isArmed({ kind: 'echo' })}
    onclick={() => toggle({ kind: 'echo' })}
  >
    Find Echoes
  </button>

  <span class="divider"></span>

  {#if addingLabel}
    <form class="new-label-form" onsubmit={submitLabel}>
      <input type="text" placeholder="Custom label" bind:value={newLabelName} autofocus />
      <button type="submit">Add</button>
      <button type="button" class="cancel" onclick={() => (addingLabel = false)}>Cancel</button>
    </form>
  {:else}
    <select class="label-select" value={selectedLabel} onchange={onLabelSelect} disabled={!$isEditingAllowed}>
      <option value="">Label…</option>
      {#each labels as label (label)}
        <option value={label}>{label}</option>
      {/each}
      <option value="__new__">+ New label…</option>
    </select>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-3);
  }

  .tool-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 640px) {
    .tool-group {
      flex-basis: 100%;
      justify-content: flex-end;
    }
  }

  .group-label {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    margin-right: 2px;
  }

  .group-label.disabled {
    opacity: 0.4;
  }

  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid var(--color-rule-strong);
  }

  .swatch.active {
    border: 2px solid var(--color-text);
  }

  .swatch:disabled,
  .tool:disabled,
  .label-select:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .tool {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    padding: 3px 0;
    border-bottom: 1px solid transparent;
  }

  .tool:hover {
    color: var(--color-text);
  }

  .tool.echo.active {
    color: var(--color-text);
    border-bottom-color: var(--color-highlight-echo);
  }

  .divider {
    width: 1px;
    height: 12px;
    background: var(--color-rule);
  }

  .label-select {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    background: #fff;
    border: 1px solid #000;
    border-radius: 0;
    padding: 3px var(--space-2);
    cursor: pointer;
  }

  .label-select:focus {
    outline: none;
  }

  .new-label-form {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .new-label-form input {
    font-size: 12px;
    border-bottom: 1px solid var(--color-rule);
    width: 100px;
  }

  .new-label-form input:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  .new-label-form button {
    font-size: 12px;
    color: var(--color-text-dim);
  }

  .new-label-form button:hover {
    color: var(--color-text);
  }
</style>
