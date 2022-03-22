<script lang="ts">

import ItemImage from '../../components/ItemImage.svelte'
import { getStatInstruction } from '../../stats/StatsManager'


import type { BattleItem } from '../../items/ItemsManager'
import type { Battle } from '../../battle/Battle'


export let item: BattleItem
export let battle: Battle
export let onHoverIn: () => void = () => {}
export let onHoverOut: () => void = () => {}
export let onUse: () => void = () => {}


$: whyCantFire = battle.whyCantFireWeapon(item)
$: canUse = (whyCantFire.length === 1 && item.type === 'DRONE' && whyCantFire[0] === 'Out of range') || whyCantFire.length === 0
$: usesArray = Array(item.stats.uses).fill(null).map((_, i) => item.timesUsed > i)


const turnIconURL = getStatInstruction('uses').imageURL


function useItem () {
  if (canUse) {
    onUse()
  } else {
    battle.pushLog(`Can't use ${item.name}: ${whyCantFire.join(', ')}`, 'info')
  }
}

</script>



<button
  class={canUse ? '' : 'global-disabled'}
  style={$$props.style}
  on:click={useItem}
  on:mouseover={onHoverIn}
  on:focus={onHoverIn}
  on:mouseout={onHoverOut}
  on:blur={onHoverOut}>
  
  {#if item}

    <ItemImage item={item} style="width: 100%; height: 100%;" />

    {#if typeof item.stats.uses === 'number'}
      <div class="uses">
        {#each usesArray as used}
          <img src={turnIconURL} alt="X" class={used ? 'dark' : ''}>
        {/each}
      </div>
    {/if}

  {/if}

</button>



<style>

button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4em;
  height: 4em;
  padding: 0.4em;
  border-radius: var(--ui-radius);
  background-color: var(--color-primary-dark);
}

.uses {
  position: absolute;
  display: flex;
  justify-content: flex-end;
  gap: 3%;
  top: 4%;
  right: 5%;
  width: 100%;
  height: 0.8em;
}

img.dark {
  filter: brightness(0.25);
  -webkit-filter: brightness(0.25);
}

</style>
