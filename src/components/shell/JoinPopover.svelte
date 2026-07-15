<script lang="ts">
  import { setEditPassword } from '../../stores/auth';

  let { onClose }: { onClose: () => void } = $props();

  let password = $state('');
  let status = $state<'idle' | 'checking' | 'error'>('idle');

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    status = 'checking';
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setEditPassword(password);
        onClose();
      } else {
        status = 'error';
      }
    } catch {
      status = 'error';
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop" onclick={onClose} role="presentation"></div>

<form class="join-popover" onsubmit={onSubmit}>
  <p class="prompt">Ask Esha for password.</p>
  <input
    type="password"
    placeholder="Password"
    bind:value={password}
    oninput={() => (status = 'idle')}
    autofocus
  />
  {#if status === 'error'}
    <p class="error">Incorrect password, or couldn't reach the server.</p>
  {/if}
</form>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
  }

  .join-popover {
    position: fixed;
    top: 64px;
    right: var(--space-3);
    z-index: 121;
    width: 220px;
    background: #fff;
    border: 1px solid #000;
    padding: var(--space-3);
  }

  .prompt {
    font-family: var(--font-serif);
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-dim);
    margin-bottom: var(--space-2);
  }

  input {
    width: 100%;
    border: none;
    border-bottom: 1px solid var(--color-rule);
    padding: var(--space-1) 0;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  input:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  .error {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-rule-strong);
    margin-top: var(--space-2);
  }
</style>
