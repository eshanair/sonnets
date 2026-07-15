<script lang="ts">
  import type { StaticSonnet } from '../../lib/types';
  import { navigate } from '../../stores/route';

  let { sonnet, count }: { sonnet: StaticSonnet; count: number } = $props();

  function open() {
    navigate({ view: 'sonnet', number: sonnet.number });
  }
</script>

<div
  class="explored-row"
  onclick={open}
  onkeydown={(e) => e.key === 'Enter' && open()}
  role="button"
  tabindex="0"
>
  <span class="title">
    <span class="number">Sonnet {sonnet.number}</span>
    <span class="first-line">{sonnet.lines[0]}</span>
  </span>
  <span class="count" class:zero={count === 0}>{count}</span>
</div>

<style>
  .explored-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-rule);
    cursor: pointer;
  }

  .title {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
  }

  .number {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--color-text-dim);
    flex: none;
  }

  .explored-row:hover .number {
    font-weight: 700;
    color: var(--color-text);
  }

  .first-line {
    font-family: var(--font-serif);
    font-size: 15px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text-dim);
    flex: none;
    min-width: 1.5em;
    text-align: right;
  }

  .count.zero {
    color: var(--color-rule-strong);
  }
</style>
