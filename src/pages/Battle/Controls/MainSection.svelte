<script lang="ts">

import SvgIcon from '../../../components/SvgIcon/SvgIcon.svelte'
import ControlItemButton from './ItemButton.svelte'



// Types

import type { Battle, BattleAction } from '../../../battle/Battle'
import type { BattlePlayer } from '../../../battle/BattlePlayer'
import type { BattleItem } from '../../../items/ItemsManager'



// Props

export let battle: Battle
export let player: BattlePlayer
export let setSection: (section: string) => void
export let setFocusedItem: (item: BattleItem | null) => void
export let callBattleAction: (action: BattleAction) => void



// State

$: canMove = 'walk' in player.legs.stats || 'jump' in player.legs.stats
$: hasWeapons = player.weapons.some(item => item !== null)
$: hasUtils = player.utils.some(item => item !== null)



// Functions

function onClickMove (): void {
  if (canMove) {
    setSection('movements')
  }
}


function onClickWeapons (): void {
  if (hasWeapons) {
    setSection('weapons')
  }
}


function onClickUtils (): void {
  if (hasUtils) {
    setSection('utils')
  }
}


function onClickStomp (): void {
  callBattleAction({
    actorID: player.id, 
    name: 'stomp'
  })
}


function onClickCooldown (): void {
  callBattleAction({
    actorID: player.id, 
    name: 'cooldown'
  })
}

</script>


<button class={canMove ? '' : 'disabled'} on:click={onClickMove}>
  <SvgIcon name="arrows_cross" color="var(--color-text)" />
</button>

<button class={hasWeapons ? '' : 'disabled'} on:click={onClickWeapons}>
  <SvgIcon name="aim" color="var(--color-text)" />
</button>

<button class={hasUtils ? '' : 'disabled'} on:click={onClickUtils}>
  <SvgIcon name="utils" color="var(--color-text)" />
</button>

<ControlItemButton
  {battle}
  item={player.legs}
  disabled={battle.canFireWeapon(player.legs)}
  {setFocusedItem}
  onUse={onClickStomp}
/>

<button on:click={onClickCooldown}>
  <SvgIcon name="cooldown" color="var(--color-text)" />
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
}

.disabled {
  filter: brightness(0.5);
}

</style>
