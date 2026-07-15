<script lang="ts">
  let { color, title = '' }: { color: string; title?: string } = $props();
</script>

<span class="tag-dot" style:background-color={color} {title}></span>

<style>
  .tag-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
  }
</style>
