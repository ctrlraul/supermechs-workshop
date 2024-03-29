<script lang="ts">

import SvgIcon from '../../../components/SvgIcon/SvgIcon.svelte'
import ControlItemButton from './ItemButton.svelte'
import { dummyItem } from '../../../items/Item';



// Types

import type { Battle, BattleAction } from '../../../battle/Battle'
import type { BattlePlayer } from '../../../battle/BattlePlayer'
import type { BattleItem } from '../../../items/ItemsManager'



// Props

export let battle: Battle | null;
export let player: BattlePlayer | null;
export let setSection: (section: string) => void
export let setFocusedItem: (item: BattleItem | null) => void
export let callBattleAction: (action: Omit<BattleAction, 'actorID'>) => void



// State

$: player = battle ? battle.attacker : null;
$: legs = player ? player.slots.legs! : dummyItem;
$: canMove = 'walk' in legs.stats || 'jump' in legs.stats
$: hasWeapons = player && player.weapons.some(item => item !== null)
$: hasUtils = player && player.utils.some(item => item !== null)



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
  callBattleAction({ name: 'stomp' })
}


function onClickCooldown (): void {
  callBattleAction({ name: 'cooldown' })
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
  item={legs}
  disabled={battle && battle.canFireWeapon(legs)}
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
  background-color: #ffffff30;
}

.disabled {
  filter: brightness(0.5);
  background-color: #00000080;
}

</style>
