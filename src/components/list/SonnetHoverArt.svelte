<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { sonnetSketch, type SonnetSketchInstance } from '../../lib/sonnetSketch';

  let { lines, visible }: { lines: string[]; visible: boolean } = $props();

  // Same ~20%-off-the-edge bleed at any size — just a much smaller canvas on
  // narrow screens so it doesn't overwhelm the page or need to be scrolled to.
  let size = $state(1100);

  let container: HTMLDivElement;
  let instance: SonnetSketchInstance | undefined;
  let ready = $state(false);

  onMount(async () => {
    const mobile = window.innerWidth < 640;
    size = mobile ? 480 : 1100;
    // A smaller canvas needs a proportionally bigger font multiplier to stay
    // legible — otherwise the mobile text ends up tiny on top of being smaller.
    const fontScale = mobile ? 0.09 : 0.06;
    const { default: P5 } = await import('p5');
    instance = new P5(sonnetSketch(size, lines, fontScale), container) as unknown as SonnetSketchInstance;
    instance.noLoop();
    ready = true;
  });

  onDestroy(() => {
    instance?.remove();
  });

  $effect(() => {
    if (!ready || !instance) return;
    if (visible) {
      if (lines.length > 0) instance.setText(lines);
      instance.loop();
    } else {
      instance.noLoop();
    }
  });
</script>

<div
  class="hover-art"
  class:visible
  bind:this={container}
  style:width={`${size}px`}
  style:height={`${size}px`}
  style:right={`${-size * 0.2}px`}
  aria-hidden="true"
></div>

<style>
  .hover-art {
    position: fixed;
    top: 50%;
    transform: translateY(-50%) skewX(-10deg);
    pointer-events: none;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .hover-art.visible {
    opacity: 1;
  }
</style>
