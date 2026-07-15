<script lang="ts">
  let { title, body = '' }: { title: string; body?: string } = $props();
</script>

<div class="empty-state">
  <p class="title">{title}</p>
  {#if body}
    <p class="body">{body}</p>
  {/if}
</div>

<style>
  .empty-state {
    padding: var(--space-6) var(--space-4);
    text-align: center;
    color: var(--color-text-dim);
    max-width: 32em;
    margin: 0 auto;
  }

  .title {
    font-family: var(--font-sans);
    font-size: 15px;
    margin-bottom: var(--space-2);
  }

  .body {
    font-family: var(--font-serif);
    font-size: 14px;
    font-style: italic;
    line-height: 1.6;
  }
</style>
