<script lang="ts">
  let {
    anchorRect,
    placement = 'below',
    onClose,
  }: { anchorRect: DOMRect; placement?: 'above' | 'below'; onClose: () => void } = $props();

  const popoverWidth = Math.min(300, window.innerWidth - 32);
  let right = Math.max(16, window.innerWidth - anchorRect.right);
  let top = placement === 'below' ? anchorRect.bottom + 8 : undefined;
  let bottom = placement === 'above' ? window.innerHeight - anchorRect.top + 8 : undefined;

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop" onclick={onClose} role="presentation"></div>

<div
  class="about-popover"
  style:top={top !== undefined ? `${top}px` : undefined}
  style:bottom={bottom !== undefined ? `${bottom}px` : undefined}
  style:right={`${right}px`}
  style:width={`${popoverWidth}px`}
>
  <p class="body">
    Published in 1609, <span class="medieval">Shakespeare</span>'s collection of sonnets covers
    distinctly human themes ranging from love to despair. Despite being written over 400 years ago, 
    his analogies and imagery remain relatable to the reflective, introspective mind.
  </p>
  <p class="body">
    This site is where I've been reading them properly — marking where lines catch, tagging
    themes, and tracing connecting threads. This collection of annotations comes from myself and a
    small handful of people I've let in.
  </p>
  <button class="done" onclick={onClose}>Done</button>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
  }

  .about-popover {
    position: fixed;
    z-index: 121;
    background: #fff;
    border: 1px solid #000;
    padding: var(--space-3);
  }

  .body {
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-text);
  }

  .medieval {
    font-family: 'Canterbury', cursive;
    font-size: 20px;
  }

  .body + .body {
    margin-top: var(--space-2);
  }

  .done {
    display: block;
    margin-top: var(--space-3);
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    color: #000;
  }

  .done:hover {
    color: var(--color-rule-strong);
  }
</style>
