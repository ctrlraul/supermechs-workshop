<script lang="ts">

import { onDestroy, onMount } from 'svelte'
import { tooltip } from '../../stores'
import ItemInfo from '../ItemInfo.svelte'
import StatBlocks from '../StatBlocks.svelte'



// State

/* Most mobile browsers have the 'window'
 * locked to theleft hand side. So if this
 * isn't zero, likely to be a desktop browser window. */
const probablyDesktop = window.screenX === 0 && window.innerWidth > window.innerHeight

/** Distance from tooltip to cursor */
const padding = 16

let element: HTMLElement
let x = 0
let y = 0



// Functions

function updatePosition (e: MouseEvent): void {
  if ($tooltip && element) {

    if (e.clientX > window.innerWidth * 0.5) {
      x = e.clientX - padding - element.offsetWidth
    } else {
      x = e.clientX + padding
    }

    if (e.clientY > window.innerHeight * 0.5) {
      y = e.clientY - padding - element.offsetHeight
    } else {
      y = e.clientY + padding
    }

  }
}



// Init

onMount(() => window.addEventListener('mousemove', updatePosition))
onDestroy(() => window.removeEventListener('mousemove', updatePosition))

</script>



{#if probablyDesktop && $tooltip !== null}
  
  {#if typeof $tooltip === 'string'}

    <div
      class="global-box tooltip text no-select"
      style="left: {x}px; top: {y}px; line-height: 1.2em;"
      bind:this={element}
    >
      {@html $tooltip.replace(/\n/g, '<br/>')}
    </div>

  {:else if 'summary' in $tooltip}

    <div
      class="global-box tooltip summary no-select"
      style="left: {x}px; top: {y}px;"
      bind:this={element}
    >
      <StatBlocks source={$tooltip.summary} style="width: 50%" />
    </div>

  {:else}

    <div
      class="global-box tooltip no-select"
      style="left: {x}px; top: {y}px; width: 15em;"
      bind:this={element}
    >
      <ItemInfo item={$tooltip} style="background-color: unset; box-shadow: unset;" />
    </div>

  {/if}

{/if}



<style>

.tooltip {
  position: fixed;
  top: 0;
  left: 0;
  display: block;
  z-index: var(--z-index-tooltip);
  border: 0.15em solid var(--color-secondary);
  box-shadow: 0 0 1em 0.5em #000000;
}

.text {
  padding: 0.25em;
}

.summary {
  width: 14em;
  display: flex;
  flex-wrap: wrap;
}

</style>
