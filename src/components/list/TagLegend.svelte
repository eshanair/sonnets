<script lang="ts">
  import { userData } from '../../stores/userData';
  import TagDot from '../common/TagDot.svelte';
  import NewTagControl from './NewTagControl.svelte';
</script>

<div class="tag-legend">
  <p class="legend-title">Tags</p>
  <ul>
    {#each $userData.tags as tag (tag.name)}
      <li>
        <TagDot color={tag.color} />
        <span>{tag.name}</span>
      </li>
    {/each}
  </ul>
  <NewTagControl />
</div>

<style>
  .tag-legend {
    margin-top: var(--space-4);
  }

  .legend-title {
    font-family: var(--font-sans);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-dim);
    margin-bottom: var(--space-2);
  }

  ul {
    list-style: none;
    margin: 0 0 var(--space-3);
    padding: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 12px;
  }
</style>
