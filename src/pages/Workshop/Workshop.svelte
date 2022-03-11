<script lang="ts">

import EquippedItemSlot from './EquippedItemSlot.svelte'
import { saveMech } from '../../mechs/MechsManager'
import ItemPickingTab from '../../components/ItemPickingTab.svelte'
import StatBlocks from '../../components/StatBlocks.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import { push, location as routerLocation } from "svelte-spa-router"
import { currentMech } from '../../stores'
import { checkSetup } from '../../battle/utils'
import * as LocalStorageHandler from '../../managers/LocalStorageHandler'
import Mech from '../../mechs/Mech'
import SLOTS from './slots'
import tooltip from '../../components/Tooltip/useTooltip'
import MechCanvas from '../../components/MechCanvas.svelte'
import { items2ids } from '../../items/ItemsManager'
import { addPopup } from '../../managers/PopupManager'
import { getURLQuery } from '../../utils/getURLQuery'



// Types

import type Item from '../../items/Item'



// State

let arenaBuffs = LocalStorageHandler.get('settings').arena_buffs
let focusedSlotInfo = null as null | { index: number, type: Item['type'] }

$: mech = $currentMech ? new Mech($currentMech) : null

$: {
  if ($currentMech !== null) {
    updateMechURL()
  }
}



// Functions

function updateMechURL () {

  const query = getURLQuery()

  query.delete('mech')

  if ($currentMech !== null && $currentMech.setup.some(Boolean)) {

    // Remove Non-ASCII characters, very useful to get rid of emojis
    const URLSafeName = $currentMech.name.replace(/[^\x00-\x7F]/g, '')

    const ascii = btoa(JSON.stringify({
      name: URLSafeName || 'Mech Mc.Mecher',
      pack_key: $currentMech.pack_key,
      setup: $currentMech.setup
    }))

    query.set('mech', ascii)

  }

  const string = query.toString()
  let path = '#' + $routerLocation

  if (string) {
    path += '?' + string
  }

  window.history.replaceState({}, '', path)

}



// Events

function onClearSlot (index: number): void {
  $currentMech!.setup[index] = 0
  saveMech($currentMech!)
  updateMechURL()
}


function onClickSlot (index: number, type: Item['type']): void {
  focusedSlotInfo = { index, type }
}


function onSelectItem (itemID: Item['id']): void {

  if (focusedSlotInfo && $currentMech!.setup[focusedSlotInfo.index] !== itemID) {
    $currentMech!.setup[focusedSlotInfo.index] = itemID
    saveMech($currentMech!)
    updateMechURL()
  }

  focusedSlotInfo = null

}


function onClickDismountMech (): void {

  if (mech!.setup.some(Boolean)) {
    addPopup({
      title: 'Dismount Mech',
      message: 'Are you sure?',
      options: {
        Yes () {
          this.remove()
          if ($currentMech) {
            $currentMech.setup = Array(20).fill(0)
            saveMech($currentMech)
            updateMechURL()
          }
        },
        Cancel () { this.remove() },
      }
    })
  }

}


function onClickBattle (): void {

  try {

    checkSetup(mech!.setup)
    push('/lobby')

  } catch (err: any) {

    addPopup({
      title: 'Wait!',
      message: err.message,
      hideOnOffclick: true,
      options: {
        Ok () { this.remove() }
      }
    })

  }

}


function toggleArenaBuffs (): void {

  arenaBuffs = !arenaBuffs
  mech = mech // This is just to trigger an UI update
  
  LocalStorageHandler.set('settings', 
    Object.assign(
      LocalStorageHandler.get('settings'),
      { arena_buffs: arenaBuffs }
    )
  )

}

</script>



<main class={focusedSlotInfo ? 'blur' : ''}>

  <div class="mech-container">
    {#if $currentMech !== null}
      <MechCanvas setup={$currentMech.setup} style="max-width: 70%; max-height: 90%;" />
    {/if}
  </div>

  <div class="slots-container">
    <div class="part-slots">
      {#each SLOTS.parts as slot, i}
        <EquippedItemSlot
          type={slot.type}
          rtl={slot.rtl}
          style="grid-area: {slot.grid}"
          index={i}
          item={mech ? mech.setup[i] : null}
          onClear={onClearSlot}
          onClick={onClickSlot}
        />
      {/each}
    </div>
  
    <div class="util-slots">
      <!-- "i + 9" on index because of the 9 slots that come before -->
      {#each SLOTS.utils as slot, i}
        <EquippedItemSlot
          type={slot.type}
          index={i + 9}
          item={mech ? mech.setup[i + 9] : null}
          onClear={onClearSlot}
          onClick={onClickSlot}
        />
      {/each}
    </div>
  
    <div class="module-slots">
      <!-- "i + 12" on index because of the 12 slots that come before -->
      {#each Array(8) as _, i}
        <EquippedItemSlot
          type="MODULE"
          index={i + 12}
          item={mech ? mech.setup[i + 12] : null}
          onClear={onClearSlot}
          onClick={onClickSlot}
        />
      {/each}
    </div>
  </div>

  <div class="mech-summary">
    <div class="classic-box">
      <StatBlocks source={mech ? items2ids(mech.setup) : []}/>
    </div>
  </div>

  <div class="buttons">

    <!-- <button class="classic-box" on:click={() => router.push('/settings')}>
      <SvgIcon name="cog" color="var(--color-text)" />
    </button> -->

    <button class="classic-box" on:click={toggleArenaBuffs} use:tooltip={'Arena Buffs: ' + (arenaBuffs ? 'ON' : 'OFF')}>
      <SvgIcon name="arena_buffs" color={arenaBuffs ? 'var(--color-success)' : 'var(--color-text-dark)'} />
    </button>

    <button class="classic-box" on:click={() => push('/mechs')} use:tooltip={'Mechs Manager'}>
      <SvgIcon name="mech" color="var(--color-text)" />
    </button>

    <button class="classic-box" on:click={onClickBattle} use:tooltip={'Battle!'}>
      <SvgIcon name="swords" color="var(--color-text)" />
    </button>

    <button class="classic-box" on:click={onClickDismountMech} use:tooltip={'Dismount Mech'}>
      <SvgIcon name="trash" color="var(--color-error)" />
    </button>

  </div>

</main>

{#if mech && focusedSlotInfo}
  <ItemPickingTab
    type={focusedSlotInfo.type}
    currentItem={mech.setup[focusedSlotInfo.index]}
    selectItem={onSelectItem}
  />
{/if}



<style>

main {
  position: relative;
  display: grid;
  grid-template-areas:
    'slots mech'
    'slots summary';
  grid-template-rows: 1fr 8em;
  grid-template-columns: 16em 1fr;
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
}

.slots-container {
  position: relative;
  display: grid;
  grid-template-rows: 16fr 4fr 8fr;
  width: 100%;
  height: 100%;
  grid-area: slots;
}

.part-slots {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-areas:
    'top-1 drone top-2'
    'side-1 torso side-2'
    'side-3 legs side-4';
}

.util-slots {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.module-slots {
  position: relative;
  display: grid;
  grid-template-areas: '. . . .' '. . . .';
  width: 100%;
  height: 100%;
}

.mech-summary {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  grid-area: summary;
}

.mech-summary > .classic-box {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  height: 6em;
  width: 100%;
  max-width: 20em;
  padding: 0 0.6em;
}

.buttons {
  position: absolute;
  display: flex;
  flex-direction: column;
  right: 0;
  top: 0;
  gap: 0.5em;
  grid-area: buttons;
  padding: 0.2em;
}

.buttons > button {
  width: 2.2em;
  height: 2.2em;
  padding: 0.2em;
}

.mech-container {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  grid-area: mech;
}



@media (orientation: portrait) {

  main {
    display: block;
  }

  .slots-container {
    position: absolute;
    display: block;
    bottom: 0;
    left: 0;
    height: 30%;
    background-color: var(--color-front-dark);
  }

  .part-slots {
    position: absolute;
    grid-template-areas:
      'side-1 torso side-2 top-1 drone top-2'
      'side-3 legs side-4 . . .';
    left: 0;
    top: 0;
    height: 75%;
    width: 100%;
  }

  .util-slots {
    position: absolute;
    right: 0;
    top: 37.5%;
    width: 50%;
    height: 37.5%;
  }

  .module-slots {
    position: absolute;
    display: flex;
    left: 0;
    top: 75%;
    width: 100%;
    height: 25%;
  }

  .mech-summary {
    position: absolute;
    left: 0;
    bottom: 30%;
    width: 100%;
    height: 6em;
    background-color: var(--color-front);
  }

  .mech-summary > .classic-box {
    background-color: none;
  }

  .mech-container {
    position: absolute;
    bottom: calc(30% + 6.5em);
  }

}

</style>