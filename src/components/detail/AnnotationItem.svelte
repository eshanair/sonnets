<script lang="ts">
  import { updateAnnotationText, removeAnnotation } from '../../stores/userData';
  import { isEditingAllowed } from '../../stores/auth';
  import type { Annotation } from '../../lib/types';

  let { sonnetNumber, annotation }: { sonnetNumber: number; annotation: Annotation } = $props();

  let value = $state(annotation.text ?? '');
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  }

  function onInput() {
    updateAnnotationText(sonnetNumber, annotation.id, value);
    autoResize();
  }

  $effect(() => {
    void value;
    autoResize();
  });
</script>

<div class="annotation-item">
  {#if annotation.type === 'label'}
    <p class="label-caption">{annotation.label}</p>
  {/if}
  <div class="text-row">
    <textarea
      bind:this={textareaEl}
      bind:value
      oninput={onInput}
      placeholder="Note…"
      rows="1"
      readonly={!$isEditingAllowed}
    ></textarea>
    {#if $isEditingAllowed}
      <button class="remove" onclick={() => removeAnnotation(sonnetNumber, annotation.id)} aria-label="Remove">
        &times;
      </button>
    {/if}
  </div>
</div>

<style>
  .label-caption {
    font-family: var(--font-sans);
    font-size: 11px;
    font-style: italic;
    color: var(--color-label-underline);
    margin-bottom: 2px;
  }

  .text-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 6px;
  }

  textarea {
    flex: 1;
    min-width: 0;
    resize: none;
    overflow: hidden;
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.5;
    border-bottom: 1px solid var(--color-rule);
    min-height: 1.5em;
  }

  @media (max-width: 860px) {
    textarea {
      white-space: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }

  textarea:focus {
    outline: none;
    border-bottom-color: var(--color-text-dim);
  }

  textarea::placeholder {
    color: var(--color-rule-strong);
  }

  .remove {
    flex: none;
    font-size: 12px;
    color: var(--color-text-dim);
    opacity: 0;
    line-height: 1.5;
  }

  .annotation-item:hover .remove {
    opacity: 1;
  }

  @media (max-width: 860px) {
    .remove {
      flex: none;
      width: 28px;
      height: 28px;
      font-size: 20px;
      line-height: 28px;
      text-align: center;
      opacity: 1;
    }
  }
</style>
