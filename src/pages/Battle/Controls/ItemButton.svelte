<script lang="ts">

import ItemImage from '../../../components/ItemImage.svelte'
import { getStatInstruction } from '../../../stats/StatsManager'



// Types

import type { BattleItem } from '../../../items/ItemsManager'
import type { Battle } from '../../../battle/Battle'



// Props

export let item: BattleItem
export let battle: Battle
export let setFocusedItem: (battleItem: BattleItem | null) => void
export let onUse: () => void = () => {}



// State

const turnIconURL = getStatInstruction('uses').imageURL

$: canUse = canUseItem(item)
$: usesArray = Array(item.stats.uses).fill(null).map((_, i) => item.timesUsed > i)



// Functions

function canUseItem (item: BattleItem): boolean {

  const whyCantFire = battle.whyCantFireWeapon(item)

  switch (whyCantFire.length) {

    case 0:
      return true
    
    case 1:
      return whyCantFire[0] === 'Out of range' && item.type === 'DRONE'
    
    default:
      return false

  }

}


function useItem () {

  if (canUse) {
    onUse()
    return
  }

  const whyCantFire = battle.whyCantFireWeapon(item)

  battle.pushLog(`Can't use ${item.name}: ${whyCantFire.join(', ')}`, 'info')

}


function onMouseOver (): void {
  setFocusedItem(item)
}


function onMouseOut (): void {
  setFocusedItem(null)
}

</script>



<button
  class={canUse ? '' : 'global-disabled'}
  style={$$props.style}
  on:click={useItem}
  on:mouseover={onMouseOver}
  on:focus={onMouseOver}
  on:mouseout={onMouseOut}
  on:blur={onMouseOut}>
  
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
  /* background-color: var(--color-primary-dark); */
  background-color: #ffffff30;
}

.global-disabled {
  background-color: #00000080;
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
