<script lang="ts">
  import type { Snippet } from 'svelte';

  let { text, children }: { text: string; children: Snippet } = $props();
</script>

<span class="tooltip-wrap">
  {@render children()}
  <span class="tooltip-bubble" role="tooltip">{text}</span>
</span>

<style>
  .tooltip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tooltip-bubble {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    width: max-content;
    max-width: 220px;
    background: #fff;
    border: 1px solid var(--color-rule-strong);
    padding: var(--space-2);
    font-family: var(--font-serif);
    font-size: 12px;
    font-style: italic;
    line-height: 1.4;
    color: var(--color-text);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 40;
  }

  .tooltip-wrap:hover .tooltip-bubble {
    opacity: 1;
  }
</style>
