<script lang="ts">

import { Battle, BattleAction } from '../../battle/Battle'
import type { BattlePlayer } from '../../battle/BattlePlayer'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import type { BattleItem } from '../../items/ItemsManager'
import Mech from '../../mechs/Mech'
import { battle as battleStore } from '../../stores'
import ControlItemButton from './ControlItemButton.svelte'


export let player: BattlePlayer
export let handleBattleEvent: (event: BattleAction) => any
export let blocked: boolean
export let reverse: boolean


$: battle = $battleStore!
$: showControls = battle.attacker.id === player.id && battle.completion === null && battle.actionPoints > 0
$: showTeleporterPositions = (
  section === 'utils'
  && showControls
  && teleporter
  && teleporter.timesUsed < (teleporter.stats.uses || Infinity)
  && (!focusedItem || focusedItem.type === 'TELEPORTER')
)

const utilEventNames: BattleAction['name'][] = ['toggleDrone', 'charge', 'teleport', 'hook']
const canMove = player.legs && (player.legs.stats.walk || player.legs.stats.jump)
const hasWeapons = player.weapons.some(Boolean)
const hasSpecials = player.utils.some(Boolean)
const teleporter = player.items[Mech.TELEPORTER_INDEX]

let section = 'main' as 'main' | 'movements' | 'weapons' | 'utils'
let focusedItem = null as BattleItem | null

</script>



<div class="controls">

  {#if showControls}
    {#if section === 'main'}

      <button
        class={canMove ? '' : 'disabled'}
        on:click={() => canMove && (section = 'movements')}>
        <SvgIcon name="arrows_cross" color="var(--color-text)" />
      </button>

      <button
        class={hasWeapons ? '' : 'disabled'}
        on:click={() => hasWeapons && (section = 'weapons')}>
        <SvgIcon name="aim" color="var(--color-text)" />
      </button>

      <button
        class={hasSpecials ? '' : 'disabled'}
        on:click={() => hasSpecials && (section = 'utils')}>
        <SvgIcon name="utils" color="var(--color-text)" />
      </button>

      {#if player.legs}
        <ControlItemButton
          item={player.legs}
          {battle}
          disabled={battle.canFireWeapon(player.legs)}
          onHoverIn={() => focusedItem = player.legs}
          onHoverOut={() => focusedItem = null}
          onUse={() => handleBattleEvent({ actorID: player.id, name: 'stomp' })}
        />
      {/if}

      <button
        on:click={() => handleBattleEvent({ actorID: player.id, name: 'cooldown' })}>
        <SvgIcon name="cooldown" color="var(--color-text)" />
      </button>



    {:else}

      <button on:click={() => section = 'main'}>
        <SvgIcon name="arrow_back" color="var(--color-text)" />
      </button>


      {#if section === 'weapons'}

        {#each player.weapons as weapon}
          {#if weapon}
            <ControlItemButton
              item={weapon}
              {battle}
              onHoverIn={() => focusedItem = weapon}
              onHoverOut={() => focusedItem = null}
              onUse={() => handleBattleEvent({ actorID: player.id, name: 'useWeapon', itemIndex: weapon.index })}
            />
          {/if}
        {/each}

      {:else if section === 'utils'}

        {#each player.utils as util, i}
          {#if util}
            <ControlItemButton
              item={util}
              {battle}
              onHoverIn={() => focusedItem = util}
              onHoverOut={() => focusedItem = null}
              onUse={() => {
                if (util.type !== 'TELEPORTER') {
                  handleBattleEvent({ actorID: player.id, name: utilEventNames[i] })
                }
              }}
            />
          {/if}
            
        {/each}

      {/if}

    {/if}
  
  {:else}

    <div class="opponents-turn">Opponent's turn...</div>

  {/if}


  {#if section === 'movements'}
    <div class="position-highlights walk" style="transform: scaleX({reverse ? -1 : 1})">
      {#each battle.getWalkablePositions() as position}

        <div
          style="left: {5 + position / Battle.MAX_POSITION_INDEX * 90 - 3}%;"
          on:click={() => handleBattleEvent({
            actorID: player.id,
            name: 'walk',
            position,
          })}
        ></div>
        
      {/each}
    </div>
  {/if}


  {#if showTeleporterPositions}
    <div class="position-highlights teleport" style="transform: scaleX({reverse ? -1 : 1})">
      {#each battle.getTeleportablePositions() as position}

        <div
          style="left: {5 + position / Battle.MAX_POSITION_INDEX * 90 - 3}%;"
          on:click={() => handleBattleEvent({
            actorID: player.id,
            name: 'teleport',
            position,
          })}
        ></div>

      {/each}
    </div>
  {/if}


  {#if focusedItem && focusedItem.stats.range}
    <div class="position-highlights range" style="transform: scaleX({reverse ? -1 : 1})">
      {#each battle.getItemRange(focusedItem) as position}
        <div style="left: {5 + position / Battle.MAX_POSITION_INDEX * 90 - 3}%;"></div>
      {/each}
    </div>
  {/if}


  <div class="arena-spots">
    <!-- +1 because it's an index, not the max position itself -->
    {#each Array(Battle.MAX_POSITION_INDEX + 1) as _, position}
      <div style="left: {5 + position / Battle.MAX_POSITION_INDEX * 90 - 3}%;"></div>
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
  background-color: var(--color-primary-dark);
}


.controls > button.disabled {
  filter: brightness(0.5);
}


.controls > .opponents-turn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 4em;
}


.position-highlights.walk {
  --highlights-color: #00ff00;
}

.position-highlights.teleport {
  --highlights-color: #3dc8c8;
}

.position-highlights.range {
  --highlights-color: #ff0000;
}

.position-highlights,
.arena-spots {
  position: absolute;
  left: 0;
  top: -0.4em;
  width: 100%;
  height: 0.2em;
}

.position-highlights {
  top: -0.75em;
}

.position-highlights > div {
  position: absolute;
  bottom: 0;
  width: 6%;
  height: 3em;
  background: linear-gradient(#ffffff00, var(--highlights-color));
}

.arena-spots > div {
  position: absolute;
  height: 100%;
  width: 6%;
  background-color: #96bcff80;
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