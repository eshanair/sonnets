<script lang="ts">
  import { userData } from '../../stores/userData';
  import { activeTagFilter } from '../../stores/filter';
</script>

<select bind:value={$activeTagFilter} class="tag-filter">
  <option value="All">All</option>
  {#each $userData.tags as tag (tag.name)}
    <option value={tag.name}>{tag.name}</option>
  {/each}
</select>

<style>
  .tag-filter {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--color-text);
    background: #fff;
    border: 1px solid #000;
    border-radius: 0;
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
  }

  .tag-filter:focus {
    outline: none;
  }
</style>
