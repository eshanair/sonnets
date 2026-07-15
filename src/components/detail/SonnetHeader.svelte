<script lang="ts">
  let { number }: { number: number } = $props();
</script>

<h1 class="sonnet-header">Sonnet {number}</h1>

<style>
  .sonnet-header {
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }
</style>
