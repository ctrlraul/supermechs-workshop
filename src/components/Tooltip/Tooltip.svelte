<script lang="ts">

import { onDestroy, onMount } from 'svelte'
import { tooltip } from '../../stores'
import ItemInfo from '../ItemInfo.svelte'
import StatBlocks from '../StatBlocks.svelte'



// State

/* Most mobile browsers have the 'window'
 * locked to theleft hand side. So if this
 * isn't zero, likely to be a desktop browser window.
 */
const probablyDesktop = window.screenX === 0 && window.innerWidth > window.innerHeight

/** Distance from tooltip to cursor */
const padding = 16

let element: HTMLElement



// Functions

function updatePosition (e: MouseEvent): void {
  if ($tooltip && element) {

    let x = 0
    let y = 0

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

    element.style.left = x + 'px'
    element.style.top = y + 'px'

  }
}



// Init

onMount(() => window.addEventListener('mousemove', updatePosition))
onDestroy(() => window.removeEventListener('mousemove', updatePosition))


</script>



{#if probablyDesktop && $tooltip !== null}
  
  {#if typeof $tooltip === 'string'}

    <div class="classic-box tooltip" bind:this={element}>
      {@html $tooltip.replace(/\n/g, '<br/>')}
    </div>

  {:else if 'summary' in $tooltip}

    <div class="classic-box tooltip summary" bind:this={element}>
      <StatBlocks source={$tooltip.summary} style="width: 50%" />
    </div>

  {:else}

    <div class="classic-box tooltip" bind:this={element} style="width: 15em">
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
  padding: 0.3em 0.5em;
  z-index: var(--z-index-tooltip);
  background-color: var(--color-background-dark);
  border: 0.2em solid var(--color-background);
}

.summary {
  width: 14em;
  display: flex;
  flex-wrap: wrap;
}

</style>
