<script lang="ts">
  import { navigate } from '../../stores/route';

  let query = $state('');

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate({ view: 'search', query: q });
  }
</script>

<form class="search-box" onsubmit={onSubmit}>
  <input type="text" placeholder="Search sonnets and notes…" bind:value={query} />
</form>

<style>
  .search-box {
    flex: none;
    width: 260px;
  }

  input {
    width: 100%;
    border-bottom: 1px solid var(--color-rule);
    padding: var(--space-1) 0;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  input:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  input::placeholder {
    color: var(--color-text-dim);
  }

  @media (max-width: 640px) {
    .search-box {
      flex: 1 1 auto;
      width: auto;
      min-width: 0;
    }
  }
</style>
