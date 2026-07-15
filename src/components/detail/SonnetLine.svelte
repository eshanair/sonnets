<script lang="ts">
  import type { Segment } from '../../lib/types';

  let { lineIndex, segments, indent = false }: { lineIndex: number; segments: Segment[]; indent?: boolean } = $props();
</script>

<div class="line" class:indent data-line-index={lineIndex} style:grid-row={lineIndex + 1}>{#each segments as seg, i (i)}<span
      class="seg"
      class:note={seg.note}
      class:echo={seg.echo}
      class:labeled={seg.labels.length > 0}
      style={seg.noteColor ? `--seg-note-color: ${seg.noteColor}` : undefined}
      data-annotation-ids={seg.annotationIds.join(' ')}>{seg.text}</span>{/each}</div>

<style>
  .line {
    grid-column: 1;
    font-family: var(--font-serif);
    font-size: 17px;
    line-height: var(--line-height-poem);
    color: var(--color-text);
    white-space: pre-wrap;
    /* Fills the full grid row height (default grid-item stretch) instead of
       shrink-wrapping+centering around the text — a centered, content-height
       box left dead space above/below each line where taps would silently
       miss on mobile, since the row is much taller than the text itself. */
  }

  .line.indent {
    margin-left: 2em;
  }

  @media (max-width: 860px) {
    .line {
      font-size: 15px;
    }

    .line.indent {
      margin-left: 1.2em;
    }
  }

  @media (max-width: 480px) {
    .line {
      font-size: 12px;
    }

    .line.indent {
      margin-left: 0.9em;
    }
  }

  .seg.note {
    --seg-note-wash: color-mix(in srgb, var(--seg-note-color, var(--color-highlight-note)) 30%, transparent);
    background-image: linear-gradient(var(--seg-note-wash), var(--seg-note-wash));
    box-shadow: inset 0 -2px 0 0 var(--seg-note-color, var(--color-highlight-note));
  }

  .seg.echo {
    background-image: linear-gradient(var(--color-highlight-echo-wash), var(--color-highlight-echo-wash));
    box-shadow: inset 0 -2px 0 0 var(--color-highlight-echo);
  }

  .seg.note.echo {
    background-image: linear-gradient(var(--seg-note-wash), var(--seg-note-wash));
    box-shadow: inset 0 -2px 0 0 var(--color-highlight-echo);
  }

  .seg.labeled {
    text-decoration: underline;
    text-decoration-color: var(--color-label-underline);
    text-decoration-style: dotted;
    text-underline-offset: 3px;
  }
</style>
