<script lang="ts">

import SvgIcon from '../../../components/SvgIcon/SvgIcon.svelte'
import ItemButton from './ItemButton.svelte'
import MainSection from './MainSection.svelte'
import { Battle, BattleAction } from '../../../battle/Battle'
import { battle as battleStore } from '../../../stores'
import { userData } from '../../../stores/userData'



// Types

import type { BattleItem } from '../../../items/ItemsManager'
import type { BattlePlayer } from '../../../battle/BattlePlayer'



// Props

export let player: BattlePlayer
export let callBattleAction: (event: Omit<BattleAction, 'actorID'>) => any
export let blocked: boolean
export let reverse: boolean



// State

let section: 'main' | 'movements' | 'weapons' | 'utils' = 'main'
let focusedItem: BattleItem | null = null
let teleporting = false

$: battle = $battleStore!
$: spotlights = getSpotlights(teleporting, focusedItem, section, player)
$: showControls = (

  // Battle is not complete
  battle.completion === null

  // Has turns left
  && battle.actionPoints > 0

  // Is player's turn or (battle is offline and player can control both mechs)
  && (
    battle.attacker.id === player.id ||
    (!battle.online && $userData.settings.controlOfflineOpponent)
  )

)
$: backgroundColor = (
  $userData.settings.controlOfflineOpponent && !battle.online
  ? (
    battle.attacker.id === player.id
    ? '#13340c'
    : '#4a0c0c'
  )
  : ''
)


// Functions

function getSpotlights (isTeleporting: boolean, itemHovered: BattleItem | null, sec: typeof section, player: BattlePlayer) {

  let positions: number[] = []
  let color = '#ffffff'
  let onClick: (position: number) => void = () => {}

  if (sec === 'movements') {

    positions = battle.getWalkablePositions()
    color = '#00cc00'
    onClick = position => callBattleAction({
      name: 'walk',
      position
    })

  } else if (itemHovered && 'range' in itemHovered.stats) {

    positions = battle.getPositionsInItemRange(player, itemHovered)
    color = '#cc0000'

  } else if (isTeleporting || (itemHovered && itemHovered.type === 'TELEPORTER')) {

    positions = battle.getTeleportablePositions()
    color = '#3dc8c8'
    onClick = position => callBattleAction({
      name: 'teleport',
      position
    })

  }

  return { positions, color, onClick }

}


function setFocusedItem (item: BattleItem | null): void {
  focusedItem = item
}


function setSection (newSection: string): void {
  teleporting = false
  section = newSection as typeof section
}


function getPositionVisualPercent (position: number): number {
  return 5 + position / Battle.MAX_POSITION_INDEX * 90 - 3
}


function useUtil (type: BattleItem['type']): void {

  let actionName: BattleAction['name'] | null = null

  switch (type) {
    
    case 'DRONE':
      actionName = 'toggleDrone'
      break
    
    case 'CHARGE_ENGINE':
      actionName = 'charge'
      break
    
    case 'TELEPORTER':
      teleporting = !teleporting
      return
    
    case 'GRAPPLING_HOOK':
      actionName = 'hook'
      break

  }

  if (actionName === null) {
    throw new Error(`Item type "${type}" is not an util type`)
  }

  callBattleAction({
    name: actionName
  })

}


function getButtonConfigsForSection (sec: typeof section, player: BattlePlayer) {

  interface Config {
    item: BattleItem
    onUse: () => void
  }

  let configs: Config[] = []

  switch (sec) {
    
    case 'weapons':
      configs = player.weapons.map(item => {
        return {
          item,
          onUse: () => callBattleAction({
            name:'useWeapon',
            slotName: item.slotName,
          }),
        };
      });
      break;

    case 'utils':
      configs = player.utils.map(item => {
        return {
          item,
          onUse: () => useUtil(item.type),
        };
      });
      break;

  }

  return configs

}

</script>



<div class="controls" style="background-color: {backgroundColor};">

  {#if showControls}
    {#if section === 'main'}

      <MainSection
        {battle}
        player={battle.attacker}
        {callBattleAction}
        {setFocusedItem}
        {setSection}
      />

    {:else}

      <button on:click={() => setSection('main')}>
        <SvgIcon name="arrow_back" color="var(--color-text)" />
      </button>

      {#each getButtonConfigsForSection(section, battle.attacker) as { item, onUse }}
        <ItemButton {battle} {item} {setFocusedItem} {onUse} />
      {/each}

    {/if}

  {:else}
    <div class="opponents-turn">Opponent's turn...</div>
  {/if}


  <div
    class="spotlights {reverse ? 'reverse' : ''}"
    style="--light-color: {spotlights.color};"
  >
    {#each spotlights.positions as position}
      <div
        on:click={() => spotlights.onClick(position)}
        style="left: {getPositionVisualPercent(position)}%;"
      />
    {/each}
  </div>


  <div class="arena-spots">
    <!-- +1 because it's an index, not the max position itself -->
    {#each Array(Battle.MAX_POSITION_INDEX + 1) as _, position}
      <div style="left: {getPositionVisualPercent(position)}%;"></div>
    {/each}
  </div>


  {#if blocked}
    <div class="block-clicks">Please wait...</div>
  {/if}
  

</div>



<style>

.controls {
  position: relative;
  display: flex;
  width: 100%;
  padding: 0.5em;
  gap: 0.5em;
  background-color: var(--color-primary);
  transition: background-color 200ms;
}


.controls > button {
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


.controls > .opponents-turn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 4em;
}


.spotlights,
.arena-spots {
  position: absolute;
  left: 0;
  top: -0.4em;
  width: 100%;
  height: 0.2em;
}

.spotlights {
  top: -0.2em;
}

.spotlights.reverse {
  transform: scaleX(-1);
}

.spotlights > div {
  position: absolute;
  bottom: 0;
  width: 6%;
  height: 3em;
  background-image: linear-gradient(#ffffff00, var(--light-color));
}

.arena-spots > div {
  position: absolute;
  height: 0.4em;
  width: 6%;
  background-color: #000000;
  border-radius: 1em 1em 0 0;
}


.block-clicks {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #000000a0;
}

</style>