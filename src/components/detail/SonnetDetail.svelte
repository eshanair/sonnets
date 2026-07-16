<script lang="ts">
  import { getSonnet } from '../../data/sonnets';
  import { userData, getSonnetUserData } from '../../stores/userData';
  import { navigate } from '../../stores/route';
  import { echoPreview } from '../../stores/selection';
  import type { Endpoint } from '../../lib/types';
  import SonnetHeader from './SonnetHeader.svelte';
  import SonnetTags from './SonnetTags.svelte';
  import Toolbar from './Toolbar.svelte';
  import SonnetText from './SonnetText.svelte';
  import Margin from './Margin.svelte';
  import EchoPopover from './EchoPopover.svelte';

  let { number }: { number: number } = $props();

  let sonnet = $derived(getSonnet(number));
  let voltaLine = $derived(getSonnetUserData($userData, number).voltaLine);

  let prevNumber = $derived(number > 1 ? number - 1 : null);
  let nextNumber = $derived(number < 154 ? number + 1 : null);

  let echoState = $state<{ sourceEndpoint: Endpoint; sourceText: string; anchorRect: DOMRect } | null>(null);
  let bodyEl: HTMLElement | undefined = $state();

  function onEchoSelection(args: {
    lineStart: number;
    lineEnd: number;
    charStart: number;
    charEnd: number;
    text: string;
    rect: DOMRect;
  }) {
    const sourceEndpoint: Endpoint = {
      sonnet: number,
      lineStart: args.lineStart,
      lineEnd: args.lineEnd,
      charStart: args.charStart,
      charEnd: args.charEnd,
    };
    echoState = { sourceEndpoint, sourceText: args.text, anchorRect: args.rect };
    echoPreview.set(sourceEndpoint);
  }

  function closeEcho() {
    echoState = null;
    echoPreview.set(null);
  }
</script>

{#if sonnet}
  {#if prevNumber}
    <button class="nav-arrow prev" onclick={() => navigate({ view: 'sonnet', number: prevNumber })} aria-label="Previous sonnet">
      &#8249;
    </button>
  {/if}
  {#if nextNumber}
    <button class="nav-arrow next" onclick={() => navigate({ view: 'sonnet', number: nextNumber })} aria-label="Next sonnet">
      &#8250;
    </button>
  {/if}

  <div class="sonnet-detail">
    <div class="header-row">
      <div class="title-group">
        <SonnetHeader {number} />
        <SonnetTags {number} />
      </div>
      <Toolbar />
    </div>
    <hr class="hairline" />

    <div class="body" bind:this={bodyEl}>
      <SonnetText {sonnet} {voltaLine} {onEchoSelection} />
      <Margin {sonnet} containerEl={bodyEl} />
    </div>
  </div>

  {#if echoState}
    <EchoPopover
      sourceEndpoint={echoState.sourceEndpoint}
      sourceText={echoState.sourceText}
      anchorRect={echoState.anchorRect}
      onClose={closeEcho}
    />
  {/if}
{/if}

<style>
  .sonnet-detail {
    padding: var(--space-4);
  }

  .header-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding-bottom: var(--space-3);
  }

  .title-group {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }

  .body {
    position: relative;
    min-width: 900px;
    margin-top: var(--space-4);
  }

  .nav-arrow {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    font-size: 56px;
    line-height: 1;
    color: var(--color-rule-strong);
    padding: var(--space-3);
    z-index: 90;
  }

  .nav-arrow:hover {
    color: var(--color-text);
  }

  .nav-arrow.prev {
    left: var(--space-2);
  }

  .nav-arrow.next {
    right: var(--space-2);
  }

  @media (max-width: 860px) {
    .sonnet-detail {
      padding: var(--space-4) var(--space-5);
    }

    .body {
      min-width: 0;
    }

    .nav-arrow {
      font-size: 32px;
      padding: var(--space-1);
    }

    .nav-arrow.prev {
      left: 2px;
    }

    .nav-arrow.next {
      right: 2px;
    }
  }
</style>
