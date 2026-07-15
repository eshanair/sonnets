<script lang="ts">
  import sonnetCover from './sonnet_cover.jpg';
</script>

<div class="image-placeholder">
  <img src={sonnetCover} alt="" />
</div>

<style>
  .image-placeholder {
    position: relative;
    z-index: -2;
    width: 100%;
    aspect-ratio: 3 / 4;
    border: 1px solid var(--color-rule);
    overflow: hidden;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
