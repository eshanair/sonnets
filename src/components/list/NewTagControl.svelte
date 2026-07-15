<script lang="ts">
  import { addTag } from '../../stores/userData';
  import { isEditingAllowed } from '../../stores/auth';

  let open = $state(false);
  let name = $state('');
  let color = $state('#b7c9e6');

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addTag({ name: trimmed, color });
    name = '';
    color = '#b7c9e6';
    open = false;
  }
</script>

{#if $isEditingAllowed}
  {#if open}
    <form class="new-tag-form" onsubmit={submit}>
      <input type="color" bind:value={color} aria-label="Tag color" />
      <input type="text" placeholder="Tag name" bind:value={name} autofocus />
      <button type="submit" class="confirm">Add</button>
      <button type="button" class="cancel" onclick={() => (open = false)}>Cancel</button>
    </form>
  {:else}
    <button class="add-tag-trigger" onclick={() => (open = true)}>+ New tag</button>
  {/if}
{/if}

<style>
  .add-tag-trigger {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
  }

  .add-tag-trigger:hover {
    color: var(--color-text);
  }

  .new-tag-form {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .new-tag-form input[type='color'] {
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: none;
  }

  .new-tag-form input[type='text'] {
    font-size: 12px;
    border-bottom: 1px solid var(--color-rule);
    width: 100px;
  }

  .new-tag-form input[type='text']:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  .confirm,
  .cancel {
    font-size: 12px;
    color: var(--color-text-dim);
  }

  .confirm:hover,
  .cancel:hover {
    color: var(--color-text);
  }
</style>
